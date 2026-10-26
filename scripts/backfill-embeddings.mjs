// One-shot backfill: embed existing bub_pet_chat_log + bub_pet_memories rows.
// Run from the repo root: node scripts/backfill-embeddings.mjs
//
// Same model, task type and dimensions as src/lib/server/embeddings.ts.
// Variables come from the environment, else from .env.local. With
// GOOGLE_VERTEX_PROJECT set it embeds through Vertex AI (europe-west1), signed
// in with GOOGLE_SERVICE_ACCOUNT_JSON or, without it, with Application Default
// Credentials (`gcloud auth application-default login` as an account that may
// use Vertex in that project); otherwise through GOOGLE_API_KEY (AI Studio).
import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import { existsSync, readFileSync } from 'node:fs';

const envFile = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
const env = (name) => process.env[name] || envFile.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim();

function serviceAccount(json) {
  try {
    return JSON.parse(json);
  } catch {
    // The parser's own message quotes the input — keep key material out of the output.
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
}

const db = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
const project = env('GOOGLE_VERTEX_PROJECT');
const credentials = env('GOOGLE_SERVICE_ACCOUNT_JSON');
const auth = project
  ? new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      ...(credentials ? { credentials: serviceAccount(credentials) } : {}),
    })
  : null;
const gkey = env('GOOGLE_API_KEY');
if (!auth && !gkey) throw new Error('Set GOOGLE_VERTEX_PROJECT (Vertex AI) or GOOGLE_API_KEY (AI Studio)');
console.log(auth ? `Embedding via Vertex AI, project ${project}, europe-west1` : 'Embedding via the AI Studio key');

async function embed(text) {
  const content = text.slice(0, 6000);
  const res = auth
    ? await fetch(
        `https://europe-west1-aiplatform.googleapis.com/v1/projects/${project}/locations/europe-west1/publishers/google/models/gemini-embedding-001:predict`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.getAccessToken()}` },
          body: JSON.stringify({
            instances: [{ content, task_type: 'RETRIEVAL_DOCUMENT' }],
            parameters: { outputDimensionality: 768 },
          }),
        }
      )
    : await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${gkey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text: content }] },
            taskType: 'RETRIEVAL_DOCUMENT',
            outputDimensionality: 768,
          }),
        }
      );
  if (!res.ok) throw new Error(`embed HTTP ${res.status}`);
  const data = await res.json();
  const values = auth ? data.predictions?.[0]?.embeddings?.values : data.embedding?.values;
  if (!Array.isArray(values) || values.length !== 768) throw new Error('embed: unexpected response shape');
  return `[${values.join(',')}]`;
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
