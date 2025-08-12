import React, { useEffect, useState } from "react";
import api from "../services/axios.js";

const NotificationsPage = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/notificacoes/utilizador/${user.id}`)
      .then((res) => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Erro ao carregar notificações.");
        setLoading(false);
      });
  }, [user]);

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

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Notificações Recebidas</h2>
      {notifications.length === 0 ? (
        <div className="alert alert-info text-center">
          Nenhuma notificação recebida.
        </div>
      ) : (
        <div className="row g-3 justify-content-center">
          {notifications.map((notif) => (
            <div className="col-12 col-md-8" key={notif.idnotificacao}>
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
      )}
    </div>
  );
}

export default NotificationsPage;
