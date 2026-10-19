export const TRANSACTION_REQUIRED_FIELDS = {
  transactionType: 'Transaction type',
  account: 'Account',
  date: 'Date',
  entryTime: 'Entry time',
  role: 'Role',
  amount: 'Amount',
  reference: 'Reference',
  enteredBy: 'Entered by',
  description: 'Description / remarks',
};

export function transactionFormErrors(form) {
  const errors = {};
  for (const [field, label] of Object.entries(TRANSACTION_REQUIRED_FIELDS)) {
    if (!String(form[field] ?? '').trim()) errors[field] = `${label} is required.`;
  }
  if (!errors.amount && (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0)) {
    errors.amount = 'Please enter a valid amount greater than 0.';
  }
  return errors;
}
