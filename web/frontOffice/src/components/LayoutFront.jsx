//web\frontend\frontOffice\src\components\LayoutFront.jsx
import { useLocation } from "react-router-dom";
import NavbarFront from "./NavbarFront";
import Footer from "../../../shared/components/Footer";

export default function LayoutFront({ children }) {
  const location = useLocation();

  return (
    <div className="app-container">
      {location.pathname.startsWith("/certificado") ? null : <NavbarFront />}
      <main>{children}</main>
      {["/", "/home"].includes(location.pathname) && <Footer />}
    </div>
  );
}
