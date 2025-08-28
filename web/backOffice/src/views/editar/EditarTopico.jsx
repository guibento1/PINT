import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../shared/services/axios";
import Modal from "../../../../shared/components/Modal";

export default function EditarTopico() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [designacao, setDesignacao] = useState("");
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [areasDisponiveis, setAreasDisponiveis] = useState([]);

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
    const fetchTopicoData = async () => {
      setLoading(true);
      try {
        const resTopico = await api.get(`/topico/id/${id}`);
        if (resTopico.data) {
          const topicoData = resTopico.data;
          setDesignacao(topicoData.designacao);
          if (topicoData.areas) {
            setAreasSelecionadas(
              topicoData.areas.map((area) => area.idarea.toString())
            );
          }
        } else {
          setError("Tópico não encontrado.");
        }

        const resAreas = await api.get("/area/list");
        setAreasDisponiveis(resAreas.data);
      } catch (err) {
        console.error("Erro ao carregar dados do tópico ou áreas:", err);
        setError(
          "Não foi possível carregar o tópico ou áreas. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTopicoData();
  }, [id]);

  const handleAreaCheckboxChange = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;

    setAreasSelecionadas((prev) => {
      if (isChecked) {
        return [...prev, value];
      } else {
        return prev.filter((areaId) => areaId !== value);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (areasSelecionadas.length === 0) {
        throw new Error("O Tópico deve estar associado a pelo menos uma Área.");
      }

      const payload = {
        designacao: designacao,
        areas: areasSelecionadas.map((id) => parseInt(id, 10)), // Converte IDs para número
      };

      await api.put(`/topico/id/${id}`, payload);
      setOperationStatus(0);
      setOperationMessage("Tópico atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar tópico:", err);
      setOperationStatus(1);
      setOperationMessage(
        err.response?.data?.message || "Erro ao atualizar tópico."
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
          <p className="mt-2 text-muted">A carregar tópico...</p>
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
      <h2 className="mb-4">Editar Tópico</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="designacaoTopico" className="form-label">
            Designação do Tópico
          </label>
          <input
            type="text"
            className="form-control"
            id="designacaoTopico"
            value={designacao}
            onChange={(e) => setDesignacao(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Áreas</label>
          {areasDisponiveis.length === 0 ? (
            <div className="form-text text-danger">
              Nenhuma área disponível. Por favor, crie uma área primeiro.
            </div>
          ) : (
            <div
              className="border p-2 rounded"
              style={{ maxHeight: "150px", overflowY: "auto" }}
            >
              {areasDisponiveis.map((area) => (
                <div className="form-check" key={area.idarea}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={area.idarea}
                    id={`areaCheckbox-${area.idarea}`}
                    onChange={handleAreaCheckboxChange}
                    checked={areasSelecionadas.includes(area.idarea.toString())}
                    disabled={submitting}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`areaCheckbox-${area.idarea}`}
                  >
                    {area.designacao} (ID: {area.idarea})
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary me-2"
          disabled={submitting || areasSelecionadas.length === 0}
        >
          {submitting ? "A Atualizar..." : "Atualizar Tópico"}
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
