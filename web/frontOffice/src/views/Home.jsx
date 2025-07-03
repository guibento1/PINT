// web/frontend/frontOffice/src/views/Home.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../shared/services/axios';
import CardCurso from '../../../shared/components/CardCurso';

export default function Home() {
  const user = JSON.parse(sessionStorage.getItem('user'));

  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [cursos, setCursos] = useState([]);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [areaSelecionada, setAreaSelecionada] = useState('');
  const [topicoSelecionado, setTopicoSelecionado] = useState('');
  
  // Carrega categorias ao iniciar
  useEffect(() => {
    api.get('/categoria/list')
      .then((res) => setCategorias(res.data))
      .catch((err) => console.error('Erro ao carregar categorias:', err));
  }, []);

  // Carrega áreas da categoria selecionada
  useEffect(() => {
    if (categoriaSelecionada) {
      api.get(`/categoria/id/${categoriaSelecionada}/list`)
        .then((res) => setAreas(res.data))
        .catch((err) => console.error('Erro ao carregar áreas:', err));
    } else {
      setAreas([]);
      setTopicos([]);
      setCursos([]);
    }
  }, [categoriaSelecionada]);

  // Carrega tópicos da área selecionada
  useEffect(() => {
    if (areaSelecionada) {
      api.get(`/area/id/${areaSelecionada}/list`)
        .then((res) => setTopicos(res.data))
        .catch((err) => console.error('Erro ao carregar tópicos:', err));
    } else {
      setTopicos([]);
      setCursos([]);
    }
  }, [areaSelecionada]);

  // Carrega cursos do tópico selecionado
  useEffect(() => {
    if (topicoSelecionado) {
      api.get(`/topico/id/${topicoSelecionado}/listcursos`)
        .then((res) => setCursos(res.data))
        .catch((err) => console.error('Erro ao carregar cursos:', err));
    } else {
      setCursos([]);
    }
  }, [topicoSelecionado]);

  return (
    <div className="container py-5">
      <h2 className="mb-4">Bem-vindo(a), {user?.nome || 'Utilizador'}</h2>

      {cursos.length > 0 ?
        (
          <>
            <h4 className="mb-3">Cursos disponíveis:</h4>
            <div className="row">
              {cursos.map(curso => (
                <div className="col-md-4 mb-4" key={curso.idcurso}>
                  <CardCurso
                    nome={curso.nome}
                    thumnail={curso.thumnail}
                    disponivel={curso.disponivel}
                  />
                </div>
              ))}
            </div>
          </>
        )

        :


        (
          <>
            <h4 className="mb-3">Nenhum curso encontrado ...</h4>
            <h4 className="mb-3">Inscreve-te num na pagina de cursos</h4>
          </>
        )


      }
    </div>
  );
}
