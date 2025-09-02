import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logoSoftskills from "@shared/assets/images/thesoftskillsLogo.svg";
import logoSoftinsa from "@shared/assets/images/softinsaLogo.svg";
import "@shared/styles/certificado.css";

const Certificado = () => {
  const { chave } = useParams();
  const [certificado, setCertificado] = useState(null);
  const [ error, setError ] = useState(null);

  useEffect(() => {
    const fetchCertificado = async () => {
      try {
        const response = await axios.get(import.meta.env.VITE_API_URL + `/certificado/${chave}`);
        setCertificado(response.data);
      } catch (err) {
        setError("Erro ao carregar certificado.");
        console.error(err);
      }
    };

    if (chave) fetchCertificado();
  }, [chave]);

  const handlePrint = () => window.print();

  if (error) {
    return <div className="text-center mt-5 text-danger">{error}</div>;
  }

  if (!certificado) {
    return <div className="text-center mt-5">A carregar certificado...</div>;
  }

  return (
    <div className="certificado-container">
      {/* Print Button - hidden when printing */}
      <div className="print-button-container">
        <button className="print-button" onClick={handlePrint}>
          Imprimir / Guardar como PDF
        </button>
      </div>

      {/* Certificate */}
      <div className="certificado">
        <div className="certificado-header">
          <img src={logoSoftskills} alt="TheSoftSkills Logo" className="logo" />
          <img src={logoSoftinsa} alt="Softinsa Logo" className="logo" />
        </div>

        <h1 className="cert-title">Certificado de Conhecimento</h1>

        <p className="cert-body">Certificamos que</p>
        <h2 className="cert-name">{certificado.utilizador}</h2>
        <p className="cert-body">obteu o certificado de</p>
        <h3 className="cert-course">{certificado.nome}</h3>

        <p className="cert-description">{certificado.descricao}</p>

        <div className="cert-footer">
          <p>Emitido por TheSoftSkills em colaboração com a Softinsa.</p>
          <p>ID do Certificado: <code>{certificado.chave}</code></p>
        </div>
      </div>
    </div>
  );
};

export default Certificado;
