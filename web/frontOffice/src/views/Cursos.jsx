// src/pages/Cursos/CursosPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "@shared/services/axios";
import FiltrosCursos from "@shared/components/FilterCursos.jsx";
import { useSearchParams } from "react-router-dom";
import CardCurso from "../components/CardCurso.jsx";

const getCursos = async (params) => {
  try {
    const response = await api.get(`/curso/list`, { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao listar cursos:", error);
    throw error;
  }
};

export default function CursosPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchCursos = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {};
      if (currentFilters.search) apiParams.search = currentFilters.search;
      if (currentFilters.categoria)
        apiParams.categoria = currentFilters.categoria;
      if (currentFilters.area) apiParams.area = currentFilters.area;
      if (currentFilters.topico) apiParams.topico = currentFilters.topico;
      if (typeof currentFilters.sincrono === "boolean")
        apiParams.sincrono = currentFilters.sincrono;

      const data = await getCursos(apiParams);
      setCursos(data);
    } catch (err) {
      setError("Erro ao carregar cursos. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sincronoParam = searchParams.get("sincrono");
    const currentFiltersFromUrl = {
      search: searchParams.get("search") || "",
      categoria: searchParams.get("categoria") || "",
      area: searchParams.get("area") || "",
      topico: searchParams.get("topico") || "",
      sincrono: sincronoParam === null ? undefined : sincronoParam === "true",
    };
    fetchCursos(currentFiltersFromUrl);
  }, [searchParams, fetchCursos]);

  const handleApplyFilters = (newFilters) => {
    const newSearchParams = new URLSearchParams();
    if (newFilters.search) newSearchParams.set("search", newFilters.search);
    if (newFilters.categoria)
      newSearchParams.set("categoria", newFilters.categoria);
    if (newFilters.area) newSearchParams.set("area", newFilters.area);
    if (newFilters.topico) newSearchParams.set("topico", newFilters.topico);
    if (typeof newFilters.sincrono === "boolean")
      newSearchParams.set("sincrono", newFilters.sincrono);

    setSearchParams(newSearchParams);
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-primary-blue">Explorar Cursos</h1>

      <FiltrosCursos onApplyFilters={handleApplyFilters} />

      {loading && (
        <div className="container mt-5">
          <div className="text-center my-5">
            <div className="spinner-border text-primary" />
            <p className="mt-2 text-muted">A carregar cursos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger text-center my-5" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && cursos.length === 0 && (
        <div className="alert alert-info text-center my-5" role="alert">
          Nenhum curso encontrado com os filtros aplicados.
        </div>
      )}

      <div className="row g-4">
        {(() => {
          if (loading || error) return null;
          const now = new Date();
          const visibleCursos = cursos.filter((c) => {
            const fim = c.fimdeinscricoes ? new Date(c.fimdeinscricoes) : null;
            const ended = fim && now >= fim;
            if (c.sincrono === false && ended) return false;
            return true;
          });
          return visibleCursos.map((curso) => (
            <div
              className="col-sm-6 col-md-4 col-lg-3"
              key={curso.idcurso || curso.id}
            >
              <CardCurso
                curso={curso}
                inscrito={curso.inscrito}
                lecionado={curso.lecionado}
                disponivel={curso.disponivel}
              />
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
