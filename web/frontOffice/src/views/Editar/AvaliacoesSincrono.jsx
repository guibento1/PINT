import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@shared/services/axios";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";

const AvaliacoesSincrono = () => {
  const { id } = useParams(); // id curso sincrono
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

  // Submissions
  const [selectedAvaliacao, setSelectedAvaliacao] = useState(null);
  const [submissoes, setSubmissoes] = useState([]);
  const [loadingSubmissoes, setLoadingSubmissoes] = useState(false);
  const [submissoesError, setSubmissoesError] = useState("");

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

  // permissions
  const idFormadorRole = user?.roles?.find((r) => r.role === "formador")?.id;
  const isFormadorDoCurso =
    !!idFormadorRole && curso?.formador === idFormadorRole && isFormador;

  const fetchCurso = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/curso/${id}`);
      setCurso(res.data || null);
    } catch (e) {
      setCurso(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAvaliacoes = useCallback(async () => {
    try {
      // Primary (if backend provides a list endpoint)
      const res = await api.get(`/curso/cursosincrono/${id}/avalicaocontinua`);
      let list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setAvaliacoes(list);
    } catch (e1) {
      // Fallback: try course details and extract plausible arrays
      try {
        const res2 = await api.get(`/curso/${id}`);
        const d = res2.data || {};
        const list2 =
          (Array.isArray(d.avaliacaocontinua) && d.avaliacaocontinua) ||
          (Array.isArray(d.avaliacoes) && d.avaliacoes) ||
          (Array.isArray(d.avaliacoesContinuas) && d.avaliacoesContinuas) ||
          [];
        setAvaliacoes(list2);
      } catch (e2) {
        setAvaliacoes([]);
      }
    }
  }, [id]);

  // Final evaluations list from course details only (avoid 404 spam)
  const fetchFinais = useCallback(async () => {
    setLoadingFinais(true);
    try {
      const res = await api.get(`/curso/${id}`);
      const d = res.data || {};
      const list =
        (Array.isArray(d.avaliacaofinal) && d.avaliacaofinal) ||
        (Array.isArray(d.avaliacoesfinais) && d.avaliacoesfinais) ||
        (Array.isArray(d.avaliacoesFinais) && d.avaliacoesFinais) ||
        (Array.isArray(d.finais) && d.finais) ||
        [];
      setFinais(list);
    } catch (e) {
      setFinais([]);
    } finally {
      setLoadingFinais(false);
    }
  }, [id]);

  // Inscritos from course details only; normalize common shapes
  const fetchInscritos = useCallback(async () => {
    setLoadingInscritos(true);
    try {
      const res = await api.get(`/curso/${id}`);
      const d = res.data || {};
      const raw =
        (Array.isArray(d.inscritos) && d.inscritos) ||
        (Array.isArray(d.participantes) && d.participantes) ||
        (Array.isArray(d.alunos) && d.alunos) ||
        (Array.isArray(d.formandos) && d.formandos) ||
        (Array.isArray(d.utilizadores) && d.utilizadores) ||
        (Array.isArray(d.users) && d.users) ||
        [];
      const normalized = raw.map((entry) => {
        const base =
          entry?.formando || entry?.user || entry?.utilizador || entry;
        return {
          ...base,
          idformando:
            base?.idformando ?? base?.id ?? base?.utilizador ?? base?.userId,
          primeiroNome:
            base?.primeiroNome ||
            base?.primeiro ||
            base?.firstName ||
            base?.primeiro_nome,
          ultimoNome:
            base?.ultimoNome ||
            base?.ultimo ||
            base?.lastName ||
            base?.ultimo_nome,
        };
      });
      setInscritos(normalized);
    } catch (e) {
      setInscritos([]);
    } finally {
      setLoadingInscritos(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCurso();
    fetchAvaliacoes();
    fetchFinais();
    fetchInscritos();
  }, [fetchCurso, fetchAvaliacoes, fetchFinais, fetchInscritos]);

  const toIsoOrEmpty = (val) => (val ? new Date(val).toISOString() : "");

  const handleCreateAvaliacao = async (e) => {
    e.preventDefault();
    if (!newTitulo) {
      setOperationStatus(1);
      setOperationMessage("Indique o título.");
      return openResultModal();
    }
    setSaving(true);
    try {
      const fd = new FormData();
      const info = {
        cursosincrono: String(id),
        // required
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
      };
      fd.append("info", JSON.stringify(info));
      if (enunciadoFile) fd.append("enunciado", enunciadoFile);
      const createdRes = await api.post(
        `/curso/cursosincrono/${id}/avalicaocontinua`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setNewTitulo("");
      setEnunciadoFile(null);
      setInicioDisponibilidade("");
      setInicioDeSubmissoes("");
      // Optimistic append using response
      if (createdRes?.data) {
        setAvaliacoes((prev) => [createdRes.data, ...prev]);
      } else {
        await fetchAvaliacoes();
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

  // Final grades helpers
  const formandos = useMemo(
    () => (inscritos?.length ? inscritos : curso?.inscritos || []),
    [inscritos, curso]
  );

  // Helpers to resolve IDs and names consistently
  const resolveFormandoId = (f) =>
    f?.idformando ?? f?.id ?? f?.utilizador ?? f?.userId;
  const resolveFinalFormandoId = (af) =>
    af?.formando ?? af?.idformando ?? af?.id ?? af?.utilizador ?? af?.userId;
  const resolveNotaFromFinal = (af) =>
    af?.nota != null ? af.nota : af?.classificacao;
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

  // Auto create/update: decides based on existence; also tries fallback (PUT then POST) to align with backend
  const handleGuardarFinal = async () => {
    if (!selectedFormando || notaFinal === "") {
      setOperationStatus(1);
      setOperationMessage("Selecione um formando e introduza uma nota.");
      return openResultModal();
    }
    setFinalSaving(true);
    const formandoId = Number(selectedFormando);
    const body = { nota: Number(notaFinal), classificacao: Number(notaFinal) };
    const exists = !!getFinalByFormandoId(formandoId);
    try {
      if (exists) {
        await api.put(
          `/curso/cursosincrono/${id}/formando/${formandoId}/avaliacaofinal`,
          body
        );
      } else {
        await api.post(
          `/curso/cursosincrono/${id}/formando/${formandoId}/avaliacaofinal`,
          body
        );
      }
      setOperationStatus(0);
      setOperationMessage("Avaliação final guardada.");
      await fetchFinais();
    } catch (err) {
      // Fallback strategy: if first attempt fails, try the other method
      try {
        if (exists) {
          await api.post(
            `/curso/cursosincrono/${id}/formando/${formandoId}/avaliacaofinal`,
            body
          );
        } else {
          await api.put(
            `/curso/cursosincrono/${id}/formando/${formandoId}/avaliacaofinal`,
            body
          );
        }
        setOperationStatus(0);
        setOperationMessage("Avaliação final guardada.");
        await fetchFinais();
      } catch (err2) {
        setOperationStatus(1);
        setOperationMessage(
          err2?.response?.data?.error ||
            err?.response?.data?.error ||
            "Erro ao guardar avaliação final."
        );
      }
    } finally {
      setFinalSaving(false);
      openResultModal();
    }
  };

  // Deprecated: kept for compatibility if used elsewhere
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
      setOperationStatus(0);
      setOperationMessage("Avaliação final eliminada.");
      await fetchFinais();
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
              Início Disponibilidade
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={inicioDisponibilidade}
              onChange={(e) => setInicioDisponibilidade(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label form-label-sm mb-1 small">
              Início de Submissões
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={inicioDeSubmissoes}
              onChange={(e) => setInicioDeSubmissoes(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label form-label-sm mb-1 small">
              Enunciado (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              className="form-control form-control-sm"
              onChange={(e) => setEnunciadoFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="col-md-2 d-flex">
            <button
              type="submit"
              className="btn btn-sm btn-primary w-100 align-self-end"
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
                return (
                  <li
                    key={avId}
                    className="list-group-item d-flex justify-content-between align-items-start"
                  >
                    <div>
                      <strong>{av.titulo}</strong>
                      {inicio && (
                        <>
                          <br />
                          <small className="text-muted">
                            Disponível desde:{" "}
                            {new Date(inicio).toLocaleString("pt-PT")}
                          </small>
                        </>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleLoadSubmissoes(avId)}
                      >
                        Ver Submissões
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
            <div className="text-muted">A carregar submissões...</div>
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
                      {s.formandoNome || s.formando || s.idformando || s.email}
                    </div>
                    {(s.link || s.url || s.ficheiro) && (
                      <div>
                        <a
                          href={s.link || s.url || s.ficheiro}
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
                {formandos.map((f) => (
                  <option
                    key={f.idformando || f.id}
                    value={f.idformando || f.id}
                  >
                    {f.nome || f.email || `ID ${f.idformando || f.id}`}
                  </option>
                ))}
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
              type="text"
              step="0.5"
              min="0"
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
            <div className="text-muted small">
              A carregar avaliações finais...
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
                        <strong>Primeiro nome:</strong> {apn || "—"}
                      </div>
                      <div>
                        <strong>Segundo nome:</strong> {aun || "—"}
                      </div>
                      <div>
                        <strong>Nota atribuída:</strong>{" "}
                        {nota != null && nota !== ""
                          ? String(nota)
                          : "Ainda não atribuída"}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setSelectedFormando(String(fid));
                          setNotaFinal(
                            nota != null && nota !== "" ? String(nota) : ""
                          );
                        }}
                      >
                        Editar
                      </button>
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
