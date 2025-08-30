//web\frontend\frontOffice\src\main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  messaging,
  onMessage,
  subscribeToTopics,
} from "@shared/services/firebase";
import App from "./App.jsx";
import "@shared/styles/file-upload.css";
import "../../shared/styles/global.css";

// Listener FCM foreground
onMessage(messaging, (payload) => {
  console.log("[FrontOffice] Foreground message received:", payload);
  // Propagar evento para páginas que possam querer atualizar
  window.dispatchEvent(new Event("novaNotificacao"));
});

// Capturar token/user via query params (SSO ou redirecionamento externo)
try {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get("token");
  const userParam = urlParams.get("user");
  const pathLower = window.location.pathname.toLowerCase();
  const isResetPassword = pathLower.includes("/resetpassword");
  if (tokenParam) {
    // Se estivermos na página de reset de password, guardar separadamente e NÃO limpar a query
    if (isResetPassword) {
      sessionStorage.setItem("reset_password_token", tokenParam);
    } else {
      sessionStorage.setItem("token", tokenParam);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
  if (userParam) {
    try {
      const decoded = JSON.parse(decodeURIComponent(userParam));
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          id: decoded.idutilizador || decoded.id,
          email: decoded.email,
          nome: decoded.nome,
          roles: decoded.roles,
        })
      );
    } catch (e) {
      console.warn("Falha a decodificar user param:", e);
    }
  }
} catch (e) {
  console.warn("Falha a processar query params frontOffice:", e);
}

// Após loginSucesso (evento disparado em LoginPage) garantir subscribe aos tópicos
window.addEventListener("loginSucesso", () => {
  subscribeToTopics();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then(async (registration) => {
      console.log("[FrontOffice] Service Worker registered:", registration);
      // Tentar subscrever imediatamente se já autenticado
      if (sessionStorage.getItem("token") && sessionStorage.getItem("user")) {
        await subscribeToTopics();
      }
    })
    .catch((error) => {
      console.error("[FrontOffice] Service Worker registration failed:", error);
    });
}
