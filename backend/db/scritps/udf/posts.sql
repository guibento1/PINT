CREATE OR REPLACE FUNCTION ajustar_pontuacao_post()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.positiva = TRUE THEN
            UPDATE Post SET pontuacao = pontuacao + 1 WHERE idPost = NEW.post;
        ELSE -- NEW.positiva = FALSE
            UPDATE Post SET pontuacao = pontuacao - 1 WHERE idPost = NEW.post;
        END IF;
    
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.positiva = NEW.positiva THEN
            RETURN NEW;
        END IF;

        IF OLD.positiva = FALSE AND NEW.positiva = TRUE THEN
            UPDATE Post SET pontuacao = pontuacao + 2 WHERE idPost = NEW.post;
        ELSIF OLD.positiva = TRUE AND NEW.positiva = FALSE THEN
            UPDATE Post SET pontuacao = pontuacao - 2 WHERE idPost = NEW.post;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION reset_pontuacao_post()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.positiva = TRUE THEN
        UPDATE Post
        SET pontuacao = pontuacao - 1
        WHERE idPost = OLD.post;
    ELSIF OLD.positiva = FALSE THEN
        UPDATE Post
        SET pontuacao = pontuacao + 1
        WHERE idPost = OLD.post;
    END IF;
    
    RETURN NULL; 
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION incrementar_respostas() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Comentario 
    SET nRespostas = nRespostas + 1
    WHERE idComentario = NEW.comentario;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION decrementar_respostas() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Comentario 
    SET nRespostas = nRespostas - 1
    WHERE idComentario = OLD.comentario;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION incrementar_comentarios() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE post 
    SET nComentarios = nComentarios + 1
    WHERE idPost = NEW.post;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION decrementar_comentarios() 
RETURNS TRIGGER AS $$
BEGIN

    UPDATE post 
    SET nComentarios = nComentarios - 1
    WHERE idPost = OLD.post;

    RETURN OLD;

END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION ajustar_pontuacao_comentario()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.positiva = TRUE THEN
        UPDATE Comentario
        SET pontuacao = pontuacao + 1
        WHERE idComentario = NEW.comentario;
    ELSIF NEW.positiva = FALSE THEN
        UPDATE Comentario
        SET pontuacao = pontuacao - 1
        WHERE idComentario = NEW.comentario;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION reset_pontuacao_comentario()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.positiva = TRUE THEN
        UPDATE Comentario
        SET pontuacao = pontuacao - 1
        WHERE idComentario = OLD.comentario;
    ELSIF OLD.positiva = FALSE THEN
        UPDATE Comentario
        SET pontuacao = pontuacao + 1
        WHERE idComentario = OLD.comentario;
    END IF;
    
    RETURN NULL; 
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION cascade_after_delete_comentario()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM Comentario WHERE idComentario = OLD.idComentario;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;


