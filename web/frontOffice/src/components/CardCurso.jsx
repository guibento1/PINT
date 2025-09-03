import React from "react";
import { Link } from "react-router-dom";
import { getCursoStatus } from "@shared/utils/cursoStatus";

function CardCurso({
  curso,
  disponivel = null,
  inscrito = null,
  lecionado = null,
  notipo = false,
  variant = "bootstrap", // "bootstrap" | "ag"
  statusLabel = null,
  statusClass = "btn-primary",
}) {
  // Dados do curso
  const { nome, thumbnail, sincrono } = curso;
  const id = curso.idcurso;

  // Status via helper (fallback if props not provided)
  const st = getCursoStatus ? getCursoStatus(curso) : null;
  const computedStatusLabel = st?.label || null;
  const computedStatusClass =
    st?.key === "terminado" ? "btn-dark" : "btn-primary";
  const finalStatusLabel = statusLabel ?? computedStatusLabel;
  const finalStatusClass = statusClass ?? computedStatusClass;

  // Rota do curso (síncrono ou assíncrono)
  const route = sincrono ? `/curso-sincrono/${id}` : `/curso/${id}`;

  // Estrutura do cartão do curso
  if (variant === "ag") {
    const accent = sincrono
      ? "var(--softinsa-blue-dark)" // síncrono
      : "var(--primary-blue)"; // assíncrono
    const accentWeak = sincrono
      ? "color-mix(in oklab, var(--softinsa-blue-dark), white 15%)"
      : "color-mix(in oklab, var(--primary-blue), white 15%)";

    return (
      <div
        className="ag-courses_item"
        style={{
          ["--ag-accent"]: accent,
          ["--ag-accent-weak"]: accentWeak,
        }}
      >
        <Link
          to={route}
          className="ag-courses-item_link"
          aria-label={`Abrir curso: ${nome}`}
          title={nome}
        >
          <div className="ag-courses-item_bg" aria-hidden="true" />
          <div className="ag-courses-thumb" aria-hidden={!thumbnail}>
            <img
              src={
                thumbnail ||
                "https://placehold.co/600x338/EEF6FA/6c757d?text=Curso"
              }
              alt={nome}
              loading="lazy"
            />
          </div>
          <h3 className="ag-courses-item_title">{nome}</h3>
          {finalStatusLabel && (
            <div className="ag-courses-item_date-box" style={{ marginTop: 6 }}>
              <span className="ag-courses-item_date">{finalStatusLabel}</span>
            </div>
          )}
          {!notipo && typeof sincrono === "boolean" && (
            <div className="ag-courses-item_date-box">
              <span className="ag-courses-item_date">
                {sincrono ? "Curso Síncrono" : "Curso Assíncrono"}
              </span>
            </div>
          )}
        </Link>
      </div>
    );
  }

  return (
    <Link to={route} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        className="card h-100 card-sm shadow hover-lift"
        style={{ boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}
      >
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
            {finalStatusLabel && (
              <div className={`btn ${finalStatusClass} static-button`}>
                {finalStatusLabel}
              </div>
            )}
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
