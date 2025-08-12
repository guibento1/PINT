// web\frontend\frontOffice\src\App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import LayoutFront from "./components/LayoutFront";
import Profile from "@shared/views/Profile.jsx";

import Index from "./views/Index";
import RegisterPage from "./views/RegisterPage";
import LoginPage from "@shared/views/LoginPage.jsx";
import ResetPassword from "./views/ResetPassword";
import Cursos from "./views/Cursos";
import Curso from "./views/Curso";
import Home from "./views/Home";
import NaoAutorizado from "./views/NaoAutorizado";
import ProtectedRoute from "@shared/components/ProtectedRoute.jsx";
import NotificationsPage from "@shared/views/NotificationsPage.jsx";
import firebaseConfig from "../../shared/config/firebase.js";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

function pedirPermissaoENotificar() {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      messaging.getToken().then((currentToken) => {
        if (currentToken) {
          // Guarda o token no backend ou localStorage
          console.log("Token:", currentToken);
        }
      });
    }
  });
}

function App() {
  useEffect(() => {
    // Listener para notificações push
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "novaNotificacao") {
          window.dispatchEvent(new Event("novaNotificacao"));
        }
      });
    }

    // Listener para login bem-sucedido
    const handleLoginSucesso = async () => {
      // Inicializa Firebase e subscreve aos canais
      // (importa config se necessário)
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      if (!user || !token) return;

      // Pede permissão para notificações
      if (Notification.permission !== "granted") {
        await Notification.requestPermission();
      }

      // Obtem token do FCM
      messaging.getToken().then((currentToken) => {
        if (currentToken) {
          // Guarda ou envia para backend se necessário
          console.log("Token FCM:", currentToken);
        }
      });

      // Subscreve aos canais do utilizador
      try {
        const api = await import("@shared/services/axios.js");
        const response = await api.default.get(
          `/notificacao/list/subscricoes/${user.id}`
        );
        // Se usares FCM topic subscription, aqui subscreve
        // response.data.forEach(canal => {
        //   messaging.subscribeToTopic('cana_' + canal);
        // });
      } catch (err) {
        console.error("Erro ao subscrever canais:", err);
      }
    };

    window.addEventListener("loginSucesso", handleLoginSucesso);
    return () => window.removeEventListener("loginSucesso", handleLoginSucesso);
  }, []);

  return (
    <Router>
      <LayoutFront>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registar" element={<RegisterPage />} />
          <Route path="/resetpassword" element={<ResetPassword />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={["formando", "formador"]}>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cursos"
            element={
              <ProtectedRoute allowedRoles={["formando", "formador"]}>
                <Cursos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/curso/:id"
            element={
              <ProtectedRoute allowedRoles={["formando", "formador"]}>
                <Curso />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["formando", "formador"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/nao-autorizado" element={<NaoAutorizado />} />

          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute allowedRoles={["formando", "formador"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </LayoutFront>
    </Router>
  );
}

export default App;
