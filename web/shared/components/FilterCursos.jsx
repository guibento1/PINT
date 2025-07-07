import React, { useState, useEffect } from 'react';
import api from '../services/axios.js';

export const getCategorias = async () => {
  try {
    const response = await api.get('/categoria/list');
    return response.data;
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    throw error;
  }
};

export const getAreasByCategoriaId = async (categoriaId) => {
  try {
    const response = await api.get(`/categoria/id/${categoriaId}/list`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar áreas para categoria ${categoriaId}:`, error);
    throw error;
  }
};

export const getTopicosByAreaId = async (areaId) => {
  try {
    const response = await api.get(`/area/id/${areaId}/list`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar tópicos para área ${areaId}:`, error);
    throw error;
  }
};


export default function FiltrosCursos({ onApplyFilters }) {
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedTopico, setSelectedTopico] = useState('');

  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topicos, setTopicos] = useState([]);

  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingTopicos, setLoadingTopicos] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState(null);
  const [errorAreas, setErrorAreas] = useState(null);
  const [errorTopicos, setErrorTopicos] = useState(null);


  useEffect(() => {
    const fetchCategorias = async () => {
      setLoadingCategorias(true);
      setErrorCategorias(null);
      try {
        const data = await getCategorias();
        setCategorias(data);
      } catch (err) {
        setErrorCategorias("Erro ao carregar categorias.");
        console.error(err);
      } finally {
        setLoadingCategorias(false);
      }
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (selectedCategoria) {
      const fetchAreas = async () => {
        setLoadingAreas(true);
        setErrorAreas(null);
        try {
          const data = await getAreasByCategoriaId(selectedCategoria);
          setAreas(data);
          setSelectedArea(''); 
          setSelectedTopico('');
        } catch (err) {
          setErrorAreas("Erro ao carregar áreas.");
          console.error(err);
          setAreas([]);
        } finally {
          setLoadingAreas(false);
        }
      };
      fetchAreas();
    } else {
      setAreas([]);
      setSelectedArea('');
      setTopicos([]);
      setSelectedTopico('');
    }
  }, [selectedCategoria]);

  useEffect(() => {
    if (selectedArea) {
      const fetchTopicos = async () => {
        setLoadingTopicos(true);
        setErrorTopicos(null);
        try {
          const data = await getTopicosByAreaId(selectedArea);
          setTopicos(data);
          setSelectedTopico(''); 
        } catch (err) {
          setErrorTopicos("Erro ao carregar tópicos.");
          console.error(err);
          setTopicos([]);
        } finally {
          setLoadingTopicos(false);
        }
      };
      fetchTopicos();
    } else {
      setTopicos([]);
      setSelectedTopico('');
    }
  }, [selectedArea]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters({
      search,
      categoria: selectedCategoria || undefined,
      area: selectedArea || undefined,
      topico: selectedTopico || undefined,
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategoria('');
    setSelectedArea('');
    setSelectedTopico('');
    onApplyFilters({}); 
  };

  return (
    <div className="card-rounded mb-4 p-4">
      <h4 className="mb-3 text-primary-blue">Filtrar Cursos</h4>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-12">
            <label htmlFor="search" className="form-label">Pesquisar por Título/Descrição:</label>
            <input
              type="text"
              className="form-control"
              id="search"
              placeholder="Ex: JavaScript, Gestão..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="categoria" className="form-label">Categoria:</label>
            <select
              id="categoria"
              className="form-select"
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              disabled={loadingCategorias}
            >
              <option value="">{loadingCategorias ? 'A carregar...' : 'Todas as Categorias'}</option>
              {errorCategorias && <option value="" disabled>{errorCategorias}</option>}
              {categorias.map((cat) => (
                <option key={cat.idcategoria} value={cat.idcategoria}>
                  {cat.designacao}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="area" className="form-label">Área:</label>
            <select
              id="area"
              className="form-select"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              disabled={!selectedCategoria || loadingAreas || areas.length === 0}
            >
              <option value="">{loadingAreas ? 'A carregar...' : 'Todas as Áreas'}</option>
              {errorAreas && <option value="" disabled>{errorAreas}</option>}
              {areas.map((area) => (
                <option key={area.idarea} value={area.idarea}>
                  {area.designacao}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="topico" className="form-label">Tópico:</label>
            <select
              id="topico"
              className="form-select"
              value={selectedTopico}
              onChange={(e) => setSelectedTopico(e.target.value)}
              disabled={!selectedArea || loadingTopicos || topicos.length === 0}
            >
              <option value="">{loadingTopicos ? 'A carregar...' : 'Todos os Tópicos'}</option>
              {errorTopicos && <option value="" disabled>{errorTopicos}</option>}
              {topicos.map((top) => (
                <option key={top.idtopico} value={top.idtopico}>
                  {top.designacao}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={handleClearFilters}>
            Limpar Filtros
          </button>
          <button type="submit" className="btn btn-soft">
            Aplicar Filtros
          </button>
        </div>
      </form>
    </div>
  );
}
