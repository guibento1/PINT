-- Index: indexNomeUt

-- DROP INDEX IF EXISTS public."indexNomeUt";

CREATE INDEX IF NOT EXISTS "indexNomeUt"
    ON public.utilizadores USING btree
    (nome COLLATE pg_catalog."default" ASC NULLS LAST)
    INCLUDE(idutilizador, nome, ativo)
    WITH (deduplicate_items=True)
    TABLESPACE pg_default;
