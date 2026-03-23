-- Bublinky: User gamification stats (persisted)
CREATE TABLE IF NOT EXISTS bub_user_stats (
    user_id UUID PRIMARY KEY REFERENCES bub_users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    unlocked_achievements TEXT[] NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bub_user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bub_user_stats_service" ON bub_user_stats
    FOR ALL USING (auth.role() = 'service_role');
