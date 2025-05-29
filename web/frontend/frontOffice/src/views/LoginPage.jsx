import React, { useState } from 'react';
import Footer from '../../../shared/Footer';
import logoSoftinsa from '../../../shared/assets/images/logo_softinsa.png';
import logoSoftSkills from '../../../shared/assets/images/logo_softskills.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", { email, password });
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-white">
      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="text-center" style={{ width: '100%', maxWidth: '400px' }}>
          <img src={logoSoftinsa} alt="Softinsa" className="mb-3" style={{ maxWidth: '200px' }} />

          <div className="mb-3">
            <div className="mb-3">
            <img src={logoSoftSkills} alt="The Softskills" className="mb-3" style={{ maxWidth: '200px' }} />
          </div>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              className="form-control mb-3 rounded-pill"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="form-control mb-3 rounded-pill"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="d-flex gap-2 justify-content-between">
            <button type="submit" className="btn-soft w-50 fw-bold">
              Login
            </button>
            <a href="#" className="btn-outline-soft w-50 text-center">
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
