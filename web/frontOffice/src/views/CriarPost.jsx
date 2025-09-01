import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
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
      await api.post("/forum/posts", { title, content });
      navigate("/forums"); // Redirect back to forums after successful post creation
    } catch (err) {
      console.error("Erro ao criar post", err);
      setError("Erro ao criar post. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container mt-5"
      style={{
        margin: "0 auto", // Center horizontally
        maxWidth: "1000px", // Set a very narrow width
        padding: "1rem", // Add padding for better spacing
      }}
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
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Conteúdo</label>
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "A criar..." : "Criar Post"}
          </button>
        </div>
      </form>
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
      />
      <RightSidebar />
    </div>
  );
}
