'use client';

import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiLayers,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import FormDialog from './FormDialog';
import { ledgerDate, ledgerTimestamp } from '@/lib/ledger';
import { createTransaction } from '@/lib/transactionApi';
import { timeInputValue } from '@/lib/formFields';
import { transactionFormErrors } from '@/lib/transactionForm';
import { useAuth } from '@/hooks/useAuth';

const ROLE_ENTERED_BY_MAP = {
  admin: 'Admin',
  staff: 'Staff',
  accountant: 'Accountant',
};

export default function CreateTransactionModal({ isOpen, onClose, onSuccess, user: propUser }) {
  const { user: authUser } = useAuth({ redirectIfUnauthenticated: false });
  const currentUser = propUser || authUser;
  const userRole = (currentUser?.role && ['admin', 'staff', 'accountant'].includes(currentUser.role.toLowerCase()))
    ? currentUser.role.toLowerCase()
    : 'admin';
  const defaultRole = userRole;
  const defaultEnteredBy = ROLE_ENTERED_BY_MAP[defaultRole] || 'Admin';

  const [form, setForm] = useState({
    transactionType: 'Credit / Money In',
    date: ledgerDate(),
    entryTime: timeInputValue(),
    account: 'Cash',
    role: defaultRole,
    amount: '',
    reference: '',
    description: '',
    enteredBy: defaultEnteredBy,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fieldErrors = transactionFormErrors(form);
  const isIncomplete = Object.keys(fieldErrors).length > 0;

  // Auto-fill enteredBy whenever modal opens or role changes
  useEffect(() => {
    if (isOpen) {
      const activeRole = userRole;
      const timer = setTimeout(() => {
        setError('');
        setForm((prev) => ({
          ...prev,
          date: ledgerDate(),
          entryTime: timeInputValue(),
          role: activeRole,
          enteredBy: ROLE_ENTERED_BY_MAP[activeRole] || 'Admin',
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, userRole]);

  const handleRoleChange = (newRole) => {
    setForm((prev) => ({
      ...prev,
      role: newRole,
      enteredBy: ROLE_ENTERED_BY_MAP[newRole] || 'Admin',
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    const [missingField, message] = Object.entries(fieldErrors)[0] || [];
    if (missingField) {
      setError(message);
      e.currentTarget.elements.namedItem(missingField)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        role: form.role,
        enteredBy: form.enteredBy.trim(),
        reference: form.reference.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        entryTime: ledgerTimestamp(form.date, form.entryTime),
      };
      const result = await createTransaction(payload);

      // Reset form
      setForm({
        transactionType: 'Credit / Money In',
        date: ledgerDate(),
        entryTime: timeInputValue(),
        account: 'Cash',
        role: defaultRole,
        amount: '',
        reference: '',
        description: '',
        enteredBy: defaultEnteredBy,
      });

      toast.success('Transaction created successfully!');
      if (onSuccess) Promise.resolve(onSuccess({ ...payload, ...(result?.transaction || result) })).catch(console.error);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create transaction.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog label="Create New Transaction" onClose={onClose} busy={submitting}>
      <div className="w-full max-w-xl rounded-3xl bg-white p-4 sm:p-7 shadow-2xl border border-[#CFE0F5] max-h-[calc(100dvh-2rem)] min-h-0 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E1EAF6] pb-4 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-[#072A44]">Create New Transaction</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record a cash, bank, or digital debit/credit entry. All fields are required.
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 shrink-0">
            <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 min-h-0 overflow-y-auto overscroll-contain pr-1">
          {/* SECTION 1: SELECTABLE OPTIONS */}
          <div className="rounded-2xl border border-blue-100 bg-[#F4F8FD] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0B5ED7] text-white text-[11px] font-bold">
                  <FiLayers className="h-3 w-3" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-[#0B5ED7]">
                  Selectable Options & Settings
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                Dropdowns & Pickers
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Transaction Type */}
              <div>
                <label htmlFor="createtransactionmodal-transactionType" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Transaction Type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="createtransactionmodal-transactionType"
                  name="transactionType"
                  required
                  value={form.transactionType}
                  onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] focus:outline-none focus:border-[#0B5ED7] cursor-pointer"
                >
                  <option value="Credit / Money In">Credit / Money In</option>
                  <option value="Debit / Money Out">Debit / Money Out</option>
                </select>
              </div>

              {/* Account */}
              <div>
                <label htmlFor="createtransactionmodal-account" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Account <span className="text-rose-500">*</span>
                </label>
                <select
                  id="createtransactionmodal-account"
                  name="account"
                  required
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] focus:outline-none focus:border-[#0B5ED7] cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Esewa">Esewa</option>
                  <option value="Khalti">Khalti</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="createtransactionmodal-date" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createtransactionmodal-date"
                  name="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              <div>
                <label htmlFor="transaction-entry-time" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Entry Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="transaction-entry-time"
                  name="entryTime"
                  type="time"
                  step="1"
                  required
                  value={form.entryTime}
                  onChange={(e) => setForm({ ...form, entryTime: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="createtransactionmodal-role" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5 flex items-center justify-between">
                  <span>Role <span className="text-rose-500">*</span></span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    form.role === 'staff'
                      ? 'bg-blue-100 text-blue-800'
                      : form.role === 'accountant'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {form.role === 'staff' ? '👤 Staff' : form.role === 'accountant' ? '💼 Accountant' : '👑 Admin'}
                  </span>
                </label>
                <select
                  id="createtransactionmodal-role"
                  name="role"
                  required
                  value={form.role}
                  disabled={userRole !== 'admin'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] focus:outline-none focus:border-[#0B5ED7] cursor-pointer disabled:bg-slate-50 disabled:opacity-80"
                >
                  <option value="admin">Administrator (Admin)</option>
                  <option value="staff">Staff</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: MANUALLY ENTERED FIELDS */}
          <div className="rounded-2xl border border-[#CFE0F5] bg-white p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#072A44] text-white text-[11px] font-bold">
                  <FiEdit3 className="h-3 w-3" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-[#072A44]">
                  Manually Entered Details
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                Text & Amount Inputs
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="createtransactionmodal-amount" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createtransactionmodal-amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              <div>
                <label htmlFor="createtransactionmodal-reference" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createtransactionmodal-reference"
                  name="reference"
                  aria-invalid={Boolean(fieldErrors.reference)}
                  aria-describedby="create-reference-error"
                  type="text"
                  required
                  placeholder="Bill #, Customer, Supplier"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7]"
                />
                <p id="create-reference-error" className="mt-1 text-xs text-rose-600">{fieldErrors.reference}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="createtransactionmodal-enteredBy" className="block text-xs font-bold uppercase tracking-wider text-[#072A44]">
                  Entered By <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Auto-filled: {ROLE_ENTERED_BY_MAP[form.role] || 'Admin'}
                </span>
              </div>
              <input
                  id="createtransactionmodal-enteredBy"
                  name="enteredBy"
                type="text"
                required
                value={form.enteredBy}
                onChange={(e) => setForm({ ...form, enteredBy: e.target.value })}
                placeholder="Admin / Staff / Accountant"
                className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
              />
            </div>

            <div>
              <label htmlFor="createtransactionmodal-description" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                Description / Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                  id="createtransactionmodal-description"
                  name="description"
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby="create-description-error"
                rows="2"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add notes about this transaction..."
                className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7]"
              />
              <p id="create-description-error" className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1EAF6] shrink-0">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border-2 border-[#CFE0F5] bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isIncomplete}
              className="flex items-center gap-2 rounded-xl bg-[#0B5ED7] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheckCircle className="h-4 w-4" />
                  Save Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </FormDialog>
  );
}
