import React from 'react';
import { Link } from 'react-router-dom';

function CardCurso({ id, nome, thumbnail, disponivel = null }) {
  return (
    <Link to={`/curso/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card h-100 card-sm">
        <div className="ratio-box">
          <img
            src={thumbnail || 'https://placehold.co/300x180.png?text=TheSoftskills'}
            className="card-img-top ratio-img"
            alt={nome}
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">{nome}</h5>

          {disponivel !== null && disponivel !== undefined && (
            <p className="card-text">Disponível: {disponivel ? 'Sim' : 'Não'}</p>
          )}

        </div>
      </div>
    </Link>
  );
}

export default CardCurso;
