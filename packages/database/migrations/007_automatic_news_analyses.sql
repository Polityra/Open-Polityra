BEGIN;

ALTER TABLE public.analyses ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_automatic_news
    ON public.analyses ((parameters->>'newsId'))
    WHERE user_id IS NULL AND parameters->>'kind' = 'automatic-news';

COMMIT;
