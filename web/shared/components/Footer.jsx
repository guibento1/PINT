import React from 'react';
import facebook from '../assets/images/facebook.png';
import instagram from '../assets/images/instagram.png';
import linkedin from '../assets/images/linkedin.png';

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-3 mt-5">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-start">
        <div className="mb-3 mb-md-0">
          <strong>Problemas?</strong>
          <div>Descreva-os aqui:</div>
          <div className="mt-2">
            <a className="footer-btn mt-1 d-inline-block" href="https://www.softinsa.pt/en/contacts/#contact_form">
              Formulário
            </a>
          </div>
        </div>

        <div className="mb-3 mb-md-0">
          <div>Contactos</div>
          <div>Carreiras</div>
          <div>Tutoriais para docentes</div>
        </div>

        <div>
          <div><strong>AN <span className="text-light">IBM</span> SUBSIDIARY</strong></div>
          <small>@Softinsa 2025. Todos os direitos reservados</small>
          <div className="mt-2 d-flex gap-2">

            <a href="https://pt.linkedin.com/company/softinsa">
              <i className="ri-linkedin-box-line fs-5 fs-sm-4 fs-md-3 fs-lg-3 fs-xl-2"></i>
            </a>

            <a href="https://www.softinsa.pt/en/contacts/">
              <i className="ri-instagram-line fs-5 fs-sm-4 fs-md-3 fs-lg-3 fs-xl-2"></i>
            </a>

            <a href="https://www.facebook.com/Softinsa/">
              <i className="ri-facebook-circle-line fs-5 fs-sm-4 fs-md-3 fs-lg-3 fs-xl-2"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
