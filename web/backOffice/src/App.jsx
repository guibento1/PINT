//web\frontend\backOffice\src\App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import LayoutBack from "./components/LayoutBack";
import ProtectedRoute from "@shared/components/ProtectedRoute";
import LoginPage from "@shared/views/LoginPage.jsx";
import Profile from "@shared/views/Profile.jsx";

import NaoAutorizado from "./views/NaoAutorizado";
import Home from "./views/Home";
import GerirEstrutura from "./views/GerirEstrutura";
import GerirNotificacoesDenuncias from "./views/GerirNotificacoesDenuncias.jsx";
import Cursos from "./views/Cursos";
import DetalhesCurso from "./views/DetalhesCurso";
import Utilizadores from "./views/Utilizadores";
import EditarUtilizador from "./views/editar/EditarUtilizador.jsx";
import CriarEstrutura from "./views/criar/CriarEstrutura";
import CriarCursoAssincrono from "./views/criar/CriarCursoAssincrono.jsx";
import CriarCursoSincrono from "./views/criar/CriarCursoSincrono.jsx";
import EditarArea from "./views/editar/EditarArea";
import EditarCategoria from "./views/editar/EditarCategoria";
import EditarTopico from "./views/editar/EditarTopico";
import EditarCursoAssincrono from "./views/editar/EditarCursoAssincrono";
import EditarCursoSincrono from "./views/editar/EditarCursoSincrono";
import NotificationsPage from "@shared/views/NotificationsPage.jsx";
import firebaseConfig from "../../shared/config/firebase.js";
import api from "@shared/services/axios.js";

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
      <LayoutBack>
        <Routes>
          <Route path="/" element={<LoginPage admin={true} />} />
          <Route path="/nao-autorizado" element={<NaoAutorizado />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gerir-estrutura"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <GerirEstrutura />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gerir-notificacoes-e-denuncias"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <GerirNotificacoesDenuncias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/criar/estrutura"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CriarEstrutura />
              </ProtectedRoute>
            }
          />
          <Route
            path="/criar/curso"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CriarCursoAssincrono />
              </ProtectedRoute>
            }
          />
          <Route
            path="/criar/curso-sincrono"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CriarCursoSincrono />
              </ProtectedRoute>
            }
          />

          <Route
            path="/editar/categoria/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditarCategoria />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar/area/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditarArea />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar/topico/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditarTopico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar/curso/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditarCursoRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar/curso-assincrono/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditarCursoAssincrono />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar/curso-sincrono/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditarCursoSincrono />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cursos"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Cursos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/curso/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DetalhesCurso />
              </ProtectedRoute>
            }
          />

          <Route
            path="/utilizadores"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Utilizadores />
              </ProtectedRoute>
            }
          />

          <Route
            path="/editar/utilizador/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditarUtilizador />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </LayoutBack>
    </Router>
  );
}

function EditarCursoRouter() {
  const { id } = useParams();
  const navigate = useNavigate();
  React.useEffect(() => {
    const go = async () => {
      try {
        const res = await api.get(`/curso/${id}`);
        const c = res.data[0] || res.data;
        if (c?.sincrono === true) {
          navigate(`/editar/curso-sincrono/${id}`, { replace: true });
        } else {
          navigate(`/editar/curso-assincrono/${id}`, { replace: true });
        }
      } catch (e) {
        console.error("Falha a detetar tipo de curso:", e);
      }
    };
    go();
  }, [id, navigate]);
  return null;
}

export default App;
