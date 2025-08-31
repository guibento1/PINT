import React from "react";


const SubmissionCard = ({ filename, type, date, url, statusLabel }) => {
  const formatted = date
    ? new Date(date).toLocaleString("pt-PT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="card submission-card shadow-sm">
      <div className="card-body py-3 d-flex align-items-center gap-3">
        <div className="submission-icon" aria-hidden="true">
          📎
        </div>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="fw-semibold me-2">
              {filename || "Ficheiro submetido"}
            </div>
            {statusLabel && (
              <span className="badge bg-secondary-subtle text-secondary-emphasis">
                {statusLabel}
              </span>
            )}
          </div>
          <div className="text-muted small">
            {type && <span>Tipo: {type}</span>}
            {formatted && <span className="ms-2">Submetido: {formatted}</span>}
          </div>
        </div>
        {url && (
          <div className="d-flex gap-2">
            <a
              className="btn btn-outline-primary btn-sm"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              Ver
            </a>
            <a className="btn btn-primary btn-sm" href={url} download>
              Descarregar
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionCard;
