import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import LeftSidebar from "../components/LeftSidebar";
import SubmissionFilePreview from "@shared/components/SubmissionFilePreview";
import { SidebarContext } from "../context/SidebarContext";

export default function Forums() {
  const [searchParams] = useSearchParams();
  const {
    categorias,
    setCategorias,
    areas,
    setAreas,
    topicos,
    setTopicos,
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

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const navigate = useNavigate();
  const [reportTypes, setReportTypes] = useState([]);
  const [showReportFor, setShowReportFor] = useState(null);
  const [reportTipo, setReportTipo] = useState("");
  const [reportDescricao, setReportDescricao] = useState("");

  const [sortBy, setSortBy] = useState("recent");
  const isFollowed =
    selectedTopico &&
    Array.isArray(subscribedTopics) &&
    subscribedTopics.some((t) => String(t.idtopico) === String(selectedTopico));

  // Vote icons shared with VerPost (colors via currentColor)
  const UpIcon = ({ filled, size = 22, color = "#28a745" }) =>
    filled ? (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.25007 2.38782C8.54878 2.0992 10.1243 2 12 2C13.8757 2 15.4512 2.0992 16.7499 2.38782C18.06 2.67897 19.1488 3.176 19.9864 4.01358C20.824 4.85116 21.321 5.94002 21.6122 7.25007C21.9008 8.54878 22 10.1243 22 12C22 13.8757 21.9008 15.4512 21.6122 16.7499C21.321 18.06 20.824 19.1488 19.9864 19.9864C19.1488 20.824 18.06 21.321 16.7499 21.6122C15.4512 21.9008 13.8757 22 12 22C10.1243 22 8.54878 21.9008 7.25007 21.6122C5.94002 21.321 4.85116 20.824 4.01358 19.9864C3.176 19.1488 2.67897 18.06 2.38782 16.7499C2.0992 15.4512 2 13.8757 2 12C2 10.1243 2.0992 8.54878 2.38782 7.25007C2.67897 5.94002 3.176 4.85116 4.01358 4.01358C4.85116 3.176 5.94002 2.67897 7.25007 2.38782ZM11 16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16L13 10.4142L14.2929 11.7071C14.6834 12.0976 15.3166 12.0976 15.7071 11.7071C16.0976 11.3166 16.0976 10.6834 15.7071 10.2929L12.7941 7.37993C12.7791 7.36486 12.7637 7.35031 12.748 7.33627C12.5648 7.12998 12.2976 7 12 7C11.7024 7 11.4352 7.12998 11.252 7.33627C11.2363 7.3503 11.2209 7.36486 11.2059 7.37993L8.29289 10.2929C7.90237 10.6834 7.90237 11.3166 8.29289 11.7071C8.68342 12.0976 9.31658 12.0976 9.70711 11.7071L11 10.4142L11 16Z"
          fill="currentColor"
        />
      </svg>
    ) : (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M12 8L12 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 11L12.087 8.08704V8.08704C12.039 8.03897 11.961 8.03897 11.913 8.08704V8.08704L9 11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  const DownIcon = ({ filled, size = 22, color = "#dc3545" }) =>
    filled ? (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.25007 2.38782C8.54878 2.0992 10.1243 2 12 2C13.8757 2 15.4512 2.0992 16.7499 2.38782C18.06 2.67897 19.1488 3.176 19.9864 4.01358C20.824 4.85116 21.321 5.94002 21.6122 7.25007C21.9008 8.54878 22 10.1243 22 12C22 13.8757 21.9008 15.4512 21.6122 16.7499C21.321 18.06 20.824 19.1488 19.9864 19.9864C19.1488 20.824 18.06 21.321 16.7499 21.6122C15.4512 21.9008 13.8757 22 12 22C10.1243 22 8.54878 21.9008 7.25007 21.6122C5.94002 21.321 4.85116 20.824 4.01358 19.9864C3.176 19.1488 2.67897 18.06 2.38782 16.7499C2.0992 15.4512 2 13.8757 2 12C2 10.1243 2.0992 8.54878 2.38782 7.25007C2.67897 5.94002 3.176 4.85116 4.01358 4.01358C4.85116 3.176 5.94002 2.67897 7.25007 2.38782ZM13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8L11 13.5858L9.70711 12.2929C9.31658 11.9024 8.68342 11.9024 8.29289 12.2929C7.90237 12.6834 7.90237 13.3166 8.29289 13.7071L11.2059 16.6201C11.2209 16.6351 11.2363 16.6497 11.252 16.6637C11.4352 16.87 11.7024 17 12 17C12.2976 17 12.5648 16.87 12.748 16.6637C12.7637 16.6497 12.7791 16.6351 12.7941 16.6201L15.7071 13.7071C16.0976 13.3166 16.0976 12.6834 15.7071 12.2929C15.3166 11.9024 14.6834 11.9024 14.2929 12.2929L13 13.5858L13 8Z"
          fill="currentColor"
        />
      </svg>
    ) : (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M12 16L12 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 13L11.913 15.913V15.913C11.961 15.961 12.039 15.961 12.087 15.913V15.913L15 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  // Comments icon (from comments.svg), colorized via currentColor like Reply/Report in VerPost
  const CommentsIcon = ({ size = 20, color = "#6c757d" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10.968 18.769C15.495 18.107 19 14.434 19 9.938a8.49 8.49 0 0 0-.216-1.912C20.718 9.178 22 11.188 22 13.475a6.1 6.1 0 0 1-1.113 3.506c.06.949.396 1.781 1.01 2.497a.43.43 0 0 1-.36.71c-1.367-.111-2.485-.426-3.354-.945A7.434 7.434 0 0 1 15 19.95a7.36 7.36 0 0 1-4.032-1.181z"
        fill="currentColor"
      />
      <path
        d="M7.625 16.657c.6.142 1.228.218 1.875.218 4.142 0 7.5-3.106 7.5-6.938C17 6.107 13.642 3 9.5 3 5.358 3 2 6.106 2 9.938c0 1.946.866 3.705 2.262 4.965a4.406 4.406 0 0 1-1.045 2.29.46.46 0 0 0 .386.76c1.7-.138 3.041-.57 4.022-1.296z"
        fill="currentColor"
      />
    </svg>
  );

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
        const res = await api.get("/forum/denuncias/tipos");
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
        console.error("Erro ao carregar tópicos", e);
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
          order: sortBy === "recent" ? "recent" : "top",
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
    navigate("/criar-post");
  }

  const handleNavigateToPost = (postId) => {
    navigate(`/forum/post/${postId}`);
  };

  async function handleVotePost(postId, voteType, currentVote) {
    try {
      if (voteType === "upvote") {
        if (currentVote === true) {
          // já upvotado -> desfazer
          await api.delete(`/forum/post/${postId}/unvote`);
        } else if (currentVote === false) {
          // tinha downvote -> desfazer o downvote e aplicar upvote
          await api.delete(`/forum/post/${postId}/unvote`);
          await api.post(`/forum/post/${postId}/upvote`);
        } else {
          // nenhum voto
          await api.post(`/forum/post/${postId}/upvote`);
        }
      } else if (voteType === "downvote") {
        if (currentVote === false) {
          // já está downvoted -> desfazer
          await api.delete(`/forum/post/${postId}/unvote`);
        } else if (currentVote === true) {
          // tinha upvote -> desfazer e aplicar downvote
          await api.delete(`/forum/post/${postId}/unvote`);
          await api.post(`/forum/post/${postId}/downvote`);
        } else {
          // nenhum voto
          await api.post(`/forum/post/${postId}/downvote`);
        }
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

  const getPostPreview = (content = "") => {
    return content.length > 150 ? content.substring(0, 150) + "..." : content;
  };

  const currentUser = JSON.parse(localStorage.getItem("user")); // Retrieve current user from localStorage

  return (
    <div className="d-flex">
      {/* Sidebar esquerda fixa na largura do layout flex */}
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
          subscribedTopics={subscribedTopics}
          toggleSubscribeTopic={toggleSubscribeTopic}
        />
      </div>

      {/* Conteúdo principal centrado no espaço à direita da sidebar */}
      <main className="flex-grow-1" style={{ padding: "1rem", minWidth: 0 }}>
        <div
          className="container-fluid py-3 bg-light"
          style={{ maxWidth: "960px", margin: "0 auto" }}
        >
          {/* Filtros e ações */}
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
                <option value="recent">Mais recentes</option>
                <option value="top">Mais votados</option>
              </select>
              <button
                className={`btn btn-sm ms-2 ${
                  isFollowed ? "btn-outline-danger" : "btn-outline-primary"
                }`}
                onClick={() =>
                  selectedTopico && toggleSubscribeTopic(selectedTopico)
                }
                disabled={!selectedTopico}
                title={
                  !selectedTopico
                    ? "Selecione um tópico para seguir"
                    : isFollowed
                    ? "Deixar de seguir este tópico"
                    : "Seguir este tópico"
                }
              >
                {isFollowed ? "Deixar de seguir" : "Seguir tópico"}
              </button>
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
                return (
                  <div
                    className="card mb-3 p-3 shadow-sm post-box"
                    key={p.idpost}
                    onClick={() => handleNavigateToPost(p.idpost)}
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 8px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.1)";
                    }}
                  >
                    <div className="post-container">
                      <div className="vote-column">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVotePost(p.idpost, "upvote", p.iteracao);
                          }}
                          className={`vote-btn up ${
                            p.iteracao === true ? "active" : ""
                          }`}
                          aria-label="Upvote"
                        >
                          <UpIcon
                            filled={p.iteracao === true}
                            size={44}
                            color="#28a745"
                          />
                        </button>
                        <div className="vote-score">{p.pontuacao ?? 0}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVotePost(p.idpost, "downvote", p.iteracao);
                          }}
                          className={`vote-btn down ${
                            p.iteracao === false ? "active" : ""
                          }`}
                          aria-label="Downvote"
                        >
                          <DownIcon
                            filled={p.iteracao === false}
                            size={44}
                            color="#dc3545"
                          />
                        </button>
                      </div>
                      <div className="post-main flex-grow-1">
                        <div className="text-muted small mb-2">
                          <span>
                            Postado por{" "}
                            {(() => {
                              const myId = String(
                                currentUser?.id ??
                                  currentUser?.idutilizador ??
                                  currentUser?.utilizador ??
                                  ""
                              );
                              const ownerId = String(
                                p.utilizador?.id ??
                                  p.utilizador?.idutilizador ??
                                  p.utilizador?.utilizador ??
                                  ""
                              );
                              const name = p.utilizador?.nome || "Anônimo";
                              const me = myId && ownerId && myId === ownerId;
                              return (
                                <span className="comment-author">
                                  {me ? <strong>{name}</strong> : name}
                                </span>
                              );
                            })()}{" "}
                            • {timeAgo(p.criado)}
                          </span>
                        </div>
                        <h5 className="mb-1" style={{ fontWeight: "bold" }}>
                          {p.titulo}
                        </h5>
                        <p
                          className="text-muted mb-1 small"
                          style={{ fontStyle: "italic" }}
                        >
                          {getPostPreview(p.conteudo)}
                        </p>
                        {p.anexo && (
                          <div
                            className="mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SubmissionFilePreview
                              url={p.anexo}
                              date={p.criado}
                            />
                          </div>
                        )}
                        <div
                          className="small d-flex gap-3 text-muted"
                          style={{
                            alignItems: "center",
                            lineHeight: "1.5",
                            marginTop: p.anexo ? "12px" : 0,
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "1rem",
                            }}
                          >
                            <CommentsIcon size={22} color="#6c757d" />
                            <span style={{ fontSize: "1rem" }}>
                              {p.ncomentarios ?? 0} comentários
                            </span>
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
