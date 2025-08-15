// web/frontend/frontOffice/src/views/LoginPage.jsx

import React, { useState, useEffect } from "react";
import Modal from "@shared/components/Modal.jsx";
import logoSoftinsa from "../assets/images/softinsaLogo.svg";
import logoSoftSkills from "../assets/images/thesoftskillsLogo.svg";
import "@shared/styles/global.css";
import { subscribeToTopics } from "@shared/services/firebase"
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage({ admin = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState(-1); // 0 - success; 1 - credentials mismatch; 2 - fields missing; 3 - error
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.getItem("user") && navigate("/home");
  }, []);

  // Modal functions

  const getModalTitle = () => {
    switch (loginStatus) {
      case 0:
        return "Sucesso";
      case 1:
        return "Credenciais erradas";
      case 2:
        return "Campos em falta";
      case 5:
        return "Utilizador não Admin";
      default:
        return "Erro";
    }
  };

  const getModalBody = () => {
    switch (loginStatus) {
      case 0:
        return <p>Bem-vindo/a de volta!</p>;

      case 1:
        return (
          <>
            <p>
              As credenciais fornecidas não pertencem a nenhum utilizador
              existente.
            </p>
            <p>Confirme as credenciais ou crie uma nova conta.</p>
          </>
        );

      case 2:
        return <p>Palavra-passe ou email em falta.</p>;

      case 5:
        return (
          <>
            <p>Tentativa de acesso registada em anomalias.</p>
            <p>
              Se por alugma razão devia ser admin e não o é, contacte a equipa
              de IT
            </p>
          </>
        );

      default:
        return (
          <>
            <p>Ocorreu um erro da nossa parte.</p>
            <p>
              Tente mais tarde, se o erro persistir, contacte o nosso suporte.
            </p>
          </>
        );
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (!loginStatus) navigate("/home");
  };

  // Component functions

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setLoginStatus(2);
      handleOpenModal();
      return;
    }

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + `/utilizador/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (
        admin &&
        !response.data.roles.find((roleEntry) => roleEntry.role == "admin")
      ) {
        setLoginStatus(5);
        handleOpenModal();
      } else {
        const data = response.data;

        if (!data.accessToken) {
          setLoginStatus(1);
          handleOpenModal();
        }

        const token = data.accessToken;

        sessionStorage.setItem("token", token);
        sessionStorage.setItem(
          "user",
          JSON.stringify({
            id: data.idutilizador,
            email: data.email,
            nome: data.nome,
            roles: data.roles,
          })
        );

        console.log("starting to subscribe to notifications . . .");

        await subscribeToTopics();

        setLoginStatus(0);
        handleOpenModal();
      }
    } catch (error) {
      console.log(error);

      if (error.response?.data?.error == "Password mismatch") {
        setLoginStatus(1);
        handleOpenModal();
      } else {
        setLoginStatus(3);
        handleOpenModal();
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={getModalTitle()}
      >
        {getModalBody()}
      </Modal>

      <div className="d-flex flex-column min-vh-100 bg-custom-grey">
        <main className="flex-grow-1 d-flex align-items-center justify-content-center ">
          <div
            className="text-center shadow p-3 mb-5 bg-body border-radius"
            style={{ width: "100%", maxWidth: "400px" }}
          >
            <img
              src={logoSoftinsa}
              alt="Softinsa"
              className="mb-3"
              style={{ maxWidth: "200px" }}
            />
            <div className="mb-3">
              <img
                src={logoSoftSkills}
                alt="The Softskills"
                className="mb-3"
                style={{ maxWidth: "200px" }}
              />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control rounded-pill"
                  id="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="email">Email</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control rounded-pill"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="password">Password</label>
              </div>
              <div className="d-flex gap-2 justify-content-between">
                <button
                  type="submit"
                  className={"btn-soft fw-bold " + (admin ? "w-100" : "w-50")}
                >
                  Login
                </button>

                {!admin && (
                  <a
                    href="/registar"
                    className="btn-outline-soft w-50 text-center"
                  >
                    Registar-se
                  </a>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
