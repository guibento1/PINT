import React from "react";
import { Link } from "react-router-dom";

function CardCurso({ curso, disponivel = null, inscrito = null, lecionado= null, notipo = false }) {
  const { nome, thumbnail, sincrono } = curso;
  const id = curso.idcurso;
  const route = sincrono ? `/curso-sincrono/${id}` : `/curso/${id}`;

  return (
    <Link to={route} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card h-100 card-sm shadow">
        <div className="ratio-box position-relative">
          <img
            src={
              thumbnail || "https://placehold.co/300x180.png?text=TheSoftskills"
            }
            className="card-img-top ratio-img"
            alt={nome}
          />
          {!notipo && typeof sincrono === "boolean" && (
            <span
              className={`badge position-absolute top-0 start-0 m-2 ${
                sincrono ? "bg-success" : "bg-secondary"
              }`}
              style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}
            >
              {sincrono ? "SÍNCRONO" : "ASSÍNCRONO"}
            </span>
          )}
        </div>
        <div className="card-body">
          <h5 className="card-title mb-2">{nome}</h5>
          <div className="d-flex flex-wrap gap-2">
            {disponivel !== null && disponivel !== undefined && !disponivel && (
              <div className="btn btn-primary static-button">Arquivado</div>
            )}
            {inscrito !== null && inscrito !== undefined && inscrito && (
              <div className="btn btn-primary static-button">Inscrito</div>
            )}
            {lecionado !== null && lecionado !== undefined && lecionado && (
              <div className="btn btn-primary static-button">Lecionado</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CardCurso;
