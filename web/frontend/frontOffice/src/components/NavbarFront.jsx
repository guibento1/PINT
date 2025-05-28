import React from 'react';
import { Link } from 'react-router-dom';

export default function NavbarFront() {
  return (
    <nav className="navbar navbar-expand-lg bg-primary navbar-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">SoftSkills</Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navFront">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navFront">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/cursos">Cursos</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/topicos">Tópicos</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/perfil">Meu Perfil</Link></li>
          </ul>
          <button className="btn btn-light btn-sm">Sair</button>
        </div>
      </div>
    </nav>
  );
}
