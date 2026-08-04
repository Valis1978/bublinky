-- ============================================================
-- Bublinky FUN sprint — interactive stories + reading log
-- Additive only.
-- ============================================================

CREATE TABLE IF NOT EXISTS bub_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bub_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL,
  segments JSONB NOT NULL DEFAULT '[]',
  cameo_id TEXT,
  moral TEXT,
  finished BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bub_stories_user ON bub_stories(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bub_reading_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bub_users(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  author TEXT,
  cameo_id TEXT,
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'reading', 'done')),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bub_reading_user ON bub_reading_log(user_id, created_at DESC);

ALTER TABLE bub_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bub_reading_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bub_stories_service" ON bub_stories
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "bub_reading_log_service" ON bub_reading_log
  FOR ALL USING (auth.role() = 'service_role');
