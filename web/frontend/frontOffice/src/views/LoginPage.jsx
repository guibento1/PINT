import React, { useState } from 'react';
import Footer from '../../../shared/components/Footer';
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
      const response = await axios.post('http://localhost:3000/utilizador/login?email=' + email, 
        { password }
      );

      alert ('Login efetuado com sucesso!');
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.idutilizador,
        email: response.data.email,
        nome: response.data.nome,
        roles: response.data.roles
      }));
      
      const role = response.data.roles[0].role;

      if (role === 'formando') {
        navigate('/home');
      } else if (role === 'formador') {
        navigate('/home');
      } else if (role === 'admin') {
        navigate('/backoffice/HomeBack');
      }
    } catch (error) {
      console.error('Login error:', error);
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
              <a href="/register" className="btn-outline-soft w-50 text-center">
                Registar-se
              </a>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
