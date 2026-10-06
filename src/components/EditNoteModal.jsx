'use client';

import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckSquare, FiEdit3, FiTrash2, FiX } from 'react-icons/fi';
import { deleteNote, updateNote } from '@/lib/noteApi';

export default function EditNoteModal({ isOpen, note, onClose, onSuccess, onDelete }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    tommorow_tasks: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setForm({
        title: note.title || '',
        content: note.content || '',
        tommorow_tasks: note.tommorow_tasks || '',
      });
      setError('');
    }
  }, [note]);

  if (!isOpen || !note) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim() && !form.content.trim() && !form.tommorow_tasks.trim()) {
      setError('Please provide at least one field to update.');
      return;
    }

    try {
      setLoading(true);
      const res = await updateNote(note._id || note.id, form);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Error updating note:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete note "${note.title}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteNote(note._id || note.id);
      if (onDelete) onDelete(note._id || note.id);
      onClose();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to delete note');
    } finally {
      setDeleting(false);
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
              <FiEdit3 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold tracking-wide">Edit Note</h3>
              <p className="text-[11px] text-blue-200">नोट सम्पादन गर्नुहोस्</p>
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
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-4 py-2.5 text-sm font-semibold text-[#072A44] focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 transition"
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
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white px-4 py-2.5 text-sm font-normal text-[#072A44] focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 transition resize-y"
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
              value={form.tommorow_tasks}
              onChange={(e) => setForm({ ...form, tommorow_tasks: e.target.value })}
              className="w-full rounded-xl border-2 border-blue-200 bg-blue-50/30 px-4 py-2.5 text-sm font-medium text-[#072A44] focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 transition resize-y"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
            >
              <FiTrash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Note'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || deleting}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B5ED7] px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] active:scale-[0.98] transition disabled:opacity-60"
              >
                <FiEdit3 className="h-4 w-4" />
                {loading ? 'Saving...' : 'Update Note'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
