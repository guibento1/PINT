//web/frontend/backOffice/src/views/Cursos.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Cursos() {
  const navigate = useNavigate();

  return (
    <div className="container py-5">
      <h2 style={{ color: 'var(--primary-blue)' }}>Gerir Cursos</h2>
      <p className="text-muted mb-4">Gestão de cursos síncronos, assíncronos e outras ações</p>

      <div className="row g-4">
        {/* Coluna principal */}
        <div className="col-lg-8">
          <div className="card-rounded">
            <h5 style={{ color: 'var(--primary-blue)' }}>Criar cursos</h5>
            <div className="btn-group-responsive mt-3">
              <button className="btn-primary-blue" onClick={() => navigate('/criar-curso-sincrono')}>
                <GroupsIcon fontSize="large" />
                <div className="text-start">
                  <strong>Curso Síncrono</strong><br />
                  <span className="text-light">Com formador</span>
                </div>
              </button>

              <button className="btn-primary-blue" onClick={() => navigate('/criar-curso-assincrono')}>
                <MenuBookIcon fontSize="large" />
                <div className="text-start">
                  <strong>Curso Assíncrono</strong><br />
                  <span className="text-light">Sem formador</span>
                </div>
              </button>
            </div>

            <hr className="my-4" />

            <h5 style={{ color: 'var(--primary-blue)' }}>Buscar e editar cursos</h5>
            <button className="btn-search-curso mt-3" onClick={() => navigate('/pesquisar')}>
              <SearchIcon />
              <span>Pesquisar cursos</span>
            </button>

            <hr className="my-4" />

            <h5 style={{ color: 'var(--primary-blue)' }}>Outras ações</h5>
            <button className="btn-primary-blue-auto mt-2" onClick={() => navigate('/gerir-estrutura')}>
              <SettingsIcon fontSize="large" />
              <div className="text-start">
                <strong>Gerir Estrutura</strong><br />
                <span className="text-light">Gerir: Áreas, Categorias e Tópicos</span>
              </div>
            </button>
          </div>
        </div>

        {/* Coluna lateral com calendário e eventos */}
        <div className="col-lg-4">
          <div className="card-rounded-sm">
            <h5 style={{ color: 'var(--primary-blue)' }}>Março</h5>
            <p className="text-muted">[ Calendário virá aqui ]</p>
          </div>

          <div className="card-rounded-sm">
            <h5 style={{ color: 'var(--primary-blue)' }}>Eventos</h5>
            <p className="text-muted">Nada a apresentar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
