// shared/components/CardCurso.jsx
import React from 'react';

function CardCurso({ nome, thumnail, disponivel }) {
  return (
    <div className="card h-100">
      <img
        src={thumnail || 'https://via.placeholder.com/300x180.png?text=Curso'}
        className="card-img-top"
        alt={nome}
      />
      <div className="card-body">
        <h5 className="card-title">{nome}</h5>
        <p className="card-text">Disponível: {disponivel ? 'Sim' : 'Não'}</p>
        {/* Aqui pode entrar um botão para detalhes ou inscrição */}
        <button className="btn btn-outline-primary w-100">Ver detalhes</button>
      </div>
    </div>
  );
}

export default CardCurso;
