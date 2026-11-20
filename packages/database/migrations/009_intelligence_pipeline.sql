BEGIN;

ALTER TABLE public.sources
    ADD COLUMN IF NOT EXISTS stable_id TEXT,
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(64),
    ADD COLUMN IF NOT EXISTS geographic_scope JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS language VARCHAR(16),
    ADD COLUMN IF NOT EXISTS source_classification VARCHAR(64),
    ADD COLUMN IF NOT EXISTS reliability_metadata JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS fetch_config JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS last_successful_fetch TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_failed_fetch TIMESTAMPTZ;

UPDATE public.sources
SET stable_id = COALESCE(stable_id, id::text),
    source_type = COALESCE(source_type, data_type);

ALTER TABLE public.sources
    ALTER COLUMN stable_id SET NOT NULL,
    ALTER COLUMN stable_id SET DEFAULT gen_random_uuid()::text,
    ALTER COLUMN source_type SET NOT NULL,
    ALTER COLUMN source_type SET DEFAULT 'unknown';

CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_stable_id ON public.sources(stable_id);
CREATE INDEX IF NOT EXISTS idx_sources_enabled_type ON public.sources(is_active, source_type);

CREATE TABLE IF NOT EXISTS public.source_fetch_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
    response_status INTEGER,
    fetched_url TEXT,
    final_url TEXT,
    content_type TEXT,
    content_hash TEXT,
    bytes_fetched BIGINT,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_source_fetch_runs_source_started
    ON public.source_fetch_runs(source_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
    external_id TEXT,
    canonical_url TEXT NOT NULL,
    original_url TEXT NOT NULL,
    title TEXT NOT NULL,
    document_type VARCHAR(32) NOT NULL,
    published_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    language VARCHAR(16),
    content_hash TEXT NOT NULL,
    normalized_text TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    current_version INTEGER NOT NULL DEFAULT 1,
    UNIQUE (source_id, canonical_url)
);

CREATE INDEX IF NOT EXISTS idx_documents_source ON public.documents(source_id);
CREATE INDEX IF NOT EXISTS idx_documents_published ON public.documents(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON public.documents(content_hash);

CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    raw_content TEXT,
    normalized_text TEXT,
    title TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}',
    UNIQUE (document_id, version),
    UNIQUE (document_id, content_hash)
);

CREATE TABLE IF NOT EXISTS public.document_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    to_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    relationship VARCHAR(32) NOT NULL
        CHECK (relationship IN ('duplicate', 'near_duplicate', 'quotes', 'cites', 'updated_by')),
    confidence DOUBLE PRECISION NOT NULL DEFAULT 1 CHECK (confidence BETWEEN 0 AND 1),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (from_document_id, to_document_id, relationship),
    CHECK (from_document_id <> to_document_id)
);

CREATE TABLE IF NOT EXISTS public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name TEXT NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    external_ids JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (canonical_name, entity_type)
);

CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE RESTRICT,
    subject TEXT,
    predicate TEXT NOT NULL,
    object TEXT,
    claim_text TEXT NOT NULL,
    claim_type VARCHAR(32) NOT NULL,
    source_start INTEGER NOT NULL CHECK (source_start >= 0),
    source_end INTEGER NOT NULL,
    language VARCHAR(16),
    extraction_model TEXT NOT NULL,
    extraction_confidence DOUBLE PRECISION NOT NULL CHECK (extraction_confidence BETWEEN 0 AND 1),
    status VARCHAR(32) NOT NULL DEFAULT 'unverified'
        CHECK (status IN (
            'unverified', 'supported', 'corroborated', 'contradicted',
            'disputed', 'insufficient_evidence', 'under_review'
        )),
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (source_end > source_start),
    UNIQUE (document_id, source_start, source_end)
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_document ON public.claims(document_id);

CREATE TABLE IF NOT EXISTS public.claim_entities (
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'mentioned',
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    PRIMARY KEY (claim_id, entity_id, role)
);

CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE RESTRICT,
    stance VARCHAR(16) NOT NULL CHECK (stance IN ('supports', 'contradicts', 'context')),
    quote TEXT NOT NULL,
    source_start INTEGER NOT NULL,
    source_end INTEGER NOT NULL,
    dependency_root UUID,
    relevance DOUBLE PRECISION NOT NULL CHECK (relevance BETWEEN 0 AND 1),
    match_method TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (source_end > source_start)
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim ON public.evidence(claim_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_match_unique
    ON public.evidence(claim_id, document_id, source_start, source_end, stance);

CREATE TABLE IF NOT EXISTS public.claim_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL CHECK (status IN (
        'unverified', 'supported', 'corroborated', 'contradicted',
        'disputed', 'insufficient_evidence', 'under_review'
    )),
    reasoning TEXT NOT NULL,
    supporting_evidence_ids UUID[] NOT NULL DEFAULT '{}',
    contradictory_evidence_ids UUID[] NOT NULL DEFAULT '{}',
    model TEXT,
    confidence DOUBLE PRECISION CHECK (confidence BETWEEN 0 AND 1),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_verifications_claim
    ON public.claim_verifications(claim_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_intelligence_claim
    ON public.analyses ((parameters->>'claimId'))
    WHERE user_id IS NULL AND parameters->>'kind' = 'automatic-intelligence';

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    event_type VARCHAR(64) NOT NULL,
    title TEXT NOT NULL,
    occurred_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    location JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'unverified',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_time_type ON public.events(occurred_at DESC, event_type);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events USING GIN(location);

CREATE TABLE IF NOT EXISTS public.event_claims (
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    relationship VARCHAR(32) NOT NULL DEFAULT 'supports',
    PRIMARY KEY (event_id, claim_id)
);

CREATE TABLE IF NOT EXISTS public.analysis_evidence (
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.claims(id) ON DELETE RESTRICT,
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE RESTRICT,
    citation_key TEXT NOT NULL,
    statement_type VARCHAR(32) NOT NULL
        CHECK (statement_type IN (
            'verified_observation', 'attributed_statement', 'unverified_claim',
            'analytical_interpretation', 'forecast'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (analysis_id, citation_key),
    CHECK (claim_id IS NOT NULL OR evidence_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.pipeline_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    idempotency_key TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'dead_letter', 'cancelled')),
    priority INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
    run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
    lease_expires_at TIMESTAMPTZ,
    worker_id TEXT,
    last_error TEXT,
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (job_type, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_claim
    ON public.pipeline_jobs(status, run_after, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_lease
    ON public.pipeline_jobs(status, lease_expires_at);

CREATE TABLE IF NOT EXISTS public.pipeline_job_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.pipeline_jobs(id) ON DELETE CASCADE,
    attempt INTEGER NOT NULL,
    worker_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL
        CHECK (status IN ('running', 'completed', 'failed', 'lease_expired')),
    error_type TEXT,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    UNIQUE (job_id, attempt)
);

CREATE TABLE IF NOT EXISTS public.pipeline_workers (
    worker_id TEXT PRIMARY KEY,
    worker_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('running', 'stopping', 'stopped')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_pipeline_workers_health
    ON public.pipeline_workers(status, last_heartbeat_at DESC);

CREATE TRIGGER trg_pipeline_jobs_updated_at BEFORE UPDATE ON public.pipeline_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.source_fetch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_workers ENABLE ROW LEVEL SECURITY;

COMMIT;
