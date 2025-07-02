// web\frontend\frontOffice\src\App.jsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LayoutFront from './components/LayoutFront';

import Index from './views/Index';
import RegisterPage from './views/RegisterPage';
import LoginPage from './views/LoginPage';
import ResetPassword from './views/ResetPassword';
import Cursos from './views/Cursos';
import Topicos from './views/Topicos';
import Notificacoes from './views/Notificacoes';
import Perfil from './views/Perfil';
import Home from './views/Home';
import NaoAutorizado from './views/NaoAutorizado';
import ProtectedRoute from '../../shared/components/ProtectedRoute';
import GerirCursos from './views/GerirCursos';

function App() {
  return (
  <Router>
      <LayoutFront>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registar" element={<RegisterPage />} />
          <Route path="/resetpassword" element={<ResetPassword/>} />

          <Route path="/home" element={<ProtectedRoute allowedRoles={['formando', 'formador']}><Home /></ProtectedRoute>} />
          <Route path="/cursos" element={<ProtectedRoute allowedRoles={['formando', 'formador']}><Cursos /></ProtectedRoute>} />
          <Route path="/topicos" element={<ProtectedRoute allowedRoles={['formando', 'formador']}><Topicos /></ProtectedRoute>} />
          <Route path="/notificacoes" element={<ProtectedRoute allowedRoles={['formando', 'formador']}><Notificacoes /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute allowedRoles={['formando', 'formador']}><Perfil /></ProtectedRoute>} />
          <Route path="/gerircursos" element={<ProtectedRoute allowedRoles={['formador']}><GerirCursos /></ProtectedRoute>} />
          {/* ROTA DE ERRO */}
          <Route path="/nao-autorizado" element={<NaoAutorizado />} />
        </Routes>
    </LayoutFront>
    </Router>
  );
}

export default App;
