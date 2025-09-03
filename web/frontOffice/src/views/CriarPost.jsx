import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import LeftSidebar from "../components/LeftSidebar";
import { SidebarContext } from "../context/SidebarContext";
import FileUpload from "@shared/components/FileUpload";

export default function CriarPost({ onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
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
    toggleSubscribeTopic,
  } = useContext(SidebarContext);

  const navigate = useNavigate();

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

      const fd = new FormData();
      const tituloVal = title.trim();
      const conteudoVal = content.trim();
      fd.append("titulo", tituloVal);
      fd.append("conteudo", conteudoVal);
      fd.append(
        "info",
        JSON.stringify({ titulo: tituloVal, conteudo: conteudoVal })
      );
      if (file) fd.append("anexo", file);
      const res = await api.post(`/forum/post/topico/${idTopico}`, fd);
      const created = res?.data?.data || res?.data || {};
      const newId = created.idpost || created.id;
      if (newId) {
        navigate(`/forum/post/${newId}`);
      } else {
        navigate("/forums");
      }
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
      {/* Sidebar esquerda*/}
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
          toggleSubscribeTopic={toggleSubscribeTopic}
          subscribedTopics={subscribedTopics}
          readOnly
        />
      </div>

      {/* Conteúdo principal*/}
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

            <div className="mb-3">
              <FileUpload
                id="post-anexo"
                label="Anexo (opcional)"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                onSelect={setFile}
                hint="Pode arrastar e largar um ficheiro aqui."
                size="sm"
              />
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
