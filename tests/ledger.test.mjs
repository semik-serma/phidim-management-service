import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Load the dependency-free helper without changing the Next.js package module type.
const source = await readFile(new URL('../src/lib/ledger.js', import.meta.url), 'utf8');
const { ledgerDate, transactionRange, filterTransactions, extractRecords, buildBillItems } =
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('calendar dates are preserved and timestamps cross midnight in Nepal', () => {
  assert.equal(ledgerDate('2026-10-16'), '2026-10-16');
  assert.equal(ledgerDate('2026-10-15T18:30:00Z'), '2026-10-16');
  assert.equal(ledgerDate('invalid'), '');
});

test('today and rolling ranges follow the current date, with inclusive boundaries', () => {
  for (const [filter, start] of [['Today', '2026-10-16'], ['30 Days', '2026-09-17'], ['60 Days', '2026-08-18'], ['90 Days', '2026-07-19']]) {
    assert.deepEqual(transactionRange(filter, '', '', '2026-10-16'), { start, end: '2026-10-16' });
  }
});

const transactions = [
  { _id: 'new', date: '2026-10-16', transactionType: 'Credit / Money In', description: 'House wiring', reference: 'Sita Rai', amount: 100 },
  { _id: 'debit', date: '2026-10-16', transactionType: 'Debit / Money Out', amount: 50 },
  { _id: 'old', date: '2026-09-17', transactionType: 'Credit', amount: 10 },
  { _id: 'outside', date: '2026-09-16', transactionType: 'Credit', amount: 20 },
  { _id: 'future', date: '2026-10-17', transactionType: 'Credit', amount: 30 },
];

test('newly created transactions are visible today and type filters compose with dates', () => {
  const range = transactionRange('Today', '', '', '2026-10-16');
  assert.deepEqual(filterTransactions(transactions, range).map((t) => t._id), ['new', 'debit']);
  assert.deepEqual(filterTransactions(transactions, { ...range, type: 'DEBIT' }).map((t) => t._id), ['debit']);
  assert.deepEqual(filterTransactions(transactions, { ...range, type: 'CREDIT', search: 'sita wiring' }).map((t) => t._id), ['new']);
});

test('rolling ranges include their first day and exclude older and future records', () => {
  const range = transactionRange('30 Days', '', '', '2026-10-16');
  assert.deepEqual(filterTransactions(transactions, range).map((t) => t._id), ['new', 'debit', 'old']);
});

test('custom ranges support inclusive boundaries, open ends and reject reversed ranges', () => {
  assert.equal(filterTransactions(transactions, { start: '2026-10-16', end: '2026-10-16' }).length, 2);
  assert.equal(filterTransactions(transactions, { start: '2026-10-17' }).length, 1);
  assert.equal(filterTransactions(transactions, { start: '2026-10-17', end: '2026-10-16' }).length, 0);
});

test('API list envelopes retain records and malformed responses surface errors', () => {
  for (const key of ['bills', 'transactions']) {
    for (const response of [transactions, { [key]: transactions }, { data: transactions }, { data: { [key]: transactions } }]) {
      assert.deepEqual(extractRecords(response, key), transactions);
    }
    assert.deepEqual(extractRecords({ [key]: [] }, key), []);
    assert.throws(() => extractRecords({ message: 'Broken response' }, key));
    assert.throws(() => extractRecords({ success: false, message: 'Denied' }, key), /Denied/);
  }
});

test('bill quantities and rates are validated without silently replacing zero quantities', () => {
  const item = { particular: ' Wire ', qty: 3, rate: 0.1 };
  assert.deepEqual(buildBillItems([item]), [{ particular: 'Wire', qty: 3, rate: 0.1, total: 0.3 }]);
  for (const change of [{ particular: '' }, { qty: 0 }, { qty: -1 }, { qty: 'bad' }, { rate: '' }, { rate: -1 }, { rate: Infinity }]) {
    assert.throws(() => buildBillItems([{ ...item, ...change }]));
  }
  assert.throws(() => buildBillItems([]));
  assert.equal(buildBillItems([{ ...item, rate: 0 }])[0].total, 0);
});
