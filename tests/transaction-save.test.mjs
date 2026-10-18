import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = (source) => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const routeSource = await readFile(new URL('../src/app/api/backend/[...path]/route.js', import.meta.url), 'utf8');
const { POST, GET } = await load(routeSource);
const transactionSource = await readFile(new URL('../src/lib/transactionApi.js', import.meta.url), 'utf8');
const { createTransaction } = await load(transactionSource
  .replace("import { extractRecords } from './ledger';", '')
  .replace("import api from './api';", 'const api = { post: (...args) => globalThis.__transactionPost(...args) };'));

test('transaction saves reach the backend with body and Bearer auth, without stale cookies', async (t) => {
  const saved = { _id: 'saved-id', amount: 125, transactionType: 'Credit / Money In' };
  const payload = { ...saved, date: '2026-10-18', account: 'Cash', enteredBy: 'Admin' };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).pathname, '/transaction/create-transaction');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('authorization'), 'Bearer current-token');
    assert.equal(options.headers.has('cookie'), false);
    assert.deepEqual(JSON.parse(new TextDecoder().decode(options.body)), payload);
    assert.equal(options.cache, 'no-store');
    return Response.json({ success: true, data: saved }, { status: 201 });
  });
  const response = await POST(new Request('https://billing.example/api/backend/transaction/create-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer current-token', Cookie: 'jwt=true' },
    body: JSON.stringify(payload),
  }));
  assert.equal(response.status, 201);
  assert.deepEqual((await response.json()).data, saved);
});

test('cookie authentication, error status, and login cookies survive the proxy', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers.get('cookie'), 'jwt=session-token');
    return Response.json({ success: false, message: 'Not authorized' }, {
      status: 401, headers: { 'Set-Cookie': 'jwt=; Path=/; HttpOnly; Max-Age=0' },
    });
  });
  const response = await GET(new Request('https://billing.example/api/backend/auth/me', {
    headers: { Cookie: 'other=private; jwt=session-token' },
  }));
  assert.equal(response.status, 401);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.equal((await response.json()).success, false);
});

test('unavailable backend reports an unconfirmed save and never reports success', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('connection refused'); });
  const response = await POST(new Request('https://billing.example/api/backend/transaction/create-transaction', {
    method: 'POST', body: '{}',
  }));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).success, false);
});

test('exports retain filters, binary content, and download headers', async (t) => {
  const bytes = new Uint8Array([80, 75, 3, 4, 255]);
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(new URL(url).search, '?startDate=2026-10-18&account=Cash');
    return new Response(bytes, { headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="transactions.xlsx"',
    } });
  });
  const response = await GET(new Request('https://billing.example/api/backend/transaction/export/excel?startDate=2026-10-18&account=Cash'));
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  assert.match(response.headers.get('content-disposition'), /transactions.xlsx/);
});

test('creation requires a persisted ID and rejects false success responses', async () => {
  globalThis.__transactionPost = async (path, payload) => {
    assert.equal(path, '/transaction/create-transaction');
    assert.equal(payload.amount, 125);
    return { data: { success: true, data: { _id: 'saved-id', ...payload } } };
  };
  assert.equal((await createTransaction({ amount: '125' }))._id, 'saved-id');
  for (const data of [null, '<html>Not an API</html>', { success: true }, { success: true, data: null }]) {
    globalThis.__transactionPost = async () => ({ data });
    await assert.rejects(createTransaction({ amount: '125' }), /did not confirm/);
  }
  globalThis.__transactionPost = async () => ({ data: { success: false, message: 'Validation failed' } });
  await assert.rejects(createTransaction({ amount: '125' }), /Validation failed/);
  delete globalThis.__transactionPost;
});
