import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import api from '../../../shared/services/axios';
import '../../../shared/styles/curso.css'


const Curso = () => {
  const { id } = useParams();
  const [curso, setCurso] = useState(null);


  useEffect(() => {
    api.get(`/curso/${id}`)
      .then((res) => setCurso(res.data))
      .catch((err) => console.error('Erro ao carregar curso:', err));
  }, [id]);


  useEffect(() => {
    console.log(curso);
  }, [curso]);

  const formatData = (dataStr) => {
    return new Date(dataStr).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (

    <>


      <div className="container mt-5">

        <div className="row g-4 align-items-start">

          {/* Imagem */}
          <div className="col-md-4">
            <img
              src={curso?.thumbnail || 'https://placehold.co/300x180.png?text=TheSoftskills'}
              alt={curso?.nome}
              className="img-fluid rounded shadow-sm"
            />
          </div>

          {/* Informações do curso */}
          <div className="col-md-8">
            <h1 className="h3">{curso?.nome}</h1>
            <p><strong>Disponível:</strong> {curso?.disponivel ? 'Sim' : 'Não'}<br/>
            <strong>Inscrições:</strong> {formatData(curso?.iniciodeinscricoes)} até {formatData(curso?.fimdeinscricoes)}<br/>
            <strong>Máx. inscrições:</strong> {curso?.maxinscricoes}<br/>
            <strong>Síncrono:</strong> {curso?.sincrono ? 'Sim' : 'Não'}</p>
          </div>

        </div>

        {/* Plano Curricular */}

        <div className="mt-5">
          <h2 className="h4">Plano Curricular</h2>
          <p>{curso?.planocurricular}</p>
        </div>


        {curso?.topicos?.length > 0 && (
          <div className="col-12 col-md-6 col-lg-9 d-flex flex-wrap gap-2 mb-4">
            {curso.topicos.map((topico) => (
              <div key={topico.idtopico} className="btn btn-primary">
                {topico.designacao}
              </div>
            ))}
          </div>
        )}

    </div>

  </>

  );
};

export default Curso;
