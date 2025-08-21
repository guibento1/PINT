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
      const response = await api.get(`/notificacao/list`);
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
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
            {formatDateTime(notif.instante)}
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
