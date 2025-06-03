//web\frontend\backOffice\src\App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LayoutBack from './components/LayoutBack';

import HomeBack from './views/HomeBack';
import Cursos from './views/Cursos';
import PesquisarCursos from './views/PesquisarCursos';
import Usuarios from './views/Usuarios';
import Topicos from './views/Topicos';
import Notificacoes from './views/Notificacoes';
import Perfil from './views/Perfil';

function App() {
  return (
    <Router>
      <LayoutBack>
        <Routes>
          <Route path="/" element={<HomeBack />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/pesquisar" element={<PesquisarCursos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/topicos" element={<Topicos />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </LayoutBack>
    </Router>
  );
}

export default App;
