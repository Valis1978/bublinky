-- ============================================================
-- Bublinky Pet RPG — Database Schema
-- 7 tables for the full RPG companion system
-- ============================================================

-- 1. bub_pets — main pet state (one per user)
CREATE TABLE IF NOT EXISTS bub_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bub_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('cat','dog','bunny','dragon','unicorn','fox')),
  born TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Core stats (0-100)
  hunger SMALLINT NOT NULL DEFAULT 50 CHECK (hunger BETWEEN 0 AND 100),
  happiness SMALLINT NOT NULL DEFAULT 50 CHECK (happiness BETWEEN 0 AND 100),
  energy SMALLINT NOT NULL DEFAULT 80 CHECK (energy BETWEEN 0 AND 100),
  cleanliness SMALLINT NOT NULL DEFAULT 90 CHECK (cleanliness BETWEEN 0 AND 100),

  -- RPG progression
  xp INTEGER NOT NULL DEFAULT 0,
  level SMALLINT NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'egg',
  coins INTEGER NOT NULL DEFAULT 50,
  evolution_path TEXT DEFAULT NULL,

  -- Skill branches (0-100 each)
  skill_strength INTEGER NOT NULL DEFAULT 0,
  skill_wisdom INTEGER NOT NULL DEFAULT 0,
  skill_charisma INTEGER NOT NULL DEFAULT 0,
  skill_creativity INTEGER NOT NULL DEFAULT 0,
  skill_nature INTEGER NOT NULL DEFAULT 0,

  -- Timestamps for actions
  last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_fed TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_played TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_slept TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_bathed TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- State
  is_sleeping BOOLEAN NOT NULL DEFAULT false,
  is_on_vacation BOOLEAN NOT NULL DEFAULT false,
  vacation_return TIMESTAMPTZ,
  mood TEXT NOT NULL DEFAULT 'happy',

  -- Equipment & appearance
  accessories TEXT[] DEFAULT '{}',
  active_outfit JSONB DEFAULT '{}',

  -- Personality (evolves over time, 0.0-1.0 scale)
  personality_traits JSONB DEFAULT '{"brave": 0.5, "curious": 0.5, "playful": 0.5, "gentle": 0.5, "silly": 0.5}',

  -- Food Journey
  food_bravery INTEGER NOT NULL DEFAULT 0,
  foods_tried TEXT[] DEFAULT '{}',
  favorite_foods TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

CREATE INDEX idx_pets_user ON bub_pets(user_id);

-- 2. bub_pet_memories — AI long-term memory
CREATE TABLE IF NOT EXISTS bub_pet_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES bub_pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('preference','milestone','conversation','food','personality','daily','family')),
  content TEXT NOT NULL,
  importance SMALLINT NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pet_memories_pet ON bub_pet_memories(pet_id, category);
CREATE INDEX idx_pet_memories_recent ON bub_pet_memories(pet_id, created_at DESC);

-- 3. bub_pet_inventory — items, food, accessories
CREATE TABLE IF NOT EXISTS bub_pet_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES bub_pets(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('food','toy','accessory','decoration','souvenir','badge')),
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT now(),
  source TEXT,
  UNIQUE(pet_id, item_id)
);

CREATE INDEX idx_pet_inventory_pet ON bub_pet_inventory(pet_id, item_type);

-- 4. bub_pet_quests — quest system
CREATE TABLE IF NOT EXISTS bub_pet_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES bub_pets(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily','story','food_adventure','skill_challenge','routine')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT DEFAULT '⭐',

  -- Requirements [{type, count, current, detail?}]
  requirements JSONB NOT NULL DEFAULT '[]',

  -- Rewards
  reward_xp INTEGER NOT NULL DEFAULT 10,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  reward_items JSONB DEFAULT '[]',
  reward_skill TEXT,
  reward_skill_xp INTEGER DEFAULT 0,

  -- State
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','expired','abandoned')),
  progress REAL NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),

  -- Timing
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pet_quests_active ON bub_pet_quests(pet_id, status) WHERE status = 'active';

-- 5. bub_pet_adventures — travel stories
CREATE TABLE IF NOT EXISTS bub_pet_adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES bub_pets(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  story TEXT,
  souvenirs JSONB DEFAULT '[]',
  skill_xp_gained JSONB DEFAULT '{}',
  departed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  returns_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pet_adventures_pet ON bub_pet_adventures(pet_id, completed);

-- 6. bub_pet_chat_log — conversation history for AI context
CREATE TABLE IF NOT EXISTS bub_pet_chat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES bub_pets(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','pet')),
  content TEXT NOT NULL,
  emotion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pet_chat_recent ON bub_pet_chat_log(pet_id, created_at DESC);

-- 7. bub_food_journal — therapeutic food diary
CREATE TABLE IF NOT EXISTS bub_food_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bub_users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  food_category TEXT,
  bravery_rating SMALLINT CHECK (bravery_rating BETWEEN 1 AND 5),
  pet_tried_too BOOLEAN DEFAULT false,
  emoji TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_food_journal_user ON bub_food_journal(user_id, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE bub_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bub_pet_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bub_pet_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bub_pet_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bub_pet_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE bub_pet_chat_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bub_food_journal ENABLE ROW LEVEL SECURITY;

-- Service role policies (same pattern as existing tables)
CREATE POLICY "service_role_all" ON bub_pets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON bub_pet_memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON bub_pet_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON bub_pet_quests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON bub_pet_adventures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON bub_pet_chat_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON bub_food_journal FOR ALL USING (true) WITH CHECK (true);
