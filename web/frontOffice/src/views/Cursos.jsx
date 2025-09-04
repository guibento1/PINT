import React, { useState, useEffect, useCallback } from "react";
import api from "@shared/services/axios";
import FiltrosCursos from "@shared/components/FilterCursos.jsx";
import { useSearchParams } from "react-router-dom";
import CardCurso from "../components/CardCurso.jsx";
import { getCursoStatus } from "@shared/utils/cursoStatus";

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

  const needsDetail = (c) => {
    if (!c) return false;
    const rawSin = c?.sincrono;
    const tipo = (c?.tipo || "").toString().toLowerCase();
    let s = null;
    if (typeof rawSin === "boolean") s = rawSin;
    else if (typeof rawSin === "number") s = rawSin === 1;
    else if (typeof rawSin === "string") {
      const v = rawSin.toLowerCase();
      if (v === "true" || v === "1") s = true;
      else if (v === "false" || v === "0") s = false;
    } else if (tipo.includes("síncrono") || tipo.includes("sincrono")) s = true;
    else if (tipo.includes("assíncrono") || tipo.includes("assincrono"))
      s = false;

    const nestedSync = c?.cursosincrono || c?.cursoSincrono || {};
    const nestedAsync = c?.cursoassincrono || c?.cursoAssincrono || {};

    const hasCursoDates = !!(
      c?.inicio ||
      c?.fim ||
      nestedSync?.inicio ||
      nestedSync?.fim
    );
    const hasInscrDates = !!(
      c?.iniciodeinscricoes ||
      c?.fimdeinscricoes ||
      c?.inicioDeInscricoes ||
      c?.fimDeInscricoes ||
      nestedAsync?.iniciodeinscricoes ||
      nestedAsync?.fimdeinscricoes ||
      nestedAsync?.inicioDeInscricoes ||
      nestedAsync?.fimDeInscricoes
    );
    const hasDisponivel =
      typeof (
        c?.disponivel ??
        nestedSync?.disponivel ??
        nestedAsync?.disponivel
      ) === "boolean";

    if (s === true) {
      return !hasCursoDates || !hasDisponivel;
    } else if (s === false) {
      return !hasInscrDates || !hasDisponivel;
    } else {
      return !hasCursoDates && !hasInscrDates && !hasDisponivel;
    }
  };

  const mergeMinimalFields = (base, det) => {
    const d = det || {};
    const out = { ...base };
    // Disponível
    out.disponivel =
      d?.disponivel ??
      out?.disponivel ??
      d?.cursosincrono?.disponivel ??
      d?.cursoSincrono?.disponivel ??
      d?.cursoassincrono?.disponivel ??
      d?.cursoAssincrono?.disponivel;
    // Datas inscrição (assíncrono)
    out.iniciodeinscricoes =
      d?.iniciodeinscricoes ??
      d?.inicioDeInscricoes ??
      d?.cursoassincrono?.iniciodeinscricoes ??
      d?.cursoAssincrono?.iniciodeinscricoes ??
      out?.iniciodeinscricoes;
    out.fimdeinscricoes =
      d?.fimdeinscricoes ??
      d?.fimDeInscricoes ??
      d?.cursoassincrono?.fimdeinscricoes ??
      d?.cursoAssincrono?.fimdeinscricoes ??
      out?.fimdeinscricoes;
    // Datas curso (síncrono)
    out.inicio =
      d?.inicio ??
      d?.cursosincrono?.inicio ??
      d?.cursoSincrono?.inicio ??
      out?.inicio;
    out.fim =
      d?.fim ?? d?.cursosincrono?.fim ?? d?.cursoSincrono?.fim ?? out?.fim;
    // Tipo/sincrono
    if (out?.sincrono == null && d?.sincrono != null) out.sincrono = d.sincrono;
    if (!out?.tipo && d?.tipo) out.tipo = d.tipo;
    return out;
  };

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
      const enriched = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (c) => {
          const isEnrolled = c?.inscrito === true;
          if (isEnrolled) return c; 
          if (!needsDetail(c)) return c;
          const id = c?.idcurso || c?.id;
          if (!id) return c;
          try {
            const resp = await api.get(`/curso/${id}`);
            return mergeMinimalFields(c, resp?.data);
          } catch {
            return c;
          }
        })
      );
      setCursos(enriched);
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

      <section className="ag-format-container">
        <div className="ag-courses_box">
          {(() => {
            if (loading || error) return null;
            const visibleCursos = cursos.filter((c) => {
              const isEnrolled = c.inscrito === true;
              if (isEnrolled) return false; // nunca listar cursos onde já está inscrito
              const st = getCursoStatus(c);
              if (st?.key === "terminado") return false; // ocultar cursos terminados/indisponíveis para não inscritos
              return true;
            });
            return visibleCursos.map((curso) => (
              <CardCurso
                key={curso.idcurso || curso.id}
                variant="ag"
                curso={curso}
                inscrito={curso.inscrito}
                lecionado={curso.lecionado}
                disponivel={curso.disponivel}
              />
            ));
          })()}
        </div>
      </section>
    </div>
  );
}
