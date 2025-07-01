CREATE MATERIALIZED VIEW utilizadoreCanaisNoticacoes AS

SELECT DISTINCT idutilizador,canal FROM

(
    SELECT * 
    FROM (
        SELECT idutilizador, curso
        FROM utilizadores 
        JOIN formando ON idutilizador = utilizador
        JOIN inscricao ON idformando = idformando
    ) u_c_fn
    
    UNION
    
    SELECT * 
    FROM (
        SELECT idutilizador, curso
        FROM cursosincrono
        JOIN formador ON idformador = formador
        JOIN utilizadores ON utilizador = idutilizador
    ) u_c_f
) AS u_c

JOIN curso ON idcurso = curso

UNION

SELECT idutilizador, 1 AS canal FROM utilizadores -- Notificações gerais

UNION

SELECT utilizador AS idutilizador, 2 AS canal FROM admin -- Notificações administrativas
