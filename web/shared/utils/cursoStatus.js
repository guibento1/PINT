const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export const getCursoStatus = (cursoLike, nowDate) => {
  const c = cursoLike || {};
  const now = nowDate ? new Date(nowDate) : new Date();

  const normalizeSincrono = () => {
    if (typeof c?.sincrono === "boolean") return c.sincrono;
    if (typeof c?.sincrono === "number") {
      if (c.sincrono === 1) return true;
      if (c.sincrono === 0) return false;
    }
    if (typeof c?.sincrono === "string") {
      const s = c.sincrono.toLowerCase();
      if (s === "true" || s === "1") return true;
      if (s === "false" || s === "0") return false;
    }
    const t = (c?.tipo || "").toString().toLowerCase();
    if (t.includes("sincrono") || t.includes("síncrono")) return true;
    if (t.includes("assincrono") || t.includes("assíncrono")) return false;
    return null;
  };
  const sincrono = normalizeSincrono();
  const nested = c?.cursosincrono || c?.cursoSincrono || {};
  const nestedAsync = c?.cursoassincrono || c?.cursoAssincrono || {};
  const inicioInsc =
    parseDate(
      c?.iniciodeinscricoes ||
        c?.inicioDeInscricoes ||
        nestedAsync?.iniciodeinscricoes ||
        nestedAsync?.inicioDeInscricoes
    ) || null;
  const fimInsc =
    parseDate(
      c?.fimdeinscricoes ||
        c?.fimDeInscricoes ||
        nestedAsync?.fimdeinscricoes ||
        nestedAsync?.fimDeInscricoes
    ) || null;
  const inicioCurso =
    parseDate(
      c?.inicio || c?.datainicio || nested?.inicio || nested?.datainicio
    ) || null;
  const fimCurso =
    parseDate(c?.fim || c?.datafim || nested?.fim || nested?.datafim) || null;

  const disponivel =
    c?.disponivel ?? nested?.disponivel ?? nestedAsync?.disponivel;

  let key = "pendente";

  if (sincrono === true) {
    // Síncronos (estado principalmente baseado nas datas do curso):
    // - Terminado: se existir data de fim do curso e já passou, ou marcado indisponível
    // - Em curso: se existir data de fim do curso e ainda não passou, ou se o curso já começou
    // - Pendente: quando não existem datas reais do curso (início/fim) mas existem datas de inscrição
    const hasInscricaoDates = !!inicioInsc && !!fimInsc;

    if (disponivel === false) {
      key = "terminado";
    } else if (fimCurso) {
      // Se existir data de fim do curso, essa é a fonte de verdade
      key = now >= fimCurso ? "terminado" : "em_curso";
    } else if (inicioCurso) {
      // Se só existir data de início, considerar em_curso quando chegou a data
      key = now >= inicioCurso ? "em_curso" : "pendente";
    } else if (hasInscricaoDates) {
      // Nenhuma data de curso definida, mas existem datas de inscrição: pendente
      key = "pendente";
    } else {
      key = "pendente";
    }
  } else if (sincrono === false) {
    // Assíncronos:
    // Em curso: dentro do início/fim de inscrições
    // Terminado: fim de inscrições expirou
    if (fimInsc) {
      key = now < fimInsc ? "em_curso" : "terminado";
    } else if (disponivel === true || disponivel === undefined) {
      key = "em_curso";
    } else {
      key = "terminado";
    }
  } else {
    // Tipo desconhecido: inferir pelo melhor sinal disponível
    // Preferir datas de curso se existirem
    if (inicioCurso && fimCurso) {
      key = now >= fimCurso ? "terminado" : "em_curso";
    } else if (fimInsc && now >= fimInsc) {
      key = "terminado";
    } else if (inicioInsc && now >= inicioInsc) {
      key = "em_curso";
    } else if (disponivel === false) {
      key = "terminado";
    } else if (disponivel === true) {
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
