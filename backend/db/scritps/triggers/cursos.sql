CREATE TRIGGER trigger_adicionar_canal
BEFORE INSERT ON curso
FOR EACH ROW
EXECUTE FUNCTION adicionar_canal();
