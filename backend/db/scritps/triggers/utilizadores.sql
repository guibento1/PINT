CREATE TRIGGER desativar_utilizador_trigger
BEFORE DELETE ON utilizadores
FOR EACH ROW
EXECUTE FUNCTION desativar_utilizador();

CREATE TRIGGER adicionar_admin
BEFORE INSERT ON admin
FOR EACH ROW
EXECUTE FUNCTION adicionar_role();


CREATE TRIGGER adicionar_formador
BEFORE INSERT ON formador
FOR EACH ROW
EXECUTE FUNCTION adicionar_role();


CREATE TRIGGER adicionar_formador
BEFORE INSERT ON formando
FOR EACH ROW
EXECUTE FUNCTION adicionar_role();
