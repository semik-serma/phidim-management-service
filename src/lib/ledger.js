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
  return /^(credit|income|money in|inflow|in)(\b|$)/i.test(String(transaction.transactionType || transaction.type || '').trim());
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
    return { particular: item.particular.trim(), qty, rate, total: Math.round(qty * rate * 100) / 100 };
  });
}
