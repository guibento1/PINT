CREATE OR REPLACE FUNCTION desativar_utilizador()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE utilizadores
        SET ativo = false
        WHERE idutilizador = OLD.idutilizador;

    UPDATE admin
        SET ativo = false
        WHERE utilizador = OLD.idutilizador;

    UPDATE formador
        SET ativo = false
        WHERE utilizador = OLD.idutilizador;

    UPDATE formando
        SET ativo = false
        WHERE utilizador = OLD.idutilizador;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION adicionar_role()
RETURNS TRIGGER AS $$
DECLARE
    userActive BOOLEAN;
    inRole BOOLEAN;
BEGIN

    EXECUTE 'SELECT ativo FROM utilizadores WHERE idutilizador = $1'
    INTO userActive
    USING NEW.utilizador;
    
    IF NOT userActive THEN
        RAISE EXCEPTION 'Utilizador não está ativo';
        RETURN NULL;
    END IF;


    EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I WHERE utilizador = $1)', 
        TG_TABLE_NAME -- Nome da tabela em que o trigger foi chamado
    )
    INTO inRole
    USING NEW.utilizador;


    IF inRole THEN
        EXECUTE format(
            'UPDATE %I SET ativo = true WHERE utilizador = $1',
            TG_TABLE_NAME -- Nome da tabela em que o trigger foi chamado
        )
        USING NEW.utilizador;
        

        RETURN NULL;
    END IF;


    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


