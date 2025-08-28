// Lightweight client-side caching for common datasets
import api from "./axios.js";

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = {
  topicos: { data: null, ts: 0 },
  formadores: { data: null, ts: 0 },
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
  // dedupe by id
  const map = new Map();
  formadores.forEach((f) => {
    if (!map.has(f.id)) map.set(f.id, f);
  });
  const data = Array.from(map.values());
  cache.formadores = { data, ts: Date.now() };
  return data;
}
