-- Selecionar cursos com mais de 3 tópicos (Função de agregação + Having)

SELECT idcurso, nome, COUNT(topico) AS "n_tópicos" 
FROM cursotopico JOIN curso ON curso=idcurso
GROUP BY idcurso, nome
HAVING COUNT(topico) > 3;


-- Obter horas totais lecionadas em cada curso sincrono (função de agregação + subquery + junção interna)

SELECT idcurso,nome,horaslecionadas  FROM cursosincrono JOIN

(
    SELECT cursosincrono, SUM(duracaohoras) AS horaslecionadas 
    FROM sessao 
    WHERE CURRENT_TIMESTAMP > datahora + (duracaohoras * INTERVAL '1 hour')
    GROUP BY cursosincrono
) AS t
ON idcursosincrono = cursosincrono
JOIN curso ON cursosincrono.curso = idcurso;
