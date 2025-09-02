import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../shared/services/axios";
import Modal from "../../../../shared/components/Modal";

export default function EditarCategoria() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado da categoria
  const [designacao, setDesignacao] = useState("");

  // Controlo de carregamento, envio e erros
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Resultado da operação
  const [operationStatus, setOperationStatus] = useState(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Título do modal
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

  // Mensagem do modal
  const getResultModalBody = () => {
    switch (operationStatus) {
      case 0:
        return <p>{operationMessage || "Operação realizada com sucesso!"}</p>;
      case 1:
        return (
          <>
            <p>{operationMessage || "Ocorreu um erro."}</p>
            <p>Tente novamente mais tarde.</p>
          </>
        );
      default:
        return <p>Estado desconhecido.</p>;
    }
  };

  // Abrir/fechar modal
  const openResultModal = () => setIsResultModalOpen(true);
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setOperationStatus(null);
    setOperationMessage("");
    if (operationStatus === 0) {
      navigate("/gerir-estrutura"); // Volta atrás se sucesso
    }
  };

  // Buscar categoria
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
        console.error("Erro ao carregar:", err);
        setError("Não foi possível carregar a categoria.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategoria();
  }, [id]);

  // Submeter edição
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/categoria/id/${id}`, { designacao });
      setOperationStatus(0);
      setOperationMessage("Categoria atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao atualizar categoria."
      );
    } finally {
      setSubmitting(false);
      openResultModal();
    }
  };

  // Mostrar carregamento
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

  // Mostrar erro
  if (error) {
    return (
      <div className="container mt-4">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  // Formulário
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
          className="btn btn-danger"
          onClick={() => navigate("/gerir-estrutura")}
          disabled={submitting}
        >
          Cancelar
        </button>
      </form>

      {/* Modal de resultado */}
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
