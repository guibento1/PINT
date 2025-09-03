import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios.js";
import Modal from "@shared/components/Modal";
import FileUpload from "@shared/components/FileUpload";
import SubmissionCard from "@shared/components/SubmissionCard";

const EditarCursoAssincrono = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nome: "",
    disponivel: false,
    iniciodeinscricoes: "",
    fimdeinscricoes: "",
    planocurricular: "",
    topicos: [],
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState("");

  const [allTopicos, setAllTopicos] = useState([]);

  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDescription, setNewLessonDescription] = useState("");
  const [addingLesson, setAddingLesson] = useState(false);

  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [lessonToAddTo, setLessonToAddTo] = useState(null);
  const [newContentTitle, setNewContentTitle] = useState("");
  const [newContentType, setNewContentType] = useState("");
  const [newContentLink, setNewContentLink] = useState("");
  const [newContentFile, setNewContentFile] = useState(null);
  const [addingContent, setAddingContent] = useState(false);

  const [isDeleteLessonModalOpen, setIsDeleteLessonModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(false);

  const [isDeleteMaterialModalOpen, setIsDeleteMaterialModalOpen] =
    useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [materialLicaoToDelete, setMaterialLicaoToDelete] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(false);

  const [operationStatus, setOperationStatus] = useState(null); // null: nenhum, 0: sucesso, 1: erro
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const getResultModalTitle = () => {
    switch (operationStatus) {
      case 0:
        return "Sucesso";
      case 1:
        return "Erro";
      default:
        return "Informação";
    }
  };

  const getResultModalBody = () => {
    switch (operationStatus) {
      case 0:
        return <p>{operationMessage || "Operação realizada com sucesso!"}</p>;
      case 1:
        return (
          <>
            <p>{operationMessage || "Ocorreu um erro."}</p>
            <p>
              Tente novamente mais tarde. Se o erro persistir, contacte o
              suporte.
            </p>
          </>
        );
      default:
        return <p>Estado da operação desconhecido.</p>;
    }
  };

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
    if (operationStatus === 0) {
      fetchCursoAndRelatedData();
    }
  };

  const fetchCursoAndRelatedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cursoRes = await api.get(`/curso/${id}`);
      const cursoData = cursoRes.data[0] || cursoRes.data;

      if (cursoData) {
        setCurso(cursoData);
        setFormData({
          nome: cursoData.nome || "",
          disponivel: cursoData.disponivel || false,
          iniciodeinscricoes: cursoData.iniciodeinscricoes
            ? new Date(cursoData.iniciodeinscricoes).toISOString().slice(0, 16)
            : "",
          fimdeinscricoes: cursoData.fimdeinscricoes
            ? new Date(cursoData.fimdeinscricoes).toISOString().slice(0, 16)
            : "",
          planocurricular: cursoData.planocurricular || "",
          topicos: cursoData.topicos?.map((t) => parseInt(t.idtopico)) || [],
        });
        setCurrentThumbnail(cursoData.thumbnail || "");
      } else {
        setError("Curso não encontrado.");
      }

      const topicosRes = await api.get("/topico/list");
      setAllTopicos(
        topicosRes.data.map((topico) => ({
          ...topico,
          idtopico: parseInt(topico.idtopico),
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar dados para edição:", err);
      setError("Erro ao carregar os dados do curso ou listas relacionadas.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCursoAndRelatedData();
  }, [fetchCursoAndRelatedData]);

  // Assíncronos: seguir regras do getCursoStatus
  // - Se fim de inscrições passou e disponivel !== true => "Terminado"
  // - Admin pode reativar manualmente (disponivel === true) mesmo após o fim
  // Por isso, NÃO forçamos a alterar o campo "disponivel" automaticamente aqui.
  // Mantemos o valor trazido do backend e o que o admin definir no formulário.

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleThumbnailSelect = (file) => {
    const f = file || null;
    setThumbnailFile(f);
    setCurrentThumbnail(f ? URL.createObjectURL(f) : curso?.thumbnail || "");
  };

  const handleTopicChange = (e) => {
    const topicId = parseInt(e.target.value);
    setFormData((prev) => {
      const updatedTopicos = prev.topicos.includes(topicId)
        ? prev.topicos.filter((t) => t !== topicId)
        : [...prev.topicos, topicId];
      return { ...prev, topicos: updatedTopicos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOperationStatus(null);
    setOperationMessage("");

    try {
      const data = new FormData();

      if (thumbnailFile) {
        data.append("thumbnail", thumbnailFile);
      }

      const fimOk = formData.disponivel ? formData.fimdeinscricoes : null;

      const info = {
        nome: formData.nome,
        disponivel: formData.disponivel,
        iniciodeinscricoes: formData.iniciodeinscricoes,
        fimdeinscricoes: fimOk,
        planocurricular: formData.planocurricular,
        topicos: formData.topicos,
      };

      data.append("info", JSON.stringify(info));

      const endpoint = `/curso/cursoassincrono/${id}`;
      const res = await api.put(endpoint, data);

      setOperationStatus(0);
      setOperationMessage(res.data.message || "Curso atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar curso:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao atualizar o curso."
      );
    } finally {
      setLoading(false);
      openResultModal();
    }
  };

  const handleAddLessonClick = () => {
    setNewLessonTitle("");
    setNewLessonDescription("");
    setIsAddLessonModalOpen(true);
  };

  const handleCreateLesson = async () => {
    setAddingLesson(true);
    try {
      const res = await api.post(`/curso/licao/${curso.idcrono}`, {
        titulo: newLessonTitle,
        descricao: newLessonDescription,
      });
      setOperationStatus(0);
      setOperationMessage(res.data.message || "Lição adicionada com sucesso!");
      setIsAddLessonModalOpen(false);
    } catch (err) {
      console.error("Erro ao adicionar lição:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao adicionar a lição."
      );
    } finally {
      setAddingLesson(false);
      openResultModal();
    }
  };

  const handleDeleteLessonClick = (licao) => {
    setLessonToDelete(licao);
    setIsDeleteLessonModalOpen(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;
    setDeletingLesson(true);
    try {
      const res = await api.delete(`/curso/licao/${lessonToDelete.idlicao}`);
      setOperationStatus(0);
      setOperationMessage(res.data.message || "Lição eliminada com sucesso!");
      setIsDeleteLessonModalOpen(false);
    } catch (err) {
      console.error("Erro ao eliminar lição:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao eliminar a lição."
      );
    } finally {
      setDeletingLesson(false);
      openResultModal();
    }
  };

  const handleAddContentClick = (licao) => {
    setLessonToAddTo(licao);
    setNewContentTitle("");
    setNewContentType("");
    setNewContentLink("");
    setNewContentFile(null);
    setIsAddContentModalOpen(true);
  };

  const handleContentFileChange = (e) => {
    setNewContentFile(e.target.files[0]);
  };

  const handleCreateContent = async () => {
    if (!lessonToAddTo) return;
    setAddingContent(true);

    try {
      const data = new FormData();
      const info = {
        titulo: newContentTitle,
        tipo: parseInt(newContentType),
      };

      if (newContentLink) {
        info.link = newContentLink;
      }

      data.append("info", JSON.stringify(info));

      if (newContentFile) {
        data.append("ficheiro", newContentFile);
      }

      const res = await api.post(
        `/curso/licao/${lessonToAddTo.idlicao}/material`,
        data
      );

      setOperationStatus(0);
      setOperationMessage(
        res.data.message || "Conteúdo adicionado com sucesso!"
      );
      setIsAddContentModalOpen(false);
    } catch (err) {
      console.error("Erro ao adicionar conteúdo:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao adicionar o conteúdo."
      );
    } finally {
      setAddingContent(false);
      openResultModal();
    }
  };

  const handleDeleteMaterialClick = (material, idlicao) => {
    setMaterialToDelete(material);
    setMaterialLicaoToDelete(idlicao);
    setIsDeleteMaterialModalOpen(true);
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete || !materialLicaoToDelete) return;
    setDeletingMaterial(true);
    try {
      const res = await api.delete(
        `/curso/licao/${materialLicaoToDelete}/material/${materialToDelete.idmaterial}`
      );
      setOperationStatus(0);
      setOperationMessage(
        res.data.message || "Material eliminado com sucesso!"
      );
      setIsDeleteMaterialModalOpen(false);
    } catch (err) {
      console.error("Erro ao eliminar material:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao eliminar o material."
      );
    } finally {
      setDeletingMaterial(false);
      openResultModal();
    }
  };

  const formatDataForInput = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const getMaterialIcon = (tipo) => {
    switch (tipo) {
      case 1:
        return <i className="ri-slideshow-line me-2"></i>;
      case 2:
        return <i className="ri-file-text-line me-2"></i>;
      case 3:
        return <i className="ri-external-link-line me-2"></i>;
      case 4:
        return <i className="ri-file-excel-line me-2"></i>;
      case 5:
        return <i className="ri-video-line me-2"></i>;
      case 6:
        return <i className="ri-file-zip-line me-2"></i>;
      default:
        return <i className="ri-file-line me-2"></i>;
    }
  };

  // Helpers para apresentar materiais no SubmissionCard
  const resolveMaterialUrl = (m) =>
    m?.url ||
    m?.link ||
    m?.referencia ||
    m?.ficheiro ||
    m?.file ||
    m?.path ||
    null;

  const deriveMaterialType = (m) => {
    if (m?.tipo === 3 || (m?.link && !m?.referencia)) return "Link";
    const url = resolveMaterialUrl(m);
    if (!url) return null;
    const clean = url.split("?")[0].split("#")[0];
    const parts = clean.split(".");
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
    if (!ext || ext.length > 5) return null;
    const map = {
      pdf: "PDF",
      doc: "Word",
      docx: "Word",
      xls: "Excel",
      xlsx: "Excel",
      ppt: "PowerPoint",
      pptx: "PowerPoint",
      mp4: "Vídeo",
      mov: "Vídeo",
      avi: "Vídeo",
      txt: "Texto",
      csv: "CSV",
      zip: "ZIP",
    };
    return map[ext] || ext.toUpperCase();
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
        <div className="alert alert-danger text-center my-5" role="alert">
          {error}
        </div>
        <div className="text-center">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/backoffice/cursos")}
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
        <div className="alert alert-info text-center my-5" role="alert">
          Curso não encontrado.
        </div>
        <div className="text-center">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/backoffice/cursos")}
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
          Editar Curso Assíncrono: {curso.nome}
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
        <h2 className="h5 mb-4">Detalhes do Curso</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="nome" className="form-label">
              Nome do Curso <span className="text-danger">*</span>:
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
            <label htmlFor="iniciodeinscricoes" className="form-label">
              Início das Inscrições <span className="text-danger">*</span>:
            </label>
            <input
              type="datetime-local"
              className="form-control"
              id="iniciodeinscricoes"
              name="iniciodeinscricoes"
              value={formatDataForInput(formData.iniciodeinscricoes)}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="fimdeinscricoes" className="form-label">
              Fim das Inscrições
              {formData.disponivel && <span className="text-danger"> *</span>}:
            </label>
            <input
              type="datetime-local"
              className="form-control"
              id="fimdeinscricoes"
              name="fimdeinscricoes"
              value={formatDataForInput(formData.fimdeinscricoes)}
              onChange={handleChange}
              required={formData.disponivel}
            />
            <div className="form-text">
              {
                "Obrigatório apenas quando 'Disponível para Inscrição' estiver ativo."
              }
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="planocurricular" className="form-label">
              Plano Curricular:
            </label>
            <textarea
              className="form-control"
              id="planocurricular"
              name="planocurricular"
              value={formData.planocurricular}
              onChange={handleChange}
              rows="5"
            ></textarea>
          </div>

          <div className="col-md-6">
            <div className="form-check form-switch mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="disponivel"
                name="disponivel"
                checked={formData.disponivel}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="disponivel">
                Disponível para Inscrição
              </label>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">
              Tópicos <span className="text-danger">*</span>:
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

      {/* Gestão de Lições e Conteúdos (apenas Assíncrono) */}
      <div className="mb-5 p-4 border rounded shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 mb-0">Lições do Curso</h2>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleAddLessonClick}
          >
            <i className="ri-add-line"></i> Adicionar Lição
          </button>
        </div>
        {curso.licoes && curso.licoes.length > 0 ? (
          <ul className="list-group">
            {curso.licoes.map((licao) => (
              <li
                key={licao.idlicao}
                className="list-group-item mb-3 p-3 rounded shadow-sm"
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">{licao.titulo}</h6>
                  <div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteLessonClick(licao)}
                      title="Eliminar Lição"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                      >
                        <path
                          d="M5.755,20.283,4,8H20L18.245,20.283A2,2,0,0,1,16.265,22H7.735A2,2,0,0,1,5.755,20.283ZM21,4H16V3a1,1,0,0,0-1-1H9A1,1,0,0,0,8,3V4H3A1,1,0,0,0,3,6H21a1,1,0,0,0,0-2Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-muted small">{licao.descricao}</p>

                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Materiais</strong>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleAddContentClick(licao)}
                      title="Adicionar Material"
                    >
                      <i className="ri-add-line"></i> Adicionar Material
                    </button>
                  </div>
                  {licao.materiais && licao.materiais.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {licao.materiais.map((material) => {
                        const url = resolveMaterialUrl(material);
                        const type = deriveMaterialType(material);
                        const filename =
                          material.titulo ||
                          (url ? url.split("/").pop() : "Material");
                        const statusLabel = material.link ? "Link" : "Ficheiro";
                        return (
                          <div
                            key={material.idmaterial}
                            className="d-flex align-items-stretch gap-2"
                          >
                            <div className="flex-grow-1">
                              <SubmissionCard
                                filename={filename}
                                type={type}
                                url={url}
                                statusLabel={statusLabel}
                              />
                            </div>
                            <div className="d-flex align-items-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  handleDeleteMaterialClick(
                                    material,
                                    licao.idlicao
                                  )
                                }
                                title="Eliminar Material"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                >
                                  <path
                                    d="M5.755,20.283,4,8H20L18.245,20.283A2,2,0,0,1,16.265,22H7.735A2,2,0,0,1,5.755,20.283ZM21,4H16V3a1,1,0,0,0-1-1H9A1,1,0,0,0,8,3V4H3A1,1,0,0,0,3,6H21a1,1,0,0,0,0-2Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-muted small">
                      Sem materiais para esta lição.
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="alert alert-info text-center">
            Nenhuma lição adicionada ainda.
          </div>
        )}
      </div>

      {/* Modal para Adicionar Lição */}
      <Modal
        isOpen={isAddLessonModalOpen}
        onClose={() => setIsAddLessonModalOpen(false)}
        title="Adicionar Nova Lição"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateLesson();
          }}
        >
          <div className="mb-3">
            <label htmlFor="lessonTitle" className="form-label">
              Título da Lição:
            </label>
            <input
              type="text"
              className="form-control"
              id="lessonTitle"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="lessonDescription" className="form-label">
              Descrição da Lição:
            </label>
            <textarea
              className="form-control"
              id="lessonDescription"
              value={newLessonDescription}
              onChange={(e) => setNewLessonDescription(e.target.value)}
              rows="3"
            ></textarea>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddLessonModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingLesson}
            >
              {addingLesson ? "A Adicionar..." : "Adicionar Lição"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Adicionar Conteúdo a Lição */}
      <Modal
        isOpen={isAddContentModalOpen}
        onClose={() => setIsAddContentModalOpen(false)}
        title={`Adicionar Conteúdo à Lição: ${lessonToAddTo?.titulo}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateContent();
          }}
        >
          <div className="mb-3">
            <label htmlFor="contentTitle" className="form-label">
              Título do Conteúdo:
            </label>
            <input
              type="text"
              className="form-control"
              id="contentTitle"
              value={newContentTitle}
              onChange={(e) => setNewContentTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="contentType" className="form-label">
              Tipo de Conteúdo:
            </label>
            <select
              className="form-select"
              id="contentType"
              value={newContentType}
              onChange={(e) => setNewContentType(e.target.value)}
              required
            >
              <option value="">Selecione o Tipo</option>
              <option value="1">Apresentação (Slides)</option>
              <option value="2">Documento (PDF, Word, etc.)</option>
              <option value="3">Link Externo</option>
              <option value="4">Planilha (Excel)</option>
              <option value="5">Vídeo</option>
              <option value="6">Outro Ficheiro</option>
            </select>
          </div>

          {newContentType === "3" ? (
            <div className="mb-3">
              <label htmlFor="contentLink" className="form-label">
                URL do Link:
              </label>
              <input
                type="url"
                className="form-control"
                id="contentLink"
                value={newContentLink}
                onChange={(e) => setNewContentLink(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="mb-3">
              <label htmlFor="contentFile" className="form-label">
                Ficheiro:
              </label>
              <input
                type="file"
                className="form-control"
                id="contentFile"
                onChange={handleContentFileChange}
                required={!newContentLink && newContentType !== ""}
              />
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddContentModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingContent}
            >
              {addingContent ? "A Adicionar..." : "Adicionar Conteúdo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Eliminação de Lição */}
      <Modal
        isOpen={isDeleteLessonModalOpen}
        onClose={() => setIsDeleteLessonModalOpen(false)}
        title="Confirmar Eliminação de Lição"
      >
        {lessonToDelete && (
          <p>
            Tem a certeza que deseja eliminar a lição{" "}
            <strong>"{lessonToDelete.titulo}"</strong>? Esta ação é irreversível
            e removerá todo o conteúdo associado.
          </p>
        )}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsDeleteLessonModalOpen(false)}
            disabled={deletingLesson}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDeleteLesson}
            disabled={deletingLesson}
          >
            {deletingLesson ? "A Eliminar..." : "Eliminar"}
          </button>
        </div>
      </Modal>

      {/* Modal de Confirmação de Eliminação de Material */}
      <Modal
        isOpen={isDeleteMaterialModalOpen}
        onClose={() => setIsDeleteMaterialModalOpen(false)}
        title="Confirmar Eliminação de Material"
      >
        {materialToDelete && (
          <p>
            Tem a certeza que deseja eliminar o material{" "}
            <strong>"{materialToDelete.titulo}"</strong>?
          </p>
        )}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsDeleteMaterialModalOpen(false)}
            disabled={deletingMaterial}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDeleteMaterial}
            disabled={deletingMaterial}
          >
            {deletingMaterial ? "A Eliminar..." : "Eliminar"}
          </button>
        </div>
      </Modal>

      {/* Modal de Resultado */}
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

export default EditarCursoAssincrono;
