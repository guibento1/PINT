import React, { createContext, useEffect, useMemo, useState } from "react";
import api from "@shared/services/axios";
import { fetchTopicosCached } from "@shared/services/dataCache";

const SidebarContext = createContext();

const SidebarProvider = ({ children }) => {
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedTopico, setSelectedTopico] = useState("");
  const [topicSearch, setTopicSearch] = useState("");

  // Subscriptions
  // Array of { idtopico, designacao, courseLinked?: boolean }
  const [subscribedTopics, setSubscribedTopics] = useState([]);

  const user = useMemo(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("user") || localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  }, []);

  const upsertSubscribed = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setSubscribedTopics((prev) => {
      const map = new Map(prev.map((t) => [String(t.idtopico), t]));
      for (const it of items) {
        const key = String(it.idtopico);
        const existing = map.get(key);
        map.set(key, { ...(existing || {}), ...it });
      }
      return Array.from(map.values());
    });
  };

  const removeSubscribed = (id) => {
    setSubscribedTopics((prev) =>
      prev.filter((t) => String(t.idtopico) !== String(id))
    );
  };

  const loadSubscribedTopics = async () => {
    try {
      // Try API first (shape may be either ids or topic objects)
      const res = await api.get("/topico/subscricoes");
      const data = res.data || [];
      if (data.length === 0) return;
      let normalized = [];
      if (typeof data[0] === "number" || typeof data[0] === "string") {
        // ids -> resolve names using cached topics
        const all = await fetchTopicosCached();
        const mapById = new Map(all.map((t) => [String(t.idtopico), t]));
        normalized = data
          .map((id) => {
            const ref = mapById.get(String(id));
            return ref
              ? { idtopico: ref.idtopico, designacao: ref.designacao }
              : null;
          })
          .filter(Boolean);
      } else {
        normalized = data.map((t) => ({
          idtopico: parseInt(t.idtopico),
          designacao: t.designacao,
        }));
      }
      upsertSubscribed(normalized);
    } catch (e) {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem("subscribedTopics");
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) upsertSubscribed(arr);
        }
      } catch {}
    }
  };

  // Auto-subscribe topics from enrolled courses (best-effort)
  const autoSubscribeFromCourses = async () => {
    try {
      if (!user?.id) return;
      const coursesRes = await api.get(
        `/curso/inscricoes/utilizador/${user.id}`
      );
      const courses = coursesRes.data || [];
      if (courses.length === 0) return;

      const allTopicos = await fetchTopicosCached();
      const byId = new Map(allTopicos.map((t) => [String(t.idtopico), t]));

      const toMark = new Map();
      for (const curso of courses) {
        const list = Array.isArray(curso.topicos) ? curso.topicos : [];
        if (list.length > 0) {
          list.forEach((t) => {
            const id = parseInt(t.idtopico ?? t.id ?? t);
            if (!Number.isFinite(id)) return;
            const ref = byId.get(String(id));
            const designacao = ref?.designacao ?? t.designacao;
            toMark.set(String(id), {
              idtopico: id,
              designacao,
              courseLinked: true,
            });
          });
          continue;
        }
        // Fallback: fetch course details to get topicos
        try {
          const det = await api.get(`/curso/${curso.idcurso || curso.id}`);
          const dataCurso = det.data?.[0] || det.data || {};
          (dataCurso.topicos || []).forEach((t) => {
            const id = parseInt(t.idtopico ?? t.id ?? t);
            if (!Number.isFinite(id)) return;
            const ref = byId.get(String(id));
            const designacao = ref?.designacao ?? t.designacao;
            toMark.set(String(id), {
              idtopico: id,
              designacao,
              courseLinked: true,
            });
          });
        } catch {}
      }
      if (toMark.size > 0) {
        const items = Array.from(toMark.values());
        upsertSubscribed(items);
        // Best-effort server-side subscribe; ignore failures
        await Promise.all(
          items.map((t) =>
            api.post(`/topico/id/${t.idtopico}/subscribe`).catch(() => {})
          )
        );
      }
    } catch {}
  };

  const toggleSubscribeTopic = async (topic) => {
    const id =
      typeof topic === "number" || typeof topic === "string"
        ? topic
        : topic?.idtopico;
    if (!id) return;
    const exists = subscribedTopics.find(
      (t) => String(t.idtopico) === String(id)
    );
    try {
      if (exists) {
        await api.delete(`/topico/id/${id}/unsubscribe`).catch(() => {});
        removeSubscribed(id);
      } else {
        await api.post(`/topico/id/${id}/subscribe`).catch(() => {});
        const ref =
          (Array.isArray(topicos) &&
            topicos.find((t) => String(t.idtopico) === String(id))) ||
          null;
        upsertSubscribed([
          {
            idtopico: parseInt(id),
            designacao:
              ref?.designacao ||
              (typeof topic === "object" ? topic.designacao : String(id)),
            courseLinked: false,
          },
        ]);
      }
      // Persist locally as fallback
      setSubscribedTopics((next) => {
        try {
          localStorage.setItem("subscribedTopics", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch {}
  };

  // Expose a manual refresh to update subscriptions on-demand (e.g., after course enroll/leave)
  const refreshSubscribedTopics = async () => {
    await loadSubscribedTopics();
    await autoSubscribeFromCourses();
  };

  useEffect(() => {
    // Initial load: subscriptions + auto-subscribe from enrolled courses
    (async () => {
      await loadSubscribedTopics();
      await autoSubscribeFromCourses();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SidebarContext.Provider
      value={{
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
        refreshSubscribedTopics,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export { SidebarContext, SidebarProvider };
