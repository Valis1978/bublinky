-- Bublinky: Tasks table (Úkolníček)
CREATE TABLE IF NOT EXISTS bub_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES bub_users(id),
    assigned_to UUID NOT NULL REFERENCES bub_users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'home' CHECK (category IN ('school', 'home', 'fun', 'event')),
    type TEXT NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'recurring', 'event')),
    due_date TIMESTAMPTZ,
    recurring_pattern JSONB,
    completed_at TIMESTAMPTZ,
    emoji TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bub_tasks_assigned ON bub_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bub_tasks_pending ON bub_tasks(completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bub_tasks_due ON bub_tasks(due_date) WHERE due_date IS NOT NULL;

ALTER TABLE bub_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bub_tasks_service" ON bub_tasks
    FOR ALL USING (auth.role() = 'service_role');
