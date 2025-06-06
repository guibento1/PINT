//web\frontend\backOffice\src\views\GerirEstrutura.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../shared/services/axios';

export default function GerirEstrutura() {
  const [estruturas, setEstruturas] = useState([]);

  useEffect(() => {
    carregarEstrutura();
  }, []);

  async function carregarEstrutura() {
    try {
      const areasRes = await api.get('/area/list');
      const areas = areasRes.data;

      const estruturasCarregadas = await Promise.all(
        areas.map(async (area) => {
          const categoriasRes = await api.get(`/categoria/id/${area.idarea}/list`);
          const categorias = categoriasRes.data;

          const categoriasComTopicos = await Promise.all(
            categorias.map(async (categoria) => {
              const topicosRes = await api.get(`/area/id/${area.idarea}/list`);
              const todosTopicos = topicosRes.data;

              // Filtrar os tópicos associados à categoria (via área) e que correspondam a essa categoria
              const topicosFiltrados = todosTopicos.filter(
                (topico) =>
                  topico.areas?.some((a) => a.idarea === area.idarea) &&
                  topico.designacao.toLowerCase().includes(categoria.designacao.toLowerCase()) // opcional: filtro por nome
              );

              return {
                ...categoria,
                topicos: topicosFiltrados,
              };
            })
          );

          return {
            ...area,
            categorias: categoriasComTopicos,
          };
        })
      );

      setEstruturas(estruturasCarregadas);
    } catch (error) {
      console.error('Erro ao carregar estrutura:', error);
    }
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4" style={{ color: 'var(--primary-blue)' }}>
        Gerir Estrutura
      </h2>
      <p className="text-muted mb-4">Visualização hierárquica de Áreas, Categorias e Tópicos</p>

      {estruturas.map((area) => (
        <div key={area.idarea} className="mb-4">
          <h5 style={{ color: 'var(--footer-bg)' }}>{area.designacao}</h5>

          {area.categorias.map((cat) => (
            <div key={cat.idCategoria} className="ms-3 mb-3">
              <strong style={{ color: 'var(--text-dark)' }}>↳ {cat.designacao}</strong>
              <ul className="ms-4 mt-1">
                {cat.topicos.length > 0 ? (
                  cat.topicos.map((topico) => (
                    <li key={topico.idtopico} style={{ color: 'var(--text-muted)' }}>
                      {topico.designacao}
                    </li>
                  ))
                ) : (
                  <li className="text-muted">Sem tópicos associados</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
