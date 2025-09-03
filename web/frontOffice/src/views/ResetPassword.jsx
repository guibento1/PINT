import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import Modal from "@shared/components/Modal";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromQuery = searchParams.get("token");
  if (tokenFromQuery) {
    // Guardar também em sessionStorage para caso a query seja perdida (refresh, navegação interna, etc.)
    sessionStorage.setItem("reset_password_token", tokenFromQuery);
  }
  const token =
    tokenFromQuery || sessionStorage.getItem("reset_password_token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetPasswordStatus, setResetPasswordStatus] = useState(-1); // 0 - success; 1 - fields missing; 2 - password mismatch; 3 - no token; 4 - erro

  const getModalTitle = () => {
    switch (resetPasswordStatus) {
      case 0:
        return "Password establecida com sucesso";
      case 1:
        return "Campos em falta";
      case 2:
        return "Passwords não coincidem";
      case 3:
        return "URL invalido";
      default:
        return "Erro";
    }
  };

  const getModalBody = () => {
    switch (resetPasswordStatus) {
      case 0:
        return (
          <>
            <p>Vai ser agora direcionado para a página de login.</p>
          </>
        );

      case 1:
        return <p>É necessário introduzir e confirmar a password.</p>;

      case 2:
        return (
          <p>
            A password original e introduzida no campo de confirmação não
            coicidem.
          </p>
        );

      case 3:
        return (
          <>
            <p>
              O url para reset da passord contem argumentos especificos para
              confirmação da sua identidade.
            </p>
            <p>Verifique se abrio ou copiou o link correto.</p>
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
    !resetPasswordStatus && navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setResetPasswordStatus(1);
      handleOpenModal();
      return;
    }

    if (password !== confirmPassword) {
      setResetPasswordStatus(2);
      handleOpenModal();
      return;
    }

    if (!token) {
      setResetPasswordStatus(3);
      handleOpenModal();
      return;
    }

    setLoading(true);

    try {
      const data = await axios.post(
        import.meta.env.VITE_API_URL + "/utilizador/resetpassword",
        { password },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data) {
        throw new Error("Erro ao redefinir a password.");
      }

      setResetPasswordStatus(0);
      handleOpenModal();

      setPassword("");
      setConfirmPassword("");
      // Limpar token de reset após sucesso
      sessionStorage.removeItem("reset_password_token");
    } catch (err) {
      console.log(err);
      setResetPasswordStatus(4);
      handleOpenModal();
    } finally {
      setLoading(false);
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

      <div className="container my-5" style={{ maxWidth: "480px" }}>
        <h2 className="mb-4">Redefinir Password</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Nova Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Digite a nova password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Password
            </label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              placeholder="Confirme a nova password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "A processar..." : "Redefinir Password"}
          </button>
        </form>
      </div>
    </>
  );
}
