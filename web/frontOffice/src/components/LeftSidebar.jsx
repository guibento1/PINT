import React from "react";
import api from "@shared/services/axios";

// Componente da sidebar esquerda (filtros e listas de tópicos)
const LeftSidebar = ({
  categorias,
  areas,
  topicos,
  selectedCategoria,
  setSelectedCategoria,
  selectedArea,
  setSelectedArea,
  selectedTopico,
  setSelectedTopico,
  topicSearch,
  setTopicSearch,
  subscribedTopics = [],
  toggleSubscribeTopic,
  readOnly = false,
}) => {
  // Valor de pesquisa normalizado
  const searchVal = String(topicSearch || "").trim().toLowerCase();

  // Lista de tópicos seguidos filtrada
  const filteredSubscribed = Array.isArray(subscribedTopics)
    ? subscribedTopics.filter(
        (t) =>
          !searchVal ||
          String(t?.designacao || "").toLowerCase().includes(searchVal)
      )
    : [];

  // Ação para deixar de seguir tópico
  const handleUnsubscribe = (t) => {
    if (!toggleSubscribeTopic) return;
    if (t?.courseLinked) {
      const ok = window.confirm(
        "Este tópico está associado a um dos cursos em que estás inscrito. Queres mesmo deixar de seguir?"
      );
      if (!ok) return;
    }
    toggleSubscribeTopic(t);
  };

  // Estrutura visual da sidebar
  return (
    <aside
      className="bg-light border-end"
      style={{
        position: "fixed",
        top: "80px",
        left: "0",
        marginBottom: "0",
        width: "320px",
        height: "calc(100vh - 80px)",
        overflowY: "overlay",
        zIndex: 1000,
        borderRight: "1px solid var(--border-light)",
      }}
    >
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Explorar Estrutura</h6>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={readOnly}
            onClick={() => {
              if (readOnly) return;
              setSelectedCategoria("");
              setSelectedArea("");
              setSelectedTopico("");
              setTopicSearch("");
            }}
          >
            Limpar Filtros
          </button>
        </div>

        <div className="mb-3">
          <input
            className="form-control form-control-sm"
            placeholder="Pesquisar tópico..."
            value={topicSearch}
            onChange={(e) => {
              const val = e.target.value;
              if (!readOnly) {
                setTopicSearch(val);
                if (val && Array.isArray(topicos) && topicos.length) {
                  const v = val.toLowerCase();
                  const match = topicos.find((t) =>
                    String(t.designacao).toLowerCase().includes(v)
                  );
                  if (match) {
                    setSelectedTopico(match.idtopico);
                    (async () => {
                      try {
                        const tRes = await api.get(
                          `/topico/id/${match.idtopico}`
                        );
                        const areas = tRes?.data?.areas || [];
                        if (areas.length) {
                          const areaId = areas[0]?.idarea;
                          if (areaId) {
                            const aRes = await api.get(`/area/id/${areaId}`);
                            const catId = aRes?.data?.categoria;
                            if (catId) setSelectedCategoria(String(catId));
                            setSelectedArea(String(areaId));
                          }
                        }
                      } catch {}
                    })();
                  }
                }
              }
            }}
            disabled={readOnly}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Categoria</label>
          <select
            className="form-select"
            value={selectedCategoria}
            onChange={(e) => !readOnly && setSelectedCategoria(e.target.value)}
            disabled={readOnly}
          >
            <option value="">Todas as Categorias</option>
            {categorias.map((c) => (
              <option key={c.idcategoria} value={c.idcategoria}>
                {c.designacao}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Área</label>
          <select
            className="form-select"
            value={selectedArea}
            onChange={(e) => !readOnly && setSelectedArea(e.target.value)}
            disabled={!areas.length || readOnly}
          >
            <option value="">Todas as Áreas</option>
            {areas.map((a) => (
              <option key={a.idarea} value={a.idarea}>
                {a.designacao}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="form-label">Tópicos</div>
          <div className="list-group mb-3">
            {(() => {
              const hasSearch = !!searchVal;
              const source = Array.isArray(topicos) ? topicos : [];
              const list = hasSearch
                ? source.filter((t) =>
                    String(t.designacao || "")
                      .toLowerCase()
                      .includes(searchVal)
                  )
                : selectedArea && source.length > 0
                ? source.filter((t) =>
                    String(t.designacao || "")
                      .toLowerCase()
                      .includes((topicSearch || "").toLowerCase())
                  )
                : [];
              if (!hasSearch && !selectedArea)
                return (
                  <div className="text-muted small">
                    Escolha uma área para ver tópicos
                  </div>
                );
              if (list.length === 0)
                return <div className="text-muted small">Sem resultados</div>;
              return list.map((t) => (
                <button
                  type="button"
                  key={t.idtopico}
                  className={`list-group-item list-group-item-action ${
                    String(selectedTopico) === String(t.idtopico)
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (readOnly) return;
                    setSelectedTopico(t.idtopico);
                  }}
                  disabled={readOnly}
                  style={{
                    marginBottom: "8px",
                    padding: "10px 15px",
                    borderRadius: "8px",
                    transition: "background-color 0.3s ease, color 0.3s ease",
                    backgroundColor:
                      String(selectedTopico) === String(t.idtopico)
                        ? "var(--primary-blue)"
                        : "var(--card-bg)",
                    color:
                      String(selectedTopico) === String(t.idtopico)
                        ? "var(--text-light)"
                        : "var(--text-dark)",
                    cursor: readOnly ? "not-allowed" : "pointer",
                    pointerEvents: readOnly ? "none" : "auto",
                    opacity: readOnly ? 0.7 : 1,
                    border: "1px solid var(--border-light)",
                  }}
                >
                  {t.designacao}
                </button>
              ));
            })()}
          </div>
        </div>

        <div className="mt-3">
          <h6 className="mb-2">Tópicos Seguidos</h6>
          <div className="list-group">
            {filteredSubscribed.length === 0 ? (
              <div className="text-muted small">
                {searchVal ? "Sem resultados" : "Ainda não segue tópicos"}
              </div>
            ) : (
              filteredSubscribed.map((t) => (
                <div
                  key={t.idtopico}
                  className="d-flex align-items-center justify-content-between list-group-item"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ maxWidth: "100%", color: "var(--text-dark)" }}>
                    {t?.designacao || `Tópico não encontrado`}
                  </div>
                  <div>
                    <button
                      className="btn btn-sm btn-link p-0 d-flex align-items-center justify-content-center"
                      onClick={() => handleUnsubscribe(t)}
                      title={
                        t.courseLinked
                          ? "Deixar de seguir (associado a curso)"
                          : "Deixar de seguir"
                      }
                      disabled={readOnly}
                      style={{
                        width: "24px",
                        height: "24px",
                        textDecoration: "none",
                        transition: "transform 0.2s ease",
                        color: "var(--text-muted)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <span aria-hidden="true" style={{ fontSize: "18px" }}>
                        ❌
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
