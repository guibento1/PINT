import { useParams, useNavigate } from "react-router-dom";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  const [submittingId, setSubmittingId] = useState(null);
  const [studentUploads, setStudentUploads] = useState({}); // { [idavaliacao]: { url?, nome?, nota? } }
  const [avaliacoesRemote, setAvaliacoesRemote] = useState(null);
  const [showAllTopicos, setShowAllTopicos] = useState(false);
  // Materiais de sessão são geridos em /Criar/Agendar; aqui apenas leitura
  const maxVisibleTopics = 5;

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

  const handleShowMoreTopicos = () => setShowAllTopicos(true);

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

  // gestão de sessões movida para a página Agendar.jsx

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

  // Student-centric helpers
  const avaliacoesContinuas = useMemo(() => {
    if (Array.isArray(avaliacoesRemote) && avaliacoesRemote.length) {
      return avaliacoesRemote;
    }
    const d = curso || {};
    return (
      (Array.isArray(d.avaliacaocontinua) && d.avaliacaocontinua) ||
      (Array.isArray(d.avaliacoes) && d.avaliacoes) ||
      (Array.isArray(d.avaliacoesContinuas) && d.avaliacoesContinuas) ||
      []
    );
  }, [curso, avaliacoesRemote]);

  const getAvaliacaoWindow = (av) => {
    const inicioDisp = av?.inicioDisponibilidade || av?.iniciodisponibilidade;
    const inicioSub = av?.inicioDeSubmissoes || av?.iniciodesubmissoes;
    const fimSub = av?.fimDeSubmissoes || av?.fimdesubmissoes || av?.deadline;
    return { inicioDisp, inicioSub, fimSub };
  };

  const now = useMemo(() => new Date(), [curso]);
  const isBefore = (d) => {
    if (!d) return false;
    const dt = new Date(d);
    return !isNaN(dt.getTime()) && now < dt;
  };
  const isAfter = (d) => {
    if (!d) return false;
    const dt = new Date(d);
    return !isNaN(dt.getTime()) && now > dt;
  };

  // Finals: try to detect student's grade from course payload
  const resolveUserId = useMemo(() => {
    return (
      user?.idformando || user?.idutilizador || user?.utilizador || user?.id
    );
  }, [user]);
  // moved studentFinal below currentFormandoId

  // Resolve current formando ID from inscritos for accurate matching
  const inscritosList = useMemo(() => {
    const d = curso || {};
    return (
      (Array.isArray(d.inscritos) && d.inscritos) ||
      (Array.isArray(d.participantes) && d.participantes) ||
      (Array.isArray(d.alunos) && d.alunos) ||
      (Array.isArray(d.formandos) && d.formandos) ||
      []
    );
  }, [curso]);
  const myInscricao = useMemo(() => {
    const uid =
      user?.idutilizador || user?.utilizador || user?.userId || user?.id;
    const email = user?.email;
    return (
      inscritosList.find(
        (p) =>
          String(p?.idutilizador ?? p?.utilizador ?? p?.userId ?? p?.id) ===
            String(uid) ||
          (email && p?.email === email)
      ) || null
    );
  }, [inscritosList, user]);
  const currentFormandoId = useMemo(() => {
    return (
      myInscricao?.idformando ||
      myInscricao?.formando ||
      myInscricao?.id ||
      user?.idformando ||
      resolveUserId
    );
  }, [myInscricao, user, resolveUserId]);

  // Nota final do formando (só leitura)
  const studentFinal = useMemo(() => {
    const d = curso || {};
    const targetId = currentFormandoId || resolveUserId;

    if (!d) return null;

    // Campos diretos por formando
    const mineDirect =
      d.minhaAvaliacaoFinal ||
      d.minhaavaliacaofinal ||
      d.notaFinal ||
      d.avaliacaofinal;
    if (mineDirect != null) {
      if (typeof mineDirect === "object") {
        const n =
          mineDirect.nota ?? mineDirect.classificacao ?? mineDirect.valor;
        if (n != null) return { nota: n };
      } else {
        return { nota: mineDirect };
      }
    }

    // Arrays de finais
    const arrs = [
      d.avaliacoesFinais,
      d.avaliacoesfinal,
      d.finais,
      d.final,
      d.avaliacaofinal,
    ];
    for (const arr of arrs) {
      if (Array.isArray(arr)) {
        const found = arr.find((it) => {
          const fid =
            it?.idformando ??
            it?.formando ??
            it?.idutilizador ??
            it?.utilizador ??
            it?.id;

          return targetId != null && String(fid) === String(targetId);
        });
        if (found) {
          const n =
            found.nota ?? found.classificacao ?? found.valor ?? found.resultado;
          if (n != null) return { nota: n };
        }
      }
    }

    // Objetos mapeados por id
    const maps = [d.avaliacaofinal, d.finais];
    for (const m of maps) {
      if (m && !Array.isArray(m) && typeof m === "object") {
        const v = m?.[targetId] ?? m?.[String(targetId)];
        if (v != null) {
          if (typeof v === "object")
            return { nota: v.nota ?? v.classificacao ?? v.valor };
          return { nota: v };
        }
      }
    }

    // Derivar da própria inscrição (myInscricao) ou do inscrito correspondente
    const candidate = myInscricao;
    const base =
      candidate?.formando ||
      candidate?.user ||
      candidate?.utilizador ||
      candidate;
    const notaFromEntryTop =
      candidate?.notaFinal ??
      candidate?.nota ??
      candidate?.avaliacaofinal ??
      candidate?.avaliacaoFinal ??
      candidate?.classificacaoFinal ??
      candidate?.classificacao;
    const notaFromEntryObj =
      (typeof candidate?.avaliacaofinal === "object" &&
        candidate?.avaliacaofinal !== null &&
        (candidate?.avaliacaofinal?.nota ??
          candidate?.avaliacaofinal?.classificacao)) ||
      (typeof candidate?.avaliacaoFinal === "object" &&
        candidate?.avaliacaoFinal !== null &&
        (candidate?.avaliacaoFinal?.nota ??
          candidate?.avaliacaoFinal?.classificacao)) ||
      (typeof candidate?.final === "object" &&
        candidate?.final !== null &&
        (candidate?.final?.nota ?? candidate?.final?.classificacao));
    const notaFromBase =
      base?.notaFinal ??
      base?.nota ??
      base?.avaliacaofinal ??
      base?.avaliacaoFinal ??
      base?.classificacaoFinal ??
      base?.classificacao;
    const notaDerived = notaFromEntryObj ?? notaFromEntryTop ?? notaFromBase;
    if (notaDerived != null) return { nota: notaDerived };

    return null;
  }, [curso, resolveUserId, currentFormandoId, myInscricao]);

  // Evitar chamadas extra: confiar no payload de /curso/:id para nota final

  // Evitar chamada às submissões: usar apenas os campos embebidos no payload

  // No per-formando GET for finals to avoid 404; rely on course payload

  const handleSubmitContinuo = async (idavaliacao, file, isUpdate = false) => {
    if (!file) return;
    setSubmittingId(idavaliacao);
    setOperationStatus(null);
    setOperationMessage("");
    try {
      const fd = new FormData();
      // Try common field names
      fd.append("ficheiro", file);
      fd.append("resolucao", file);
      // Prefer the cronograma id (idcrono) when calling cursosincrono endpoints
      const cronId = curso?.idcrono || id;
      // Correct endpoint path spelling: avaliacaocontinua
      const url = `/curso/cursosincrono/${cronId}/avaliacaocontinua/${idavaliacao}/submeter`;
      if (isUpdate)
        await api.put(url, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      else
        await api.post(url, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      // Keep local marker so UI shows submitted
      setStudentUploads((prev) => ({
        ...prev,
        [idavaliacao]: { submitted: true },
      }));
      setOperationStatus(0);
      setOperationMessage(
        isUpdate ? "Submissão atualizada." : "Submissão enviada."
      );
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao submeter a avaliação."
      );
    } finally {
      setSubmittingId(null);
      openResultModal();
    }
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
            {(() => {
              const ended = curso?.fimdeinscricoes
                ? new Date(curso.fimdeinscricoes) <= new Date()
                : false;
              if (ended) {
                return (
                  <>
                    <div className="btn btn-dark static-button">Terminado</div>
                    <br />
                  </>
                );
              }
              if (curso?.disponivel === false) {
                return (
                  <>
                    <div className="btn btn-primary static-button">
                      Arquivado
                    </div>
                    <br />
                  </>
                );
              }
              return null;
            })()}

            {isFormadorDoCurso ? (
              <div className="d-flex align-items-center my-3 flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    activeTab === "overview"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setActiveTab("overview")}
                >
                  Visão Geral
                </button>
                <button
                  type="button"
                  className={`btn btn-sm btn-outline-primary ms-auto`}
                  onClick={() => navigate(`/curso-sincrono/${id}/agendar`)}
                >
                  Agendar Sessões
                </button>
                <button
                  type="button"
                  className={`btn btn-sm btn-outline-primary`}
                  onClick={() => navigate(`/curso-sincrono/${id}/avaliacoes`)}
                >
                  Avaliações
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
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
              <div className="mt-3 d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      activeTab === "overview"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Sessões
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      activeTab === "submissoes"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("submissoes")}
                  >
                    Submissões
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      activeTab === "final"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("final")}
                  >
                    Avaliação Final
                  </button>
                  <button
                    onClick={() => openConfirmModal("sair")}
                    className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3 ms-auto"
                    disabled={loading}
                  >
                    {loading ? "A sair..." : "Sair do Curso"}
                  </button>
                </div>
                {curso?.planocurricular && (
                  <p className="mb-0">
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

            {/* gestão de agenda movida para /curso-sincrono/:id/agendar */}
          </div>
        </div>

        {/* Plano Curricular — Tópicos (sempre visível, como nos assíncronos) */}
        <div className="mt-2 row g-4">
          {curso?.topicos?.length > 0 && (
            <div className="col-12">
              <h2 className="h4">Tópicos</h2>
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

        {(inscrito || isFormadorDoCurso) && (
          <div className="mt-5">
            {activeTab === "overview" && curso?.sessoes?.length > 0 && (
              <>
                <h2 className="h5">Sessões</h2>
                <ul className="list-group small">
                  {curso.sessoes.map((s) => (
                    <li key={s.idsessao} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <strong>{s.titulo}</strong>
                          <br />
                          <span className="text-muted">
                            {formatDataHora(s.datahora)} ({s.duracaohoras}h)
                          </span>
                          {s.linksessao && (
                            <>
                              <br />
                              <a
                                href={s.linksessao}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Link
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Materiais da sessão (leitura) */}
                      {(() => {
                        const mats =
                          s?.materiais ||
                          s?.materials ||
                          s?.conteudos ||
                          s?.materiaisSessao ||
                          s?.conteudosSessao ||
                          [];
                        return (
                          <div className="mt-2">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="fw-semibold">Materiais</span>
                            </div>
                            {Array.isArray(mats) && mats.length > 0 ? (
                              <ul className="mt-2 mb-0 ps-3">
                                {mats.map((m, idx) => {
                                  const mid =
                                    m?.idmaterial || m?.id || m?.codigo || idx;
                                  const mname =
                                    m?.nome ||
                                    m?.filename ||
                                    m?.titulo ||
                                    m?.designacao ||
                                    `Material ${idx + 1}`;
                                  const murl =
                                    m?.url ||
                                    m?.link ||
                                    m?.ficheiro ||
                                    m?.file ||
                                    m?.path;
                                  return (
                                    <li
                                      key={mid}
                                      className="d-flex align-items-center justify-content-between gap-2"
                                    >
                                      <div>
                                        {murl ? (
                                          <a
                                            href={murl}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            {mname}
                                          </a>
                                        ) : (
                                          <span>{mname}</span>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-muted mb-0 mt-1">
                                Sem materiais.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {activeTab === "submissoes" && (
              <div>
                <h2 className="h5">Avaliações Contínuas</h2>
                {avaliacoesContinuas?.length ? (
                  <ul className="list-group small">
                    {avaliacoesContinuas.map((av) => {
                      const idav =
                        av.idavaliacaocontinua ||
                        av.idavaliacao ||
                        av.id ||
                        av.codigo;
                      const { inicioDisp, inicioSub, fimSub } =
                        getAvaliacaoWindow(av);
                      const beforeStart = isBefore(inicioSub || inicioDisp);
                      const closed = isAfter(fimSub);
                      const isOpen = !beforeStart && !closed;
                      const localSub = studentUploads[idav];
                      // try embedded per-student info in av (common patterns)
                      const mySubObj =
                        av?.minhasubmissao ||
                        av?.minhaSubmissao ||
                        av?.submissao ||
                        (Array.isArray(av?.submissoes)
                          ? av.submissoes.find((s) => {
                              const sid =
                                s?.idformando ??
                                s?.formando ??
                                s?.utilizador ??
                                s?.userId ??
                                s?.id;
                              const semail =
                                s?.email || s?.formando || s?.formandoEmail;
                              return (
                                (currentFormandoId != null &&
                                  String(sid) === String(currentFormandoId)) ||
                                (user?.email &&
                                  semail &&
                                  String(semail).toLowerCase() ===
                                    String(user.email).toLowerCase())
                              );
                            })
                          : null);
                      const nota =
                        av?.nota ??
                        av?.classificacao ??
                        mySubObj?.nota ??
                        mySubObj?.classificacao ??
                        localSub?.nota;
                      const status =
                        nota != null
                          ? `Nota: ${nota}`
                          : localSub?.submitted
                          ? "Por avaliar"
                          : beforeStart
                          ? "Período de submissões ainda não começou"
                          : closed
                          ? "Prazo de submissões terminou"
                          : "Submeter";
                      return (
                        <li key={idav} className="list-group-item">
                          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                            <div>
                              <strong>{av.titulo || "Avaliação"}</strong>
                              {(av?.enunciado ||
                                av?.enunciadoUrl ||
                                av?.enunciadoLink) && (
                                <div className="small mt-1">
                                  <a
                                    href={
                                      av.enunciado ||
                                      av.enunciadoUrl ||
                                      av.enunciadoLink
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Enunciado
                                  </a>
                                </div>
                              )}
                              <div className="text-muted">
                                {inicioSub && (
                                  <span>
                                    Início submissões: {formatData(inicioSub)}{" "}
                                  </span>
                                )}
                                {fimSub && (
                                  <span className="ms-2">
                                    Fim: {formatData(fimSub)}
                                  </span>
                                )}
                              </div>
                              <div className="small mt-1">
                                <em>{status}</em>
                              </div>
                              {(mySubObj?.link ||
                                mySubObj?.url ||
                                mySubObj?.ficheiro) && (
                                <div className="small mt-1">
                                  <a
                                    href={
                                      mySubObj.link ||
                                      mySubObj.url ||
                                      mySubObj.ficheiro
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Ver a minha submissão
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="file"
                                accept="application/pdf"
                                className="form-control form-control-sm"
                                id={`file-${idav}`}
                                disabled={!isOpen || submittingId === idav}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  await handleSubmitContinuo(
                                    idav,
                                    file,
                                    !!localSub?.submitted
                                  );
                                  e.target.value = "";
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                disabled={!isOpen || submittingId === idav}
                                onClick={() =>
                                  document
                                    .querySelector(`#file-${idav}`)
                                    ?.click()
                                }
                                style={{ display: "none" }}
                              >
                                {localSub?.submitted ? "Atualizar" : "Submeter"}
                              </button>
                              {submittingId === idav && (
                                <span className="text-muted small">
                                  A enviar...
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-muted">Sem avaliações disponíveis.</div>
                )}
              </div>
            )}

            {activeTab === "final" && (
              <div>
                <h2 className="h5">Avaliação Final</h2>
                {studentFinal?.nota != null ? (
                  <div className="alert alert-success">
                    Nota final: <strong>{String(studentFinal.nota)}</strong>
                  </div>
                ) : (
                  <div className="alert alert-info">Ainda não atribuída.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CursoSincrono;
