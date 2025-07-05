import React from 'react';
import { Link } from 'react-router-dom';

function CardCurso({ curso, disponivel=null, inscrito=null }) {

  const { nome, thumbnail } = curso;
  const id = curso.idcurso;

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


          <div className="d-flex flex-wrap gap-2">

            {disponivel !== null && disponivel !== undefined && !disponivel &&(
              <div className="btn btn-primary static-button">Arquivado</div>
            )}


            {inscrito !== null && inscrito !== undefined && inscrito && (
              <div className="btn btn-primary static-button">Inscrito</div>
            )}

          </div>

        </div>
      </div>
    </Link>
  );
}

export default CardCurso;
