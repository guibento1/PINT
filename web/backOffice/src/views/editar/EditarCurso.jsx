import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/axios.js';
import Modal from '../../../../shared/components/Modal';

const EditarCurso = () => {
    const { id } = useParams(); // id do curso
    const navigate = useNavigate();

    const [curso, setCurso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        disponivel: false,
        iniciodeinscricoes: '',
        fimdeinscricoes: '',
        maxinscricoes: '',
        planocurricular: '',
        topicos: [],     
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [currentThumbnail, setCurrentThumbnail] = useState('');

    const [allTopicos, setAllTopicos] = useState([]);

    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDescription, setNewLessonDescription] = useState('');
    const [addingLesson, setAddingLesson] = useState(false);

    const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
    const [lessonToAddTo, setLessonToAddTo] = useState(null); 
    const [newContentTitle, setNewContentTitle] = useState('');
    const [newContentType, setNewContentType] = useState('');
    const [newContentLink, setNewContentLink] = useState('');
    const [newContentFile, setNewContentFile] = useState(null);
    const [addingContent, setAddingContent] = useState(false);

    const [isDeleteLessonModalOpen, setIsDeleteLessonModalOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState(null);
    const [deletingLesson, setDeletingLesson] = useState(false);

    const [isDeleteMaterialModalOpen, setIsDeleteMaterialModalOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [deletingMaterial, setDeletingMaterial] = useState(false);

    const [operationStatus, setOperationStatus] = useState(null); // null: nenhum, 0: sucesso, 1: erro
    const [operationMessage, setOperationMessage] = useState('');
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);


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
        if (operationStatus === 0) {
            fetchCursoAndRelatedData();
        }
    };

    const fetchCursoAndRelatedData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const cursoRes = await api.get(`/curso/${id}`);
            const cursoData = cursoRes.data[0] || cursoRes.data; 

            if (cursoData) {
                setCurso(cursoData);
                setFormData({
                    nome: cursoData.nome || '',
                    disponivel: cursoData.disponivel || false,
                    iniciodeinscricoes: cursoData.iniciodeinscricoes ? new Date(cursoData.iniciodeinscricoes).toISOString().slice(0, 16) : '',
                    fimdeinscricoes: cursoData.fimdeinscricoes ? new Date(cursoData.fimdeinscricoes).toISOString().slice(0, 16) : '',
                    maxinscricoes: cursoData.maxinscricoes || '',
                    planocurricular: cursoData.planocurricular || '',
                    topicos: cursoData.topicos?.map(t => parseInt(t.idtopico)) || [],
                });
                setCurrentThumbnail(cursoData.thumbnail || '');
            } else {
                setError("Curso não encontrado.");
            }

            const topicosRes = await api.get('/topico/list');
            setAllTopicos(topicosRes.data.map(topico => ({
                ...topico,
                idtopico: parseInt(topico.idtopico)
            })));

        } catch (err) {
            console.error("Erro ao carregar dados para edição:", err);
            setError("Erro ao carregar os dados do curso ou listas relacionadas.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCursoAndRelatedData();
    }, [fetchCursoAndRelatedData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleThumbnailChange = (e) => {
        setThumbnailFile(e.target.files[0]);
        if (e.target.files[0]) {
            setCurrentThumbnail(URL.createObjectURL(e.target.files[0]));
        } else {
            setCurrentThumbnail(curso?.thumbnail || '');
        }
    };

    const handleTopicChange = (e) => {
        const topicId = parseInt(e.target.value);
        setFormData(prev => {
            const updatedTopicos = prev.topicos.includes(topicId)
                ? prev.topicos.filter(t => t !== topicId)
                : [...prev.topicos, topicId];
            return { ...prev, topicos: updatedTopicos };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setOperationStatus(null);
        setOperationMessage('');

        try {
            const data = new FormData();

            if (thumbnailFile) {
                data.append('thumbnail', thumbnailFile);
            }

            const info = {
                nome: formData.nome,
                disponivel: formData.disponivel,
                iniciodeinscricoes: formData.iniciodeinscricoes,
                fimdeinscricoes: formData.fimdeinscricoes,
                maxinscricoes: parseInt(formData.maxinscricoes) || null,
                planocurricular: formData.planocurricular,
                topicos: formData.topicos,
            };

            data.append('info', JSON.stringify(info));

            const endpoint = `/curso/cursoassincrono/${id}`; 
            const res = await api.put(endpoint, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setOperationStatus(0);
            setOperationMessage(res.data.message || "Curso atualizado com sucesso!");

        } catch (err) {
            console.error("Erro ao atualizar curso:", err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || "Erro ao atualizar o curso.");
        } finally {
            setLoading(false);
            openResultModal();
        }
    };

    const handleAddLessonClick = () => {
        setNewLessonTitle('');
        setNewLessonDescription('');
        setIsAddLessonModalOpen(true);
    };

    const handleCreateLesson = async () => {
        setAddingLesson(true);
        try {
            const res = await api.post(`/curso/licao/${curso.idcrono}`, {
                titulo: newLessonTitle,
                descricao: newLessonDescription
            });
            setOperationStatus(0);
            setOperationMessage(res.data.message || "Lição adicionada com sucesso!");
            setIsAddLessonModalOpen(false); 
        } catch (err) {
            console.error("Erro ao adicionar lição:", err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || "Erro ao adicionar a lição.");
        } finally {
            setAddingLesson(false);
            openResultModal(); // Abre o modal de resultado
        }
    };

    const handleDeleteLessonClick = (licao) => {
        setLessonToDelete(licao);
        setIsDeleteLessonModalOpen(true);
    };

    const confirmDeleteLesson = async () => {
        if (!lessonToDelete) return;
        setDeletingLesson(true);
        try {
            const res = await api.delete(`/curso/licao/${lessonToDelete.idlicao}`);
            setOperationStatus(0);
            setOperationMessage(res.data.message || "Lição eliminada com sucesso!");
            setIsDeleteLessonModalOpen(false); // Fecha o modal
        } catch (err) {
            console.error("Erro ao eliminar lição:", err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || "Erro ao eliminar a lição.");
        } finally {
            setDeletingLesson(false);
            openResultModal();
        }
    };

    // --- Funções para Gerir Conteúdo de Lições ---
    const handleAddContentClick = (licao) => {
        setLessonToAddTo(licao);
        setNewContentTitle('');
        setNewContentType('');
        setNewContentLink('');
        setNewContentFile(null);
        setIsAddContentModalOpen(true);
    };

    const handleContentFileChange = (e) => {
        setNewContentFile(e.target.files[0]);
    };

    const handleCreateContent = async () => {
        if (!lessonToAddTo) return;
        setAddingContent(true);

        try {
            const data = new FormData();
            const info = {
                titulo: newContentTitle,
                tipo: parseInt(newContentType)
            };

            if (newContentLink) {
                info.link = newContentLink;
            }

            data.append('info', JSON.stringify(info));

            if (newContentFile) {
                data.append('ficheiro', newContentFile);
            }

            const res = await api.post(`/curso/licao/${lessonToAddTo.idlicao}/addContent`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setOperationStatus(0);
            setOperationMessage(res.data.message || "Conteúdo adicionado com sucesso!");
            setIsAddContentModalOpen(false); // Fecha o modal
        } catch (err) {
            console.error("Erro ao adicionar conteúdo:", err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || "Erro ao adicionar o conteúdo.");
        } finally {
            setAddingContent(false);
            openResultModal();
        }
    };

    const handleDeleteMaterialClick = (material) => {
        setMaterialToDelete(material);
        setIsDeleteMaterialModalOpen(true);
    };

    const confirmDeleteMaterial = async () => {
        if (!materialToDelete) return;
        setDeletingMaterial(true);
        try {
            const res = await api.delete(`/curso/licao/material/${materialToDelete.idmaterial}`); 
            setOperationStatus(0);
            setOperationMessage(res.data.message || "Material eliminado com sucesso!");
            setIsDeleteMaterialModalOpen(false); // Fecha o modal
        } catch (err) {
            console.error("Erro ao eliminar material:", err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || "Erro ao eliminar o material.");
        } finally {
            setDeletingMaterial(false);
            openResultModal();
        }
    };


    const formatDataForInput = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); 
            return date.toISOString().slice(0, 16);
        } catch {
            return '';
        }
    };

    const getMaterialIcon = (tipo) => {
        switch (tipo) {
            case 1:
                return <i className="ri-slideshow-line me-2"></i>; // Apresentação
            case 2:
                return <i className="ri-file-text-line me-2"></i>; // Documento
            case 3:
                return <i className="ri-external-link-line me-2"></i>; // Link
            case 4:
                return <i className="ri-file-excel-line me-2"></i>; // Planilha
            case 5:
                return <i className="ri-video-line me-2"></i>; // Vídeo
            case 6:
                return <i className="ri-file-zip-line me-2"></i>; // Arquivo compactado
            default:
                return <i className="ri-file-line me-2"></i>; // Genérico
        }
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center my-5">
                    <div className="spinner-border text-primary-blue" role="status">
                        <span className="visually-hidden">A carregar curso para edição...</span>
                    </div>
                    <p className="mt-2 text-muted">A carregar dados do curso...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center my-5" role="alert">
                    {error}
                </div>
                <div className="text-center">
                    <button className="btn btn-secondary" onClick={() => navigate('/backoffice/cursos')}>
                        Voltar à Gestão de Cursos
                    </button>
                </div>
            </div>
        );
    }

    if (!curso) {
        return (
            <div className="container mt-5">
                <div className="alert alert-info text-center my-5" role="alert">
                    Curso não encontrado.
                </div>
                <div className="text-center">
                    <button className="btn btn-secondary" onClick={() => navigate('/backoffice/cursos')}>
                        Voltar à Gestão de Cursos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h1 className="text-primary-blue mb-4">Editar Curso: {curso.nome}</h1>

            <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm mb-5">
                <h2 className="h5 mb-4">Detalhes do Curso</h2>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label htmlFor="nome" className="form-label">Nome do Curso:</label>
                        <input
                            type="text"
                            className="form-control"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="col-md-6">
                        <label htmlFor="iniciodeinscricoes" className="form-label">Início das Inscrições:</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            id="iniciodeinscricoes"
                            name="iniciodeinscricoes"
                            value={formatDataForInput(formData.iniciodeinscricoes)}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="fimdeinscricoes" className="form-label">Fim das Inscrições:</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            id="fimdeinscricoes"
                            name="fimdeinscricoes"
                            value={formatDataForInput(formData.fimdeinscricoes)}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="col-md-4">
                        <label htmlFor="maxinscricoes" className="form-label">Máx. Inscrições:</label>
                        <input
                            type="number"
                            className="form-control"
                            id="maxinscricoes"
                            name="maxinscricoes"
                            value={formData.maxinscricoes}
                            onChange={handleChange}
                            min="1"
                        />
                    </div>
                    
                    <div className="col-12">
                        <label htmlFor="planocurricular" className="form-label">Plano Curricular:</label>
                        <textarea
                            className="form-control"
                            id="planocurricular"
                            name="planocurricular"
                            value={formData.planocurricular}
                            onChange={handleChange}
                            rows="5"
                        ></textarea>
                    </div>

                    <div className="col-md-6">
                        <div className="form-check form-switch mt-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="disponivel"
                                name="disponivel"
                                checked={formData.disponivel}
                                onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="disponivel">Disponível para Inscrição</label>
                        </div>
                    </div>
                    
                    <div className="col-12">
                        <label htmlFor="thumbnail" className="form-label">Thumbnail:</label>
                        <input
                            type="file"
                            className="form-control"
                            id="thumbnail"
                            name="thumbnail"
                            onChange={handleThumbnailChange}
                            accept="image/*"
                        />
                        {currentThumbnail && (
                            <div className="mt-2">
                                <img src={currentThumbnail} alt="Thumbnail atual" className="img-thumbnail" style={{ maxWidth: '150px' }} />
                                <p className="text-muted mt-1">Thumbnail atual</p>
                            </div>
                        )}
                    </div>

                    <div className="col-12">
                        <label className="form-label">Tópicos:</label>
                        <div className="border p-3 rounded d-flex flex-wrap gap-2">
                            {allTopicos.map(topico => (
                                <div key={topico.idtopico} className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`topico-${topico.idtopico}`}
                                        value={topico.idtopico} 
                                        checked={formData.topicos.includes(topico.idtopico)}
                                        onChange={handleTopicChange}
                                    />
                                    <label className="form-check-label" htmlFor={`topico-${topico.idtopico}`}>
                                        {topico.designacao}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-12 text-end">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'A Atualizar...' : 'Atualizar Curso'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Gerir Lições */}
            <div className="mb-5 p-4 border rounded shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h5 mb-0">Lições do Curso</h2>
                    <button type="button" className="btn btn-success" onClick={handleAddLessonClick}>
                        <i className="ri-add-line"></i> Adicionar Lição
                    </button>
                </div>
                {curso.licoes && curso.licoes.length > 0 ? (
                    <ul className="list-group">
                        {curso.licoes.map(licao => (
                            <li key={licao.idlicao} className="list-group-item mb-3 p-3 rounded shadow-sm">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0">{licao.titulo}</h6>
                                    <div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-info me-2"
                                            onClick={() => handleAddContentClick(licao)}
                                            title="Adicionar Conteúdo"
                                        >
                                            <i className="ri-add-box-line"></i> Conteúdo
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteLessonClick(licao)}
                                            title="Eliminar Lição"
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-muted small">{licao.descricao}</p>

                                {licao.materiais && licao.materiais.length > 0 && (
                                    <div className="mt-3">
                                        <strong>Materiais:</strong>
                                        <ul className="list-unstyled mb-0">
                                            {licao.materiais.map(material => (
                                                <li key={material.idmaterial} className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                                                    <div>
                                                        {getMaterialIcon(material.tipo)}
                                                        {material.titulo}
                                                        {material.link && <span className="ms-2 badge bg-light text-dark">Link</span>}
                                                        {material.referencia && !material.link && <span className="ms-2 badge bg-light text-dark">Ficheiro</span>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteMaterialClick(material)}
                                                        title="Eliminar Material"
                                                    >
                                                        <i className="ri-delete-bin-line"></i>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="alert alert-info text-center">Nenhuma lição adicionada ainda.</div>
                )}
            </div>


            {/* Modal para Adicionar Lição */}
            <Modal
                isOpen={isAddLessonModalOpen}
                onClose={() => setIsAddLessonModalOpen(false)}
                title="Adicionar Nova Lição"
            >
                <form onSubmit={(e) => { e.preventDefault(); handleCreateLesson(); }}>
                    <div className="mb-3">
                        <label htmlFor="lessonTitle" className="form-label">Título da Lição:</label>
                        <input
                            type="text"
                            className="form-control"
                            id="lessonTitle"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="lessonDescription" className="form-label">Descrição da Lição:</label>
                        <textarea
                            className="form-control"
                            id="lessonDescription"
                            value={newLessonDescription}
                            onChange={(e) => setNewLessonDescription(e.target.value)}
                            rows="3"
                        ></textarea>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddLessonModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={addingLesson}>
                            {addingLesson ? 'A Adicionar...' : 'Adicionar Lição'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal para Adicionar Conteúdo a Lição */}
            <Modal
                isOpen={isAddContentModalOpen}
                onClose={() => setIsAddContentModalOpen(false)}
                title={`Adicionar Conteúdo à Lição: ${lessonToAddTo?.titulo}`}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleCreateContent(); }}>
                    <div className="mb-3">
                        <label htmlFor="contentTitle" className="form-label">Título do Conteúdo:</label>
                        <input
                            type="text"
                            className="form-control"
                            id="contentTitle"
                            value={newContentTitle}
                            onChange={(e) => setNewContentTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="contentType" className="form-label">Tipo de Conteúdo:</label>
                        <select
                            className="form-select"
                            id="contentType"
                            value={newContentType}
                            onChange={(e) => setNewContentType(e.target.value)}
                            required
                        >
                            <option value="">Selecione o Tipo</option>
                            <option value="1">Apresentação (Slides)</option>
                            <option value="2">Documento (PDF, Word, etc.)</option>
                            <option value="3">Link Externo</option>
                            <option value="4">Planilha (Excel)</option>
                            <option value="5">Vídeo</option>
                            <option value="6">Outro Ficheiro</option>
                        </select>
                    </div>

                    {newContentType === '3' ? ( // Se for link externo, mostra campo de link
                        <div className="mb-3">
                            <label htmlFor="contentLink" className="form-label">URL do Link:</label>
                            <input
                                type="url"
                                className="form-control"
                                id="contentLink"
                                value={newContentLink}
                                onChange={(e) => setNewContentLink(e.target.value)}
                                required
                            />
                        </div>
                    ) : ( // Para outros tipos, mostra campo de ficheiro
                        <div className="mb-3">
                            <label htmlFor="contentFile" className="form-label">Ficheiro:</label>
                            <input
                                type="file"
                                className="form-control"
                                id="contentFile"
                                onChange={handleContentFileChange}
                                required={!newContentLink && newContentType !== ''} // Obriga ficheiro se não for link e um tipo foi selecionado
                            />
                        </div>
                    )}

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddContentModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={addingContent}>
                            {addingContent ? 'A Adicionar...' : 'Adicionar Conteúdo'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmação de Eliminação de Lição */}
            <Modal
                isOpen={isDeleteLessonModalOpen}
                onClose={() => setIsDeleteLessonModalOpen(false)}
                title="Confirmar Eliminação de Lição"
            >
                {lessonToDelete && (
                    <p>Tem a certeza que deseja eliminar a lição <strong>"{lessonToDelete.titulo}"</strong>? Esta ação é irreversível e removerá todo o conteúdo associado.</p>
                )}
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsDeleteLessonModalOpen(false)}
                        disabled={deletingLesson}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={confirmDeleteLesson}
                        disabled={deletingLesson}
                    >
                        {deletingLesson ? 'A Eliminar...' : 'Eliminar'}
                    </button>
                </div>
            </Modal>

            {/* Modal de Confirmação de Eliminação de Material */}
            <Modal
                isOpen={isDeleteMaterialModalOpen}
                onClose={() => setIsDeleteMaterialModalOpen(false)}
                title="Confirmar Eliminação de Material"
            >
                {materialToDelete && (
                    <p>Tem a certeza que deseja eliminar o material <strong>"{materialToDelete.titulo}"</strong>?</p>
                )}
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsDeleteMaterialModalOpen(false)}
                        disabled={deletingMaterial}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={confirmDeleteMaterial}
                        disabled={deletingMaterial}
                    >
                        {deletingMaterial ? 'A Eliminar...' : 'Eliminar'}
                    </button>
                </div>
            </Modal>


            {/* Modal de Resultado (Sucesso/Erro de qualquer operação) */}
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
};

export default EditarCurso;
