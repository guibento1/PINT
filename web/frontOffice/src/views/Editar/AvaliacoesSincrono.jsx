import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@shared/services/axios";
import FileUpload from "@shared/components/FileUpload";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";

const AvaliacoesSincrono = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const { isFormador } = useUserRole();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Continuous assessments
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [newTitulo, setNewTitulo] = useState("");
  const [enunciadoFile, setEnunciadoFile] = useState(null);
  const [inicioDisponibilidade, setInicioDisponibilidade] = useState("");
  const [inicioDeSubmissoes, setInicioDeSubmissoes] = useState("");
  const [fimDisponibilidade, setFimDisponibilidade] = useState("");
  const [fimDeSubmissoes, setFimDeSubmissoes] = useState("");

  // Submissions
  const [selectedAvaliacao, setSelectedAvaliacao] = useState(null);
  const [submissoes, setSubmissoes] = useState([]);
  const [loadingSubmissoes, setLoadingSubmissoes] = useState(false);
  const [submissoesError, setSubmissoesError] = useState("");

  // Edit avaliação contínua
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editInicioDisponibilidade, setEditInicioDisponibilidade] =
    useState("");
  const [editInicioDeSubmissoes, setEditInicioDeSubmissoes] = useState("");
  const [editFimDisponibilidade, setEditFimDisponibilidade] = useState("");
  const [editFimDeSubmissoes, setEditFimDeSubmissoes] = useState("");
  const [editEnunciadoFile, setEditEnunciadoFile] = useState(null);
  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAvaliacao(null);
    setEditEnunciadoFile(null);
  };

  // Final grade
  const [selectedFormando, setSelectedFormando] = useState("");
  const [notaFinal, setNotaFinal] = useState("");
  const [finalSaving, setFinalSaving] = useState(false);
  const [finais, setFinais] = useState([]);
  const [loadingFinais, setLoadingFinais] = useState(false);
  const [inscritos, setInscritos] = useState([]);
  const [loadingInscritos, setLoadingInscritos] = useState(false);

  // Generic result modal
  const [operationStatus, setOperationStatus] = useState(null); // 0 ok | 1 erro
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
  };

  // Small helpers to avoid repetition
  const normalizeInscrito = (entry) => {
    const base = entry?.formando || entry?.user || entry?.utilizador || entry;
    const [first = "", ...rest] = (base?.nome || "").split(" ");
    return {
      // keep any top-level fields from the endpoint (e.g., nota, idformando)
      ...entry,
      ...base,
      idformando:
        base?.idformando ??
        entry?.formando ??
        base?.formando ??
        base?.id ??
        base?.utilizador ??
        base?.userId,
      primeiroNome:
        base?.primeiroNome ||
        base?.primeiro ||
        base?.firstName ||
        base?.primeiro_nome ||
        first,
      ultimoNome:
        base?.ultimoNome ||
        base?.ultimo ||
        base?.lastName ||
        base?.ultimo_nome ||
        (rest.length ? rest.join(" ") : ""),
    };
  };

  const mapObjToFinais = (obj) => {
    if (!obj || Array.isArray(obj) || typeof obj !== "object") return [];
    return Object.entries(obj)
      .map(([k, v]) => {
        const raw =
          typeof v === "object" && v !== null
            ? v.nota ?? v.classificacao ?? v.valor ?? v
            : v;
        if (typeof raw === "boolean" || raw == null || raw === "") return null;
        const notaParsed = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(notaParsed)) return null;
        return { formando: Number(k) || k, nota: notaParsed };
      })
      .filter(Boolean);
  };

  // Finals local cache (sessionStorage) to prevent visual regressions on refresh
  const cacheKey = useMemo(() => `finaisCache_${id}`, [id]);
  const loadFinaisCache = useCallback(() => {
    try {
      const txt = sessionStorage.getItem(cacheKey);
      if (!txt) return [];
      const obj = JSON.parse(txt);
      if (obj && typeof obj === "object") {
        return Object.entries(obj)
          .map(([k, v]) => {
            const kn = Number(k);
            const key = Number.isNaN(kn) ? k : kn;
            const nota = typeof v === "object" && v !== null ? v.nota ?? v : v;
            if (nota == null) return null;
            return { formando: key, nota };
          })
          .filter(Boolean);
      }
    } catch {}
    return [];
  }, [cacheKey]);
  const saveFinaisCache = useCallback(
    (list) => {
      try {
        const map = {};
        (list || []).forEach((it) => {
          if (it && it.formando != null && it.nota != null)
            map[String(it.formando)] = it.nota;
        });
        sessionStorage.setItem(cacheKey, JSON.stringify(map));
      } catch {}
    },
    [cacheKey]
  );

  // cache for inscritos to keep the list visible even if the inscritos endpoint fails
  const inscritosCacheKey = useMemo(() => `inscritosCache_${id}`, [id]);
  const loadInscritosCache = useCallback(() => {
    try {
      const txt = sessionStorage.getItem(inscritosCacheKey);
      if (!txt) return [];
      const arr = JSON.parse(txt);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [inscritosCacheKey]);
  const saveInscritosCache = useCallback(
    (list) => {
      try {
        const slim = (list || []).map((e) => ({
          idformando:
            e?.idformando ??
            e?.id ??
            e?.utilizador ??
            e?.idutilizador ??
            e?.userId,
          nome: e?.nome || "",
          email: e?.email || "",
        }));
        sessionStorage.setItem(inscritosCacheKey, JSON.stringify(slim));
      } catch {}
    },
    [inscritosCacheKey]
  );

  // permissions
  const idFormadorRole = user?.roles?.find((r) => r.role === "formador")?.id;
  // allow any formador to access the UI; server will enforce the exact course-level permission
  const isFormadorDoCurso =
    isFormador &&
    (curso?.formador == null || curso?.formador === idFormadorRole);

  const fetchCurso = useCallback(async () => {
    setLoading(true);
    setLoadingFinais(true);
    setLoadingInscritos(true);
    try {
      const res = await api.get(`/curso/${id}`);
      const d = res.data || {};
      setCurso(d);

      // Avaliações contínuas a partir do payload do curso
      const avList =
        (Array.isArray(d.avaliacaocontinua) && d.avaliacaocontinua) ||
        (Array.isArray(d.avaliacoes) && d.avaliacoes) ||
        (Array.isArray(d.avaliacoesContinuas) && d.avaliacoesContinuas) ||
        [];
      setAvaliacoes(avList);

      // Inscritos: usar o endpoint dedicado que já inclui as notas; fallback para payload do curso
      let normalizedInscritos = [];
      try {
        const cid = d.idcurso || id;
        const resIns = await api.get(`/curso/inscricoes/${cid}`);
        const list = Array.isArray(resIns.data)
          ? resIns.data
          : Array.isArray(resIns.data?.data)
          ? resIns.data.data
          : [];
        normalizedInscritos = list.map(normalizeInscrito);
      } catch (_) {
        const rawInscritos =
          (Array.isArray(d.inscritos) && d.inscritos) ||
          (Array.isArray(d.participantes) && d.participantes) ||
          (Array.isArray(d.alunos) && d.alunos) ||
          (Array.isArray(d.formandos) && d.formandos) ||
          (Array.isArray(d.utilizadores) && d.utilizadores) ||
          (Array.isArray(d.users) && d.users) ||
          [];
        normalizedInscritos = rawInscritos.map(normalizeInscrito);
      }
      if (normalizedInscritos.length) {
        setInscritos(normalizedInscritos);
        saveInscritosCache(normalizedInscritos);
      } else {
        const cached = loadInscritosCache();
        if (cached.length) setInscritos(cached);
        else setInscritos([]);
      }

      // Avaliações finais: preferir as notas que vieram nos inscritos
      let finaisList = [];
      const fromInscricoes = (normalizedInscritos || [])
        .map((entry) => {
          const base = entry;
          const fid =
            base?.idformando ??
            base?.id ??
            base?.idutilizador ??
            base?.utilizador ??
            base?.userId;
          const raw =
            entry?.nota ??
            entry?.notaFinal ??
            entry?.classificacaoFinal ??
            entry?.classificacao ??
            base?.nota ??
            base?.notaFinal ??
            base?.classificacaoFinal ??
            base?.classificacao;
          if (typeof raw === "boolean" || raw == null || raw === "")
            return null;
          const notaParsed = typeof raw === "number" ? raw : Number(raw);
          if (fid == null || !Number.isFinite(notaParsed)) return null;
          return { formando: fid, nota: notaParsed };
        })
        .filter(Boolean);

      if (fromInscricoes.length) {
        finaisList = fromInscricoes;
      } else {
        finaisList =
          (Array.isArray(d.avaliacaofinal) && d.avaliacaofinal) ||
          (Array.isArray(d.avaliacoesfinais) && d.avaliacoesfinais) ||
          (Array.isArray(d.avaliacoesFinais) && d.avaliacoesFinais) ||
          (Array.isArray(d.finais) && d.finais) ||
          [];
      }

      if (Array.isArray(finaisList) && finaisList.length) {
        const extractId = (x) =>
          x?.idformando ??
          x?.id ??
          x?.idutilizador ??
          x?.utilizador ??
          x?.userId;
        const normalized = finaisList
          .map((it) => {
            const fid =
              it?.formando != null
                ? typeof it.formando === "object" && it.formando !== null
                  ? extractId(it.formando)
                  : it.formando
                : extractId(it);
            const rawNota =
              it?.nota ??
              it?.classificacao ??
              (typeof it === "number" ? it : undefined);
            if (
              typeof rawNota === "boolean" ||
              rawNota == null ||
              rawNota === ""
            )
              return null;
            const notaParsed =
              typeof rawNota === "number" ? rawNota : Number(rawNota);
            if (fid == null || !Number.isFinite(notaParsed)) return null;
            return { formando: fid, nota: notaParsed };
          })
          .filter(Boolean);
        if (normalized.length) finaisList = normalized;
      }

      if (!finaisList.length) finaisList = mapObjToFinais(d.avaliacaofinal);
      if (!finaisList.length) finaisList = mapObjToFinais(d.finais);

      if (!finaisList.length) {
        const derived = normalizedInscritos
          .map((entry) => {
            const base = entry;
            const fid =
              base?.idformando ??
              base?.id ??
              base?.idutilizador ??
              base?.utilizador ??
              base?.userId;
            const notaFromEntryTop =
              entry?.notaFinal ??
              entry?.nota ??
              entry?.avaliacaofinal ??
              entry?.avaliacaoFinal ??
              entry?.classificacaoFinal ??
              entry?.classificacao;
            const notaFromEntryObj =
              (typeof entry?.avaliacaofinal === "object" &&
                entry?.avaliacaofinal !== null &&
                (entry?.avaliacaofinal?.nota ??
                  entry?.avaliacaofinal?.classificacao)) ||
              (typeof entry?.avaliacaoFinal === "object" &&
                entry?.avaliacaoFinal !== null &&
                (entry?.avaliacaoFinal?.nota ??
                  entry?.avaliacaoFinal?.classificacao)) ||
              (typeof entry?.final === "object" &&
                entry?.final !== null &&
                (entry?.final?.nota ?? entry?.final?.classificacao));
            const notaFromBase =
              base?.notaFinal ??
              base?.nota ??
              base?.avaliacaofinal ??
              base?.avaliacaoFinal ??
              base?.classificacaoFinal ??
              base?.classificacao;
            const raw = notaFromEntryObj ?? notaFromEntryTop ?? notaFromBase;
            if (typeof raw === "boolean" || raw == null || raw === "")
              return null;
            const notaParsed = typeof raw === "number" ? raw : Number(raw);
            if (fid == null || !Number.isFinite(notaParsed)) return null;
            return { formando: fid, nota: notaParsed };
          })
          .filter(Boolean);
        if (derived.length) finaisList = derived;
      }

      if (finaisList.length) {
        setFinais(finaisList);
        saveFinaisCache(finaisList);
      } else {
        setFinais([]);
      }
    } catch (e) {
      setCurso(null);
      setAvaliacoes([]);
      setInscritos((prev) => (prev?.length ? prev : loadInscritosCache()));
      setFinais([]);
    } finally {
      setLoading(false);
      setLoadingFinais(false);
      setLoadingInscritos(false);
    }
  }, [id, saveFinaisCache, loadInscritosCache, saveInscritosCache]);

  const formandos = useMemo(
    () => (inscritos?.length ? inscritos : curso?.inscritos || []),
    [inscritos, curso]
  );

  const resolveFormandoId = (f) =>
    f?.idformando ??
    f?.formando ??
    f?.id ??
    f?.idutilizador ??
    f?.utilizador ??
    f?.userId;
  const resolveFinalFormandoId = (af) =>
    af?.formando ?? af?.idformando ?? af?.id ?? af?.utilizador ?? af?.userId;
  const resolveNotaFromFinal = (af) => {
    const raw = af?.nota != null ? af.nota : af?.classificacao;
    if (typeof raw === "boolean" || raw == null || raw === "") return undefined;
    const parsed = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const getFinalByFormandoId = useCallback(
    (fid) =>
      finais.find((af) => String(resolveFinalFormandoId(af)) === String(fid)),
    [finais]
  );
  const getNotaByFormandoId = useCallback(
    (fid) => {
      const af = getFinalByFormandoId(fid);
      return af ? resolveNotaFromFinal(af) : undefined;
    },
    [getFinalByFormandoId]
  );

  useEffect(() => {
    fetchCurso();
  }, [fetchCurso]);

  // Prefill nota when selecting a formando
  useEffect(() => {
    if (!selectedFormando) return;
    const existing = getNotaByFormandoId(Number(selectedFormando));
    if (existing != null && existing !== "") setNotaFinal(String(existing));
    else setNotaFinal("");
  }, [selectedFormando, getNotaByFormandoId]);

  // No extra fetches — rely only on GET /curso/:id

  const toIsoOrEmpty = (val) => (val ? new Date(val).toISOString() : "");
  const toInputLocal = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  };

  const handleCreateAvaliacao = async (e) => {
    e.preventDefault();
    if (!newTitulo) {
      setOperationStatus(1);
      setOperationMessage("Indique o título.");
      return openResultModal();
    }
    if (!inicioDisponibilidade || !inicioDeSubmissoes) {
      setOperationStatus(1);
      setOperationMessage(
        "Indique o Início de Disponibilidade e o Início de Submissões."
      );
      return openResultModal();
    }
    if (!enunciadoFile) {
      setOperationStatus(1);
      setOperationMessage("Selecione o enunciado (PDF).");
      return openResultModal();
    }
    setSaving(true);
    try {
      const fd = new FormData();
      const info = {
        titulo: newTitulo,
        // time windows (send both naming styles to be safe)
        ...(inicioDisponibilidade
          ? {
              inicioDisponibilidade: toIsoOrEmpty(inicioDisponibilidade),
              iniciodisponibilidade: toIsoOrEmpty(inicioDisponibilidade),
            }
          : {}),
        ...(inicioDeSubmissoes
          ? {
              inicioDeSubmissoes: toIsoOrEmpty(inicioDeSubmissoes),
              iniciodesubmissoes: toIsoOrEmpty(inicioDeSubmissoes),
            }
          : {}),
        ...(fimDisponibilidade
          ? {
              fimDisponibilidade: toIsoOrEmpty(fimDisponibilidade),
              fimdisponibilidade: toIsoOrEmpty(fimDisponibilidade),
            }
          : {}),
        ...(fimDeSubmissoes
          ? {
              fimDeSubmissoes: toIsoOrEmpty(fimDeSubmissoes),
              fimdesubmissoes: toIsoOrEmpty(fimDeSubmissoes),
            }
          : {}),
      };
      fd.append("info", JSON.stringify(info));
      if (enunciadoFile) fd.append("enunciado", enunciadoFile);
      const createdRes = await api.post(
        `/curso/cursosincrono/${id}/avalicaocontinua`,
        fd
      );
      setNewTitulo("");
      setEnunciadoFile(null);
      setInicioDisponibilidade("");
      setInicioDeSubmissoes("");
      setFimDisponibilidade("");
      setFimDeSubmissoes("");
      // Optimistic append using response
      if (createdRes?.data) {
        setAvaliacoes((prev) => [createdRes.data, ...prev]);
      } else {
        await fetchCurso();
      }
      setOperationStatus(0);
      setOperationMessage("Avaliação contínua criada.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao criar avaliação."
      );
    } finally {
      setSaving(false);
      openResultModal();
    }
  };

  const handleDeleteAvaliacao = async (idavaliacao) => {
    if (!window.confirm("Eliminar esta avaliação contínua?")) return;
    try {
      await api.delete(
        `/curso/cursosincrono/${id}/avalicaocontinua/${idavaliacao}`
      );
      setAvaliacoes((prev) =>
        prev.filter((a) => {
          const avId = a?.idavaliacaocontinua ?? a?.idavaliacao ?? a?.id;
          return String(avId) !== String(idavaliacao);
        })
      );
      setOperationStatus(0);
      setOperationMessage("Avaliação eliminada.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao eliminar avaliação."
      );
    } finally {
      openResultModal();
    }
  };

  const handleLoadSubmissoes = async (idavaliacao) => {
    setSelectedAvaliacao(idavaliacao);
    setLoadingSubmissoes(true);
    setSubmissoesError("");
    try {
      const res = await api.get(
        `/curso/cursosincrono/${id}/avalicaocontinua/${idavaliacao}/submissoes`
      );
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setSubmissoes(arr);
    } catch (e) {
      setSubmissoes([]);
      setSubmissoesError(
        e?.response?.data?.error || "Erro ao carregar submissões."
      );
    } finally {
      setLoadingSubmissoes(false);
    }
  };

  const handleCorrigirSubmissao = async (idsubmissao, nota) => {
    if (!selectedAvaliacao) return;
    try {
      await api.put(
        `/curso/cursosincrono/${id}/avalicaocontinua/${selectedAvaliacao}/corrigir`,
        { idsubmissao, nota: Number(nota) }
      );
      // refresh submissoes
      await handleLoadSubmissoes(selectedAvaliacao);
      setOperationStatus(0);
      setOperationMessage("Nota atribuída.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao atribuir nota."
      );
    } finally {
      openResultModal();
    }
  };

  const handleGuardarFinal = async () => {
    if (!selectedFormando || notaFinal === "") {
      setOperationStatus(1);
      setOperationMessage("Selecione um formando e introduza uma nota.");
      return openResultModal();
    }
    setFinalSaving(true);
    const formandoId = Number(selectedFormando);
    const parsedNota = Number(notaFinal);
    if (Number.isNaN(parsedNota) || parsedNota < 0 || parsedNota > 20) {
      setOperationStatus(1);
      setOperationMessage("Nota inválida. Use 0 a 20.");
      setFinalSaving(false);
      return openResultModal();
    }
    const bodyNota = { nota: parsedNota };
    try {
      // Try update first; if not found, create
      try {
        await api.put(
          `/curso/cursosincrono/${id}/formando/${formandoId}/avaliacaofinal`,
          bodyNota
        );
      } catch (ePut) {
        if (ePut?.response?.status === 404) {
          await api.post(
            `/curso/cursosincrono/${id}/formando/${formandoId}/avaliacaofinal`,
            bodyNota
          );
        } else {
          throw ePut;
        }
      }
      // Optimistic update: reflect grade locally immediately
      setFinais((prev) => {
        const fidStr = String(formandoId);
        const idx = prev.findIndex(
          (af) => String(resolveFinalFormandoId(af)) === fidStr
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            nota: parsedNota,
          };
          // update cache
          saveFinaisCache(copy);
          return copy;
        }
        const next = [...prev, { formando: formandoId, nota: parsedNota }];
        saveFinaisCache(next);
        return next;
      });
      setOperationStatus(0);
      setOperationMessage("Avaliação final guardada.");
      // Refresh from single course fetch while keeping optimistic state
      fetchCurso();
    } catch (err) {
      const is403 = err?.response?.status === 403;
      setOperationStatus(1);
      setOperationMessage(
        (is403 && "Sem permissões para alterar a avaliação final.") ||
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao guardar avaliação final."
      );
    } finally {
      setFinalSaving(false);
      openResultModal();
    }
  };

  const handleEditarFinal = handleGuardarFinal;

  const handleEliminarFinal = async () => {
    if (!selectedFormando) {
      setOperationStatus(1);
      setOperationMessage("Selecione um formando.");
      return openResultModal();
    }
    setFinalSaving(true);
    try {
      const formandoId = Number(selectedFormando);
      await api.delete(
        `/curso/cursosincrono/${id}/formando/${formandoId}/avaliacaofinal`
      );

      setFinais((prev) => {
        const next = prev.filter(
          (af) => String(resolveFinalFormandoId(af)) !== String(formandoId)
        );
        saveFinaisCache(next);
        return next;
      });
      setOperationStatus(0);
      setOperationMessage("Avaliação final eliminada.");
      fetchCurso();
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao eliminar avaliação final."
      );
    } finally {
      setFinalSaving(false);
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
        <div className="alert alert-danger">Curso não encontrado.</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>
    );

  if (!isFormadorDoCurso)
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Sem permissões para gerir avaliações.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>
    );

  return (
    <div className="container mt-5">
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

      {/* Editar avaliação contínua */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Editar Avaliação Contínua"
      >
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label form-label-sm mb-1 small">
              Título
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <FileUpload
              id="edit-enunciado"
              label="Enunciado (PDF)"
              accept="application/pdf"
              onSelect={(file) => setEditEnunciadoFile(file || null)}
              size="sm"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label form-label-sm mb-1 small">
              Início Disponibilidade
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={editInicioDisponibilidade}
              onChange={(e) => setEditInicioDisponibilidade(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label form-label-sm mb-1 small">
              Início de Submissões
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={editInicioDeSubmissoes}
              onChange={(e) => setEditInicioDeSubmissoes(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label form-label-sm mb-1 small">
              Fim Disponibilidade
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={editFimDisponibilidade}
              onChange={(e) => setEditFimDisponibilidade(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label form-label-sm mb-1 small">
              Fim de Submissões
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={editFimDeSubmissoes}
              onChange={(e) => setEditFimDeSubmissoes(e.target.value)}
            />
          </div>
          <div className="col-12 d-flex justify-content-end gap-2 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={closeEditModal}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={async () => {
                if (!editingAvaliacao) return;
                try {
                  const avId =
                    editingAvaliacao.idavaliacaocontinua ??
                    editingAvaliacao.idavaliacao ??
                    editingAvaliacao.id ??
                    editingAvaliacao.codigo;
                  const fd = new FormData();
                  const info = {
                    ...(editTitulo !== "" ? { titulo: editTitulo } : {}),
                    ...(editInicioDisponibilidade !== ""
                      ? {
                          inicioDisponibilidade: toIsoOrEmpty(
                            editInicioDisponibilidade
                          ),
                        }
                      : {}),
                    ...(editInicioDeSubmissoes !== ""
                      ? {
                          inicioDeSubmissoes: toIsoOrEmpty(
                            editInicioDeSubmissoes
                          ),
                        }
                      : {}),
                    ...(editFimDisponibilidade !== ""
                      ? {
                          fimDisponibilidade: toIsoOrEmpty(
                            editFimDisponibilidade
                          ),
                        }
                      : {}),
                    ...(editFimDeSubmissoes !== ""
                      ? { fimDeSubmissoes: toIsoOrEmpty(editFimDeSubmissoes) }
                      : {}),
                  };
                  fd.append("info", JSON.stringify(info));
                  if (editEnunciadoFile)
                    fd.append("enunciado", editEnunciadoFile);
                  const updatedRes = await api.put(
                    `/curso/cursosincrono/${id}/avalicaocontinua/${avId}`,
                    fd
                  );
                  if (updatedRes?.data) {
                    setAvaliacoes((prev) => {
                      const pid = String(avId);
                      return prev.map((a) => {
                        const aid = String(
                          a.idavaliacaocontinua ??
                            a.idavaliacao ??
                            a.id ??
                            a.codigo
                        );
                        return aid === pid ? updatedRes.data : a;
                      });
                    });
                  } else {
                    await fetchCurso();
                  }
                  setOperationStatus(0);
                  setOperationMessage("Avaliação contínua editada.");
                  closeEditModal();
                } catch (err) {
                  setOperationStatus(1);
                  setOperationMessage(
                    err?.response?.data?.error || "Erro ao editar avaliação."
                  );
                } finally {
                  openResultModal();
                }
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <div className="d-flex align-items-center mb-4 gap-2">
        <h1 className="h5 mb-0">Avaliações — {curso?.nome}</h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm ms-auto"
          onClick={() => navigate(`/curso-sincrono/${id}`)}
        >
          Voltar ao Curso
        </button>
      </div>

      {/* Avaliações contínuas */}
      <div className="p-3 border rounded mb-4">
        <h2 className="h6">Avaliações Contínuas</h2>
        <form onSubmit={handleCreateAvaliacao} className="row g-2">
          <div className="col-md-3">
            <label className="form-label form-label-sm mb-1 small">
              Título
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={newTitulo}
              onChange={(e) => setNewTitulo(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label form-label-sm mb-1 small">
              Início Disponibilidade <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={inicioDisponibilidade}
              onChange={(e) => setInicioDisponibilidade(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label form-label-sm mb-1 small">
              Fim Disponibilidade
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={fimDisponibilidade}
              onChange={(e) => setFimDisponibilidade(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label form-label-sm mb-1 small">
              Início de Submissões <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={inicioDeSubmissoes}
              onChange={(e) => setInicioDeSubmissoes(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label form-label-sm mb-1 small">
              Fim de Submissões
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={fimDeSubmissoes}
              onChange={(e) => setFimDeSubmissoes(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <FileUpload
              id="create-enunciado"
              label={
                <>
                  Enunciado (PDF) <span className="text-danger">*</span>
                </>
              }
              accept="application/pdf"
              onSelect={(file) => setEnunciadoFile(file || null)}
              size="sm"
            />
          </div>
          <div className="col-md-2 d-flex">
            <button
              type="submit"
              className="btn btn-sm btn-primary w-100 align-self-start mt-4"
              disabled={saving}
            >
              {saving ? "A criar..." : "Adicionar"}
            </button>
          </div>
        </form>

        <div className="mt-3">
          {avaliacoes?.length ? (
            <ul className="list-group">
              {avaliacoes.map((av) => {
                const avId =
                  av.idavaliacaocontinua ??
                  av.idavaliacao ??
                  av.id ??
                  av.codigo;
                const inicio =
                  av.iniciodisponibilidade || av.inicioDisponibilidade;
                const fim = av.fimdesubmissoes || av.fimDeSubmissoes;
                return (
                  <li
                    key={avId}
                    className="list-group-item d-flex justify-content-between align-items-start"
                  >
                    <div>
                      <strong>{av.titulo}</strong>
                      {(av?.enunciado ||
                        av?.enunciadoUrl ||
                        av?.enunciadoLink) && (
                        <>
                          <br />
                          <a
                            href={
                              av.enunciado ||
                              av.enunciadoUrl ||
                              av.enunciadoLink
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="small"
                          >
                            Enunciado
                          </a>
                        </>
                      )}
                      {(() => {
                        const inicioDisp =
                          av.iniciodisponibilidade || av.inicioDisponibilidade;
                        const fimDisp =
                          av.fimdisponibilidade || av.fimDisponibilidade;
                        const inicioSub =
                          av.iniciodesubmissoes || av.inicioDeSubmissoes;
                        const fimSub = av.fimdesubmissoes || av.fimDeSubmissoes;
                        return (
                          <>
                            {inicioDisp && (
                              <>
                                <br />
                                <small className="text-muted">
                                  Início da disponibilidade:{" "}
                                  {new Date(inicioDisp).toLocaleString("pt-PT")}
                                </small>
                              </>
                            )}
                            {fimDisp && (
                              <>
                                <br />
                                <small className="text-muted">
                                  Fim da disponibilidade:{" "}
                                  {new Date(fimDisp).toLocaleString("pt-PT")}
                                </small>
                              </>
                            )}
                            {inicioSub && (
                              <>
                                <br />
                                <small className="text-muted">
                                  Início das submissões:{" "}
                                  {new Date(inicioSub).toLocaleString("pt-PT")}
                                </small>
                              </>
                            )}
                            {fimSub && (
                              <>
                                <br />
                                <small className="text-muted">
                                  Fim das submissões:{" "}
                                  {new Date(fimSub).toLocaleString("pt-PT")}
                                </small>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleLoadSubmissoes(avId)}
                      >
                        Ver Submissões
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setEditingAvaliacao(av);
                          setEditTitulo(av.titulo || "");
                          setEditInicioDisponibilidade(
                            toInputLocal(
                              av.inicioDisponibilidade ||
                                av.iniciodisponibilidade
                            )
                          );
                          setEditInicioDeSubmissoes(
                            toInputLocal(
                              av.inicioDeSubmissoes || av.iniciodesubmissoes
                            )
                          );
                          setEditFimDisponibilidade(
                            toInputLocal(
                              av.fimDisponibilidade || av.fimdisponibilidade
                            )
                          );
                          setEditFimDeSubmissoes(
                            toInputLocal(
                              av.fimDeSubmissoes || av.fimdesubmissoes
                            )
                          );
                          setEditEnunciadoFile(null);
                          openEditModal();
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteAvaliacao(avId)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-muted small">Sem avaliações criadas.</div>
          )}
        </div>
      </div>

      {/* Submissões da avaliação selecionada */}
      {selectedAvaliacao && (
        <div className="p-3 border rounded mb-4">
          <div className="d-flex align-items-center mb-2">
            <h2 className="h6 mb-0">Submissões</h2>
            <button
              className="btn btn-sm btn-outline-secondary ms-auto"
              onClick={() => setSelectedAvaliacao(null)}
            >
              Fechar
            </button>
          </div>
          {loadingSubmissoes ? (
            <div className="container mt-5">
              <div className="text-center my-5">
                <div className="spinner-border text-primary" />
                <p className="mt-2 text-muted">A carregar submissões...</p>
              </div>
            </div>
          ) : submissoesError ? (
            <div className="alert alert-danger py-2 small mb-0">
              {submissoesError}
            </div>
          ) : submissoes?.length ? (
            <ul className="list-group">
              {submissoes.map((s) => (
                <li
                  key={s.idsubmissao ?? s.id ?? s.submissaoId}
                  className="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div>
                    <div>
                      <strong>Formando:</strong>{" "}
                      {s.formando_formando?.nome ||
                        s.formandoNome ||
                        s.nome ||
                        s.email ||
                        s.idformando ||
                        s.formando ||
                        s.utilizador}
                    </div>
                    {(s.link || s.url || s.ficheiro || s.submissao) && (
                      <div>
                        <a
                          href={s.link || s.url || s.ficheiro || s.submissao}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver Submissão
                        </a>
                      </div>
                    )}
                    {(s.nota != null || s.classificacao != null) && (
                      <small className="text-muted">
                        Nota atual: {s.nota ?? s.classificacao}
                      </small>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-control form-control-sm"
                      placeholder="Nota"
                      defaultValue={s.nota ?? s.classificacao ?? ""}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val !== "")
                          handleCorrigirSubmissao(
                            s.idsubmissao ?? s.id ?? s.submissaoId,
                            val
                          );
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted small">Sem submissões.</div>
          )}
        </div>
      )}

      {/* Avaliação final */}
      <div className="p-3 border rounded mb-5">
        <h2 className="h6">Avaliação Final</h2>
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="form-label form-label-sm mb-1 small">
              Formando
            </label>
            {formandos?.length ? (
              <select
                className="form-select form-select-sm"
                value={selectedFormando}
                onChange={(e) => setSelectedFormando(e.target.value)}
              >
                <option value="">Selecionar...</option>
                {formandos.map((f) => {
                  const fid = resolveFormandoId(f);
                  return (
                    <option key={fid} value={fid}>
                      {f.nome || f.email || `ID ${fid}`}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="ID do formando"
                value={selectedFormando}
                onChange={(e) => setSelectedFormando(e.target.value)}
              />
            )}
          </div>
          <div className="col-md-2">
            <label className="form-label form-label-sm mb-1 small">Nota</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              className="form-control form-control-sm"
              value={notaFinal}
              onChange={(e) => setNotaFinal(e.target.value)}
            />
          </div>
          <div className="col-md-4 d-flex gap-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleGuardarFinal}
              disabled={finalSaving}
            >
              Guardar
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleEliminarFinal}
              disabled={finalSaving}
            >
              Eliminar
            </button>
          </div>
        </div>

        <div className="mt-3">
          <h3 className="h6 mb-2">Avaliações Finais</h3>
          {loadingFinais ? (
            <div className="container mt-5">
              <div className="text-center my-5">
                <div className="spinner-border text-primary" />
                <p className="mt-2 text-muted">
                  A carregar avaliações finais...
                </p>
              </div>
            </div>
          ) : formandos?.length ? (
            <ul className="list-group">
              {formandos.map((f) => {
                const fid = resolveFormandoId(f);
                const apn =
                  f.primeiroNome ||
                  f.primeiro ||
                  f.firstName ||
                  f.primeiro_nome ||
                  f.nome?.split(" ")[0];
                const aun =
                  f.ultimoNome ||
                  f.ultimo ||
                  f.lastName ||
                  f.ultimo_nome ||
                  f.nome?.split(" ").slice(1).join(" ") ||
                  "";
                const fullName =
                  (f.nome && f.nome.trim()) ||
                  [apn, aun].filter(Boolean).join(" ").trim();
                const nota = getNotaByFormandoId(fid);
                return (
                  <li
                    key={`${fid}`}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex flex-column">
                      <div>
                        <strong>ID do formando:</strong> {fid}
                      </div>
                      <div>
                        <strong>Nome:</strong> {fullName || "—"}
                      </div>
                      <div>
                        <strong>Nota atribuída:</strong>{" "}
                        {nota != null && nota !== ""
                          ? String(nota)
                          : "Ainda não atribuída"}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      {nota != null && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            setSelectedFormando(String(fid));
                            await handleEliminarFinal();
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-muted small">Sem inscritos para listar.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvaliacoesSincrono;
