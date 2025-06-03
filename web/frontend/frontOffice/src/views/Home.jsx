export default function Home() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="container py-5">
      <h2 className="mb-4">Bem-vindo(a), {user?.nome || 'Utilizador'}</h2>
      <p>Este é o painel principal para o perfil <strong>{user?.role || 'formando'}</strong>.</p>
      {/* Aqui futuramente pode listar cursos, tópicos, notificações etc. */}
    </div>
  );
}
