import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@shared/services/axios.js';
import Modal from '@shared/components/Modal'; 

const CriarCurso = () => {
    const navigate = useNavigate();

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
    const [previewThumbnail, setPreviewThumbnail] = useState('');

    const [allTopicos, setAllTopicos] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [operationStatus, setOperationStatus] = useState(null); 
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
            navigate('/backoffice/cursos'); 
        }
    };

    useEffect(() => {
        const fetchTopicos = async () => {
            try {
                const topicosRes = await api.get('/topico/list');
                setAllTopicos(topicosRes.data.map(topico => ({
                    ...topico,
                    idtopico: parseInt(topico.idtopico)
                })));
            } catch (err) {
                console.error("Erro ao carregar tópicos:", err);
                setError("Erro ao carregar a lista de tópicos.");
            }
        };
        fetchTopicos();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        setThumbnailFile(file);
        if (file) {
            setPreviewThumbnail(URL.createObjectURL(file));
        } else {
            setPreviewThumbnail('');
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
        setError(null); 
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
                topicos: formData.topicos,
            };

            if (formData.fimdeinscricoes) {
                info.fimdeinscricoes = formData.fimdeinscricoes;
            }
            if (formData.maxinscricoes) {
                info.maxinscricoes = parseInt(formData.maxinscricoes); 
            }
            if (formData.planocurricular) {
                info.planocurricular = formData.planocurricular;
            }

            data.append('info', JSON.stringify(info));

            const res = await api.post('/curso/cursoassincrono', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setOperationStatus(0);
            setOperationMessage(res.data.message || "Curso criado com sucesso!");
            setFormData({ 
                nome: '',
                disponivel: false,
                iniciodeinscricoes: '',
                fimdeinscricoes: '',
                maxinscricoes: '',
                planocurricular: '',
                topicos: [],
            });
            setThumbnailFile(null);
            setPreviewThumbnail('');


        } catch (err) {
            console.error("Erro ao criar curso:", err);
            setOperationStatus(1);
            setOperationMessage(err.response?.data?.message || "Erro ao criar o curso.");
        } finally {
            setLoading(false);
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


    return (
        <div className="container mt-5">
            <h1 className="text-primary-blue mb-4">Criar Novo Curso</h1>

            <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm mb-5">
                <h2 className="h5 mb-4">Detalhes do Novo Curso</h2>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label htmlFor="nome" className="form-label">Nome do Curso: <span className="text-danger">*</span></label>
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
                        <label htmlFor="iniciodeinscricoes" className="form-label">Início das Inscrições: <span className="text-danger">*</span></label>
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
                        <label htmlFor="fimdeinscricoes" className="form-label">Fim das Inscrições (Opcional):</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            id="fimdeinscricoes"
                            name="fimdeinscricoes"
                            value={formatDataForInput(formData.fimdeinscricoes)}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="maxinscricoes" className="form-label">Máx. Inscrições (Opcional):</label>
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
                        <label htmlFor="planocurricular" className="form-label">Plano Curricular (Opcional):</label>
                        <textarea
                            className="form-control"
                            id="planocurricular"
                            name="planocurricular"
                            value={formData.planocurricular}
                            onChange={handleChange}
                            rows="5"
                        ></textarea>
                    </div>

                    <div className="col-md-4">
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
                        <label htmlFor="thumbnail" className="form-label">Thumbnail (Opcional):</label>
                        <input
                            type="file"
                            className="form-control"
                            id="thumbnail"
                            name="thumbnail"
                            onChange={handleThumbnailChange}
                            accept="image/*"
                        />
                        {previewThumbnail && (
                            <div className="mt-2">
                                <img src={previewThumbnail} alt="Preview da Thumbnail" className="img-thumbnail" style={{ maxWidth: '150px' }} />
                                <p className="text-muted mt-1">Preview da nova thumbnail</p>
                            </div>
                        )}
                    </div>

                    <div className="col-12">
                        <label className="form-label">Tópicos:</label>
                        <div className="border p-3 rounded d-flex flex-wrap gap-2">
                            {allTopicos.length > 0 ? (
                                allTopicos.map(topico => (
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
                                ))
                            ) : (
                                <p className="text-muted">A carregar tópicos...</p>
                            )}
                        </div>
                    </div>

                    <div className="col-12 text-end">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'A Criar...' : 'Criar Curso'}
                        </button>
                        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/cursos')}>
                            Cancelar
                        </button>
                    </div>
                </div>
            </form>

            <Modal
                isOpen={isResultModalOpen}
                onClose={closeResultModal}
                title={getResultModalTitle()}
            >
                {getResultModalBody()}
                <div className="d-flex justify-content-end mt-3">
                    <button type="button" className="btn btn-primary" onClick={closeResultModal}>Fechar</button>
                </div>
            </Modal>
        </div>
    );
};

export default CriarCurso;
