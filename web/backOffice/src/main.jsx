// web/frontend/backOffice/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { messaging, onMessage, subscribeToTopics } from "@shared/services/firebase";
import App from "./App.jsx";
import "../../shared/styles/global.css";

// Listener FCM foreground (dispara evento para a NavbarBack acender a bolinha)
onMessage(messaging, (payload) => {
  console.log("[BackOffice] Foreground message received:", payload);
  window.dispatchEvent(new Event("novaNotificacao"));
});

// Capturar token/user via query params (SSO)
try {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get("token");
  const userParam = urlParams.get("user");

  if (tokenParam) {
    sessionStorage.setItem("token", tokenParam);
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
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
      console.warn("[BackOffice] Falha a decodificar user param:", e);
    }
  }
} catch (e) {
  console.warn("[BackOffice] Falha a processar query params:", e);
}

// Subscribe aos tópicos após login (evento disparado no fluxo de autenticação)
window.addEventListener("loginSucesso", () => {
  subscribeToTopics();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Registo do Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then(async (registration) => {
      console.log("[BackOffice] Service Worker registered:", registration);
      if (sessionStorage.getItem("token") && sessionStorage.getItem("user")) {
        await subscribeToTopics();
      }
    })
    .catch((error) => {
      console.error("[BackOffice] Service Worker registration failed:", error);
    });
}
