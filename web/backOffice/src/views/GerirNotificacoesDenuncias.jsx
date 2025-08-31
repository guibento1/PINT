import React, { useState, useEffect, useCallback } from "react";
import api from "@shared/services/axios.js";
import Modal from "@shared/components/Modal";
import { Link } from "react-router-dom";

const GerirNotificacoesDenuncias = () => {

  const [activeTab, setActiveTab] = useState("posts"); // Para as denúncias
  const [activeNotifTab, setActiveNotifTab] = useState("general"); // Para as notificações

  // Estados para Denúncias
  const [postsReports, setPostsReports] = useState([]);
  const [commentsReports, setCommentsReports] = useState([]);
  const [reportTypes, setReportTypes] = useState({});
  const [loadingReports, setLoadingReports] = useState(true);
  const [errorReports, setErrorReports] = useState(null);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [reportToDismiss, setReportToDismiss] = useState(null);
  const [dismissing, setDismissing] = useState(false);

  // Estados para Notificações
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [notifForm, setNotifForm] = useState({
    general: { titulo: "", conteudo: "" },
    admin: { titulo: "", conteudo: "" },
    personal: { titulo: "", conteudo: "", idutilizador: "" },
    course: { titulo: "", conteudo: "", idcurso: "" },
  });
  const [sendingNotif, setSendingNotif] = useState(false);

  // Estados para Modais de Resultado
  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // --- Funções de Fetch ---
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setErrorReports(null);
    try {
      const [postsRes, commentsRes, typesRes] = await Promise.all([
        api.get("/forum/denuncias/posts"),
        api.get("/forum/denuncias/comentarios"),
        api.get("/forum/denuncias/tipos"),
      ]);
      setPostsReports(postsRes.data);
      setCommentsReports(commentsRes.data);
      setReportTypes(
        typesRes.data.reduce((acc, type) => {
          acc[type.idtipodenuncia] = type.designacao;
          return acc;
        }, {})
      );
    } catch (err) {
      console.error("Erro ao carregar denúncias:", err);
      setErrorReports("Erro ao carregar as denúncias. Por favor, tente novamente.");
    } finally {
      setLoadingReports(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/utilizador/list");
      setUsers(res.data);
      setNotifForm(prev => ({ ...prev, personal: { ...prev.personal, idutilizador: res.data[0]?.idutilizador || "" } }));
    } catch (err) {
      console.error("Erro ao carregar utilizadores:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const res = await api.get("/curso/list");
      setCourses(res.data);
      setNotifForm(prev => ({ ...prev, course: { ...prev.course, idcurso: res.data[0]?.idcurso || "" } }));
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchUsers();
    fetchCourses();
  }, [fetchReports, fetchUsers, fetchCourses]);

  // --- Funções de Denúncias ---
  const handleDismissReportClick = (report) => {
    setReportToDismiss(report);
    setIsDismissModalOpen(true);
  };

  const confirmDismiss = async () => {
    if (!reportToDismiss) return;
    setDismissing(true);
    try {
      await api.delete(`/forum/denuncias/${reportToDismiss.iddenuncia}`);
      openResultModal(0, "Denúncia descartada com sucesso.");
      
      // Atualizar o estado local para remover a denúncia
      if (reportToDismiss.post) {
        setPostsReports(prev => prev.filter(report => report.iddenuncia !== reportToDismiss.iddenuncia));
      } else if (reportToDismiss.comentario) {
        setCommentsReports(prev => prev.filter(report => report.iddenuncia !== reportToDismiss.iddenuncia));
      }
    } catch (err) {
      console.error("Erro ao descartar denúncia:", err);
      openResultModal(1, err.response?.data?.message || "Erro ao descartar a denúncia.");
    } finally {
      setDismissing(false);
      setIsDismissModalOpen(false);
    }
  };

  const renderReportList = (reports) => {
    if (reports.length === 0) {
      return (
        <div className="alert alert-info text-center mt-4">
          Não existem denúncias para mostrar.
        </div>
      );
    }

    return (
      <div className="list-group">
        {reports.map((report) => (
          <div
            key={report.iddenuncia}
            className="list-group-item list-group-item-action d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 rounded shadow-sm p-3"
          >
            <div className="flex-grow-1">
              <h5 className="mb-1 h6 text-primary-blue">
                Denúncia #{report.iddenuncia} -{" "}
                {reportTypes[report.tipo] || "Tipo Desconhecido"}
              </h5>
              <p className="mb-1 text-muted small">
                Denunciado por:{" "}
                <strong>
                  <Link to={`/backoffice/editar/utilizador/${report.utilizador.id}`}>
                    {report.utilizador?.nome || "Utilizador desconhecido"}
                  </Link>
                </strong>
              </p>
              <p className="mb-0 text-dark">
                <span className="fw-bold">Descrição:</span> {report.decricao}
              </p>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2 mt-3 mt-md-0">
              <Link
                to={`/backoffice/forum/${
                  activeTab === "posts" ? "posts" : "comentarios"
                }/${activeTab === "posts" ? report.post : report.comentario}`}
                className="btn btn-outline-info btn-sm"
              >
                <i className="ri-eye-line me-1"></i> Ver Conteúdo
              </Link>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={() => handleDismissReportClick(report)}
              >
                <i className="ri-check-line me-1"></i> Descartar
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --- Funções de Notificações ---
  const handleNotifChange = (e, type) => {
    const { name, value } = e.target;
    setNotifForm(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [name]: value,
      },
    }));
  };

  const handleNotifSubmit = async (e) => {
    e.preventDefault();
    setSendingNotif(true);

    const currentForm = notifForm[activeNotifTab];
    let endpoint = "";
    let body = {};

    try {
      switch (activeNotifTab) {
        case "general":
          endpoint = "/notificacao/create/general";
          body = { titulo: currentForm.titulo, conteudo: currentForm.conteudo };
          break;
        case "admin":
          endpoint = "/notificacao/create/admin";
          body = { titulo: currentForm.titulo, conteudo: currentForm.conteudo };
          break;
        case "personal":
          endpoint = `/notificacao/create/utilizador/${currentForm.idutilizador}`;
          body = { titulo: currentForm.titulo, conteudo: currentForm.conteudo };
          break;
        case "course":
          endpoint = "/notificacao/create/course";
          body = { idcurso: parseInt(currentForm.idcurso), titulo: currentForm.titulo, conteudo: currentForm.conteudo };
          break;
        default:
          throw new Error("Tipo de notificação inválido.");
      }

      await api.post(endpoint, body);
      openResultModal(0, "Notificação enviada com sucesso!");
      setNotifForm(prev => ({ ...prev, [activeNotifTab]: { titulo: "", conteudo: "", ...(activeNotifTab === "personal" && { idutilizador: prev.personal.idutilizador }), ...(activeNotifTab === "course" && { idcurso: prev.course.idcurso }) } }));
    } catch (err) {
      console.error("Erro ao enviar notificação:", err);
      openResultModal(1, "Erro ao enviar a notificação. Verifique os dados e tente novamente.");
    } finally {
      setSendingNotif(false);
    }
  };

  // --- Funções de Modal ---
  const openResultModal = (status, message) => {
    setOperationStatus(status);
    setOperationMessage(message);
    setIsResultModalOpen(true);
  };

  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
    // Poderia fazer um refresh de dados aqui se necessário
  };

  const getResultModalTitle = () => {
    return operationStatus === 0 ? "Sucesso" : "Erro";
  };

  const getResultModalBody = () => {
    return (
      <>
        <p>{operationMessage}</p>
        {operationStatus === 1 && (
          <p className="text-muted small">
            Tente novamente. Se o problema persistir, contacte o suporte.
          </p>
        )}
      </>
    );
  };

  return (
    <div className="container mt-5">
      <h1 className="text-primary-blue h2 mb-4">Gestão de notificações e denuncias</h1>
      
      {/* Secção de Notificações - Trocado para o topo */}
      <div className="mb-5 mt-5">
        <h2 className="text-primary-blue h5 mb-3">Enviar Notificação</h2>
        <ul className="nav nav-tabs mb-4" id="notifTabs" role="tablist">
          <li className="nav-item">
            <button className={`nav-link ${activeNotifTab === "general" ? "active" : ""}`} onClick={() => setActiveNotifTab("general")}>Geral</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeNotifTab === "admin" ? "active" : ""}`} onClick={() => setActiveNotifTab("admin")}>Administrativa</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeNotifTab === "personal" ? "active" : ""}`} onClick={() => setActiveNotifTab("personal")}>Pessoal</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeNotifTab === "course" ? "active" : ""}`} onClick={() => setActiveNotifTab("course")}>De Curso</button>
          </li>
        </ul>

        <div className="tab-content">
          {/* Formulário de Notificação Geral */}
          <div className={`tab-pane fade ${activeNotifTab === "general" ? "show active" : ""}`}>
            <form onSubmit={handleNotifSubmit}>
              <div className="mb-3">
                <label htmlFor="generalTitulo" className="form-label">Título</label>
                <input type="text" className="form-control" id="generalTitulo" name="titulo" value={notifForm.general.titulo} onChange={(e) => handleNotifChange(e, "general")} required />
              </div>
              <div className="mb-3">
                <label htmlFor="generalConteudo" className="form-label">Conteúdo</label>
                <textarea className="form-control" id="generalConteudo" name="conteudo" value={notifForm.general.conteudo} onChange={(e) => handleNotifChange(e, "general")} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sendingNotif}>
                {sendingNotif ? "A Enviar..." : "Enviar Notificação Geral"}
              </button>
            </form>
          </div>
          
          {/* Formulário de Notificação Administrativa */}
          <div className={`tab-pane fade ${activeNotifTab === "admin" ? "show active" : ""}`}>
            <form onSubmit={handleNotifSubmit}>
              <div className="mb-3">
                <label htmlFor="adminTitulo" className="form-label">Título</label>
                <input type="text" className="form-control" id="adminTitulo" name="titulo" value={notifForm.admin.titulo} onChange={(e) => handleNotifChange(e, "admin")} required />
              </div>
              <div className="mb-3">
                <label htmlFor="adminConteudo" className="form-label">Conteúdo</label>
                <textarea className="form-control" id="adminConteudo" name="conteudo" value={notifForm.admin.conteudo} onChange={(e) => handleNotifChange(e, "admin")} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sendingNotif}>
                {sendingNotif ? "A Enviar..." : "Enviar Notificação Administrativa"}
              </button>
            </form>
          </div>
          
          {/* Formulário de Notificação Pessoal */}
          <div className={`tab-pane fade ${activeNotifTab === "personal" ? "show active" : ""}`}>
            <form onSubmit={handleNotifSubmit}>
              <div className="mb-3">
                <label htmlFor="personalUser" className="form-label">Utilizador</label>
                {loadingUsers ? (
                  <div className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <select className="form-select" id="personalUser" name="idutilizador" value={notifForm.personal.idutilizador} onChange={(e) => handleNotifChange(e, "personal")} required>
                    {users.map(user => (
                      <option key={user.idutilizador} value={user.idutilizador}>{user.nome} ({user.email})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="personalTitulo" className="form-label">Título</label>
                <input type="text" className="form-control" id="personalTitulo" name="titulo" value={notifForm.personal.titulo} onChange={(e) => handleNotifChange(e, "personal")} required />
              </div>
              <div className="mb-3">
                <label htmlFor="personalConteudo" className="form-label">Conteúdo</label>
                <textarea className="form-control" id="personalConteudo" name="conteudo" value={notifForm.personal.conteudo} onChange={(e) => handleNotifChange(e, "personal")} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sendingNotif || loadingUsers || users.length === 0}>
                {sendingNotif ? "A Enviar..." : "Enviar Notificação Pessoal"}
              </button>
            </form>
          </div>
          
          {/* Formulário de Notificação de Curso */}
          <div className={`tab-pane fade ${activeNotifTab === "course" ? "show active" : ""}`}>
            <form onSubmit={handleNotifSubmit}>
              <div className="mb-3">
                <label htmlFor="courseSelect" className="form-label">Curso</label>
                {loadingCourses ? (
                  <div className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <select className="form-select" id="courseSelect" name="idcurso" value={notifForm.course.idcurso} onChange={(e) => handleNotifChange(e, "course")} required>
                    {courses.map(course => (
                      <option key={course.idcurso} value={course.idcurso}>{course.nome}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="courseTitulo" className="form-label">Título</label>
                <input type="text" className="form-control" id="courseTitulo" name="titulo" value={notifForm.course.titulo} onChange={(e) => handleNotifChange(e, "course")} required />
              </div>
              <div className="mb-3">
                <label htmlFor="courseConteudo" className="form-label">Conteúdo</label>
                <textarea className="form-control" id="courseConteudo" name="conteudo" value={notifForm.course.conteudo} onChange={(e) => handleNotifChange(e, "course")} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sendingNotif || loadingCourses || courses.length === 0}>
                {sendingNotif ? "A Enviar..." : "Enviar Notificação de Curso"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <hr className="my-5" />

      {/* Secção de Denúncias - Trocado para baixo */}
      <div className="mb-5">
        <h2 className="text-primary-blue h5 mb-3">Denúncias</h2>
        <ul className="nav nav-tabs mb-4" id="reportsTabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
              type="button"
              role="tab"
            >
              Denúncias de Posts ({postsReports.length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "comments" ? "active" : ""}`}
              onClick={() => setActiveTab("comments")}
              type="button"
              role="tab"
            >
              Denúncias de Comentários ({commentsReports.length})
            </button>
          </li>
        </ul>

        <div className="tab-content">
          <div className={`tab-pane fade ${activeTab === "posts" ? "show active" : ""}`} role="tabpanel">
            {loadingReports ? <div className="text-center"><div className="spinner-border" /></div> : renderReportList(postsReports)}
          </div>
          <div className={`tab-pane fade ${activeTab === "comments" ? "show active" : ""}`} role="tabpanel">
            {loadingReports ? <div className="text-center"><div className="spinner-border" /></div> : renderReportList(commentsReports)}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Descartar Denúncia */}
      <Modal
        isOpen={isDismissModalOpen}
        onClose={() => setIsDismissModalOpen(false)}
        title="Confirmar Descarte de Denúncia"
      >
        {reportToDismiss && (
          <p>
            Tem a certeza que deseja descartar esta denúncia? Esta ação irá remover a denúncia.
          </p>
        )}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-secondary" onClick={() => setIsDismissModalOpen(false)} disabled={dismissing}>
            Cancelar
          </button>
          <button type="button" className="btn btn-success" onClick={confirmDismiss} disabled={dismissing}>
            {dismissing ? "A Descartar..." : "Descartar"}
          </button>
        </div>
      </Modal>

      {/* Modal de Resultado das Operações */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title={getResultModalTitle()}
      >
        {getResultModalBody()}
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-primary" onClick={closeResultModal}>
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default GerirNotificacoesDenuncias;
