import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import Modal from "@shared/components/Modal";
import FileUpload from "@shared/components/FileUpload";
import useUserRole from "@shared/hooks/useUserRole";

const EditarCursoSincrono = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const { isFormador } = useUserRole();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nome: "",
    disponivel: false,
    iniciodeinscricoes: "",
    fimdeinscricoes: "",
    maxinscricoes: "",
    planocurricular: "",
    topicos: [],
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState("");

  const [allTopicos, setAllTopicos] = useState([]);

  // Sessões
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  const [sessionTitulo, setSessionTitulo] = useState("");
  const [sessionDescricao, setSessionDescricao] = useState("");
  const [sessionDataHora, setSessionDataHora] = useState("");
  const [sessionDuracao, setSessionDuracao] = useState("");
  const [sessionPlataforma, setSessionPlataforma] = useState("");
  const [sessionLink, setSessionLink] = useState("");

  // removed session deletion UI per request

  // Resultado genérico
  const [operationStatus, setOperationStatus] = useState(null); // 0 sucesso | 1 erro
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Verificar se formador do curso
  const idFormadorRole = user?.roles?.find((r) => r.role === "formador")?.id;
  const isFormadorDoCurso =
    !!idFormadorRole && curso?.formador === idFormadorRole && isFormador;

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
    if (operationStatus === 0) fetchCursoAndTopicos();
  };

  const getResultModalTitle = () => {
    if (operationStatus === 0) return "Sucesso";
    if (operationStatus === 1) return "Erro";
    return "Info";
  };

  const fetchCursoAndTopicos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resCurso = await api.get(`/curso/${id}`);
      const dataCurso = resCurso.data[0] || resCurso.data;
      if (!dataCurso) {
        setError("Curso não encontrado.");
      } else {
        setCurso(dataCurso);
        setFormData({
          nome: dataCurso.nome || "",
          // se backend envia boolean / int
          disponivel: !!dataCurso.disponivel,
          iniciodeinscricoes: dataCurso.iniciodeinscricoes || "",
          fimdeinscricoes: dataCurso.fimdeinscricoes || "",
          maxinscricoes: dataCurso.maxinscricoes || "",
          planocurricular: dataCurso.planocurricular || "",
          topicos: (dataCurso.topicos || []).map((t) => parseInt(t.idtopico)),
        });
        setCurrentThumbnail(dataCurso.thumbnail || "");
      }
      const resTopicos = await api.get("/topico/list");
      setAllTopicos(
        resTopicos.data.map((t) => ({ ...t, idtopico: parseInt(t.idtopico) }))
      );
    } catch (err) {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCursoAndTopicos();
  }, [fetchCursoAndTopicos]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTopicChange = (e) => {
    const val = parseInt(e.target.value);
    setFormData((prev) => {
      const exists = prev.topicos.includes(val);
      return {
        ...prev,
        topicos: exists
          ? prev.topicos.filter((t) => t !== val)
          : [...prev.topicos, val],
      };
    });
  };

  const handleThumbnailChange = (file) => {
    const f = file || null;
    setThumbnailFile(f);
    setCurrentThumbnail(f ? URL.createObjectURL(f) : curso?.thumbnail || "");
  };

  const formatDataForInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setOperationStatus(null);
    setOperationMessage("");
    try {
      const fd = new FormData();
      if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
      const info = {
        nome: formData.nome,
        disponivel: formData.disponivel,
        iniciodeinscricoes: formData.iniciodeinscricoes,
        fimdeinscricoes: formData.fimdeinscricoes,
        maxinscricoes: formData.maxinscricoes
          ? parseInt(formData.maxinscricoes)
          : null,
        planocurricular: formData.planocurricular,
        topicos: formData.topicos,
      };
      fd.append("info", JSON.stringify(info));

      // Ajustar endpoint se o backend usar outro nome
      const endpoint = `/curso/cursosincrono/${id}`;
      const res = await api.put(endpoint, fd);
      setOperationStatus(0);
      setOperationMessage(res.data?.message || "Curso atualizado com sucesso.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.message || "Erro ao atualizar curso."
      );
    } finally {
      setSaving(false);
      openResultModal();
    }
  };

  // Sessões
  const openAddSessionModal = () => {
    setSessionTitulo("");
    setSessionDescricao("");
    setSessionDataHora("");
    setSessionDuracao("");
    setSessionPlataforma("");
    setSessionLink("");
    setIsAddSessionModalOpen(true);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!curso?.idcrono) return;
    setAddingSession(true);
    try {
      await api.post(`/sessao/${curso.idcrono}`, {
        titulo: sessionTitulo,
        descricao: sessionDescricao,
        datahora: sessionDataHora,
        duracaohoras: Number(sessionDuracao),
        plataformavideoconferencia: sessionPlataforma,
        linksessao: sessionLink,
      });
      setOperationStatus(0);
      setOperationMessage("Sessão adicionada.");
      setIsAddSessionModalOpen(false);
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao adicionar sessão."
      );
    } finally {
      setAddingSession(false);
      openResultModal();
    }
  };

  // session deletion helpers removed

  const formatDataHora = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    return d.toLocaleString("pt-PT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="container mt-5">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2 text-muted">A carregar curso...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">{error}</div>
        <div className="text-center">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </div>
    );

  if (!curso)
    return (
      <div className="container mt-5">
        <div className="alert alert-info text-center">
          Curso não encontrado.
        </div>
        <div className="text-center">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </div>
    );

  if (!isFormadorDoCurso)
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          Não tem permissões para editar este curso.
        </div>
        <div className="text-center">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </div>
    );

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 text-primary">Editar Curso Síncrono: {curso.nome}</h1>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate(`/curso-sincrono/${id}`)}
        >
          Voltar ao Curso
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded shadow-sm mb-5"
      >
        <h2 className="h6 mb-4">Detalhes do Curso</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">
              Nome <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="nome"
              className="form-control"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Início das Inscrições <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              name="iniciodeinscricoes"
              className="form-control"
              value={formatDataForInput(formData.iniciodeinscricoes)}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Fim das Inscrições <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              name="fimdeinscricoes"
              className="form-control"
              value={formatDataForInput(formData.fimdeinscricoes)}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Máx. Inscrições</label>
            <input
              type="number"
              name="maxinscricoes"
              className="form-control"
              min="1"
              value={formData.maxinscricoes}
              onChange={handleChange}
              disabled={
                !(formData.iniciodeinscricoes && formData.fimdeinscricoes)
              }
            />
            {!(formData.iniciodeinscricoes && formData.fimdeinscricoes) && (
              <div className="form-text">
                Defina primeiro a data-limite de inscrições para poder definir
                vagas.
              </div>
            )}
          </div>

          {/* Campo 'Disponível' removido para cursos síncronos */}

          <div className="col-12">
            <label className="form-label">Thumbnail</label>
            <div className="d-flex align-items-start gap-3 flex-wrap">
              <FileUpload
                id="thumbnail-upload"
                label={null}
                onSelect={handleThumbnailChange}
                accept="image/*"
                size="sm"
              />
              {currentThumbnail && (
                <div className="text-center">
                  <img
                    src={currentThumbnail}
                    alt="Thumbnail atual"
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

          <div className="col-12">
            <label className="form-label">
              Tópicos <span className="text-danger">*</span>
            </label>
            <div className="border rounded p-3 d-flex flex-wrap gap-3">
              {allTopicos.map((t) => (
                <div key={t.idtopico} className="form-check form-check-inline">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`top-${t.idtopico}`}
                    value={t.idtopico}
                    checked={formData.topicos.includes(t.idtopico)}
                    onChange={handleTopicChange}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`top-${t.idtopico}`}
                  >
                    {t.designacao}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Plano Curricular reposicionado abaixo dos Tópicos */}
          <div className="col-12">
            <div className="border rounded p-3 bg-light-subtle">
              <label className="form-label">Plano Curricular</label>
              <textarea
                name="planocurricular"
                className="form-control"
                rows="5"
                value={formData.planocurricular}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="col-12 text-end">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "A guardar..." : "Guardar Alterações"}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Add Sessão */}
      <Modal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        title="Adicionar Sessão"
      >
        <form onSubmit={handleCreateSession}>
          <div className="mb-2">
            <label className="form-label">Título</label>
            <input
              type="text"
              className="form-control"
              value={sessionTitulo}
              onChange={(e) => setSessionTitulo(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-control"
              rows="2"
              value={sessionDescricao}
              onChange={(e) => setSessionDescricao(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Data/Hora</label>
              <input
                type="datetime-local"
                className="form-control"
                value={sessionDataHora}
                onChange={(e) => setSessionDataHora(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Duração (h)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                className="form-control"
                value={sessionDuracao}
                onChange={(e) => setSessionDuracao(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Plataforma</label>
              <input
                type="text"
                className="form-control"
                value={sessionPlataforma}
                onChange={(e) => setSessionPlataforma(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mt-2">
            <label className="form-label">Link da Sessão</label>
            <input
              type="url"
              className="form-control"
              value={sessionLink}
              onChange={(e) => setSessionLink(e.target.value)}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddSessionModalOpen(false)}
              disabled={addingSession}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingSession}
            >
              {addingSession ? "A adicionar..." : "Adicionar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Session removal UI intentionally removed */}

      {/* Modal Resultado */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={getResultModalTitle()}
      >
        <p className="mb-0">
          {operationMessage ||
            (operationStatus === 0 ? "Operação concluída." : "Informação.")}
        </p>
        <div className="text-end mt-3">
          <button className="btn btn-primary btn-sm" onClick={closeResultModal}>
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditarCursoSincrono;
