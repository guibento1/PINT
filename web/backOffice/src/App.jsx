//web\frontend\backOffice\src\App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LayoutBack from './components/LayoutBack';
import ProtectedRoute from '@shared/components/ProtectedRoute';
import LoginPage from '@shared/views/LoginPage.jsx';
import Perfil from '@shared/views/Profile.jsx';


import NaoAutorizado from "./views/NaoAutorizado";
import Home from './views/Home';
import GerirEstrutura from './views/GerirEstrutura';
import Cursos from './views/Cursos';
import DetalhesCurso from './views/DetalhesCurso';
import Utilizadores from './views/Utilizadores';
import EditarUtilizador from './views/editar/EditarUtilizador.jsx';
import CriarEstrutura from './views/criar/CriarEstrutura';
import CriarCurso from './views/criar/CriarCurso';
import EditarArea from './views/editar/EditarArea'
import EditarCategoria from './views/editar/EditarCategoria'
import EditarTopico from './views/editar/EditarTopico'
import EditarCurso from './views/editar/EditarCurso'


function App() {
  return (
    <Router>
      <LayoutBack>
      <Routes>

        <Route path="/" element={<LoginPage admin={true} />} />
        <Route path="/nao-autorizado" element={<NaoAutorizado />} />
        <Route path="/home" element={<ProtectedRoute allowedRoles={['admin']}><Home /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute allowedRoles={['admin']}><Perfil /></ProtectedRoute>} />
        <Route path="/gerir-estrutura" element={<ProtectedRoute allowedRoles={['admin']}><GerirEstrutura /></ProtectedRoute>} />
        <Route path="/criar/estrutura" element={<ProtectedRoute allowedRoles={['admin']}><CriarEstrutura /></ProtectedRoute>} />
        <Route path="/criar/curso" element={<ProtectedRoute allowedRoles={['admin']}><CriarCurso /></ProtectedRoute>} />

        <Route path="/editar/categoria/:id" element={<ProtectedRoute allowedRoles={['admin']}><EditarCategoria /></ProtectedRoute>} />
        <Route path="/editar/area/:id" element={<ProtectedRoute allowedRoles={['admin']}><EditarArea /></ProtectedRoute>} />
        <Route path="/editar/topico/:id" element={<ProtectedRoute allowedRoles={['admin']}><EditarTopico /></ProtectedRoute>} />
        <Route path="/editar/curso/:id" element={<ProtectedRoute allowedRoles={['admin']}><EditarCurso /></ProtectedRoute>} />
        <Route path="/cursos" element={<ProtectedRoute allowedRoles={['admin']}><Cursos /></ProtectedRoute>} />

        <Route path="/curso/:id" element={<ProtectedRoute allowedRoles={['admin']}><DetalhesCurso /></ProtectedRoute>} />

        <Route path="/utilizadores" element={<ProtectedRoute allowedRoles={['admin']}><Utilizadores /></ProtectedRoute>} />

        <Route path="/editar/utilizador/:id" element={<ProtectedRoute allowedRoles={['admin']}><EditarUtilizador /></ProtectedRoute>} />

      </Routes>
  </LayoutBack>
    </Router>
  );
}

export default App;
