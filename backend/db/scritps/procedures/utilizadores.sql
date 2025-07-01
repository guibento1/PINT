-- Adiconar roles de admin, formando ou formador para um utilizador

CREATE OR REPLACE PROCEDURE setStatus(
    p_admin BOOLEAN,
    p_formando BOOLEAN,
    p_formador BOOLEAN,
    p_id BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_admin THEN
        INSERT INTO admin(utilizador) VALUES (p_id);
    ELSE
        DELETE FROM admin WHERE utilizador = p_id;
    END IF;

    IF p_formando THEN
        INSERT INTO formando(utilizador) VALUES (p_id);
    ELSE
        DELETE FROM formando WHERE utilizador = p_id;
    END IF;

    IF p_formador THEN
        INSERT INTO formador(utilizador) VALUES (p_id);
    ELSE
        DELETE FROM formador WHERE utilizador = p_id;
    END IF;
END;
$$;

-- Listar utilizadores com um cursor (só porque sim)

CREATE OR REPLACE PROCEDURE list_utilizadores()
LANGUAGE plpgsql
AS $$
DECLARE
    cur CURSOR FOR 
        SELECT idUtilizador, nome, email, telefone, ativo
        FROM Utilizadores;

    v_id BIGINT;
    v_nome VARCHAR(60);
    v_email VARCHAR(60);
    v_telefone CHAR(9);
    v_ativo BOOLEAN;
BEGIN
    OPEN cur;

    LOOP
        FETCH cur INTO v_id, v_nome, v_email, v_telefone, v_ativo;

        EXIT WHEN NOT FOUND;

        RAISE NOTICE 'ID: %, Nome: %, Email: %, Telefone: %, Ativo: %', 
            v_id, v_nome, v_email, v_telefone, v_ativo;
    END LOOP;

    CLOSE cur;
END;
$$;
