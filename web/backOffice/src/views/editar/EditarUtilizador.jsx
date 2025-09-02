import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../shared/services/axios.js";
import Modal from "../../../../shared/components/Modal";

const ALL_AVAILABLE_ROLES = ["admin", "formador", "formando"];

const EditarUtilizador = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editData, setEditData] = useState({
    nome: "",
    morada: "",
    telefone: "",
    foto: null,
    roles: [],
  });
  const [previewFoto, setPreviewFoto] = useState(null);
  const fileInputRef = useRef(null);

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseActionLoading, setCourseActionLoading] = useState(false);
  const [isCourseActionModalOpen, setIsCourseActionModalOpen] = useState(false);
  const [courseToActUpon, setCourseToActUpon] = useState(null);
  const [courseActionMessage, setCourseActionMessage] = useState("");
  const [courseActionStatus, setCourseActionStatus] = useState(null);

  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [globalModalTitle, setGlobalModalTitle] = useState("");
  const [globalModalBody, setGlobalModalBody] = useState("");

  const openGlobalModal = (title, body, redirect = false) => {
    setGlobalModalTitle(title);
    setGlobalModalBody(body);
    setIsGlobalModalOpen(true);
    if (redirect) {
      setTimeout(() => {
        closeGlobalModalAndRedirect();
      }, 1500);
    }
  };

  const closeGlobalModal = () => {
    setIsGlobalModalOpen(false);
    setGlobalModalTitle("");
    setGlobalModalBody("");
  };

  const closeGlobalModalAndRedirect = () => {
    setIsGlobalModalOpen(false);
    setGlobalModalTitle("");
    setGlobalModalBody("");
    navigate("/utilizadores");
  };

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userResponse = await api.get(`/utilizador/id/${id}`);
      const fetchedUserData = userResponse.data;
      setUserData(fetchedUserData);

      setEditData({
        nome: fetchedUserData.nome || "",
        morada: fetchedUserData.morada || "",
        telefone: fetchedUserData.telefone || "",
        foto: null,
        roles: fetchedUserData.roles.map((roleObj) => roleObj.role),
      });
      setPreviewFoto(fetchedUserData.foto);

      // ✅ Lógica para buscar certificados
      const formandoRole = fetchedUserData.roles.find(
        (r) => (r.role || "").toLowerCase() === "formando"
      );
      if (formandoRole) {
        const respFormando = await api.get(
          `/utilizador/formando/id/${formandoRole.id}`
        );
        setCertificados(respFormando.data?.certificados || []);
      } else {
        setCertificados([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do utilizador:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Não foi possível carregar os dados do utilizador.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEnrolledCourses = useCallback(async () => {
    setCourseActionLoading(true);
    try {
      const response = await api.get(`/curso/inscricoes/utilizador/${id}`);
      setEnrolledCourses(response.data);
    } catch (err) {
      console.error("Erro ao carregar cursos inscritos:", err);
      setEnrolledCourses([]);
    } finally {
      setCourseActionLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError("ID do utilizador não encontrado no URL.");
      setLoading(false);
      return;
    }
    fetchUserData();
    fetchEnrolledCourses();
  }, [id, fetchUserData, fetchEnrolledCourses]);

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
      setEditData((prevData) => ({
        ...prevData,
        foto: file,
      }));
      setPreviewFoto(URL.createObjectURL(file));
    } else {
      setEditData((prevData) => ({
        ...prevData,
        foto: null,
      }));
      setPreviewFoto(userData?.foto || null);
    }
  };

  const handleRoleChange = (e) => {
    const roleName = e.target.value;
    const isChecked = e.target.checked;

    setEditData((prevData) => {
      const currentRoles = new Set(prevData.roles);
      if (isChecked) {
        currentRoles.add(roleName);
      } else {
        currentRoles.delete(roleName);
      }
      return {
        ...prevData,
        roles: Array.from(currentRoles),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    const info = {};

    const addIfChangedAndNotEmpty = (key, newValue, originalValue) => {
      if (newValue !== originalValue) {
        info[key] = newValue === "" ? null : newValue;
      }
    };

    addIfChangedAndNotEmpty("nome", editData.nome, userData.nome);
    addIfChangedAndNotEmpty("morada", editData.morada, userData.morada);
    addIfChangedAndNotEmpty("telefone", editData.telefone, userData.telefone);

    const currentRoleNames = userData.roles.map((r) => r.role).sort();
    const newRoleNames = editData.roles.sort();

    if (JSON.stringify(currentRoleNames) !== JSON.stringify(newRoleNames)) {
      info.roles = newRoleNames;
    }

    if (Object.keys(info).length === 0 && !editData.foto) {
      openGlobalModal("Atenção", "Nenhuma alteração detetada.", false);
      setLoading(false);
      return;
    }

    formData.append("info", JSON.stringify(info));

    if (editData.foto) {
      formData.append("foto", editData.foto);
    }

    try {
      await api.put(`/utilizador/id/${id}`, formData);

      openGlobalModal("Sucesso", "Utilizador atualizado com sucesso!", true);

      setEditData((prevData) => ({ ...prevData, foto: null }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Erro ao atualizar utilizador:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Ocorreu um erro ao atualizar o utilizador. Tente novamente.";
      openGlobalModal("Erro", errorMessage, false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    navigate("/gerir-utilizadores");
  };

  const handleUnenrollClick = (course) => {
    setCourseToActUpon(course);
    setIsCourseActionModalOpen(true);
  };

  const confirmUnenroll = async () => {
    if (!courseToActUpon) return;

    setCourseActionLoading(true);
    try {
      await api.post(`/curso/${courseToActUpon.idcurso}/sair`, {
        utilizador: id,
      });
      setCourseActionStatus(0);
      setCourseActionMessage(
        `Utilizador desinscrito de "${courseToActUpon.nome}" com sucesso!`
      );
      fetchEnrolledCourses();
    } catch (err) {
      console.error("Erro ao desinscrever utilizador do curso:", err);
      setCourseActionStatus(1);
      setCourseActionMessage(
        err.response?.data?.message ||
          `Erro ao desinscrever de "${courseToActUpon.nome}".`
      );
    } finally {
      setCourseActionLoading(false);
      setIsCourseActionModalOpen(false);
      setCourseToActUpon(null);
      setIsGlobalModalOpen(true);
      setGlobalModalTitle(courseActionStatus === 0 ? "Sucesso" : "Erro");
      setGlobalModalBody(courseActionMessage);
    }
  };

  const closeCourseActionModal = () => {
    setIsCourseActionModalOpen(false);
    setCourseToActUpon(null);
  };

  // ✅ Lógica para verificar se o utilizador tem o papel de 'formando'
  const isFormando = editData.roles.includes("formando");

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary-blue" role="status">
          <span className="visually-hidden">Carregando dados...</span>
        </div>
        <p className="mt-2 text-muted">
          Carregando dados do utilizador e cursos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
        <div className="text-center mt-3">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/gerir-utilizadores")}
          >
            Voltar para a Gestão de Utilizadores
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mt-5">
        <p>Nenhum dado de utilizador encontrado para o ID {id}.</p>
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={isGlobalModalOpen}
        onClose={closeGlobalModal}
        title={globalModalTitle}
      >
        {globalModalBody}
        <div className="d-flex justify-content-end mt-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={
              globalModalTitle === "Sucesso"
                ? closeGlobalModalAndRedirect
                : closeGlobalModal
            }
          >
            OK
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isCourseActionModalOpen}
        onClose={closeCourseActionModal}
        title="Confirmar Desinscrição"
      >
        <p>
          Tem a certeza que deseja **desinscrever** o utilizador **"
          {userData.nome}"** do curso **"{courseToActUpon?.nome}"**?
        </p>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeCourseActionModal}
            disabled={courseActionLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmUnenroll}
            disabled={courseActionLoading}
          >
            {courseActionLoading ? "A desinscrever..." : "Desinscrever"}
          </button>
        </div>
      </Modal>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">
            <div className="card shadow-sm p-4 mb-4">
              <h2 className="card-title text-center mb-4">
                Editar Utilizador: {userData.nome}
              </h2>

              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <img
                  src={
                    previewFoto ||
                    "https://placehold.co/150x150.png?text=Sem+Foto"
                  }
                  alt="Foto de Perfil"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "3px solid #007bff",
                  }}
                />
                <div style={{ marginTop: "1rem" }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png"
                    className="form-control"
                  />
                  <small className="form-text text-muted">
                    Apenas JPG/PNG são aceites.
                  </small>
                </div>
              </div>

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
                    value={userData.email}
                    disabled
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

                <div className="mb-4">
                  <label className="form-label d-block">Roles:</label>
                  {ALL_AVAILABLE_ROLES.length > 0 ? (
                    ALL_AVAILABLE_ROLES.map((roleName) => (
                      <div
                        key={roleName}
                        className="form-check form-check-inline"
                      >
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`role-${roleName}`}
                          value={roleName}
                          checked={editData.roles.includes(roleName)}
                          onChange={handleRoleChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`role-${roleName}`}
                        >
                          {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">Nenhuma role disponível.</p>
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "A guardar..." : "Guardar Alterações"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => navigate("/utilizadores")}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>

            {/* ✅ Nova seção para certificados se o utilizador for formando */}
            {isFormando && (
              <div className="card shadow-sm p-4 mt-4">
                <h3 className="card-title text-center mb-4">Certificados</h3>
                {certificados.length === 0 ? (
                  <p className="text-muted text-center">Nenhum certificado disponível.</p>
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
            
            <div className="card shadow-sm p-4 mt-4">
              <h3 className="card-title text-center mb-4">Cursos Inscritos</h3>
              {courseActionLoading ? (
                <div className="text-center">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">
                      Carregando cursos...
                    </span>
                  </div>
                  <p className="mt-2 text-muted">
                    Carregando cursos inscritos...
                  </p>
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Nome do Curso</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledCourses.map((course) => (
                        <tr key={course.idcurso}>
                          <td>{course.nome}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleUnenrollClick(course)}
                              disabled={courseActionLoading}
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
                <p className="text-muted text-center">
                  Este utilizador não está inscrito em nenhum curso.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditarUtilizador;
