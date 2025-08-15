// web\frontend\frontOffice\src\App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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

function App() {

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
