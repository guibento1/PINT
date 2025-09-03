import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "@shared/components/Modal";
import "@shared/styles/global.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ nome: "", email: "" });
  const [registerStatus, setRegisterStatus] = useState(-1); // 0 - success; 1 - fields missing; 2 - error
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal 
  const getModalTitle = () => {
    switch (registerStatus) {
      case 0:
        return "Confirme o seu email";
      case 1:
        return "Campos em falta";
      default:
        return "Erro";
    }
  };

  const getModalBody = () => {
    switch (registerStatus) {
      case 0:
        return (
          <>
            <p>Bem-vindo/a à thesoftskills, a tua jornada começa aqui !</p>
            <p>Enviamos-lhe um email para establecer uma password.</p>
          </>
        );

      case 1:
        return <p>Nome ou email em falta.</p>;

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
    !registerStatus && navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    sessionStorage.getItem("user") && navigate("/login");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nome, email } = formData;

    if (!nome || !email) {
      setRegisterStatus(1);
      handleOpenModal();
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        import.meta.env.VITE_API_URL + `/utilizador/register`,
        { nome, email },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      setRegisterStatus(0);
      handleOpenModal();
      setSubmitting(false);
    } catch (error) {
      setRegisterStatus(2);
      handleOpenModal();
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
            <h2 className="mb-3">Criar Conta</h2>
            <p className="subtitle mb-4">Comece a sua jornada connosco</p>
            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control rounded-pill"
                  id="nome"
                  placeholder="O seu nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
                <label htmlFor="nome">Nome</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control rounded-pill"
                  id="email"
                  placeholder="name@example.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="auth-actions justify-content-between">
                <button
                  type="submit"
                  className="btn-soft fw-bold w-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className="spinner-border spinner-border-sm text-white"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      A registar...
                    </span>
                  ) : (
                    "Registar"
                  )}
                </button>
              </div>

              <p className="text-muted mt-3 small">
                Já tem conta?{" "}
                <a href="/login" className="text-decoration-none">
                  Entrar
                </a>
              </p>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
