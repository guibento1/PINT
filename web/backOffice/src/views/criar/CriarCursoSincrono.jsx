import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@shared/services/axios.js";
import {
  fetchTopicosCached,
  fetchFormadoresCached,
} from "@shared/services/dataCache";
import Modal from "@shared/components/Modal";

const CriarCursoSincrono = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    planocurricular: "",
    iniciodeinscricoes: "",
    fimdeinscricoes: "",
    maxinscricoes: "",
    topicos: [],
    formador: "", // id do papel "formador"
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewThumbnail, setPreviewThumbnail] = useState("");

  const [allTopicos, setAllTopicos] = useState([]);
  const [allFormadores, setAllFormadores] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const id = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      topicos: prev.topicos.includes(id)
        ? prev.topicos.filter((t) => t !== id)
        : [...prev.topicos, id],
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    setPreviewThumbnail(file ? URL.createObjectURL(file) : "");
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
    try {
      const fd = new FormData();
      if (thumbnailFile) fd.append("thumbnail", thumbnailFile);

      const info = {
        nome: formData.nome,
        planocurricular: formData.planocurricular,
        iniciodeinscricoes: formData.iniciodeinscricoes,
        fimdeinscricoes: formData.fimdeinscricoes || null,
        maxinscricoes: formData.maxinscricoes
          ? parseInt(formData.maxinscricoes)
          : null,
        topicos: formData.topicos,
      };
      if (formData.formador) info.formador = parseInt(formData.formador);

      fd.append("info", JSON.stringify(info));

      const res = await api.post("/curso/cursosincrono", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setOperationStatus(0);
      setOperationMessage(
        res.data?.message || "Curso síncrono criado com sucesso!"
      );

      // Limpar
      setFormData({
        nome: "",
        planocurricular: "",
        iniciodeinscricoes: "",
        fimdeinscricoes: "",
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
      <h1 className="text-primary-blue mb-4">Criar Novo Curso Síncrono</h1>

      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded shadow-sm mb-5"
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="nome" className="form-label">
              Nome do Curso: <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

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

          <div className="col-12">
            <label htmlFor="planocurricular" className="form-label">
              Descrição / Plano Curricular:
            </label>
            <textarea
              className="form-control"
              id="planocurricular"
              name="planocurricular"
              rows={4}
              value={formData.planocurricular}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="iniciodeinscricoes" className="form-label">
              Início das Inscrições: <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-control"
              id="iniciodeinscricoes"
              name="iniciodeinscricoes"
              value={formData.iniciodeinscricoes}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="fimdeinscricoes" className="form-label">
              Fim das Inscrições: <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-control"
              id="fimdeinscricoes"
              name="fimdeinscricoes"
              value={formData.fimdeinscricoes}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="maxinscricoes" className="form-label">
              Máx. Vagas:
            </label>
            <input
              type="number"
              className="form-control"
              id="maxinscricoes"
              name="maxinscricoes"
              min={1}
              value={formData.maxinscricoes}
              onChange={handleChange}
              disabled={!formData.fimdeinscricoes}
            />
            {!formData.fimdeinscricoes && (
              <div className="form-text">
                Defina primeiro a data-limite de inscrições para poder definir
                vagas.
              </div>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="thumbnail" className="form-label">
              Foto de Capa:
            </label>
            <input
              type="file"
              className="form-control"
              id="thumbnail"
              name="thumbnail"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {previewThumbnail && (
              <div className="mt-2">
                <img
                  src={previewThumbnail}
                  alt="Preview da Thumbnail"
                  className="img-thumbnail"
                  style={{ maxWidth: "150px" }}
                />
                <p className="text-muted mt-1">Preview da nova thumbnail</p>
              </div>
            )}
          </div>

          <div className="col-12">
            <label className="form-label">
              Tópicos: <span className="text-danger">*</span>
            </label>
            <div className="border p-3 rounded d-flex flex-wrap gap-2">
              {allTopicos.length > 0 ? (
                allTopicos.map((topico) => (
                  <div
                    key={topico.idtopico}
                    className="form-check form-check-inline"
                  >
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

          <div className="col-12 text-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
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

      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={getResultModalTitle()}
      >
        {getResultModalBody()}
        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={closeResultModal}
          >
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CriarCursoSincrono;
