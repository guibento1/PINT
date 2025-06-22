//web/frontend/backOffice/src/views/GerirEstrutura.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/services/axios';
import { BsChevronDown, BsChevronRight, BsPencilSquare, BsTrash } from 'react-icons/bs';

export default function GerirEstrutura() {
  const [estruturas, setEstruturas] = useState([]);
  const [areaExpandida, setAreaExpandida] = useState({});
  const [categoriaExpandida, setCategoriaExpandida] = useState({});
  const [topicoExpandido, setTopicoExpandido] = useState({});
  const navigate = useNavigate();

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

              const topicosFiltrados = todosTopicos.filter(
                (topico) =>
                  topico.areas?.some((a) => a.idarea === area.idarea) &&
                  topico?.categoria?.idCategoria === categoria.idCategoria
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

  const toggleArea = (id) => {
    setAreaExpandida((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategoria = (id) => {
    setCategoriaExpandida((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopico = (id) => {
    setTopicoExpandido((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="container py-5">
      <h2 style={{ color: 'var(--primary-blue)' }}>Gerir Estrutura</h2>
      <p className="text-muted mb-4">Visualização hierárquica de Áreas, Categorias e Tópicos</p>

      <div className="row g-4">
        <div className="col-lg-8">
          {estruturas.map((area) => (
            <div key={area.idarea} className="mb-4">
              <div className="card-rounded p-3">
                <div className="d-flex align-items-center justify-content-between position-relative mb-3">
                  <div className="d-flex align-items-center">
                    <button className="btn btn-link p-0 me-2" onClick={() => toggleArea(area.idarea)}>
                      {areaExpandida[area.idarea] ? <BsChevronDown /> : <BsChevronRight />}
                    </button>
                    <h5 className="mb-0" style={{ color: 'var(--footer-bg)' }}>{area.designacao}</h5>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn-icon-sm" onClick={() => navigate(`/editar-area/${area.idarea}`)}>
                      <BsPencilSquare /> Editar
                    </button>
                    {area.categorias.length === 0 && (
                      <button className="btn-icon-sm">
                        <BsTrash /> Deletar
                      </button>
                    )}
                  </div>
                </div>

                {areaExpandida[area.idarea] && (
                  area.categorias.length > 0 ? (
                    area.categorias.map((cat) => (
                      <div key={cat.idCategoria} className="ms-3 mb-3">
                        <div className="d-flex align-items-center gap-2 mt-1 ms-4">
                          <div className="d-flex align-items-center">
                            <button
                              className="btn btn-link p-0 me-2"
                              onClick={() => toggleCategoria(cat.idCategoria)}
                            >
                              {categoriaExpandida[cat.idCategoria] ? <BsChevronDown /> : <BsChevronRight />}
                            </button>
                            <strong style={{ color: 'var(--text-dark)' }}>{cat.designacao}</strong>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <button className="btn-icon-sm" onClick={() => navigate(`/editar-categoria/${cat.idCategoria}`)}>
                              <BsPencilSquare /> Editar
                            </button>
                            {cat.topicos.length === 0 && (
                              <button className="btn-icon-sm">
                                <BsTrash /> Deletar
                              </button>
                            )}
                          </div>
                        </div>

                        {categoriaExpandida[cat.idCategoria] && (
                          <ul className="ms-4 mt-1">
                            {cat.topicos.length > 0 ? (
                              cat.topicos.map((topico) => (
                                <li key={topico.idtopico} className="d-flex align-items-center gap-2 mt-1 ms-4">
                                  <div>
                                    <span style={{ color: 'var(--text-muted)' }}>{topico.designacao}</span>
                                    <small className="text-muted ms-2">(Cursos: 0 | Fóruns: 1)</small>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <button className="btn-icon-sm" onClick={() => toggleTopico(topico.idtopico)}>
                                      <BsChevronRight size={16} />
                                    </button>
                                    <button className="btn-icon-sm" onClick={() => navigate(`/editar-topico/${topico.idtopico}`)}>
                                      <BsPencilSquare size={16} /> Editar
                                    </button>
                                    <button className="btn-icon-sm">
                                      <BsTrash size={16} /> Deletar
                                    </button>
                                  </div>
                                </li>
                              ))
                            ) : (
                              <li className="d-flex align-items-center justify-content-between position-relative">
                                <span className="text-muted">Sem tópicos associados</span>
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="d-flex align-items-center gap-2 mt-1 ms-4">
                      <span className="text-muted">Sem categorias associadas.</span>
                      <button className="btn-icon-sm" onClick={() => navigate('/criar-categoria')}>
                        + Adicionar Categoria
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-4">
          <div className="card-rounded-sm">
            <div className="d-flex flex-column gap-3">
              <button className="btn-soft w-100" onClick={() => navigate('/criar-area')}>
                + Criar Nova Área
              </button>
              <button className="btn-soft w-100" onClick={() => navigate('/criar-categoria')}>
                + Criar Nova Categoria
              </button>
              <button className="btn-soft w-100" onClick={() => navigate('/criar-topico')}>
                + Criar Novo Tópico
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
