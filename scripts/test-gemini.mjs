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

function loadGemini(env, responses = [], { tokenError } = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../src/lib/server/gemini.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const calls = [];
  const auth = { options: null, tokens: 0 };
  class FakeGoogleAuth {
    constructor(options) { auth.options = options; }
    async getAccessToken() { auth.tokens++; if (tokenError) throw tokenError; return 'access-token'; }
  }
  const logs = { log: [], warn: [], error: [] };
  const fakeConsole = Object.fromEntries(Object.keys(logs).map((level) => [level, (...args) => logs[level].push(args.join(' '))]));
  const fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const next = responses.shift() ?? { status: 200, json: {} };
    if (next.throws) throw next.throws;
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
  const res = await gemini.generateContent('gemini-3-flash-preview', REQUEST, signal);
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://aiplatform.googleapis.com/v1/projects/proj-1/locations/global/publishers/google/models/gemini-3-flash-preview:generateContent');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer access-token');
  assert.equal(calls[0].init.signal, signal);
  assert.deepEqual(calls[0].body, { ...REQUEST, labels: { klient: 'interni', sluzba: 'bublinky' } });
  assert.ok(!calls[0].url.includes('studio-key'));
  // Built inside the vm context, so compare the plain data, not the prototypes.
  assert.deepEqual(JSON.parse(JSON.stringify(auth.options)), {
    credentials: { client_email: 'sa@example.iam', private_key: 'PRIVATE-KEY' },
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
  await gemini.generateContent('gemini-3-flash-preview', REQUEST);
  assert.equal(auth.options.credentials.client_email, 'sa@example.iam', 'one GoogleAuth per process');
  assert.equal(logs.log[0], '[Gemini] Using Vertex AI, project proj-1, location global');
  assert.equal(logs.log.length, 3, 'one line per call');
  assert.match(logs.log[1], /^\[Gemini\] gemini-3-flash-preview via Vertex proj-1: HTTP 200, tokens in\/out\/thoughts 0\/0\/0, \d+ ms$/);
});

test('GOOGLE_VERTEX_LOCATION picks the regional host', async () => {
  const { gemini, calls } = loadGemini({
    GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT, GOOGLE_VERTEX_LOCATION: 'europe-west4',
  });
  await gemini.generateContent('gemini-3-flash-preview', REQUEST);
  assert.equal(calls[0].url, 'https://europe-west4-aiplatform.googleapis.com/v1/projects/proj-1/locations/europe-west4/publishers/google/models/gemini-3-flash-preview:generateContent');
});

test('without Vertex the AI Studio key is used unchanged and without labels', async () => {
  const { gemini, calls, auth, logs } = loadGemini({ GOOGLE_API_KEY: 'studio-key' }, [{ status: 402, json: {} }]);
  assert.equal(gemini.geminiConfigured(), true);
  const res = await gemini.generateContent('gemini-3-flash-preview', REQUEST);
  assert.equal(res.status, 402, 'the route still sees the status');
  assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=studio-key');
  assert.deepEqual(calls[0].body, REQUEST);
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.equal(auth.options, null);
  assert.equal(logs.error.length, 1);
  assert.match(logs.error[0], /^\[Gemini\] gemini-3-flash-preview via AI Studio: HTTP 402, \d+ ms$/);
});

test('half a Vertex configuration warns and stays on AI Studio', async () => {
  const { gemini, calls, logs } = loadGemini({ GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_API_KEY: 'studio-key' });
  await gemini.generateContent('gemini-3-flash-preview', REQUEST);
  assert.match(calls[0].url, /^https:\/\/generativelanguage\.googleapis\.com\//);
  assert.equal(logs.warn.length, 1);
});

test('nothing configured: geminiConfigured() is false and calls reject before any fetch', async () => {
  const { gemini, calls } = loadGemini({});
  assert.equal(gemini.geminiConfigured(), false);
  await assert.rejects(gemini.generateContent('gemini-3-flash-preview', REQUEST), /not configured/);
  await assert.rejects(gemini.embedContent('gemini-embedding-001', 't', { taskType: 'RETRIEVAL_QUERY', dimensions: 2, vertexLocation: 'europe-west1' }), /not configured/);
  assert.equal(calls.length, 0);
});

test('an unreadable service account never leaks key material into the error', async () => {
  for (const json of ['{"private_key": "SECRET-123', '{"client_email": "sa@example.iam"}']) {
    const { gemini, calls } = loadGemini({ GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: json });
    await assert.rejects(gemini.generateContent('gemini-3-flash-preview', REQUEST), (err) => {
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
  await assert.rejects(failing.gemini.embedContent('gemini-embedding-001', 't', opts), /embed HTTP 403 \(Vertex proj-1\)/);
  const wrongShape = loadGemini(vertexEnv, [{ status: 200, json: { embedding: { values: [1, 2] } } }]);
  await assert.rejects(wrongShape.gemini.embedContent('gemini-embedding-001', 't', opts), /unexpected response shape/);
  const notNumbers = loadGemini({ GOOGLE_API_KEY: 'k' }, [{ status: 200, json: { embedding: { values: ['1'] } } }]);
  await assert.rejects(notNumbers.gemini.embedContent('gemini-embedding-001', 't', opts), /unexpected response shape/);
});

test('a model off the allowlist is refused before the token and the request, with one log line', async () => {
  const vertexEnv = { GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT, GOOGLE_API_KEY: 'studio-key' };
  for (const env of [vertexEnv, { GOOGLE_API_KEY: 'studio-key' }]) {
    const { gemini, calls, auth, logs } = loadGemini(env);
    await assert.rejects(gemini.generateContent('gemini-3.1-pro-preview', REQUEST), /model "gemini-3.1-pro-preview" is not on the allowlist/);
    await assert.rejects(
      gemini.embedContent('gemini-3-flash-preview', 'Ahoj', { taskType: 'RETRIEVAL_QUERY', dimensions: 768, vertexLocation: 'europe-west1' }),
      /model "gemini-3-flash-preview" is not on the allowlist/
    );
    assert.equal(calls.length, 0, 'no request');
    assert.equal(auth.tokens, 0, 'no token');
    assert.deepEqual(logs.error, [
      '[Gemini] refused model "gemini-3.1-pro-preview" (generateContent): not on the allowlist',
      '[Gemini] refused model "gemini-3-flash-preview" (embedContent): not on the allowlist',
    ]);
    assert.ok(!logs.error.join('\n').includes('Ahoj'), 'never the prompt');
  }
});

test('the allowlist is checked on the id that is called: models/ prefix, quoted and cut ids', async () => {
  const { gemini, calls, logs } = loadGemini({ GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT });
  await gemini.generateContent('models/gemini-3-flash-preview', REQUEST);
  assert.equal(calls[0].url, 'https://aiplatform.googleapis.com/v1/projects/proj-1/locations/global/publishers/google/models/gemini-3-flash-preview:generateContent');
  await assert.rejects(gemini.generateContent(`gemini-3-flash-preview\n[Gemini] fake line${'x'.repeat(200)}`, REQUEST), /not on the allowlist/);
  assert.equal(calls.length, 1);
  assert.equal(logs.error.length, 1);
  assert.ok(!logs.error[0].includes('\n'), 'one line');
  assert.ok(logs.error[0].length < 160, 'id cut to 80 characters');
  // Each method takes only its own models.
  await assert.rejects(gemini.generateContent('gemini-embedding-001', REQUEST), /not on the allowlist/);
  assert.equal(calls.length, 1);
  assert.deepEqual([...gemini.ALLOWED_MODELS.generateContent], ['gemini-3-flash-preview']);
  assert.deepEqual([...gemini.ALLOWED_MODELS.embedContent], ['gemini-embedding-001']);
});

test('every call logs one line with model, backend, tokens and time, and the route still reads the body', async () => {
  const answer = {
    candidates: [{ content: { parts: [{ text: 'Tajná odpověď' }] } }],
    usageMetadata: { promptTokenCount: 812, candidatesTokenCount: 240, thoughtsTokenCount: 3 },
  };
  const { gemini, logs } = loadGemini(
    { GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT },
    [{ status: 200, json: answer }]
  );
  const res = await gemini.generateContent('gemini-3-flash-preview', REQUEST);
  assert.deepEqual(await res.json(), answer, 'the copy for the tokens leaves the body to the route');
  assert.match(logs.log[1], /^\[Gemini\] gemini-3-flash-preview via Vertex proj-1: HTTP 200, tokens in\/out\/thoughts 812\/240\/3, \d+ ms$/);
  assert.equal(logs.error.length, 0);
  assert.ok(!logs.log.join('\n').includes('Ahoj') && !logs.log.join('\n').includes('Tajná'), 'never the prompt or the answer');
});

test('a call that throws (sign-in, network) logs one line and rethrows', async () => {
  const vertexEnv = { GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT };
  const signIn = loadGemini(vertexEnv, [], { tokenError: new Error('invalid_grant: account disabled') });
  await assert.rejects(signIn.gemini.generateContent('gemini-3-flash-preview', REQUEST), /invalid_grant/);
  assert.equal(signIn.calls.length, 0);
  assert.equal(signIn.logs.error.length, 1);
  assert.match(signIn.logs.error[0], /^\[Gemini\] gemini-3-flash-preview via Vertex proj-1: failed \(Error: invalid_grant: account disabled\), \d+ ms$/);

  const offline = loadGemini(vertexEnv, [{ throws: new TypeError('fetch failed') }]);
  await assert.rejects(
    offline.gemini.embedContent('gemini-embedding-001', 'Ahoj', { taskType: 'RETRIEVAL_QUERY', dimensions: 768, vertexLocation: 'europe-west1' }),
    /fetch failed/
  );
  assert.equal(offline.logs.error.length, 1);
  assert.match(offline.logs.error[0], /^\[Gemini\] gemini-embedding-001 via Vertex proj-1: failed \(TypeError: fetch failed\), \d+ ms$/);

  const badUrl = loadGemini({ GOOGLE_API_KEY: 'studio-key' }, [
    { throws: new TypeError('Failed to parse URL from https://generativelanguage.googleapis.com/v1beta/models/x?key=studio-key') },
  ]);
  await assert.rejects(badUrl.gemini.generateContent('gemini-3-flash-preview', REQUEST), /Failed to parse URL/);
  assert.match(badUrl.logs.error[0], /\?key=\*\*\*\)/);
  assert.ok(!badUrl.logs.error[0].includes('studio-key'), 'never the key');

  const unconfigured = loadGemini({});
  await assert.rejects(unconfigured.gemini.generateContent('gemini-3-flash-preview', REQUEST), /not configured/);
  assert.match(unconfigured.logs.error[0], /^\[Gemini\] gemini-3-flash-preview via no backend: failed \(Error: Gemini is not configured/);
});

test('embeddings log one line: tokens from Vertex, the status of a failure, nothing twice', async () => {
  const vertexEnv = { GOOGLE_VERTEX_PROJECT: 'proj-1', GOOGLE_SERVICE_ACCOUNT_JSON: SERVICE_ACCOUNT };
  const opts = { taskType: 'RETRIEVAL_QUERY', dimensions: 2, vertexLocation: 'europe-west1' };
  const ok = loadGemini(vertexEnv, [{ status: 200, json: { predictions: [{ embeddings: { values: [1, 2], statistics: { token_count: 7 } } }] } }]);
  await ok.gemini.embedContent('gemini-embedding-001', 'Ahoj', opts);
  assert.match(ok.logs.log[1], /^\[Gemini\] gemini-embedding-001 via Vertex proj-1: HTTP 200, tokens 7, \d+ ms$/);
  const studio = loadGemini({ GOOGLE_API_KEY: 'studio-key' }, [{ status: 200, json: { embedding: { values: [1, 2] } } }]);
  await studio.gemini.embedContent('gemini-embedding-001', 'Ahoj', opts);
  assert.match(studio.logs.log[1], /^\[Gemini\] gemini-embedding-001 via AI Studio: HTTP 200, \d+ ms$/);
  const denied = loadGemini(vertexEnv, [{ status: 403, json: { error: {} } }]);
  await assert.rejects(denied.gemini.embedContent('gemini-embedding-001', 'Ahoj', opts), /embed HTTP 403/);
  assert.equal(denied.logs.error.length, 1);
  assert.match(denied.logs.error[0], /^\[Gemini\] gemini-embedding-001 via Vertex proj-1: HTTP 403, \d+ ms$/);
  assert.ok(!studio.logs.log.join('\n').includes('studio-key'), 'never the key');
});
