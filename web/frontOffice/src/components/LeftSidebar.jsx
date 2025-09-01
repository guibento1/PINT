import React from "react";

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
  toggleSubscribeTopic,
  subscribedTopics,
}) => {
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
        borderRight: "2px solid #333",
      }}
    >
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6>Explorar Estrutura</h6>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setSelectedCategoria("");
              setSelectedArea("");
              setSelectedTopico("");
            }}
          >
            Limpar Filtros
          </button>
        </div>
        <div className="mb-3">
          <label className="form-label">Categoria</label>
          <select
            className="form-select"
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
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
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!areas.length}
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
            {selectedArea && topicos.length > 0 ? (
              topicos
                .filter((t) =>
                  String(t.designacao)
                    .toLowerCase()
                    .includes(topicSearch.toLowerCase())
                )
                .map((t) => (
                  <button
                    type="button"
                    key={t.idtopico}
                    className={`list-group-item list-group-item-action ${
                      String(selectedTopico) === String(t.idtopico)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setSelectedTopico(t.idtopico)}
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
                    }}
                  >
                    {t.designacao}
                  </button>
                ))
            ) : (
              <div className="text-muted small">
                Escolha uma área para ver tópicos
              </div>
            )}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Pesquisar tópicos</label>
          <input
            className="form-control form-control-sm"
            placeholder="Pesquisar..."
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <h6 className="mb-2">Tópicos Seguidos</h6>
          <div className="list-group">
            {Object.keys(subscribedTopics || {}).length === 0 ? (
              <div className="text-muted small">Ainda não segue tópicos</div>
            ) : (
              Object.keys(subscribedTopics || {}).map((id) => {
                const t = subscribedTopics[id];
                return (
                  <div
                    key={id}
                    className="d-flex align-items-center justify-content-between list-group-item"
                  >
                    <div style={{ maxWidth: "100%" }}>
                      {t?.designacao || `Tópico não encontrado`}
                    </div>
                    <div>
                      <button
                        className="btn btn-sm btn-link p-0 d-flex align-items-center justify-content-center"
                        onClick={() => toggleSubscribeTopic(id)}
                        title="Deixar de seguir"
                        style={{
                          width: "24px",
                          height: "24px",
                          textDecoration: "none",
                          transition: "transform 0.2s ease",
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
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
