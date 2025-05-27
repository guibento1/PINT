import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Enviar login:", { email, password });
    // Aqui futuramente: chamada à API com axios
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <h4 className="text-primary fw-bold">SoftSkills</h4>
          <small className="text-muted">Login na Plataforma</small>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary">Entrar</button>
          </div>
        </form>

        <div className="mt-3 text-center">
          <small className="text-muted">© Softinsa 2025</small>
        </div>
      </div>
    </div>
  );
}
