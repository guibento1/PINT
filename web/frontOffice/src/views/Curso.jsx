import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useCallback } from 'react';
import api from '@shared/services/axios';
import '@shared/styles/curso.css';
import Modal from '@shared/components/Modal';

const Curso = () => {
    const { id } = useParams();
    const [curso, setCurso] = useState(null);
    const [inscrito, setInscrito] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showAllTopicos, setShowAllTopicos] = useState(false);
    const [expandedLessonId, setExpandedLessonId] = useState(null);

    const [operationStatus, setOperationStatus] = useState(null); // null: nenhum, 0: sucesso, 1: erro, 2: erro específico 
    const [operationMessage, setOperationMessage] = useState(''); // Mensagem para o modal de resultado
    const [isResultModalOpen, setIsResultModalOpen] = useState(false); // Modal para o resultado da operação (sucesso/erro)

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Modal de confirmação
    const [actionToConfirm, setActionToConfirm] = useState(null); // 'sair'

    const maxVisibleTopics = 5;
    const navigate = useNavigate();

    const handleShowMoreTopicos = () => {
        setShowAllTopicos(true);
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
                        <p>{operationMessage || "Ocorreu um erro da nossa parte."}</p>
                        <p>Tente novamente mais tarde. Se o erro persistir, contacte o nosso suporte.</p>
                    </>
                );
            default:
                return <p>Estado da operação desconhecido.</p>;
        }
    };

    const openResultModal = () => {
        setIsResultModalOpen(true);
    };

    const closeResultModal = () => {
        setIsResultModalOpen(false);
        if (operationStatus === 0) { 
            setInscrito(prev => !prev); 
        }
        setOperationStatus(null); 
        setOperationMessage(''); 
        if (operationStatus === 0) {
            setInscrito(prev => {
                if (actionToConfirm === 'sair' && prev === true) return false;
                if (actionToConfirm === 'inscrever' && prev === false) return true;
                return prev; 
            });
        }
    };


    const openConfirmModal = (action) => {
        setActionToConfirm(action);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setActionToConfirm(null); 
    };

    const handleConfirmAction = async () => {
        closeConfirmModal(); 

        if (actionToConfirm === 'sair') {
            await executeSairCurso(); 
        }
        
    };

    const handleClickInscrever = async () => {
        setLoading(true);
        setOperationStatus(null); 
        setOperationMessage(''); 
        setIsResultModalOpen(false); 

        try {
            const res = await api.post(`/curso/${id}/inscrever`);
            setOperationStatus(0); 
            setOperationMessage(res.data.message || "Inscrição realizada com sucesso!");
        } catch (err) {
            console.error("Erro na inscrição:", err);
            setOperationStatus(1); 
            setInscrito(false); 

            if (err.response && err.response.data && err.response.data.message) {
                setOperationMessage(err.response.data.message);
            } else if (err.message) {
                setOperationMessage("Erro de rede: " + err.message);
            } else {
                setOperationMessage("Ocorreu um erro desconhecido ao tentar inscrever-se.");
            }
        } finally {
            setLoading(false);
            openResultModal(); 
        }
    };


    const handleClickSair = () => {
        openConfirmModal('sair'); 
    };

    const executeSairCurso = async () => {
        setLoading(true);
        setOperationStatus(null); 
        setOperationMessage(''); 
        setIsResultModalOpen(false); 

        try {
            const res = await api.post(`/curso/${id}/sair`); 
            setOperationStatus(0); 
            setOperationMessage(res.data.message || "Saída do curso realizada com sucesso!");
        } catch (err) {
            console.error("Erro ao sair do curso:", err);
            setOperationStatus(1); 
            setInscrito(true); 

            if (err.response && err.response.data && err.response.data.message) {
                setOperationMessage(err.response.data.message);
            } else if (err.message) {
                setOperationMessage("Erro de rede: " + err.message);
            } else {
                setOperationMessage("Ocorreu um erro desconhecido ao tentar sair do curso.");
            }
        } finally {
            setLoading(false);
            openResultModal(); 
        }
    };


    const toggleLessonMaterials = (lessonId) => {
        setExpandedLessonId(expandedLessonId === lessonId ? null : lessonId);
    };

    useEffect(() => {
        const fetchCurso = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/curso/${id}`);
                setCurso(res.data[0]);
                setInscrito(!!res.data[0]?.inscrito); 
            } catch (err) {
                console.error("Erro ao carregar dados do curso:", err);
                setCurso(null);
            } finally {
                setLoading(false);
            }
        };
        fetchCurso();
    }, [id, inscrito]); 


    const formatData = (dataStr) => {
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
            default:
                return <i className="ri-file-line me-2"></i>;
        }
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <p>Carregando...</p>
            </div>
        );
    }

    if (!curso) {
        return (
            <div className="container mt-5">
                <p>Curso não encontrado!</p>
            </div>
        );
    }

    return (
        <>
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={closeConfirmModal}
                title="Confirmação"
            >
                {actionToConfirm === 'sair' && (
                    <>
                        <p>Tem certeza que deseja sair deste curso?</p>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={closeConfirmModal}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmAction}>
                                Sim, Sair do Curso
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                isOpen={isResultModalOpen}
                onClose={closeResultModal}
                title={getResultModalTitle()}
            >
                {getResultModalBody()}
            </Modal>

            <div className="container mt-5">
                <div className="row g-4 align-items-start">
                    {/* Imagem */}
                    <div className="col-md-4">
                        <img
                            src={curso?.thumbnail || 'https://placehold.co/300x180.png?text=TheSoftskills'}
                            alt={curso?.nome}
                            className="img-fluid rounded shadow-sm"
                        />
                    </div>

                    {/* Informações do curso */}
                    <div className="col-md-8">
                        <h1 className="h3">{curso?.nome}</h1>

                        {curso?.disponivel !== null && curso?.disponivel !== undefined && !curso?.disponivel && (
                            <><div className="btn btn-primary static-button">Arquivado</div><br /></>
                        )}


                        {!inscrito ? (
                            <>
                                <p className="mt-4">
                                    <strong>Inscrições:</strong> {formatData(curso?.iniciodeinscricoes)} até {formatData(curso?.fimdeinscricoes)}<br />
                                    {curso?.maxinscricoes !== null && curso?.maxinscricoes !== undefined && curso?.maxinscricoes && (
                                        <><strong>Máx. inscrições:</strong> {curso?.maxinscricoes}<br /></>
                                    )}
                                </p>
                                <button
                                    onClick={handleClickInscrever}
                                    className={`btn btn-sm btn-primary`}
                                    disabled={loading}
                                >
                                    {loading && operationStatus === null ? 'A inscrever...' : 'Inscrever'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleClickSair}
                                    className={`mt-2 btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3`} 
                                    disabled={loading}
                                >
                                    {loading && operationStatus === null ? 'A sair...' : 'Sair do Curso'}
                                </button>

                                {

                                  curso?.planocurricular && (

                                    <p className="mt-4">
                                        <strong>Plano Curricular:</strong><br />
                                        {curso?.planocurricular}
                                    </p>

                                  )

                                }
                            </>
                        )}
                    </div>
                </div>

                {!inscrito && curso?.planocurricular && (
                    <div className="mt-5">
                        <h2 className="h4">Plano Curricular</h2>
                        <p>{curso?.planocurricular}</p>
                    </div>
                )}

                <div className="mt-2 row g-4">
                    {curso?.topicos?.length > 0 && (
                        <div className="col-12">
                            <h2 className="h4">Tópicos</h2>
                            <div className="d-flex flex-wrap gap-2">
                                {curso.topicos.slice(0, showAllTopicos ? curso.topicos.length : maxVisibleTopics).map((topico) => (
                                    <div key={topico.idtopico} className="btn btn-primary static-button">
                                        {topico.designacao}
                                    </div>
                                ))}
                            </div>
                            {!showAllTopicos && curso.topicos.length > maxVisibleTopics && (
                                <button onClick={handleShowMoreTopicos} className="btn btn-link mt-2">
                                    Mostrar mais
                                </button>
                            )}
                            {showAllTopicos && curso.topicos.length > maxVisibleTopics && (
                                <button onClick={() => setShowAllTopicos(false)} className="btn btn-link mt-2">
                                    Mostrar menos
                                </button>
                            )}
                        </div>
                    )}
                </div>


                {inscrito && (
                    <div className="mt-5">
                        <h2 className="h4">Lições e sessões passadas</h2>
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
                                                        <h6>Materiais :</h6>
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
                                                    <p>Nenhum material disponível para esta lição.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Nenhuma lição disponível para este curso.</p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default Curso;
