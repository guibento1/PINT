import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/LayoutFront';

import LoginPage from './views/LoginPage';
import Cursos from './views/Cursos';
import Topicos from './views/Topicos';
import Notificacoes from './views/Notificacoes';
import Perfil from './views/Perfil';
import Home from './views/Home'; 

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<Home />} />
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
