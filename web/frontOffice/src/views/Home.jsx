import React, { useEffect, useMemo, useState } from "react";
import useUserRole from "@shared/hooks/useUserRole";
import api from "@shared/services/axios";
import CardCurso from "../components/CardCurso.jsx";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "@shared/styles/calendar.css";
import { getCursoStatus } from "@shared/utils/cursoStatus";

export default function Home() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { isFormando, isFormador } = useUserRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [urlApi, setUrlApi] = useState(
    `/curso/inscricoes/utilizador/${user.id}`
  );
  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [cursosSincronos, setCursosSincronos] = useState([]); // apenas para formador
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [categoriasAtivas, setCategoriasAtivas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [urlApiSincronos, setUrlApiSincronos] = useState(
    `/curso/formador/${isFormador}`
  );

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

  const handleTagClickCategoria = (categoria) => {
    setCategoriasAtivas((prevActiveCategorias) => {
      if (
        prevActiveCategorias.some(
          (item) => item.idcategoria === categoria.idcategoria
        )
      ) {
        return prevActiveCategorias.filter(
          (item) => item.idcategoria !== categoria.idcategoria
        );
      } else {
        return [...prevActiveCategorias, categoria];
      }
    });
  };

  const CategoriaButton = ({ categoria }) => {
    const isActive = categoriasAtivas.some(
      (item) => item.idcategoria === categoria.idcategoria
    );
    return (
      <button
        onClick={() => handleTagClickCategoria(categoria)}
        className={`btn btn-sm ${
          isActive ? "btn-primary" : "btn-outline-primary"
        }`}
      >
        {categoria.designacao}
      </button>
    );
  };

  useEffect(() => {
    api
      .get("/categoria/list")
      .then((res) => setCategorias(res.data))
      .catch((err) => console.error("Erro ao carregar categorias:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingCursos(true);
    const run = async () => {
      try {
        const res = await api.get(urlApi);
        const arr = Array.isArray(res?.data) ? res.data : [];
        const enriched = await Promise.all(
          arr.map(async (c) => {
            if (!needsDetail(c)) return c;
            const id = c?.idcurso || c?.id;
            if (!id) return c;
            try {
              const det = await api.get(`/curso/${id}`);
              return mergeMinimalFields(c, det?.data);
            } catch {
              return c;
            }
          })
        );
        if (!cancelled) setCursos(enriched);
      } catch (err) {
        console.error("Erro ao carregar cursos:", err);
        if (!cancelled) setCursos([]);
      } finally {
        if (!cancelled) setLoadingCursos(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [urlApi]);

  // Buscar cursos síncronos que o formador leciona
  useEffect(() => {
    if (!isFormador) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await api.get(urlApiSincronos);
        const arr = Array.isArray(res?.data) ? res.data : [];
        const enriched = await Promise.all(
          arr.map(async (c) => {
            if (!needsDetail(c)) return c;
            const id = c?.idcurso || c?.id;
            if (!id) return c;
            try {
              const det = await api.get(`/curso/${id}`);
              return mergeMinimalFields(c, det?.data);
            } catch {
              return c;
            }
          })
        );
        if (!cancelled) setCursosSincronos(enriched);
      } catch (err) {
        console.error("Erro ao carregar cursos síncronos:", err);
        if (!cancelled) setCursosSincronos([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [urlApiSincronos, isFormador]);

  useEffect(() => {
    let tempUrl = `/curso/inscricoes/utilizador/${user.id}`;
    const params = [];

    if (termoPesquisa.length > 0) {
      params.push(`search=${encodeURIComponent(termoPesquisa)}`);
    }

    if (categoriasAtivas.length > 0) {
      const categoriaParams = categoriasAtivas.map(
        (categoria) => `categoria=${categoria.idcategoria}`
      );
      params.push(...categoriaParams);
    }

    if (params.length > 0) {
      tempUrl += `?${params.join("&")}`;
    }

    setUrlApi(tempUrl);
  }, [termoPesquisa, categoriasAtivas]);

  // URL para cursos síncronos (formador)
  useEffect(() => {
    if (!isFormador) return;
    let base = `/curso/formador/${isFormador}`;
    const params = [];
    if (termoPesquisa.length > 0) {
      params.push(`search=${encodeURIComponent(termoPesquisa)}`);
    }
    if (categoriasAtivas.length > 0) {
      const categoriaParams = categoriasAtivas.map(
        (categoria) => `categoria=${categoria.idcategoria}`
      );
      params.push(...categoriaParams);
    }
    if (params.length > 0) base += `&${params.join("&")}`;
    setUrlApiSincronos(base);
  }, [termoPesquisa, categoriasAtivas, isFormador]);

  return (
    <div className="container py-5">
      {isFormando > 0 && (
        <div className="mb-5 text-center">
          <h1 className="fw-bold mb-2">
            Olá, {user?.nome?.split(" ")[0] || "Utilizador"} 👋
          </h1>
          <p className="lead text-muted">Vamos continuar a aprender?</p>
        </div>
      )}

      <div className="row gx-5">
        {/* Coluna principal */}
        <div className="col-lg-9">
          {/* Secção Síncronos primeiro para Formador */}
          {isFormador > 0 && (
            <div className="mb-5">
              <h4 className="mb-3">Cursos que leciono:</h4>
              {cursosSincronos.length > 0 ? (
                <section className="ag-format-container">
                  <div className="ag-courses_box">
                    {cursosSincronos.map((curso) => (
                      <CardCurso
                        key={curso.idcurso}
                        variant="ag"
                        curso={curso}
                        notipo={true}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="alert alert-light mt-2">
                  <h5 className="mb-2">Nenhum curso síncrono encontrado...</h5>
                  <p>Cria ou associa-te a um curso síncrono.</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-2">
            <h4 className="mb-3">
              {isFormando
                ? "Cursos em que estou inscrito:"
                : isFormador
                ? "Cursos em que estou inscrito:"
                : "Cursos"}
            </h4>
            <div className="row align-items-start mb-3">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="mb-3 mb-md-0">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="PesquisarCursos"
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                  />
                </div>
              </div>
              {categorias.length > 0 && (
                <div className="col-12 col-md-6 col-lg-9 d-flex flex-wrap gap-2 mt-1 mt-md-0">
                  {categorias.map((categoria) => (
                    <CategoriaButton
                      key={categoria.idcategoria}
                      categoria={categoria}
                    />
                  ))}
                </div>
              )}
            </div>
            {loadingCursos ? (
              <div className="container mt-5">
                <div className="text-center my-5">
                  <div className="spinner-border text-primary" />
                  <p className="mt-2 text-muted">A carregar cursos...</p>
                </div>
              </div>
            ) : cursos.length > 0 ? (
              <section className="ag-format-container">
                <div className="ag-courses_box">
                  {cursos.map((curso) => (
                    <CardCurso
                      key={curso.idcurso}
                      variant="ag"
                      curso={curso}
                      inscrito={true}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="alert alert-light mt-4">
                <h5 className="mb-2">Nenhum curso encontrado...</h5>
                <p>
                  Explora a <a href="/cursos">página de cursos</a> para te
                  inscreveres.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Calendário */}
        <div className="col-lg-3 mt-5 mt-lg-0 d-none d-lg-block">
          <div className="card shadow border-radius p-2 calendario-widget">
            <h5 className="mb-3 fw-semibold mb-1 text-center">
              Sabes que dia é hoje?
            </h5>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="pt-PT"
              formatShortWeekday={(locale, date) =>
                date
                  .toLocaleDateString(locale, { weekday: "short" })
                  .substring(0, 3)
                  .toUpperCase()
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
