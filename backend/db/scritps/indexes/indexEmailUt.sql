-- Index: indexEmailUt

-- DROP INDEX IF EXISTS public."indexEmailUt";

CREATE INDEX IF NOT EXISTS "indexEmailUt"
    ON public.utilizadores USING btree
    (email COLLATE pg_catalog."default" ASC NULLS LAST)
    INCLUDE(idutilizador, nome, email, ativo)
    WITH (deduplicate_items=True)
    TABLESPACE pg_default;
