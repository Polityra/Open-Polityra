-- Persist complete analysis output and actionable failures.
BEGIN;

ALTER TABLE public.analyses
    ADD COLUMN IF NOT EXISTS result JSONB,
    ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMIT;
