import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../shared/services/axios";
import Modal from "../../../../shared/components/Modal";

export default function EditarArea() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [designacao, setDesignacao] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

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
      navigate("/gerir-estrutura");
    }
  };

  useEffect(() => {
    const fetchAreaData = async () => {
      setLoading(true);
      try {
        const resArea = await api.get(`/area/id/${id}`);
        if (resArea.data) {
          const areaData = resArea.data;
          setDesignacao(areaData.designacao);
          setCategoriaSelecionada(areaData.categoria.toString());
        } else {
          setError("Área não encontrada.");
        }

        const resCategorias = await api.get("/categoria/list");
        setCategoriasDisponiveis(resCategorias.data);
      } catch (err) {
        console.error("Erro ao carregar dados da área ou categorias:", err);
        setError(
          "Não foi possível carregar a área ou categorias. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAreaData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        designacao: designacao,
        // A categoria é opcional na atualização se o campo for vazio,
        // mas se for selecionada, deve ser um número.
        categoria: categoriaSelecionada
          ? parseInt(categoriaSelecionada, 10)
          : null,
      };

      await api.put(`/area/id/${id}`, payload);
      setOperationStatus(0);
      setOperationMessage("Área atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar área:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao atualizar área."
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
          <p className="mt-2 text-muted">A carregar área...</p>
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
      <h2 className="mb-4">Editar Área</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="designacaoArea" className="form-label">
            Designação da Área
          </label>
          <input
            type="text"
            className="form-control"
            id="designacaoArea"
            value={designacao}
            onChange={(e) => setDesignacao(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="categoriaArea" className="form-label">
            Categoria
          </label>
          <select
            className="form-select"
            id="categoriaArea"
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
            disabled={submitting || categoriasDisponiveis.length === 0}
          >
            <option value="">-- Selecione uma Categoria (Opcional) --</option>
            {categoriasDisponiveis.map((cat) => (
              <option key={cat.idcategoria} value={cat.idcategoria}>
                {cat.designacao}
              </option>
            ))}
          </select>
          {categoriasDisponiveis.length === 0 && (
            <div className="form-text text-danger">
              Nenhuma categoria disponível.
            </div>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary me-2"
          disabled={submitting}
        >
          {submitting ? "A Atualizar..." : "Atualizar Área"}
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
