import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import "@shared/styles/global.css";

export default function Forums() {
  const [searchParams] = useSearchParams();

  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topicos, setTopicos] = useState([]);

  const [selectedCategoria, setSelectedCategoria] = useState(
    searchParams.get("categoria") || ""
  );
  const [selectedArea, setSelectedArea] = useState(
    searchParams.get("area") || ""
  );
  const [selectedTopico, setSelectedTopico] = useState(
    searchParams.get("topico") || ""
  );

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const [reportTypes, setReportTypes] = useState([]);
  const [showReportFor, setShowReportFor] = useState(null);
  const [reportTipo, setReportTipo] = useState("");
  const [reportDescricao, setReportDescricao] = useState("");

  const [sortBy, setSortBy] = useState("recente");

  function timeAgo(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const s = Math.floor((now - d) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/categoria/list");
        setCategorias(res.data || []);
      } catch (e) {
        console.error("Erro ao carregar categorias", e);
      }
    })();

    (async () => {
      try {
        const res = await api.get("/denuncias/tipos");
        setReportTypes(res.data || []);
      } catch (e) {
        console.error("Erro ao carregar tipos de denuncia", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCategoria) {
      setAreas([]);
      setSelectedArea("");
      return;
    }
    (async () => {
      try {
        const res = await api.get(`/categoria/id/${selectedCategoria}/list`);
        setAreas(res.data || []);
      } catch (e) {
        console.error("Erro ao carregar areas", e);
        setAreas([]);
      }
    })();
  }, [selectedCategoria]);

  useEffect(() => {
    if (!selectedArea) {
      setTopicos([]);
      setSelectedTopico("");
      return;
    }
    (async () => {
      try {
        const res = await api.get(`/area/id/${selectedArea}/list`);
        setTopicos(res.data || []);
      } catch (e) {
        console.error("Erro ao carregar topicos", e);
        setTopicos([]);
      }
    })();
  }, [selectedArea]);

  useEffect(() => {
    fetchPosts();
  }, [selectedTopico, sortBy]);

  async function fetchPosts() {
    setLoading(true);
    setError(null);
    let url = "/forum/posts";

    if (selectedTopico) {
      url = `/forum/posts/topico/${selectedTopico}`;
    }

    try {
      const res = await api.get(url, {
        params: {
          order: sortBy,
        },
      });
      setPosts(res.data || []);
    } catch (e) {
      console.error("Erro ao carregar posts", e);
      setError("Erro ao carregar posts.");
    } finally {
      setLoading(false);
    }
  }

  function handleCreatePostClick() {
    if (!selectedTopico) {
      setError("Escolha um tópico antes de criar um post.");
      return;
    }
    navigate(`/criar-post?topico=${selectedTopico}`);
  }

  async function handleVotePost(postId, voteType) {
    try {
      if (voteType === "upvote") {
        await api.post(`/forum/post/${postId}/upvote`);
      } else if (voteType === "downvote") {
        await api.post(`/forum/post/${postId}/downvote`);
      } else if (voteType === "unvote") {
        await api.delete(`/forum/post/${postId}/unvote`);
      }
      fetchPosts();
    } catch (err) {
      console.error("Erro ao votar", err);
      setError("Erro ao registrar voto.");
    }
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "top") return (b.pontuacao || 0) - (a.pontuacao || 0);
    return new Date(b.criado) - new Date(a.criado);
  });

  const getPostPreview = (content) => {
    return content.length > 150 ? content.substring(0, 150) + "..." : content;
  };

  const handleNavigateToPost = (postId) => {
    navigate(`/post/${postId}`);
  };

  const getVoteButtonClasses = (post) => {
    const { iteracao } = post;
    const upvoteClass = iteracao === true ? 'btn-primary' : 'btn-light';
    const downvoteClass = iteracao === false ? 'btn-danger' : 'btn-light';
    const unvoteClass = iteracao !== null ? 'btn-outline-primary' : 'btn-outline-secondary';
    
    return { upvoteClass, downvoteClass, unvoteClass };
  };

  return (
    <div className="container-fluid py-3 bg-light">
      <div className="d-flex justify-content-center" style={{ gap: "1rem" }}>
        {/* Sidebar esquerda */}
        <aside style={{ width: "250px" }}>
          <div className="card p-3 shadow-sm">
            <h6 className="mb-3">Explorar Estrutura</h6>
            <div className="mb-3">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
              >
                <option value="">Todas as Categorias</option>
                {categorias.map((c) => (
                  <option key={c.idcategoria} value={c.idcategoria}>
                    {c.designacao}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Área</label>
              <select
                className="form-select"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                disabled={!areas.length}
              >
                <option value="">Todas as Áreas</option>
                {areas.map((a) => (
                  <option key={a.idarea} value={a.idarea}>
                    {a.designacao}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Tópicos</label>
              <div className="list-group">
                <button
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    !selectedTopico ? "active" : ""
                  }`}
                  onClick={() => setSelectedTopico("")}
                >
                  Todos os posts
                </button>
                {topicos.length === 0 && (
                  <div className="text-muted small p-2">
                    Escolha uma área para ver tópicos
                  </div>
                )}
                {topicos.map((t) => (
                  <button
                    type="button"
                    key={t.idtopico}
                    className={`list-group-item list-group-item-action ${
                      String(selectedTopico) === String(t.idtopico)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setSelectedTopico(t.idtopico)}
                  >
                    {t.designacao}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Feed central */}
        <main style={{ flex: 1, maxWidth: "700px" }}>
          <div className="card p-3 mb-3 shadow-sm d-flex justify-content-between align-items-center">
            {/* Ordenar à esquerda */}
            <div className="d-flex gap-2 align-items-center">
              <label className="form-label small mb-0">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select form-select-sm"
              >
                <option value="recente">Mais recentes</option>
                <option value="top">Mais votados</option>
              </select>
            </div>

            {/* Botão de criar post à direita */}
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreatePostClick}
              >
                Criar Post
              </button>
            </div>
          </div>

          {/* Lista de posts */}
          <div className="card p-3 shadow-sm">
            <h5 className="mb-3">
              Tópico:{" "}
              {topicos.find(
                (t) => String(t.idtopico) === String(selectedTopico)
              )?.designacao || "Todos os posts"}
            </h5>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading && (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">A carregar...</span>
                </div>
              </div>
            )}

            {!loading && sortedPosts.length === 0 && (
              <div className="text-muted">Sem posts para mostrar.</div>
            )}

            {!loading &&
              sortedPosts.map((p) => {
                const { upvoteClass, downvoteClass, unvoteClass } = getVoteButtonClasses(p);
                return (
                  <div
                    className="card mb-3 p-3 shadow-sm"
                    key={p.idpost}
                  >
                    <div className="d-flex align-items-center">
                      <div className="me-3 text-center d-flex flex-column align-items-center">
                        <button 
                          className={`btn btn-sm ${upvoteClass} p-0 mb-1`} 
                          onClick={() => handleVotePost(p.idpost, 'upvote')}
                        >
                          <i className="ri-arrow-up-line"></i>
                        </button>
                        <h4 className="mb-0">{p.pontuacao ?? 0}</h4>
                        <button 
                          className={`btn btn-sm ${downvoteClass} p-0 mt-1`} 
                          onClick={() => handleVotePost(p.idpost, 'downvote')}
                        >
                          <i className="ri-arrow-down-line"></i>
                        </button>
                        {p.iteracao !== null && (
                          <button
                            className={`btn btn-sm ${unvoteClass} mt-2`}
                            onClick={() => handleVotePost(p.idpost, 'unvote')}
                          >
                            Desvotar
                          </button>
                        )}
                      </div>
                      <div className="flex-grow-1" onClick={() => handleNavigateToPost(p.idpost)} style={{ cursor: 'pointer' }}>
                        <h5 className="mb-1">{p.titulo}</h5>
                        <p className="text-muted mb-1 small">
                          {getPostPreview(p.conteudo)}
                        </p>
                        <div className="small d-flex gap-3 text-muted">
                          <span>💬 {p.ncomentarios ?? 0} comentários</span>
                          <span>
                            Por {p.utilizador?.nome || "Anônimo"} •{" "}
                            {timeAgo(p.criado)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </main>

        {/* Sidebar direita - posts recentes */}
        <aside
          style={{
            width: "300px",
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
        >
          <div className="card p-3 shadow-sm">
            <h6 className="mb-3">Posts Recentes</h6>
            <ul className="list-group list-group-flush">
              {sortedPosts.slice(0, 5).map((p) => (
                <li
                  key={p.idpost}
                  className="list-group-item"
                  onClick={() => handleNavigateToPost(p.idpost)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="fw-semibold text-truncate">{p.titulo}</div>
                  <small className="text-muted">{timeAgo(p.criado)}</small>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
