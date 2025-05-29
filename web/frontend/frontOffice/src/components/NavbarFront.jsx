import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import logoSoftinsa from '../../../shared/assets/images/logo_softinsa.png';
import logoSoftskills from '../../../shared/assets/images/logo_softskills.png';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function NavbarFront() {
  const [menuAberto, setMenuAberto] = useState(false);

  const notificacoesAtivas = true; // lógica futura
  const nomeUsuario = 'Maria Silva'; // substituir depois

  const toggleMenu = () => setMenuAberto(!menuAberto);
  const fecharMenu = () => setMenuAberto(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logos */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/home">
          <img src={logoSoftinsa} alt="Softinsa" />
          <img src={logoSoftskills} alt="SoftSkills" />
        </Link>

        {/* Botão do menu (hambúrguer) */}
        <button className="navbar-toggler" type="button" onClick={toggleMenu}>
          {menuAberto ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Conteúdo da navbar */}
        <div className={`collapse navbar-collapse justify-content-end ${menuAberto ? 'show' : ''}`} id="navbarFrontContent">
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
                to="/cursos"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Cursos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/topicos"
                className={({ isActive }) => `nav-link fw-semibold ${isActive ? 'active' : ''}`}
                onClick={fecharMenu}
              >
                Tópicos
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
                className={({ isActive }) =>
                  `nav-link fw-semibold d-flex align-items-center gap-1 ${isActive ? 'active' : ''}`
                }
                onClick={fecharMenu}
              >
                <AccountCircleIcon /> {nomeUsuario}
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
