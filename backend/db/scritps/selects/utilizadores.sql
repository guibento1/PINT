-- Selecionar Utilizadores que não são administradores (junção externa)

SELECT idutilizador,nome,email
FROM utilizadores 
LEFT OUTER JOIN admin ON utilizadores.idutilizador = admin.utilizador
WHERE (admin.idadmin IS NULL OR admin.ativo = false) 
  AND utilizadores.ativo = true;

-- Selecionar Utilizadores inscritos no curso 'Desenvolvimento Web' (junção interna + subconsulta)

SELECT idformando, formandos.nome, email FROM inscricao JOIN

( SELECT idformando,nome,email FROM formando 
JOIN utilizadores ON utilizador=idutilizador )
AS formandos ON formando=idformando

JOIN curso ON curso=idcurso

WHERE curso.nome='Desenvolvimento Web';

