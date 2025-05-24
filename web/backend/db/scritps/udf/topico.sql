-- Trigger UDFs

CREATE OR REPLACE FUNCTION remover_topico()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM topicoarea WHERE topico=OLD.idtopico;
    RETURN OLD; 
END;
$$ LANGUAGE plpgsql;
