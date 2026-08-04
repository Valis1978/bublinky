// Gemini text embeddings for the pet's RAG memory (server-only).
// 768 dims to keep pgvector rows small — plenty for a family-scale corpus.

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIMS = 768;
const TIMEOUT_MS = 8000;

export type EmbedTask = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT';

/**
 * Embed a text. Throws on any failure — callers must treat embedding as a
 * soft dependency (skip retrieval / skip storing, never fail the chat).
 */
export async function embedText(text: string, taskType: EmbedTask): Promise<number[]> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY missing');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text: text.slice(0, 6000) }] },
          taskType,
          outputDimensionality: EMBED_DIMS,
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) throw new Error(`embed HTTP ${res.status}`);
    const data = (await res.json()) as { embedding?: { values?: number[] } };
    const values = data.embedding?.values;
    if (!Array.isArray(values) || values.length !== EMBED_DIMS) {
      throw new Error('embed: unexpected response shape');
    }
    return values;
  } finally {
    clearTimeout(timeout);
  }
}

/** pgvector literal for supabase-js params/inserts. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`;
}
