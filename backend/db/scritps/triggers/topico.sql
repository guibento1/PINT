CREATE TRIGGER remover_topico_trigger
BEFORE DELETE ON topico
FOR EACH ROW
EXECUTE FUNCTION remover_topico();
