import React, { useRef, useState } from "react";


const FileUpload = ({
  id,
  label = "Carregar ficheiro",
  accept,
  disabled,
  onSelect,
  hint,
  size,
}) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState(null);

  const openPicker = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelected(file);
    onSelect && onSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (!file) return;
    setSelected(file);
    onSelect && onSelect(file);
  };

  const controlSize = size === "sm" ? "form-control-sm" : "";

  return (
    <div className="file-upload">
      {label && (
        <label className="form-label form-label-sm mb-1 small" htmlFor={id}>
          {label}
        </label>
      )}
      <div
        className={`upload-dropzone ${dragOver ? "is-dragover" : ""} ${
          disabled ? "disabled" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={!disabled ? openPicker : undefined}
        role="button"
        tabIndex={0}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="upload-icon" aria-hidden="true">
            📄
          </div>
          <div className="flex-grow-1">
            {selected ? (
              <>
                <div className="fw-semibold">{selected.name}</div>
                <div className="text-muted small">
                  {selected.type || "tipo desconhecido"} ·{" "}
                  {Math.ceil(selected.size / 1024)} KB
                </div>
              </>
            ) : (
              <>
                <div className="fw-semibold">Solte aqui o ficheiro</div>
                <div className="text-muted small">
                  ou clique para selecionar
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={disabled}
          >
            Procurar
          </button>
        </div>
        <input
          id={id}
          ref={inputRef}
          type="file"
          className={`form-control visually-hidden ${controlSize}`}
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          onClick={(e) => {
            e.target.value = null;
          }}
        />
      </div>
      {hint && <div className="form-text small mt-1">{hint}</div>}
    </div>
  );
};

export default FileUpload;
