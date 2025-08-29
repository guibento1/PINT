CREATE TRIGGER trigger_ajustar_pontuacao_post
AFTER INSERT OR UPDATE ON IteracaoPost
FOR EACH ROW
EXECUTE FUNCTION ajustar_pontuacao_post();


CREATE TRIGGER trigger_reset_pontuacao_post
AFTER DELETE ON IteracaoPost
FOR EACH ROW
EXECUTE FUNCTION reset_pontuacao_post();


CREATE TRIGGER trigger_ajustar_pontuacao_comentario
AFTER INSERT OR UPDATE ON IteracaoComentario
FOR EACH ROW
EXECUTE FUNCTION ajustar_pontuacao_comentario();


CREATE TRIGGER trigger_reset_pontuacao_comentario
AFTER DELETE ON IteracaoComentario
FOR EACH ROW
EXECUTE FUNCTION reset_pontuacao_comentario();


CREATE TRIGGER trigger_incrementar_respostas
AFTER INSERT ON RespostaComentario
FOR EACH ROW
EXECUTE FUNCTION incrementar_respostas();


CREATE TRIGGER trigger_decrementar_respostas
AFTER DELETE ON RespostaComentario
FOR EACH ROW
EXECUTE FUNCTION decrementar_respostas();


CREATE OR REPLACE TRIGGER resposta_comentario_after_delete_trigger
AFTER DELETE ON RespostaComentario
FOR EACH ROW
EXECUTE FUNCTION cascade_after_delete_comentario();


CREATE OR REPLACE TRIGGER resposta_post_after_delete_trigger
AFTER DELETE ON RespostaPost
FOR EACH ROW
EXECUTE FUNCTION cascade_after_delete_comentario();

