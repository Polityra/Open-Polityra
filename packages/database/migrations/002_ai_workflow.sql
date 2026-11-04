-- ============================================
-- Migration 002: AI Workflow system
-- Creates tables for local Ollama-powered AI analysis workflows.
-- ============================================

BEGIN;

-- AI Workflows — top-level workflow runs (each triggered by a user request)
CREATE TABLE IF NOT EXISTS ai_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(512) NOT NULL,
    description TEXT,
    type VARCHAR(64) NOT NULL CHECK (type IN ('economic-analysis', 'geopolitical-assessment', 'scenario-generation', 'text-summary', 'forecast', 'custom')),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    model VARCHAR(128) NOT NULL DEFAULT 'qwen3:14b',
    provider VARCHAR(64) NOT NULL DEFAULT 'ollama',
    system_prompt TEXT,
    parameters JSONB DEFAULT '{}',
    result JSONB,           -- final aggregated output
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_workflows_user ON ai_workflows(user_id);
CREATE INDEX idx_ai_workflows_status ON ai_workflows(status);
CREATE INDEX idx_ai_workflows_type ON ai_workflows(type);
CREATE INDEX idx_ai_workflows_created ON ai_workflows(created_at DESC);

-- Workflow Tasks — individual sub-tasks within a workflow run
CREATE TABLE IF NOT EXISTS workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES ai_workflows(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    prompt TEXT,
    response JSONB,         -- LLM response for this task
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_tasks_workflow ON workflow_tasks(workflow_id);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);

-- AI Conversations — persistent chat/context within a workflow
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    title VARCHAR(255),
    messages JSONB NOT NULL DEFAULT '[]',  -- array of {role, content, timestamp}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_workflow ON ai_conversations(workflow_id);

-- Triggers for updated_at columns
CREATE TRIGGER trg_ai_workflows_updated_at BEFORE UPDATE ON ai_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
