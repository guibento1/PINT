import Footer from '@shared/components/Footer';

export default function NaoAutorizado() {
  return (
    <div className="d-flex flex-column min-vh-100 text-center">
      <main className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <h1 className="text-danger">403 - Acesso não autorizado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => window.location.href = 'http://localhost:3002/'} // login no frontOffice
        >
          Faça Login para ter acesso.
        </button> 
      </main>
    </div>
  );
}
