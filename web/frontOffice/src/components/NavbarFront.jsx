import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import logoSoftinsa from "../../../shared/assets/images/softinsaLogo.svg";
import logoSoftskills from "../../../shared/assets/images/thesoftskillsLogo.svg";
import useUserRole from "../../../shared/hooks/useUserRole";
import Notifications from "@shared/assets/images/notification.svg?react";
import Profile from "@shared/assets/images/profile.svg?react";

export default function NavbarFront() {
  const location = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { isFormador, loading } = useUserRole();
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const nomeUsuario = user?.nome || "Utilizador";

  useEffect(() => {
    const handler = () => setNotificacoesAtivas(true);
    window.addEventListener("novaNotificacao", handler);
    return () => window.removeEventListener("novaNotificacao", handler);
  }, []);

  useEffect(() => {
    if (location.pathname === "/notificacoes" && notificacoesAtivas) {
      setNotificacoesAtivas(false);
    }
  }, [location.pathname, notificacoesAtivas]);

  const toggleMenu = () => setMenuAberto(!menuAberto);
  const fecharMenu = () => setMenuAberto(false);

  const handleLogout = () => {
    sessionStorage.clear();
    fecharMenu();
    navigate("/");
  };

  if (loading) {
    return <div className="text-center mt-4">A carregar...</div>; // agora depois de todos os hooks declarados
  }

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div
        className="container-fluid d-flex align-items-center"
        style={{ minHeight: "70px" }}
      >
        {/* Esquerda: Logo Softinsa */}
        <div
          className="d-flex align-items-center justify-content-start"
          style={{ minWidth: "180px", paddingLeft: "30px" }}
        >
          <Link to="/">
            <img src={logoSoftinsa} alt="Softinsa" style={{ height: "20px" }} />
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
            <ul className="navbar-nav align-items-center gap-2 flex-wrap flex-lg-nowrap">
              {sessionStorage.getItem("user") ? (
                <>
                  <li className="nav-item">
                    <NavLink
                      to="/home"
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      onClick={fecharMenu}
                    >
                      Home
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/cursos"
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      onClick={fecharMenu}
                    >
                      Cursos
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/forums"
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      onClick={fecharMenu}
                    >
                      Forums
                    </NavLink>
                  </li>
                  <li className="nav-item position-relative">
                    <NavLink
                      to="/notificacoes"
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      onClick={() => {
                        setNotificacoesAtivas(false);
                        sessionStorage.setItem(STORAGE_KEY, "0");
                        fecharMenu();
                      }}
                    >
                      {({ isActive }) => (
                        <span
                          className="position-relative d-inline-block"
                          style={{ width: 22, height: 22 }}
                        >
                          <Notifications
                            style={{
                              width: "1.5em",
                              height: "1.5em",
                              display: "block",
                              // active -> white icon
                              fill: isActive ? "#fff" : undefined,
                              // also set color in case the SVG uses currentColor
                              color: isActive ? "#fff" : undefined,
                            }}
                            className={isActive ? "notificacoes-active" : ""}
                          />
                          {notificacoesAtivas && (
                            <span
                              className="position-absolute bg-danger rounded-circle"
                              style={{
                                top: -2,
                                right: -2,
                                width: 10,
                                height: 10,
                                border: "2px solid #fff",
                              }}
                              aria-label="Nova notificação"
                            />
                          )}
                        </span>
                      )}
                    </NavLink>
                  </li>
                  <li className="nav-item text-nowrap">
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      onClick={fecharMenu}
                    >
                      <Profile
                        style={{
                          width: "1.5rem",
                          height: "1.5rem",
                        }}
                      />{" "}
                      {nomeUsuario}
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <button
                      className="btn btn-custom-logout fw-semibold rounded-pill px-3"
                      onClick={handleLogout}
                    >
                      Sair
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <NavLink
                    to={location.pathname === "/login" ? "/registar" : "/login"}
                    className="nav-link"
                    onClick={fecharMenu}
                  >
                    <button className="btn btn-soft fw-semibold rounded-pill px-3">
                      {location.pathname === "/login" ? "Registar" : "Login"}
                    </button>
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
