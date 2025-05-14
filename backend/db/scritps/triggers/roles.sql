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


CREATE TRIGGER remover_admin
BEFORE INSERT ON admin
FOR EACH ROW
EXECUTE FUNCTION remover_role();


CREATE TRIGGER remover_formador
BEFORE INSERT ON formador
FOR EACH ROW
EXECUTE FUNCTION remover_role();


CREATE TRIGGER remover_formador
BEFORE INSERT ON formando
FOR EACH ROW
EXECUTE FUNCTION remover_role();

