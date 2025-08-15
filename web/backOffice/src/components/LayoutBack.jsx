// web/frontend/backOffice/src/components/LayoutBack.jsx
import { useLocation } from 'react-router-dom';
import NavbarBack from './NavbarBack';
import Footer from '@shared/components/Footer';

export default function LayoutBack({ children }) {
  const location = useLocation();
  const isUnauthorizedPage = location.pathname === '/nao-autorizado';

  return (
    <div className="app-container">
      {!isUnauthorizedPage && <NavbarBack />}
      <main>{children}</main>
      <Footer />
    </div>
  );
}
