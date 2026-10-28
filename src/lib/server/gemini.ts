// Gemini REST calls for every AI feature (server-only).
//
// Vertex AI when GOOGLE_VERTEX_PROJECT and GOOGLE_SERVICE_ACCOUNT_JSON are
// both set, otherwise the Google AI Studio key (GOOGLE_API_KEY). From
// 16. 10. 2026 every AI Studio key answered 402 because the billing account
// had no prepaid credit, so the pet, stories, quiz and weather fell back to
// canned answers; Vertex is billed afterwards. Rolling back = deleting the two
// Vertex variables.

import { GoogleAuth } from 'google-auth-library';
import type { ThinkingConfig } from '@/lib/gemini-thinking';

/** Billing labels on every Vertex generateContent call (AI Studio rejects the field). */
const VERTEX_LABELS = { klient: 'interni', sluzba: 'bublinky' };

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

type Method = 'generateContent' | 'embedContent';

/**
 * Models Bublinky may call, per method: gemini-3-flash-preview for the pet,
 * stories, quiz and weather, gemini-embedding-001 for the pet's memory. The
 * routes name their model in code, but nothing stopped a new or edited call
 * from running any model, at any price, on the service account. Anything else
 * is refused before the token and the request. A new model = one line here.
 */
export const ALLOWED_MODELS: Readonly<Record<Method, ReadonlySet<string>>> = {
  generateContent: new Set(['gemini-3-flash-preview']),
  embedContent: new Set(['gemini-embedding-001']),
};

export interface GeminiRequest {
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    thinkingConfig?: ThinkingConfig;
    responseMimeType?: string;
  };
}

type VertexBackend = { kind: 'vertex'; name: string; project: string; location: string; auth: GoogleAuth };
type StudioBackend = { kind: 'studio'; name: string; apiKey: string };
type Backend = VertexBackend | StudioBackend;

let backend: Backend | null | undefined;

/** True when Vertex (project + service account) or the AI Studio key is configured. Does not validate them. */
export function geminiConfigured(): boolean {
  return Boolean(
    (process.env.GOOGLE_VERTEX_PROJECT && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) || process.env.GOOGLE_API_KEY
  );
}

function readServiceAccount(json: string): { client_email: string; private_key: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    // The parser's own message quotes the input — keep key material out of the log.
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  const account = (parsed ?? {}) as { client_email?: unknown; private_key?: unknown };
  if (typeof account.client_email !== 'string' || typeof account.private_key !== 'string') {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON lacks client_email or private_key');
  }
  return { client_email: account.client_email, private_key: account.private_key };
}

/**
 * Built once per process (GoogleAuth caches the access token and refreshes it).
 * Throws on unreadable credentials, so every call reports them again.
 */
function getBackend(): Backend | null {
  if (backend !== undefined) return backend;
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (Boolean(project) !== Boolean(credentials)) {
    console.warn('[Gemini] Only one of GOOGLE_VERTEX_PROJECT / GOOGLE_SERVICE_ACCOUNT_JSON is set; Vertex needs both.');
  }
  if (project && credentials) {
    const location = process.env.GOOGLE_VERTEX_LOCATION || 'global';
    backend = {
      kind: 'vertex',
      name: `Vertex ${project}`,
      project,
      location,
      auth: new GoogleAuth({ credentials: readServiceAccount(credentials), scopes: CLOUD_PLATFORM_SCOPE }),
    };
    console.log(`[Gemini] Using Vertex AI, project ${project}, location ${location}`);
  } else if (process.env.GOOGLE_API_KEY) {
    backend = { kind: 'studio', name: 'AI Studio', apiKey: process.env.GOOGLE_API_KEY };
    console.log('[Gemini] Using the Google AI Studio key');
  } else {
    backend = null;
  }
  return backend;
}

function requireBackend(): Backend {
  const ai = getBackend();
  if (!ai) {
    throw new Error('Gemini is not configured: set GOOGLE_VERTEX_PROJECT + GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_API_KEY');
  }
  return ai;
}

