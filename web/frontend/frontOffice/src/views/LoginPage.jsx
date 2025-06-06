// web/frontend/frontOffice/src/views/LoginPage.jsx

import React, { useState } from 'react';
import logoSoftinsa from '../../../shared/assets/images/logo_softinsa.png';
import logoSoftSkills from '../../../shared/assets/images/logo_softskills.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/utilizador/login?email=${email}`,
        { password },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const data = response.data;

      if (!data.accessToken) {
        throw new Error("Token de acesso não retornado");
      }

      const token = data.accessToken;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: data.idutilizador,
        email: data.email,
        nome: data.nome,
        roles: data.roles,
      }));

      alert('Login efetuado com sucesso!');

      const role = data.roles[0]?.role || data.roles[0];
      if (role === 'admin') {
        window.location.href = `http://localhost:3001/?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: data.idutilizador,
            email: data.email,
            nome: data.nome,
            roles: data.roles,
          }))}`;
          
          // 🔁 Notifica o hook sobre "role" do user logado 
          window.dispatchEvent(new Event('userUpdated'));

      } else {
        // Tanto formador quanto formando vão para o frontOffice
        window.location.href = 'http://localhost:3002/home';
      }

    } catch (error) {
      console.error('Erro ao fazer login:', error.response?.data || error.message);
      alert('Erro ao fazer login. Por favor, verifique suas credenciais.');
    }

  };

  return (
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
                className="form-control mb-3 rounded-pill"
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
  );
}
