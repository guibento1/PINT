import { useParams } from "react-router-dom";
import React, { useEffect, useState, useContext } from "react";
import api from "@shared/services/axios";
import SubmissionCard from "@shared/components/SubmissionCard";
import "@shared/styles/curso.css";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";
import { SidebarContext } from "../context/SidebarContext";
import { getCursoStatus } from "@shared/utils/cursoStatus";

const CursoAssincrono = () => {
  const { id } = useParams();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { isFormando } = useUserRole();
  const [curso, setCurso] = useState(null);
  const [inscrito, setInscrito] = useState(false);
  const [enrollForbidden, setEnrollForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showAllTopicos, setShowAllTopicos] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [activeTab, setActiveTab] = useState("conteudos");

  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  const maxVisibleTopics = 5;
  const { refreshSubscribedTopics } = useContext(SidebarContext) || {};

  const handleShowMoreTopicos = () => {
    setShowAllTopicos(true);
  };

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
            <p>{operationMessage || "Ocorreu um erro da nossa parte."}</p>
            <p>
              Tente novamente mais tarde. Se o erro persistir, contacte o nosso
              suporte.
            </p>
          </>
        );
      default:
        return <p>Estado da operação desconhecido.</p>;
    }
  };

  const openResultModal = () => {
    setIsResultModalOpen(true);
  };

  const closeResultModal = () => {
    setIsResultModalOpen(false);
    if (operationStatus === 0) {
      setInscrito((prev) => !prev);
    }
    setOperationStatus(null);
    setOperationMessage("");
    if (operationStatus === 0) {
      setInscrito((prev) => {
        if (actionToConfirm === "sair" && prev === true) return false;
        if (actionToConfirm === "inscrever" && prev === false) return true;
        return prev;
      });
    }
  };

  const openConfirmModal = (action) => {
    setActionToConfirm(action);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setActionToConfirm(null);
  };

  const handleConfirmAction = async () => {
    closeConfirmModal();

    if (actionToConfirm === "sair") {
      await executeSairCurso();
    }
  };

  const handleClickInscrever = async () => {
    setLoading(true);
    setOperationStatus(null);
    setOperationMessage("");
    setIsResultModalOpen(false);

    try {
      const res = await api.post(`/curso/${id}/inscrever`);
      setOperationStatus(0);
      setOperationMessage(
        res.data.message || "Inscrição realizada com sucesso!"
      );
      // Atualiza subscrições sem sair da página
      try {
        await refreshSubscribedTopics?.();
      } catch {}
    } catch (err) {
      console.error("Erro na inscrição:", err);
      setOperationStatus(1);
      setInscrito(false);
      if (err?.response?.status === 403) {
        setEnrollForbidden(true);
      }

      if (err.response && err.response.data && err.response.data.message) {
        setOperationMessage(err.response.data.message);
      } else if (err.message) {
        setOperationMessage("Erro de rede: " + err.message);
      } else {
        setOperationMessage(
          "Ocorreu um erro desconhecido ao tentar inscrever-se."
        );
      }
    } finally {
      setLoading(false);
      openResultModal();
    }
  };

  const handleClickSair = () => {
    openConfirmModal("sair");
  };

  const executeSairCurso = async () => {
    setLoading(true);
    setOperationStatus(null);
    setOperationMessage("");
    setIsResultModalOpen(false);

    try {
      const res = await api.post(`/curso/${id}/sair`);
      setOperationStatus(0);
      setOperationMessage(
        res.data.message || "Saída do curso realizada com sucesso!"
      );
    } catch (err) {
      console.error("Erro ao sair do curso:", err);
      setOperationStatus(1);
      setInscrito(true);

      if (err.response && err.response.data && err.response.data.message) {
        setOperationMessage(err.response.data.message);
      } else if (err.message) {
        setOperationMessage("Erro de rede: " + err.message);
      } else {
        setOperationMessage(
          "Ocorreu um erro desconhecido ao tentar sair do curso."
        );
      }
    } finally {
      setLoading(false);
      openResultModal();
    }
  };

  const toggleLessonMaterials = (lessonId) => {
    setExpandedLessonId(expandedLessonId === lessonId ? null : lessonId);
  };

  useEffect(() => {
    const fetchCurso = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/curso/${id}`);
        setCurso(res.data);
        setInscrito(!!res.data?.inscrito);
      } catch (err) {
        console.error("Erro ao carregar dados do curso:", err);
        setCurso(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCurso();
  }, [id]);

  const formatData = (dataStr) => {
    const date = new Date(dataStr);
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    return date.toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Formatação para detalhes (com horas como nos síncronos)
  const formatDataDetalhe = (dataStr) => {
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

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2 text-muted">A carregar curso...</p>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container mt-5">
        <p>Curso não encontrado!</p>
      </div>
    );
  }

  // Status (Pendente/Em curso/Terminado) — usa disponivel e datas de inscrições
  const inicioInscricoes =
    curso?.iniciodeinscricoes ??
    curso?.inicioDeInscricoes ??
    curso?.cursoassincrono?.iniciodeinscricoes ??
    curso?.cursoassincrono?.inicioDeInscricoes;
  const fimInscricoes =
    curso?.fimdeinscricoes ??
    curso?.fimDeInscricoes ??
    curso?.cursoassincrono?.fimdeinscricoes ??
    curso?.cursoassincrono?.fimDeInscricoes;

  const statusColor = getCursoStatus(
    {
      sincrono: false,
      disponivel: curso?.disponivel,
      iniciodeinscricoes: inicioInscricoes,
      fimdeinscricoes: fimInscricoes,
    },
    new Date()
  );
  const hasEnded = statusColor?.key === "terminado";

  // Datas de inscrições (mostrar na UI)

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
                Sim, Sair do Curso
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={getResultModalTitle()}
      >
        {getResultModalBody()}
      </Modal>

      <div className="container mt-5">
        <div className="row g-4 align-items-start">
          {/* Imagem */}
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

          {/* Informações do curso */}
          <div className="col-md-8">
            <h1 className="h3">{curso?.nome}</h1>
            {statusColor && (
              <>
                <span
                  className={`badge ${statusColor.badgeClass} static-button`}
                >
                  {statusColor.label}
                </span>
                <br />
              </>
            )}

            {/* Detalhes do curso — limitar para assíncronos: Tipo, Disponível, Inscrições */}
            <div className="mt-2">
              <p className="mb-2">
                {/* Tipo de curso e Estado */}
                <strong>Tipo de curso:</strong>{" "}
                {curso?.sincrono === true ? "Síncrono" : "Assíncrono"}
                <br />
                <>
                  <strong>Disponível:</strong>{" "}
                  {statusColor?.key === "em_curso" ? (
                    <span className="badge bg-primary">Sim</span>
                  ) : (
                    <span className="badge bg-danger">Não</span>
                  )}
                  <br />
                </>
                {(inicioInscricoes || fimInscricoes) && (
                  <>
                    <strong>Inscrições:</strong>{" "}
                    {inicioInscricoes
                      ? formatDataDetalhe(inicioInscricoes)
                      : "—"}
                    {fimInscricoes
                      ? ` até ${formatDataDetalhe(fimInscricoes)}`
                      : ""}
                    <br />
                  </>
                )}
              </p>
            </div>

            {!isFormando ? (
              <div className="alert alert-warning p-2 small mt-3">
                Não tem papel de formando contacte os serviços administrativos
                para o receber e proceder á inscrição ou aceder aos recursos
                caso alguma vez tivesse o papel e estivesse incrito.
              </div>
            ) : !inscrito ? (
              <>
                {!hasEnded ? (
                  <>
                    <button
                      onClick={handleClickInscrever}
                      className="btn btn-sm btn-primary"
                      disabled={loading}
                    >
                      {loading && operationStatus === null
                        ? "A inscrever..."
                        : "Inscrever"}
                    </button>
                  </>
                ) : (
                  <div className="alert alert-warning p-2 small mt-3">
                    Curso terminado ou indisponível. Inscrições encerradas.
                  </div>
                )}
                {enrollForbidden && (
                  <div className="alert alert-warning p-2 small mt-3">
                    Não pode se inscrever neste curso.
                  </div>
                )}
              </>
            ) : (
              <div className="mt-3 d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <ul className="nav nav-pills small mb-0">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          activeTab === "conteudos"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setActiveTab("conteudos")}
                        disabled={hasEnded}
                      >
                        Conteúdos
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={handleClickSair}
                    className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3 ms-auto"
                    disabled={loading}
                  >
                    {loading && operationStatus === null
                      ? "A sair..."
                      : "Sair do Curso"}
                  </button>
                </div>
                {hasEnded && (
                  <div className="alert alert-warning p-2 small mb-0">
                    O curso terminou. Os conteúdos ficam indisponíveis até ser
                    reativado.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 row g-4">
          {curso?.topicos?.length > 0 && (
            <div className="col-12 m">
              <h2 className="h4 mb-3">Tópicos:</h2>
              <div className="d-flex flex-wrap gap-2">
                {curso.topicos
                  .slice(
                    0,
                    showAllTopicos ? curso.topicos.length : maxVisibleTopics
                  )
                  .map((topico) => (
                    <div
                      key={topico.idtopico}
                      className="btn btn-primary static-button"
                    >
                      {topico.designacao}
                    </div>
                  ))}
              </div>
              {!showAllTopicos && curso.topicos.length > maxVisibleTopics && (
                <button
                  onClick={handleShowMoreTopicos}
                  className="btn btn-link mt-2"
                >
                  Mostrar mais
                </button>
              )}
              {showAllTopicos && curso.topicos.length > maxVisibleTopics && (
                <button
                  onClick={() => setShowAllTopicos(false)}
                  className="btn btn-link mt-2"
                >
                  Mostrar menos
                </button>
              )}
            </div>
          )}
        </div>

        {/* Plano Curricular */}
        {curso?.planocurricular && (
          <div className="row g-4 mt-1">
            <div className="col-12">
              <div
                className="border rounded p-3 bg-light-subtle"
                style={{
                  maxWidth: "100%",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                <h2 className="h5 mb-2">Plano Curricular</h2>
                <p
                  className="mb-0"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {curso.planocurricular}
                </p>
              </div>
            </div>
          </div>
        )}

        {inscrito && !hasEnded && activeTab === "conteudos" && (
          <div className="mt-5">
            <h2 className="h4 mb-3">Lições:</h2>
            {curso?.licoes?.length > 0 ? (
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
                      <h5 className="mb-1">{licao.titulo}</h5>
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
                        <p>{licao.descricao}</p>
                        {Array.isArray(licao.materiais) &&
                        licao.materiais.length > 0 ? (
                          <div>
                            <h6>Materiais :</h6>
                            <div className="mt-2 d-flex flex-column gap-2">
                              {licao.materiais.map((material, idx) => {
                                const url =
                                  material?.referencia ||
                                  material?.url ||
                                  material?.link;
                                const name =
                                  material?.titulo ||
                                  material?.nome ||
                                  `Material ${idx + 1}`;
                                const isPdf =
                                  String(name).toLowerCase().endsWith(".pdf") ||
                                  String(url || "")
                                    .toLowerCase()
                                    .endsWith(".pdf");
                                return (
                                  <SubmissionCard
                                    key={
                                      material?.idmaterial ||
                                      material?.id ||
                                      idx
                                    }
                                    filename={name}
                                    type={isPdf ? "application/pdf" : undefined}
                                    date={undefined}
                                    url={url}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p>Nenhum material disponível para esta lição.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>Nenhuma lição disponível para este curso.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CursoAssincrono;
