import { useParams } from "react-router-dom";
import React, { useEffect, useState, useCallback } from "react";
import api from "@shared/services/axios";
import "@shared/styles/curso.css";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";

const CursoSincrono = () => {
  const { id } = useParams();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { isFormador } = useUserRole();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inscrito, setInscrito] = useState(false);
  const [operationStatus, setOperationStatus] = useState(null); 
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null); 

  const [activeTab, setActiveTab] = useState("overview"); 
  const [expandedLessonId, setExpandedLessonId] = useState(null);

  const [newLessonTitulo, setNewLessonTitulo] = useState("");
  const [newLessonDescricao, setNewLessonDescricao] = useState("");
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingLessonTitulo, setEditingLessonTitulo] = useState("");
  const [editingLessonDescricao, setEditingLessonDescricao] = useState("");

  const [newSessaoData, setNewSessaoData] = useState("");
  const [newSessaoInicio, setNewSessaoInicio] = useState("");
  const [newSessaoFim, setNewSessaoFim] = useState("");
  const [newSessaoTitulo, setNewSessaoTitulo] = useState("");


  const [newMaterialTitulo, setNewMaterialTitulo] = useState("");
  const [newMaterialLink, setNewMaterialLink] = useState("");
  const [newMaterialTipo, setNewMaterialTipo] = useState("1");
  const [targetLessonForMaterial, setTargetLessonForMaterial] = useState(null);

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
  };
  const openConfirmModal = (action) => {
    setActionToConfirm(action);
    setIsConfirmModalOpen(true);
  };
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setActionToConfirm(null);
  };

  const isFormadorDoCurso = isFormador && (curso?.formador == user?.id) ;

  const fetchCurso = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/curso/${id}`);
      setCurso(res.data);
      setInscrito(!!res.data?.inscrito);
    } catch (err) {
      console.error("Erro ao obter curso síncrono:", err);
      setCurso(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    console.log(curso);
    fetchCurso();
  }, [fetchCurso]);


  const handleClickInscrever = async () => {
    setLoading(true);
    setOperationStatus(null);
    setOperationMessage("");
    try {
      const res = await api.post(`/curso/${id}/inscrever`);
      setOperationStatus(0);
      setOperationMessage(res.data.message || "Inscrição realizada.");
      setInscrito(true);
    } catch (err) {
      console.error("Erro inscrição:", err);
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.message || "Falha na inscrição."
      );
    } finally {
      setLoading(false);
      openResultModal();
    }
  };
  const executeSairCurso = async () => {
    setLoading(true);
    setOperationStatus(null);
    setOperationMessage("");
    try {
      const res = await api.post(`/curso/${id}/sair`);
      setOperationStatus(0);
      setOperationMessage(res.data.message || "Saída realizada.");
      setInscrito(false);
    } catch (err) {
      console.error("Erro saída:", err);
      setOperationStatus(1);
      setOperationMessage("Falha ao sair.");
    } finally {
      setLoading(false);
      openResultModal();
    }
  };
  const handleConfirmAction = async () => {
    closeConfirmModal();
    if (actionToConfirm === "sair") await executeSairCurso();
  };

 
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!newLessonTitulo.trim()) return;
    try {
      await api.post(`/curso/${id}/licao`, {
        titulo: newLessonTitulo,
        descricao: newLessonDescricao,
      });
      setNewLessonTitulo("");
      setNewLessonDescricao("");
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Lição adicionada.");
      openResultModal();
    } catch (err) {
      console.error("Erro adicionar lição:", err);
      setOperationStatus(1);
      setOperationMessage("Erro ao adicionar lição.");
      openResultModal();
    }
  };
  const startEditLesson = (l) => {
    setEditingLessonId(l.idlicao);
    setEditingLessonTitulo(l.titulo);
    setEditingLessonDescricao(l.descricao || "");
  };
  const cancelEditLesson = () => {
    setEditingLessonId(null);
    setEditingLessonTitulo("");
    setEditingLessonDescricao("");
  };
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!editingLessonId) return;
    try {
      await api.put(`/licao/${editingLessonId}`, {
        titulo: editingLessonTitulo,
        descricao: editingLessonDescricao,
      });
      cancelEditLesson();
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Lição atualizada.");
      openResultModal();
    } catch (err) {
      console.error("Erro atualizar lição:", err);
      setOperationStatus(1);
      setOperationMessage("Erro ao atualizar lição.");
      openResultModal();
    }
  };
  const handleDeleteLesson = async (idLicao) => {
    try {
      await api.delete(`/licao/${idLicao}`);
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Lição removida.");
    } catch (err) {
      console.error("Erro remover lição:", err);
      setOperationStatus(1);
      setOperationMessage("Erro ao remover.");
    } finally {
      openResultModal();
    }
  };

  
  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (
      !targetLessonForMaterial ||
      !newMaterialTitulo.trim() ||
      !newMaterialLink.trim()
    )
      return;
    try {
      await api.post(`/licao/${targetLessonForMaterial}/material`, {
        titulo: newMaterialTitulo,
        referencia: newMaterialLink,
        tipo: newMaterialTipo,
      });
      setNewMaterialTitulo("");
      setNewMaterialLink("");
      setNewMaterialTipo("1");
      setTargetLessonForMaterial(null);
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Material adicionado.");
    } catch (err) {
      console.error("Erro material:", err);
      setOperationStatus(1);
      setOperationMessage("Erro ao adicionar material.");
    } finally {
      openResultModal();
    }
  };

 
  const handleAddSessao = async (e) => {
    e.preventDefault();
    if (!newSessaoData || !newSessaoInicio || !newSessaoFim) return;
    try {
      await api.post(`/curso/${id}/sessao`, {
        data: newSessaoData,
        horainicio: newSessaoInicio,
        horafim: newSessaoFim,
        titulo: newSessaoTitulo || "Sessão",
      });
      setNewSessaoData("");
      setNewSessaoInicio("");
      setNewSessaoFim("");
      setNewSessaoTitulo("");
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Sessão agendada.");
    } catch (err) {
      console.error("Erro agendar sessão:", err);
      setOperationStatus(1);
      setOperationMessage("Erro ao agendar sessão.");
    } finally {
      openResultModal();
    }
  };
  const handleDeleteSessao = async (sessaoId) => {
    try {
      await api.delete(`/sessao/${sessaoId}`);
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Sessão removida.");
    } catch (err) {
      console.error("Erro rem sessão:", err);
      setOperationStatus(1);
      setOperationMessage("Erro ao remover sessão.");
    } finally {
      openResultModal();
    }
  };

  const toggleLessonMaterials = (lessonId) =>
    setExpandedLessonId(expandedLessonId === lessonId ? null : lessonId);

  const formatData = (dataStr) => {
    const date = new Date(dataStr);
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleString("pt-PT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMaterialIcon = (tipo) => {
    switch (tipo) {
      case "1":
        return <i className="ri-slideshow-line me-2"></i>;
      case "2":
        return <i className="ri-file-text-line me-2"></i>;
      case "3":
        return <i className="ri-external-link-line me-2"></i>;
      case "4":
        return <i className="ri-file-excel-line me-2"></i>;
      default:
        return <i className="ri-file-line me-2"></i>;
    }
  };

  if (loading)
    return (
      <div className="container mt-5">
        <p>A carregar curso...</p>
      </div>
    );
  if (!curso)
    return (
      <div className="container mt-5">
        <p>Curso não encontrado!</p>
      </div>
    );

  return (
    <>
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        title="Confirmação"
      >
        {actionToConfirm === "sair" && (
          <>
            <p>Tem certeza que deseja sair deste curso?</p>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeConfirmModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmAction}
              >
                Sim, Sair
              </button>
            </div>
          </>
        )}
      </Modal>
      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={
          operationStatus === 0
            ? "Sucesso"
            : operationStatus === 1
            ? "Erro"
            : "Info"
        }
      >
        <p className="mb-0">{operationMessage || "Operação concluída."}</p>
      </Modal>

      <div className="container mt-5">
        <div className="row g-4 align-items-start">
          <div className="col-md-4">
            <img
              src={
                curso?.thumbnail ||
                "https://placehold.co/300x180.png?text=TheSoftskills"
              }
              alt={curso?.nome}
              className="img-fluid rounded shadow-sm"
            />
          </div>
          <div className="col-md-8">
            <h1 className="h3">{curso?.nome}</h1>
            {curso?.disponivel === false && (
              <>
                <div className="btn btn-primary static-button">Arquivado</div>
                <br />
              </>
            )}

            {isFormadorDoCurso ? (
              <ul className="nav nav-pills small my-3">
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "overview" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Visão Geral
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "manage-lessons" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("manage-lessons")}
                  >
                    Gerir Aulas
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "schedule" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("schedule")}
                  >
                    Agenda
                  </button>
                </li>
              </ul>
            ) : !inscrito ? (
              <div className="mt-3">
                <p className="mb-3">
                  <strong>Inscrições:</strong>{" "}
                  {formatData(curso?.iniciodeinscricoes)} até{" "}
                  {formatData(curso?.fimdeinscricoes)}
                  <br />
                  {curso?.maxinscricoes && (
                    <>
                      <strong>Máx. inscrições:</strong> {curso?.maxinscricoes}
                      <br />
                    </>
                  )}
                </p>
                <button
                  onClick={handleClickInscrever}
                  className="btn btn-sm btn-primary"
                  disabled={loading}
                >
                  {loading ? "A inscrever..." : "Inscrever"}
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <button
                  onClick={() => openConfirmModal("sair")}
                  className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3"
                  disabled={loading}
                >
                  {loading ? "A sair..." : "Sair do Curso"}
                </button>
                {curso?.planocurricular && (
                  <p className="mt-4">
                    <strong>Plano Curricular:</strong>
                    <br />
                    {curso?.planocurricular}
                  </p>
                )}
              </div>
            )}

            {isFormadorDoCurso &&
              activeTab === "overview" &&
              curso?.planocurricular && (
                <p className="mt-3">
                  <strong>Plano Curricular:</strong>
                  <br />
                  {curso.planocurricular}
                </p>
              )}

            {isFormadorDoCurso && activeTab === "manage-lessons" && (
              <div className="mt-3">
                <h5 className="mb-3">Adicionar Lição</h5>
                <form onSubmit={handleAddLesson} className="mb-4">
                  <div className="mb-2">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Título"
                      value={newLessonTitulo}
                      onChange={(e) => setNewLessonTitulo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Descrição (opcional)"
                      value={newLessonDescricao}
                      onChange={(e) => setNewLessonDescricao(e.target.value)}
                    ></textarea>
                  </div>
                  <button className="btn btn-sm btn-primary" type="submit">
                    Guardar
                  </button>
                </form>
                <h5 className="mb-2">Lições</h5>
                {curso?.licoes?.length ? (
                  <ul className="list-group small mb-4">
                    {curso.licoes.map((l) => (
                      <li
                        key={l.idlicao}
                        className="list-group-item d-flex flex-column gap-2"
                      >
                        {editingLessonId === l.idlicao ? (
                          <form onSubmit={handleSaveLesson} className="w-100">
                            <input
                              className="form-control form-control-sm mb-1"
                              value={editingLessonTitulo}
                              onChange={(e) =>
                                setEditingLessonTitulo(e.target.value)
                              }
                              required
                            />
                            <textarea
                              className="form-control form-control-sm mb-2"
                              rows={2}
                              value={editingLessonDescricao}
                              onChange={(e) =>
                                setEditingLessonDescricao(e.target.value)
                              }
                            />
                            <div className="d-flex gap-2">
                              <button
                                type="submit"
                                className="btn btn-sm btn-success"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={cancelEditLesson}
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="d-flex justify-content-between align-items-start w-100">
                            <div>
                              <strong>{l.titulo}</strong>
                              {l.descricao && (
                                <p className="mb-0 small text-muted">
                                  {l.descricao}
                                </p>
                              )}
                              {l.materiais?.length > 0 && (
                                <ul className="mt-1 mb-0 ps-3 small">
                                  {l.materiais.map((m) => (
                                    <li key={m.idmaterial}>
                                      {getMaterialIcon(m.tipo)}
                                      <a
                                        href={m.referencia}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {m.titulo}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => startEditLesson(l)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteLesson(l.idlicao)}
                              >
                                Remover
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  setTargetLessonForMaterial(l.idlicao)
                                }
                              >
                                +Material
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">Sem lições ainda.</p>
                )}

                {targetLessonForMaterial && (
                  <div className="border rounded p-3 bg-light-subtle mb-4">
                    <h6 className="mb-2">
                      Adicionar Material à Lição #{targetLessonForMaterial}
                    </h6>
                    <form
                      onSubmit={handleAddMaterial}
                      className="row g-2 align-items-end"
                    >
                      <div className="col-md-3">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Título"
                          value={newMaterialTitulo}
                          onChange={(e) => setNewMaterialTitulo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Link"
                          value={newMaterialLink}
                          onChange={(e) => setNewMaterialLink(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <select
                          className="form-select form-select-sm"
                          value={newMaterialTipo}
                          onChange={(e) => setNewMaterialTipo(e.target.value)}
                        >
                          <option value="1">Slides</option>
                          <option value="2">Texto</option>
                          <option value="3">Link</option>
                          <option value="4">Excel</option>
                        </select>
                      </div>
                      <div className="col-md-3 d-flex gap-2">
                        <button
                          type="submit"
                          className="btn btn-sm btn-primary"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setTargetLessonForMaterial(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {isFormadorDoCurso && activeTab === "schedule" && (
              <div className="mt-3">
                <h5 className="mb-3">Agenda de Sessões Síncronas</h5>
                <form
                  onSubmit={handleAddSessao}
                  className="row g-2 align-items-end mb-4"
                >
                  <div className="col-md-3">
                    <label className="form-label form-label-sm mb-1 small">
                      Data
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={newSessaoData}
                      onChange={(e) => setNewSessaoData(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label form-label-sm mb-1 small">
                      Início
                    </label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={newSessaoInicio}
                      onChange={(e) => setNewSessaoInicio(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label form-label-sm mb-1 small">
                      Fim
                    </label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={newSessaoFim}
                      onChange={(e) => setNewSessaoFim(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label form-label-sm mb-1 small">
                      Título
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newSessaoTitulo}
                      onChange={(e) => setNewSessaoTitulo(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="col-md-2 d-flex">
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary w-100"
                    >
                      Agendar
                    </button>
                  </div>
                </form>
                <h6 className="mb-2">Sessões Agendadas</h6>
                {curso?.sessoes?.length ? (
                  <ul className="list-group small">
                    {curso.sessoes.map((s) => (
                      <li
                        key={s.idsessao || s.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{s.titulo || "Sessão"}</strong>
                          <br />
                          <span className="text-muted">
                            {formatData(`${s.data}T${s.horainicio}`)} -{" "}
                            {s.horafim}
                          </span>
                        </div>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            type="button"
                            onClick={() =>
                              handleDeleteSessao(s.idsessao || s.id)
                            }
                          >
                            Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">Nenhuma sessão agendada.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Public section for enrolled/formador: list lessons & materials (overview tab or enrolled user) */}
        {(inscrito || isFormadorDoCurso) && (
          <div className="mt-5">
            <h2 className="h5">Lições e Materiais</h2>
            {curso?.licoes?.length ? (
              <div className="list-group">
                {curso.licoes.map((licao) => (
                  <div
                    key={licao.idlicao}
                    className="list-group-item list-group-item-action mb-2 rounded shadow-sm"
                  >
                    <div
                      className="d-flex justify-content-between align-items-center"
                      onClick={() => toggleLessonMaterials(licao.idlicao)}
                      style={{ cursor: "pointer" }}
                    >
                      <h6 className="mb-0">{licao.titulo}</h6>
                      <small className="text-muted">
                        <i
                          className={`ri-arrow-${
                            expandedLessonId === licao.idlicao ? "up" : "down"
                          }-s-line`}
                        ></i>
                      </small>
                    </div>
                    {expandedLessonId === licao.idlicao && (
                      <div className="mt-3">
                        {licao.descricao && (
                          <p className="mb-2 small">{licao.descricao}</p>
                        )}
                        {licao.materiais?.length ? (
                          <ul className="list-unstyled small mb-0">
                            {licao.materiais.map((m) => (
                              <li key={m.idmaterial} className="mb-1">
                                {getMaterialIcon(m.tipo)}
                                <a
                                  href={m.referencia}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-decoration-none"
                                >
                                  {m.titulo}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="small mb-0">Sem materiais.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>Nenhuma lição disponível.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CursoSincrono;
