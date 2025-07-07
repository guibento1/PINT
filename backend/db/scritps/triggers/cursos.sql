CREATE TRIGGER trigger_adicionar_canal
BEFORE INSERT ON curso
FOR EACH ROW
EXECUTE FUNCTION adicionar_canal();


CREATE TRIGGER trigger_remover_inscricoes
BEFORE DELETE ON curso
FOR EACH ROW
EXECUTE FUNCTION remover_inscricoes();


CREATE TRIGGER trigger_remover_tipo
BEFORE DELETE ON curso
FOR EACH ROW
EXECUTE FUNCTION remover_tipo();


CREATE TRIGGER trigger_remover_topicos
BEFORE DELETE ON curso
FOR EACH ROW
EXECUTE FUNCTION remover_topico_from_topico_curso();
