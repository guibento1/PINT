import React, { useState, useEffect } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import api from '../../../../shared/services/axios.js';
import Modal from '../../../../shared/components/Modal.jsx'; 

export default function CriarEstrutura() {

    const navigate = useNavigate();
    const location = useLocation();

    const [categoriaDesignacao, setCategoriaDesignacao] = useState('');
    const [areaDesignacao, setAreaDesignacao] = useState('');
    const [areaCategoriaSelecionada, setAreaCategoriaSelecionada] = useState('');
    const [topicoDesignacao, setTopicoDesignacao] = useState('');
    const [topicoAreasSelecionadas, setTopicoAreasSelecionadas] = useState([]);

    const [categorias, setCategorias] = useState([]);
    const [areas, setAreas] = useState([]);

    const [operationStatus, setOperationStatus] = useState(null);
    const [operationMessage, setOperationMessage] = useState('');
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('categoria');

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash === 'area' || hash === 'topico' || hash === 'categoria') {
            setActiveTab(hash);
            const tabEl = document.getElementById(`${hash}-tab`);
            if (tabEl) {
                const tab = new window.bootstrap.Tab(tabEl);
                tab.show();
            }
        } else {
            setActiveTab('categoria');
            const tabEl = document.getElementById('categoria-tab');
            if (tabEl) {
                const tab = new window.bootstrap.Tab(tabEl);
                tab.show();
            }
        }
    }, [location.hash]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setDataLoading(true);
            try {
                const resCategorias = await api.get('/categoria/list');
                setCategorias(resCategorias.data);
                if (resCategorias.data.length > 0) {
                    setAreaCategoriaSelecionada(resCategorias.data[0].idcategoria.toString());
                }

                const resAreas = await api.get('/area/list');
                setAreas(resAreas.data);

            } catch (error) {
                console.error('Erro ao carregar dados iniciais:', error);
            } finally {
                setDataLoading(false);
            }
        };

        fetchInitialData();
    }, []);

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
            const reloadData = async () => {
                try {
                    if (activeTab === 'categoria' || activeTab === 'area') {
                        const resCategorias = await api.get('/categoria/list');
                        setCategorias(resCategorias.data);
                    }
                    if (activeTab === 'topico' || activeTab === 'area') {
                        const resAreas = await api.get('/area/list');
                        setAreas(resAreas.data);
                    }
                } catch (error) {
                    console.error("Erro ao recarregar dados após sucesso:", error);
                }
            };
            reloadData();
        }
    };

    const handleCreateCategoria = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/categoria', { designacao: categoriaDesignacao });
            setOperationStatus(0);
            setOperationMessage('Categoria criada com sucesso!');
            setCategoriaDesignacao('');
        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            setOperationStatus(1);
            setOperationMessage(error.response?.data?.message || 'Erro ao criar categoria.');
        } finally {
            setLoading(false);
            openResultModal();
        }
    };

    const handleCreateArea = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!areaCategoriaSelecionada) {
                throw new Error("Por favor, selecione uma Categoria.");
            }
            const categoriaIdNum = parseInt(areaCategoriaSelecionada, 10);

            await api.post('/area', {
                designacao: areaDesignacao,
                categoria: categoriaIdNum
            });
            setOperationStatus(0);
            setOperationMessage('Área criada com sucesso!');
            setAreaDesignacao('');
        } catch (error) {
            console.error('Erro ao criar área:', error);
            setOperationStatus(1);
            setOperationMessage(error.response?.data?.message || 'Erro ao criar área.');
        } finally {
            setLoading(false);
            openResultModal();
        }
    };

    const handleCreateTopico = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (topicoAreasSelecionadas.length === 0) {
                throw new Error("Por favor, selecione pelo menos uma Área.");
            }

            const areasIds = topicoAreasSelecionadas.map(id => parseInt(id, 10));

            await api.post('/topico', {
                designacao: topicoDesignacao,
                areas: areasIds
            });
            setOperationStatus(0);
            setOperationMessage('Tópico criado com sucesso!');
            setTopicoDesignacao('');
            setTopicoAreasSelecionadas([]);
        } catch (error) {
            console.error('Erro ao criar tópico:', error);
            setOperationStatus(1);
            setOperationMessage(error.response?.data?.message || 'Erro ao criar tópico.');
        } finally {
            setLoading(false);
            openResultModal();
        }
    };

    const handleTopicoAreaCheckboxChange = (e) => {
        const value = e.target.value;
        const isChecked = e.target.checked;

        setTopicoAreasSelecionadas(prev => {
            if (isChecked) {
                return [...prev, value];
            } else {
                return prev.filter(areaId => areaId !== value);
            }
        });
    };

    if (dataLoading) {
        return (
            <div className="container mt-4">
                <p>A carregar dados...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <br />
            <h2 className="mb-4">Criar Nova Estrutura</h2>

            <ul className="nav nav-tabs" id="myTab" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'categoria' ? 'active' : ''}`}
                        id="categoria-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#categoria"
                        type="button"
                        role="tab"
                        aria-controls="categoria"
                        aria-selected={activeTab === 'categoria'}
                        onClick={() => setActiveTab('categoria')}
                    >
                        Criar Categoria
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'area' ? 'active' : ''}`}
                        id="area-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#area"
                        type="button"
                        role="tab"
                        aria-controls="area"
                        aria-selected={activeTab === 'area'}
                        onClick={() => setActiveTab('area')}
                    >
                        Criar Área
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'topico' ? 'active' : ''}`}
                        id="topico-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#topico"
                        type="button"
                        role="tab"
                        aria-controls="topico"
                        aria-selected={activeTab === 'topico'}
                        onClick={() => setActiveTab('topico')}
                    >
                        Criar Tópico
                    </button>
                </li>
            </ul>

            <div className="tab-content" id="myTabContent">
                <div
                    className={`tab-pane fade ${activeTab === 'categoria' ? 'show active' : ''} p-3 border border-top-0 rounded-bottom`}
                    id="categoria"
                    role="tabpanel"
                    aria-labelledby="categoria-tab"
                >
                    <form onSubmit={handleCreateCategoria}>
                        <div className="mb-3">
                            <label htmlFor="categoriaDesignacao" className="form-label">Designação da Categoria</label>
                            <input
                                type="text"
                                className="form-control"
                                id="categoriaDesignacao"
                                value={categoriaDesignacao}
                                onChange={(e) => setCategoriaDesignacao(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'A Criar...' : 'Criar Categoria'}
                        </button>
                    </form>
                </div>

                <div
                    className={`tab-pane fade ${activeTab === 'area' ? 'show active' : ''} p-3 border border-top-0 rounded-bottom`}
                    id="area"
                    role="tabpanel"
                    aria-labelledby="area-tab"
                >
                    <form onSubmit={handleCreateArea}>
                        <div className="mb-3">
                            <label htmlFor="areaDesignacao" className="form-label">Designação da Área</label>
                            <input
                                type="text"
                                className="form-control"
                                id="areaDesignacao"
                                value={areaDesignacao}
                                onChange={(e) => setAreaDesignacao(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="areaCategoria" className="form-label">Categoria</label>
                            <select
                                className="form-select"
                                id="areaCategoria"
                                value={areaCategoriaSelecionada}
                                onChange={(e) => setAreaCategoriaSelecionada(e.target.value)}
                                required
                                disabled={loading || categorias.length === 0}
                            >
                                {categorias.length === 0 && <option value="">Nenhuma categoria disponível</option>}
                                {categorias.map((cat) => (
                                    <option key={cat.idcategoria} value={cat.idcategoria}>
                                        {cat.designacao}
                                    </option>
                                ))}
                            </select>
                            {categorias.length === 0 && <div className="form-text text-danger">Por favor, crie uma categoria primeiro.</div>}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading || categorias.length === 0}>
                            {loading ? 'A Criar...' : 'Criar Área'}
                        </button>
                    </form>
                </div>

                <div
                    className={`tab-pane fade ${activeTab === 'topico' ? 'show active' : ''} p-3 border border-top-0 rounded-bottom`}
                    id="topico"
                    role="tabpanel"
                    aria-labelledby="topico-tab"
                >
                    <form onSubmit={handleCreateTopico}>
                        <div className="mb-3">
                            <label htmlFor="topicoDesignacao" className="form-label">Designação do Tópico</label>
                            <input
                                type="text"
                                className="form-control"
                                id="topicoDesignacao"
                                value={topicoDesignacao}
                                onChange={(e) => setTopicoDesignacao(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Áreas</label>
                            {areas.length === 0 ? (
                                <div className="form-text text-danger">Nenhuma área disponível. Por favor, crie uma área primeiro.</div>
                            ) : (
                                <div className="border p-2 rounded" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {areas.map((area) => (
                                        <div className="form-check" key={area.idarea}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                value={area.idarea}
                                                id={`areaCheckbox-${area.idarea}`}
                                                onChange={handleTopicoAreaCheckboxChange}
                                                checked={topicoAreasSelecionadas.includes(area.idarea.toString())}
                                                disabled={loading}
                                            />
                                            <label className="form-check-label" htmlFor={`areaCheckbox-${area.idarea}`}>
                                                {area.designacao} 
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading || areas.length === 0 || topicoAreasSelecionadas.length === 0}>
                            {loading ? 'A Criar...' : 'Criar Tópico'}
                        </button>
                    </form>
                </div>
            </div>

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
