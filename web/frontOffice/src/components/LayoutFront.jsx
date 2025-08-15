//web\frontend\frontOffice\src\components\LayoutFront.jsx
import { useLocation } from 'react-router-dom';
import NavbarFront from './NavbarFront';
import Footer from '../../../shared/components/Footer';

export default function LayoutFront({ children }) {

  return (
    <div className="app-container">
      <NavbarFront />
        <main>{children}</main>
      <Footer />
    </div>
  );
}
