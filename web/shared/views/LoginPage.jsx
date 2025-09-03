import React, { useState, useEffect } from "react";
import Modal from "@shared/components/Modal.jsx";
import logoSoftinsa from "../assets/images/softinsaLogo.svg";
import logoSoftSkills from "../assets/images/thesoftskillsLogo.svg";
import "@shared/styles/global.css";
import { subscribeToTopics } from "@shared/services/firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage({ admin = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState(-1); // 0 - success; 1 - credentials mismatch; 2 - fields missing; 3 - error
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      case 4:
        return "Utilizador não encontrado";
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

      case 4:
        return (
          <>
            <p>O email indicado não corresponde a nenhum utilizador.</p>
            <p>Confirme o email ou registe uma nova conta.</p>
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
    setSubmitting(true);

    if (!email || !password) {
      setLoginStatus(2);
      handleOpenModal();
      setSubmitting(false);
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
        setSubmitting(false);
      } else {
        const data = response.data;

        if (!data.accessToken) {
          setLoginStatus(1);
          handleOpenModal();
          setSubmitting(false);
          return;
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
        window.dispatchEvent(new Event("loginSucesso"));

        console.log("starting to subscribe to notifications . . .");

        await subscribeToTopics();

        setLoginStatus(0);
        navigate("/home");
      }
    } catch (error) {
      console.log(error);

      const status = error.response?.status;
      const rawMsg =
        error.response?.data?.error || error.response?.data?.message || "";
      const msg = String(rawMsg).toLowerCase();

      if (
        status === 404 ||
        msg.includes("utilizador não encontrado") ||
        msg.includes("utilizador nao encontrado") ||
        msg.includes("user not found") ||
        msg.includes("not found")
      ) {
        setLoginStatus(4); // Utilizador não encontrado
        handleOpenModal();
      } else if (
        status === 401 ||
        msg.includes("password incorreta") ||
        msg.includes("password mismatch") ||
        msg.includes("credenciais inválidas") ||
        msg.includes("credenciais invalidas") ||
        msg.includes("invalid credential")
      ) {
        setLoginStatus(1); // Credenciais erradas
        handleOpenModal();
      } else {
        setLoginStatus(3); // Erro genérico
        handleOpenModal();
      }
      setSubmitting(false);
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
          <div className="auth-card text-center">
            {/*Logo da Softskills*/}
            <div className="mb-2">
              <img
                src={logoSoftSkills}
                alt="The Softskills"
                className="mb-2"
                style={{ maxWidth: "240px" }}
              />
            </div>
            {/*Logo da Softinsa*/}
            <img
              src={logoSoftinsa}
              alt="Softinsa"
              className="mb-5"
              style={{ maxWidth: "100px" }}
            />
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
                  disabled={submitting}
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  autoFocus
                />
                <label htmlFor="email">Email:</label>
              </div>
              <div className="form-floating mb-3 position-relative has-toggle">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control rounded-pill"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                  name="password"
                  autoComplete="current-password"
                />
                <label htmlFor="password">Password:</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword ? "Ocultar password" : "Mostrar password"
                  }
                  tabIndex={-1}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <div className="auth-actions justify-content-between">
                <button
                  type="submit"
                  className={
                    "btn-soft fw-bold " +
                    (admin || submitting ? "w-100" : "w-50")
                  }
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className="spinner-border spinner-border-sm text-white"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      A entrar...
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>

                {!admin && !submitting && (
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
