import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = (source) => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const ledgerSource = await readFile(new URL('../src/lib/ledger.js', import.meta.url), 'utf8');
const ledgerUrl = `data:text/javascript;base64,${Buffer.from(ledgerSource).toString('base64')}`;
const fieldsSource = await readFile(new URL('../src/lib/formFields.js', import.meta.url), 'utf8');
const { timeInputValue } = await load(fieldsSource.replace("'./ledger'", JSON.stringify(ledgerUrl)));
const { ledgerTimestamp, ledgerDate, buildBillItems } = await import(ledgerUrl);

test('native time inputs accept API clocks and Nepal timestamps, including noon and midnight', () => {
  assert.equal(timeInputValue('12:00:00 AM'), '00:00:00');
  assert.equal(timeInputValue('12:00:00 PM'), '12:00:00');
  assert.equal(timeInputValue('07:30:05 PM'), '19:30:05');
  assert.equal(timeInputValue('09:15'), '09:15:00');
  assert.equal(timeInputValue('2026-10-18T18:15:00Z'), '00:00:00');
  assert.equal(timeInputValue('invalid', '2026-10-18T18:15:00Z'), '00:00:00');
  assert.equal(timeInputValue(undefined, '2026-10-18T18:15:00Z'), '00:00:00');
  assert.equal(timeInputValue('invalid'), '');
});

test('edited date and native clock round trip to the selected business date', () => {
  const timestamp = ledgerTimestamp('2026-10-19', '00:15:30');
  assert.equal(timestamp, '2026-10-18T18:30:30.000Z');
  assert.equal(ledgerDate(timestamp), '2026-10-19');
  assert.equal(timeInputValue(timestamp), '00:15:30');
});

test('manual bill rows retain fractional quantities and zero rates', () => {
  assert.deepEqual(buildBillItems([
    { particular: ' Cable fitting ', qty: '0.5', rate: '125.50' },
    { particular: 'Included service', qty: '1', rate: '0' },
  ]), [
    { particular: 'Cable fitting', qty: 0.5, rate: 125.5, total: 62.75 },
    { particular: 'Included service', qty: 1, rate: 0, total: 0 },
  ]);
});
