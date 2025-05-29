import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import NavbarFront from './components/NavbarFront';

import Cursos from './views/Cursos';
import Topicos from './views/Topicos';
import Notificacoes from './views/Notificacoes';
import Perfil from './views/Perfil';
import LoginPage from './views/LoginPage';

function Layout({ children }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <>
      {!isLoginPage && <NavbarFront />}
        {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/topicos" element={<Topicos />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
