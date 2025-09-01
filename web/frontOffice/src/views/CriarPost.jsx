import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import LeftSidebar from "../components/LeftSidebar";
import { SidebarContext } from "../context/SidebarContext";

export default function CriarPost({ onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    categorias,
    areas,
    topicos,
    selectedCategoria,
    setSelectedCategoria,
    selectedArea,
    setSelectedArea,
    selectedTopico,
    setSelectedTopico,
    topicSearch,
    setTopicSearch,
    subscribedTopics,
  } = useContext(SidebarContext);

  const navigate = useNavigate();

  // Resolve selected topic identification and display name
  const selectedTopicoId =
    selectedTopico?.idtopico || selectedTopico?.id || selectedTopico;
  const selectedTopicoObj = topicos?.find(
    (t) => String(t.idtopico) === String(selectedTopicoId)
  );
  const selectedTopicoName = selectedTopicoObj?.designacao;

  const handleBack = () => {
    console.log("Voltar button clicked");
    try {
      navigate("/forums");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleCancel = () => {
    console.log("Cancelar button clicked");
    try {
      navigate("/forums");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const idTopico =
        selectedTopico?.idtopico || selectedTopico?.id || selectedTopico;

      if (!idTopico) {
        setError("Selecione um tópico antes de criar o post.");
        setLoading(false);
        return;
      }

      if (!title?.trim()) {
        setError("Campo obrigatório: título.");
        setLoading(false);
        return;
      }
      if (!content?.trim()) {
        setError("Campo obrigatório: conteúdo.");
        setLoading(false);
        return;
      }

      await api.post(`/forum/post/topico/${idTopico}`, {
        titulo: title.trim(),
        conteudo: content.trim(),
      });
      navigate("/forums"); // Redirect back to forums after successful post creation
    } catch (err) {
      console.error("Erro ao criar post", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Erro ao criar post. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar esquerda fixa */}
      <div style={{ flex: "0 0 320px" }}>
        <LeftSidebar
          categorias={categorias}
          areas={areas}
          topicos={topicos}
          selectedCategoria={selectedCategoria}
          setSelectedCategoria={setSelectedCategoria}
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
          selectedTopico={selectedTopico}
          setSelectedTopico={setSelectedTopico}
          topicSearch={topicSearch}
          setTopicSearch={setTopicSearch}
          toggleSubscribeTopic={() => {}}
          subscribedTopics={subscribedTopics}
          readOnly
        />
      </div>

      {/* Conteúdo principal centrado */}
      <main
        className="flex-grow-1"
        style={{ padding: "1rem", minWidth: 0, marginTop: "20px" }}
      >
        <div
          className="container-fluid"
          style={{ maxWidth: "960px", margin: "0 auto" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Criar Novo Post</h2>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleBack}
            >
              Voltar
            </button>
          </div>

          <div className="mb-3">
            <small className="text-muted">
              Tópico:{" "}
              <strong>{selectedTopicoName || "(nenhum selecionado)"}</strong>
            </small>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Título:</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Conteúdo:</label>
              <textarea
                className="form-control"
                rows="5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "A criar..." : "Criar Post"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
