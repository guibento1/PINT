import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@shared/services/axios";
import LeftSidebar from "../components/LeftSidebar";
import { SidebarContext } from "../context/SidebarContext";
import Modal from "@shared/components/Modal";
import {
  fetchPostCommentsTreeCached,
  invalidatePostCommentsCache,
  updatePostCommentsCache,
  fetchPostRootCommentsCached,
  fetchCommentWithReplies,
} from "@shared/services/dataCache";
import "@shared/styles/global.css";
import SubmissionFilePreview from "@shared/components/SubmissionFilePreview";

export default function VerPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingPost, setVotingPost] = useState(false);
  const [replyOpen, setReplyOpen] = useState({}); // { [commentId]: bool }
  const [replyText, setReplyText] = useState({}); // { [commentId]: string }
  const threadRef = useRef(null);
  const avatarRefs = useRef({}); // { [commentId]: HTMLElement }
  const [connectors, setConnectors] = useState([]); // svg paths entre avatares
  const [layoutTick, setLayoutTick] = useState(0); // gatilho de recomputar conectores
  const [votingComments, setVotingComments] = useState({}); // { [commentId]: boolean }
  // Avatar do utilizador atual para decorar comentários/respostas imediatamente
  const [myAvatar, setMyAvatar] = useState(null);

  // Denúncias
  const [tiposDenuncia, setTiposDenuncia] = useState([]); // GET /forum/denuncias/tipos
  const [denunciaOpen, setDenunciaOpen] = useState(false);
  const [denunciaTipo, setDenunciaTipo] = useState("");
  const [denunciaDescricao, setDenunciaDescricao] = useState("");
  const [denunciaTarget, setDenunciaTarget] = useState(null); // { kind: 'post'|'comment', id }

  // Status de denúncia para exibir feedback sem browser alert
  const [denunciaStatus, setDenunciaStatus] = useState(null); // { type: 'success'|'error', message: string }

  // Modal de confirmação já existente (para ações de deleção, etc)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  // Info do utilizador autenticado (para decoração otimista), com fallback ao localStorage
  const getStoredUser = () => {
    try {
      const fromSession = sessionStorage.getItem("user");
      const fromLocal = localStorage.getItem("user");
      return JSON.parse(fromSession || fromLocal || "null");
    } catch {
      return null;
    }
  };
  const currentUser = getStoredUser();

  // Carrega a foto do utilizador autenticado se não estiver presente no storage
  useEffect(() => {
    const loadMyAvatar = async () => {
      try {
        const myId =
          currentUser?.id ??
          currentUser?.idutilizador ??
          currentUser?.utilizador;
        if (!myId) return;
        if (currentUser?.foto) {
          setMyAvatar(currentUser.foto);
          return;
        }
        const res = await api.get(`/utilizador/id/${myId}`);
        const foto = res?.data?.foto || null;
        setMyAvatar(foto);
      } catch (e) {
        // silencioso: sem avatar
      }
    };
    loadMyAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função estável para abrir o modal de confirmação (para actions existentes)
  const openConfirmModal = (title, message, action) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  // Abre o modal de denúncia
  const openDenunciaModal = (targetKind, targetId) => {
    // qualquer ação alternativa fecha caixas de resposta
    setReplyOpen({});
    setReplyText({});
    setLayoutTick((t) => t + 1);
    setDenunciaTarget({ kind: targetKind, id: targetId });
    setDenunciaOpen(true);
    setDenunciaTipo("");
    setDenunciaDescricao("");
    setDenunciaStatus(null);
  };

  // Fecha o modal de denúncia
  const closeDenunciaModal = () => {
    setDenunciaOpen(false);
    setDenunciaTarget(null);
  };

  // Helper: fechar todas as caixas de resposta
  const closeAllReplies = () => {
    setReplyOpen({});
    setReplyText({});
    setLayoutTick((t) => t + 1);
  };

  // Envia a denúncia com o payload esperado
  const handleSubmitDenuncia = async () => {
    if (!denunciaTarget) return;
    if (!denunciaTipo) {
      setDenunciaStatus({
        type: "error",
        message: "Selecione um tipo de denúncia.",
      });
      return;
    }
    const payload = {
      tipo: Number(denunciaTipo),
      descricao: denunciaDescricao || "",
    };
    try {
      const endpoint =
        denunciaTarget.kind === "post"
          ? `/forum/post/${denunciaTarget.id}/reportar`
          : `/forum/comment/${denunciaTarget.id}/reportar`;
      await api.post(endpoint, payload);
      setDenunciaStatus({
        type: "success",
        message: "Denúncia enviada com sucesso.",
      });
      // opcional: fechar o modal após breves instantes
      setTimeout(() => {
        closeDenunciaModal();
      }, 800);
    } catch (e) {
      console.error("Erro ao enviar denúncia", e);
      setDenunciaStatus({
        type: "error",
        message: "Erro ao enviar a denúncia.",
      });
    }
  };

  // utilidades
  const getUserName = (utilizador) => {
    if (!utilizador) return "Anónimo";
    if (typeof utilizador === "object" && utilizador.nome)
      return utilizador.nome;
    if (typeof utilizador === "string") return utilizador;
    return "Anónimo";
  };

  // Owner check: apenas por id quando disponível
  const isOwner = (utilizador) => {
    try {
      const myId =
        currentUser?.id ?? currentUser?.idutilizador ?? currentUser?.utilizador;
      if (!myId) return false;
      if (utilizador && typeof utilizador === "object") {
        const ownerId =
          utilizador.id ?? utilizador.idutilizador ?? utilizador.utilizador;
        return ownerId && String(ownerId) === String(myId);
      }
      if (typeof utilizador === "number" || typeof utilizador === "string") {
        return String(utilizador) === String(myId);
      }
      return false;
    } catch {
      return false;
    }
  };

  // Icons (mantidos do estilo existente)
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

  // New icons for reply and report using provided SVG paths
  const ReplyIcon = ({ filled, size = 22, color = "#6c757d" }) =>
    filled ? (
      // reply-cheio.svg (viewBox 0 0 32 32)
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M177,270 L163,270 C162.448,270 162,269.553 162,269 C162,268.448 162.448,268 163,268 L177,268 C177.552,268 178,268.448 178,269 C178,269.553 177.552,270 177,270 L177,270 Z M175,276 L165,276 C164.448,276 164,275.553 164,275 C164,274.447 164.448,274 165,274 L175,274 C175.552,274 176,274.447 176,275 C176,275.553 175.552,276 175,276 L175,276 Z M170,257 C161.164,257 154,263.269 154,271 C154,275.419 156.345,279.354 160,281.919 L160,289 L167.009,284.747 C167.979,284.907 168.977,285 170,285 C178.836,285 186,278.732 186,271 C186,263.269 178.836,257 170,257 L170,257 Z"
          fill="currentColor"
          transform="translate(-154 -257)"
        />
      </svg>
    ) : (
      // reply-vazio.svg (viewBox 0 0 32 32)
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M168,281 C166.832,281 165.704,280.864 164.62,280.633 L159.912,283.463 L159.975,278.824 C156.366,276.654 154,273.066 154,269 C154,262.373 160.268,257 168,257 C175.732,257 182,262.373 182,269 C182,275.628 175.732,281 168,281 L168,281 Z M168,255 C159.164,255 152,261.269 152,269 C152,273.419 154.345,277.354 158,279.919 L158,287 L165.009,282.747 C165.979,282.907 166.977,283 168,283 C176.836,283 184,276.732 184,269 C184,261.269 176.836,255 168,255 L168,255 Z M175,266 L161,266 C160.448,266 160,266.448 160,267 C160,267.553 160.448,268 161,268 L175,268 C175.552,268 176,267.553 176,267 C176,266.448 175.552,266 175,266 L175,266 Z M173,272 L163,272 C162.448,272 162,272.447 162,273 C162,273.553 162.448,274 163,274 L173,274 C173.552,274 174,273.553 174,273 C174,272.447 173.552,272 173,272 L173,272 Z"
          fill="currentColor"
          transform="translate(-152 -255)"
        />
      </svg>
    );

  const ReportIcon = ({ filled, size = 22, color = "#6c757d" }) =>
    filled ? (
      // report-cheio.svg (viewBox 0 0 24 24)
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M16.3027 15.3365H6.68V20.1818C6.68 20.6337 6.30392 21 5.84 21C5.37608 21 5 20.6337 5 20.1818V3.81818C5 3.36631 5.37608 3 5.84 3H16.3027C17.4037 3 18.2506 3.65926 18.6739 4.48207C19.0965 5.30334 19.1414 6.35681 18.6123 7.28021L18.1096 8.15756C17.757 8.77312 17.757 9.56335 18.1096 10.1789L18.6123 11.0563C19.1414 11.9797 19.0965 13.0331 18.6739 13.8544C18.2506 14.6772 17.4037 15.3365 16.3027 15.3365Z"
          fill="currentColor"
        />
      </svg>
    ) : (
      // report-vazio.svg (viewBox 0 0 24 24)
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M6 14.4623H16.1909C17.6066 14.4623 18.472 12.7739 17.7261 11.4671L17.2365 10.6092C16.7547 9.76504 16.7547 8.69728 17.2365 7.85309L17.7261 6.99524C18.472 5.68842 17.6066 4 16.1909 4L6 4L6 14.4623ZM6 14.4623L6 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  // Delete (trash) icon filled, using shared delete-cheio.svg path; color follows currentColor
  const DeleteIcon = ({ size = 18, color = "#ffffff" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{ color }}
    >
      <path
        d="M5.755,20.283,4,8H20L18.245,20.283A2,2,0,0,1,16.265,22H7.735A2,2,0,0,1,5.755,20.283ZM21,4H16V3a1,1,0,0,0-1-1H9A1,1,0,0,0,8,3V4H3A1,1,0,0,0,3,6H21a1,1,0,0,0,0-2Z"
        fill="currentColor"
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
    toggleSubscribeTopic,
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

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  async function loadPost() {
    try {
      setLoading(true);
      const res = await api.get(`/forum/post/${id}`);
      const raw = res.data?.post || res.data?.data || res.data || null;
      setPost(raw);
    } catch (e) {
      console.error("Erro ao carregar post", e);
      setError("Não foi possível carregar o post.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCommentsTree() {
    setCommentsLoading(true);
    try {
      // 1) Fetch top-level comments quickly
      const root = await fetchPostRootCommentsCached(id);
      setComments(root);
      setCommentsLoading(false); // show roots immediately

      // 2) In background, hydrate replies per root with small concurrency
      const concurrency = 4;
      const queue = [...root];
      const nextStateMap = new Map();

      const runWorker = async () => {
        while (queue.length) {
          const c = queue.shift();
          if (!c) break;
          try {
            const hydrated = await fetchCommentWithReplies(c);
            nextStateMap.set(c.idcomentario || c.id, hydrated);
            // apply incrementally
            setComments((prev) => {
              const replaceById = (list) =>
                Array.isArray(list)
                  ? list.map((item) => {
                      const cid = item.idcomentario || item.id;
                      const replacement = nextStateMap.get(cid);
                      if (replacement) return replacement;
                      // Keep existing children until they're hydrated
                      return item;
                    })
                  : list;
              const next = replaceById(prev);
              try {
                updatePostCommentsCache(id, next);
              } catch {}
              return next;
            });
          } catch {
            // ignore hydrate errors per comment
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, queue.length) }, runWorker)
      );
    } catch (e) {
      console.error("Erro ao carregar comentários", e);
      setError((prev) => prev || "Não foi possível carregar os comentários.");
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    loadPost();
    // Adiar carregamento de comentários até a página realmente necessitar (primeira visita ao VerPost)
    // Aqui carregamos assim que a página monta, mas via cache e com indicador visual.
    loadCommentsTree();
  }, [id]);

  // Carrega tipos de denúncia
  useEffect(() => {
    let mounted = true;
    const loadTipos = async () => {
      try {
        const res = await api.get("/forum/denuncias/tipos");
        if (mounted) setTiposDenuncia(res.data || []);
      } catch (e) {
        console.error("Erro ao carregar tipos de denúncia", e);
      }
    };
    loadTipos();
    return () => {
      mounted = false;
    };
  }, []);

  // Edges dos conectores (mantido igual)
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

        const x1 = fr.left + fr.width / 2 - crect.left;
        const y1 = fr.top + fr.height - crect.top;
        const x2 = tr.left - crect.left;
        const y2 = tr.top + tr.height / 2 - crect.top;

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
      const res = await api.post(`/forum/post/${id}/comment`, {
        conteudo: newComment,
      });
      // Inserção otimista do comentário de topo com dados do utilizador atual
      const created = res?.data?.data || res?.data || null;
      if (created) {
        const u = created?.utilizador;
        const isUserObject =
          u && typeof u === "object" && (u.nome || u.foto || u.id);
        const isUserPrimitive = typeof u === "number" || typeof u === "string";
        const shouldDecorate = !isUserObject && currentUser;
        const decorated = shouldDecorate
          ? {
              ...created,
              criado: created?.criado || new Date().toISOString(),
              utilizador:
                isUserPrimitive || !u
                  ? {
                      id:
                        currentUser.id ??
                        currentUser.idutilizador ??
                        currentUser.utilizador ??
                        u,
                      nome: currentUser.nome ?? currentUser.name ?? "",
                      foto: myAvatar ?? currentUser.foto ?? null,
                    }
                  : created.utilizador,
              children: created?.children || [],
              iteracao: created?.iteracao ?? null,
              pontuacao: created?.pontuacao ?? 0,
            }
          : created;
        setComments((prev) => {
          const next = [...prev, decorated];
          try {
            updatePostCommentsCache(id, next);
          } catch {}
          return next;
        });
      }
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

  // Votação post
  const handleVotePost = async (voteType) => {
    if (votingPost || !post) return;
    // fechar qualquer reply aberto quando executa outra ação
    closeAllReplies();
    setVotingPost(true);
    const current = post.iteracao;
    const isUp = voteType === "up";
    let delta = 0;
    let nextIter = current;
    if (isUp) {
      if (current === true) {
        nextIter = null;
        delta = -1;
      } else if (current === false) {
        nextIter = true;
        delta = 2;
      } else {
        nextIter = true;
        delta = 1;
      }
    } else {
      if (current === false) {
        nextIter = null;
        delta = 1;
      } else if (current === true) {
        nextIter = false;
        delta = -2;
      } else {
        nextIter = false;
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
      setPost((p) => ({
        ...p,
        iteracao: current,
        pontuacao: num(p?.pontuacao) - delta,
      }));
    } finally {
      setVotingPost(false);
    }
  };

  // Votação comentário
  const handleVoteComment = async (commentId, currentVote, voteType) => {
    if (votingComments[commentId]) return;
    // fechar replies quando votar
    closeAllReplies();
    setVotingComments((m) => ({ ...m, [commentId]: true }));

    const isUp = voteType === "up";
    let delta = 0;
    let nextIter = currentVote;
    if (isUp) {
      if (currentVote === true) {
        nextIter = null;
        delta = -1;
      } else if (currentVote === false) {
        nextIter = true;
        delta = 2;
      } else {
        nextIter = true;
        delta = 1;
      }
    } else {
      if (currentVote === false) {
        nextIter = null;
        delta = 1;
      } else if (currentVote === true) {
        nextIter = false;
        delta = -2;
      } else {
        nextIter = false;
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

    // Update otimista
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
    setReplyOpen((prev) => {
      const isOpen = !!prev[commentId];
      // exclusivo: se já está aberto, fecha tudo; caso contrário, abre só este
      return isOpen ? {} : { [commentId]: true };
    });
    setLayoutTick((t) => t + 1);
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
        // Decoração otimista: se backend ainda não devolve utilizador enriquecido, usar o atual
        let createdDecorated = created;
        const u = created?.utilizador;
        const isUserObject =
          u && typeof u === "object" && (u.nome || u.foto || u.id);
        const isUserPrimitive = typeof u === "number" || typeof u === "string";
        if (!isUserObject && isUserPrimitive && currentUser) {
          createdDecorated = {
            ...created,
            criado: created?.criado || new Date().toISOString(),
            utilizador: {
              id:
                currentUser.id ??
                currentUser.idutilizador ??
                currentUser.utilizador ??
                u,
              nome: currentUser.nome ?? currentUser.name ?? "",
              foto: myAvatar ?? currentUser.foto ?? null,
            },
          };
        }
        setComments((prev) => {
          const next = updateCommentById(prev, commentId, (c) => ({
            ...c,
            children: [...(c.children || []), createdDecorated],
          }));
          // Atualiza cache em memória para persistir ao navegar
          try {
            updatePostCommentsCache(id, next);
          } catch {}
          return next;
        });
        setTimeout(() => setLayoutTick((t) => t + 1), 0);
      } else {
        // Cenário raro: sem objeto created – força refetch suave depois
        try {
          invalidatePostCommentsCache(id);
        } catch {}
      }
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
      setReplyOpen((prev) => ({ ...prev, [commentId]: false }));
    } catch (e) {
      console.error("Erro ao responder a comentário", e);
      setError("Ocorreu um erro ao enviar a sua resposta.");
    }
  };

  // Denúncia: em vez de por browser alert, usamos o modal
  // - ao clicar no ⚑ de um comentário, dispara openDenunciaModal("comment", id)
  // - ao clicar no Denunciar do post, dispara openDenunciaModal("post", id)
  const handleReportComment = (commentId) => {
    openDenunciaModal("comment", commentId);
  };

  // Denúncia de post (já integrado via post Denunciar)
  const handleReportPost = () => {
    openDenunciaModal("post", post?.idpost || post?.id);
  };

  // Botões de deleção (mantidos para referência)
  const confirmDeletePost = () => {
    openConfirmModal(
      "Eliminar Post",
      "Tem a certeza que quer eliminar este post?",
      async () => {
        try {
          await api.delete(`/forum/post/${post.idpost || post.id}`);
          window.location.href = "/forums";
        } catch (e) {
          console.error("Erro ao eliminar post", e);
          setError("Não foi possível eliminar o post.");
        }
      }
    );
  };

  const confirmDeleteComment = (commentId) => {
    openConfirmModal(
      "Eliminar Comentário",
      "Tem a certeza que quer eliminar este comentário?",
      async () => {
        try {
          await api.delete(`/forum/comment/${commentId}`);
          invalidatePostCommentsCache(id);
          await loadCommentsTree();
        } catch (e) {
          console.error("Erro ao eliminar comentário", e);
          setError("Não foi possível eliminar o comentário.");
        }
      }
    );
  };

  const renderComments = (items) => {
    if (!Array.isArray(items)) return null;

    return items.map((comment) => {
      const cid = comment.idcomentario || comment.id;
      const authorName = getUserName(comment.utilizador);
      const content = comment.conteudo || "";
      const score = num(comment.pontuacao);
      const userVote = comment.iteracao;
      const children = comment.children || [];
      const hasChildren = children.length > 0;

      return (
        <div key={cid} className="comment-container">
          <div className="comment-item">
            <div className="comment-content">
              <div className="avatar-col">
                <div
                  className="avatar-wrapper"
                  ref={(el) => {
                    if (el) avatarRefs.current[cid] = el;
                  }}
                >
                  {(() => {
                    const me = isOwner(comment.utilizador);
                    const avatarUrl =
                      comment?.utilizador?.foto ?? (me ? myAvatar : null);
                    if (avatarUrl) {
                      return (
                        <div className="avatar-sm rounded-circle overflow-hidden">
                          <img
                            src={avatarUrl}
                            alt={authorName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="avatar-sm d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="comment-main">
                <div className="comment-meta">
                  {(() => {
                    const me = isOwner(comment.utilizador);
                    return (
                      <span className="comment-author">
                        {me ? <strong>{authorName}</strong> : authorName}
                      </span>
                    );
                  })()}
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
                    onClick={() => handleVoteComment(cid, userVote, "up")}
                    disabled={!!votingComments[cid]}
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
                    onClick={() => handleVoteComment(cid, userVote, "down")}
                    disabled={!!votingComments[cid]}
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
                    onClick={() => toggleReply(cid)}
                    aria-label="Responder"
                  >
                    <ReplyIcon filled={!!replyOpen[cid]} size={22} />
                  </button>
                  <button
                    className="icon-btn"
                    title="Reportar"
                    onClick={() => handleReportComment(cid)}
                    aria-label="Reportar"
                  >
                    <ReportIcon
                      filled={
                        !!denunciaOpen &&
                        denunciaTarget?.kind === "comment" &&
                        String(denunciaTarget?.id) === String(cid)
                      }
                      size={22}
                    />
                  </button>
                  {/* Removido o botão extra "Denunciar" para evitar redundância */}
                  {isOwner(comment.utilizador) && (
                    <button
                      className="btn btn-danger btn-sm my-1 py-1 pb-2 btn-icon-delete"
                      onClick={() => confirmDeleteComment(cid)}
                      title="Eliminar Comentário"
                      aria-label="Eliminar Comentário"
                      style={{ marginLeft: "auto" }}
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>

                {replyOpen[cid] && (
                  <div className="reply-box">
                    <textarea
                      className="form-control mb-2"
                      rows="3"
                      value={replyText[cid] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({
                          ...prev,
                          [cid]: e.target.value,
                        }))
                      }
                      placeholder="Escreva a sua resposta..."
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubmitReply(cid)}
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

  const isPostOwner = isOwner(post?.utilizador);

  return (
    <div className="d-flex">
      {/* Modal de denúncia (usado para post e comentários) */}
      <Modal
        isOpen={denunciaOpen}
        onClose={closeDenunciaModal}
        title="Denunciar Conteúdo"
      >
        <div className="mb-2">
          <label className="form-label small">Tipo de denúncia</label>
          <select
            className="form-control form-control-sm"
            value={denunciaTipo}
            onChange={(e) => setDenunciaTipo(e.target.value)}
          >
            <option value="">Selecione...</option>
            {tiposDenuncia.map((t) => (
              <option key={t.idtipodenuncia} value={t.idtipodenuncia}>
                {t.designacao}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label small">Descrição</label>
          <textarea
            className="form-control form-control-sm"
            rows={3}
            value={denunciaDescricao}
            onChange={(e) => setDenunciaDescricao(e.target.value)}
            placeholder="Descreva a denúncia..."
          />
        </div>
        {denunciaStatus && (
          <div
            className={`alert ${
              denunciaStatus.type === "success"
                ? "alert-success"
                : "alert-danger"
            } mt-2`}
            role="alert"
          >
            {denunciaStatus.message}
          </div>
        )}
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={closeDenunciaModal}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleSubmitDenuncia}
            disabled={!denunciaTipo}
          >
            Denunciar
          </button>
        </div>
      </Modal>

      {/* Modal de confirmação existente (para deleções, se houver) */}
      <Modal
        isOpen={confirmOpen}
        onClose={closeConfirmModal}
        title={confirmTitle}
      >
        <p className="mb-2">{confirmMessage || "Operação?"}</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={closeConfirmModal}
          >
            Não
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={async () => {
              try {
                if (typeof confirmAction === "function") {
                  await confirmAction();
                }
              } finally {
                closeConfirmModal();
              }
            }}
          >
            Sim
          </button>
        </div>
      </Modal>

      {/* Sidebar esquerda fixa na largura dentro do flex */}
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

      {/* Conteúdo principal centrado na área à direita da sidebar */}
      <main
        className="flex-grow-1"
        style={{ padding: "1rem", minWidth: 0, marginTop: "20px" }}
      >
        <div
          className="container-fluid"
          style={{ maxWidth: "960px", margin: "0 auto" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate("/forums")}
            >
              Voltar
            </button>
          </div>
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
                  <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                    {(() => {
                      const owner = isOwner(post?.utilizador);
                      const avatarUrl =
                        post?.utilizador?.foto ?? (owner ? myAvatar : null);
                      if (avatarUrl) {
                        return (
                          <div className="avatar-sm rounded-circle overflow-hidden">
                            <img
                              src={avatarUrl}
                              alt={getUserName(post?.utilizador)}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="avatar-sm d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle">
                          {getUserName(post?.utilizador)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      );
                    })()}
                    {(() => {
                      const me = isOwner(post?.utilizador);
                      const name = getUserName(post?.utilizador);
                      return (
                        <span className="comment-author">
                          {me ? <strong>{name}</strong> : name}
                        </span>
                      );
                    })()}
                    <span>• {timeAgo(post?.criado || post?.createdAt)}</span>
                  </div>
                  <div className="mb-2 d-flex align-items-center">
                    <h3 className="mb-0">{post.titulo || post.title}</h3>
                    {/* Denunciar Post (apenas uma vez) */}
                    <button
                      className="btn btn-sm ms-auto"
                      onClick={handleReportPost}
                      title="Denunciar conteúdo"
                      aria-label="Denunciar conteúdo"
                    >
                      <ReportIcon
                        filled={
                          !!denunciaOpen &&
                          denunciaTarget?.kind === "post" &&
                          String(denunciaTarget?.id) ===
                            String(post?.idpost || post?.id)
                        }
                        size={22}
                      />
                    </button>
                  </div>

                  <p className="mb-3 post-body">
                    {post.conteudo || post.content}
                  </p>
                  {post.anexo && (
                    <div className="mt-3 mb-3">
                      <SubmissionFilePreview
                        url={post.anexo}
                        date={post.criado || post.createdAt}
                      />
                    </div>
                  )}

                  <div className="comment-actions">
                    <button
                      className="btn btn-link"
                      onClick={() => {
                        closeAllReplies();
                        setShowCommentBox((s) => !s);
                      }}
                    >
                      {showCommentBox ? "Cancelar" : "Comentar"}
                    </button>
                    {isPostOwner && (
                      <button
                        className="btn btn-danger btn-sm ms-2"
                        onClick={confirmDeletePost}
                      >
                        Eliminar Post
                      </button>
                    )}
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
                {commentsLoading ? (
                  <div className="container mt-5">
                    <div className="text-center my-5">
                      <div className="spinner-border text-primary" />
                      <p className="mt-2 text-muted">
                        A carregar comentários...
                      </p>
                    </div>
                  </div>
                ) : comments.length > 0 ? (
                  <div
                    className="comment-thread position-relative"
                    ref={threadRef}
                  >
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
        </div>
      </main>
    </div>
  );
}