/** The model id as called; throws, after one log line without the prompt, when it is off the allowlist. */
function allowedModel(model: string, method: Method): string {
  const id = model.replace(/^models\//, '');
  if (ALLOWED_MODELS[method].has(id)) return id;
  // Quoted and cut, so an id cannot add lines to the log.
  const shown = JSON.stringify(id.slice(0, 80));
  console.error(`[Gemini] refused model ${shown} (${method}): not on the allowlist`);
  throw new Error(`model ${shown} is not on the allowlist`);
}

function vertexModelUrl(ai: VertexBackend, location: string, model: string, method: string): string {
  const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
  return `https://${host}/v1/projects/${ai.project}/locations/${location}/publishers/google/models/${model}:${method}`;
}

async function vertexHeaders(ai: VertexBackend): Promise<Record<string, string>> {
  const token = await ai.auth.getAccessToken();
  if (!token) throw new Error(`${ai.name}: the service account returned no access token`);
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/**
 * One log line per call, the only record of what Bublinky spends: model,
 * backend, outcome, tokens and time; never the prompt, the answer or a key.
 */
function logCall(id: string, via: string, startedAt: number, outcome: string, ok: boolean): void {
  const line = `[Gemini] ${id} via ${via}: ${outcome}, ${Date.now() - startedAt} ms`;
  if (ok) console.log(line);
  else console.error(line);
}

/** A thrown error on one short line, e.g. "failed (TypeError: fetch failed)"; an AI Studio key in a URL is masked. */
function failure(err: unknown): string {
  const text = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return `failed (${text.replace(/([?&]key=)[^&\s]+/g, '$1***').replace(/\s+/g, ' ').slice(0, 160)})`;
}

/** Token counts of a generateContent answer, read from a copy so the route still gets the whole body. */
async function generateTokens(res: Response): Promise<string> {
  try {
    const { usageMetadata: u } = (await res.clone().json()) as {
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
    };
    return `, tokens in/out/thoughts ${u?.promptTokenCount ?? 0}/${u?.candidatesTokenCount ?? 0}/${u?.thoughtsTokenCount ?? 0}`;
  } catch {
    return ', tokens unknown';
  }
}

/**
 * POST :generateContent on the configured backend. Resolves to the raw Response,
 * so every route keeps its own status and fallback handling; throws when the
 * model is off the allowlist, nothing is configured or the service account
 * cannot sign in.
 */
export async function generateContent(model: string, request: GeminiRequest, signal?: AbortSignal): Promise<Response> {
  const id = allowedModel(model, 'generateContent');
  const startedAt = Date.now();
  let via = 'no backend';
  let res: Response;
  try {
    const ai = requireBackend();
    via = ai.name;
    res =
      ai.kind === 'vertex'
        ? await fetch(vertexModelUrl(ai, ai.location, id, 'generateContent'), {
            method: 'POST',
            headers: await vertexHeaders(ai),
            body: JSON.stringify({ ...request, labels: VERTEX_LABELS }),
            signal,
          })
        : await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent?key=${ai.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
            signal,
          });
  } catch (err) {
    logCall(id, via, startedAt, failure(err), false);
    throw err;
  }
  logCall(id, via, startedAt, `HTTP ${res.status}${res.ok ? await generateTokens(res) : ''}`, res.ok);
  return res;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((n) => typeof n === 'number');
}

/**
 * One text embedding. Vertex serves the embedding models on regional endpoints
 * only and through :predict; AI Studio through :embedContent. Same model, task
 * type and dimensions give the same vector on both. Throws on any failure,
 * a model off the allowlist included.
 */
export async function embedContent(
  model: string,
  text: string,
  options: { taskType: string; dimensions: number; vertexLocation: string; signal?: AbortSignal }
): Promise<number[]> {
  const id = allowedModel(model, 'embedContent');
  const startedAt = Date.now();
  let via = 'no backend';
  let vertex = false;
  let res: Response;
  try {
    const ai = requireBackend();
    via = ai.name;
    vertex = ai.kind === 'vertex';
    res =
      ai.kind === 'vertex'
        ? await fetch(vertexModelUrl(ai, options.vertexLocation, id, 'predict'), {
            method: 'POST',
            headers: await vertexHeaders(ai),
            body: JSON.stringify({
              instances: [{ content: text, task_type: options.taskType }],
              parameters: { outputDimensionality: options.dimensions },
            }),
            signal: options.signal,
          })
        : await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:embedContent?key=${ai.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { parts: [{ text }] },
              taskType: options.taskType,
              outputDimensionality: options.dimensions,
            }),
            signal: options.signal,
          });
  } catch (err) {
    logCall(id, via, startedAt, failure(err), false);
    throw err;
  }
  if (!res.ok) {
    logCall(id, via, startedAt, `HTTP ${res.status}`, false);
    throw new Error(`embed HTTP ${res.status} (${via})`);
  }

  const data = (await res.json().catch(() => null)) as {
    embedding?: { values?: unknown };
    predictions?: Array<{ embeddings?: { values?: unknown; statistics?: { token_count?: unknown } } }>;
  } | null;
  const prediction = data?.predictions?.[0]?.embeddings;
  // Vertex counts the tokens; AI Studio's :embedContent answer has no counts.
  const tokens = prediction?.statistics?.token_count;
  logCall(id, via, startedAt, `HTTP ${res.status}${typeof tokens === 'number' ? `, tokens ${tokens}` : ''}`, true);
  const values = vertex ? prediction?.values : data?.embedding?.values;
  if (!isNumberArray(values)) throw new Error('embed: unexpected response shape');
  return values;
}
