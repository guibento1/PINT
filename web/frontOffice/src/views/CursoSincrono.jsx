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

  // Estado de operações
  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  // Tabs (apenas overview + agenda agora)
  const [activeTab, setActiveTab] = useState("overview");

  // Sessões (sincrono)
  const [newSessaoData, setNewSessaoData] = useState("");
  const [newSessaoInicio, setNewSessaoInicio] = useState("");
  const [newSessaoFim, setNewSessaoFim] = useState("");
  const [newSessaoTitulo, setNewSessaoTitulo] = useState("");

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

  const isFormadorDoCurso =
    isFormador &&
    (curso?.souFormador === true ||
      (Array.isArray(curso?.formadores) &&
        curso.formadores.some(
          (f) => f.idutilizador === user?.id || f.id === user?.id
        )));

  // Carregar curso
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
    fetchCurso();
  }, [fetchCurso]);

  // Inscrição
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

  // Sessões (usar endpoints sincronos: POST /sessao/:idcursosinc  | DELETE /sessao/:idsessao)
  const handleAddSessao = async (e) => {
    e.preventDefault();
    if (!newSessaoData || !newSessaoInicio || !newSessaoFim) return;
    try {
      await api.post(`/sessao/${id}`, {
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
      console.error("Erro remover sessão:", err);
      setOperationStatus(1);
      setOperationMessage("Erro ao remover sessão.");
    } finally {
      openResultModal();
    }
  };

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
                        {isFormadorDoCurso && (
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
                        )}
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

        {/* Área pública (inscrito ou formador) – lista de sessões */}
        {(inscrito || isFormadorDoCurso) && (
          <div className="mt-5">
            <h2 className="h5">Sessões</h2>
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
                        {formatData(`${s.data}T${s.horainicio}`)} - {s.horafim}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma sessão disponível.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CursoSincrono;
