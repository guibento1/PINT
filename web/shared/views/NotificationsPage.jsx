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
      const response = await api.get(
        `/notificacao/list/subscricoes/${user.id}`
      );
      setNotifications(response.data);
    } catch (error) {
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
        Nenhuma notificação recebida.
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row g-3 justify-content-center">
        {notifications.map((notif, idx) => (
          <div className="col-12 col-md-8" key={notif.idnotificacao || idx}>
            <div className="card shadow border-radius p-3">
              <div className="d-flex align-items-center gap-3">
                <i
                  className="ri-notification-3-line text-primary"
                  style={{ fontSize: "2rem" }}
                ></i>
                <div>
                  <h5 className="mb-1">{notif.titulo || "Notificação"}</h5>
                  <p className="mb-1">{notif.mensagem}</p>
                  <small className="text-muted">
                    {new Date(notif.data).toLocaleString("pt-PT")}
                  </small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
