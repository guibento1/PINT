import React from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import '@shared/styles/calendar.css';
import NavbarBack from '../components/NavbarBack';
import Footer from '@shared/components/Footer';

export default function HomeBackOffice() {

  const user = JSON.parse(sessionStorage.getItem('user'));

  return (
    <div className="d-flex flex-column  bg-light">

      <main className="flex-grow-1 py-5">
        <div className="container">
          <h2 className="mb-5 text-center">Bem vindo(a), {user?.nome.split(' ')[0]}!</h2>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-md-6 col-lg-6"> 
                  <div className="card h-100 shadow border-radius">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="ri-computer-line"></i>
                      <h5 className="card-title">Cursos</h5>
                      <p className="card-text">Gerir e criar novos cursos</p>
                      <Link to="/cursos" className="btn">
                        Aceder <i className="ri-arrow-right-line"></i>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-6"> 
                  <div className="card h-100 shadow border-radius">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="ri-group-line"></i>
                      <h5 className="card-title">Utilizadores</h5>
                      <p className="card-text">Gerir utilizadores</p>
                      <Link to="/utilizadores" className="btn">
                        Aceder <i className="ri-arrow-right-line"></i>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-6"> 
                  <div className="card h-100 shadow border-radius">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="ri-organization-chart-line"></i>
                      <h5 className="card-title">Gerir Estrutura</h5>
                      <p className="card-text">Organizar áreas, categorias e topicos</p>
                      <Link to="/gerir-estrutura" className="btn">
                        Aceder <i className="ri-arrow-right-line"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 d-none d-lg-block"> 
              <div className="card shadow border-radius">
                <div className="card-body">
                  <Calendar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
