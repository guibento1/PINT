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
  const [newDescricao, setNewDescricao] = useState("");
  const [newDataLimite, setNewDataLimite] = useState(""); // opcional
  const [enunciadoFile, setEnunciadoFile] = useState(null);
  const [inicioDisponibilidade, setInicioDisponibilidade] = useState("");
  const [inicioDeSubmissoes, setInicioDeSubmissoes] = useState("");
  const [newIdAvaliacao, setNewIdAvaliacao] = useState("");

  // Submissions
  const [selectedAvaliacao, setSelectedAvaliacao] = useState(null);
  const [submissoes, setSubmissoes] = useState([]);
  const [loadingSubmissoes, setLoadingSubmissoes] = useState(false);
  const [submissoesError, setSubmissoesError] = useState("");

  // Final grade
  const [selectedFormando, setSelectedFormando] = useState("");
  const [notaFinal, setNotaFinal] = useState("");
  const [finalSaving, setFinalSaving] = useState(false);

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
      const res = await api.get(`/curso/cursosincrono/${id}/avaliacaocontinua`);
      setAvaliacoes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setAvaliacoes([]);
    }
  }, [id]);

  useEffect(() => {
    fetchCurso();
    fetchAvaliacoes();
  }, [fetchCurso, fetchAvaliacoes]);


  const formatDateForApi = (val) => {
    if (!val) return "";
    const base = val.replace("T", " ");
    return base.length === 16 ? `${base}:00` : base;
  };

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
        ...(newIdAvaliacao ? { idAvaliacao: String(newIdAvaliacao) } : {}),
        titulo: newTitulo,
        ...(inicioDisponibilidade
          ? { inicioDisponibilidade: formatDateForApi(inicioDisponibilidade) }
          : {}),
        ...(inicioDeSubmissoes
          ? { inicioDeSubmissoes: formatDateForApi(inicioDeSubmissoes) }
          : {}),
      };
      fd.append("info", JSON.stringify(info));
      if (enunciadoFile) fd.append("enunciado", enunciadoFile);
      await api.post(`/curso/cursosincrono/${id}/avaliacaocontinua`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewTitulo("");
      setEnunciadoFile(null);
      setInicioDisponibilidade("");
      setInicioDeSubmissoes("");
      setNewIdAvaliacao("");
      await fetchAvaliacoes();
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
        `/curso/cursosincrono/${id}/avaliacaocontinua/${idavaliacao}`
      );
      await fetchAvaliacoes();
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
        `/curso/cursosincrono/${id}/avaliacaocontinua/${idavaliacao}/submissoes`
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
        `/curso/cursosincrono/${id}/avaliacaocontinua/${selectedAvaliacao}/corrigir`,
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
  const formandos = useMemo(() => curso?.inscritos || [], [curso]);

  const handleCriarFinal = async () => {
    if (!selectedFormando || notaFinal === "") {
      setOperationStatus(1);
      setOperationMessage("Selecione um formando e introduza uma nota.");
      return openResultModal();
    }
    setFinalSaving(true);
    try {
      await api.post(
        `/curso/cursosincrono/${id}/formando/${selectedFormando}/avaliacaofinal`,
        { nota: Number(notaFinal) }
      );
      setOperationStatus(0);
      setOperationMessage("Avaliação final adicionada.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao adicionar avaliação final."
      );
    } finally {
      setFinalSaving(false);
      openResultModal();
    }
  };

  const handleEditarFinal = async () => {
    if (!selectedFormando || notaFinal === "") {
      setOperationStatus(1);
      setOperationMessage("Selecione um formando e introduza uma nota.");
      return openResultModal();
    }
    setFinalSaving(true);
    try {
      await api.put(
        `/curso/cursosincrono/${id}/formando/${selectedFormando}/avaliacaofinal`,
        { nota: Number(notaFinal) }
      );
      setOperationStatus(0);
      setOperationMessage("Avaliação final atualizada.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao atualizar avaliação final."
      );
    } finally {
      setFinalSaving(false);
      openResultModal();
    }
  };

  const handleEliminarFinal = async () => {
    if (!selectedFormando) {
      setOperationStatus(1);
      setOperationMessage("Selecione um formando.");
      return openResultModal();
    }
    setFinalSaving(true);
    try {
      await api.delete(
        `/curso/cursosincrono/${id}/formando/${selectedFormando}/avaliacaofinal`
      );
      setOperationStatus(0);
      setOperationMessage("Avaliação final eliminada.");
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
          <div className="col-md-2">
            <label className="form-label form-label-sm mb-1 small">
              ID Avaliação (opcional)
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={newIdAvaliacao}
              onChange={(e) => setNewIdAvaliacao(e.target.value)}
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
              {avaliacoes.map((av) => (
                <li
                  key={av.idavaliacao}
                  className="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div>
                    <strong>{av.titulo}</strong>
                    <br />
                    <small className="text-muted">{av.descricao}</small>
                    {av.datalimite && (
                      <>
                        <br />
                        <small className="text-muted">
                          Limite:{" "}
                          {new Date(av.datalimite).toLocaleString("pt-PT")}
                        </small>
                      </>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleLoadSubmissoes(av.idavaliacao)}
                    >
                      Ver Submissões
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteAvaliacao(av.idavaliacao)}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
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
                type="number"
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
              className="form-control form-control-sm"
              value={notaFinal}
              onChange={(e) => setNotaFinal(e.target.value)}
            />
          </div>
          <div className="col-md-4 d-flex gap-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleCriarFinal}
              disabled={finalSaving}
            >
              Criar
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={handleEditarFinal}
              disabled={finalSaving}
            >
              Atualizar
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
      </div>
    </div>
  );
};

export default AvaliacoesSincrono;
