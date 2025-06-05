//web\frontend\backOffice\src\App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LayoutBack from './components/LayoutBack';
import ProtectedRoute from '../../shared/components/ProtectedRoute';

import NaoAutorizado from "./views/NaoAutorizado";
import HomeBack from './views/HomeBack';
import Cursos from './views/Cursos';
import PesquisarCursos from './views/PesquisarCursos';
import Usuarios from './views/Usuarios';
import Topicos from './views/Topicos';
import Notificacoes from './views/Notificacoes';
import Perfil from './views/Perfil';
import GerirEstrutura from './views/GerirEstrutura';


function App() {
  return (
    <Router>
      <LayoutBack>
      <Routes>
        <Route path="/" element={<ProtectedRoute allowedRoles={['admin']}><HomeBack /></ProtectedRoute>} />
        <Route path="/cursos" element={<ProtectedRoute allowedRoles={['admin']}><Cursos /></ProtectedRoute>} />
        <Route path="/gerir-estrutura" element={<ProtectedRoute allowedRoles={['admin']}><GerirEstrutura /></ProtectedRoute>} />
        <Route path="/pesquisar" element={<ProtectedRoute allowedRoles={['admin']}><PesquisarCursos /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><Usuarios /></ProtectedRoute>} />
        <Route path="/topicos" element={<ProtectedRoute allowedRoles={['admin']}><Topicos /></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute allowedRoles={['admin']}><Notificacoes /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute allowedRoles={['admin']}><Perfil /></ProtectedRoute>} />

        {/* ROTA DE ERRO */}
        <Route path="/nao-autorizado" element={<NaoAutorizado />} />
      </Routes>
  </LayoutBack>
    </Router>
  );
}

export default App;
