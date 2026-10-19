import { ledgerTime } from './ledger';

// Native time controls require a 24-hour clock; API values may use AM/PM.
export function timeInputValue(...args) {
  const [value, fallback] = args;
  const match = ledgerTime(args.length ? value : new Date(), fallback).match(/^(\d{2}):(\d{2}):(\d{2}) (AM|PM)$/);
  if (!match) return '';
  const hour = Number(match[1]) % 12 + (match[4] === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${match[2]}:${match[3]}`;
}
