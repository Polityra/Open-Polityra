-- ============================================
-- Migration 008: Evidence-grounded AI workflows
-- Adds the evidence-grounded workflow types. Legacy types stay valid so
-- previously stored analyses remain readable.
-- ============================================

BEGIN;

ALTER TABLE ai_workflows DROP CONSTRAINT IF EXISTS ai_workflows_type_check;
ALTER TABLE ai_workflows ADD CONSTRAINT ai_workflows_type_check CHECK (
    type IN (
        'fiscal-explanation', 'source-summary',
        'economic-analysis', 'geopolitical-assessment', 'scenario-generation',
        'text-summary', 'forecast', 'custom'
    )
);

COMMIT;
