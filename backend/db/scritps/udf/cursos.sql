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
