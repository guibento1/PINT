import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../shared/services/axios";
import Modal from "../../../../shared/components/Modal";

export default function EditarCategoria() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [designacao, setDesignacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

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
            <p>
              Tente novamente mais tarde. Se o erro persistir, contacte o nosso
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
    if (operationStatus === 0) {
      navigate("/gerir-estrutura"); // Navega de volta após sucesso
    }
  };

  useEffect(() => {
    const fetchCategoria = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/categoria/id/${id}`);
        if (res.data) {
          setDesignacao(res.data.designacao);
        } else {
          setError("Categoria não encontrada.");
        }
      } catch (err) {
        console.error("Erro ao carregar categoria:", err);
        setError(
          "Não foi possível carregar a categoria. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCategoria();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/categoria/id/${id}`, { designacao });
      setOperationStatus(0);
      setOperationMessage("Categoria atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar categoria:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao atualizar categoria."
      );
    } finally {
      setSubmitting(false);
      openResultModal();
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2 text-muted">A carregar categoria...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <br />
      <h2 className="mb-4">Editar Categoria</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="designacaoCategoria" className="form-label">
            Designação da Categoria
          </label>
          <input
            type="text"
            className="form-control"
            id="designacaoCategoria"
            value={designacao}
            onChange={(e) => setDesignacao(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary me-2"
          disabled={submitting}
        >
          {submitting ? "A Atualizar..." : "Atualizar Categoria"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/gerir-estrutura")}
          disabled={submitting}
        >
          Cancelar
        </button>
      </form>

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
