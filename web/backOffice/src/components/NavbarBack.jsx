import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import logoSoftinsa from "@shared/assets/images/softinsaLogo.svg";
import logoSoftskills from "@shared/assets/images/thesoftskillsLogo.svg";
import Notifications from "@shared/assets/images/notification.svg?react";
import Profile from "@shared/assets/images/profile.svg?react";

export default function NavbarBack() {
  const location = useLocation();
  const navigate = useNavigate();

  const STORAGE_KEY = "hasUnreadNotificationsBack";
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "1"
  );

  let user = null;
  if (sessionStorage.getItem("user")) {
    try {
      user = JSON.parse(sessionStorage.getItem("user"));
    } catch {
      user = null;
    }
  }
  const nomeUsuario = user?.nome ? user.nome.split(" ")[0] : "Admin";

  // Recebe novas notificações
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

  const toggleMenu = () => setMenuAberto((v) => !v);
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
        <div
          className="d-flex align-items-center justify-content-start"
          style={{ minWidth: "180px", paddingLeft: "30px" }}
        >
          <Link to="/">
            <img src={logoSoftinsa} alt="Softinsa" style={{ height: "20px" }} />
          </Link>
        </div>
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
        <div
          className="d-flex align-items-center justify-content-end"
          style={{ minWidth: "260px", paddingRight: "24px" }}
        >
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
          <div
            className={`collapse navbar-collapse justify-content-end ${
              menuAberto ? "show" : ""
            }`}
            id="navbarBackContent"
          >
            {user ? (
              <ul className="navbar-nav align-items-center gap-2 flex-nowrap">
                <li className="nav-item">
                  <NavLink
                    to="/home"
                    className={({ isActive }) =>
                      `nav-link fw-semibold ${isActive ? "active" : ""}`
                    }
                    onClick={fecharMenu}
                  >
                    Home
                  </NavLink>
                </li>
                <li className="nav-item text-nowrap">
                  <NavLink
                    to="/gerir-estrutura"
                    className={({ isActive }) =>
                      `nav-link fw-semibold ${isActive ? "active" : ""}`
                    }
                    onClick={fecharMenu}
                  >
                    Gerir estrutura
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/cursos"
                    className={({ isActive }) =>
                      `nav-link fw-semibold ${isActive ? "active" : ""}`
                    }
                    onClick={fecharMenu}
                  >
                    Cursos
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/utilizadores"
                    className={({ isActive }) =>
                      `nav-link fw-semibold ${isActive ? "active" : ""}`
                    }
                    onClick={fecharMenu}
                  >
                    Utilizadores
                  </NavLink>
                </li>
                <li className="nav-item">
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
                    <span
                      className="position-relative d-inline-block"
                      style={{ width: 22, height: 22 }}
                    >
                      <Notifications
                        style={{ width: 22, height: 22, display: "block" }}
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
                  </NavLink>
                </li>
                <li className="nav-item d-flex align-items-center">
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    onClick={fecharMenu}
                  >
                    <Profile
                      style={{
                        width: 22,
                        height: 22,
                        marginRight: 4,
                        verticalAlign: "text-bottom",
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
              </ul>
            ) : (
              <span className="navbar-brand text-primary fw-bold">
                ADMIN PANEL
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
