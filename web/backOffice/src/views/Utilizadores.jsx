import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "@shared/services/axios";
import Modal from "@shared/components/Modal";

const getUtilizadores = async () => {
  try {
    const response = await api.get(`/utilizador/list`);
    return response.data;
  } catch (error) {
    console.error("Erro ao listar utilizadores:", error);
    throw error;
  }
};

const activateUtilizador = async (id) => {
  try {
    const response = await api.patch(`/utilizador/activate/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao ativar utilizador:", error);
    throw error;
  }
};

const deleteUtilizador = async (id) => {
  try {
    const response = await api.delete(`/utilizador/id/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao desativar/eliminar utilizador:", error);
    throw error;
  }
};

export default function GerirUtilizadores() {
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [userToActUpon, setUserToActUpon] = useState(null);
  const [actionType, setActionType] = useState("");
  const [processing, setProcessing] = useState(false);

  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const fetchUtilizadores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUtilizadores();
      setUtilizadores(data);
    } catch (err) {
      setError("Erro ao carregar utilizadores. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUtilizadores();
  }, [fetchUtilizadores]);

  const handleViewUser = (idutilizador) => {
    navigate(`/editar/utilizador/${idutilizador}`);
  };

  const handleActionClick = (user, type) => {
    setUserToActUpon(user);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const confirmAction = async () => {
    if (!userToActUpon) return;

    setProcessing(true);
    try {
      if (actionType === "activate") {
        await activateUtilizador(userToActUpon.idutilizador);
        setOperationStatus(0);
        setOperationMessage(
          `Utilizador "${userToActUpon.nome}" ativado com sucesso!`
        );
      } else if (actionType === "delete") {
        await deleteUtilizador(userToActUpon.idutilizador);
        setOperationStatus(0);
        setOperationMessage(
          `Utilizador "${userToActUpon.nome}" desativado/eliminado com sucesso!`
        );
      }
      fetchUtilizadores();
    } catch (err) {
      console.error(`Erro ao ${actionType} utilizador:`, err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message ||
          `Erro ao ${actionType} utilizador "${userToActUpon.nome}".`
      );
    } finally {
      setProcessing(false);
      setIsActionModalOpen(false);
      setUserToActUpon(null);
      openResultModal();
    }
  };

  const getActionModalTitle = () => {
    if (actionType === "activate") return "Confirmar Ativação";
    if (actionType === "delete") return "Confirmar Desativação/Eliminação";
    return "Confirmar Ação";
  };

  const getActionModalBody = () => {
    if (!userToActUpon) return null;
    if (actionType === "activate") {
      return (
        <p>
          Tem a certeza que deseja **ativar** o utilizador **"
          {userToActUpon.nome}"**?
        </p>
      );
    }
    if (actionType === "delete") {
      return (
        <p>
          Tem a certeza que deseja **desativar/eliminar** o utilizador **"
          {userToActUpon.nome}"**?
        </p>
      );
    }
    return null;
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
            <p>{operationMessage || "Ocorreu um erro."}</p>
            <p>
              Tente novamente mais tarde. Se o erro persistir, contacte o
              suporte.
            </p>
          </>
        );
      default:
        return <p>Estado da operação desconhecido.</p>;
    }
  };

  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary-blue mb-0">Gestão de Utilizadores</h1>
      </div>

      {loading && (
        <div className="container mt-5">
          <div className="text-center my-5">
            <div className="spinner-border text-primary" />
            <p className="mt-2 text-muted">A carregar utilizadores...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger text-center my-5" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && utilizadores.length === 0 && (
        <div className="alert alert-info text-center my-5" role="alert">
          Nenhum utilizador encontrado.
        </div>
      )}

      {!loading && !error && utilizadores.length > 0 && (
        <div className="table-responsive mt-4">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Nome</th>
                <th scope="col">Email</th>
                <th scope="col">Data de Registo</th>
                <th scope="col">Ativo</th>
                <th scope="col">Roles</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {utilizadores.map((utilizador) => (
                <tr key={utilizador.idutilizador}>
                  <td>{utilizador.idutilizador}</td>
                  <td>{utilizador.nome}</td>
                  <td>{utilizador.email}</td>
                  <td>
                    {new Date(utilizador.dataregisto).toLocaleDateString()}
                  </td>
                  <td>
                    {utilizador.ativo ? (
                      <span className="badge bg-success">Sim</span>
                    ) : (
                      <span className="badge bg-danger">Não</span>
                    )}
                  </td>
                  <td>
                    {utilizador.roles && utilizador.roles.length > 0 ? (
                      utilizador.roles.map((role) => (
                        <span
                          key={role.id}
                          className="badge bg-info text-dark me-1"
                        >
                          {role.role}
                        </span>
                      ))
                    ) : (
                      <span className="badge bg-secondary">N/A</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleViewUser(utilizador.idutilizador)}
                      title="Ver/Editar Utilizador"
                    >
                      <i className="ri-eye-line"></i> Ver/Editar
                    </button>
                    {utilizador.ativo ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleActionClick(utilizador, "delete")}
                        title="Desativar Utilizador"
                      >
                        <i className="ri-user-unfollow-line"></i> Desativar
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() =>
                          handleActionClick(utilizador, "activate")
                        }
                        title="Ativar Utilizador"
                      >
                        <i className="ri-user-follow-line"></i> Ativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={getActionModalTitle()}
      >
        {getActionModalBody()}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsActionModalOpen(false)}
            disabled={processing}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${
              actionType === "activate" ? "btn-success" : "btn-danger"
            }`}
            onClick={confirmAction}
            disabled={processing}
          >
            {processing
              ? "A Processar..."
              : actionType === "activate"
              ? "Ativar"
              : "Desativar"}
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={closeResultModal}
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}
