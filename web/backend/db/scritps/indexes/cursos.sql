-- Index: indexNome

-- DROP INDEX IF EXISTS public."indexNome";

CREATE INDEX IF NOT EXISTS "indexNome"
    ON public.curso USING btree
    (nome COLLATE pg_catalog."default" ASC NULLS LAST)
    INCLUDE(idcurso, nome, disponivel)
    WITH (deduplicate_items=True)
    TABLESPACE pg_default;
