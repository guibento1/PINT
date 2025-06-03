//web\frontend\frontOffice\src\components\LayoutFront.jsx
import { useLocation } from 'react-router-dom';
import NavbarFront from './NavbarFront';
import Footer from '../../../shared/components/Footer';

export default function LayoutFront({ children }) {
  const location = useLocation();
  const isLoginOrRegister = location.pathname === '/' || location.pathname === '/registar';

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isLoginOrRegister && <NavbarFront />}
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
}
