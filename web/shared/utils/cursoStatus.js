const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export const getCursoStatus = (
  { iniciodeinscricoes, fimdeinscricoes, disponivel },
  nowDate
) => {
  const now = nowDate ? new Date(nowDate) : new Date();
  const inicio = parseDate(iniciodeinscricoes);
  const fim = parseDate(fimdeinscricoes);

  // Default to Pendente if no valid dates yet
  let key = "pendente";
  // 1) Se passou da data de fim, é Terminado (independentemente de 'disponivel')
  if (fim && now >= fim) {
    key = "terminado";
  } else if (disponivel === false) {
    // 2) Indisponível antes do fim -> considerar "Pendente" (oculto/manual)
    key = "pendente";
  } else if (inicio && now >= inicio) {
    // 3) Disponível e já passou do início -> Em curso
    key = "em_curso";
  } else {
    // 4) Caso contrário -> Pendente
    key = "pendente";
  }

  switch (key) {
    case "em_curso":
      return { key, label: "Em curso", badgeClass: "bg-success" };
    case "terminado":
      return { key, label: "Terminado", badgeClass: "bg-dark" };
    default:
      return { key: "pendente", label: "Pendente", badgeClass: "bg-secondary" };
  }
};

export default { getCursoStatus };
