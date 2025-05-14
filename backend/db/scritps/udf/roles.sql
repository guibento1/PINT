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



CREATE OR REPLACE FUNCTION remover_role()
RETURNS TRIGGER AS $$
BEGIN

    EXECUTE format(
        'UPDATE %I SET ativo = false WHERE utilizador = $1',
        TG_TABLE_NAME -- Nome da tabela em que o trigger foi chamado
    )
    USING NEW.utilizador;
END;
$$ LANGUAGE plpgsql;
