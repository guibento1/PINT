-- Index: adminIndex

-- DROP INDEX IF EXISTS public."adminIndex";

CREATE INDEX IF NOT EXISTS "adminIndex"
    ON public.admin USING btree
    (utilizador ASC NULLS LAST)
    INCLUDE(ativo)
    WITH (deduplicate_items=True)
    TABLESPACE pg_default;
