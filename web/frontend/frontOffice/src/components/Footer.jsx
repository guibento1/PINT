// frontOffice/src/components/Footer.jsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-3 mt-5">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-start">
        <div className="mb-3 mb-md-0">
          <strong>Problemas?</strong><br />
          Descreva-os aqui:
          <div><a className="btn btn-info btn-sm mt-1" href="#">formulário</a></div>
        </div>

        <div className="mb-3 mb-md-0">
          <div>contactos</div>
          <div>carreiras</div>
          <div>tutoriais para docentes</div>
        </div>

        <div>
          <div><strong>AN <span className="text-light">IBM</span> SUBSIDIARY</strong></div>
          <small>@Softinsa 2025. Todos os direitos reservados</small>
          <div className="mt-2">
            <i className="bi bi-linkedin me-2"></i>
            <i className="bi bi-instagram me-2"></i>
            <i className="bi bi-facebook"></i>
          </div>
        </div>
      </div>
    </footer>
  );
}
