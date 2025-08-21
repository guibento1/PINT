// web/frontend/frontOffice/src/views/Home.jsx
import React, { useEffect, useState } from "react";
import useUserRole from "@shared/hooks/useUserRole";
import api from "@shared/services/axios";
import CardCurso from "../components/CardCurso.jsx";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "@shared/styles/calendar.css";

export default function Home() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { isFormando, isFormador } = useUserRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [urlApi, setUrlApi] = useState(
    `/curso/inscricoes/utilizador/${user.id}`
  );
  const [cursos, setCursos] = useState([]);
  const [cursosSincronos, setCursosSincronos] = useState([]); // apenas para formador
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [categoriasAtivas, setCategoriasAtivas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [urlApiSincronos, setUrlApiSincronos] = useState(
    "/curso/list?sincrono=true"
  );

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
    api
      .get(urlApi)
      .then((res) => setCursos(res.data))
      .catch((err) => console.error("Erro ao carregar cursos:", err));
  }, [urlApi]);

  // Buscar cursos síncronos que o formador leciona
  useEffect(() => {
    if (!isFormador) return;
    api
      .get(urlApiSincronos)
      .then((res) => setCursosSincronos(res.data))
      .catch((err) => console.error("Erro ao carregar cursos síncronos:", err));
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
    let base = "/curso/list?sincrono=true";
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
      {isFormando && (
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
          {isFormador && (
            <div className="mb-5">
              <h4 className="mb-3">Cursos que leciono:</h4>
              {cursosSincronos.length > 0 ? (
                <div className="row g-4">
                  {cursosSincronos.map((curso) => (
                    <div
                      className="col-sm-6 col-md-4 col-lg-3"
                      key={curso.idcurso}
                    >
                      <CardCurso
                        className="shadow border-radius p-2"
                        curso={curso}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-light mt-2">
                  <h5 className="mb-2">Nenhum curso síncrono encontrado...</h5>
                  <p>Cria ou associa-te a um curso síncrono.</p>
                </div>
              )}
            </div>
          )}

          {/* Secção Meus Cursos (vem depois) */}
          <div className="mb-2">
            <h4 className="mb-3">
              {isFormando
                ? "Cursos em que estou inscrito:"
                : isFormador
                ? "Cursos em que estou inscrito:" 
                : "Cursos"}
            </h4>
            {/* Pesquisa + Categorias movidas para baixo do título "Os meus cursos" */}
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
            {cursos.length > 0 ? (
              <div className="row g-4">
                {cursos.map((curso) => (
                  <div
                    className="col-sm-6 col-md-4 col-lg-3"
                    key={curso.idcurso}
                  >
                    <CardCurso
                      className="shadow border-radius p-2"
                      curso={curso}
                    />
                  </div>
                ))}
              </div>
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
            <Calendar onChange={setSelectedDate} value={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
