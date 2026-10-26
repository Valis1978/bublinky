// Offline checks of the Gemini transport (src/lib/server/gemini.ts): which
// backend is picked, the exact URLs, headers and bodies, and the embedding
// response shapes — with a fake fetch and a fake GoogleAuth, no network.
// Run: node --test scripts/test-gemini.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const SERVICE_ACCOUNT = JSON.stringify({ type: 'service_account', client_email: 'sa@example.iam', private_key: 'PRIVATE-KEY' });

function loadGemini(env, responses = []) {
  const code = ts.transpileModule(readFileSync(new URL('../src/lib/server/gemini.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const calls = [];
  const auth = { options: null, tokens: 0 };
  class FakeGoogleAuth {
    constructor(options) { auth.options = options; }
    async getAccessToken() { auth.tokens++; return 'access-token'; }
  }
  const logs = { log: [], warn: [], error: [] };
  const fakeConsole = Object.fromEntries(Object.keys(logs).map((level) => [level, (...args) => logs[level].push(args.join(' '))]));
  const fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const next = responses.shift() ?? { status: 200, json: {} };
    return new Response(JSON.stringify(next.json), { status: next.status });
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (id) => {
      assert.equal(id, 'google-auth-library');
      return { GoogleAuth: FakeGoogleAuth };
    },
    console: fakeConsole,
    process: { env },
    fetch,
  });
  return { gemini: exports, calls, auth, logs };
}

const REQUEST = {
  contents: [{ role: 'user', parts: [{ text: 'Ahoj' }] }],
  generationConfig: { maxOutputTokens: 100, thinkingConfig: { thinkingLevel: 'minimal' }, responseMimeType: 'application/json' },
};

test('Vertex wins when project and service account are set, with labels and a bearer token', async () => {
  const { gemini, calls, auth, logs } = loadGemini({
    GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT, GOOGLE_API_KEY: 'studio-key',
  });
  assert.equal(gemini.geminiConfigured(), true);
  const signal = new AbortController().signal;
  const res = await gemini.generateContent('gemini-x', REQUEST, signal);
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://aiplatform.googleapis.com/v1/projects/proj-1/locations/global/publishers/google/models/gemini-x:generateContent');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer access-token');
  assert.equal(calls[0].init.signal, signal);
  assert.deepEqual(calls[0].body, { ...REQUEST, labels: { klient: 'interni', sluzba: 'bublinky' } });
  assert.ok(!calls[0].url.includes('studio-key'));
  // Built inside the vm context, so compare the plain data, not the prototypes.
  assert.deepEqual(JSON.parse(JSON.stringify(auth.options)), {
    credentials: { client_email: 'sa@example.iam', private_key: 'PRIVATE-KEY' },
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
  await gemini.generateContent('gemini-x', REQUEST);
  assert.equal(auth.options.credentials.client_email, 'sa@example.iam', 'one GoogleAuth per process');
  assert.deepEqual(logs.log, ['[Gemini] Using Vertex AI, project proj-1, location global']);
});

test('GOOGLE_VERTEX_LOCATION picks the regional host', async () => {
  const { gemini, calls } = loadGemini({
    GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT, GOOGLE_VERTEX_LOCATION: 'europe-west4',
  });
  await gemini.generateContent('gemini-x', REQUEST);
  assert.equal(calls[0].url, 'https://europe-west4-aiplatform.googleapis.com/v1/projects/proj-1/locations/europe-west4/publishers/google/models/gemini-x:generateContent');
});

test('without Vertex the AI Studio key is used unchanged and without labels', async () => {
  const { gemini, calls, auth, logs } = loadGemini({ GOOGLE_API_KEY: 'studio-key' }, [{ status: 402, json: {} }]);
  assert.equal(gemini.geminiConfigured(), true);
  const res = await gemini.generateContent('gemini-x', REQUEST);
  assert.equal(res.status, 402, 'the route still sees the status');
  assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent?key=studio-key');
  assert.deepEqual(calls[0].body, REQUEST);
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.equal(auth.options, null);
  assert.deepEqual(logs.error, ['[Gemini] AI Studio gemini-x: HTTP 402']);
});

test('half a Vertex configuration warns and stays on AI Studio', async () => {
  const { gemini, calls, logs } = loadGemini({ GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_API_KEY: 'studio-key' });
  await gemini.generateContent('gemini-x', REQUEST);
  assert.match(calls[0].url, /^https:\/\/generativelanguage\.googleapis\.com\//);
  assert.equal(logs.warn.length, 1);
});

test('nothing configured: geminiConfigured() is false and calls reject before any fetch', async () => {
  const { gemini, calls } = loadGemini({});
  assert.equal(gemini.geminiConfigured(), false);
  await assert.rejects(gemini.generateContent('gemini-x', REQUEST), /not configured/);
  await assert.rejects(gemini.embedContent('m', 't', { taskType: 'RETRIEVAL_QUERY', dimensions: 2, vertexLocation: 'europe-west1' }), /not configured/);
  assert.equal(calls.length, 0);
});

test('an unreadable service account never leaks key material into the error', async () => {
  for (const json of ['{"private_key": "SECRET-123', '{"client_email": "sa@example.iam"}']) {
    const { gemini, calls } = loadGemini({ GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: json });
    await assert.rejects(gemini.generateContent('gemini-x', REQUEST), (err) => {
      assert.match(err.message, /GOOGLE_SERVICE_ACCOUNT_JSON/);
      assert.ok(!err.message.includes('SECRET'));
      return true;
    });
    assert.equal(calls.length, 0);
  }
});

test('Vertex embeddings go to the regional :predict endpoint', async () => {
  const { gemini, calls } = loadGemini(
    { GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT, GOOGLE_VERTEX_LOCATION: 'global' },
    [{ status: 200, json: { predictions: [{ embeddings: { values: [0.25, -0.5], statistics: { token_count: 1 } } }] } }]
  );
  const values = await gemini.embedContent('gemini-embedding-001', 'Ahoj', { taskType: 'RETRIEVAL_DOCUMENT', dimensions: 768, vertexLocation: 'europe-west1' });
  assert.deepEqual(values, [0.25, -0.5]);
  assert.equal(calls[0].url, 'https://europe-west1-aiplatform.googleapis.com/v1/projects/proj-1/locations/europe-west1/publishers/google/models/gemini-embedding-001:predict');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer access-token');
  assert.deepEqual(calls[0].body, {
    instances: [{ content: 'Ahoj', task_type: 'RETRIEVAL_DOCUMENT' }],
    parameters: { outputDimensionality: 768 },
  });
});

test('AI Studio embeddings keep the :embedContent request', async () => {
  const { gemini, calls } = loadGemini({ GOOGLE_API_KEY: 'studio-key' }, [{ status: 200, json: { embedding: { values: [1, 2] } } }]);
  const values = await gemini.embedContent('gemini-embedding-001', 'Ahoj', { taskType: 'RETRIEVAL_QUERY', dimensions: 768, vertexLocation: 'europe-west1' });
  assert.deepEqual(values, [1, 2]);
  assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=studio-key');
  assert.deepEqual(calls[0].body, { content: { parts: [{ text: 'Ahoj' }] }, taskType: 'RETRIEVAL_QUERY', outputDimensionality: 768 });
});

test('embedding failures throw: HTTP errors and unexpected shapes', async () => {
  const vertexEnv = { GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT };
  const opts = { taskType: 'RETRIEVAL_QUERY', dimensions: 2, vertexLocation: 'europe-west1' };
  const failing = loadGemini(vertexEnv, [{ status: 403, json: { error: {} } }]);
  await assert.rejects(failing.gemini.embedContent('m', 't', opts), /embed HTTP 403 \(Vertex proj-1\)/);
  const wrongShape = loadGemini(vertexEnv, [{ status: 200, json: { embedding: { values: [1, 2] } } }]);
  await assert.rejects(wrongShape.gemini.embedContent('m', 't', opts), /unexpected response shape/);
  const notNumbers = loadGemini({ GOOGLE_API_KEY: 'k' }, [{ status: 200, json: { embedding: { values: ['1'] } } }]);
  await assert.rejects(notNumbers.gemini.embedContent('m', 't', opts), /unexpected response shape/);
});
