// web\frontend\frontOffice\src\components\NavbarFront.jsx
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import logoSoftinsa from "../../../shared/assets/images/softinsaLogo.svg";
import logoSoftskills from "../../../shared/assets/images/thesoftskillsLogo.svg";

import Home from "@shared/assets/images/home.svg?react";
import Search from "@shared/assets/images/search.svg?react";
import Forum from "@shared/assets/images/forum.svg?react";
import Notifications from "@shared/assets/images/notification.svg?react";
import Profile from "@shared/assets/images/profile.svg?react";
import Leave from "@shared/assets/images/leave.svg?react";


import useUserRole from "../../../shared/hooks/useUserRole";

export default function NavbarFront() {
  const location = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { isFormador, loading } = useUserRole();

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const nomeUsuario = user?.nome || "Utilizador";

  if (loading) {
    return <div className="text-center mt-4">A carregar...</div>;
  }

  const notificacoesAtivas = true;

  const toggleMenu = () => setMenuAberto(!menuAberto);
  const fecharMenu = () => setMenuAberto(false);

  const handleLogout = () => {
    sessionStorage.clear();
    fecharMenu();
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div
        className="container-fluid d-flex align-items-center"
        style={{ minHeight: "70px" }}
      >
        {/* Esquerda: Logo Softinsa */}
        <div
          className="d-flex align-items-center justify-content-start"
          style={{ minWidth: "180px", paddingLeft: "24px" }}
        >
          <Link to="/">
            <img src={logoSoftinsa} alt="Softinsa" style={{ height: "25px" }} />
          </Link>
        </div>

        {/* Centro: Logo SoftSkills */}
        <div
          className="d-flex align-items-center justify-content-start"
          style={{ flex: "1 1 0%" }}
        >
          <img
            src={logoSoftskills}
            alt="SoftSkills"
            style={{ height: "65px" }}
          />
        </div>

        {/* Direita: Menu */}
        <div
          className="d-flex align-items-center justify-content-end"
          style={{ width: "180px", paddingRight: "24px" }}
        >
          {/* Botão do menu (hambúrguer) */}
          <button
            className="navbar-toggler ms-2"
            type="button"
            onClick={toggleMenu}
          >
            {menuAberto ? (
              <i className="ri-close-line"></i>
            ) : (
              <i className="ri-menu-line"></i>
            )}
          </button>

          {/* Conteúdo da navbar */}
          <div
            className={`collapse navbar-collapse justify-content-end ${
              menuAberto ? "show" : ""
            }`}
            id="navbarFrontContent"
          >
            <div className="navbar-right">
              <ul className="animated-navbar">
                <li
                  style={{
                    "--i": "#56CCF2",
                    "--j": "#2F80ED",
                    border: "2px solid #000",
                  }}
                >
                  <span className="icon">
                    <Home
                      className="icon-svg"
                      style={{ width: "1.75em", height: "1.75em" }}
                    />
                  </span>
                  <span className="title">Home</span>
                </li>
                <li
                  style={{
                    "--i": "#56CCF2",
                    "--j": "#2F80ED",
                    border: "2px solid #000",
                  }}
                >
                  <span className="icon">
                    <Search
                      className="icon-svg"
                      style={{ width: "1.75em", height: "1.75em" }}
                    />
                  </span>
                  <span className="title">Cursos</span>
                </li>
                <li
                  style={{
                    "--i": "#56CCF2",
                    "--j": "#2F80ED",
                    border: "2px solid #000",
                  }}
                >
                  <span className="icon">
                    <Forum
                      className="icon-svg"
                      style={{ width: "1.75em", height: "1.75em" }}
                    />
                  </span>
                  <span className="title">Fóruns</span>
                </li>
                <li
                  style={{
                    "--i": "#56CCF2",
                    "--j": "#2F80ED",
                    border: "2px solid #000",
                  }}
                >
                  <span className="icon">
                    <Notifications
                      className="icon-svg"
                      style={{ width: "1.75em", height: "1.75em" }}
                    />
                  </span>
                  <span className="title">Notificações</span>
                </li>
                <li
                  style={{
                    "--i": "#56CCF2",
                    "--j": "#2F80ED",
                    border: "2px solid #000",
                  }}
                >
                  <span className="icon">
                    <Profile
                      className="icon-svg"
                      style={{ width: "1.75em", height: "1.75em" }}
                    />
                  </span>
                  <span className="title">Perfil</span>
                </li>
                <li
                  style={{
                    "--i": "#e44c38ff",
                    "--j": "#fa3a00ff",
                    border: "2px solid red",
                  }}
                >
                  <span className="icon">
                    <Leave
                      className="icon-svg"
                      style={{ width: "1.75em", height: "1.75em" }}
                    />
                  </span>
                  <span className="title">Sair</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
