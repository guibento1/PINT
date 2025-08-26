import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState, useCallback } from "react";
import api from "@shared/services/axios";
import "@shared/styles/curso.css";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";

const CursoSincrono = () => {
  const { id } = useParams();
  const navigate = useNavigate(); 
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
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

  const [sessaoTitulo, setSessaoTitulo] = useState("");
  const [sessaoDescricao, setSessaoDescricao] = useState("");
  const [sessaoLink, setSessaoLink] = useState("");
  const [sessaoDataHora, setSessaoDataHora] = useState(""); // datetime-local
  const [sessaoDuracao, setSessaoDuracao] = useState("");
  const [sessaoPlataforma, setSessaoPlataforma] = useState("");

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

  // id do papel de formador (formador.id) não é o idutilizador
  const idFormadorRole = user?.roles?.find((r) => r.role === "formador")?.id;
  const isFormadorDoCurso =
    !!idFormadorRole && curso?.formador === idFormadorRole && isFormador;

  // Carregar curso
  const fetchCurso = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/curso/${id}`);
      setCurso(res.data);
      setInscrito(!!res.data?.inscrito);
    } catch (err) {
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
      await fetchCurso();
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(err?.response?.data?.error || "Falha na inscrição.");
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
      await fetchCurso();
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(err?.response?.data?.error || "Falha ao sair.");
    } finally {
      setLoading(false);
      openResultModal();
    }
  };
  const handleConfirmAction = async () => {
    closeConfirmModal();
    if (actionToConfirm === "sair") await executeSairCurso();
  };

  // Criar sessão usando idcrono (id do cursosincrono) e campos corretos
  const handleAddSessao = async (e) => {
    e.preventDefault();
    if (!curso?.idcrono) {
      setOperationStatus(1);
      setOperationMessage("ID do curso síncrono não carregado.");
      openResultModal();
      return;
    }
    if (
      !sessaoTitulo ||
      !sessaoDescricao ||
      !sessaoLink ||
      !sessaoDataHora ||
      !sessaoDuracao ||
      !sessaoPlataforma
    ) {
      setOperationStatus(1);
      setOperationMessage("Preencha todos os campos da sessão.");
      openResultModal();
      return;
    }
    try {
      await api.post(`/sessao/${curso.idcrono}`, {
        titulo: sessaoTitulo,
        descricao: sessaoDescricao,
        linksessao: sessaoLink,
        datahora: sessaoDataHora,
        duracaohoras: Number(sessaoDuracao),
        plataformavideoconferencia: sessaoPlataforma,
      });
      setSessaoTitulo("");
      setSessaoDescricao("");
      setSessaoLink("");
      setSessaoDataHora("");
      setSessaoDuracao("");
      setSessaoPlataforma("");
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Sessão criada.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao criar sessão."
      );
    } finally {
      openResultModal();
    }
  };
  const handleDeleteSessao = async (idsessao) => {
    try {
      await api.delete(`/sessao/${idsessao}`);
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Sessão removida.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao remover sessão."
      );
    } finally {
      openResultModal();
    }
  };

  const formatDataHora = (dt) => {
    if (!dt) return "";
    const date = new Date(dt);
    if (isNaN(date.getTime())) return dt;
    return date.toLocaleString("pt-PT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatData = (dataStr) => {
    if (!dataStr) return "";
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
              <div className="d-flex align-items-center my-3 flex-wrap gap-2">
                <ul className="nav nav-pills small">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "overview" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("overview")}
                    >
                      Visão Geral
                    </button>
                  </li>{" "}
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
                <button
                  type="button"
                  className={`btn ${isFormadorDoCurso ? "btn-primary ms-auto" : "btn-outline-primary"}`}
                  onClick={() => navigate(`/editar/curso-sincrono/${id}`)}
                >
                  Editar Curso
                </button>
              </div>
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
                      Título
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={sessaoTitulo}
                      onChange={(e) => setSessaoTitulo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label form-label-sm mb-1 small">
                      Descrição
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={sessaoDescricao}
                      onChange={(e) => setSessaoDescricao(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label form-label-sm mb-1 small">
                      Data/Hora
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-sm"
                      value={sessaoDataHora}
                      onChange={(e) => setSessaoDataHora(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-1">
                    <label className="form-label form-label-sm mb-1 small">
                      Duração (h)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      className="form-control form-control-sm"
                      value={sessaoDuracao}
                      onChange={(e) => setSessaoDuracao(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label form-label-sm mb-1 small">
                      Plataforma
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={sessaoPlataforma}
                      onChange={(e) => setSessaoPlataforma(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label form-label-sm mb-1 small">
                      Link Sessão
                    </label>
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      value={sessaoLink}
                      onChange={(e) => setSessaoLink(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-2 d-flex">
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? "A guardar..." : "Agendar"}
                    </button>
                  </div>
                </form>
                <h6 className="mb-2">Sessões Agendadas</h6>
                {curso?.sessoes?.length ? (
                  <ul className="list-group small">
                    {curso.sessoes.map((s) => (
                      <li
                        key={s.idsessao}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{s.titulo}</strong>
                          <br />
                          <span className="text-muted">
                            {formatDataHora(s.datahora)} ({s.duracaohoras}h) -{" "}
                            {s.plataformavideoconferencia}
                          </span>
                          <br />
                          {s.linksessao && (
                            <a
                              href={s.linksessao}
                              target="_blank"
                              rel="noreferrer"
                              className="small"
                            >
                              Aceder
                            </a>
                          )}
                        </div>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            type="button"
                            onClick={() => handleDeleteSessao(s.idsessao)}
                            disabled={loading}
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

        {(inscrito || isFormadorDoCurso) && curso?.sessoes?.length > 0 && (
          <div className="mt-5">
            <h2 className="h5">Sessões</h2>
            <ul className="list-group small">
              {curso.sessoes.map((s) => (
                <li
                  key={s.idsessao}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{s.titulo}</strong>
                    <br />
                    <span className="text-muted">
                      {formatDataHora(s.datahora)} ({s.duracaohoras}h)
                    </span>
                    {s.linksessao && (
                      <>
                        <br />
                        <a href={s.linksessao} target="_blank" rel="noreferrer">
                          Link
                        </a>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default CursoSincrono;
