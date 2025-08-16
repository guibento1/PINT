import React, { useEffect, useState } from "react";
import api from "../services/axios.js";
import "@shared/styles/global.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = React.useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const fetchNotifications = async () => {
    if (!user || !user.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Buscar canais do utilizador (pode retornar array de números OU objetos)
      const canaisResp = await api.get(
        `/notificacao/list/subscricoes/${user.id}`
      );
      const rawCanais = Array.isArray(canaisResp.data) ? canaisResp.data : [];

      // Normalizar para array de IDs
      const canalIds = rawCanais
        .map((c) => {
          if (typeof c === "number") return c;
          if (c && typeof c === "object") return c.idcanal || c.canal || c.id; // fallback de chaves possíveis
          return null;
        })
        .filter(Boolean);

      // Evitar pedidos duplicados
      const uniqueCanalIds = [...new Set(canalIds)];

      let todasNotificacoes = [];
      // 2. Buscar notificações de cada canal
      for (const canalId of uniqueCanalIds) {
        try {
          const notifsResp = await api.get(`/notificacao/list/${canalId}`);
          if (Array.isArray(notifsResp.data)) {
            todasNotificacoes = todasNotificacoes.concat(
              notifsResp.data.map((n) => ({ ...n, canal: n.canal || canalId }))
            );
          }
        } catch (e) {
          // Ignorar falha de canal individual mas registar
          console.warn(`Falha ao carregar notificações do canal ${canalId}`, e);
        }
      }

      // 3. Normalizar campos (backend pode enviar conteudo vs mensagem, data vs createdAt)
      const normalizadas = todasNotificacoes.map((n) => ({
        ...n,
        mensagem: n.mensagem || n.conteudo || n.body || "",
        data: n.data || n.createdAt || n.updatedAt || null,
      }));

      // 4. Filtrar sem data (colocar ao fim) e ordenar
      normalizadas.sort((a, b) => {
        const da = a.data ? new Date(a.data).getTime() : 0;
        const db = b.data ? new Date(b.data).getTime() : 0;
        return db - da; // descendente
      });

      setNotifications(normalizadas);
    } catch (error) {
      console.error(error);
      setError("Não foi possível carregar as notificações.");
      setNotifications(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleNovaNotificacao = () => {
      fetchNotifications();
    };
    window.addEventListener("novaNotificacao", handleNovaNotificacao);
    return () => {
      window.removeEventListener("novaNotificacao", handleNovaNotificacao);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        A carregar notificações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5 text-center text-danger">{error}</div>
    );
  }

  if (Array.isArray(notifications) && notifications.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <i
          className="ri-notifications-off-line text-secondary"
          style={{ fontSize: "3rem" }}
        ></i>
        <div className="mt-3" style={{ fontSize: "1.2rem", color: "#888" }}>
          Ainda não tem notificações
        </div>
      </div>
    );
  }

  // Separar notificações em 'Hoje' e 'Anteriores'
  const today = new Date();
  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };
  const notificationsToday = notifications.filter(
    (n) => n.data && isToday(n.data)
  );
  const notificationsOlder = notifications.filter(
    (n) => !n.data || !isToday(n.data)
  );

  // Função para formatar data/hora
  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("pt-PT");
    const time = d.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} às ${time}`;
  };

  const SectionTitle = ({ title }) => (
    <div
      className="mb-3"
      style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#1D1B20" }}
    >
      {title}
    </div>
  );

  const NotificationCard = ({ notif }) => (
    <div
      className="card mb-3 shadow-sm border-0"
      style={{ borderRadius: "16px", background: "#ECECEC" }}
    >
      <div className="d-flex align-items-start p-3 gap-3">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            background: "#e3f2fd",
            borderRadius: "12px",
            padding: "12px",
          }}
        >
          <i
            className="ri-notification-3-line text-primary"
            style={{ fontSize: "2rem" }}
          ></i>
        </div>
        <div className="flex-grow-1">
          <div
            style={{
              fontSize: "1.08rem",
              fontWeight: "bold",
              color: "#1D1B20",
              fontFamily: "ADLaM Display, sans-serif",
            }}
          >
            {notif.titulo || "Notificação"}
          </div>
          <div
            style={{
              fontSize: "0.98rem",
              color: "#49454F",
              marginTop: "4px",
              fontFamily: "Roboto, sans-serif",
            }}
          >
            {notif.mensagem || notif.conteudo || "—"}
          </div>
          <div
            className="text-end mt-2"
            style={{ fontSize: "0.85rem", color: "#888" }}
          >
            {formatDateTime(notif.data)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="container py-5"
      style={{ background: "#F6F9FB", minHeight: "70vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-12 col-md-8">
          {notificationsToday.length > 0 && <SectionTitle title="Hoje" />}
          {notificationsToday.map((notif, idx) => (
            <NotificationCard
              notif={notif}
              key={notif.idnotificacao || `today-${idx}`}
            />
          ))}
          {notificationsOlder.length > 0 && (
            <div style={{ height: "24px" }}></div>
          )}
          {notificationsOlder.length > 0 && <SectionTitle title="Anteriores" />}
          {notificationsOlder.map((notif, idx) => (
            <NotificationCard
              notif={notif}
              key={notif.idnotificacao || `old-${idx}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
