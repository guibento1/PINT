//web\frontend\frontOffice\src\components\LayoutFront.jsx
import { useLocation } from 'react-router-dom';
import NavbarFront from './NavbarFront';
import Footer from '../../../shared/components/Footer';

export default function LayoutFront({ children }) {
  const location = useLocation();
  const isLogin = location.pathname === '/';

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isLogin && <NavbarFront />}
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
}
