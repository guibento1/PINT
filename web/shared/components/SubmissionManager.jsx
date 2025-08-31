import React, { useMemo, useState } from "react";
import SubmissionFilePreview from "@shared/components/SubmissionFilePreview";

const SubmissionManager = ({
  student,
  submission,
  nota,
  onGuardarNota,
  onEliminarNota,
  dense = false,
}) => {
  const [notaLocal, setNotaLocal] = useState(
    nota != null && nota !== "" ? String(nota) : ""
  );
  const [saving, setSaving] = useState(false);

  const id =
    student?.id ??
    student?.idformando ??
    student?.utilizador ??
    student?.userId;
  const displayName = useMemo(() => {
    if (student?.nome && student.nome.trim()) return student.nome;
    if (student?.email) return student.email;
    return "—";
  }, [student]);

  const handleGuardar = async () => {
    if (!onGuardarNota) return;
    const parsed = Number(notaLocal);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 20) return;
    try {
      setSaving(true);
      await onGuardarNota(parsed);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!onEliminarNota) return;
    try {
      setSaving(true);
      await onEliminarNota();
      setNotaLocal("");
    } finally {
      setSaving(false);
    }
  };

  const hasSubmission = !!(
    submission?.url ||
    submission?.link ||
    submission?.ficheiro
  );
  const submissionUrl =
    submission?.url || submission?.link || submission?.ficheiro;

  return (
    <div className={`card ${dense ? "mb-2" : "mb-3"}`}>
      <div className="card-body">
        <div className="row g-2 align-items-end">
          {/* Identity */}
          <div className="col-md-8">
            <div className="d-flex flex-column">
              {id != null && (
                <div>
                  <strong>ID do formando:</strong> {String(id)}
                </div>
              )}
              <div>
                <strong>Nome:</strong> {displayName}
              </div>
            </div>
          </div>

          {/* Grade controls (compact, inline, right aligned) */}
          <div className="col-md-4">
            <div className="d-flex justify-content-md-end align-items-end gap-2 flex-wrap">
              <div className="d-flex flex-column">
                <label
                  className="form-label form-label-sm mb-1 small"
                  htmlFor={`nota-${id}`}
                >
                  Nota
                </label>
                <input
                  id={`nota-${id}`}
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  className="form-control form-control-sm"
                  placeholder="Nota"
                  value={notaLocal}
                  onChange={(e) => setNotaLocal(e.target.value)}
                  style={{ width: 120 }}
                />
              </div>
              <div className="d-flex align-items-center gap-2 mb-0">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleGuardar}
                  disabled={saving}
                >
                  {saving ? "A guardar..." : "Guardar"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleEliminar}
                  disabled={saving}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submission preview */}
        <div className="mt-3">
          <div className="d-flex align-items-center justify-content-between">
            <span className="fw-semibold">Submissão</span>
          </div>

          {hasSubmission ? (
            <div className="mt-2">
              <SubmissionFilePreview
                url={submissionUrl}
                filename={submission?.filename}
                type={submission?.type}
                date={submission?.date}
              />
            </div>
          ) : (
            <div className="text-muted small mt-2">Sem submissão.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionManager;
