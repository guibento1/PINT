//web\frontend\backOffice\src\components\NavbarBack.jsx
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logoSoftinsa from '../../../shared/assets/images/logo_softinsa.png';
import logoSoftskills from '../../../shared/assets/images/logo_softskills.png';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GerirEstrutura from '../views/GerirEstrutura';

export default function NavbarBack() {
  const [menuAberto, setMenuAberto] = useState(false);

  const notificacoesAtivas = true;
  const nomeUsuario = 'ADMIN';

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
    window.location.href = 'http://localhost:3002/'; // Redireciona para a página de login do frontOffice
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logos */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src={logoSoftinsa} alt="Softinsa" />
          <img src={logoSoftskills} alt="SoftSkills" />
        </Link>

        {/* Botão hamburguer (toggle) */}
        <button className="navbar-toggler" type="button" onClick={toggleMenu}>
          {menuAberto ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Menu */}
        <div className={`collapse navbar-collapse justify-content-end ${menuAberto ? 'show' : ''}`} id="navbarBackContent">
          <ul className="navbar-nav align-items-center gap-2 flex-wrap flex-lg-nowrap">
            <li className="nav-item">
              <NavLink
                to="/"
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
                to="/pesquisar"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Pesquisar
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/usuarios"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Usuários
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/topicos"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Fóruns
              </NavLink>
            </li>
            <li className="nav-item position-relative">
              <NavLink
                to="/notificacoes"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                <NotificationsIcon />
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
                <AccountCircleIcon /> {nomeUsuario}
              </NavLink>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-danger fw-semibold rounded-pill px-3" onClick={handleLogout}>
                Sair
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
