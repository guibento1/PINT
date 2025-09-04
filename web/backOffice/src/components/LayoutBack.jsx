import { useLocation } from 'react-router-dom';
import NavbarBack from './NavbarBack';
import Footer from '@shared/components/Footer';

// Layout BackOffice
export default function LayoutBack({ children }) {
  const location = useLocation();

  const isUnauthorizedPage = location.pathname === '/nao-autorizado';

  return (
    <div className="app-container">

      {(!isUnauthorizedPage && !location.pathname.startsWith("/certificado")) && <NavbarBack />}

      <main>{children}</main>

      {location.pathname.startsWith("/certificado") ? null : <Footer />}
    </div>
  );
}

