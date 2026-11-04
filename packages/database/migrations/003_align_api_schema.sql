-- Align existing core tables with the columns used by the current API.
BEGIN;

ALTER TABLE sources
    ADD COLUMN IF NOT EXISTS canonical_url TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

UPDATE sources
SET canonical_url = url
WHERE canonical_url IS NULL AND url IS NOT NULL;

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'draft';

ALTER TABLE scenarios
    ADD COLUMN IF NOT EXISTS created_by UUID;

UPDATE scenarios
SET created_by = user_id
WHERE created_by IS NULL AND user_id IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'scenarios_created_by_fkey'
          AND conrelid = 'scenarios'::regclass
    ) THEN
        ALTER TABLE scenarios
            ADD CONSTRAINT scenarios_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END
$$;

COMMIT;
