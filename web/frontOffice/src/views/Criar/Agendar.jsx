import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";

const Agendar = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const { isFormador } = useUserRole();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);

  // formulário
  const [sessaoTitulo, setSessaoTitulo] = useState("");
  const [sessaoDescricao, setSessaoDescricao] = useState("");
  const [sessaoDataHora, setSessaoDataHora] = useState(""); 
  const [sessaoDuracao, setSessaoDuracao] = useState("");
  const [sessaoPlataforma, setSessaoPlataforma] = useState("");
  const [sessaoLink, setSessaoLink] = useState("");

  // resultado
  const [operationStatus, setOperationStatus] = useState(null); 
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // permissões
  const idFormadorRole = user?.roles?.find((r) => r.role === "formador")?.id;
  const isFormadorDoCurso =
    !!idFormadorRole && curso?.formador === idFormadorRole && isFormador;

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
  };

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

  useEffect(() => {
    fetchCurso();
  }, [fetchCurso]);

  const handleAddSessao = async (e) => {
    e.preventDefault();
    if (!curso?.idcrono) {
      setOperationStatus(1);
      setOperationMessage("ID do curso síncrono não carregado.");
      return openResultModal();
    }
    if (
      !sessaoTitulo ||
      !sessaoDescricao ||
      !sessaoDataHora ||
      !sessaoDuracao ||
      !sessaoPlataforma ||
      !sessaoLink
    ) {
      setOperationStatus(1);
      setOperationMessage("Preencha todos os campos.");
      return openResultModal();
    }
    try {
      await api.post(`/sessao/${curso.idcrono}`, {
        titulo: sessaoTitulo,
        descricao: sessaoDescricao,
        datahora: sessaoDataHora,
        duracaohoras: Number(sessaoDuracao),
        plataformavideoconferencia: sessaoPlataforma,
        linksessao: sessaoLink,
      });
      setSessaoTitulo("");
      setSessaoDescricao("");
      setSessaoDataHora("");
      setSessaoDuracao("");
      setSessaoPlataforma("");
      setSessaoLink("");
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Sessão criada.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(err?.response?.data?.error || "Erro ao criar sessão.");
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
      setOperationMessage(err?.response?.data?.error || "Erro ao remover sessão.");
    } finally {
      openResultModal();
    }
  };

  const formatDataHora = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    return d.toLocaleString("pt-PT", {
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
          <p className="mt-2 text-muted">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Curso não encontrado.</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>
    );
  }

  if (!isFormadorDoCurso) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Não tem permissões para agendar sessões neste curso.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={operationStatus === 0 ? "Sucesso" : operationStatus === 1 ? "Erro" : "Info"}
      >
        <p className="mb-0">{operationMessage || "Operação concluída."}</p>
      </Modal>

      <div className="d-flex align-items-center mb-4 gap-2">
        <h1 className="h4 mb-0">Agendar Sessões — {curso?.nome}</h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm ms-auto"
          onClick={() => navigate(`/curso-sincrono/${id}`)}
        >
          Voltar ao Curso
        </button>
      </div>

      <form onSubmit={handleAddSessao} className="row g-2 align-items-end mb-4">
        <div className="col-md-3">
          <label className="form-label form-label-sm mb-1 small">Título</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={sessaoTitulo}
            onChange={(e) => setSessaoTitulo(e.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label form-label-sm mb-1 small">Descrição</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={sessaoDescricao}
            onChange={(e) => setSessaoDescricao(e.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label form-label-sm mb-1 small">Data/Hora</label>
          <input
            type="datetime-local"
            className="form-control form-control-sm"
            value={sessaoDataHora}
            onChange={(e) => setSessaoDataHora(e.target.value)}
            required
          />
        </div>
        <div className="col-md-1">
          <label className="form-label form-label-sm mb-1 small">Duração (h)</label>
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
          <label className="form-label form-label-sm mb-1 small">Plataforma</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={sessaoPlataforma}
            onChange={(e) => setSessaoPlataforma(e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label form-label-sm mb-1 small">Link Sessão</label>
          <input
            type="url"
            className="form-control form-control-sm"
            value={sessaoLink}
            onChange={(e) => setSessaoLink(e.target.value)}
            required
          />
        </div>
        <div className="col-md-2 d-flex">
          <button type="submit" className="btn btn-sm btn-primary w-100" disabled={loading}>
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
                  {formatDataHora(s.datahora)} ({s.duracaohoras}h) - {s.plataformavideoconferencia}
                </span>
                <br />
                {s.linksessao && (
                  <a href={s.linksessao} target="_blank" rel="noreferrer" className="small">
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
  );
};

export default Agendar;