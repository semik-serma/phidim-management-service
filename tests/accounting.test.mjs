import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/lib/ledger.js', import.meta.url), 'utf8');
const ledger = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { billAmount, sumMoney, summarizeTransactions, statementSummary, filterTransactions, ledgerDate, ledgerTime, ledgerTimestamp, buildBillItems, recordedBillTime } = ledger;
const tx = (amount, transactionType = 'Credit / Money In', date = '2026-10-18', account = 'Cash') => ({ amount, transactionType, date, account });

test('dashboard totals count every transaction and reconcile credit minus debit exactly', () => {
  const records = [tx('1000.10'), tx('200.20', 'Credit'), tx('50.05', 'Debit'), tx('10.01', 'Debit / Money Out')];
  const summary = summarizeTransactions(records, '2026-10-18');
  assert.equal(summary.count, 4);
  assert.equal(summary.creditCount, 2);
  assert.equal(summary.debitCount, 2);
  assert.equal(summary.creditTotal, 1200.3);
  assert.equal(summary.debitTotal, 60.06);
  assert.equal(summary.netBalance, 1140.24);
  assert.equal(summary.cash, summary.netBalance);
  assert.equal(summary.todayNet, summary.netBalance);
  assert.equal(sumMoney([0.1, 0.2]), 0.3);
  assert.equal(sumMoney(Array(100).fill(0.1)), 10);
  assert.equal(sumMoney([10.075, 1.005]), 11.09);
});

test('statement totals include records beyond 5 or 30 displayed rows', () => {
  const records = [tx(500, 'Credit', '2026-10-17'), ...Array.from({ length: 40 }, (_, index) => tx(index + 1))];
  const summary = statementSummary(records, { start: '2026-10-18', end: '2026-10-18' });
  assert.equal(summary.count, 40);
  assert.equal(summary.openingBalance, 500);
  assert.equal(summary.creditTotal, 820);
  assert.equal(summary.debitTotal, 0);
  assert.equal(summary.closingBalance, 1320);
});

test('opening and closing balances apply the same search and direction as the statement', () => {
  const records = [
    { ...tx(100, 'Credit', '2026-10-17'), reference: 'Sita' },
    { ...tx(300, 'Credit', '2026-10-17'), reference: 'Other' },
    { ...tx(40, 'Debit', '2026-10-17'), reference: 'Sita' },
    { ...tx(20), reference: 'Sita' },
    { ...tx(10, 'Debit'), reference: 'Sita' },
    { ...tx(999, 'Credit', '2026-10-19'), reference: 'Sita' },
  ];
  const filters = { start: '2026-10-18', end: '2026-10-18', search: 'Sita' };
  assert.equal(statementSummary(records, filters).closingBalance, 70);
  const credits = statementSummary(records, { ...filters, type: 'CREDIT' });
  assert.equal(credits.openingBalance, 100);
  assert.equal(credits.creditTotal, 20);
  assert.equal(credits.closingBalance, 120);
  assert.equal(filterTransactions(records, filters).length, 2);
});

test('each account reconciles without treating Other as cash', () => {
  const records = ['Cash', 'Bank', 'Esewa', 'Khalti', 'Other'].flatMap((account) => [tx(100, 'Credit', '2026-10-18', account), tx(20, 'Debit', '2026-10-18', account)]);
  const summary = summarizeTransactions(records);
  for (const key of ['cash', 'bank', 'esewa', 'khalti', 'other']) assert.equal(summary[key], 80);
  assert.equal(sumMoney(['cash', 'bank', 'esewa', 'khalti', 'other'].map((key) => summary[key])), summary.netBalance);
});

test('invalid financial records produce errors rather than fabricated zero or debit totals', () => {
  for (const amount of [undefined, null, '', 'broken', NaN, Infinity, -10]) {
    assert.throws(() => summarizeTransactions([tx(amount)]));
  }
  assert.throws(() => summarizeTransactions([tx(10, 'Unknown')]));
  assert.equal(summarizeTransactions([tx(0)]).creditTotal, 0);
});

test('dashboard, bill list, and print use authoritative grand totals including zero', () => {
  assert.equal(billAmount({ grand_total: 0, amount: 999 }), 0);
  assert.equal(billAmount({ grand_total: '100.25', amount: 999 }), 100.25);
  assert.equal(billAmount({ total_amount: '50.10' }), 50.1);
  assert.equal(billAmount({ items: [{ qty: 3, rate: 0.1 }, { total: 1.2 }] }), 1.5);
  assert.equal(sumMoney([{ grand_total: 100.25 }, { grand_total: 0 }, { total_amount: 50.1 }].map(billAmount)), 150.35);
  assert.throws(() => billAmount({ grand_total: 'invalid' }));
  assert.throws(() => billAmount({}));
  assert.equal(buildBillItems([{ particular: 'Item', qty: 1, rate: 1.005 }])[0].total, 1.01);
});

test('Nepal clocks, midnight boundaries, and edited timestamps round trip across timezones', () => {
  assert.equal(ledgerDate('2026-10-17T18:20:00Z'), '2026-10-18');
  assert.equal(ledgerTime('2026-10-17T18:20:00Z'), '12:05:00 AM');
  assert.equal(ledgerTime('14:05'), '02:05:00 PM');
  assert.equal(ledgerTimestamp('2026-10-18', '12:05:00 AM'), '2026-10-17T18:20:00.000Z');
  assert.equal(ledgerTime(ledgerTimestamp('2026-10-18', '11:59:59 PM')), '11:59:59 PM');
  assert.equal(ledgerTime(undefined), '—');
  assert.equal(ledgerTime('2026-10-18'), '—');
  assert.equal(ledgerTime('invalid', '2026-10-17T18:20:00Z'), '12:05:00 AM');
  assert.throws(() => ledgerTimestamp('2026-10-18', '99:99'));
  assert.throws(() => ledgerTimestamp('2026-02-30', '10:00'));
});

test('printed times prefer the recorded transaction instant and never invent the current time', () => {
  assert.equal(recordedBillTime({ entryTime: '2026-10-17T18:20:00Z', createdAt: '2026-10-18T10:00:00Z' }), '12:05:00 AM');
  assert.equal(recordedBillTime({ bill_time: '14:05', createdAt: '2026-10-18T10:00:00Z' }), '02:05:00 PM');
  assert.equal(recordedBillTime({ bill_date: '2026-10-18' }), '—');
  assert.equal(recordedBillTime({ createdAt: '2026-10-18T00:00:00Z' }), '05:45:00 AM');
  assert.equal(recordedBillTime({ print_time: '08:00 PM', bill_time: '14:05' }), '08:00:00 PM');
});
