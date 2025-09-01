import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import FiltrosCursos from "@shared/components/FilterCursos.jsx";
import api from "@shared/services/axios";
import Modal from "@shared/components/Modal";
import { getCursoStatus } from "@shared/utils/cursoStatus";

const getCursos = async (params) => {
  try {
    const response = await api.get(`/curso/list`, { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao listar cursos:", error);
    throw error;
  }
};

export default function GerirCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cursoToDelete, setCursoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const fetchCursos = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {};
      if (currentFilters.search) apiParams.search = currentFilters.search;
      if (currentFilters.categoria)
        apiParams.categoria = currentFilters.categoria;
      if (currentFilters.area) apiParams.area = currentFilters.area;
      if (currentFilters.topico) apiParams.topico = currentFilters.topico;
      if (typeof currentFilters.sincrono === "boolean")
        apiParams.sincrono = currentFilters.sincrono;

      const data = await getCursos(apiParams);

      // Enriquecer com 'maxincricoes' quando faltar no /curso/list, buscando /curso/:id apenas nos necessários
      const normalizeIsSyn = (c) => {
        const t = (c.tipo || "").toString().toLowerCase();
        const s = c.sincrono;
        return (
          (t && (t.includes("sincrono") || t.includes("síncrono"))) ||
          s === true ||
          s === 1 ||
          s === "1" ||
          (typeof s === "string" && s.toLowerCase() === "true")
        );
      };
      const hasMax = (c) => {
        const raw =
          c.maxInscricoes ??
          c.maxinscricoes ??
          c.maxincricoes ??
          c?.cursosincrono?.maxInscricoes ??
          c?.cursosincrono?.maxinscricoes ??
          c?.cursosincrono?.maxincricoes;
        return !(
          raw === undefined ||
          raw === null ||
          (typeof raw === "string" && raw.trim() === "")
        );
      };

      let list = Array.isArray(data) ? data : [];
      const toEnrich = list.filter((c) => normalizeIsSyn(c) && !hasMax(c));
      if (toEnrich.length > 0) {
        const details = await Promise.all(
          toEnrich.map((c) => {
            const idc = c.idcurso || c.id;
            return api
              .get(`/curso/${idc}`)
              .then((r) => ({ id: idc, data: r.data[0] || r.data }))
              .catch(() => null);
          })
        );
        const map = new Map(details.filter(Boolean).map((d) => [d.id, d.data]));
        list = list.map((c) => {
          const idc = c.idcurso || c.id;
          if (normalizeIsSyn(c) && !hasMax(c) && map.has(idc)) {
            const d = map.get(idc);
            const max =
              d.maxInscricoes ??
              d.maxinscricoes ??
              d.maxincricoes ??
              d?.cursosincrono?.maxInscricoes ??
              d?.cursosincrono?.maxinscricoes ??
              d?.cursosincrono?.maxincricoes ??
              null;
            return { ...c, maxincricoes: max };
          }
          return c;
        });
      }

      setCursos(list);
    } catch (err) {
      setError("Erro ao carregar cursos. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sincronoParam = searchParams.get("sincrono");
    const currentFiltersFromUrl = {
      search: searchParams.get("search") || "",
      categoria: searchParams.get("categoria") || "",
      area: searchParams.get("area") || "",
      topico: searchParams.get("topico") || "",
      sincrono: sincronoParam === null ? undefined : sincronoParam === "true",
    };
    fetchCursos(currentFiltersFromUrl);
  }, [searchParams, fetchCursos]);

  const handleApplyFilters = (newFilters) => {
    const newSearchParams = new URLSearchParams();
    if (newFilters.search) newSearchParams.set("search", newFilters.search);
    if (newFilters.categoria)
      newSearchParams.set("categoria", newFilters.categoria);
    if (newFilters.area) newSearchParams.set("area", newFilters.area);
    if (newFilters.topico) newSearchParams.set("topico", newFilters.topico);
    if (typeof newFilters.sincrono === "boolean")
      newSearchParams.set("sincrono", newFilters.sincrono);

    setSearchParams(newSearchParams);
  };

  const handleEditCurso = (idcurso) => {
    navigate(`/editar/curso/${idcurso}`);
  };

  const handleDeleteClick = (curso) => {
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
      fetchCursos(Object.fromEntries(searchParams.entries()));
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
      openResultModal();
    }
  };

  const handleCreateCursoAssincrono = () => {
    navigate("/criar/curso");
  };

  const handleCreateCursoSincrono = () => {
    navigate("/criar/curso-sincrono");
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
            <p>{operationMessage || "Ocorreu um erro."}</p>{" "}
            <p>
              Tente novamente mais tarde. Se o erro persistir, contacte o
              suporte.
            </p>{" "}
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

  return (
    <div className="container mt-5">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap">
        <h1 className="text-primary-blue mb-0">Gestão de Cursos</h1>
        <div className="d-flex gap-2 ms-auto">
          <button
            className="btn btn-sm btn-primary"
            onClick={handleCreateCursoAssincrono}
          >
            <i className="ri-add-line"></i> Criar Novo Curso Assíncrono
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleCreateCursoSincrono}
          >
            <i className="ri-add-line"></i> Criar Novo Curso Síncrono
          </button>
        </div>
      </div>

      <FiltrosCursos onApplyFilters={handleApplyFilters} />
      {loading && (
        <div className="container mt-5">
          <div className="text-center my-5">
            <div className="spinner-border text-primary" />
            <p className="mt-2 text-muted">A carregar cursos...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-danger text-center my-5" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && cursos.length === 0 && (
        <div className="alert alert-info text-center my-5" role="alert">
          Nenhum curso encontrado com os filtros aplicados.
        </div>
      )}
      {!loading && !error && cursos.length > 0 && (
        <div className="table-responsive mt-4">
          <table className="table table-hover table-bordered align-middle w-100">
            <thead className="table-light">
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Nome</th>
                <th scope="col">Tipo</th>
                <th scope="col">Disponível</th>
                <th scope="col">Estado</th>
                <th scope="col">Início Inscrições</th>
                <th scope="col">Fim Inscrições</th>
                <th scope="col">Max Inscrições</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso.idcurso || curso.id}>
                  <td>{curso.idcurso || curso.id}</td>
                  <td>{curso.nome}</td>
                  <td>
                    {curso.sincrono === true ? (
                      <span className="badge bg-primary">Síncrono</span>
                    ) : curso.sincrono === false ? (
                      <span className="badge bg-secondary">Assíncrono</span>
                    ) : (
                      <span className="badge bg-light text-dark">N/A</span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const now = new Date();
                      const fim = curso.fimdeinscricoes
                        ? new Date(curso.fimdeinscricoes)
                        : null;
                      const terminou = fim && now >= fim;

                      if (curso.sincrono === false && terminou) {
                        return (
                          <span
                            className="badge bg-danger"
                            title="Oculto para formandos (Terminado). Reativar definindo novas datas."
                          >
                            Não
                          </span>
                        );
                      }

                      if (curso.sincrono === true && terminou) {
                        return (
                          <span
                            className="badge bg-danger"
                            title="Curso síncrono terminado: inscrições/visibilidade geral fechadas. Formandos inscritos continuam a ter acesso aos conteúdos."
                          >
                            Não
                          </span>
                        );
                      }

                      if (curso.disponivel) {
                        return (
                          <span
                            className="badge bg-primary"
                            title={
                              curso.sincrono === false
                                ? "Visível para formandos enquanto não atingir a data de fim."
                                : "Visível para formandos."
                            }
                          >
                            Sim
                          </span>
                        );
                      }
                      return (
                        <span
                          className="badge bg-danger"
                          title="Indisponível manualmente."
                        >
                          Não
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const st = getCursoStatus(curso);
                      const terminou =
                        curso.fimdeinscricoes &&
                        new Date(curso.fimdeinscricoes) <= new Date();
                      const tooltip = terminou
                        ? curso.sincrono
                          ? "Terminado pela data de fim. Conteúdos continuam acessíveis aos inscritos."
                          : "Terminado automaticamente pela data de fim (oculto para formandos)."
                        : curso.disponivel === false
                        ? "Indisponível manualmente (antes do fim)."
                        : "Estado calculado pelas datas de início/fim.";
                      return (
                        <span
                          className={`badge ${st.badgeClass}`}
                          title={tooltip}
                        >
                          {st.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    {new Date(curso.iniciodeinscricoes).toLocaleDateString()}
                  </td>
                  <td>
                    {curso.fimdeinscricoes
                      ? new Date(curso.fimdeinscricoes).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    {(() => {
                      const t = (curso.tipo || "").toString().toLowerCase();
                      const s = curso.sincrono;
                      const isSyn =
                        (t &&
                          (t.includes("sincrono") || t.includes("síncrono"))) ||
                        s === true ||
                        s === 1 ||
                        s === "1" ||
                        (typeof s === "string" && s.toLowerCase() === "true");
                      const isAsync =
                        (t &&
                          (t.includes("assincrono") ||
                            t.includes("assíncrono"))) ||
                        s === false ||
                        s === 0 ||
                        s === "0" ||
                        (typeof s === "string" && s.toLowerCase() === "false");

                      const rawMax =
                        curso.maxInscricoes ??
                        curso.maxinscricoes ??
                        curso.maxincricoes ??
                        curso?.cursosincrono?.maxInscricoes ??
                        curso?.cursosincrono?.maxinscricoes ??
                        curso?.cursosincrono?.maxincricoes ??
                        null;
                      const max =
                        typeof rawMax === "string"
                          ? rawMax.trim() === ""
                            ? null
                            : parseInt(rawMax, 10)
                          : rawMax;

                      if (isSyn) {
                        return max !== null &&
                          max !== undefined &&
                          !Number.isNaN(max) ? (
                          <span
                            className="badge bg-secondary-subtle text-secondary-emphasis"
                            title="Máximo de inscrições"
                          >
                            {max}
                          </span>
                        ) : (
                          <span className="text-muted">Não atribuído</span>
                        );
                      }
                      if (isAsync) return <span className="text-muted">—</span>;
                      return <span className="text-muted">N/A</span>;
                    })()}
                  </td>
                  <td>
                    <Link
                      to={`/curso/${curso.idcurso}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        title="Ver Curso"
                      >
                        <i className="ri-eye-line"></i> Ver
                      </button>
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEditCurso(curso.idcurso)}
                      title="Editar Curso"
                    >
                      <i className="ri-edit-line"></i> Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteClick(curso)}
                      title="Eliminar Curso"
                    >
                      <svg
                        width="14"
                        height="14"
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
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    </div>
  );
}
