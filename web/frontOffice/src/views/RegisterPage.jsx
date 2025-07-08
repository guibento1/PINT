import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Modal from '@shared/components/Modal';

export default function RegisterPage() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({nome: '',email: ''});
  const [registerStatus, setRegisterStatus] = useState(-1); // 0 - success; 1 - fields missing; 2 - error 
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal functions

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
    !registerStatus && navigate('/login');

  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Component functions

  useEffect(() => {
    sessionStorage.getItem('user') && navigate('/login');
  }, []);

  const handleSubmit = async (e) => {

    e.preventDefault();

    const { nome, email } = formData;

    if (!nome || !email ) {
      setRegisterStatus(1);
      handleOpenModal();
      return;
    }

    try {


      const response = await axios.post(
        import.meta.env.VITE_API_URL+`/utilizador/register`,
        { nome,email },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );


      setRegisterStatus(0);
      handleOpenModal();

    } catch (error) {
      setRegisterStatus(2);
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
          
          <button type="submit" className="btn btn-primary w-100">Registar</button>
        </form>
      </div>

    </>
  );
}
