import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import logoSoftskills from "@shared/assets/images/thesoftskillsLogo.svg";
import logoSoftinsa from "@shared/assets/images/softinsaLogo.svg";
import NotiEmpty from "@shared/assets/images/notification-vazio.svg?react";
import NotiEmptyDot from "@shared/assets/images/notification-vazio-ponto.svg?react";
import NotiFull from "@shared/assets/images/notification-cheio.svg?react";
import api from "@shared/services/axios";

export default function NavbarBack() {
  const location = useLocation();
  const navigate = useNavigate();

  const STORAGE_KEY = "hasUnreadNotificationsBack";
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "1"
  );
  const [hoverNoti, setHoverNoti] = useState(false);

  // Utilizador da sessão (nome, avatar, id)
  let user = null;
  if (sessionStorage.getItem("user")) {
    try {
      user = JSON.parse(sessionStorage.getItem("user"));
    } catch {
      user = null;
    }
  }
  const nomeUsuario = user?.nome ? user.nome.split(" ")[0] : "Admin";
  const avatarUrl =
    user?.foto || user?.fotourl || user?.fotoPerfil || user?.avatar || "";
  const userId =
    user?.idutilizador ||
    user?.id ||
    user?.idUtilizador ||
    user?.userId ||
    user?.uid;

  // URL absoluta para imagens/ficheiros
  const buildFullUrl = (v) => {
    const s = String(v || "");
    if (!s) return "";
    if (/^https?:\/\//i.test(s) || /^data:/i.test(s)) return s;
    const base = (api?.defaults?.baseURL || "").replace(/\/$/, "");
    const path = s.replace(/^\/+/, "");
    return base ? `${base}/${path}` : s;
  };

  const [avatarState, setAvatarState] = useState(buildFullUrl(avatarUrl));

  // Marca novas notificações
  useEffect(() => {
    const handler = () => setNotificacoesAtivas(true);
    window.addEventListener("novaNotificacao", handler);
    return () => window.removeEventListener("novaNotificacao", handler);
  }, []);

  // Limpa badge ao entrar na página de notificações
  useEffect(() => {
    if (location.pathname === "/notificacoes" && notificacoesAtivas) {
      setNotificacoesAtivas(false);
    }
  }, [location.pathname, notificacoesAtivas]);

  // Atualiza avatar do utilizador
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
        // ignorar
      }
    };
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleMenu = () => setMenuAberto((v) => !v);
  const fecharMenu = () => setMenuAberto(false);

  const handleLogout = () => {
    sessionStorage.clear();
    fecharMenu();
    navigate("/");
  };

  return (
    <>
      <nav
        className="navbar navbar-expand-lg bg-white border-bottom"
        style={{
          position: "fixed", // Navbar fixa no topo
          top: 0,
          width: "100%",
          zIndex: 1050,
          padding: "5px 0",
        }}
      >
        <div
          className="container-fluid d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center"
          style={{ minHeight: "60px" }}
        >
          {/* Top row: logo + (desktop toggler area for symmetry) */}
          <div className="d-flex align-items-center justify-content-between w-100">
            <div
              className="d-flex align-items-center justify-content-start navbar-left-zone"
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
            <div
              className="d-none d-lg-flex align-items-center justify-content-end navbar-right-zone"
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
            </div>
          </div>

          {/* Toggler below logo on mobile */}
          <div className="d-flex d-lg-none justify-content-end px-3 pb-2">
            <button
              className="navbar-toggler"
              type="button"
              onClick={toggleMenu}
            >
              {menuAberto ? (
                <i className="ri-close-line"></i>
              ) : (
                <i className="ri-menu-line"></i>
              )}
            </button>
          </div>

          <div
            className={`collapse navbar-collapse ${menuAberto ? "show" : ""}`}
            id="navbarBackContent"
          >
            <div className="w-100 d-flex flex-column flex-lg-row">
              <div className="flex-grow-1" />
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
                      to="/gerir-notificacoes-e-denuncias"
                      className={({ isActive }) =>
                        `nav-link fw-semibold ${isActive ? "active" : ""}`
                      }
                      onClick={fecharMenu}
                    >
                      Notificações e Denúncias
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
                  <li className="nav-item d-flex align-items-center">
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
                      <span
                        className="d-inline-block text-truncate navbar-username"
                        style={{ maxWidth: 140 }}
                      >
                        {nomeUsuario}
                      </span>
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
