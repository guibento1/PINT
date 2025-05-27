import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import NavbarFront from "./components/NavbarFront.jsx";
import LoginPage from './views/LoginPage.jsx';
import Index from './views/index.jsx';

function Layout({ children }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <>
      {!isLoginPage && <NavbarFront />}
      <div className="container py-4">
        {children}
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<Index />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
