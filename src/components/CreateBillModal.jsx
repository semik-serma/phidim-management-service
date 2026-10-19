'use client';

import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
  FiPrinter,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import FormDialog from './FormDialog';
import { ledgerDate, ledgerTime, ledgerTimestamp, buildBillItems, moneyMinor, sumMoney } from '@/lib/ledger';
import { createBill } from '@/lib/billApi';
import { timeInputValue } from '@/lib/formFields';
import { useAuth } from '@/hooks/useAuth';

const QUICK_PROJECT_SUGGESTIONS = [
  '⚡ House Wiring',
  '🔌 Meter Setup',
  '🛠️ Maintenance & Repair',
  '💡 Lighting & Inverter',
  '📦 Hardware & Supply',
];

export default function CreateBillModal({ isOpen, onClose, onSuccess, onCreated }) {
  const { user } = useAuth({ redirectIfUnauthenticated: false });
  const activeRole = (user?.role && ['admin', 'staff', 'accountant'].includes(user.role.toLowerCase()))
    ? user.role.toLowerCase()
    : 'admin';

  const [billForm, setBillForm] = useState({
    customer_name: '',
    phone_number: '',
    address: '',
    project: '',
    role: activeRole,
    bill_date: ledgerDate(),
    bill_time: timeInputValue(),
    items: [{ particular: '', qty: 1, rate: '', total: 0 }],
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState('save');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentRole = activeRole;
      const now = new Date();
      const timer = setTimeout(() => {
        setError('');
        setBillForm((prev) => ({
          ...prev,
          role: currentRole,
          bill_date: ledgerDate(now),
          bill_time: timeInputValue(now),
        }));
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen, activeRole]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setBillForm((prev) => ({
      ...prev,
      items: [...prev.items, { particular: '', qty: 1, rate: '', total: 0 }],
    }));
  };

  const handleRemoveItem = (index) => {
    if (billForm.items.length <= 1) return;
    setBillForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setBillForm((prev) => {
      const nextItems = [...prev.items];
      const target = { ...nextItems[index], [field]: value };
      const qty = parseFloat(target.qty) || 0;
      const rate = parseFloat(target.rate) || 0;
      target.total = Number.isFinite(qty * rate) ? moneyMinor(qty * rate) / 100 : 0;
      nextItems[index] = target;
      return { ...prev, items: nextItems };
    });
  };

  const grandTotal = sumMoney(billForm.items.map((item) => item.total || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    const action = e.nativeEvent.submitter?.value || 'save';
    setSubmitAction(action);

    if (!billForm.customer_name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!billForm.phone_number.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!billForm.address.trim()) {
      setError('Customer address is required.');
      return;
    }
    if (!billForm.project.trim()) {
      setError('Project / purpose is required.');
      return;
    }
    if (!billForm.bill_date) {
      setError('Please select a bill date.');
      return;
    }
    let items;
    try { items = buildBillItems(billForm.items); }
    catch (error) { setError(error.message); return; }

    const finalRole = billForm.role || activeRole || 'admin';

    setSubmitting(true);
    try {
      const payload = {
        customer_name: billForm.customer_name.trim(),
        phone_number: billForm.phone_number.trim(),
        address: billForm.address.trim(),
        project: billForm.project.trim() || 'Service Work',
        role: finalRole,
        bill_date: ledgerTimestamp(billForm.bill_date, billForm.bill_time || '00:00'),
        bill_time: ledgerTime(billForm.bill_time),
        items,
        total_amount: Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100,
      };

      const res = await createBill(payload);
      const createdBill = { ...payload, ...(res?.bill || res?.data || res) };

      // Reset form
      const nowReset = new Date();
      setBillForm({
        customer_name: '',
        phone_number: '',
        address: '',
        project: '',
        role: activeRole,
        bill_date: ledgerDate(nowReset),
        bill_time: timeInputValue(nowReset),
        items: [{ particular: '', qty: 1, rate: '', total: 0 }],
      });

      toast.success('Bill created successfully!');
      if (onSuccess) Promise.resolve(onSuccess(createdBill, action === 'print')).catch(console.error);
      if (onCreated) Promise.resolve(onCreated(createdBill)).catch(console.error);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create bill.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog label="Create Service Bill" onClose={onClose} busy={submitting}>
      <div className="w-full max-w-2xl rounded-3xl bg-white p-4 sm:p-7 shadow-2xl border border-[#CFE0F5] max-h-[calc(100dvh-2rem)] min-h-0 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E1EAF6] pb-4 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-[#072A44]">Create Service Bill</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter customer details and bill line items
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 min-h-0 overflow-y-auto overscroll-contain pr-1">
          {/* SECTION 1: SELECTABLE OPTIONS */}
          <div className="rounded-2xl border border-blue-100 bg-[#F4F8FD] p-4.5 space-y-3.5">
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

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              {/* Bill Date */}
              <div>
                <label htmlFor="createbillmodal-bill_date" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Bill Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createbillmodal-bill_date"
                  name="bill_date"
                  type="date"
                  required
                  value={billForm.bill_date}
                  onChange={(e) =>
                    setBillForm({ ...billForm, bill_date: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              {/* Bill Time */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="createbillmodal-bill_time" className="block text-xs font-bold uppercase tracking-wider text-[#072A44]">
                    Bill Time
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nowTime = timeInputValue();
                      setBillForm((prev) => ({ ...prev, bill_time: nowTime }));
                    }}
                    className="text-[10px] font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                  >
                    Current
                  </button>
                </div>
                <input
                  id="createbillmodal-bill_time"
                  name="bill_time"
                  type="time"
                  step="1"
                  required
                  value={billForm.bill_time || ''}
                  onChange={(e) =>
                    setBillForm({ ...billForm, bill_time: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              {/* Creator Role */}
              <div>
                <label htmlFor="createbillmodal-role" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5 flex items-center justify-between">
                  <span>Role</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    billForm.role === 'staff'
                      ? 'bg-blue-100 text-blue-800'
                      : billForm.role === 'accountant'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {billForm.role === 'staff' ? '👤 Staff' : billForm.role === 'accountant' ? '💼 Accountant' : '👑 Admin'}
                  </span>
                </label>
                <select
                  id="createbillmodal-role"
                  name="role"
                  value={billForm.role}
                  disabled={activeRole !== 'admin'}
                  onChange={(e) => setBillForm({ ...billForm, role: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] focus:outline-none focus:border-[#0B5ED7] cursor-pointer disabled:bg-slate-50 disabled:opacity-80"
                >
                  <option value="admin">Administrator (Admin)</option>
                  <option value="staff">Staff Member (Staff)</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>
            </div>

            {/* Quick Project Selectors */}
            <div className="pt-1">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Quick Project / Purpose Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROJECT_SUGGESTIONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBillForm({ ...billForm, project: preset })}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      billForm.project === preset
                        ? 'bg-[#0B5ED7] text-white border-[#0B5ED7]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#0B5ED7] hover:text-[#0B5ED7]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: MANUALLY ENTERED FIELDS */}
          <div className="rounded-2xl border border-[#CFE0F5] bg-white p-4.5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#072A44] text-white text-[11px] font-bold">
                  <FiEdit3 className="h-3 w-3" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-[#072A44]">
                  Manually Entered Customer & Bill Details
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                Text & Quantity Inputs
              </span>
            </div>

            {/* Customer Info Grid */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="createbillmodal-customer_name" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createbillmodal-customer_name"
                  name="customer_name"
                  type="text"
                  required
                  placeholder="e.g. Ram Kumar Shrestha"
                  value={billForm.customer_name}
                  onChange={(e) =>
                    setBillForm({ ...billForm, customer_name: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              <div>
                <label htmlFor="createbillmodal-phone_number" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createbillmodal-phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  placeholder="e.g. 9841234567"
                  value={billForm.phone_number}
                  onChange={(e) =>
                    setBillForm({ ...billForm, phone_number: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="createbillmodal-address" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createbillmodal-address"
                  name="address"
                  type="text"
                  required
                  placeholder="e.g. Phidim-1, Panchthar"
                  value={billForm.address}
                  onChange={(e) =>
                    setBillForm({ ...billForm, address: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              <div>
                <label htmlFor="createbillmodal-project" className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Project / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  id="createbillmodal-project"
                  name="project"
                  type="text"
                  required
                  placeholder="e.g. Home Electrical Wiring / Meter Setup"
                  value={billForm.project}
                  onChange={(e) =>
                    setBillForm({ ...billForm, project: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#072A44]">
                    Bill Items & Particulars <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Enter each service or item manually
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                  >
                    <FiPlus className="h-3.5 w-3.5" /> + Blank Row
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#CFE0F5] overflow-x-auto">
                <div className="min-w-[540px] grid grid-cols-[2fr_1fr_1.2fr_1.2fr_40px] gap-2 bg-[#EEF4FC] px-3 py-2 text-xs font-extrabold text-[#072A44] rounded-t-xl">
                  <span>Particulars</span>
                  <span>Qty</span>
                  <span>Rate (Rs)</span>
                  <span className="text-right">Total (Rs)</span>
                  <span></span>
                </div>

                <div className="divide-y divide-[#E1EAF6]">
                  {billForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="min-w-[540px] grid grid-cols-[2fr_1fr_1.2fr_1.2fr_40px] items-center gap-2 p-2.5 bg-white relative"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          placeholder="Service or item description"
                          aria-label={`Particulars for item ${idx + 1}`}
                          name={`items[${idx}].particular`}
                          value={item.particular}
                          onChange={(e) => handleItemChange(idx, 'particular', e.target.value)}
                          className="w-full rounded-lg border border-[#CFE0F5] px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-[#0B5ED7]"
                        />
                      </div>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        aria-label={`Quantity for item ${idx + 1}`}
                        name={`items[${idx}].qty`}
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(idx, 'qty', e.target.value)
                        }
                        className="w-full rounded-lg border border-[#CFE0F5] px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-[#0B5ED7]"
                      />

                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        placeholder="0.00"
                        aria-label={`Rate for item ${idx + 1}`}
                        name={`items[${idx}].rate`}
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(idx, 'rate', e.target.value)
                        }
                        className="w-full rounded-lg border border-[#CFE0F5] px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-[#0B5ED7]"
                      />

                      <div className="text-right text-xs font-bold text-[#072A44] pr-2">
                        Rs. {(item.total || 0).toLocaleString()}
                      </div>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={billForm.items.length <= 1}
                          className="text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Delete item row"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Calculation Row */}
                <div className="flex items-center justify-between bg-[#F8FAFD] px-4 py-3 border-t border-[#CFE0F5] rounded-b-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Total Bill Amount:
                  </span>
                  <span className="text-base font-extrabold text-[#0B5ED7]">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Official Seal & Stamp Verification Banner */}
              <div className="rounded-xl border border-blue-100 bg-[#F4F8FD] p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/logo.png?v=4"
                      alt="Phidim Service Logo"
                      className="w-full h-full object-contain"
                      width={1254}
                      height={1254}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#072A44] flex items-center gap-1.5">
                      <span>Official Stamp & Authorized Signature</span>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Auto Attached</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Every service bill automatically carries the official Phidim stamp (Pokhara-6, Prithvichok) & authorized signature.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
                  <img
                    src="/signature_original.png?v=4"
                    alt="Authorized Signature & Stamp"
                    className="h-10 w-auto object-contain block"
                    width={1448}
                    height={1086}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#E1EAF6] shrink-0">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border-2 border-[#CFE0F5] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              name="action" value="save"
              className="flex items-center gap-1.5 rounded-xl border border-[#0B5ED7] bg-white px-4 py-2 text-xs font-bold text-[#0B5ED7] shadow-xs hover:bg-blue-50 transition cursor-pointer disabled:opacity-60"
            >
              <FiCheckCircle className="h-4 w-4" />
              {submitting && submitAction === 'save' ? 'Creating...' : 'Create Bill'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              name="action" value="print"
              className="flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-60"
            >
              {submitting && submitAction === 'print' ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin" />
                  Creating & Printing...
                </>
              ) : (
                <>
                  <FiPrinter className="h-4 w-4" />
                  Create & Print Bill
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </FormDialog>
  );
}
