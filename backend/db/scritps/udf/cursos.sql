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
