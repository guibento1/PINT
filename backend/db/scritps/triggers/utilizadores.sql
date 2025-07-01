CREATE TRIGGER desativar_utilizador_trigger
BEFORE DELETE ON utilizadores
FOR EACH ROW
EXECUTE FUNCTION desativar_utilizador();

CREATE OR REPLACE TRIGGER inserir_utilizador_trigger
BEFORE INSERT ON utilizadores
FOR EACH ROW
EXECUTE FUNCTION inserir_utilizador();


