-- ============================================================
-- Pet RAG memory: pgvector embeddings + living profile
-- Additive only. Functions are service-role-only (exec_sql lesson).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE bub_pet_memories ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE bub_pet_chat_log ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Living profile — one consolidated "diary about my friend" per pet,
-- always injected whole into the chat prompt.
CREATE TABLE IF NOT EXISTS bub_pet_profile (
  pet_id UUID PRIMARY KEY REFERENCES bub_pets(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  messages_at_update INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE bub_pet_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bub_pet_profile_service" ON bub_pet_profile
  FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION match_pet_memories(p_pet_id uuid, p_query vector(768), p_count int DEFAULT 8)
RETURNS TABLE(content text, category text, similarity double precision)
LANGUAGE sql STABLE AS $$
  SELECT m.content, m.category, 1 - (m.embedding <=> p_query)
  FROM bub_pet_memories m
  WHERE m.pet_id = p_pet_id AND m.embedding IS NOT NULL
  ORDER BY m.embedding <=> p_query
  LIMIT p_count
$$;

CREATE OR REPLACE FUNCTION match_pet_chat(p_pet_id uuid, p_query vector(768), p_count int DEFAULT 6)
RETURNS TABLE(role text, content text, created_at timestamptz, similarity double precision)
LANGUAGE sql STABLE AS $$
  SELECT c.role, c.content, c.created_at, 1 - (c.embedding <=> p_query)
  FROM bub_pet_chat_log c
  WHERE c.pet_id = p_pet_id AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> p_query
  LIMIT p_count
$$;

-- Service-role only (PostgREST would otherwise expose RPC to anon)
REVOKE ALL ON FUNCTION match_pet_memories(uuid, vector, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION match_pet_chat(uuid, vector, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION match_pet_memories(uuid, vector, int) TO service_role;
GRANT EXECUTE ON FUNCTION match_pet_chat(uuid, vector, int) TO service_role;
