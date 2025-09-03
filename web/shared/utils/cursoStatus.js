const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export const getCursoStatus = (cursoLike, nowDate) => {
  const c = cursoLike || {};
  const now = nowDate ? new Date(nowDate) : new Date();

  // Normalize
  const sincrono = c?.sincrono;
  const inicioInsc =
    parseDate(c?.iniciodeinscricoes || c?.inicioDeInscricoes) || null;
  const fimInsc = parseDate(c?.fimdeinscricoes || c?.fimDeInscricoes) || null;
  const nested = c?.cursosincrono || c?.cursoSincrono || {};
  const inicioCurso =
    parseDate(
      c?.inicio || c?.datainicio || nested?.inicio || nested?.datainicio
    ) || null;
  const fimCurso =
    parseDate(c?.fim || c?.datafim || nested?.fim || nested?.datafim) || null;

  const disponivel = c?.disponivel;

  let key = "pendente";

  if (sincrono === true) {
    // Síncronos:
    // Pendente só aparece quando as inscrições estão abertas E ainda não existem datas de início e fim do curso.
    // Depois de existirem ambas as datas, nunca mais volta a Pendente: fica Em curso (até ao fim) ou Terminado.
    const hasBothDates = !!inicioCurso && !!fimCurso;
    const inscricoesAbertas =
      !!inicioInsc && now >= inicioInsc && (!fimInsc || now < fimInsc);

    if (hasBothDates) {
      if (fimCurso && now >= fimCurso) {
        key = "terminado";
      } else if (disponivel === false) {
        // Indisponibilizado pelo admin/formador após datas definidas
        key = "terminado";
      } else {
        key = "em_curso"; // Antes do início ou entre datas, mantém "Em curso"
      }
    } else {
      if (inscricoesAbertas) {
        key = "pendente"; // Sem datas de curso e inscrições abertas
      } else if (disponivel === false) {
        key = "terminado"; // Forçado a terminado se indisponível
      } else {
        key = "em_curso"; // Default visual quando não cumpre condição de pendente
      }
    }
  } else if (sincrono === false) {
    // Assíncronos:
    // - disponivel === true  -> Em curso
    // - disponivel === false -> Terminado (arquivado)
    // - caso contrário       -> Pendente
    if (disponivel === false) key = "terminado";
    else if (disponivel === true) key = "em_curso";
    else key = "pendente";
  } else {
    if (fimInsc && now >= fimInsc) {
      key = "terminado";
    } else if (disponivel === false) {
      key = "pendente";
    } else if (inicioInsc && now >= inicioInsc) {
      key = "em_curso";
    } else {
      key = "pendente";
    }
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
