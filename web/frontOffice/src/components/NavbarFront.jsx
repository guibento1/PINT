import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import logoSoftskills from "../../../shared/assets/images/thesoftskillsLogo.svg";
import logoSoftinsa from "../../../shared/assets/images/thesoftskillsLogo.svg";
import useUserRole from "../../../shared/hooks/useUserRole";
import NotiEmpty from "@shared/assets/images/notification-vazio.svg?react";
import NotiEmptyDot from "@shared/assets/images/notification-vazio-ponto.svg?react";
import NotiFull from "@shared/assets/images/notification-cheio.svg?react";
import api from "@shared/services/axios";

export default function NavbarFront() {
  const location = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { isFormador, loading } = useUserRole();
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);
  const [hoverNoti, setHoverNoti] = useState(false);
  const STORAGE_KEY = "hasUnreadNotificationsFront";

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const nomeUsuario = user?.nome || "Utilizador";
  const avatarUrl =
    user?.foto || user?.fotourl || user?.fotoPerfil || user?.avatar || "";
  const userId =
    user?.idutilizador ||
    user?.id ||
    user?.idUtilizador ||
    user?.userId ||
    user?.uid;

  const buildFullUrl = (v) => {
    const s = String(v || "");
    if (!s) return "";
    if (/^https?:\/\//i.test(s) || /^data:/i.test(s)) return s;
    const base = (api?.defaults?.baseURL || "").replace(/\/$/, "");
    const path = s.replace(/^\/+/, "");
    return base ? `${base}/${path}` : s;
  };

  const [avatarState, setAvatarState] = useState(buildFullUrl(avatarUrl));

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

  // Fetch fresh user data to ensure avatar photo is available
  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        if (!userId) return;
        const resp = await api.get(`/utilizador/id/${userId}`);
        const foto = resp?.data?.foto || "";
        if (!cancelled && foto) {
          setAvatarState(buildFullUrl(foto));
        }
      } catch (_) {
        // keep existing avatarState on failure
      }
    };
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [userId]);

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
    <>
      <nav
        className="navbar navbar-expand-lg navbar-light bg-white shadow-sm"
        style={{
          position: "fixed", // Torna a navbar fixa
          top: 0, // Fixa no topo da página
          width: "100%", // Garante que ocupe toda a largura
          zIndex: 1050, // Garante que esteja acima de outros elementos
          borderBottom: "1px solid #e5e5e5", // Linha de separação
          padding: "5px 0", // Espaço simétrico no topo e na base
        }}
      >
        <div
          className="container-fluid d-flex align-items-center"
          style={{ minHeight: "60px" }}
        >
          {/* Esquerda: Logo Softinsa */}
          <div
            className="d-flex align-items-center justify-content-start"
            style={{ minWidth: "180px", paddingLeft: "30px" }}
          >
            <Link to="/">
              <img
                src={logoSoftskills}
                alt="SoftSkills"
                style={{ height: "48px" }}
              />
            </Link>
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
                        {({ isActive }) => {
                          const Icon = isActive
                            ? NotiFull
                            : notificacoesAtivas
                            ? NotiEmptyDot
                            : NotiEmpty;
                          return (
                            <span
                              className={`position-relative d-inline-block noti-icon ${
                                isActive ? "notificacoes-active" : ""
                              } ${notificacoesAtivas ? "has-unread" : ""}`}
                              style={{ width: 28, height: 28 }}
                              onMouseEnter={() => setHoverNoti(true)}
                              onMouseLeave={() => setHoverNoti(false)}
                            >
                              <Icon
                                style={{
                                  width: 28,
                                  height: 28,
                                  display: "block",
                                  transition: "opacity 0.2s ease",
                                }}
                              />
                            </span>
                          );
                        }}
                      </NavLink>
                    </li>
                    <li className="nav-item text-nowrap d-flex align-items-center">
                      <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                          `nav-link ${isActive ? "active" : ""}`
                        }
                        onClick={fecharMenu}
                      >
                        <span
                          className="d-inline-block me-2"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "1px solid var(--border-light)",
                            backgroundColor: "#e9ecef",
                            backgroundImage: avatarState
                              ? `url(${avatarState})`
                              : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            verticalAlign: "middle",
                          }}
                          aria-hidden="true"
                        />
                        <span>{nomeUsuario}</span>
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
                      to={
                        location.pathname === "/login" ? "/registar" : "/login"
                      }
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

      <footer
        className="bg-white text-center py-3"
        style={{ borderTop: "1px solid #e5e5e5" }}
      >
        <div className="container">
          <img src={logoSoftinsa} alt="Softinsa" style={{ height: "20px" }} />
        </div>
      </footer>
    </>
  );
}
