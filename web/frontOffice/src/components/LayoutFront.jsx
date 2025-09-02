import { useLocation } from "react-router-dom";
import NavbarFront from "./NavbarFront";
import Footer from "../../../shared/components/Footer";

export default function LayoutFront({ children }) {
  // Localização atual da rota
  const location = useLocation();

  // Estrutura do layout principal
  return (
    <div className="app-container">
      {location.pathname.startsWith("/certificado") ? null : <NavbarFront />}
      <main>{children}</main>
      {["/", "/home"].includes(location.pathname) && <Footer />}
    </div>
  );
}
