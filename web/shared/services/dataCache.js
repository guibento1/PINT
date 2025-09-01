import api from "./axios.js";

const TTL_MS = 5 * 60 * 1000;
const cache = {
  topicos: { data: null, ts: 0 },
  formadores: { data: null, ts: 0 },
  commentsByPost: {}, // { [postId]: { data: commentsTree, ts } }
};

const isFresh = (ts) => Date.now() - ts < TTL_MS;

export async function fetchTopicosCached() {
  if (cache.topicos.data && isFresh(cache.topicos.ts))
    return cache.topicos.data;
  const res = await api.get("/topico/list");
  const data = (res.data || []).map((t) => ({
    ...t,
    idtopico: parseInt(t.idtopico),
  }));
  cache.topicos = { data, ts: Date.now() };
  return data;
}

export async function fetchFormadoresCached() {
  if (cache.formadores.data && isFresh(cache.formadores.ts))
    return cache.formadores.data;
  const res = await api.get("/utilizador/list");
  const formadores = (res.data || [])
    .map((u) =>
      (u.roles || [])
        .filter((r) => r.role === "formador")
        .map((r) => ({ id: r.id, nome: u.nome }))
    )
    .flat();

  const map = new Map();
  formadores.forEach((f) => {
    if (!map.has(f.id)) map.set(f.id, f);
  });
  const data = Array.from(map.values());
  cache.formadores = { data, ts: Date.now() };
  return data;
}

// Helpers for forum comments caching
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

export async function fetchPostCommentsTreeCached(postId) {
  const key = String(postId);
  const entry = cache.commentsByPost[key];
  if (entry && entry.data && isFresh(entry.ts)) {
    return entry.data;
  }
  const res = await api.get(`/forum/post/${postId}/comment`);
  const rootComments = res.data?.comments || res.data?.data || res.data || [];
  const tree = await Promise.all(rootComments.map(fetchRepliesRecursively));
  cache.commentsByPost[key] = { data: tree, ts: Date.now() };
  return tree;
}

export function invalidatePostCommentsCache(postId) {
  const key = String(postId);
  if (cache.commentsByPost[key]) delete cache.commentsByPost[key];
}
