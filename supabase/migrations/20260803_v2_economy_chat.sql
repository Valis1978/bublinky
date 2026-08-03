-- ============================================================
-- Bublinky 2.0 — economy columns + chat reactions/stickers
-- Additive only; safe on existing data.
-- ============================================================

-- Pet economy (inventory / stickers / room / daily gift)
ALTER TABLE bub_pets ADD COLUMN IF NOT EXISTS inventory JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bub_pets ADD COLUMN IF NOT EXISTS stickers TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE bub_pets ADD COLUMN IF NOT EXISTS room JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bub_pets ADD COLUMN IF NOT EXISTS last_gift_claim TIMESTAMPTZ;
ALTER TABLE bub_pets ADD COLUMN IF NOT EXISTS gift_streak INTEGER NOT NULL DEFAULT 0;

-- Chat: emoji reactions ({"❤️": ["<user_id>"], ...}) + sticker message type
ALTER TABLE bub_messages ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bub_messages DROP CONSTRAINT IF EXISTS bub_messages_type_check;
ALTER TABLE bub_messages ADD CONSTRAINT bub_messages_type_check
  CHECK (type IN ('text', 'photo', 'voice', 'sticker'));
