import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    const { nome, email } = formData;

    if (!nome || !email ) {
      alert('Preencha todos os campos.');
      return;
    }

    // Monta info como string JSON
    const info = JSON.stringify({
      nome,
      email,
      password,
      morada,
      roles: [role]
    });

    // Monta o FormData
    const payload = new FormData();
    payload.append('info', info);
    // opcional: payload.append('foto', file); ← aqui vai vazio por agora

    try {
      await axios.post('http://localhost:3000/utilizador', payload);

      alert('Conta criada com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro no registo:', error);
      alert('Erro ao criar conta. Tente outro email.');
    }
  };


  return (
    <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <h2 className="mb-4">Criar Conta</h2>
      <form onSubmit={handleSubmit} className="w-100" style={{ maxWidth: '400px' }}>
        <div className="mb-3">
          <label className="form-label">Nome</label>
          <input type="text" className="form-control" name="nome" value={formData.nome} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Morada</label>
          <input type="text" className="form-control" name="morada" value={formData.morada} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Função</label>
          <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
            <option value="formando">Formando</option>
            <option value="formador">Formador</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-100">Registar</button>
      </form>
    </div>
  );
}
