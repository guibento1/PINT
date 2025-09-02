import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@shared/services/axios.js";
import {
  fetchTopicosCached,
  fetchFormadoresCached,
} from "@shared/services/dataCache";
import Modal from "@shared/components/Modal";
import FileUpload from "@shared/components/FileUpload";

const CriarCursoSincrono = () => {
  const navigate = useNavigate();

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: "",
    planocurricular: "",
    iniciodeinscricoes: "",
    fimdeinscricoes: "",
    disponivel: true,
    inicio: "",
    fim: "",
    nhoras: "",
    maxinscricoes: "",
    topicos: [],
    formador: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewThumbnail, setPreviewThumbnail] = useState("");

  const [allTopicos, setAllTopicos] = useState([]);
  const [allFormadores, setAllFormadores] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resultado da operação (modal)
  const [operationStatus, setOperationStatus] = useState(null); // 0 sucesso | 1 erro
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    if (operationStatus === 0) navigate("/cursos");
    setOperationStatus(null);
    setOperationMessage("");
  };

  const getResultModalTitle = () => {
    if (operationStatus === 0) return "Sucesso";
    if (operationStatus === 1) return "Erro";
    return "Informação";
  };

  const getResultModalBody = () => {
    if (operationStatus === 0)
      return <p>{operationMessage || "Curso síncrono criado com sucesso!"}</p>;
    if (operationStatus === 1)
      return (
        <>
          <p>{operationMessage || "Ocorreu um erro ao criar o curso."}</p>
          <p>Tente novamente mais tarde.</p>
        </>
      );
    return <p>Estado desconhecido.</p>;
  };

  // Carrega tópicos e formadores (com cache)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicos, formadores] = await Promise.all([
          fetchTopicosCached(),
          fetchFormadoresCached(),
        ]);
        setAllTopicos(topicos);
        setAllFormadores(formadores);
      } catch (err) {
        console.error("Erro a carregar dados:", err);
        setError("Falha ao carregar tópicos ou formadores.");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTopicChange = (e) => {
    const id = parseInt(e.target.value, 10);
    setFormData((prev) => ({
      ...prev,
      topicos: prev.topicos.includes(id)
        ? prev.topicos.filter((t) => t !== id)
        : [...prev.topicos, id],
    }));
  };

  const handleThumbnailSelect = (file) => {
    const f = file || null;
    setThumbnailFile(f);
    setPreviewThumbnail(f ? URL.createObjectURL(f) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOperationStatus(null);
    setOperationMessage("");

    if (!Array.isArray(formData.topicos) || formData.topicos.length === 0) {
      setOperationStatus(1);
      setOperationMessage("Selecione pelo menos um tópico.");
      setLoading(false);
      openResultModal();
      return;
    }

    if (!formData.fimdeinscricoes) {
      setOperationStatus(1);
      setOperationMessage(
        "Defina a data-limite de inscrições (fim) para o curso."
      );
      setLoading(false);
      openResultModal();
      return;
    }

    if (!formData.nhoras) {
      setOperationStatus(1);
      setOperationMessage("Indique o número de horas do curso.");
      setLoading(false);
      openResultModal();
      return;
    }

    try {
      const fd = new FormData();
      if (thumbnailFile) fd.append("thumbnail", thumbnailFile);

      const info = {
        nome: formData.nome,
        planocurricular: formData.planocurricular,
        iniciodeinscricoes: formData.iniciodeinscricoes,
        fimdeinscricoes: formData.fimdeinscricoes || null,
        inicio: formData.inicio || null,
        fim: formData.fim || null,
        nhoras: parseInt(formData.nhoras, 10),
        maxinscricoes: formData.maxinscricoes
          ? parseInt(formData.maxinscricoes, 10)
          : null,
        topicos: formData.topicos,
        disponivel: formData.disponivel
      };
      if (formData.formador) info.formador = parseInt(formData.formador, 10);

      fd.append("info", JSON.stringify(info));

      const res = await api.post("/curso/cursosincrono", fd);
      setOperationStatus(0);
      setOperationMessage(
        res.data?.message || "Curso síncrono criado com sucesso!"
      );

      setFormData({
        nome: "",
        planocurricular: "",
        iniciodeinscricoes: "",
        fimdeinscricoes: "",
        inicio: "",
        fim: "",
        nhoras: "",
        maxinscricoes: "",
        topicos: [],
        formador: "",
      });
      setThumbnailFile(null);
      setPreviewThumbnail("");
    } catch (err) {
      console.error("Erro ao criar curso síncrono:", err);
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.message || "Erro ao criar curso."
      );
    } finally {
      setLoading(false);
      openResultModal();
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex align-items-center mb-4 gap-2">
        <h1 className="text-primary-blue h4 mb-0">Criar Novo Curso Síncrono</h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm ms-auto"
          onClick={() => navigate("/cursos")}
        >
          Voltar
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded shadow-sm mb-5"
      >
        <div className="row g-3">
          {/* Nome do Curso */}
          <div className="col-md-6">
            <label htmlFor="nome" className="form-label">
              Nome do Curso: <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              className="form-control"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          {/* Formador */}
          <div className="col-md-6">
            <label htmlFor="formador" className="form-label">
              Atribuir Formador:
            </label>
            <select
              id="formador"
              name="formador"
              className="form-select"
              value={formData.formador}
              onChange={handleChange}
            >
              <option value="">— Selecionar —</option>
              {allFormadores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Plano Curricular */}
          <div className="col-12">
            <label htmlFor="planocurricular" className="form-label">
              Descrição / Plano Curricular:
            </label>
            <textarea
              id="planocurricular"
              name="planocurricular"
              className="form-control"
              rows={4}
              value={formData.planocurricular}
              onChange={handleChange}
            />
          </div>

          {/* Início do Curso */}
          <div className="col-md-6">
            <label htmlFor="inicio" className="form-label">
              Início do Curso: <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              id="inicio"
              name="inicio"
              className="form-control"
              value={formData.inicio}
              onChange={handleChange}
              required
            />
          </div>

          {/* Fim do Curso */}
          <div className="col-md-6">
            <label htmlFor="fim" className="form-label">
              Fim do Curso:
            </label>
            <input
              type="datetime-local"
              id="fim"
              name="fim"
              className="form-control"
              value={formData.fim}
              onChange={handleChange}
            />
          </div>

          {/* Número de Horas (N horas) */}
          <div className="col-md-6">
            <label htmlFor="nhoras" className="form-label">
              N horas: <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              id="nhoras"
              name="nhoras"
              className="form-control"
              min={1}
              value={formData.nhoras}
              onChange={handleChange}
              required
            />
          </div>

          {/* Início das Inscrições */}
          <div className="col-md-6">
            <label htmlFor="iniciodeinscricoes" className="form-label">
              Início das Inscrições: <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              id="iniciodeinscricoes"
              name="iniciodeinscricoes"
              className="form-control"
              value={formData.iniciodeinscricoes}
              onChange={handleChange}
              required
            />
          </div>

          {/* Fim das Inscrições */}
          <div className="col-md-6">
            <label htmlFor="fimdeinscricoes" className="form-label">
              Fim das Inscrições: <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              id="fimdeinscricoes"
              name="fimdeinscricoes"
              className="form-control"
              value={formData.fimdeinscricoes}
              onChange={handleChange}
              required
            />
          </div>

          {/* Máx. Vagas */}
          <div className="col-md-6">
            <label htmlFor="maxinscricoes" className="form-label">
              Máx. Vagas:
            </label>
            <input
              type="number"
              id="maxinscricoes"
              name="maxinscricoes"
              className="form-control"
              min={1}
              value={formData.maxinscricoes}
              onChange={handleChange}
              disabled={!formData.fimdeinscricoes}
            />
            {!formData.fimdeinscricoes && (
              <div className="form-text">
                Defina primeiro a data-limite de inscrições para poder definir vagas.
              </div>
            )}
          </div>

          <div className="col-md-6">
            <div className="form-check form-switch mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="disponivel"
                name="disponivel"
                checked={formData.disponivel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    disponivel: e.target.checked,
                  }))
                }
              />
              <label className="form-check-label" htmlFor="disponivel">
                Curso disponível
              </label>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="col-12">
            <label className="form-label">Thumbnail:</label>
            <div className="d-flex align-items-start gap-3 flex-wrap">
              <FileUpload
                id="thumbnail-upload"
                label={null}
                onSelect={handleThumbnailSelect}
                size="sm"
              />
              {previewThumbnail && (
                <div className="text-center">
                  <img
                    src={previewThumbnail}
                    alt="Preview da Thumbnail"
                    className="rounded shadow-sm border"
                    style={{
                      maxWidth: "280px",
                      maxHeight: "180px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="text-muted small mt-2">Pré-visualização</div>
                </div>
              )}
            </div>
          </div>

          {/* Tópicos */}
          <div className="col-12">
            <label className="form-label">
              Tópicos: <span className="text-danger">*</span>
            </label>
            <div className="border p-3 rounded d-flex flex-wrap gap-2">
              {allTopicos.length > 0 ? (
                allTopicos.map((topico) => (
                  <div key={topico.idtopico} className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`topico-${topico.idtopico}`}
                      value={topico.idtopico}
                      checked={formData.topicos.includes(topico.idtopico)}
                      onChange={handleTopicChange}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`topico-${topico.idtopico}`}
                    >
                      {topico.designacao}
                    </label>
                  </div>
                ))
              ) : (
                <div className="container mt-5">
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" />
                    <p className="mt-2 text-muted">A carregar tópicos...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="col-12 text-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "A Criar..." : "Criar Curso"}
            </button>
            <button
              type="button"
              className="btn btn-danger ms-2"
              onClick={() => navigate("/cursos")}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Resultado */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={getResultModalTitle()}
      >
        {getResultModalBody()}
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-primary" onClick={closeResultModal}>
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CriarCursoSincrono;
