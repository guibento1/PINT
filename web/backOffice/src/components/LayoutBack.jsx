import { useLocation } from 'react-router-dom';
import NavbarBack from './NavbarBack';
import Footer from '@shared/components/Footer';

// Layout BackOffice
export default function LayoutBack({ children }) {
  const location = useLocation();

  // Página não autorizada
  const isUnauthorizedPage = location.pathname === '/nao-autorizado';

  return (
    <div className="app-container">
      {/* Navbar se não for página não autorizada */}
      {!isUnauthorizedPage && <NavbarBack />}

      <main>{children}</main>

      <Footer />
    </div>
  );
}

