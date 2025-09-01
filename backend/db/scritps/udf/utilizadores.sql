-- Verificar se o utilizador é admin

CREATE OR REPLACE FUNCTION isadmin(p_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_ativo BOOLEAN;
BEGIN

    SELECT ativo INTO v_ativo
    FROM Admin
    WHERE utilizador = p_id
    LIMIT 1;

    IF FOUND THEN
        RETURN v_ativo;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Trigger UDFs

CREATE OR REPLACE FUNCTION desativar_utilizador()
RETURNS TRIGGER AS $$
BEGIN

    IF current_setting('thesoftskills.bypass_triggers', true) = 'on' THEN
        RETURN OLD; 
    END IF;


    UPDATE utilizadores
        SET foto = null 
        WHERE idutilizador = OLD.idutilizador;


    IF OLD.ativo THEN

    UPDATE utilizadores
        SET ativo = false
        WHERE idutilizador = OLD.idutilizador;

    END IF;

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


CREATE OR REPLACE FUNCTION inserir_utilizador()
RETURNS TRIGGER AS $$
DECLARE
    utilizador BIGINT;
    state BOOLEAN;
BEGIN
    SELECT idUtilizador, ativo 
    INTO utilizador, state
    FROM utilizadores 
    WHERE email = NEW.email;

    IF utilizador IS NOT NULL THEN
        IF NOT state THEN
            RAISE EXCEPTION 'Utilizador inativo existente com o email fornecido';
        END IF;
        RAISE EXCEPTION 'Utilizador existente com o email fornecido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;





