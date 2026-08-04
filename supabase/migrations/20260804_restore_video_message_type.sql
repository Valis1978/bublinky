-- ============================================================
-- Bublinky 2.0 — restore 'video' in bub_messages type check
-- 20260803_v2_economy_chat.sql rebuilt the constraint and
-- accidentally dropped 'video' while adding 'sticker';
-- ChatView/MessageBubble still send type='video'.
-- ============================================================

ALTER TABLE bub_messages DROP CONSTRAINT IF EXISTS bub_messages_type_check;
ALTER TABLE bub_messages ADD CONSTRAINT bub_messages_type_check
  CHECK (type IN ('text', 'photo', 'voice', 'video', 'sticker'));
