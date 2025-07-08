// web/frontend/backOffice/src/components/LayoutBack.jsx
import { useLocation } from 'react-router-dom';
import NavbarBack from './NavbarBack';
import Footer from '@shared/components/Footer';

export default function LayoutBack({ children }) {
  const location = useLocation();
  const isUnauthorizedPage = location.pathname === '/nao-autorizado';

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isUnauthorizedPage && <NavbarBack />}
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
}
