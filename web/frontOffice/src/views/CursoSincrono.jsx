import { useParams, useNavigate } from "react-router-dom";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "@shared/services/axios";
import FileUpload from "@shared/components/FileUpload";
import SubmissionCard from "@shared/components/SubmissionCard";
import "@shared/styles/curso.css";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";
import { getCursoStatus } from "@shared/utils/cursoStatus";

const CursoSincrono = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const { isFormador, isFormando } = useUserRole();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inscrito, setInscrito] = useState(false);
  const [inscritosCount, setInscritosCount] = useState(null);
  const [fetchingInscritos, setFetchingInscritos] = useState(false);

  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [submittingId, setSubmittingId] = useState(null);
  const [studentUploads, setStudentUploads] = useState({});
  const [avaliacoesRemote, setAvaliacoesRemote] = useState(null);
  const [showAllTopicos, setShowAllTopicos] = useState(false);

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

  // Carregar contagem de inscritos (fonte de verdade)
  const fetchInscritosCount = useCallback(async () => {
    setFetchingInscritos(true);
    try {
      const resp = await api.get(`/curso/inscricoes/${id}`);
      const list = Array.isArray(resp.data)
        ? resp.data
        : Array.isArray(resp?.data?.data)
        ? resp.data.data
        : [];
      setInscritosCount(list.length);
    } catch (e) {
      setInscritosCount(null);
    } finally {
      setFetchingInscritos(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCurso();
    fetchInscritosCount();
  }, [fetchCurso, fetchInscritosCount]);

  // Resolve Máx. Inscrições from multiple possible keys/structures
  const getMaxInscricoes = useCallback(() => {
    const c = curso || {};
    const nested = c?.cursosincrono || c?.cursoSincrono || {};
    const raw =
      c?.maxinscricoes ??
      c?.maxInscricoes ??
      c?.maxincricoes ??
      nested?.maxinscricoes ??
      nested?.maxincricoes ??
      nested?.maxInscricoes;
    if (raw == null || raw === "") return null;
    const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
    return Number.isFinite(n) ? n : null;
  }, [curso]);

  // Normalize inscription window, course period and hours across possible keys/nesting
  const inscricoesPeriod = useMemo(() => {
    const c = curso || {};
    const nested = c?.cursosincrono || c?.cursoSincrono || {};
    const inicio =
      c?.iniciodeinscricoes ??
      c?.inicioDeInscricoes ??
      nested?.iniciodeinscricoes ??
      nested?.inicioDeInscricoes;
    const fim =
      c?.fimdeinscricoes ??
      c?.fimDeInscricoes ??
      nested?.fimdeinscricoes ??
      nested?.fimDeInscricoes;
    return { inicio, fim };
  }, [curso]);
  const cursoPeriod = useMemo(() => {
    const c = curso || {};
    const nested = c?.cursosincrono || c?.cursoSincrono || {};
    const inicio = c?.inicio ?? nested?.inicio;
    const fim = c?.fim ?? nested?.fim;
    return { inicio, fim };
  }, [curso]);
  const numeroHoras = useMemo(() => {
    const c = curso || {};
    const nested = c?.cursosincrono || c?.cursoSincrono || {};
    return (
      c?.nhoras ??
      c?.nHoras ??
      c?.horas ??
      nested?.nhoras ??
      nested?.nHoras ??
      nested?.horas ??
      null
    );
  }, [curso]);

  // Only for status mapping (same rules as backoffice)
  const statusColor = useMemo(() => {
    return getCursoStatus(
      {
        sincrono: true,
        iniciodeinscricoes:
          inscricoesPeriod?.inicio || curso?.iniciodeinscricoes,
        fimdeinscricoes: inscricoesPeriod?.fim || curso?.fimdeinscricoes,
        inicio: cursoPeriod?.inicio || curso?.inicio,
        fim: cursoPeriod?.fim || curso?.fim,
        disponivel: curso?.disponivel,
      },
      new Date()
    );
  }, [curso, inscricoesPeriod, cursoPeriod]);

  const topicosList = useMemo(() => {
    const c = curso || {};
    const nested = c?.cursosincrono || c?.cursoSincrono || {};
    const t = c?.topicos ?? nested?.topicos ?? [];
    return Array.isArray(t) ? t : [];
  }, [curso]);

  const planoCurricular = useMemo(() => {
    const c = curso || {};
    const nested = c?.cursosincrono || c?.cursoSincrono || {};
    return c?.planocurricular ?? nested?.planocurricular ?? null;
  }, [curso]);

  const sessoesList = useMemo(() => {
    const c = curso || {};
    const nested = c?.cursosincrono || c?.cursoSincrono || {};
    const s = c?.sessoes ?? nested?.sessoes ?? [];
    return Array.isArray(s) ? s : [];
  }, [curso]);

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
      await fetchInscritosCount();
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
      await fetchInscritosCount();
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
  // Persist my submissions locally so they remain visible after refresh
  const uploadsCacheKey = useMemo(
    () =>
      `studentUploads_${id}_${
        user?.idutilizador || user?.utilizador || user?.id || "anon"
      }`,
    [id, user?.idutilizador, user?.utilizador, user?.id]
  );
  const loadUploadsCache = useCallback(() => {
    try {
      const txt = sessionStorage.getItem(uploadsCacheKey);
      if (!txt) return {};
      const obj = JSON.parse(txt);
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return {};
    }
  }, [uploadsCacheKey]);
  const saveUploadsCache = useCallback(
    (obj) => {
      try {
        sessionStorage.setItem(uploadsCacheKey, JSON.stringify(obj || {}));
      } catch {}
    },
    [uploadsCacheKey]
  );
  useEffect(() => {
    setStudentUploads((prev) => ({ ...prev, ...loadUploadsCache() }));
  }, [loadUploadsCache]);
  const avaliacoesContinuas = useMemo(() => {
    if (Array.isArray(avaliacoesRemote) && avaliacoesRemote.length) {
      return avaliacoesRemote;
    }
    const d = curso || {};
    // Preferir 'avaliacoes' pois inclui a submissao embebida
    return (
      (Array.isArray(d.avaliacoes) && d.avaliacoes) ||
      (Array.isArray(d.avaliacaocontinua) && d.avaliacaocontinua) ||
      (Array.isArray(d.avaliacoesContinuas) && d.avaliacoesContinuas) ||
      []
    );
  }, [curso, avaliacoesRemote]);

  const getAvaliacaoWindow = (av) => {
    // Prefer server field names for gating
    const inicioSubRaw = av?.iniciodesubmissoes || av?.inicioDeSubmissoes;
    const fimSubRaw =
      av?.fimdesubmissoes || av?.fimDeSubmissoes || av?.deadline;
    // Availability (display only)
    const inicioDisp = av?.iniciodisponibilidade || av?.inicioDisponibilidade;
    const fimDisp = av?.fimdisponibilidade || av?.fimDisponibilidade;
    return { inicioDisp, fimDisp, inicioSub: inicioSubRaw, fimSub: fimSubRaw };
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

  // Fallback numérico a partir do payload do curso (/curso/:id)
  const inscritosCountFromCurso = useMemo(() => {
    const c = curso || {};
    const raw =
      c?.inscricoes ??
      c?.ninscritos ??
      c?.numinscritos ??
      c?.numeroinscritos ??
      c?.numeroInscritos ??
      null;
    if (raw == null || raw === "") return null;
    const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
    return Number.isFinite(n) ? n : null;
  }, [curso]);

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
  // Merge any embedded per-student submission from the course payload into the local cache
  useEffect(() => {
    const email = user?.email?.toLowerCase?.();
    if (!Array.isArray(avaliacoesContinuas) || !avaliacoesContinuas.length)
      return;
    const myId = currentFormandoId;
    const toMerge = {};
    for (const av of avaliacoesContinuas) {
      const idav =
        av?.idavaliacaocontinua || av?.idavaliacao || av?.id || av?.codigo;
      if (!idav) continue;
      const subs = Array.isArray(av?.submissoes) ? av.submissoes : [];
      const mine = subs.find((s) => {
        const sid =
          s?.idformando ?? s?.formando ?? s?.utilizador ?? s?.userId ?? s?.id;
        const semail = s?.email || s?.formando || s?.formandoEmail;
        return (
          (myId != null && String(sid) === String(myId)) ||
          (email && semail && String(semail).toLowerCase() === email)
        );
      });
      if (mine) {
        const url = mine.link || mine.url || mine.ficheiro || mine.submissao;
        if (url) {
          toMerge[idav] = {
            submitted: true,
            url,
            ficheiro: url,
            nota: mine.nota ?? mine.classificacao,
            date:
              mine.data ||
              mine.dataSubmissao ||
              mine.createdAt ||
              mine.at ||
              new Date().toISOString(),
          };
        }
      }
    }
    if (Object.keys(toMerge).length) {
      setStudentUploads((prev) => {
        const next = { ...prev, ...toMerge };
        saveUploadsCache(next);
        return next;
      });
    }
  }, [avaliacoesContinuas, currentFormandoId, user?.email, saveUploadsCache]);

  const handleSubmitContinuo = async (idavaliacao, file, isUpdate = false) => {
    if (!file) return;
    setSubmittingId(idavaliacao);
    setOperationStatus(null);
    setOperationMessage("");
    try {
      const fd = new FormData();
      // Backend expects single file field named 'ficheiro'
      fd.append("ficheiro", file);
      // Use course id for cursosincrono endpoints (server expects :id to be the curso id)
      const cursoId = id;
      // Correct endpoint path spelling: avalicaocontinua (server routes)
      const url = `/curso/cursosincrono/${cursoId}/avalicaocontinua/${idavaliacao}/submeter`;
      let resp;
      try {
        if (isUpdate) {
          resp = await api.put(url, fd);
        } else {
          resp = await api.post(url, fd);
        }
      } catch (primaryErr) {
        // Fallback: if update fails with 404/400, try create; if create fails with 409/400, try update
        const status = primaryErr?.response?.status;
        if (isUpdate && (status === 404 || status === 400)) {
          resp = await api.post(url, fd);
        } else if (!isUpdate && (status === 409 || status === 400)) {
          resp = await api.put(url, fd);
        } else {
          throw primaryErr;
        }
      }
      // Keep local marker so UI shows submitted
      const subUrl =
        resp?.data?.submissao ||
        resp?.data?.url ||
        resp?.data?.link ||
        resp?.data?.ficheiro;
      setStudentUploads((prev) => {
        const next = {
          ...prev,
          [idavaliacao]: {
            submitted: true,
            url: subUrl,
            ficheiro: subUrl,
            date: new Date().toISOString(),
          },
        };
        saveUploadsCache(next);
        return next;
      });
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

            {/* Always-visible course details (for inscritos and não inscritos) */}
            <div className="mt-2">
              <p className="mb-2">
                {/* Tipo de curso e Estado */}
                <strong>Tipo de curso:</strong>{" "}
                {curso?.sincrono === false ? "Assíncrono" : "Síncrono"}
                <br />
                {curso?.disponivel !== null &&
                  curso?.disponivel !== undefined && (
                    <>
                      <strong>Disponível:</strong>{" "}
                      {curso.disponivel ? (
                        <span className="badge bg-primary">Sim</span>
                      ) : (
                        <span className="badge bg-danger">Não</span>
                      )}
                      <br />
                    </>
                  )}
                {(inscricoesPeriod?.inicio || inscricoesPeriod?.fim) && (
                  <>
                    <strong>Inscrições:</strong>{" "}
                    {formatData(inscricoesPeriod?.inicio)} até{" "}
                    {formatData(inscricoesPeriod?.fim)}
                    <br />
                  </>
                )}
                {(cursoPeriod?.inicio || cursoPeriod?.fim) && (
                  <>
                    <strong>Duração do Curso:</strong>{" "}
                    {formatData(cursoPeriod?.inicio)} até{" "}
                    {formatData(cursoPeriod?.fim)}
                    <br />
                  </>
                )}
                {numeroHoras != null && numeroHoras !== "" && (
                  <>
                    <strong>Nº de horas:</strong> {numeroHoras}
                    <br />
                  </>
                )}
                {(() => {
                  const max = getMaxInscricoes();
                  if (max != null) {
                    return (
                      <>
                        <strong>Máx. inscrições:</strong> {max}
                        <br />
                      </>
                    );
                  }
                  return null;
                })()}
                <>
                  <strong>Inscritos:</strong>{" "}
                  {fetchingInscritos
                    ? "..."
                    : (() => {
                        const fromApi =
                          inscritosCount != null &&
                          Number.isFinite(Number(inscritosCount))
                            ? Number(inscritosCount)
                            : null;
                        const fromPayloadList = Array.isArray(inscritosList)
                          ? inscritosList.length
                          : 0;
                        const fromCurso = inscritosCountFromCurso ?? null;
                        const candidates = [
                          fromApi,
                          fromCurso,
                          fromPayloadList,
                        ].filter((v) => v != null);
                        return candidates.length ? Math.max(...candidates) : 0;
                      })()}
                  <br />
                </>
              </p>
            </div>

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
            ) : !isFormando ? (
              <div className="alert alert-warning p-2 small mt-3">
                Não tem papel de formando contacte os serviços administrativos
                para o receber e proceder á inscrição ou aceder aos recursos
                caso alguma vez tivesse o papel e estivesse incrito.
              </div>
            ) : !inscrito ? (
              <>
                {statusColor?.key !== "terminado" &&
                curso?.disponivel !== false ? (
                  <div className="mt-3">
                    <button
                      onClick={handleClickInscrever}
                      className="btn btn-sm btn-primary"
                      disabled={loading}
                    >
                      {loading ? "A inscrever..." : "Inscrever"}
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-warning p-2 small mt-3">
                    Curso terminado ou indisponível. Inscrições encerradas.
                  </div>
                )}
              </>
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
                    Sessões e Materiais
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
                    Avaliações Contínuas e Submissões
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
                {/* Plano Curricular já apresentado acima para todos */}
              </div>
            )}

            {/* Plano Curricular já apresentado acima para todos */}

            {/* gestão de agenda movida para /curso-sincrono/:id/agendar */}
          </div>
        </div>

        {/* Plano Curricular — Tópicos (sempre visível, como nos assíncronos) */}
        <div className="mt-2 row g-4">
          {topicosList?.length > 0 && (
            <div className="col-12">
              <h2 className="h4 mb-3">Tópicos:</h2>
              <div className="d-flex flex-wrap gap-2 mb-1">
                {topicosList
                  .slice(
                    0,
                    showAllTopicos ? topicosList.length : maxVisibleTopics
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
              {!showAllTopicos && topicosList.length > maxVisibleTopics && (
                <button
                  onClick={handleShowMoreTopicos}
                  className="btn btn-link mt-2"
                >
                  Mostrar mais
                </button>
              )}
              {showAllTopicos && topicosList.length > maxVisibleTopics && (
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

        {/* Plano Curricular — agora imediatamente abaixo dos tópicos (visível para todos) */}
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

        {(inscrito || isFormadorDoCurso) && (
          <div className="mt-5">
            {activeTab === "overview" && sessoesList?.length > 0 && (
              <>
                <h2 className="h4 mb-3">Sessões e Materiais:</h2>

                <div className="my-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold">Progresso no Curso:</span>
                    <span className="text-muted">{curso?.nhoras}h</span>
                  </div>

                  <div className="progress" style={{ height: "25px" }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${curso?.progresso}%` }}
                      aria-valuenow={curso?.progresso}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {curso?.progresso}%
                    </div>
                  </div>
                </div>
                <ul className="list-group small">
                  {sessoesList.map((s) => (
                    <li key={s.idsessao} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <strong>{s.titulo}</strong>
                          <div className="d-flex align-items-center flex-wrap gap-2 small mt-1">
                            <span className="text-muted">
                              {formatDataHora(s.datahora)} ({s.duracaohoras}h)
                              {s.plataformavideoconferencia
                                ? ` — ${s.plataformavideoconferencia}`
                                : ""}
                            </span>
                            {s.linksessao && (
                              <a
                                href={s.linksessao}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary ms-3"
                              >
                                Link da Reunião
                              </a>
                            )}
                          </div>
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
                              <span className="fw-semibold">Materiais:</span>
                            </div>
                            {Array.isArray(mats) && mats.length > 0 ? (
                              <div className="mt-2 d-flex flex-column gap-2">
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
                                    m?.referencia ||
                                    m?.ficheiro ||
                                    m?.file ||
                                    m?.path;
                                  const isPdf =
                                    String(mname)
                                      .toLowerCase()
                                      .endsWith(".pdf") ||
                                    String(murl || "")
                                      .toLowerCase()
                                      .endsWith(".pdf");
                                  return (
                                    <div
                                      key={mid}
                                      className="d-flex align-items-center justify-content-between gap-2"
                                    >
                                      <div className="flex-grow-1 mb-2">
                                        <SubmissionCard
                                          filename={mname}
                                          type={
                                            isPdf
                                              ? "application/pdf"
                                              : undefined
                                          }
                                          date={undefined}
                                          url={murl}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
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
                      const { inicioDisp, fimDisp, inicioSub, fimSub } =
                        getAvaliacaoWindow(av);
                      // Gate exactly like the server: only submission window matters
                      const beforeStart = isBefore(inicioSub);
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
                      const effectiveSub = mySubObj || localSub;
                      const nota =
                        av?.nota ??
                        av?.classificacao ??
                        effectiveSub?.nota ??
                        effectiveSub?.classificacao ??
                        localSub?.nota;
                      const status =
                        nota != null
                          ? `Nota: ${nota}`
                          : effectiveSub?.submitted
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
                                {inicioDisp && (
                                  <span>
                                    Início disponibilidade:{" "}
                                    {formatData(inicioDisp)}{" "}
                                  </span>
                                )}
                                {fimDisp && (
                                  <span className="ms-2">
                                    Fim disponibilidade: {formatData(fimDisp)}
                                  </span>
                                )}
                                <div>
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
                              </div>
                              {(() => {
                                if (status === "Submeter") return null;
                                if (nota != null && nota !== "") {
                                  const parsed =
                                    typeof nota === "number"
                                      ? nota
                                      : Number(nota);
                                  if (Number.isFinite(parsed)) {
                                    const isApproved = parsed >= 9.45;
                                    return (
                                      <div
                                        className={`alert ${
                                          isApproved
                                            ? "alert-success"
                                            : "alert-danger"
                                        } d-inline-flex justify-content-between align-items-center py-2 px-3 mt-2 mb-0`}
                                      >
                                        <span className="fw-semibold me-1">
                                          Nota:
                                        </span>
                                        <span className="fw-semibold">
                                          {String(parsed)}
                                        </span>
                                      </div>
                                    );
                                  }
                                }
                                return <div className="mt-1">{status}</div>;
                              })()}
                            </div>
                            {!isFormadorDoCurso && (
                              <div className="d-flex flex-column gap-2 w-100">
                                <FileUpload
                                  id={`file-${idav}`}
                                  label={null}
                                  accept="application/pdf"
                                  disabled={!isOpen || submittingId === idav}
                                  onSelect={async (file) => {
                                    if (!file) return;
                                    const isUpdateArg = !!(
                                      effectiveSub || localSub?.submitted
                                    );
                                    await handleSubmitContinuo(
                                      idav,
                                      file,
                                      isUpdateArg
                                    );
                                  }}
                                  size="sm"
                                />
                                {(effectiveSub?.submissao ||
                                  effectiveSub?.link ||
                                  effectiveSub?.url ||
                                  effectiveSub?.ficheiro) && (
                                  <SubmissionCard
                                    filename={undefined}
                                    type="application/pdf"
                                    date={
                                      effectiveSub?.date ||
                                      effectiveSub?.data ||
                                      effectiveSub?.dataSubmissao ||
                                      effectiveSub?.createdAt ||
                                      undefined
                                    }
                                    url={
                                      effectiveSub?.submissao ||
                                      effectiveSub?.link ||
                                      effectiveSub?.url ||
                                      effectiveSub?.ficheiro
                                    }
                                    statusLabel={
                                      (effectiveSub?.nota ??
                                        effectiveSub?.classificacao ??
                                        localSub?.nota) != null
                                        ? `Nota: ${
                                            effectiveSub?.nota ??
                                            effectiveSub?.classificacao ??
                                            localSub?.nota
                                          }`
                                        : effectiveSub?.submitted
                                        ? "Por avaliar"
                                        : undefined
                                    }
                                  />
                                )}
                                {submittingId === idav && (
                                  <span className="text-muted small">
                                    A enviar...
                                  </span>
                                )}
                              </div>
                            )}
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
                {(() => {
                  const n = studentFinal?.nota;
                  const parsed =
                    n === null ||
                    n === undefined ||
                    n === "" ||
                    typeof n === "boolean"
                      ? null
                      : typeof n === "number"
                      ? n
                      : Number(n);
                  if (parsed != null && Number.isFinite(parsed)) {
                    const isApproved = parsed >= 9.45;
                    return (
                      <div
                        className={`alert ${
                          isApproved ? "alert-success" : "alert-danger"
                        }`}
                      >
                        Nota final: <strong>{String(parsed)}</strong>
                      </div>
                    );
                  }
                  return (
                    <div className="alert alert-info">Ainda não atribuída.</div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CursoSincrono;
