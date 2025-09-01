import React, { createContext, useState } from "react";

const SidebarContext = createContext();

const SidebarProvider = ({ children }) => {
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedTopico, setSelectedTopico] = useState("");
  const [topicSearch, setTopicSearch] = useState("");
  const [subscribedTopics, setSubscribedTopics] = useState({});

  return (
    <SidebarContext.Provider
      value={{
        categorias,
        setCategorias,
        areas,
        setAreas,
        topicos,
        setTopicos,
        selectedCategoria,
        setSelectedCategoria,
        selectedArea,
        setSelectedArea,
        selectedTopico,
        setSelectedTopico,
        topicSearch,
        setTopicSearch,
        subscribedTopics,
        setSubscribedTopics,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export { SidebarContext, SidebarProvider };
