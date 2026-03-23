-- Bublinky: Users table
CREATE TABLE IF NOT EXISTS bub_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
    avatar_url TEXT,
    theme TEXT NOT NULL DEFAULT 'viki',
    settings JSONB NOT NULL DEFAULT '{}',
    push_subscription JSONB,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bub_users_role ON bub_users(role);

ALTER TABLE bub_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bub_users_service" ON bub_users
    FOR ALL USING (auth.role() = 'service_role');
