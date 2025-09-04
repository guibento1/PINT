import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState, useCallback } from "react";
import { getCursoStatus } from "@shared/utils/cursoStatus";
import api from "@shared/services/axios";
import "@shared/styles/curso.css";
import Modal from "@shared/components/Modal";
import SubmissionCard from "@shared/components/SubmissionCard";

const DetalhesCurso = () => {
  const { id } = useParams();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);

  // (dados de UI adicionais omitidos para foco na lógica pedida)
  const navigate = useNavigate();

  // Modais/ações (omitidos aqui para foco)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cursoToDelete, setCursoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [fetchingEnrolledUsers, setFetchingEnrolledUsers] = useState(true);
  const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
  const [userToUnenroll, setUserToUnenroll] = useState(null);
  const [unenrollLoading, setUnenrollLoading] = useState(false);

  // Certificados (existe pedido anterior) - mantemos leitura
  const [certificados, setCertificados] = useState([]);
  const [loadingCertificados, setLoadingCertificados] = useState(false);

  const handleEditCurso = () => {
    navigate(`/editar/curso/${id}`);
  };

  const handleDeleteCurso = () => {
    setCursoToDelete(curso);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCurso = async () => {
    if (!cursoToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/curso/${cursoToDelete.idcurso}`);
      setOperationStatus(0);
      setOperationMessage(
        `Curso "${cursoToDelete.nome}" eliminado com sucesso!`
      );
      navigate("/cursos", {
        state: {
          refresh: true,
          status: 0,
          message: `Curso "${cursoToDelete.nome}" eliminado com sucesso!`,
        },
      });
    } catch (err) {
      console.error("Erro ao eliminar curso:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message ||
          `Erro ao eliminar curso "${cursoToDelete.nome}".`
      );
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
      setCursoToDelete(null);
    }
  };

  const handleUnenrollUserClick = (user) => {
    setUserToUnenroll(user);
    setIsUnenrollModalOpen(true);
  };

  const confirmUnenrollUser = async () => {
    if (!userToUnenroll || !curso) return;

    setUnenrollLoading(true);
    try {
      await api.post(`/curso/${curso.idcurso}/sair`, {
        utilizador: userToUnenroll.idutilizador,
      });
      setOperationStatus(0);
      setOperationMessage(
        `Utilizador "${userToUnenroll.nome}" desinscrito de "${curso.nome}" com sucesso!`
      );
      fetchEnrolledUsers();
    } catch (err) {
      console.error("Erro ao desinscrever utilizador do curso:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message ||
          `Erro ao desinscrever "${userToUnenroll.nome}" do curso "${curso.nome}".`
      );
    } finally {
      setUnenrollLoading(false);
      setIsUnenrollModalOpen(false);
      setUserToUnenroll(null);
      openResultModal();
    }
  };

  const closeUnenrollModal = () => {
    setIsUnenrollModalOpen(false);
    setUserToUnenroll(null);
  };

  // Funções do modal de resultado genérico
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
            <p>{operationMessage || "Ocorreu um erro."}</p>
            <p>
              Tente novamente mais tarde. Se o erro persistir, contacte o
              suporte.
            </p>
          </>
        );
      default:
        return <p>Estado da operação desconhecido.</p>;
    }
  };

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
  };

  // Dados do curso
  useEffect(() => {
    const fetchCurso = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/curso/${id}`);
        setCurso(res.data[0] || res.data);
      } catch (err) {
        console.error("Erro ao carregar dados do curso:", err);
        setCurso(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCurso();
  }, [id]);

  // Fetch de certificados quando sincrono
  const fetchCertificados = useCallback(async () => {
    if (!curso?.sincrono) return;

    setLoadingCertificados(true);
    try {
      const res = await api.get(`/curso/cursosincrono/${id}/certificados`);
      const data = res?.data ?? [];
      setCertificados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar certificações do curso:", err);
      setCertificados([]);
    } finally {
      setLoadingCertificados(false);
    }
  }, [id, curso?.sincrono]);

  useEffect(() => {
    if (curso?.sincrono) {
      fetchCertificados();
    } else {
      setCertificados([]);
    }
  }, [curso?.sincrono, fetchCertificados]);

  // Helpers de renderização
  const isSincrono = curso?.sincrono;
  const status = curso ? getCursoStatus(curso) : null;
  // Disponibilidade lida pelas regras do helper
  const normalizeType = () => {
    const s = curso?.sincrono;
    if (typeof s === "boolean") return s;
    if (typeof s === "number") return s === 1;
    if (typeof s === "string") {
      const v = s.toLowerCase();
      if (v === "true" || v === "1") return true;
      if (v === "false" || v === "0") return false;
    }
    const t = (curso?.tipo || "").toLowerCase();
    if (t.includes("sincrono") || t.includes("síncrono")) return true;
    if (t.includes("assincrono") || t.includes("assíncrono")) return false;
    return null;
  };
  const isSyn = normalizeType();
  const available =
    isSyn === true
      ? status?.key !== "terminado"
      : isSyn === false
      ? status?.key === "em_curso"
      : status?.key === "em_curso";

  const formatData = (dataStr) => {
    if (!dataStr) return "N/A";
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

  const getMaterialIcon = (tipo) => {
    switch (tipo) {
      case "1":
        return <i className="ri-slideshow-line me-2"></i>;
      case "2":
        return <i className="ri-file-text-line me-2"></i>;
      case "3":
        return <i className="ri-external-link-line me-2"></i>;
      case "4":
        return <i className="ri-file-excel-line me-2"></i>;
      case "5":
        return <i className="ri-video-line me-2"></i>;
      case "6":
        return <i className="ri-file-zip-line me-2"></i>;
      default:
        return <i className="ri-file-line me-2"></i>;
    }
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
        <div className="alert alert-danger text-center my-5" role="alert">
          Curso não encontrado ou erro ao carregar!
        </div>
        <div className="text-center">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/cursos")}
          >
            Voltar à Gestão de Cursos
          </button>
        </div>
      </div>
    );
  }

  // Render de Sessões (sincrono)
  const renderSessions = () => (
    <div className="list-group">
      {curso.sessoes.map((sessao) => (
        <div
          key={sessao.idsessao}
          className="list-group-item list-group-item-action mb-2 rounded shadow-sm"
        >
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ cursor: "default" }}
          >
            <h5 className="mb-1">{sessao.titulo}</h5>
            <small className="text-muted">
              {sessao.datahora
                ? new Date(sessao.datahora).toLocaleString()
                : ""}
            </small>
          </div>
          <p className="mb-1">{sessao.descricao}</p>
          {sessao.materiais?.length > 0 && (
            <div className="mt-2">
              <h6>Materiais:</h6>
              <ul className="list-unstyled">
                {sessao.materiais.map((m) => (
                  <li key={m.idmaterial} className="mb-1">
                    {getMaterialIcon(m.tipo)}
                    <a
                      href={m.referencia}
                      target="_blank"
                      rel="noreferrer"
                      className="text-decoration-none ms-1"
                    >
                      {m.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Render de Lições (assincrono)
  const renderLicoes = () => (
    <div className="list-group">
      {curso.licoes.map((licao) => (
        <div
          key={licao.idlicao}
          className="list-group-item list-group-item-action mb-2 rounded shadow-sm"
        >
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ cursor: "default" }}
          >
            <h5 className="mb-1">{licao.titulo}</h5>
            <small className="text-muted" />
          </div>
          <p className="mb-1">{licao.descricao}</p>
          {licao.materiais?.length > 0 && (
            <div className="mt-2">
              <h6>Materiais:</h6>
              <ul className="list-unstyled">
                {licao.materiais.map((m) => (
                  <li key={m.idmaterial} className="mb-1">
                    {getMaterialIcon(m.tipo)}
                    <a
                      href={m.referencia}
                      target="_blank"
                      rel="noreferrer"
                      className="ms-1 text-decoration-none"
                    >
                      {m.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Render Avaliações Contínuas (quando sincrono)
  const renderAvaliacoesCont = () => (
    <div className="card card-body shadow-sm mt-3">
      <h2 className="h4 card-title mb-3">Avaliações Contínuas</h2>
      <ul className="list-group">
        {curso.avaliacoes.map((av) => (
          <li key={av.idavaliacaocontinua} className="list-group-item">
            <strong>{av.titulo}</strong>
            {av.enunciado && (
              <div>
                <a
                  href={av.enunciado}
                  target="_blank"
                  rel="noreferrer"
                  className="text-decoration-none"
                >
                  Enunciado
                </a>
              </div>
            )}
            {av.submissao && (
              <div className="small text-muted">Submissões disponíveis</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  // Render principal (parte de UI acima do conteúdo principal está mantida)
  // Abaixo, substituímos a lógica antiga para usar isSincrono
  // ... código de renderização anterior permanece, substituindo a seção de LIÇÕES/SESSÕES pela nova lógica

  // Exemplo de seção de conteúdo (apenas a parte relevante onde aparecem Sessões/Lições)
  const SectionLicoesOuSessoes = () => {
    if (isSincrono) {
      return (
        <>
          {curso?.sessoes?.length > 0 ? (
            renderSessions()
          ) : (
            <div className="alert alert-info" role="alert">
              Não há sessões cadastradas para este curso síncrono.
            </div>
          )}
          {curso?.avaliacoes?.length > 0 && renderAvaliacoesCont()}
        </>
      );
    } else {
      return (
        <>
          {curso?.licoes?.length > 0 ? (
            renderLicoes()
          ) : (
            <div className="alert alert-info" role="alert">
              Não há lições cadastradas para este curso assíncrono.
            </div>
          )}
        </>
      );
    }
  };

  // Render final JSX (simplificado para focar na mudança pedida)
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
        <div className="alert alert-danger text-center" role="alert">
          Curso não encontrado.
        </div>
      </div>
    );
  }

  // Renderização principal (mantém o layout existente, só altera a seção de lições/sessões)
  return (
    <div className="container mt-4 mb-4 pt-3">
      {/* ... demais partes da página (cabeçalho, thumbnail, informações) ... */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminação"
      >
        {cursoToDelete && (
          <p>
            Tem a certeza que deseja eliminar o curso{" "}
            <strong>"{cursoToDelete.nome}"</strong>?
          </p>
        )}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDeleteCurso}
            disabled={deleting}
          >
            {deleting ? "A Eliminar..." : "Eliminar"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isUnenrollModalOpen}
        onClose={closeUnenrollModal}
        title="Confirmar Desinscrição do Utilizador"
      >
        {userToUnenroll && curso && (
          <p>
            Tem a certeza que deseja desinscrever o utilizador{" "}
            <strong>"{userToUnenroll.nome}"</strong> do curso{" "}
            <strong>"{curso.nome}"</strong>?
          </p>
        )}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeUnenrollModal}
            disabled={unenrollLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmUnenrollUser}
            disabled={unenrollLoading}
          >
            {unenrollLoading ? "A desinscrever..." : "Desinscrever"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={getResultModalTitle()}
      >
        {getResultModalBody()}
        <div className="d-flex justify-content-end mt-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={closeResultModal}
          >
            OK
          </button>
        </div>
      </Modal>

      <div className="row g-3 align-items-start">
        <div className="col-md-4">
          <img
            src={
              curso?.thumbnail ||
              "https://placehold.co/400x250.png?text=TheSoftskills"
            }
            alt={curso?.nome}
            className="img-fluid rounded shadow-sm"
          />
        </div>

        <div className="col-md-8">
          {/* Header aligned with thumbnail: title + actions */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h1 className="h3 mb-0">{curso?.nome}</h1>
            <div className="ms-3 d-flex flex-wrap gap-2">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleEditCurso}
              >
                <i className="ri-edit-line"></i> Editar Curso
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleDeleteCurso}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  style={{ color: "currentColor", marginRight: 6 }}
                >
                  <path
                    d="M5.755,20.283,4,8H20L18.245,20.283A2,2,0,0,1,16.265,22H7.735A2,2,0,0,1,5.755,20.283ZM21,4H16V3a1,1,0,0,0-1-1H9A1,1,0,0,0,8,3V4H3A1,1,0,0,0,3,6H21a1,1,0,0,0,0-2Z"
                    fill="currentColor"
                  />
                </svg>
                Eliminar Curso
              </button>
            </div>
          </div>

          {/* Move details above description */}
          <p className="mb-2">
            <strong>ID do Curso:</strong> {curso?.idcurso}
            <br />
            {/* Estado e Disponibilidade (via helper) */}
            {status && (
              <>
                <strong>Estado:</strong>{" "}
                <span className={`badge ${status.badgeClass}`}>
                  {status.label}
                </span>
                <br />
              </>
            )}
            <strong>Disponível:</strong>{" "}
            <span className={`badge ${available ? "bg-primary" : "bg-danger"}`}>
              {available ? "Sim" : "Não"}
            </span>
            <br />
            <strong>Síncrono:</strong>{" "}
            {curso?.sincrono ? (
              <span className="badge bg-info">Sim</span>
            ) : (
              <span className="badge bg-secondary">Não</span>
            )}
            <br />
            {(() => {
              const nh = curso?.nhoras;
              const dh = curso?.duracao_horas;
              const duracao =
                nh !== undefined && nh !== null
                  ? `${nh}h`
                  : dh !== undefined && dh !== null
                  ? `${dh}h`
                  : null;
              return duracao ? (
                <>
                  <strong>Duração (Horas):</strong> {duracao}
                  <br />
                </>
              ) : null;
            })()}
            {curso?.iniciodeinscricoes ? (
              <>
                <strong>Início Inscrições:</strong>{" "}
                {formatData(curso.iniciodeinscricoes)}
                <br />
              </>
            ) : null}
            {curso?.fimdeinscricoes ? (
              <>
                <strong>Fim Inscrições:</strong>{" "}
                {formatData(curso.fimdeinscricoes)}
                <br />
              </>
            ) : null}
            {curso?.inicio ? (
              <>
                <strong>Início do Curso:</strong> {formatData(curso.inicio)}
                <br />
              </>
            ) : null}
            {curso?.fim ? (
              <>
                <strong>Fim do Curso:</strong> {formatData(curso.fim)}
                <br />
              </>
            ) : null}
            {(() => {
              const maxVagas = curso?.maxincricoes ?? curso?.maxinscricoes;
              return maxVagas !== undefined &&
                maxVagas !== null &&
                maxVagas !== "" ? (
                <>
                  <strong>Máx. Inscrições:</strong> {maxVagas}
                  <br />
                </>
              ) : null;
            })()}
            {(() => {
              const atual = curso?.inscricoes ?? curso?.inscricoes_atuais;
              return atual !== undefined && atual !== null ? (
                <>
                  <strong>Inscrições Atuais:</strong> {atual}
                  <br />
                </>
              ) : null;
            })()}
          </p>

          <p className="lead mt-2">{curso?.descricao_longa || ""}</p>

          {curso?.categoria && (
            <p>
              <strong>Categoria:</strong> {curso.categoria.designacao}
            </p>
          )}
          {curso?.area && (
            <p>
              <strong>Área:</strong> {curso.area.designacao}
            </p>
          )}

          {curso?.disponivel !== null &&
            curso?.disponivel !== undefined &&
            !curso?.disponivel && (
              <div className="btn btn-warning static-button me-2">
                Arquivado
              </div>
            )}
          {curso?.sincrono && (
            <div className="btn btn-info static-button me-2">
              Curso Síncrono
            </div>
          )}
          {!curso?.sincrono && (
            <div className="btn btn-secondary static-button me-2">
              Curso Assíncrono
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="h4">{isSincrono ? "Sessões" : "Lições"}</h2>
        <SectionLicoesOuSessoes />
      </div>

      {/* Certificados (se síncrono) já são mostrados no topo, conforme pedido anterior */}
      {isSincrono && certificados?.length > 0 && (
        <div className="mt-4 card shadow-sm">
          <div className="card-body">
            <h2 className="h4 card-title mb-3">Certificados do Curso</h2>
            <ul className="list-group">
              {certificados.map((c) => (
                <li key={c.idcertificado} className="list-group-item">
                  <strong>{c.nome}</strong>
                  {c.descricao && (
                    <div className="small text-muted">{c.descricao}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalhesCurso;
