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
  const [commentContentByPost, setCommentContentByPost] = useState({});

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

  function toggleSubscribeTopic(idtopico) {
    const copy = { ...(subscribedTopics || {}) };
    if (copy[idtopico]) delete copy[idtopico];
    else copy[idtopico] = true;
    setSubscribedTopics(copy);
    try {
      sessionStorage.setItem("subscribedTopics", JSON.stringify(copy));
    } catch {}
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
    if (!selectedTopico) {
      setPosts([]);
      return;
    }
    fetchPosts(selectedTopico);
  }, [selectedTopico]);

  async function fetchPosts(idTopico) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/posts/topico/${idTopico}`);
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

  async function handleCreateComment(postId) {
    const conteudo = (commentContentByPost[postId] || "").trim();
    if (!conteudo) return;
    try {
      await api.post(`/post/${postId}/comment`, { conteudo });
      setCommentContentByPost((s) => ({ ...s, [postId]: "" }));
      if (selectedTopico) await fetchPosts(selectedTopico);
    } catch (err) {
      console.error("Erro ao comentar", err);
      setError("Erro ao enviar comentário.");
    }
  }

  async function handleVotePost(postId, positive) {
    try {
      if (positive) await api.post(`/post/${postId}/upvote`);
      else await api.post(`/post/${postId}/downvote`);
      if (selectedTopico) await fetchPosts(selectedTopico);
    } catch (err) {
      console.error("Erro ao votar", err);
      setError("Erro ao registrar voto.");
    }
  }

  async function handleUnvotePost(postId) {
    try {
      await api.delete(`/post/${postId}/unvote`);
      if (selectedTopico) await fetchPosts(selectedTopico);
    } catch (err) {
      console.error("Erro ao remover voto", err);
      setError("Erro ao remover voto.");
    }
  }

  async function handleReportPost(postId) {
    if (!reportTipo) return setError("Escolha um tipo de denúncia.");
    try {
      await api.post(`/post/${postId}/reportar`, {
        tipo: reportTipo,
        descricao: reportDescricao,
      });
      setShowReportFor(null);
      setReportTipo("");
      setReportDescricao("");
    } catch (err) {
      console.error("Erro ao reportar", err);
      setError("Erro ao enviar denúncia.");
    }
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "top") return (b.pontuacao || 0) - (a.pontuacao || 0);
    return new Date(b.criado) - new Date(a.criado);
  });

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
                {topicos.length === 0 && (
                  <div className="text-muted small">
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
                <option value="recent">Mais recentes</option>
                <option value="top">Mais votados</option>
              </select>
            </div>

            {/* Botões à direita */}
            <div className="d-flex gap-2 align-items-center">
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
              )?.designacao || "Nenhum selecionado"}
            </h5>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading && (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visualmente-hidden">A carregar...</span>
                </div>
              </div>
            )}

            {!loading && sortedPosts.length === 0 && (
              <div className="text-muted">Sem posts neste tópico.</div>
            )}

            {!loading &&
              sortedPosts.map((p) => (
                <div
                  className="post-card d-flex border rounded mb-3 p-2 bg-white shadow-sm"
                  key={p.idpost}
                >
                  <div className="d-flex flex-column align-items-center me-3">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => handleVotePost(p.idpost, true)}
                    >
                      ⬆️
                    </button>
                    <div className="fw-semibold">{p.pontuacao ?? 0}</div>
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => handleVotePost(p.idpost, false)}
                    >
                      ⬇️
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary mt-1"
                      onClick={() => handleUnvotePost(p.idpost)}
                    >
                      Desvotar
                    </button>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{p.titulo}</h6>
                    <div className="small text-muted mb-2">
                      Por{" "}
                      {typeof p.utilizador === "string"
                        ? p.utilizador
                        : p.utilizador?.nome || "Anônimo"}{" "}
                      • {timeAgo(p.criado)}
                    </div>
                    <p className="mb-2">{p.conteudo}</p>
                    {Array.isArray(p.links) && p.links.length > 0 && (
                      <ul className="mb-2">
                        {p.links.map((ln, i) => (
                          <li key={i}>
                            <a href={ln} target="_blank" rel="noreferrer">
                              {ln}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="d-flex gap-3 small text-muted mb-2">
                      <span>💬 {p.comentarios?.length || 0} comentários</span>
                      <button
                        className="btn btn-link p-0 small"
                        onClick={() => setShowReportFor(p.idpost)}
                      >
                        🚩 Denunciar
                      </button>
                    </div>
                    <div className="mt-1">
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        placeholder="Escreva um comentário..."
                        value={commentContentByPost[p.idpost] || ""}
                        onChange={(e) =>
                          setCommentContentByPost((s) => ({
                            ...s,
                            [p.idpost]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn btn-sm btn-primary mt-2"
                        onClick={() => handleCreateComment(p.idpost)}
                      >
                        Responder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                <li key={p.idpost} className="list-group-item">
                  <div className="fw-semibold text-truncate">{p.titulo}</div>
                  <small className="text-muted">{timeAgo(p.criado)}</small>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {showReportFor && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }}
        >
          <div className="card p-3" style={{ width: 520 }}>
            <h5>Denunciar post</h5>
            <div className="mb-2">
              <label className="form-label">Tipo de denúncia</label>
              <select
                className="form-select"
                value={reportTipo}
                onChange={(e) => setReportTipo(e.target.value)}
              >
                <option value="">Escolha um tipo</option>
                {reportTypes.map((t) => (
                  <option key={t.idtipodenuncia} value={t.idtipodenuncia}>
                    {t.designacao || t.tipo || t.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="form-label">Descrição (opcional)</label>
              <textarea
                className="form-control"
                rows={3}
                value={reportDescricao}
                onChange={(e) => setReportDescricao(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-secondary"
                onClick={() => setShowReportFor(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReportPost(showReportFor)}
              >
                Enviar denúncia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
