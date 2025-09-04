import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import Modal from "@shared/components/Modal";
import useUserRole from "@shared/hooks/useUserRole";
import FileUpload from "@shared/components/FileUpload";
import SubmissionCard from "@shared/components/SubmissionCard";

const Agendar = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const { isFormador } = useUserRole();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingSessao, setUploadingSessao] = useState(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);

  // editar sessão
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSessao, setEditingSessao] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editDataHora, setEditDataHora] = useState("");
  const [editDuracao, setEditDuracao] = useState("");
  const [editPlataforma, setEditPlataforma] = useState("");
  const [editLink, setEditLink] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  const tryEndpoints = async (method, urls, data, config) => {
    let lastErr;
    for (const url of urls) {
      try {
        if (method === "get") return await api.get(url, config);
        if (method === "post") return await api.post(url, data, config);
        if (method === "put") return await api.put(url, data, config);
        if (method === "delete") return await api.delete(url, config);
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        if (status !== 404) {
          continue;
        }
      }
    }
    throw lastErr || new Error("Falha ao contactar endpoints alternativos.");
  };

  useEffect(() => {
    fetchCurso();
  }, [fetchCurso]);

  const toInputLocal = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  };

  const openEditSessao = (s) => {
    setEditingSessao(s || null);
    setEditTitulo(s?.titulo || "");
    setEditDescricao(s?.descricao || "");
    setEditDataHora(toInputLocal(s?.datahora));
    setEditDuracao(s?.duracaohoras != null ? String(s.duracaohoras) : "");
    setEditPlataforma(s?.plataformavideoconferencia || "");
    setEditLink(s?.linksessao || "");
    setIsEditModalOpen(true);
  };
  const closeEditSessao = () => {
    setIsEditModalOpen(false);
    setEditingSessao(null);
  };
  const handleSaveEditSessao = async () => {
    if (!editingSessao) return;
    if (
      !editTitulo ||
      !editDescricao ||
      !editDataHora ||
      !editDuracao ||
      !editPlataforma ||
      !editLink
    ) {
      setOperationStatus(1);
      setOperationMessage("Preencha todos os campos da sessão.");
      return openResultModal();
    }
    setSavingEdit(true);
    try {
      const payload = {
        titulo: editTitulo,
        descricao: editDescricao,
        datahora: editDataHora,
        duracaohoras: Number(editDuracao),
        plataformavideoconferencia: editPlataforma,
        linksessao: editLink,
      };
      const tryUrls = [`/curso/sessao/${editingSessao.idsessao}`];
      if (editingSessao.licao)
        tryUrls.push(`/curso/sessao/${editingSessao.licao}`);
      await tryEndpoints("put", tryUrls, payload);
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Sessão atualizada.");
      closeEditSessao();
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Erro ao atualizar sessão."
      );
    } finally {
      setSavingEdit(false);
      openResultModal();
    }
  };

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
      const payload = {
        titulo: sessaoTitulo,
        descricao: sessaoDescricao,
        datahora: sessaoDataHora,
        duracaohoras: Number(sessaoDuracao),
        plataformavideoconferencia: sessaoPlataforma,
        linksessao: sessaoLink,
      };
      await tryEndpoints("post", [`/curso/sessao/${curso.idcrono}`], payload);
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
      setOperationMessage(
        err?.response?.data?.error || "Erro ao criar sessão."
      );
    } finally {
      openResultModal();
    }
  };

  const handleDeleteSessao = async (idsessao) => {
    try {
      await tryEndpoints("delete", [`/curso/sessao/${idsessao}`]);
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

  const handleUploadSessaoMaterial = async (idsessao, file) => {
    if (!file || !idsessao) return;
    setUploadingSessao(idsessao);
    setOperationStatus(null);
    setOperationMessage("");
    try {
      const fd = new FormData();
      const info = { titulo: file.name || "Material", tipo: 1 };
      fd.append("info", JSON.stringify(info));
      fd.append("ficheiro", file);
      await tryEndpoints("post", [`/curso/sessao/${idsessao}/material`], fd);
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Material enviado.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Falha ao enviar material."
      );
    } finally {
      setUploadingSessao(null);
      openResultModal();
    }
  };

  const handleDeleteSessaoMaterial = async (idsessao, idmaterial) => {
    if (!idsessao || !idmaterial) return;
    setDeletingMaterialId(idmaterial);
    setOperationStatus(null);
    setOperationMessage("");
    try {
      await tryEndpoints("delete", [
        `/curso/sessao/${idsessao}/material/${idmaterial}`,
      ]);
      await fetchCurso();
      setOperationStatus(0);
      setOperationMessage("Material removido.");
    } catch (err) {
      setOperationStatus(1);
      setOperationMessage(
        err?.response?.data?.error || "Falha ao remover material."
      );
    } finally {
      setDeletingMaterialId(null);
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
      {/* Modal resultado genérico */}
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

      {/* Modal editar sessão */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditSessao}
        title="Editar Sessão"
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
            <label className="form-label form-label-sm mb-1 small">
              Plataforma
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={editPlataforma}
              onChange={(e) => setEditPlataforma(e.target.value)}
            />
          </div>
          <div className="col-md-12">
            <label className="form-label form-label-sm mb-1 small">
              Descrição
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={editDescricao}
              onChange={(e) => setEditDescricao(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm mb-1 small">
              Data/Hora
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={editDataHora}
              onChange={(e) => setEditDataHora(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label form-label-sm mb-1 small">
              Duração (h)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="form-control form-control-sm"
              value={editDuracao}
              onChange={(e) => setEditDuracao(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label form-label-sm mb-1 small">
              Link Sessão
            </label>
            <input
              type="url"
              className="form-control form-control-sm"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
            />
          </div>
          <div className="col-12 d-flex justify-content-end gap-2 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={closeEditSessao}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleSaveEditSessao}
              disabled={savingEdit}
            >
              {savingEdit ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </div>
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
            <li key={s.idsessao} className="list-group-item">
              <div className="row g-2 align-items-start">
                <div className="col-md-8">
                  <div className="d-flex flex-column">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <strong className="me-1">{s.titulo}</strong>
                    </div>
                    <div className="d-flex align-items-center flex-wrap gap-2 small">
                      <span className="text-muted">
                        {formatDataHora(s.datahora)} ({s.duracaohoras}h) —{" "}
                        {s.plataformavideoconferencia}
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
                    {s.descricao && (
                      <div className="small mt-1">{s.descricao}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-4 d-flex justify-content-md-end gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    type="button"
                    onClick={() => openEditSessao(s)}
                  >
                    Editar Sessão
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    type="button"
                    onClick={() => handleDeleteSessao(s.idsessao)}
                    disabled={loading}
                  >
                    Remover
                  </button>
                </div>
              </div>

              {/* Materiais da sessão */}
              {(() => {
                const mats =
                  s?.materiais ||
                  s?.materials ||
                  s?.conteudos ||
                  s?.materiaisSessao ||
                  s?.conteudosSessao ||
                  [];
                return (
                  <div className="mt-2 pt-2 border-top mb-2">
                    <div className="row align-items-start g-2">
                      <div className="col-md-8">
                        <div className="fw-semibold">Materiais:</div>
                        <div className="mt-2">
                          {Array.isArray(mats) && mats.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
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
                                    <div className="flex-grow-1">
                                      <SubmissionCard
                                        filename={mname}
                                        type={
                                          isPdf ? "application/pdf" : undefined
                                        }
                                        date={undefined}
                                        url={murl}
                                      />
                                    </div>
                                    {(m?.idmaterial || m?.id || m?.codigo) && (
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        disabled={
                                          deletingMaterialId ===
                                          (m?.idmaterial || m?.id || m?.codigo)
                                        }
                                        onClick={() =>
                                          handleDeleteSessaoMaterial(
                                            s.idsessao,
                                            m?.idmaterial || m?.id || m?.codigo
                                          )
                                        }
                                      >
                                        {deletingMaterialId ===
                                        (m?.idmaterial || m?.id || m?.codigo)
                                          ? "A remover..."
                                          : "Remover"}
                                      </button>
                                    )}
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
                      </div>
                      <div className="col-md-4 d-flex justify-content-md-end mt-4">
                        <div style={{ minWidth: 220 }}>
                          <FileUpload
                            id={`sessao-mat-${s.idsessao}`}
                            label={null}
                            onSelect={(file) => {
                              if (file)
                                handleUploadSessaoMaterial(s.idsessao, file);
                            }}
                            size="sm"
                            disabled={uploadingSessao === s.idsessao}
                          />
                          {uploadingSessao === s.idsessao && (
                            <small className="text-muted">A enviar...</small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
