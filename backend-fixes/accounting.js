// Backend companion to the frontend accounting fixes. Applied by accounting.patch.
export function roundMoney(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') throw new Error('Amount is required');
  const amount = Number(value);
  const [coefficient, exponent = '0'] = Math.abs(amount).toString().split('e');
  const minor = Math.sign(amount) * Math.round(Number(`${coefficient}e${Number(exponent) + 2}`));
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(minor)) throw new Error('Amount must be a finite, non-negative number');
  return minor / 100;
}

export function businessDate(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function parseBusinessDate(value, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid bill date');
    return date;
  }
  const clock = String(time || '00:00').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!clock) throw new Error('Invalid bill time');
  let hour = Number(clock[1]);
  const minute = Number(clock[2]), second = Number(clock[3] || 0), period = clock[4]?.toUpperCase();
  if (hour > (period ? 12 : 23) || (period && hour < 1) || minute > 59 || second > 59) throw new Error('Invalid bill time');
  if (period) hour = hour % 12 + (period === 'PM' ? 12 : 0);
  const date = new Date(`${value}T${String(hour).padStart(2, '0')}:${clock[2]}:${String(second).padStart(2, '0')}+05:45`);
  if (Number.isNaN(date.getTime()) || businessDate(date) !== value) throw new Error('Invalid bill date');
  return date;
}

export function transactionTypeFilter(type) {
  if (String(type).toLowerCase() === 'credit') return { $in: ['Credit', 'Credit / Money In'] };
  if (String(type).toLowerCase() === 'debit') return { $in: ['Debit', 'Debit / Money Out'] };
  throw new Error('Invalid transaction type filter');
}
