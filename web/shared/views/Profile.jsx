import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios.js";
import Modal from "../components/Modal.jsx";
import "../styles/curso.css";
import FileUpload from "../components/FileUpload.jsx";

const Profile = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const id = user?.idutilizador || user?.id;

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) =>
        typeof r === "string"
          ? { role: r.toLowerCase() }
          : {
              role: (r.role || r.nome || "").toLowerCase(),
              id: r.id,
            }
      )
    : [];

  const formandoRole = roles.find((r) => r.role === "formando");
  const isFormando = Boolean(formandoRole);
  const idFormando = formandoRole?.id || null;

  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [certificados, setCertificados] = useState([]); // ✅ Novo estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nome: "",
    email: "",
    morada: "",
    telefone: "",
    foto: null,
  });
  const [previewFoto, setPreviewFoto] = useState(null);
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");

  const openModal = (title, body) => {
    setModalTitle(title);
    setModalBody(body);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle("");
    setModalBody("");
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
          nome: response.data.nome || "",
          email: response.data.email || "",
          morada: response.data.morada || "",
          telefone: response.data.telefone || "",
          foto: null,
        });
        setPreviewFoto(response.data.foto);

        // ✅ Buscar certificados se for formando
        if (idFormando) {
          const respFormando = await api.get(`/utilizador/formando/id/${idFormando}`);
          setCertificados(respFormando.data?.certificados || []);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do utilizador:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Não foi possível carregar os dados do perfil.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, idFormando]);


  useEffect(() => {
    console.log(isFormando);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData((prevData) => ({ ...prevData, foto: file }));
      setPreviewFoto(URL.createObjectURL(file));
    } else {
      setEditData((prevData) => ({ ...prevData, foto: null }));
      setPreviewFoto(userData?.foto || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    const info = {};

    const nomeTrim = (editData.nome || "").trim();
    const emailTrim = (editData.email || "").trim();
    const moradaTrim = (editData.morada ?? "").trim();
    const telefoneTrim = (editData.telefone ?? "").toString().trim();

    const moradaVal = moradaTrim === "" ? null : moradaTrim;
    const telefoneVal = telefoneTrim === "" ? null : telefoneTrim;

    if (nomeTrim !== (userData.nome || "")) info.nome = nomeTrim;
    if (emailTrim !== (userData.email || "")) info.email = emailTrim;
    if ((userData.morada ?? null) !== moradaVal) info.morada = moradaVal;
    if ((userData.telefone ?? null) !== telefoneVal) info.telefone = telefoneVal;

    formData.append("info", JSON.stringify(info));
    if (editData.foto) {
      formData.append("foto", editData.foto);
    }

    if (Object.keys(info).length === 0 && !editData.foto) {
      openModal("Atenção", "Nenhuma alteração detetada.");
      setLoading(false);
      setIsEditing(false);
      return;
    }

    try {
      const response = await api.put(`/utilizador/id/${id}`, formData);
      if (user) {
        const updatedUser = { ...user, ...response.data };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setUserData(response.data);
      setIsEditing(false);
      openModal("Sucesso", "Perfil atualizado com sucesso!");

      setEditData((prevData) => ({ ...prevData, foto: null }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Ocorreu um erro ao atualizar o perfil. Tente novamente.";
      openModal("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      nome: userData.nome || "",
      email: userData.email || "",
      morada: userData.morada || "",
      telefone: userData.telefone || "",
      foto: null,
    });
    setPreviewFoto(userData.foto);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetPasswordClick = () => {
    navigate("/forgotpassword");
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
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-2 text-muted">A carregar o perfil...</p>
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
                {isEditing ? "Editar Perfil" : "Perfil do Utilizador"}
              </h2>

              {/* Foto de perfil */}
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <img
                  src={previewFoto || "https://placehold.co/150x150.png?text=Sem+Foto"}
                  alt="Foto de Perfil"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "3px solid #007bff",
                  }}
                />
                {isEditing && (
                  <div style={{ marginTop: "1rem" }}>
                    <FileUpload
                      id="foto-perfil"
                      label={null}
                      accept="image/jpeg,image/png"
                      onSelect={(file) => {
                        if (file) {
                          setEditData((prev) => ({ ...prev, foto: file }));
                          setPreviewFoto(URL.createObjectURL(file));
                        } else {
                          setEditData((prev) => ({ ...prev, foto: null }));
                          setPreviewFoto(userData?.foto || null);
                        }
                      }}
                    />
                    <small className="form-text text-muted">
                      Apenas JPG/PNG são aceites.
                    </small>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div>
                  <p>
                    <strong>Nome:</strong> {userData.nome}
                  </p>
                  <p>
                    <strong>Email:</strong> {userData.email}
                  </p>
                  <p>
                    <strong>Morada:</strong>{" "}
                    {userData.morada || "Não especificada"}
                  </p>
                  <p>
                    <strong>Telefone:</strong>{" "}
                    {userData.telefone || "Não especificado"}
                  </p>
                  <p>
                    <strong>Roles:</strong>{" "}
                    {userData.roles && userData.roles.length > 0
                      ? userData.roles.map((r) => r.role).join(", ")
                      : "Nenhum"}
                  </p>
                  <p>
                    <strong>Membro desde:</strong>{" "}
                    {new Date(userData.dataregisto).toLocaleDateString("pt-PT")}
                  </p>

                  {/* ✅ Lista de certificados se for formando */}
                  {isFormando && (
                    <div className="mt-4">
                      <h5>Certificados</h5>
                      {certificados.length === 0 ? (
                        <p className="text-muted">Nenhum certificado disponível.</p>
                      ) : (
                        <ul className="list-group">
                          {certificados.map((cert) => (
                            <li
                              key={cert.idcertificado}
                              className="list-group-item"
                            >
                              <strong>{cert.nome}</strong>
                              <br />
                              <span className="text-muted">{cert.descricao}</span>
                              <br />
                              <small className="text-muted">
                                Emitido em:{" "}
                                {new Date(cert.criado).toLocaleDateString("pt-PT")}
                              </small>
                              <br />
                              <a
                                href={`/certificado/${cert.chave}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary mt-2"
                              >
                                Ver certificado
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="d-flex justify-content-between mt-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary"
                    >
                      Editar Perfil
                    </button>
                    <button
                      onClick={handleResetPasswordClick}
                      className="btn btn-info"
                    >
                      Redefinir Password
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="nome" className="form-label">
                      Nome:
                    </label>
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
                    <label htmlFor="email" className="form-label">
                      Email:
                    </label>
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
                    <label htmlFor="morada" className="form-label">
                      Morada:
                    </label>
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
                    <label htmlFor="telefone" className="form-label">
                      Telefone:
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="telefone"
                      name="telefone"
                      value={editData.telefone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
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
                      {loading ? "A guardar..." : "Guardar Alterações"}
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

export default Profile;
