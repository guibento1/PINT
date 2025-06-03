//web\frontend\backOffice\src\components\LayoutBack.jsx
import NavbarBack from './NavbarBack';
import Footer from '../../../shared/components/Footer';

export default function LayoutBack({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <NavbarBack />
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
}
