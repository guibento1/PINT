// web/frontend/frontOffice/src/views/LoginPage.jsx

import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/Modal';
import logoSoftinsa from '../../../shared/assets/images/softinsaLogo.svg';
import logoSoftSkills from '../../../shared/assets/images/thesoftskillsLogo.svg';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(-1); // 0 - success; 1 - credentials mismatch; 2 - fields missing; 3 - error 
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();


  useEffect(() => {
    sessionStorage.getItem('user') && navigate('/home');
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
            <p>As credenciais fornecidas não pertencem a nenhum utilizador existente.</p>
            <p>Confirme as credenciais ou crie uma nova conta.</p>
          </>
        );

      case 2:
        return <p>Palavra-passe ou email em falta.</p>;

      default:
        return (
          <>
            <p>Ocorreu um erro da nossa parte.</p>
            <p>Tente mais tarde, se o erro persistir, contacte o nosso suporte.</p>
          </>
        );
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    window.location.href = 'http://localhost:3001/home';
  };

  // Componet functions

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setLoginStatus(2);
      handleOpenModal();
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/utilizador/login`,
        { email,password },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const data = response.data;

      if (!data.accessToken) {

        setLoginStatus(1);
        handleOpenModal();
        throw new Error("Token de acesso não retornado");
      }

      const token = data.accessToken;

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify({
        id: data.idutilizador,
        email: data.email,
        nome: data.nome,
        roles: data.roles,
      }));

      setLoginStatus(0);
      handleOpenModal();

      // const role = data.roles[0]?.role || data.roles[0];
      // if (role === 'admin') {
      //   window.location.href = `http://localhost:3001/?token=${token}&user=${encodeURIComponent(JSON.stringify({
      //       id: data.idutilizador,
      //       email: data.email,
      //       nome: data.nome,
      //       roles: data.roles,
      //     }))}`;
      //     
      //     window.dispatchEvent(new Event('userUpdated'));
      //
      // } else {
      //   window.location.href = 'http://localhost:3001/home';
      // }

    } catch (error) {
      setLoginStatus(0);
      handleOpenModal();
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

    <div className="d-flex flex-column min-vh-100 bg-white">

      <main className="flex-grow-1 d-flex align-items-center justify-content-center">



        <div className="text-center" style={{ width: '100%', maxWidth: '400px' }}>
          <img src={logoSoftinsa} alt="Softinsa" className="mb-3" style={{ maxWidth: '200px' }} />
          <div className="mb-3">
            <img src={logoSoftSkills} alt="The Softskills" className="mb-3" style={{ maxWidth: '200px' }} />
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
            </div>
            <div className="d-flex gap-2 justify-content-between">
              <button type="submit" className="btn-soft w-50 fw-bold">
                Login
              </button>
              <a href="/registar" className="btn-outline-soft w-50 text-center">
                Registar-se
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>

    </>

  );
}
