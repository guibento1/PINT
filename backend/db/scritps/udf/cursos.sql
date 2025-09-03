CREATE OR REPLACE FUNCTION adicionar_canal()
RETURNS TRIGGER AS $$
DECLARE
    canalcurso BIGINT;
BEGIN
    INSERT INTO canalnotificacoes(descricao)
    VALUES (NEW.nome)
    RETURNING idcanalnotificacoes INTO canalcurso;

    NEW.canal := canalcurso;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION remover_inscricoes()
RETURNS TRIGGER AS $$
BEGIN

    DELETE FROM inscricao
    WHERE curso = OLD.idcurso; 

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION remover_tipo()
RETURNS TRIGGER AS $$
DECLARE
    sincrono BOOL;
BEGIN

    sincrono := EXISTS (SELECT 1 FROM cursosincrono WHERE curso = OLD.idcurso);

    IF sincrono THEN
       DELETE FROM cursosincrono
       WHERE curso = OLD.idcurso;
       RETURN OLD;
    END IF;


    DELETE FROM cursoassincrono
    WHERE curso = OLD.idcurso;
    RETURN OLD;

END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION remover_topico_from_topico_curso()
RETURNS TRIGGER AS $$
BEGIN

    DELETE FROM cursotopico
    WHERE curso = OLD.idcurso; 

    RETURN OLD;

END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trg_inscricao_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_canal BIGINT;
    v_utilizador BIGINT;
BEGIN
    SELECT canal INTO v_canal FROM Curso WHERE idCurso = NEW.curso;

    SELECT utilizador INTO v_utilizador FROM Formando WHERE idFormando = NEW.formando;

    INSERT INTO CanaisUtilizadores (canal, utilizador)
    VALUES (v_canal, v_utilizador)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trg_inscricao_delete()
RETURNS TRIGGER AS $$ 
DECLARE
    v_canal BIGINT;
    v_utilizador BIGINT;
BEGIN
    SELECT canal INTO v_canal FROM Curso WHERE idCurso = OLD.curso;

    SELECT utilizador INTO v_utilizador FROM Formando WHERE idFormando = OLD.formando;

    DELETE FROM CanaisUtilizadores
    WHERE canal = v_canal AND utilizador = v_utilizador;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
