import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const source = await readFile(new URL('../backend-fixes/accounting.js', import.meta.url), 'utf8');
const { roundMoney, businessDate, parseBusinessDate, transactionTypeFilter } =
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('backend rounds bill lines and transaction amounts consistently with the UI', () => {
  assert.equal(roundMoney(1.005), 1.01);
  assert.equal(roundMoney(10.075), 10.08);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney('50.25'), 50.25);
  for (const amount of [undefined, null, '', 'invalid', -1, Infinity]) assert.throws(() => roundMoney(amount));
});

test('backend stores Nepal bill dates and times independently of server timezone', () => {
  const date = parseBusinessDate('2026-10-18', '12:05:00 AM');
  assert.equal(date.toISOString(), '2026-10-17T18:20:00.000Z');
  assert.equal(businessDate(date), '2026-10-18');
  assert.equal(parseBusinessDate('2026-10-17T18:20:00.000Z', '12:05 AM').toISOString(), date.toISOString());
  assert.equal(businessDate(parseBusinessDate('2027-01-01', '12:01 AM')), '2027-01-01');
  assert.throws(() => parseBusinessDate('2026-02-30', '10:00'));
  assert.throws(() => parseBusinessDate('2026-10-18', '99:99'));
});

test('Excel direction filters include both historical and current enum values', () => {
  assert.deepEqual(transactionTypeFilter('Credit'), { $in: ['Credit', 'Credit / Money In'] });
  assert.deepEqual(transactionTypeFilter('Debit'), { $in: ['Debit', 'Debit / Money Out'] });
  assert.throws(() => transactionTypeFilter('Unknown'));
});

const backend = new URL('../../backend/', import.meta.url);
const hasBackend = existsSync(new URL('src/utils/accounting.js', backend));

test('backend controllers save the same rounded money and Nepal timestamps that the dashboard displays', { skip: !hasBackend }, async () => {
  const actualHelper = await readFile(new URL('src/utils/accounting.js', backend), 'utf8');
  assert.equal(actualHelper.replaceAll('\r\n', '\n'), source.replaceAll('\r\n', '\n'));
  const shared = `import { roundMoney, businessDate, parseBusinessDate, transactionTypeFilter } from 'data:text/javascript;base64,${Buffer.from(actualHelper).toString('base64')}';\n`;
  const responses = `
    const successResponse = (_res, message, data, status = 200) => ({ message, data, status });
    const errorResponse = (_res, message, status = 500) => ({ message, status });
    const AdminLog = { create: async () => ({}) };
  `;
  const loadController = async (name, mocks) => {
    const controller = (await readFile(new URL(`src/controller/${name}`, backend), 'utf8')).replace(/^import .*;\r?\n/gm, '');
    return import(`data:text/javascript;base64,${Buffer.from(shared + responses + mocks + controller).toString('base64')}`);
  };
  const { createBill } = await loadController('billController.js', `
    const crypto = { randomInt: () => 123 };
    const Bill = { countDocuments: async () => 0, create: async (payload) => ({ _id: 'bill-id', ...payload }) };
  `);
  const result = await createBill({ user: { _id: 'user', role: 'staff' }, body: {
    project: 'Service', customer_name: 'Customer', phone_number: '9800000000', address: 'Phidim',
    items: [{ particular: 'Part A', qty: 1, rate: 1.005 }, { particular: 'Part B', qty: 1, rate: 1.005 }],
    bill_date: '2026-10-18', bill_time: '12:05 AM',
  } }, {});
  assert.equal(result.status, 201);
  assert.equal(result.data.grand_total, 2.02);
  assert.equal(result.data.items[0].total, 1.01);
  assert.equal(result.data.bill_date.toISOString(), '2026-10-17T18:20:00.000Z');
  const { createTransaction } = await loadController('transaction.controller.js', `
    const Transaction = { create: async (payload) => ({ _id: 'transaction-id', ...payload }) };
  `);
  const transaction = await createTransaction({ user: { _id: 'user', role: 'accountant' }, body: {
    transactionType: 'Credit / Money In', date: '2026-10-18', account: 'Cash', amount: 1.005,
  } }, {});
  assert.equal(transaction.status, 201);
  assert.equal(transaction.data.amount, 1.01);
  assert.equal(transaction.data.enteredBy, 'Accountant');
});
