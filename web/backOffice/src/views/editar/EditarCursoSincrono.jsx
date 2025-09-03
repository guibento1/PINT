import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios.js";
import {
  fetchTopicosCached,
  fetchFormadoresCached,
} from "@shared/services/dataCache";
import Modal from "@shared/components/Modal";
import FileUpload from "@shared/components/FileUpload";

const EditarCursoSincrono = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dados do curso
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [curso, setCurso] = useState(null);
  const [allTopicos, setAllTopicos] = useState([]);
  const [allFormadores, setAllFormadores] = useState([]);

  // Form do curso
  const [formData, setFormData] = useState({
    nome: "",
    planocurricular: "",
    iniciodeinscricoes: "",
    fimdeinscricoes: "",
    fim: "",
    inicio: "",
    maxinscricoes: "",
    topicos: [],
    formador: "",
    disponivel: true
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState("");

  // Status de operações
  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Certificados associados ao curso
  const [certificados, setCertificados] = useState([]);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certEditing, setCertEditing] = useState(null); // certificado atual sendo editado (null para adicionar)
  const [certForm, setCertForm] = useState({ nome: "", descricao: "" });
  const [certModalLoading, setCertModalLoading] = useState(false);

  // Helper: título/descrição do modal de resultado
  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
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

  // Certificados: fetch
  const fetchCertificados = useCallback(async () => {
    try {
      const res = await api.get(`/curso/cursosincrono/${id}/certificados`);
      const data = res?.data ?? [];
      setCertificados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro a carregar certificados:", err);
    }
  }, [id]);

  // Dados do curso (principal) + certificados
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

      const currentFormadorId =
        c.formador ?? c.formadores?.[0]?.id ?? c.formadores?.[0]?.idutilizador;
      const currentFormadorName = c.formadores?.[0]?.nome || "Formador atual";

      const normalizedFormadores = (formadores || []).map((f) => ({
        ...f,
        id: String(f.id),
      }));
      const cfIdStr =
        currentFormadorId !== undefined && currentFormadorId !== null
          ? String(currentFormadorId)
          : "";
      const hasCurrent = cfIdStr
        ? normalizedFormadores.some((f) => f.id === cfIdStr)
        : true;
      const finalFormadores = hasCurrent
        ? normalizedFormadores
        : [...normalizedFormadores, { id: cfIdStr, nome: currentFormadorName }];

      setFormData({
        nome: c.nome || "",
        planocurricular: c.planocurricular || "",
        iniciodeinscricoes: c.iniciodeinscricoes
          ? new Date(c.iniciodeinscricoes).toISOString().slice(0, 16)
          : "",
        fimdeinscricoes: c.fimdeinscricoes
          ? new Date(c.fimdeinscricoes).toISOString().slice(0, 16)
          : "",
        inicio: c.inicio || "",
        disponivel: c.disponivel ?? true,
        fim: c.fim || "",
        nhoras: c.nhoras?.toString() || "",
        maxinscricoes: (c.maxinscricoes ?? c.maxincricoes ?? "").toString(),
        topicos: (c.topicos || []).map((t) => parseInt(t.idtopico)),
        formador: cfIdStr,
      });
      setCurrentThumbnail(c.thumbnail || "");
      setAllTopicos(topicos);
      setAllFormadores(finalFormadores);

      // Carregar certificados do curso
      await fetchCertificados();
    } catch (err) {
      console.error("Erro a carregar dados:", err);
      setError("Falha ao carregar curso ou listas.");
    } finally {
      setLoading(false);
    }
  }, [id, fetchCertificados]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manipulação do formulário do curso
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

  const handleThumbnailSelect = (file) => {
    const f = file || null;
    setThumbnailFile(f);
    setCurrentThumbnail(f ? URL.createObjectURL(f) : curso?.thumbnail || "");
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
        inicio: formData.inicio,
        fim: formData.fim,
        fimdeinscricoes: formData.fimdeinscricoes,
        nhoras: formData.nhoras ? parseInt(formData.nhoras) : null,
        maxinscricoes: formData.maxinscricoes
          ? parseInt(formData.maxinscricoes)
          : null,
        topicos: formData.topicos,
        disponivel: formData.disponivel
      };
      if (formData.formador) info.formador = parseInt(formData.formador);
      fd.append("info", JSON.stringify(info));
      const res = await api.put(`/curso/cursosincrono/${id}`, fd);
      setOperationStatus(0);
      setOperationMessage(res.data?.message || "Curso atualizado com sucesso!");

      await fetchData();
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
    const date = new Date(isoString);
    return isNaN(date.getTime())
      ? ""
      : new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
  };

  // Certificados: criação/edição/exclusão
  const handleCertSubmit = async (e) => {
    e.preventDefault();
    setCertModalLoading(true);
    try {
      if (certEditing?.idcertificado) {
        // Editar certificado existente
        await api.put(`/curso/certificado/${certEditing.idcertificado}`, {
          nome: certForm.nome,
          descricao: certForm.descricao,
        });
      } else {
        // Adicionar novo certificado ao curso
        await api.post(`/curso/cursosincrono/${id}/certificado`, {
          nome: certForm.nome,
          descricao: certForm.descricao,
        });
      }
      await fetchCertificados();
      setCertModalOpen(false);
      setCertEditing(null);
      setCertForm({ nome: "", descricao: "" });
    } catch (err) {
      console.error("Erro ao salvar certificado:", err);
    } finally {
      setCertModalLoading(false);
    }
  };

  const deleteCertificado = async (certId) => {
    if (!window.confirm("Tem a certeza que pretende excluir este certificado?")) return;
    try {
      await api.delete(`/curso/certificado/${certId}`);
      await fetchCertificados();
    } catch (err) {
      console.error("Erro ao apagar certificado:", err);
    }
  };

  // Renderização
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
      <div className="d-flex align-items-center mb-4 gap-2">
        <h1 className="text-primary-blue h4 mb-0">
          Editar Curso Síncrono: {curso.nome}
        </h1>
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
                <option key={String(f.id)} value={String(f.id)}>
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
            <label htmlFor="inicio" className="form-label">
              Início do Curso: <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              id="inicio"
              name="inicio"
              className="form-control"
              value={formatDataForInput(formData.inicio)}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="fim" className="form-label">
              Fim do Curso:
            </label>
            <input
              type="datetime-local"
              id="fim"
              name="fim"
              className="form-control"
              value={formatDataForInput(formData.fim)}
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
              value={formData.nhoras || ""}
              onChange={handleChange}
              required
            />
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
            <label className="form-label d-block">Thumbnail:</label>
            <div className="d-flex align-items-start gap-3 flex-wrap">
              <FileUpload
                id="thumbnail-upload"
                label={null}
                onSelect={handleThumbnailSelect}
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

          <div className="col-12 d-flex justify-content-end gap-3">
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

      {/* Seção: Certificados do Curso */}
      <section className="p-4 border rounded shadow-sm mb-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">Certificados do Curso</h4>
          <button
            className="btn btn-success btn-sm"
            onClick={() => {
              setCertEditing(null);
              setCertForm({ nome: "", descricao: "" });
              setCertModalOpen(true);
            }}
          >
            Adicionar certificado
          </button>
        </div>

        {certificados.length === 0 ? (
          <div className="text-muted">Nenhum certificado encontrado para este curso.</div>
        ) : (
          certificados.map((cert) => (
            <div key={cert.idcertificado} className="card mb-2">
              <div className="card-body">
                <h6 className="card-title mb-2">{cert.nome}</h6>
                {cert.descricao && (
                  <p className="card-text mb-2">{cert.descricao}</p>
                )}
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => {
                      setCertEditing(cert);
                      setCertForm({ nome: cert.nome, descricao: cert.descricao });
                      setCertModalOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteCertificado(cert.idcertificado)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Modal de Certificado (Adicionar / Editar) */}
      <Modal
        isOpen={certModalOpen}
        onClose={() => {
          setCertModalOpen(false);
          setCertEditing(null);
          setCertForm({ nome: "", descricao: "" });
        }}
        title={
          certEditing && certEditing.idcertificado
            ? "Editar Certificado"
            : "Adicionar Certificado"
        }
      >
        <form onSubmit={handleCertSubmit}>
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input
              type="text"
              className="form-control"
              value={certForm.nome}
              onChange={(e) =>
                setCertForm((p) => ({ ...p, nome: e.target.value }))
              }
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-control"
              rows={3}
              value={certForm.descricao}
              onChange={(e) =>
                setCertForm((p) => ({ ...p, descricao: e.target.value }))
              }
            />
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={certModalLoading}
            >
              {certModalLoading
                ? "A processar..."
                : certEditing && certEditing.idcertificado
                ? "Atualizar Certificado"
                : "Adicionar Certificado"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCertModalOpen(false);
                setCertEditing(null);
                setCertForm({ nome: "", descricao: "" });
              }}
            >
              Fechar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Resultado (para o curso) */}
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
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditarCursoSincrono;
