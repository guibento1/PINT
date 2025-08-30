import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios.js";
import {
  fetchTopicosCached,
  fetchFormadoresCached,
} from "@shared/services/dataCache";
import Modal from "@shared/components/Modal";

const EditarCursoSincrono = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [curso, setCurso] = useState(null);
  const [allTopicos, setAllTopicos] = useState([]);
  const [allFormadores, setAllFormadores] = useState([]);

  const [formData, setFormData] = useState({
    nome: "",
    planocurricular: "",
    iniciodeinscricoes: "",
    fimdeinscricoes: "",
    maxinscricoes: "",
    topicos: [],
    formador: "",
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState("");

  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
    if (operationStatus === 0) navigate("/cursos");
  };

  const getResultModalTitle = () =>
    operationStatus === 1 ? "Erro" : "Sucesso";
  const getResultModalBody = () => (
    <p>
      {operationMessage ||
        (operationStatus === 1
          ? "Ocorreu um erro."
          : "Curso atualizado com sucesso!")}
    </p>
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cursoRes, topicos, formadores] = await Promise.all([
        api.get(`/curso/${id}`),
        fetchTopicosCached(),
        fetchFormadoresCached(),
      ]);
      const c = cursoRes.data[0] || cursoRes.data;
      setCurso(c);
      setFormData({
        nome: c.nome || "",
        planocurricular: c.planocurricular || "",
        iniciodeinscricoes: c.iniciodeinscricoes
          ? new Date(c.iniciodeinscricoes).toISOString().slice(0, 16)
          : "",
        fimdeinscricoes: c.fimdeinscricoes
          ? new Date(c.fimdeinscricoes).toISOString().slice(0, 16)
          : "",
        maxinscricoes: c.maxinscricoes || "",
        topicos: (c.topicos || []).map((t) => parseInt(t.idtopico)),
        formador: c.formadores?.[0]?.id || "",
      });
      setCurrentThumbnail(c.thumbnail || "");
      setAllTopicos(topicos);
      setAllFormadores(formadores);
    } catch (err) {
      console.error("Erro a carregar dados:", err);
      setError("Falha ao carregar curso ou listas.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTopicChange = (e) => {
    const idt = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      topicos: prev.topicos.includes(idt)
        ? prev.topicos.filter((t) => t !== idt)
        : [...prev.topicos, idt],
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    setCurrentThumbnail(
      file ? URL.createObjectURL(file) : curso?.thumbnail || ""
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOperationStatus(null);
    setOperationMessage("");

    if (!formData.fimdeinscricoes) {
      setOperationStatus(1);
      setOperationMessage("Defina a data-limite de inscrições (fim).");
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
        fimdeinscricoes: formData.fimdeinscricoes,
        maxinscricoes: formData.maxinscricoes
          ? parseInt(formData.maxinscricoes)
          : null,
        topicos: formData.topicos,
      };
      if (formData.formador) info.formador = parseInt(formData.formador);
      fd.append("info", JSON.stringify(info));
      const res = await api.put(`/curso/cursosincrono/${id}`, fd);
      setOperationStatus(0);
      setOperationMessage(res.data?.message || "Curso atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar curso:", err);
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.message || "Erro ao atualizar curso."
      );
    } finally {
      setLoading(false);
      openResultModal();
    }
  };

  const formatDataForInput = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2 text-muted">A carregar dados do curso...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
        <div className="text-center">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/cursos")}
          >
            Voltar à Gestão de Cursos
          </button>
        </div>
      </div>
    );
  }
  if (!curso) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info text-center" role="alert">
          Curso não encontrado.
        </div>
        <div className="text-center">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/cursos")}
          >
            Voltar à Gestão de Cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1 className="text-primary-blue mb-4">
        Editar Curso Síncrono: {curso.nome}
      </h1>

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
              id="nome"
              name="nome"
              className="form-control"
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
              id="planocurricular"
              name="planocurricular"
              className="form-control"
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
              id="iniciodeinscricoes"
              name="iniciodeinscricoes"
              className="form-control"
              value={formatDataForInput(formData.iniciodeinscricoes)}
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
              id="fimdeinscricoes"
              name="fimdeinscricoes"
              className="form-control"
              value={formatDataForInput(formData.fimdeinscricoes)}
              onChange={handleChange}
              required
            />
            <div className="form-text">Obrigatório para cursos síncronos.</div>
          </div>

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
                Defina primeiro a data-limite de inscrições para poder definir
                vagas.
              </div>
            )}
          </div>

          <div className="col-12">
            <label className="form-label">
              Tópicos: <span className="text-danger">*</span>
            </label>
            <div className="border p-3 rounded d-flex flex-wrap gap-2">
              {allTopicos.map((topico) => (
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
              ))}
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="thumbnail" className="form-label">
              Thumbnail:
            </label>
            <input
              type="file"
              id="thumbnail"
              name="thumbnail"
              className="form-control"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {currentThumbnail && (
              <div className="mt-2">
                <img
                  src={currentThumbnail}
                  alt="Thumbnail atual"
                  className="img-thumbnail"
                  style={{ maxWidth: "150px" }}
                />
                <p className="text-muted mt-1">Thumbnail atual</p>
              </div>
            )}
          </div>

          <div className="col-12 text-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "A Atualizar..." : "Atualizar Curso"}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => navigate("/cursos")}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditarCursoSincrono;
