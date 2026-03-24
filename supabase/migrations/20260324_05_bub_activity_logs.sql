-- Activity logs — tracks app opens, page visits, feature usage
CREATE TABLE IF NOT EXISTS bub_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bub_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'app_open', 'page_view', 'quiz_complete', 'game_play', 'story_read', 'diary_write'
  event_data JSONB DEFAULT '{}', -- { page: '/games/ai-quiz', score: 8, topic: 'Harry Potter' }
  session_id UUID, -- groups events in same app session
  duration_seconds INTEGER, -- time spent (filled on page leave / app close)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bub_activity_user ON bub_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_bub_activity_type ON bub_activity_logs(event_type, created_at DESC);
CREATE INDEX idx_bub_activity_session ON bub_activity_logs(session_id) WHERE session_id IS NOT NULL;

-- Location history — GPS positions
CREATE TABLE IF NOT EXISTS bub_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bub_users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION, -- meters
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  source TEXT DEFAULT 'gps', -- 'gps', 'network', 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bub_location_user ON bub_location_history(user_id, created_at DESC);

-- Push subscription (already exists, but ensure it's there)
CREATE TABLE IF NOT EXISTS bub_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bub_users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh, auth }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
