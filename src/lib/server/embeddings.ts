// Gemini text embeddings for the pet's RAG memory (server-only).
// 768 dims to keep pgvector rows small — plenty for a family-scale corpus.

import { embedContent } from '@/lib/server/gemini';

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIMS = 768;
// Vertex serves gemini-embedding-001 on regional endpoints only, not on `global`.
const EMBED_VERTEX_LOCATION = 'europe-west1';
const TIMEOUT_MS = 8000;

export type EmbedTask = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT';

/**
 * Embed a text. Throws on any failure — callers must treat embedding as a
 * soft dependency (skip retrieval / skip storing, never fail the chat).
 */
export async function embedText(text: string, taskType: EmbedTask): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const values = await embedContent(EMBED_MODEL, text.slice(0, 6000), {
      taskType,
      dimensions: EMBED_DIMS,
      vertexLocation: EMBED_VERTEX_LOCATION,
      signal: controller.signal,
    });
    if (values.length !== EMBED_DIMS) {
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
