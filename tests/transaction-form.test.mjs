import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/lib/transactionForm.js', import.meta.url), 'utf8');
const { transactionFormErrors, TRANSACTION_REQUIRED_FIELDS } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

for (const transactionType of ['Credit / Money In', 'Debit / Money Out']) {
  const complete = {
    transactionType, account: 'Cash', date: '2026-10-19', entryTime: '12:30:00',
    role: 'admin', amount: '125', reference: 'INV-100', enteredBy: 'Admin',
    description: 'Service payment',
  };

  test(`${transactionType}: amount alone cannot make the form valid`, () => {
    const errors = transactionFormErrors({ ...complete, reference: '', description: '' });
    assert.equal(errors.reference, 'Reference is required.');
    assert.equal(errors.description, 'Description / remarks is required.');
    assert.ok(Object.keys(errors).length > 0);
  });

  test(`${transactionType}: each field rejects empty and whitespace-only values`, () => {
    for (const field of Object.keys(TRANSACTION_REQUIRED_FIELDS)) {
      for (const missing of ['', '   ', '\t\n', undefined, null]) {
        assert.ok(transactionFormErrors({ ...complete, [field]: missing })[field], field);
      }
    }
    assert.deepEqual(transactionFormErrors(complete), {});
  });

  test(`${transactionType}: reference and description are independently mandatory`, () => {
    assert.deepEqual(Object.keys(transactionFormErrors({ ...complete, reference: '' })), ['reference']);
    assert.deepEqual(Object.keys(transactionFormErrors({ ...complete, description: '' })), ['description']);
    for (const amount of ['0', '-1', 'invalid', 'Infinity']) {
      assert.ok(transactionFormErrors({ ...complete, amount }).amount);
    }
  });
}
