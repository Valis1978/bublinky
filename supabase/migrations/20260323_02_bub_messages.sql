-- Bublinky: Messages table
CREATE TABLE IF NOT EXISTS bub_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES bub_users(id),
    content TEXT,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'photo', 'voice')),
    media_url TEXT,
    media_metadata JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bub_messages_created ON bub_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bub_messages_sender ON bub_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_bub_messages_unread ON bub_messages(read_at) WHERE read_at IS NULL;

ALTER TABLE bub_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bub_messages_service" ON bub_messages
    FOR ALL USING (auth.role() = 'service_role');

-- Enable Realtime for instant message delivery
ALTER PUBLICATION supabase_realtime ADD TABLE bub_messages;
