'use client';

import { useState } from 'react';
import { FiAlertCircle, FiCheckSquare, FiFileText, FiPlus, FiX } from 'react-icons/fi';
import { createNote } from '@/lib/noteApi';

export default function CreateNoteModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    tommorow_tasks: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Please enter a note title.');
      return;
    }
    if (!form.content.trim()) {
      setError('Please enter note content.');
      return;
    }
    if (!form.tommorow_tasks.trim()) {
      setError("Please enter tomorrow's tasks.");
      return;
    }

    try {
      setLoading(true);
      const res = await createNote(form);
      setForm({ title: '', content: '', tommorow_tasks: '' });
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Error creating note:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#072A44] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD600] text-[#072A44] font-black">
              <FiFileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold tracking-wide">Create New Note</h3>
              <p className="text-[11px] text-blue-200">दैनिक नोट र भोलिका कार्यहरू थप्नुहोस्</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5">
              Note Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Daily Store Operations & Inventory Check"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-4 py-2.5 text-sm font-semibold text-[#072A44] placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5 flex items-center justify-between">
              <span>Today's Notes / Content <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">विस्तृत विवरण</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write your observations, notes, customer inquiries, issues, or transactions summary..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-4 py-2.5 text-sm font-normal text-[#072A44] placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 transition resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#0B5ED7]">
                <FiCheckSquare className="h-3.5 w-3.5" />
                Tomorrow's Tasks / Agenda <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">भोलिको कार्य</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. 1. Call Hari Sharma for meter supply&#10;2. Verify bank deposit&#10;3. Deliver bill #104..."
              value={form.tommorow_tasks}
              onChange={(e) => setForm({ ...form, tommorow_tasks: e.target.value })}
              className="w-full rounded-xl border-2 border-blue-200 bg-blue-50/30 px-4 py-2.5 text-sm font-medium text-[#072A44] placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 transition resize-y"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B5ED7] px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] active:scale-[0.98] transition disabled:opacity-60"
            >
              <FiPlus className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
