import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import FiltrosCursos from '@shared/components/FilterCursos.jsx'; 
import api from '@shared/services/axios';
import Modal from '@shared/components/Modal';

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
    const [operationMessage, setOperationMessage] = useState('');
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    const fetchCursos = useCallback(async (currentFilters) => {
        setLoading(true);
        setError(null);
        try {
            const apiParams = {
                sincrono: false,
            };
            if (currentFilters.search) apiParams.search = currentFilters.search;
            if (currentFilters.categoria) apiParams.categoria = currentFilters.categoria;
            if (currentFilters.area) apiParams.area = currentFilters.area;
            if (currentFilters.topico) apiParams.topico = currentFilters.topico;

            const data = await getCursos(apiParams);
            setCursos(data);
        } catch (err) {
            setError("Erro ao carregar cursos. Tente novamente mais tarde.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentFiltersFromUrl = {
            search: searchParams.get('search') || '',
            categoria: searchParams.get('categoria') || '',
            area: searchParams.get('area') || '',
            topico: searchParams.get('topico') || '',
        };
        fetchCursos(currentFiltersFromUrl);
    }, [searchParams, fetchCursos]);

    const handleApplyFilters = (newFilters) => {
        const newSearchParams = new URLSearchParams();
        if (newFilters.search) newSearchParams.set('search', newFilters.search);
        if (newFilters.categoria) newSearchParams.set('categoria', newFilters.categoria);
        if (newFilters.area) newSearchParams.set('area', newFilters.area);
        if (newFilters.topico) newSearchParams.set('topico', newFilters.topico);

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
            setOperationMessage(`Curso "${cursoToDelete.nome}" eliminado com sucesso!`);
            fetchCursos(Object.fromEntries(searchParams.entries()));
        } catch (err) {
            console.error('Erro ao eliminar curso:', err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || `Erro ao eliminar curso "${cursoToDelete.nome}".`);
        } finally {
            setDeleting(false);
            setIsDeleteModalOpen(false);
            setCursoToDelete(null);
            openResultModal();
        }
    };

    const handleCreateCurso = () => {
        navigate('/criar/curso');
    };

    const getResultModalTitle = () => {
        switch (operationStatus) {
            case 0: return "Sucesso";
            case 1: return "Erro";
            default: return "Informação";
        }
    };

    const getResultModalBody = () => {
        switch (operationStatus) {
            case 0: return <p>{operationMessage || "Operação realizada com sucesso!"}</p>;
            case 1: return (
                <>
                    <p>{operationMessage || "Ocorreu um erro."}</p>
                    <p>Tente novamente mais tarde. Se o erro persistir, contacte o suporte.</p>
                </>
            );
            default: return <p>Estado da operação desconhecido.</p>;
        }
    };

    const openResultModal = () => setIsResultModalOpen(true);
    const closeResultModal = () => {
        setIsResultModalOpen(false);
        setOperationStatus(null);
        setOperationMessage('');
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="text-primary-blue mb-0">Gestão de Cursos</h1>
                <button className="btn btn-primary" onClick={handleCreateCurso}>
                    <i className="ri-add-line"></i> Criar Novo Curso
                </button>
            </div>

            <FiltrosCursos onApplyFilters={handleApplyFilters} />

            {loading && (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary-blue" role="status">
                        <span className="visually-hidden">A carregar cursos...</span>
                    </div>
                    <p className="mt-2 text-muted">A carregar cursos...</p>
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
                    <table className="table table-hover table-bordered align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Nome</th>
                                <th scope="col">Disponível</th>
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
                                        {curso.disponivel ?
                                            <span className="badge bg-primary">Sim</span> :
                                            <span className="badge bg-danger">Não</span>
                                        }
                                    </td>
                                    <td>{new Date(curso.iniciodeinscricoes).toLocaleDateString()}</td>
                                    <td>
                                        {curso.fimdeinscricoes ? new Date(curso.fimdeinscricoes).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td>{curso.maxinscricoes}</td>
                                    <td>
                                        <Link to={`/curso/${curso.idcurso}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                          <button
                                              className="btn btn-sm btn-outline-primary me-2"
                                              title="Ver Curso"
                                          >
                                              <i class="ri-eye-line"></i> Ver
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
                                            <i className="ri-delete-bin-line"></i> Eliminar
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
                    <p>Tem a certeza que deseja eliminar o curso <strong>"{cursoToDelete.nome}"</strong>?</p>
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
                        {deleting ? 'A Eliminar...' : 'Eliminar'}
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
                    <button type="button" className="btn btn-primary" onClick={closeResultModal}>
                        OK
                    </button>
                </div>
            </Modal>
        </div>
    );
}
