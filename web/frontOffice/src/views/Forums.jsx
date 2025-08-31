import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  // New post form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLinks, setNewLinks] = useState([""]); // allow multiple link attachments
  const [newFile, setNewFile] = useState(null);
  const [creating, setCreating] = useState(false);

  // Comment form per post
  const [commentContentByPost, setCommentContentByPost] = useState({});

  // Reporting
  const [reportTypes, setReportTypes] = useState([]);
  const [showReportFor, setShowReportFor] = useState(null);
  const [reportTipo, setReportTipo] = useState("");
  const [reportDescricao, setReportDescricao] = useState("");

  // UI niceties inspired by Reddit-style forums
  const [sortBy, setSortBy] = useState("recent"); // 'recent' | 'top'
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

  // load categories on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/categoria/list");
        setCategorias(res.data || []);
      } catch (e) {
        console.error("Erro ao carregar categorias", e);
      }
    })();

    // load report types
    (async () => {
      try {
        const res = await api.get("/denuncias/tipos");
        setReportTypes(res.data || []);
      } catch (e) {
        // non-fatal
        console.error("Erro ao carregar tipos de denuncia", e);
      }
    })();
  }, []);

  // load areas when categoria changes
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

  // load topics when area changes
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

  // load posts for topic
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

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!selectedTopico)
      return setError("Escolha um tópico antes de criar um post.");
    if (!newTitle || !newContent)
      return setError("Preencha título e conteúdo.");

    setCreating(true);
    setError(null);
    try {
      // if there's a file, send multipart/form-data, otherwise JSON
      let res;
      if (newFile) {
        const fd = new FormData();
        fd.append("titulo", newTitle);
        fd.append("conteudo", newContent);
        fd.append("links", JSON.stringify(newLinks.filter(Boolean)));
        fd.append("file", newFile);
        res = await api.post(`/post/topico/${selectedTopico}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post(`/post/topico/${selectedTopico}`, {
          titulo: newTitle,
          conteudo: newContent,
          links: newLinks.filter(Boolean),
        });
      }

      // refresh posts
      await fetchPosts(selectedTopico);
      // reset form
      setNewTitle("");
      setNewContent("");
      setNewLinks([""]);
      setNewFile(null);
    } catch (err) {
      console.error("Erro ao criar post", err);
      setError("Erro ao criar post.");
    } finally {
      setCreating(false);
    }
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

  // derive sorted posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "top") return (b.pontuacao || 0) - (a.pontuacao || 0);
    return new Date(b.criado) - new Date(a.criado);
  });

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <h1 className="mb-4 text-primary-blue">Partilha de Conhecimento</h1>

          <div className="row">
            <div className="col-lg-4 mb-4">
              <div className="card p-3 card-rounded">
                <h5 className="mb-3">Explorar Estrutura</h5>

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
            </div>

            <div className="col-lg-8">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <label className="me-2 small">Ordenar por:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select form-select-sm d-inline-block"
                    style={{ width: 150 }}
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="top">Mais votados</option>
                  </select>
                </div>
                <div>
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
                </div>
              </div>

              <div className="card p-3 card-rounded mb-4">
                <h5 className="mb-3">Novo Post</h5>

                <form onSubmit={handleCreatePost}>
                  <div className="mb-2">
                    <input
                      className="form-control"
                      placeholder="Título"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="mb-2">
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Conteúdo"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Links (opcional)</label>
                    {newLinks.map((l, idx) => (
                      <div className="input-group mb-2" key={idx}>
                        <input
                          className="form-control"
                          value={l}
                          onChange={(e) =>
                            setNewLinks((prev) => {
                              const copy = [...prev];
                              copy[idx] = e.target.value;
                              return copy;
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() =>
                            setNewLinks((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setNewLinks((prev) => [...prev, ""])}
                      >
                        Adicionar link
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Anexar ficheiro (opcional)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={creating}
                    >
                      {creating ? "A criar..." : "Publicar"}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setNewTitle("");
                        setNewContent("");
                        setNewLinks([""]);
                        setNewFile(null);
                      }}
                    >
                      Limpar
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-3 card-rounded">
                <h5 className="mb-3">
                  Tópico:{" "}
                  {topicos.find(
                    (t) => String(t.idtopico) === String(selectedTopico)
                  )?.designacao || "Nenhum selecionado"}
                </h5>

                {error && <div className="alert alert-danger">{error}</div>}

                {loading && (
                  <div className="text-center">
                    <div
                      className="spinner-border text-primary-blue"
                      role="status"
                    >
                      <span className="visually-hidden">A carregar...</span>
                    </div>
                  </div>
                )}

                {!loading && sortedPosts.length === 0 && (
                  <div className="text-muted">Sem posts neste tópico.</div>
                )}

                {!loading &&
                  sortedPosts.map((p) => (
                    <div className="card mb-3 shadow-sm" key={p.idpost}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="card-title mb-1">{p.titulo}</h6>
                            <div className="small text-muted">
                              Por{" "}
                              {typeof p.utilizador === "string"
                                ? p.utilizador
                                : p.utilizador?.nome || "Anónimo"}{" "}
                              • {timeAgo(p.criado)}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="mb-1">
                              Pontuação: {p.pontuacao ?? 0}
                            </div>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleVotePost(p.idpost, true)}
                              >
                                👍
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleVotePost(p.idpost, false)}
                              >
                                👎
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleUnvotePost(p.idpost)}
                              >
                                Desvotar
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="mt-3">{p.conteudo}</p>

                        {p.links && p.links.length > 0 && (
                          <div className="mb-2">
                            <strong>Links:</strong>
                            <ul>
                              {p.links.map((ln, i) => (
                                <li key={i}>
                                  <a href={ln} target="_blank" rel="noreferrer">
                                    {ln}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowReportFor(p.idpost)}
                          >
                            Denunciar
                          </button>
                        </div>

                        <hr />

                        <div>
                          <h6 className="small mb-2">Comentários</h6>
                          <div className="mb-2">
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
                            <div className="mt-2 d-flex gap-2">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleCreateComment(p.idpost)}
                              >
                                Responder
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
      </div>
    </div>
  );
}
