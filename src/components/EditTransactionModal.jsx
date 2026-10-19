'use client';

import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiLayers,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import FormDialog from './FormDialog';
import { timeInputValue } from '@/lib/formFields';
import { transactionFormErrors } from '@/lib/transactionForm';
import { useAuth } from '@/hooks/useAuth';
import { isCreditTransaction, ledgerDate, ledgerTimestamp } from '@/lib/ledger';

const ROLE_ENTERED_BY_MAP = {
  admin: 'Admin',
  staff: 'Staff',
  accountant: 'Accountant',
};

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSave,
  onDelete,
}) {
  const { user } = useAuth({ redirectIfUnauthenticated: false });

  const [form, setForm] = useState({
    transactionType: 'Credit / Money In',
    date: '',
    account: 'Cash',
    role: 'admin',
    amount: '',
    reference: '',
    description: '',
    enteredBy: '',
    entryTime: '',
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fieldErrors = transactionFormErrors(form);
  const isIncomplete = Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    if (isOpen && transaction) {
      const d = ledgerDate(transaction.date || transaction.createdAt);
      const t = timeInputValue(transaction.entryTime, transaction.createdAt);

      const txRole = (transaction.role && ['admin', 'staff', 'accountant'].includes(transaction.role.toLowerCase()))
        ? transaction.role.toLowerCase()
        : 'admin';

      const timer = setTimeout(() => {
        setForm({
          transactionType: isCreditTransaction(transaction) ? 'Credit / Money In' : 'Debit / Money Out',
          date: d,
          account: transaction.account || 'Cash',
          role: txRole,
          amount: transaction.amount || '',
          reference: transaction.reference || '',
          description: transaction.description || '',
          enteredBy: transaction.enteredBy || ROLE_ENTERED_BY_MAP[txRole] || 'Admin',
          entryTime: t,
        });
        setError('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, transaction]);

  const handleRoleChange = (newRole) => {
    setForm((prev) => ({
      ...prev,
      role: newRole,
      enteredBy: ROLE_ENTERED_BY_MAP[newRole] || 'Admin',
    }));
  };

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || deleting) return;
    setError('');

    const [missingField, message] = Object.entries(fieldErrors)[0] || [];
    if (missingField) {
      setError(message);
      e.currentTarget.elements.namedItem(missingField)?.focus();
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...transaction,
        ...form,
        role: form.role,
        enteredBy: form.enteredBy.trim(),
        reference: form.reference.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        // Preserve the recorded instant if time was not edited. A changed clock
        // is interpreted on the selected business date in Nepal.
        entryTime: form.date === ledgerDate(transaction.date || transaction.createdAt) &&
          form.entryTime === timeInputValue(transaction.entryTime, transaction.createdAt) &&
          transaction.entryTime && !Number.isNaN(new Date(transaction.entryTime).getTime())
          ? transaction.entryTime : ledgerTimestamp(form.date, form.entryTime),
      });
      toast.success('Transaction updated successfully!');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update transaction.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setDeleting(true);
    try {
      await onDelete(transaction._id || transaction.id);
      toast.success('Transaction deleted successfully!');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete transaction.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <FormDialog label="Edit Transaction" onClose={onClose} busy={saving || deleting}>
      <div className="w-full max-w-xl rounded-3xl bg-white p-4 sm:p-7 shadow-2xl border border-[#CFE0F5] max-h-[calc(100dvh-2rem)] min-h-0 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E1EAF6] pb-4 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-[#072A44]">Edit Transaction</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update transaction details or remove entry
            </p>
          </div>
          <button
            type="button"
            disabled={saving || deleting}
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
              <div>
                <label htmlFor="edittransactionmodal-transactionType" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Transaction Type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="edittransactionmodal-transactionType"
                  name="transactionType"
                  value={form.transactionType}
                  onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] focus:outline-none focus:border-[#0B5ED7] cursor-pointer"
                >
                  <option value="Credit / Money In">Credit / Money In</option>
                  <option value="Debit / Money Out">Debit / Money Out</option>
                </select>
              </div>

              <div>
                <label htmlFor="edittransactionmodal-account" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Account <span className="text-rose-500">*</span>
                </label>
                <select
                  id="edittransactionmodal-account"
                  name="account"
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

              <div>
                <label htmlFor="edittransactionmodal-date" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edittransactionmodal-date"
                  name="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="edittransactionmodal-role" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5 flex items-center justify-between">
                  <span>Role</span>
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
                  id="edittransactionmodal-role"
                  name="role"
                  value={form.role}
                  disabled={user?.role?.toLowerCase() !== 'admin'}
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
                <label htmlFor="edittransactionmodal-amount" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edittransactionmodal-amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              <div>
                <label htmlFor="edittransactionmodal-reference" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edittransactionmodal-reference"
                  name="reference"
                  required
                  aria-invalid={Boolean(fieldErrors.reference)}
                  aria-describedby="edit-reference-error"
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="e.g. Sita Rai, Bill #102"
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
                <p id="edit-reference-error" className="mt-1 text-xs text-rose-600">{fieldErrors.reference}</p>
              </div>
            </div>

            <div>
              <label htmlFor="edittransactionmodal-description" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                Description / Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="edittransactionmodal-description"
                name="description"
                required
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby="edit-description-error"
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. House wiring service payment"
                className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
              />
              <p id="edit-description-error" className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="edittransactionmodal-enteredBy" className="block text-xs font-bold uppercase tracking-wider text-[#072A44]">
                    Entered By
                  </label>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Auto-filled: {ROLE_ENTERED_BY_MAP[form.role] || 'Admin'}
                  </span>
                </div>
                <input
                  id="edittransactionmodal-enteredBy"
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
                <label htmlFor="edittransactionmodal-entryTime" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Entry Time
                </label>
                <input
                  id="edittransactionmodal-entryTime"
                  name="entryTime"
                  type="time"
                  step="1"
                  required
                  value={form.entryTime}
                  onChange={(e) => setForm({ ...form, entryTime: e.target.value })}
                  placeholder="07:00:00 AM"
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#E1EAF6] shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition cursor-pointer"
            >
              <FiTrash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={saving || deleting}
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || deleting || isIncomplete}
                className="rounded-xl bg-[#0B5ED7] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0A4FB3] transition cursor-pointer flex items-center gap-1.5"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </FormDialog>
  );
}
