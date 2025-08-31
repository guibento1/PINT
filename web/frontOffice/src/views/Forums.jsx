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

  const [sortBy, setSortBy] = useState("recent");
  const [subscribedTopics, setSubscribedTopics] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("subscribedTopics") || "{}");
    } catch {
      return {};
    }
  });
  const [topicSearch, setTopicSearch] = useState("");
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

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
    <div className="d-flex">
      {/* Sidebar ajustada com linha de separação mais escura e comprida */}
      <aside
        className="bg-light"
        style={{
          position: "sticky",
          top: "80px", // Altura da navbar
          marginBottom: "0", // Remover margem para alcançar o footer
          width: "280px",
          maxHeight: "calc(100vh - 80px)", // Altura da viewport menos a navbar
          overflowY: "auto",
          zIndex: 1000,
          borderRight: "2px solid #333", // Linha de separação mais escura
        }}
      >
        <div className="p-3">
          <h6>Explorar Estrutura</h6>

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
            <div className="form-label">Tópicos</div>
            <div className="list-group mb-3">
              {topicos.length === 0 ? (
                <div className="text-muted small">
                  Escolha uma área para ver tópicos
                </div>
              ) : (
                topicos
                  .filter((t) =>
                    String(t.designacao)
                      .toLowerCase()
                      .includes(topicSearch.toLowerCase())
                  )
                  .map((t) => (
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
                  ))
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Pesquisar tópicos</label>
            <input
              className="form-control form-control-sm"
              placeholder="Pesquisar..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
            />
          </div>

          <div className="mt-3">
            <h6 className="mb-2">Tópicos Seguidos</h6>
            <div className="list-group">
              {Object.keys(subscribedTopics || {}).length === 0 ? (
                <div className="text-muted small">Ainda não segue tópicos</div>
              ) : (
                Object.keys(subscribedTopics || {}).map((id) => {
                  const t = topicos.find(
                    (x) => String(x.idtopico) === String(id)
                  );
                  return (
                    <div
                      key={id}
                      className="d-flex align-items-center justify-content-between list-group-item"
                    >
                      <div className="text-truncate" style={{ maxWidth: 160 }}>
                        {t ? t.designacao : `Tópico #${id}`}
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-link"
                          onClick={() => toggleSubscribeTopic(id)}
                        >
                          Deixar de seguir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main
        className="flex-grow-1"
        style={{ marginLeft: "280px", padding: "1rem" }}
      >
        <div className="container-fluid py-3 bg-light">
          {/* Conteúdo existente */}
          <div className="card p-3 mb-3 shadow-sm d-flex">
            <div
              className="d-flex align-items-center"
              style={{ width: "100%" }}
            >
              <label className="form-label small mb-1 me-2">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select form-select-sm"
                style={{ width: 180, marginRight: "auto" }}
              >
                <option value="recente">Mais recentes</option>
                <option value="top">Mais votados</option>
              </select>

              {selectedTopico && (
                <button
                  className={`btn btn-sm ${
                    subscribedTopics[selectedTopico]
                      ? "btn-outline-secondary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => toggleSubscribeTopic(selectedTopico)}
                >
                  {subscribedTopics[selectedTopico]
                    ? "Inscrito"
                    : "Seguir tópico"}
                </button>
              )}

              <button
                className="btn btn-primary btn-sm ms-2"
                onClick={handleCreatePostClick}
              >
                <i className="ri-add-line me-1"></i>
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
        </div>
      </main>
    </div>
  );
}
