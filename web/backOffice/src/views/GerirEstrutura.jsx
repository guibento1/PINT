import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/services/axios';
import Modal from '../../../shared/components/Modal';

export default function GerirEstrutura() {

    const [estruturaCompleta, setEstruturaCompleta] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [operationStatus, setOperationStatus] = useState(null); // null: nenhum, 0: sucesso, 1: erro
    const [operationMessage, setOperationMessage] = useState(''); 
    const [isResultModalOpen, setIsResultModalOpen] = useState(false); 

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); 
    const [actionToConfirm, setActionToConfirm] = useState(null); 
    const [dataToConfirm, setDataToConfirm] = useState(null); 

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
        setOperationStatus(null);
        setOperationMessage('');

        if (operationStatus === 0) {
            getEstruturaCompleta().then(data => {
                setEstruturaCompleta(data);
            }).catch(err => {
                setError('Erro ao recarregar a estrutura após a operação.');
                console.error(err);
            });
        }
    };

    const openConfirmModal = (action, data) => {
        setActionToConfirm(action);
        setDataToConfirm(data);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setActionToConfirm(null);
        setDataToConfirm(null);
    };

    const handleConfirmAction = async () => {
        closeConfirmModal(); 

        setLoading(true);
        setOperationStatus(null);
        setOperationMessage('');

        try {
            if (actionToConfirm === 'eliminarCategoria' && dataToConfirm?.idcategoria) {
                await api.delete(`/categoria/id/${dataToConfirm.idcategoria}`);
                setOperationStatus(0);
                setOperationMessage('Categoria eliminada com sucesso!');
            } else if (actionToConfirm === 'eliminarArea' && dataToConfirm?.idarea) {
                await api.delete(`/area/id/${dataToConfirm.idarea}`);
                setOperationStatus(0);
                setOperationMessage('Área eliminada com sucesso!');
            } else if (actionToConfirm === 'eliminarTopico' && dataToConfirm?.idtopico) {
                await api.delete(`/topico/id/${dataToConfirm.idtopico}`);
                setOperationStatus(0);
                setOperationMessage('Tópico eliminado com sucesso!');
            } else {
                throw new Error('Ação de confirmação desconhecida ou dados incompletos.');
            }
        } catch (err) {
            console.error('Erro na operação:', err);
            setOperationStatus(1);
            if (err.response && err.response.data && err.response.data.message) {
                setOperationMessage(err.response.data.message);
            } else if (err.message) {
                setOperationMessage("Erro de rede: " + err.message);
            } else {
                setOperationMessage("Ocorreu um erro desconhecido.");
            }
        } finally {
            setLoading(false);
            openResultModal(); 
        }
    };

    const getEstruturaCompleta = async () => {
        try {
            const resCategorias = await api.get(`/categoria/list`);
            const categoriasData = resCategorias.data;

            const estruturaAninhada = await Promise.all(
                categoriasData.map(async (categoria) => {
                    let areasComTopicos = [];
                    try {
                        const resAreas = await api.get(`/categoria/id/${categoria.idcategoria}/list`);
                        const areasData = resAreas.data;

                        areasComTopicos = await Promise.all(
                            areasData.map(async (area) => {
                                let topicos = [];
                                try {
                                    const resTopicos = await api.get(`/area/id/${area.idarea}/list`);
                                    
                                    topicos = await Promise.all(resTopicos.data.map(async (topico) => {
                                        let dependencias = null;
                                        try {
                                            const resNobjetos = await api.get(`/topico/id/${topico.idtopico}/nobjetos`);
                                            if (resNobjetos && resNobjetos.data) {
                                                dependencias = resNobjetos.data;
                                            }
                                        } catch (nObjetosError) {
                                            console.error(`Erro ao buscar número de objetos para o tópico ${topico.idtopico}:`, nObjetosError);
                                            dependencias = null; 
                                        }
                                        return { ...topico, dependencias: dependencias
                                        };
                                    }));

                                } catch (topicoError) {
                                    console.error(`Erro ao buscar tópicos para área ${area.idarea}:`, topicoError);
                                }
                                return {
                                    ...area,
                                    topicos: topicos || []
                                };
                            })
                        );
                    } catch (areaError) {
                        console.error(`Erro ao buscar áreas para categoria ${categoria.idcategoria}:`, areaError);
                    }
                    return {
                        ...categoria,
                        areas: areasComTopicos || []
                    };
                })
            );
            return estruturaAninhada;
        } catch (fetchError) {
            console.error('Erro ao buscar a estrutura completa:', fetchError);
            throw fetchError;
        }
    };

    useEffect(() => {
        const fetchAndSetStructure = async () => {
            try {
                setLoading(true);
                const data = await getEstruturaCompleta();
                setEstruturaCompleta(data);
            } catch (err) {
                setError('Não foi possível carregar a estrutura. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetStructure();
    }, [isResultModalOpen]); // Dependência adicionada para recarregar após o fechamento do modal de resultado

    const handleEditCategoria = (id) => {
        navigate(`/editar/categoria/${id}`);
    };

    const handleEliminarCategoria = (idCategoria, event) => {
        event.stopPropagation();
        openConfirmModal('eliminarCategoria', { idcategoria: idCategoria });
    };

    const handleEditArea = (idArea) => {
        navigate(`/editar/area/${idArea}`);
    };

    const handleEliminarArea = (idCategoria, idArea, event) => {
        event.stopPropagation();
        openConfirmModal('eliminarArea', { idcategoria: idCategoria, idarea: idArea });
    };

    const handleEditTopico = (idTopico) => {
        navigate(`/editar/topico/${idTopico}`);
    };

    const handleEliminarTopico = (idCategoria, idArea, idTopico, event) => {
        event.stopPropagation();
        openConfirmModal('eliminarTopico', { idcategoria: idCategoria, idarea: idArea, idtopico: idTopico });
    };

    if (loading && !isResultModalOpen && !isConfirmModalOpen) {
        return <p>A carregar estrutura...</p>;
    }

    if (error) {
        return <p className="text-danger">{error}</p>;
    }

    return (
        <div className="container mt-4">
            <br />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Gerir Estrutura</h2>
                <div className="btn-group" role="group" aria-label="Botões de Criação">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm me-2 rounded-pill"
                        onClick={() => navigate('/criar/estrutura#categoria')}
                    >
                        Criar Categoria
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm me-2 rounded-pill"
                        onClick={() => navigate('/criar/estrutura#area')}
                    >
                        Criar Área
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-pill"
                        onClick={() => navigate('/criar/estrutura#topico')}
                    >
                        Criar Tópico
                    </button>
                </div>
            </div>

            {estruturaCompleta.length === 0 ? (
                <p>Nenhuma categoria encontrada.</p>
            ) : (
                <div className="accordion" id="estruturaAccordion">
                    {estruturaCompleta.map((categoria) => (
                        <div className="accordion-item rounded-3 mb-2" key={categoria.idcategoria}>
                            <h2 className="accordion-header d-flex align-items-center" id={`heading${categoria.idcategoria}`}>
                                <button
                                    className="accordion-button collapsed flex-grow-1"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target={`#collapseCategoria${categoria.idcategoria}`}
                                    aria-expanded="false"
                                    aria-controls={`collapseCategoria${categoria.idcategoria}`}
                                >
                                    <b>{categoria.designacao}</b>
                                </button>
                                <div className="btn-group me-2" role="group">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-info me-2 rounded-pill"
                                        onClick={() => handleEditCategoria(categoria.idcategoria)}
                                    >
                                        Editar
                                    </button>

                                    {categoria.areas.length === 0 && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3"
                                            onClick={(e) => handleEliminarCategoria(categoria.idcategoria, e)}
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </h2>
                            <div
                                id={`collapseCategoria${categoria.idcategoria}`}
                                className="accordion-collapse collapse"
                                aria-labelledby={`heading${categoria.idcategoria}`}
                                data-bs-parent="#estruturaAccordion"
                            >
                                <div className="accordion-body">
                                    <h4>Áreas:</h4>
                                    {categoria.areas && categoria.areas.length > 0 ? (
                                        <div className="accordion" id={`areasAccordion${categoria.idcategoria}`}>
                                            {categoria.areas.map((area) => (
                                                <div className="accordion-item rounded-3 mb-1" key={area.idarea}>
                                                    <h3 className="accordion-header d-flex align-items-center" id={`headingArea${area.idarea}`}>
                                                        <button
                                                            className="accordion-button collapsed flex-grow-1"
                                                            type="button"
                                                            data-bs-toggle="collapse"
                                                            data-bs-target={`#collapseArea${area.idarea}`}
                                                            aria-expanded="false"
                                                            aria-controls={`collapseArea${area.idarea}`}
                                                        >
                                                            {area.designacao}
                                                        </button>
                                                        <div className="btn-group me-2" role="group">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-info me-2 rounded-pill"
                                                                onClick={() => handleEditArea(area.idarea)}
                                                            >
                                                                Editar
                                                            </button>
                                                            {area.topicos.length === 0 && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3"
                                                                    onClick={(e) => handleEliminarArea(categoria.idcategoria, area.idarea, e)}
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </h3>
                                                    <div
                                                        id={`collapseArea${area.idarea}`}
                                                        className="accordion-collapse collapse"
                                                        aria-labelledby={`headingArea${area.idarea}`}
                                                        data-bs-parent={`#areasAccordion${categoria.idcategoria}`}
                                                    >
                                                        <div className="accordion-body">
                                                            <h5>Tópicos:</h5>
                                                            {area.topicos && area.topicos.length > 0 ? (
                                                                <ul className="list-group">
                                                                    {area.topicos.map((topico) => (
                                                                            <li
                                                                                className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
                                                                                key={topico.idtopico}
                                                                            >
                                                                                <div className="d-flex align-items-center flex-grow-1">
                                                                                    <span className="fw-semibold me-3">{topico.designacao}</span> 
                                                                                    <div className="d-flex align-items-center gap-3"> 
                                                                                        {topico.dependencias?.nCursos !== undefined && (
                                                                                            <span className="badge bg-primary rounded-pill">
                                                                                                <i className="ri-book-open-line me-1"></i> {topico.dependencias.nCursos} Cursos
                                                                                            </span>
                                                                                        )}
                                                                                        {topico.dependencias?.nPosts !== undefined && (
                                                                                            <span className="badge bg-info rounded-pill text-dark">
                                                                                                <i className="ri-file-text-line me-1"></i> {topico.dependencias.nPosts} Posts
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="btn-group" role="group">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-sm btn-outline-info me-2 rounded-pill"
                                                                                        onClick={() => handleEditTopico(topico.idtopico)}
                                                                                    >
                                                                                        Editar
                                                                                    </button>
                                                                                    {topico.dependencias && topico.dependencias.nCursos === 0 && topico.dependencias.nPosts === 0 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3"
                                                                                            onClick={(e) => handleEliminarTopico(categoria.idcategoria, area.idarea, topico.idtopico, e)}
                                                                                        >
                                                                                            Eliminar
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p>Nenhum tópico encontrado para esta área.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>Nenhuma área encontrada para esta categoria.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}


                    <div className="alert alert-info mt-4" role="alert">
                        <i className="ri-information-line me-2"></i>
                        <strong>Atenção:</strong> Apenas é permitido eliminar Categorias, Áreas ou Tópicos quando não existirem dependências (Áreas, Tópicos, Cursos ou Posts) que os requeiram.
                    </div>
                </div>
            )}

            <Modal
                isOpen={isConfirmModalOpen}
                onClose={closeConfirmModal}
                title="Confirmação de Eliminação"
            >
                {actionToConfirm === 'eliminarCategoria' && (
                    <>
                        <p>Tem certeza que deseja eliminar esta Categoria?</p>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={closeConfirmModal}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmAction}>
                                Sim, Eliminar Categoria
                            </button>
                        </div>
                    </>
                )}

                {actionToConfirm === 'eliminarArea' && (
                    <>
                        <p>Tem certeza que deseja eliminar esta Área?</p>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={closeConfirmModal}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmAction}>
                                Sim, Eliminar Área
                            </button>
                        </div>
                    </>
                )}

                {actionToConfirm === 'eliminarTopico' && (
                    <>
                        <p>Tem certeza que deseja eliminar este Tópico?</p>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={closeConfirmModal}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmAction}>
                                Sim, Eliminar Tópico
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
                <div className="d-flex justify-content-end mt-4">
                    <button type="button" className="btn btn-primary" onClick={closeResultModal}>
                        OK
                    </button>
                </div>
            </Modal>
        </div>
    );
}
