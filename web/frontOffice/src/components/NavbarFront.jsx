// web\frontend\frontOffice\src\components\NavbarFront.jsx
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import logoSoftinsa from '../../../shared/assets/images/softinsaLogo.svg';
import logoSoftskills from '../../../shared/assets/images/thesoftskillsLogo.svg';
import useUserRole from '../../../shared/hooks/useUserRole';

export default function NavbarFront() {
  const location = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { isFormador, loading } = useUserRole();

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const nomeUsuario = user?.nome || 'Utilizador';

  if (loading) {
    return <div className="text-center mt-4">A carregar...</div>;
  }

  const notificacoesAtivas = true;

  const toggleMenu = () => setMenuAberto(!menuAberto);
  const fecharMenu = () => setMenuAberto(false);

  const handleLogout = () => {
    sessionStorage.clear();
    fecharMenu();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logos - Agora com classes para controlo no CSS */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to={sessionStorage.getItem('user') ? "/home" : "/"}>
          <img src={logoSoftinsa} className="softinsa-logo" alt="Softinsa" />
          <img src={logoSoftskills} className="softskills-logo" alt="SoftSkills" />
        </Link>

        {/* Botão do menu (hambúrguer) */}
        <button className="navbar-toggler" type="button" onClick={toggleMenu}>
          {menuAberto ? <i className="ri-close-line"></i> : <i className="ri-menu-line"></i>}
        </button>

        {/* Conteúdo da navbar */}
        <div className={`collapse navbar-collapse justify-content-end ${menuAberto ? 'show' : ''}`} id="navbarFrontContent">
          <ul className="navbar-nav align-items-center gap-2 flex-wrap flex-lg-nowrap">

            {sessionStorage.getItem('user') ? (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/home"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={fecharMenu}
                  >
                    Home
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/cursos"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={fecharMenu}
                  >
                    Cursos
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/forums"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={fecharMenu}
                  >
                    Forums
                  </NavLink>
                </li>
                <li className="nav-item position-relative">
                  <NavLink
                    to="/notificacoes"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={fecharMenu}
                  >
                    <i className="ri-notification-line"></i>
                    {notificacoesAtivas && (
                      <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                        <span className="visually-hidden">Nova notificação</span>
                      </span>
                    )}
                  </NavLink>
                </li>
                {isFormador && (
                  <li className="nav-item">
                    <NavLink
                      to="/gerircursos"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={fecharMenu}
                    >
                      Gerir Cursos
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink
                    to="/perfil"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={fecharMenu}
                  >
                    <i class="ri-account-circle-line"></i> {nomeUsuario}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-danger fw-semibold rounded-pill px-3" onClick={handleLogout}>
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <NavLink
                  to={location.pathname === '/login' ? '/registar' : '/login'}
                  className="nav-link"
                  onClick={fecharMenu}
                >
                  <button className="btn btn-soft fw-semibold rounded-pill px-3">
                    {location.pathname === '/login' ? 'Registar' : 'Login'}
                  </button>
                </NavLink>
              </li>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
}
