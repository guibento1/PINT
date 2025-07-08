import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useCallback } from 'react';
import api from '@shared/services/axios';
import '@shared/styles/curso.css';
import Modal from '@shared/components/Modal';

const DetalhesCurso = () => {
    const { id } = useParams();
    const [curso, setCurso] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showAllTopicos, setShowAllTopicos] = useState(false);
    const [expandedLessonId, setExpandedLessonId] = useState(null);

    const maxVisibleTopics = 5;
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cursoToDelete, setCursoToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [operationStatus, setOperationStatus] = useState(null);
    const [operationMessage, setOperationMessage] = useState('');
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    const [enrolledUsers, setEnrolledUsers] = useState([]);
    const [fetchingEnrolledUsers, setFetchingEnrolledUsers] = useState(true);
    const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
    const [userToUnenroll, setUserToUnenroll] = useState(null);
    const [unenrollLoading, setUnenrollLoading] = useState(false);

    const handleShowMoreTopicos = () => {
        setShowAllTopicos(true);
    };

    const toggleLessonMaterials = (lessonId) => {
        setExpandedLessonId(expandedLessonId === lessonId ? null : lessonId);
    };

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
            setOperationMessage(`Curso "${cursoToDelete.nome}" eliminado com sucesso!`);
            navigate('/cursos', { state: { refresh: true, status: 0, message: `Curso "${cursoToDelete.nome}" eliminado com sucesso!` } });

        } catch (err) {
            console.error('Erro ao eliminar curso:', err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || `Erro ao eliminar curso "${cursoToDelete.nome}".`);
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
            await api.post(`/curso/${curso.idcurso}/sair`, { utilizador: userToUnenroll.idutilizador});
            setOperationStatus(0);
            setOperationMessage(`Utilizador "${userToUnenroll.nome}" desinscrito de "${curso.nome}" com sucesso!`);
            fetchEnrolledUsers(); 
        } catch (err) {
            console.error("Erro ao desinscrever utilizador do curso:", err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || `Erro ao desinscrever "${userToUnenroll.nome}" do curso "${curso.nome}".`);
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

    // Fetch principal do curso
    useEffect(() => {
        const fetchCurso = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/curso/${id}`);
                setCurso(res.data[0] || res.data); // Assegura que é um objeto
            } catch (err) {
                console.error("Erro ao carregar dados do curso:", err);
                setCurso(null);
            } finally {
                setLoading(false);
            }
        };
        fetchCurso();
    }, [id]);

    const fetchEnrolledUsers = useCallback(async () => {
        setFetchingEnrolledUsers(true);
        try {
            const response = await api.get(`/curso/inscricoes/${id}`);
            setEnrolledUsers(response.data);
        } catch (err) {
            console.error("Erro ao carregar utilizadores inscritos:", err);
            setEnrolledUsers([]);
        } finally {
            setFetchingEnrolledUsers(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchEnrolledUsers();
        }
    }, [id, fetchEnrolledUsers]);


    const formatData = (dataStr) => {
        if (!dataStr) return "N/A";
        const date = new Date(dataStr);
        if (isNaN(date.getTime())) {
            return "Data inválida";
        }
        return date.toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getMaterialIcon = (tipo) => {
        switch (tipo) {
            case '1':
                return <i className="ri-slideshow-line me-2"></i>;
            case '2':
                return <i className="ri-file-text-line me-2"></i>;
            case '3':
                return <i className="ri-external-link-line me-2"></i>;
            case '4':
                return <i className="ri-file-excel-line me-2"></i>;
            case '5':
                return <i className="ri-video-line me-2"></i>;
            case '6':
                return <i className="ri-file-zip-line me-2"></i>;
            default:
                return <i className="ri-file-line me-2"></i>;
        }
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center my-5">
                    <div className="spinner-border text-primary-blue" role="status">
                        <span className="visually-hidden">A carregar curso...</span>
                    </div>
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
                    <button className="btn btn-secondary" onClick={() => navigate('/cursos')}>
                        Voltar à Gestão de Cursos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
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
                isOpen={isUnenrollModalOpen}
                onClose={closeUnenrollModal}
                title="Confirmar Desinscrição do Utilizador"
            >
                {userToUnenroll && curso && (
                    <p>Tem a certeza que deseja desinscrever o utilizador <strong>"{userToUnenroll.nome}"</strong> do curso <strong>"{curso.nome}"</strong>?</p>
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
                        {unenrollLoading ? 'A desinscrever...' : 'Desinscrever'}
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

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0">{curso?.nome}</h1>
                <div>
                    <button className="btn btn-outline-primary me-2" onClick={handleEditCurso}>
                        <i className="ri-edit-line"></i> Editar Curso
                    </button>
                    <button className="btn btn-outline-danger" onClick={handleDeleteCurso}>
                        <i className="ri-delete-bin-line"></i> Eliminar Curso
                    </button>
                </div>
            </div>

            <div className="row g-4 align-items-start">
                <div className="col-md-4">
                    <img
                        src={curso?.thumbnail || 'https://placehold.co/400x250.png?text=TheSoftskills'}
                        alt={curso?.nome}
                        className="img-fluid rounded shadow-sm"
                    />
                </div>

                <div className="col-md-8">
                    <p className="lead">{curso?.descricao_longa || 'N/A'}</p>

                    <p>
                        <strong>ID do Curso:</strong> {curso?.idcurso}<br />
                        <strong>Disponível:</strong> {curso?.disponivel ? <span className="badge bg-success">Sim</span> : <span className="badge bg-danger">Não</span>}<br />
                        <strong>Síncrono:</strong> {curso?.sincrono ? <span className="badge bg-info">Sim</span> : <span className="badge bg-secondary">Não</span>}<br />
                        <strong>Duração (Horas):</strong> {curso?.duracao_horas !== undefined ? `${curso.duracao_horas}h` : 'N/A'}<br />
                        <strong>Início Inscrições:</strong> {formatData(curso?.iniciodeinscricoes)}<br />
                        <strong>Fim Inscrições:</strong> {formatData(curso?.fimdeinscricoes)}<br />
                        <strong>Máx. Inscrições:</strong> {curso?.maxinscricoes || 'N/A'}<br />
                        <strong>Inscrições Atuais:</strong> {curso?.inscricoes_atuais !== undefined ? curso.inscricoes_atuais : 'N/A'}
                    </p>

                    {curso?.categoria && (
                        <p><strong>Categoria:</strong> {curso.categoria.designacao}</p>
                    )}
                    {curso?.area && (
                        <p><strong>Área:</strong> {curso.area.designacao}</p>
                    )}

                    {curso?.disponivel !== null && curso?.disponivel !== undefined && !curso?.disponivel && (
                        <div className="btn btn-warning static-button me-2">Arquivado</div>
                    )}
                    {curso?.sincrono && (
                        <div className="btn btn-info static-button me-2">Curso Síncrono</div>
                    )}
                    {!curso?.sincrono && (
                        <div className="btn btn-secondary static-button me-2">Curso Assíncrono</div>
                    )}
                </div>
            </div>

            {curso?.planocurricular && (
                <div className="mt-5 card card-body shadow-sm">
                    <h2 className="h4 card-title">Plano Curricular</h2>
                    <p className="card-text">{curso.planocurricular}</p>
                </div>
            )}

            <div className="mt-5 row g-4">
                {curso?.topicos?.length > 0 && (
                    <div className="col-12">
                        <div className="card card-body shadow-sm">
                            <h2 className="h4 card-title">Tópicos Abordados</h2>
                            <div className="d-flex flex-wrap gap-2">
                                {curso.topicos.slice(0, showAllTopicos ? curso.topicos.length : maxVisibleTopics).map((topico) => (
                                    <span key={topico.idtopico} className="badge bg-primary rounded-pill px-3 py-2">
                                        {topico.designacao}
                                    </span>
                                ))}
                            </div>
                            {!showAllTopicos && curso.topicos.length > maxVisibleTopics && (
                                <button onClick={handleShowMoreTopicos} className="btn btn-link mt-2 text-decoration-none">
                                    Mostrar mais ({curso.topicos.length - maxVisibleTopics} mais)
                                </button>
                            )}
                            {showAllTopicos && curso.topicos.length > maxVisibleTopics && (
                                <button onClick={() => setShowAllTopicos(false)} className="btn btn-link mt-2 text-decoration-none">
                                    Mostrar menos
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-5 card shadow-sm p-4">
                <h2 className="h4 card-title mb-4">Utilizadores Inscritos neste Curso</h2>
                {fetchingEnrolledUsers ? (
                    <div className="text-center">
                        <div className="spinner-border text-info" role="status">
                            <span className="visually-hidden">A carregar inscritos...</span>
                        </div>
                        <p className="mt-2 text-muted">A carregar utilizadores inscritos...</p>
                    </div>
                ) : enrolledUsers.length > 0 ? (
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table table-hover table-striped table-bordered align-middle">
                            <thead className="table-light sticky-top" style={{ top: 0 }}>
                                <tr>
                                    <th>Nome do Utilizador</th>
                                    <th>Email</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrolledUsers.map((user) => (
                                    <tr key={user.idutilizador}>
                                        <td>{user.nome}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleUnenrollUserClick(user)}
                                                disabled={unenrollLoading}
                                            >
                                                <i className="ri-prohibit-line"></i> Desinscrever
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-muted">Não existem utilizadores inscritos neste curso.</p>
                )}
            </div>

            <div className="mt-5">
                <h2 className="h4">Lições e Materiais do Curso</h2>
                {curso?.licoes?.length > 0 ? (
                    <div className="list-group">
                        {curso.licoes.map((licao) => (
                            <div key={licao.idlicao} className="list-group-item list-group-item-action mb-2 rounded shadow-sm">
                                <div
                                    className="d-flex justify-content-between align-items-center"
                                    onClick={() => toggleLessonMaterials(licao.idlicao)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h5 className="mb-1">{licao.titulo}</h5>
                                    <small className="text-muted">
                                        <i className={`ri-arrow-${expandedLessonId === licao.idlicao ? 'up' : 'down'}-s-line`}></i>
                                    </small>
                                </div>
                                {expandedLessonId === licao.idlicao && (
                                    <div className="mt-3">
                                        <p>{licao.descricao}</p>
                                        {licao.materiais && licao.materiais.length > 0 ? (
                                            <div>
                                                <h6>Materiais:</h6>
                                                <ul className="list-unstyled">
                                                    {licao.materiais.map((material) => (
                                                        <li key={material.idmaterial} className="mb-1">
                                                            {getMaterialIcon(material.tipo)}
                                                            <a href={material.referencia} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                                {material.titulo}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="text-muted">Nenhum material disponível para esta lição.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="alert alert-info" role="alert">
                        Nenhuma lição disponível para este curso.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetalhesCurso;
