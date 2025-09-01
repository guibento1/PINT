// web\frontend\frontOffice\src\App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LayoutFront from "./components/LayoutFront";
import Profile from "@shared/views/Profile.jsx";
import { SidebarProvider } from "./context/SidebarContext";

import Index from "./views/Index";
import RegisterPage from "./views/RegisterPage";
import LoginPage from "@shared/views/LoginPage.jsx";
import ResetPassword from "./views/ResetPassword";
import Cursos from "./views/Cursos";
import CursoAssincrono from "./views/CursoAssincrono";
import CursoSincrono from "./views/CursoSincrono";
import EditarCursoSincrono from "./views/Editar/EditarCursoSincrono";
import AvaliacoesSincrono from "./views/Editar/AvaliacoesSincrono";
import Agendar from "./views/Criar/Agendar";
import Forums from "./views/Forums";
import Home from "./views/Home";
import NaoAutorizado from "./views/NaoAutorizado";
import ProtectedRoute from "@shared/components/ProtectedRoute.jsx";
import NotificationsPage from "@shared/views/NotificationsPage.jsx";
import CriarPost from "./views/CriarPost";
import VerPost from "./views/VerPost";

function App() {
  return (
    <Router>
      <SidebarProvider>
        <LayoutFront>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registar" element={<RegisterPage />} />
            <Route path="/resetpassword" element={<ResetPassword />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cursos"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <Cursos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curso/:id"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <CursoAssincrono />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curso-sincrono/:id"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <CursoSincrono />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curso-sincrono/:id/avaliacoes"
              element={
                <ProtectedRoute allowedRoles={["formador"]}>
                  <AvaliacoesSincrono />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editar/curso-sincrono/:id"
              element={
                <ProtectedRoute allowedRoles={["formador"]}>
                  <EditarCursoSincrono />
                </ProtectedRoute>
              }
            />
            <Route
              path="/curso-sincrono/:id/agendar"
              element={
                <ProtectedRoute allowedRoles={["formador"]}>
                  <Agendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/nao-autorizado" element={<NaoAutorizado />} />

            <Route
              path="/notificacoes"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forums"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <Forums />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criar-post"
              element={
                <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                  <CriarPost />
                </ProtectedRoute>
              }
            />
            <Route path="/forum/post/:id" element={
              <ProtectedRoute allowedRoles={["formando", "formador", "admin"]}>
                <VerPost />
              </ProtectedRoute>
            } />
          </Routes>
        </LayoutFront>
      </SidebarProvider>
    </Router>
  );
}

export default App;
