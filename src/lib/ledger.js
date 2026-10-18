// Ledger calendar dates always use the business timezone, independent of the browser.
export function ledgerDate(value = new Date()) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((p) => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function transactionRange(filter, start, end, today = ledgerDate()) {
  if (filter === 'Custom Date') return { start: start || '', end: end || '' };
  const days = { Today: 1, '30 Days': 30, '60 Days': 60, '90 Days': 90 }[filter];
  if (!days) return { start: '', end: '' };
  const first = new Date(`${today}T00:00:00Z`);
  first.setUTCDate(first.getUTCDate() - days + 1);
  return { start: first.toISOString().slice(0, 10), end: today };
}

export function isCreditTransaction(transaction) {
  return transactionDirection(transaction) === 1;
}

export function transactionDirection(transaction) {
  const type = String(transaction.transactionType || transaction.type || '').trim();
  if (/^(credit|income|money in|inflow|in)(\b|$)/i.test(type)) return 1;
  if (/^(debit|expense|money out|outflow|out)(\b|$)/i.test(type)) return -1;
  throw new Error(`Unrecognized transaction type: ${type || '(missing)'}. Totals cannot be confirmed.`);
}

// Add integer paisa rather than accumulating floating point rupee values.
export function moneyMinor(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') {
    throw new Error('A financial record is missing its amount. Totals cannot be confirmed.');
  }
  const amount = Number(value);
  const [coefficient, exponent = '0'] = Math.abs(amount).toString().split('e');
  const minor = Math.sign(amount) * Math.round(Number(`${coefficient}e${Number(exponent) + 2}`));
  if (!Number.isFinite(amount) || !Number.isSafeInteger(minor)) {
    throw new Error('A financial record has an invalid amount. Totals cannot be confirmed.');
  }
  return minor;
}

export function sumMoney(amounts) {
  return amounts.reduce((total, amount) => total + moneyMinor(amount), 0) / 100;
}

export function billAmount(bill) {
  const amount = bill.grand_total ?? bill.amount ?? bill.total ?? bill.total_amount;
  const minor = amount !== undefined && amount !== null ? moneyMinor(amount) :
    Array.isArray(bill.items) && bill.items.length ? bill.items.reduce((sum, item) =>
      sum + moneyMinor(item.total ?? Number(item.qty) * Number(item.rate)), 0) : moneyMinor(undefined);
  if (minor < 0) throw new Error('A bill has a negative amount. Totals cannot be confirmed.');
  return minor / 100;
}

export function summarizeTransactions(transactions, today = ledgerDate()) {
  let credit = 0, debit = 0, creditCount = 0, debitCount = 0, todayNet = 0;
  const accounts = { cash: 0, bank: 0, esewa: 0, khalti: 0, other: 0 };
  for (const transaction of transactions) {
    const minor = moneyMinor(transaction.amount);
    if (minor < 0) throw new Error('A transaction has a negative amount. Totals cannot be confirmed.');
    const direction = transactionDirection(transaction);
    if (direction === 1) { credit += minor; creditCount++; }
    else { debit += minor; debitCount++; }
    const account = String(transaction.account || '').trim().toLowerCase();
    accounts[Object.hasOwn(accounts, account) ? account : 'other'] += direction * minor;
    if (ledgerDate(transaction.date || transaction.createdAt) === today) todayNet += direction * minor;
  }
  return {
    count: transactions.length, creditCount, debitCount,
    creditTotal: credit / 100, debitTotal: debit / 100, netBalance: (credit - debit) / 100,
    ...Object.fromEntries(Object.entries(accounts).map(([key, value]) => [key, value / 100])),
    todayNet: todayNet / 100,
  };
}

export function statementSummary(transactions, filters = {}) {
  const summary = summarizeTransactions(filterTransactions(transactions, filters));
  const earlier = filters.start ? filterTransactions(transactions, {
    type: filters.type, search: filters.search,
  }).filter((transaction) => {
    const date = ledgerDate(transaction.date || transaction.createdAt);
    return date && date < filters.start;
  }) : [];
  const openingBalance = summarizeTransactions(earlier).netBalance;
  return { ...summary, openingBalance, closingBalance: sumMoney([openingBalance, summary.netBalance]) };
}

export function ledgerTime(value, fallback) {
  for (const candidate of [value, fallback]) {
    if (!candidate) continue;
    const clock = String(candidate).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (clock) {
      let hour = Number(clock[1]);
      const minute = Number(clock[2]), second = Number(clock[3] || 0);
      const period = clock[4]?.toUpperCase();
      if (minute > 59 || second > 59 || hour > (period ? 12 : 23) || (period && hour < 1)) continue;
      if (period) hour = hour % 12 + (period === 'PM' ? 12 : 0);
      return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
    }
    // Calendar dates contain no recorded time.
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(candidate))) continue;
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    }).format(date);
  }
  return '—';
}

export function ledgerTimestamp(date, time) {
  const formatted = ledgerTime(time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || formatted === '—') throw new Error('Please enter a valid date and time.');
  const [, hours, minutes, seconds, period] = formatted.match(/(\d{2}):(\d{2}):(\d{2}) (AM|PM)/);
  const hour = Number(hours) % 12 + (period === 'PM' ? 12 : 0);
  const timestamp = new Date(`${date}T${String(hour).padStart(2, '0')}:${minutes}:${seconds}+05:45`);
  if (Number.isNaN(timestamp.getTime()) || ledgerDate(timestamp) !== date) throw new Error('Please enter a valid date and time.');
  return timestamp.toISOString();
}

export function recordedBillTime(bill) {
  if (!bill) return '—';
  for (const value of [bill.print_time, bill.printTime, bill.bill_time, bill.time, bill.entryTime,
    bill.createdAt, bill.created_at, bill.bill_date, bill.date]) {
    const time = ledgerTime(value);
    if (time !== '—') return time;
  }
  return '—';
}

export function filterTransactions(transactions, { type = 'ALL', search = '', start = '', end = '' } = {}) {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (start && end && start > end) return [];
  return transactions.filter((t) => {
    const credit = isCreditTransaction(t);
    if ((type === 'CREDIT' && !credit) || (type === 'DEBIT' && credit)) return false;
    const date = ledgerDate(t.date || t.createdAt);
    if ((start || end) && (!date || (start && date < start) || (end && date > end))) return false;
    const text = [t.reference, t.description, t.enteredBy, t.account, t.transactionType, t.amount, date].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function extractRecords(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') throw new Error(`Invalid ${key} response`);
  if (payload.success === false) throw new Error(payload.message || `Unable to load ${key}`);
  if (Array.isArray(payload[key])) return payload[key];
  if (payload.data !== undefined) return extractRecords(payload.data, key);
  throw new Error(`Invalid ${key} response`);
}

export function buildBillItems(items) {
  if (!items.length) throw new Error('At least one item is required.');
  return items.map((item, index) => {
    const qty = Number(item.qty);
    const rate = Number(item.rate);
    if (!item.particular.trim() || !Number.isFinite(qty) || qty <= 0 || item.rate === '' || !Number.isFinite(rate) || rate < 0) {
      throw new Error(`Enter a description, positive quantity and valid rate for item ${index + 1}.`);
    }
    return { particular: item.particular.trim(), qty, rate, total: moneyMinor(qty * rate) / 100 };
  });
}
