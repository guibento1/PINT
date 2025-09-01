import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@shared/services/axios";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import { SidebarContext } from "../context/SidebarContext";
import "@shared/styles/global.css"; // Garante que os estilos globais são aplicados

export default function VerPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingPost, setVotingPost] = useState(false);
  const [replyOpen, setReplyOpen] = useState({}); // { [commentId]: bool }
  const [replyText, setReplyText] = useState({}); // { [commentId]: string }
  const [userProfiles, setUserProfiles] = useState({}); // { [userId]: profile }
  const threadRef = useRef(null);
  const avatarRefs = useRef({}); // { [commentId]: HTMLElement }
  const [connectors, setConnectors] = useState([]); // svg paths between avatars
  const [layoutTick, setLayoutTick] = useState(0); // triggers connector recompute on layout/image changes
  const [votingComments, setVotingComments] = useState({}); // { [commentId]: boolean }

  // Vote icons (using provided SVG paths). Colors via currentColor.
  const UpIcon = ({ filled, size = 20, color = "#28a745" }) =>
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

  const DownIcon = ({ filled, size = 20, color = "#dc3545" }) =>
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
          transform="rotate(180 12 12)"
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

  function timeAgo(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const s = Math.floor((now - d) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  // Ensure we always operate on numeric scores (API can return strings)
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  async function loadPost() {
    try {
      setLoading(true);
      const res = await api.get(`/forum/post/${id}`);
      setPost(res.data?.post || res.data?.data || res.data || null);
    } catch (e) {
      console.error("Erro ao carregar post", e);
      setError("Não foi possível carregar o post.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRepliesRecursively(comment) {
    try {
      const commentId = comment.idcomentario || comment.id;
      const res = await api.get(`/forum/comment/${commentId}/replies`);
      const childrenData = res.data?.data || res.data || [];
      const children = await Promise.all(
        childrenData.map(fetchRepliesRecursively)
      );
      return { ...comment, children };
    } catch (e) {
      return { ...comment, children: [] };
    }
  }

  async function loadCommentsTree() {
    try {
      const res = await api.get(`/forum/post/${id}/comment`);
      const rootComments =
        res.data?.comments || res.data?.data || res.data || [];
      const tree = await Promise.all(rootComments.map(fetchRepliesRecursively));
      setComments(tree);
    } catch (e) {
      console.error("Erro ao carregar comentários", e);
      setError((prev) => prev || "Não foi possível carregar os comentários.");
    }
  }

  const fetchAndCacheUserProfiles = (idsToFetch) => {
    if (idsToFetch.length === 0) return;
    (async () => {
      try {
        const results = await Promise.all(
          idsToFetch.map((uid) =>
            api.get(`/utilizador/id/${uid}`).catch(() => null)
          )
        );
        setUserProfiles((prev) => {
          const next = { ...prev };
          results.forEach((res, index) => {
            if (res && res.data) {
              next[idsToFetch[index]] = res.data;
            }
          });
          return next;
        });
      } catch (e) {
        console.error("Failed to fetch user profiles", e);
      }
    })();
  };

  useEffect(() => {
    loadPost();
    loadCommentsTree();
  }, [id]);

  useEffect(() => {
    const ids = new Set();
    if (post?.utilizador?.id) ids.add(post.utilizador.id);
    const walk = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((c) => {
        if (c?.utilizador?.id) ids.add(c.utilizador.id);
        if (c?.children?.length) walk(c.children);
      });
    };
    walk(comments);
    const missing = [...ids].filter((uid) => !userProfiles[uid]);
    if (missing.length > 0) {
      fetchAndCacheUserProfiles(missing);
    }
  }, [post, comments]);

  // Keep avatarRefs stable across renders to avoid losing refs before computing connectors

  // Build connectors (parent avatar -> child avatar) after DOM paints
  useEffect(() => {
    const buildEdges = (items, parentId = null, acc = []) => {
      if (!Array.isArray(items)) return acc;
      items.forEach((c) => {
        const cid = c.idcomentario || c.id;
        if (parentId) acc.push({ from: parentId, to: cid });
        if (c.children?.length) buildEdges(c.children, cid, acc);
      });
      return acc;
    };

    const compute = () => {
      const container = threadRef.current;
      if (!container) return;
      const crect = container.getBoundingClientRect();
      const edges = buildEdges(comments);
      const next = [];
      edges.forEach(({ from, to }) => {
        const fromEl = avatarRefs.current[from];
        const toEl = avatarRefs.current[to];
        if (!fromEl || !toEl) return;
        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();

        const x1 = fr.left + fr.width / 2 - crect.left; // bottom-center of parent avatar
        const y1 = fr.top + fr.height - crect.top;
        const x2 = tr.left - crect.left; // left-center of child avatar
        const y2 = tr.top + tr.height / 2 - crect.top;

        // Ensure the SVG bounds include the horizontal segment of the L
        const minHoriz = 14;
        const finalAbsX = Math.max(x2, x1 + minHoriz);
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const width = Math.max(1, finalAbsX - left);
        const height = Math.max(1, Math.abs(y2 - y1));

        const sx = x1 - left;
        const sy = y1 - top;
        const tx = x2 - left;
        const ty = y2 - top;

        const finalTx = Math.max(tx, sx + minHoriz);
        const d = `M ${sx},${sy} V ${ty} H ${finalTx}`;

        next.push({ key: `${from}-${to}`, left, top, width, height, d });
      });
      setConnectors(next);
    };

    const raf = requestAnimationFrame(compute);
    // Recompute after a short delay to catch late image loads/layout
    const t1 = setTimeout(compute, 100);
    const t2 = setTimeout(compute, 300);
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
    };
  }, [comments, layoutTick]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/forum/post/${id}/comment`, { conteudo: newComment });
      await loadCommentsTree();
      setNewComment("");
      setShowCommentBox(false);
    } catch (e) {
      console.error("Erro ao enviar comentário", e);
      setError("Ocorreu um erro ao enviar o seu comentário.");
    }
  };

  const handleVote = async (endpoint, currentVote, voteType) => {
    try {
      const voteAction =
        currentVote === voteType ? "unvote" : voteType ? "upvote" : "downvote";
      const url = `${endpoint}/${voteAction}`;

      if (voteAction === "unvote") {
        await api.delete(url.replace("/unvote", "/unvote"));
      } else {
        await api.post(url);
      }

      return true;
    } catch (e) {
      console.error(`Erro ao votar em ${endpoint}`, e);
      setError("Ocorreu um erro ao registar o seu voto.");
      return false;
    }
  };

  const handleVotePost = async (voteType) => {
    if (votingPost || !post) return;
    setVotingPost(true);
    // Optimistic update
    const current = post.iteracao;
    const isUp = voteType === "up";
    let delta = 0;
    let nextIter = current;
    if (isUp) {
      if (current === true) {
        nextIter = null; // unvote
        delta = -1;
      } else if (current === false) {
        nextIter = true; // switch
        delta = 2;
      } else {
        nextIter = true; // upvote
        delta = 1;
      }
    } else {
      if (current === false) {
        nextIter = null; // unvote
        delta = 1;
      } else if (current === true) {
        nextIter = false; // switch
        delta = -2;
      } else {
        nextIter = false; // downvote
        delta = -1;
      }
    }
    setPost((p) => ({
      ...p,
      iteracao: nextIter,
      pontuacao: num(p?.pontuacao) + delta,
    }));
    try {
      const ok = await handleVote(
        `/forum/post/${post.idpost || post.id}`,
        current,
        voteType === "up"
      );
      if (!ok) throw new Error("vote failed");
    } catch (e) {
      // revert on failure
      setPost((p) => ({
        ...p,
        iteracao: current,
        pontuacao: num(p?.pontuacao) - delta,
      }));
    } finally {
      setVotingPost(false);
    }
  };

  const handleVoteComment = async (commentId, currentVote, voteType) => {
    if (votingComments[commentId]) return;
    setVotingComments((m) => ({ ...m, [commentId]: true }));

    const isUp = voteType === "up";
    let delta = 0;
    let nextIter = currentVote;
    if (isUp) {
      if (currentVote === true) {
        nextIter = null; // unvote
        delta = -1;
      } else if (currentVote === false) {
        nextIter = true; // switch
        delta = 2;
      } else {
        nextIter = true; // upvote
        delta = 1;
      }
    } else {
      if (currentVote === false) {
        nextIter = null; // unvote
        delta = 1;
      } else if (currentVote === true) {
        nextIter = false; // switch
        delta = -2;
      } else {
        nextIter = false; // downvote
        delta = -1;
      }
    }

    const updateCommentById = (list, id, updater) =>
      Array.isArray(list)
        ? list.map((c) => {
            const cid = c.idcomentario || c.id;
            if (cid === id) {
              return updater(c);
            }
            if (Array.isArray(c.children) && c.children.length) {
              return {
                ...c,
                children: updateCommentById(c.children, id, updater),
              };
            }
            return c;
          })
        : list;

    // Optimistic UI update
    setComments((prev) =>
      updateCommentById(prev, commentId, (c) => ({
        ...c,
        iteracao: nextIter,
        pontuacao: num(c.pontuacao) + delta,
      }))
    );

    try {
      const ok = await handleVote(
        `/forum/comment/${commentId}`,
        currentVote,
        voteType === "up"
      );
      if (!ok) throw new Error("vote failed");
    } catch (e) {
      // revert on failure
      setComments((prev) =>
        updateCommentById(prev, commentId, (c) => ({
          ...c,
          iteracao: currentVote,
          pontuacao: num(c.pontuacao) - delta,
        }))
      );
    } finally {
      setVotingComments((m) => ({ ...m, [commentId]: false }));
    }
  };

  const toggleReply = (commentId) => {
    setReplyOpen((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    // Layout changes affect connector positions
    setTimeout(() => setLayoutTick((t) => t + 1), 0);
  };

  const handleSubmitReply = async (commentId) => {
    const text = (replyText[commentId] || "").trim();
    if (!text) return;
    try {
      const res = await api.post(`/forum/comment/${commentId}/respond`, {
        conteudo: text,
      });
      const created = res?.data?.data || res?.data || null;
      if (created) {
        // append new child locally
        const updateCommentById = (list, id, updater) =>
          Array.isArray(list)
            ? list.map((c) => {
                const cid = c.idcomentario || c.id;
                if (cid === id) return updater(c);
                if (Array.isArray(c.children) && c.children.length) {
                  return {
                    ...c,
                    children: updateCommentById(c.children, id, updater),
                  };
                }
                return c;
              })
            : list;
        setComments((prev) =>
          updateCommentById(prev, commentId, (c) => ({
            ...c,
            children: [...(c.children || []), created],
          }))
        );
        // reflow connectors for the new reply
        setTimeout(() => setLayoutTick((t) => t + 1), 0);
      } else {
        // fallback: refresh tree if API doesn't return created entity
        await loadCommentsTree();
      }
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
      setReplyOpen((prev) => ({ ...prev, [commentId]: false }));
    } catch (e) {
      console.error("Erro ao responder a comentário", e);
      setError("Ocorreu um erro ao enviar a sua resposta.");
    }
  };

  const handleReportComment = async (commentId) => {
    try {
      await api.post(`/forum/comment/${commentId}/reportar`);
    } catch (e) {
      console.error("Erro ao reportar comentário", e);
      setError("Não foi possível reportar este comentário.");
    }
  };

  const renderComments = (items) => {
    if (!Array.isArray(items)) return null;

    return items.map((comment) => {
      const commentId = comment.idcomentario || comment.id;
      const authorName = comment.utilizador?.nome || "Anónimo";
      const content = comment.conteudo || "";
      const score = num(comment.pontuacao);
      const userVote = comment.iteracao;
      const children = comment.children || [];
      const hasChildren = children.length > 0;
      const authorId = comment.utilizador?.id;
      const authorProfile = authorId ? userProfiles[authorId] : null;

      return (
        <div key={commentId} className="comment-container">
          <div className="comment-item">
            <div className="comment-content">
              <div className="avatar-col">
                <div
                  className="avatar-wrapper"
                  ref={(el) => {
                    if (el) avatarRefs.current[commentId] = el;
                  }}
                >
                  {authorProfile?.foto ? (
                    <img
                      src={authorProfile.foto}
                      alt={authorName}
                      className="avatar-sm"
                      onLoad={() => setLayoutTick((t) => t + 1)}
                    />
                  ) : (
                    <div className="avatar-sm d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="comment-main">
                <div className="comment-meta">
                  <span className="comment-author">{authorName}</span>
                  <span className="text-muted">
                    • {timeAgo(comment.criado)}
                  </span>
                  <div className="ms-auto" />
                </div>
                <div className="comment-body">{content}</div>
                <div className="comment-actions-row d-flex align-items-center gap-2 mt-2">
                  <button
                    className={`icon-btn ${userVote === true ? "active" : ""}`}
                    title="Upvote"
                    onClick={() => handleVoteComment(commentId, userVote, "up")}
                    disabled={!!votingComments[commentId]}
                    aria-label="Upvote"
                  >
                    <UpIcon
                      filled={userVote === true}
                      size={25}
                      color="#28a745"
                    />
                  </button>
                  <span className="vote-score">{score}</span>
                  <button
                    className={`icon-btn ${userVote === false ? "active" : ""}`}
                    title="Downvote"
                    onClick={() =>
                      handleVoteComment(commentId, userVote, "down")
                    }
                    disabled={!!votingComments[commentId]}
                    aria-label="Downvote"
                  >
                    <DownIcon
                      filled={userVote === false}
                      size={25}
                      color="#dc3545"
                    />
                  </button>
                  <button
                    className="icon-btn"
                    title="Responder"
                    onClick={() => toggleReply(commentId)}
                  >
                    ↩
                  </button>
                  <button
                    className="icon-btn"
                    title="Reportar"
                    onClick={() => handleReportComment(commentId)}
                  >
                    ⚑
                  </button>
                </div>
                {replyOpen[commentId] && (
                  <div className="reply-box">
                    <textarea
                      className="form-control mb-2"
                      rows="3"
                      value={replyText[commentId] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({
                          ...prev,
                          [commentId]: e.target.value,
                        }))
                      }
                      placeholder="Escreva a sua resposta..."
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubmitReply(commentId)}
                    >
                      Enviar Resposta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {hasChildren && (
            <div className="comment-children">{renderComments(children)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-3 d-none d-lg-block">
          <aside>
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
          </aside>
        </div>
        <main className="col-lg-6">
          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <div className="text-center card-rounded">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">A carregar...</span>
              </div>
            </div>
          ) : post ? (
            <>
              <div className="card-rounded post-container">
                <div className="vote-column">
                  <button
                    onClick={() => handleVotePost("up")}
                    disabled={votingPost}
                    className={`vote-btn up ${
                      post.iteracao === true ? "active" : ""
                    }`}
                    aria-label="Upvote"
                  >
                    <UpIcon
                      filled={post.iteracao === true}
                      size={44}
                      color="#28a745"
                    />
                  </button>
                  <div className="vote-score">{num(post.pontuacao)}</div>
                  <button
                    onClick={() => handleVotePost("down")}
                    disabled={votingPost}
                    className={`vote-btn down ${
                      post.iteracao === false ? "active" : ""
                    }`}
                    aria-label="Downvote"
                  >
                    <DownIcon
                      filled={post.iteracao === false}
                      size={44}
                      color="#dc3545"
                    />
                  </button>
                </div>
                <div className="post-main flex-grow-1">
                  <div className="text-muted small mb-2">
                    <span>
                      Postado por{" "}
                      <strong>{post.utilizador?.nome || "Anónimo"}</strong> •{" "}
                      {timeAgo(post.criado || post.createdAt)}
                    </span>
                  </div>
                  <h3 className="mb-2">{post.titulo || post.title}</h3>
                  <p className="mb-3">{post.conteudo || post.content}</p>
                  <div className="comment-actions">
                    <button
                      className="btn btn-link"
                      onClick={() => setShowCommentBox((s) => !s)}
                    >
                      {showCommentBox ? "Cancelar" : "Comentar"}
                    </button>
                  </div>
                  {showCommentBox && (
                    <div className="mt-3 reply-box">
                      <textarea
                        className="form-control mb-2"
                        rows="4"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreva o seu comentário..."
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleCommentSubmit}
                      >
                        Publicar Comentário
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-rounded comment-section">
                <h5 className="mb-3">Comentários</h5>
                {comments.length > 0 ? (
                  <div
                    className="comment-thread position-relative"
                    ref={threadRef}
                  >
                    {/* SVG connectors layer */}
                    {connectors.map((c) => (
                      <svg
                        key={c.key}
                        className="connector-svg"
                        style={{
                          left: c.left,
                          top: c.top,
                          width: c.width,
                          height: c.height,
                          pointerEvents: "none",
                          color: "#cfd3d8",
                        }}
                      >
                        <path
                          d={c.d}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ))}
                    {renderComments(comments)}
                  </div>
                ) : (
                  <div className="text-muted small">Ainda sem comentários.</div>
                )}
              </div>
            </>
          ) : (
            <div className="card-rounded text-muted">Post não encontrado.</div>
          )}
        </main>
        <div className="col-lg-3 d-none d-lg-block">
          <aside>
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
