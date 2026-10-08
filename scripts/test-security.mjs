import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { SignJWT, jwtVerify } from 'jose';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { NextRequest } = require('next/server');
const testSecret = 'isolated-security-test-secret-only-32-bytes';

function loadTs(path, dependencies, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => id in dependencies ? dependencies[id] : require(id), console, process, Date, TextEncoder, ...globals });
  return exports;
}

// Compile the actual module through the project's existing TypeScript package,
// so these tests also run on the project's Node 20 image without TS loaders.
const { createSession, verifySession } = loadTs('../src/lib/auth.ts', { jose: { SignJWT, jwtVerify } });
let authorizationDatabase = () => { throw new Error('Unexpected authorization DB access'); };
const authorization = loadTs('../src/lib/server/authorize-user.ts', {
  '@/lib/auth': { verifySession },
  '@/lib/supabase/admin': { createAdminClient: () => authorizationDatabase() },
});

function request(method, body, token, headers = {}) {
  return new NextRequest('https://bublinky.example/api/test?userId=child-b', {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { cookie: `bub_session=${token}` } : {}), ...headers },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
}

test('sessions fail closed without a strong secret and reject invalid signed claims', async () => {
  const originalSecret = process.env.JWT_SECRET;
  try {
    for (const secret of [undefined, '', 'bublinky-dev-secret-change-me']) {
      if (secret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = secret;
      await assert.rejects(createSession('child-a', 'child', 'Child'));
      assert.equal(await verifySession('invalid'), null);
    }
    process.env.JWT_SECRET = testSecret;
    const token = await createSession('child-a', 'child', 'Child');
    assert.equal((await verifySession(token))?.user_id, 'child-a');
    for (const payload of [{ user_id: 'child-a', role: 'admin', name: 'Child' }, { user_id: 'child-a', role: ['child'], name: 'Child' }, { role: 'child', name: 'Child' }]) {
      const malformed = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(testSecret));
      assert.equal(await verifySession(malformed), null);
    }
    const noExpiry = await new SignJWT({ user_id: 'child-a', role: 'child', name: 'Child' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().sign(new TextEncoder().encode(testSecret));
    assert.equal(await verifySession(noExpiry), null);
    process.env.JWT_SECRET = `${testSecret}-different`;
    assert.equal(await verifySession(token), null);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('private user APIs deny cross-account access before creating the database client', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = testSecret;
  try {
    const child = await createSession('child-a', 'child', 'Child');
    const parent = await createSession('parent-a', 'parent', 'Parent');
    let databaseCalls = 0;
    const forbiddenDatabase = () => { databaseCalls += 1; throw new Error('Database must not be accessed'); };
    for (const [route, writeMethod, body] of [
      ['location', 'POST', { userId: 'child-b', latitude: 1, longitude: 1 }],
      ['activity/location', 'POST', { user_id: 'child-b', latitude: 1, longitude: 1 }],
      ['activity', 'POST', { userId: 'child-b', eventType: 'page_view' }],
      ['stats', 'PUT', { userId: 'child-b', stats: {} }],
      ['pet', 'PUT', { userId: 'child-b', pet: {} }],
      ['notifications/subscribe', 'POST', { userId: 'child-b', subscription: {} }],
      ['pet/poll', 'POST', { userId: 'child-b', pollId: 'poll', question: 'Question', answer: 'Answer' }],
      ['stories', 'POST', { userId: 'child-b', segments: [] }],
      ['reading-log', 'POST', { userId: 'child-b', bookTitle: 'Book' }],
    ]) {
      const api = loadTs(`../src/app/api/${route}/route.ts`, {
        '@/lib/server/authorize-user': authorization,
        '@/lib/supabase/admin': { createAdminClient: forbiddenDatabase },
        '@supabase/supabase-js': { createClient: forbiddenDatabase },
        '@/lib/server/embeddings': {},
      });
      for (const token of [child, parent]) {
        assert.equal((await api[writeMethod](request(writeMethod, body, token))).status, 403, `${route} denies cross-account writes`);
      }
      assert.equal((await api[writeMethod](request(writeMethod, body, null, { 'x-user-id': 'child-b', 'x-user-role': 'parent' }))).status, 401, `${route} denies unsigned writes despite forged headers`);
      if (api.GET) {
        assert.equal((await api.GET(request('GET', null, child))).status, 403, `${route} denies child reading another child`);
        assert.equal((await api.GET(request('GET', null, null, { 'x-user-id': 'child-b', 'x-user-role': 'parent' }))).status, 401, `${route} ignores forged identity headers`);
      }
    }
    assert.equal(databaseCalls, 0);
    assert.equal(await authorization.authorizeUserRequest(request('GET', null, child), 'child-a'), null);
    assert.equal(await authorization.authorizeUserRequest(request('GET', null, parent), 'child-b', { allowParentRead: true }), null);
    assert.equal((await authorization.authorizeUserRequest(request('GET', null, child), 'child-b', { allowParentRead: true })).status, 403);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('pet generation refuses another account pet before memory reads, embeddings or AI', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = testSecret;
  try {
    const child = await createSession('child-a', 'child', 'Child');
    const parent = await createSession('parent-a', 'parent', 'Parent');
    let lookups = 0;
    let expensiveCalls = 0;
    const forbidden = () => { expensiveCalls++; throw new Error('Private/AI work must not run'); };
    authorizationDatabase = () => ({
      from(table) {
        lookups++;
        assert.equal(table, 'bub_pets');
        const filters = {};
        return {
          select(columns) { assert.equal(columns, 'id'); return this; },
          eq(column, value) { filters[column] = value; return this; },
          async maybeSingle() {
            assert.ok(filters.user_id, 'owner must be queried alongside pet ID');
            return { data: filters.id === 'pet-a' && filters.user_id === 'child-a' ? { id: 'pet-a' } : null, error: null };
          },
        };
      },
    });
    const deps = {
      '@/lib/server/authorize-user': authorization,
      '@supabase/supabase-js': { createClient: forbidden },
      '@/lib/custody-calendar': {}, '@/lib/safe-json': {}, '@/lib/gemini-thinking': {},
      '@/lib/chat-games': {}, '@/lib/server/pet-profile': {}, '@/lib/food-catalog': {},
      '@/lib/server/embeddings': { embedText: forbidden },
    };
    for (const route of ['pet/chat', 'pet/proactive', 'pet/food-adventure']) {
      const api = loadTs(`../src/app/api/${route}/route.ts`, deps, {
        process: { env: { GOOGLE_API_KEY: 'test-only' } }, fetch: forbidden,
      });
      assert.equal((await api.POST(request('POST', { petId: 'pet-b' }, child))).status, 404);
      assert.equal((await api.POST(request('POST', { petId: 'pet-a' }, parent))).status, 404, 'parent cannot write a child pet');
      const before = lookups;
      assert.equal((await api.POST(request('POST', { petId: 'pet-a' }, null, { 'x-user-id': 'child-a' }))).status, 401);
      assert.equal(lookups, before, 'unsigned requests do not even query ownership');
    }
    assert.equal(expensiveCalls, 0);
    assert.equal(await authorization.authorizePetRequest(request('POST', {}, child), 'pet-a'), null);
    assert.equal(await authorization.authorizePetRequest(request('POST', {}, child), null), null, 'new unsaved pet has no private DB state');
  } finally {
    authorizationDatabase = () => { throw new Error('Unexpected authorization DB access'); };
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

function fakeRowDatabase(tableName, rows) {
  const observations = { calls: 0, mutations: 0 };
  return {
    observations,
    client: {
      from(table) {
        observations.calls++;
        assert.equal(table, tableName);
        const filters = {};
        let update;
        let insert;
        let remove = false;
        const execute = () => {
          if (insert) {
            const created = { id: 'created-row', ...insert };
            rows.push(created);
            observations.mutations++;
            return [created];
          }
          const matching = rows.filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value));
          if (update) for (const row of matching) { Object.assign(row, update); observations.mutations++; }
          if (remove) for (const row of matching) { rows.splice(rows.indexOf(row), 1); observations.mutations++; }
          return matching;
        };
        return {
          select() { return this; }, order() { return this; },
          eq(column, value) { filters[column] = value; return this; },
          update(data) { update = data; return this; },
          insert(data) { insert = data; return this; },
          delete() { remove = true; return this; },
          async maybeSingle() { return { data: execute()[0] || null, error: null }; },
          async single() { return { data: execute()[0] || null, error: null }; },
          then(resolve) { return Promise.resolve({ data: execute(), error: null }).then(resolve); },
        };
      },
    },
  };
}

test('reading log PATCH uses signed owner in the mutation and cannot change another entry', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = testSecret;
  try {
    const child = await createSession('child-a', 'child', 'Child');
    const parent = await createSession('parent-a', 'parent', 'Parent');
    const rows = [{ id: 'book-a', user_id: 'child-a', status: 'wishlist' }, { id: 'book-b', user_id: 'child-b', status: 'wishlist' }];
    const db = fakeRowDatabase('bub_reading_log', rows);
    const api = loadTs('../src/app/api/reading-log/route.ts', {
      '@/lib/server/authorize-user': authorization,
      '@supabase/supabase-js': { createClient: () => db.client },
    });
    assert.equal((await api.PATCH(request('PATCH', { id: 'book-b', status: 'done', userId: 'child-b' }, child))).status, 404);
    assert.equal((await api.PATCH(request('PATCH', { id: 'book-a', status: 'done' }, parent))).status, 404);
    assert.equal(db.observations.mutations, 0);
    assert.equal((await api.PATCH(request('PATCH', { id: 'book-a', status: 'done' }, child))).status, 200);
    assert.equal(rows[0].status, 'done');
    assert.equal(rows[1].status, 'wishlist');
    const before = db.observations.calls;
    assert.equal((await api.PATCH(request('PATCH', { id: 'book-a', status: 'done' }, null))).status, 401);
    assert.equal(db.observations.calls, before);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('task routes preserve parent management and restrict children to their assigned completion state', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = testSecret;
  try {
    const child = await createSession('child-a', 'child', 'Child');
    const parent = await createSession('parent-a', 'parent', 'Parent');
    const rows = [{ id: 'task-a', assigned_to: 'child-a', title: 'Own', completed_at: null }, { id: 'task-b', assigned_to: 'child-b', title: 'Other', completed_at: null }];
    const db = fakeRowDatabase('bub_tasks', rows);
    const service = loadTs('../src/services/task.service.ts', { '@/lib/supabase/admin': { createAdminClient: () => db.client } });
    const deps = { '@/lib/server/authorize-user': authorization, '@/services/task.service': service };
    const single = loadTs('../src/app/api/tasks/[id]/route.ts', deps);
    const collection = loadTs('../src/app/api/tasks/route.ts', deps);
    const params = (id) => ({ params: Promise.resolve({ id }) });
    const childRead = await (await collection.GET(request('GET', null, child))).json();
    assert.deepEqual(childRead.data.map((row) => row.id), ['task-a']);
    const parentRead = await (await collection.GET(request('GET', null, parent))).json();
    assert.equal(parentRead.data.length, 2);
    for (const action of ['complete', 'uncomplete']) {
      assert.equal((await single.PATCH(request('PATCH', { action }, child), params('task-b'))).status, 404);
      assert.equal((await single.PATCH(request('PATCH', { action }, child), params('task-a'))).status, 200);
    }
    assert.equal(rows[1].completed_at, null);
    const mutations = db.observations.mutations;
    assert.equal((await single.PATCH(request('PATCH', { title: 'Changed' }, child), params('task-a'))).status, 403);
    assert.equal((await single.PATCH(request('PATCH', { action: 'complete', assigned_to: 'child-a' }, child), params('task-b'))).status, 403);
    assert.equal((await single.DELETE(request('DELETE', {}, child), params('task-a'))).status, 403);
    assert.equal((await collection.POST(request('POST', { title: 'Injected' }, child))).status, 403);
    assert.equal((await single.PATCH(request('PATCH', { assigned_to: 'child-a' }, parent), params('task-b'))).status, 400);
    assert.equal(db.observations.mutations, mutations);
    assert.equal((await single.PATCH(request('PATCH', { title: 'Parent edit' }, parent), params('task-b'))).status, 200);
    assert.equal(rows[1].title, 'Parent edit');
    assert.equal((await single.PATCH(request('PATCH', { action: 'complete' }, parent), params('task-b'))).status, 200);
    assert.ok(rows[1].completed_at);
    assert.equal((await single.DELETE(request('DELETE', {}, parent), params('task-b'))).status, 200);
    assert.deepEqual(rows.map((row) => row.id), ['task-a']);
    assert.equal((await collection.POST(request('POST', { title: 'Parent task', assigned_to: 'child-a', created_by: 'forged' }, parent))).status, 200);
    assert.equal(rows.at(-1).created_by, 'parent-a');
    assert.equal(rows.at(-1).assigned_to, 'child-a');
    const before = db.observations.calls;
    assert.equal((await single.PATCH(request('PATCH', { action: 'complete' }, null, { 'x-user-role': 'parent', 'x-user-id': 'parent-a' }), params('task-a'))).status, 401);
    assert.equal(db.observations.calls, before);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
