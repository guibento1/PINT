import React from 'react';
import facebook from '../assets/images/facebook.png';
import instagram from '../assets/images/instagram.png';
import linkedin from '../assets/images/linkedin.png';

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-3 mt-5">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-start">
        <div className="mb-3 mb-md-0">
          <strong>Problemas?</strong><br />
          Descreva-os aqui:
          <div>
            <a className="footer-btn mt-1 d-inline-block" href="#">formulário</a>
          </div>
        </div>

        <div className="mb-3 mb-md-0">
          <div>contactos</div>
          <div>carreiras</div>
          <div>tutoriais para docentes</div>
        </div>

        <div>
          <div><strong>AN <span className="text-light">IBM</span> SUBSIDIARY</strong></div>
          <small>@Softinsa 2025. Todos os direitos reservados</small>
          <div className="mt-2 d-flex gap-2">
            <img src={linkedin} alt="LinkedIn" style={{ width: '20px' }} />
            <img src={instagram} alt="Instagram" style={{ width: '20px' }} />
            <img src={facebook} alt="Facebook" style={{ width: '20px' }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
