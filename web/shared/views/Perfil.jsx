import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axios.js';
import Modal from '../components/Modal';

const Perfil = () => {

    const user = JSON.parse(sessionStorage.getItem('user'));
    const id = user?.id; 

    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [editData, setEditData] = useState({
        nome: '',
        email: '',
        morada: '',
        telefone: '',
        foto: null
    });
    const [previewFoto, setPreviewFoto] = useState(null);
    const fileInputRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalBody, setModalBody] = useState('');

    const openModal = (title, body) => {
        setModalTitle(title);
        setModalBody(body);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalTitle('');
        setModalBody('');
        window.location.reload();
    };

    useEffect(() => {

        if (!id) {
            setError("ID do utilizador não encontrado. Por favor, faça login novamente.");
            setLoading(false);
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/utilizador/id/${id}`);
                setUserData(response.data);
                setEditData({
                    nome: response.data.nome || '',
                    email: response.data.email || '',
                    morada: response.data.morada || '',
                    telefone: response.data.telefone || '',
                    foto: null 
                });
                setPreviewFoto(response.data.foto);
            } catch (err) {
                console.error("Erro ao carregar dados do utilizador:", err);
                const errorMessage = err.response?.data?.message || "Não foi possível carregar os dados do perfil.";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        

        fetchUserData();
    }, [id, navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditData(prevData => ({
                ...prevData,
                foto: file
            }));
            setPreviewFoto(URL.createObjectURL(file)); 
        } else {
            setEditData(prevData => ({
                ...prevData,
                foto: null
            }));
            setPreviewFoto(userData?.foto || null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        const info = {};

        if (editData.nome !== userData.nome) info.nome = editData.nome;
        if (editData.email !== userData.email) info.email = editData.email;
        if (editData.morada !== userData.morada) info.morada = editData.morada;
        if (editData.telefone !== userData.telefone) info.telefone = editData.telefone;

        formData.append('info', JSON.stringify(info));
        
        if (editData.foto) {
            formData.append('foto', editData.foto);
        }

        if (Object.keys(info).length === 0 && !editData.foto) {
            openModal("Atenção", "Nenhuma alteração detetada.");
            setLoading(false);
            setIsEditing(false);
            return;
        }

        try {
            const response = await api.put(`/utilizador/id/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (user) {
                const updatedUser = { ...user, ...response.data };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
            }

            setUserData(response.data); 
            setIsEditing(false);
            openModal("Sucesso", "Perfil atualizado com sucesso!");

            setEditData(prevData => ({
                ...prevData,
                foto: null
            }));
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            const errorMessage = err.response?.data?.message || "Ocorreu um erro ao atualizar o perfil. Tente novamente.";
            openModal("Erro", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({
            nome: userData.nome || '',
            email: userData.email || '',
            morada: userData.morada || '',
            telefone: userData.telefone || '',
            foto: null 
        });
        setPreviewFoto(userData.foto); 
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; 
        }
    };

    const handleResetPasswordClick = () => {
        navigate('/forgotpassword');
    };

    if (!id) {
        return (
            <div className="container mt-5">
                <p className="text-danger">ID do utilizador não disponível. Por favor, verifique se está logado.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mt-5">
                <p>Carregando perfil...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <p className="text-danger">{error}</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="container mt-5">
                <p>Nenhum dado de utilizador encontrado.</p>
            </div>
        );
    }

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
                {modalBody}
            </Modal>

            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card shadow-sm p-4">
                            <h2 className="card-title text-center mb-4">
                                {isEditing ? 'Editar Perfil' : 'Perfil do Utilizador'}
                            </h2>

                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <img
                                    src={previewFoto || 'https://placehold.co/150x150.png?text=Sem+Foto'}
                                    alt="Foto de Perfil"
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        border: '3px solid #007bff'
                                    }}
                                />
                                {isEditing && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/jpeg,image/png"
                                            className="form-control"
                                        />
                                        <small className="form-text text-muted">Apenas JPG/PNG são aceites.</small>
                                    </div>
                                )}
                            </div>

                            {!isEditing ? (
                                <div>
                                    <p><strong>Nome:</strong> {userData.nome}</p>
                                    <p><strong>Email:</strong> {userData.email}</p>
                                    <p><strong>Morada:</strong> {userData.morada || 'Não especificada'}</p>
                                    <p><strong>Telefone:</strong> {userData.telefone || 'Não especificado'}</p>
                                    <p>
                                        <strong>Roles:</strong>{' '}
                                        {userData.roles && userData.roles.length > 0
                                            ? userData.roles.map(r => r.role).join(', ')
                                            : 'Nenhum'
                                        }
                                    </p>
                                    <p><strong>Membro desde:</strong> {new Date(userData.dataregisto).toLocaleDateString('pt-PT')}</p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="btn btn-primary"
                                            style={{ flexGrow: 1 }}
                                        >
                                            Editar Perfil
                                        </button>
                                        <button
                                            onClick={handleResetPasswordClick}
                                            className="btn btn-info"
                                            style={{ flexGrow: 1 }}
                                        >
                                            Redefinir Password
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="nome" className="form-label">Nome:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nome"
                                            name="nome"
                                            value={editData.nome}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">Email:</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            value={editData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="morada" className="form-label">Morada:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="morada"
                                            name="morada"
                                            value={editData.morada}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="telefone" className="form-label">Telefone:</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="telefone"
                                            name="telefone"
                                            value={editData.telefone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="btn btn-secondary"
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'A guardar...' : 'Guardar Alterações'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Perfil;
