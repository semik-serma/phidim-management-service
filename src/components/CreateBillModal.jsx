'use client';

import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiLayers,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createBill } from '@/lib/billApi';
import { useAuth } from '@/hooks/useAuth';

const QUICK_PROJECT_SUGGESTIONS = [
  '⚡ House Wiring',
  '🔌 Meter Setup',
  '🛠️ Maintenance & Repair',
  '💡 Lighting & Inverter',
  '📦 Hardware & Supply',
];

export default function CreateBillModal({ isOpen, onClose, onSuccess }) {
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
    bill_date: new Date().toISOString().split('T')[0],
    items: [{ particular: '', qty: 1, rate: '', total: 0 }],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentRole = (user?.role && ['admin', 'staff', 'accountant'].includes(user.role.toLowerCase()))
        ? user.role.toLowerCase()
        : 'admin';
      setBillForm((prev) => ({
        ...prev,
        role: currentRole,
      }));
    }
  }, [isOpen, user]);

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
      target.total = qty * rate;
      nextItems[index] = target;
      return { ...prev, items: nextItems };
    });
  };

  const grandTotal = billForm.items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!billForm.customer_name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!billForm.phone_number.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!billForm.items.length) {
      setError('At least one item is required.');
      return;
    }

    const finalRole = billForm.role || activeRole || 'admin';

    setSubmitting(true);
    try {
      const payload = {
        customer_name: billForm.customer_name.trim(),
        phone_number: billForm.phone_number.trim(),
        address: billForm.address.trim(),
        project: billForm.project.trim() || 'Service Work',
        role: finalRole,
        bill_date: billForm.bill_date,
        items: billForm.items.map((it) => ({
          particular: it.particular.trim(),
          qty: Number(it.qty) || 1,
          rate: Number(it.rate) || 0,
          total: (Number(it.qty) || 1) * (Number(it.rate) || 0),
        })),
        total_amount: grandTotal,
      };

      await createBill(payload);

      // Reset form
      setBillForm({
        customer_name: '',
        phone_number: '',
        address: '',
        project: '',
        role: activeRole,
        bill_date: new Date().toISOString().split('T')[0],
        items: [{ particular: '', qty: 1, rate: '', total: 0 }],
      });

      toast.success('Bill created successfully!');
      if (onSuccess) onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl border border-[#CFE0F5] my-8 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E1EAF6] pb-4 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-[#072A44]">Create Service Bill</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter customer details and bill line items
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 shrink-0">
            <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 overflow-y-auto pr-1">
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

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* Bill Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Bill Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={billForm.bill_date}
                  onChange={(e) =>
                    setBillForm({ ...billForm, bill_date: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm text-[#072A44] focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              {/* Creator Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5 flex items-center justify-between">
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
                  value={billForm.role}
                  onChange={(e) => setBillForm({ ...billForm, role: e.target.value })}
                  className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2.5 text-sm font-bold text-[#072A44] focus:outline-none focus:border-[#0B5ED7] cursor-pointer"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Address <span className="text-rose-500">*</span>
                </label>
                <input
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
                  Project / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#072A44]">
                  Bill Items & Particulars <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                >
                  <FiPlus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>

              <div className="rounded-xl border border-[#CFE0F5] overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_40px] gap-2 bg-[#EEF4FC] px-3 py-2 text-xs font-extrabold text-[#072A44]">
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
                      className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_40px] items-center gap-2 p-2.5 bg-white"
                    >
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1.5mm Wire / Switch"
                        value={item.particular}
                        onChange={(e) =>
                          handleItemChange(idx, 'particular', e.target.value)
                        }
                        className="w-full rounded-lg border border-[#CFE0F5] px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-[#0B5ED7]"
                      />

                      <input
                        type="number"
                        min="1"
                        required
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
                <div className="flex items-center justify-between bg-[#F8FAFD] px-4 py-3 border-t border-[#CFE0F5]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Total Bill Amount:
                  </span>
                  <span className="text-base font-extrabold text-[#0B5ED7]">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1EAF6] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#CFE0F5] bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#0B5ED7] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin" />
                  Creating Bill...
                </>
              ) : (
                <>
                  <FiCheckCircle className="h-4 w-4" />
                  Create Bill
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
