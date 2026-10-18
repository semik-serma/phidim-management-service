// Read-only audit of the configured backend database. No document writes.
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const backend = new URL('../../backend/', import.meta.url);
const require = createRequire(new URL('package.json', backend));
const mongoose = require('mongoose');
require('dotenv').config({ path: fileURLToPath(new URL('.env', backend)), quiet: true });
const ledgerSource = await readFile(new URL('../src/lib/ledger.js', import.meta.url), 'utf8');
const { summarizeTransactions, billAmount, sumMoney, moneyMinor, ledgerDate } =
  await import(`data:text/javascript;base64,${Buffer.from(ledgerSource).toString('base64')}`);

try {
  if (!process.env.MONGO_DB_URI) throw new Error('Backend MONGO_DB_URI is not configured');
  await mongoose.connect(process.env.MONGO_DB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  const database = mongoose.connection.db;
  const [transactions, bills, transactionCount, billCount, transactionGroups, billGroups] = await Promise.all([
    database.collection('transactions').find({}, { projection: { _id: 0, amount: 1, transactionType: 1, account: 1, date: 1, createdAt: 1 } }).toArray(),
    database.collection('bills').find({}, { projection: { _id: 0, grand_total: 1, items: 1, bill_date: 1, createdAt: 1, status: 1 } }).toArray(),
    database.collection('transactions').countDocuments(),
    database.collection('bills').countDocuments(),
    database.collection('transactions').aggregate([{ $group: { _id: '$transactionType', count: { $sum: 1 }, total: { $sum: '$amount' } } }]).toArray(),
    database.collection('bills').aggregate([{ $group: { _id: null, total: { $sum: '$grand_total' } } }]).toArray(),
  ]);
  const summary = summarizeTransactions(transactions);
  const billTotal = sumMoney(bills.map(billAmount));
  const databaseCreditTotal = sumMoney(transactionGroups.filter((group) => ['Credit', 'Credit / Money In'].includes(group._id)).map((group) => group.total));
  const databaseDebitTotal = sumMoney(transactionGroups.filter((group) => ['Debit', 'Debit / Money Out'].includes(group._id)).map((group) => group.total));
  const databaseBillTotal = sumMoney(billGroups.map((group) => group.total));
  const mismatchedBillTotals = bills.filter((bill) => Array.isArray(bill.items) && bill.items.length &&
    moneyMinor(billAmount(bill)) !== moneyMinor(sumMoney(bill.items.map((item) => item.total ?? Number(item.qty) * Number(item.rate))))).length;
  const report = {
    readOnly: true,
    verifiedAt: new Date().toISOString(),
    transactionCount,
    fetchedTransactionCount: transactions.length,
    billCount,
    fetchedBillCount: bills.length,
    billTotal,
    ...summary,
    mismatchedBillTotals,
    transactionsMissingDate: transactions.filter((transaction) => !ledgerDate(transaction.date || transaction.createdAt)).length,
    countsMatch: transactionCount === transactions.length && billCount === bills.length,
    databaseCreditTotal,
    databaseDebitTotal,
    databaseBillTotal,
    databaseAggregatesMatch: databaseCreditTotal === summary.creditTotal && databaseDebitTotal === summary.debitTotal && databaseBillTotal === billTotal,
  };
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  // Do not print connection strings or driver error objects containing credentials.
  console.error(`Read-only accounting audit failed (${error.name}). No database records were changed.`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
