import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logoSoftinsa from '@shared/assets/images/softinsaLogo.svg';
import logoSoftskills from '@shared/assets/images/thesoftskillsLogo.svg';

export default function NavbarBack() {
  const [menuAberto, setMenuAberto] = useState(false);
  let user = null;

  if(sessionStorage.getItem('user')) {
    user = JSON.parse(sessionStorage.getItem('user'))
  };

  const notificacoesAtivas = true;

  const toggleMenu = () => {
    setMenuAberto(!menuAberto);
  };

  const fecharMenu = () => {
    setMenuAberto(false);
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    sessionStorage.clear();
    fecharMenu();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">

        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src={logoSoftinsa} alt="Softinsa" />
          <img src={logoSoftskills} alt="SoftSkills" />
        </Link>

        <button className="navbar-toggler" type="button" onClick={toggleMenu}>
          {menuAberto ? <i className="ri-close-line"></i> : <i className="ri-menu-line"></i>}
        </button>

        <div className={`collapse navbar-collapse justify-content-end ${menuAberto ? 'show' : ''}`} id="navbarBackContent">
          {
            user ?
          (
          <ul className="navbar-nav align-items-center gap-2 flex-wrap flex-lg-nowrap">
            <li className="nav-item">
              <NavLink
                to="/home"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/gerir-estrutura"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Gerir estrutura
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/cursos"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Cursos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/utilizadores"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Utilizadores
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
            
            <li className="nav-item d-flex align-items-center">
              <NavLink
                to="/perfil"
                className={({ isActive }) => `nav-link fw-semibold d-flex align-items-center gap-1 ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                <i className="ri-account-circle-line"></i> {user?.nome.split(' ')[0]}
              </NavLink>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-danger fw-semibold rounded-pill px-3" onClick={handleLogout}>
                Sair
              </button>
            </li>
          </ul>
          ) : <span className="navbar-brand text-primary fw-bold"> ADMIN PANEL </span>

          }
        </div>
      </div>
    </nav>
  );
}
