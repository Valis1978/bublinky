// One-shot backfill: embed existing bub_pet_chat_log + bub_pet_memories rows.
// Run from the repo root: node scripts/backfill-embeddings.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)[1].trim();
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)[1].trim();
const gkey = env.match(/^GOOGLE_API_KEY=(.+)$/m)[1].trim();
const db = createClient(url, key);

async function embed(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${gkey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 6000) }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      }),
    }
  );
  if (!res.ok) throw new Error(`embed HTTP ${res.status}`);
  const data = await res.json();
  return `[${data.embedding.values.join(',')}]`;
}

for (const table of ['bub_pet_chat_log', 'bub_pet_memories']) {
  const { data: rows, error } = await db.from(table).select('id, content').is('embedding', null);
  if (error) { console.error(table, error.message); continue; }
  console.log(`${table}: ${rows.length} rows to embed`);
  for (const row of rows) {
    if (!row.content?.trim()) continue;
    try {
      const vec = await embed(row.content);
      const { error: ue } = await db.from(table).update({ embedding: vec }).eq('id', row.id);
      if (ue) console.error(' update', row.id, ue.message);
      else process.stdout.write('.');
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.error(' embed', row.id, String(e));
    }
  }
  console.log(` ${table} done`);
}
console.log('backfill complete');
