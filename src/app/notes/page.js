'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Noto_Sans } from 'next/font/google';
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckSquare,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiEdit3,
  FiFileText,
  FiHome,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { deleteNote, getNotes } from '@/lib/noteApi';
import UserAvatar from '@/components/UserAvatar';
import ProfileModal from '@/components/ProfileModal';
import CreateBillModal from '@/components/CreateBillModal';
import CreateNoteModal from '@/components/CreateNoteModal';
import EditNoteModal from '@/components/EditNoteModal';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const NAV = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Bill Entry', href: '/bills' },
      { label: 'Debit & Credit', href: '/transactions' },
      { label: 'Notes & Agenda', href: '/notes' },
    ],
  },
];

function toNepaliDigits(str) {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(str || '').replace(/[0-9]/g, (d) => nepaliDigits[Number(d)]);
}

function formatDateYMD(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatEnglishDate(dateObj) {
  const d = new Date(dateObj);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function formatNoteTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export default function NotesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isMakeBillOpen, setIsMakeBillOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Live Clock
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Notes
  async function fetchNotesList() {
    try {
      setLoading(true);
      setError('');
      const data = await getNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please check connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotesList();
    }
  }, [authLoading, user]);

  const userName = user?.full_name || user?.name || user?.email || 'User';

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
    const term = searchTerm.toLowerCase();
    return notes.filter((n) => {
      const titleMatch = (n.title || '').toLowerCase().includes(term);
      const contentMatch = (n.content || '').toLowerCase().includes(term);
      const tasksMatch = (n.tommorow_tasks || '').toLowerCase().includes(term);
      return titleMatch || contentMatch || tasksMatch;
    });
  }, [notes, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const todayStr = formatDateYMD(new Date());
    let todayCount = 0;
    let totalTasksCount = 0;

    notes.forEach((n) => {
      if (n.createdAt && formatDateYMD(n.createdAt) === todayStr) {
        todayCount++;
      }
      if (n.tommorow_tasks && n.tommorow_tasks.trim()) {
        const lines = n.tommorow_tasks.split('\n').filter((l) => l.trim().length > 0);
        totalTasksCount += lines.length;
      }
    });

    return {
      total: notes.length,
      today: todayCount,
      tasks: totalTasksCount,
      latestDate: notes[0]?.createdAt ? formatDisplayDate(notes[0].createdAt) : 'None',
    };
  }, [notes]);

  // Copy note to clipboard
  async function handleCopy(note) {
    const text = `📌 ${note.title}\n📅 Date: ${formatDisplayDate(note.createdAt)}\n\n📝 Notes:\n${note.content}\n\n✅ Tomorrow's Tasks:\n${note.tommorow_tasks}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(note._id || note.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy note:', err);
    }
  }

  // Quick delete from list
  async function handleDeleteNote(id) {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note');
    }
  }

  if (authLoading) {
    return (
      <div className={`${notoSans.className} min-h-screen flex items-center justify-center bg-[#F0F4FA]`}>
        <p className="text-base text-slate-500 font-semibold">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className={`${notoSans.className} min-h-screen flex bg-[#F0F4FA] text-[#0B1F3A]`}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-[215px] shrink-0 flex-col bg-[#072A44] text-white px-3 pt-5 pb-6 sticky top-0 h-screen">
        <div className="px-3 mb-6">
          <h1 className="text-lg font-extrabold tracking-wide">PHIDIM SERVICE</h1>
          <p className="text-[11px] text-blue-200 mt-0.5">Service • Supply • Solutions</p>
        </div>

        {NAV.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-3 mb-1.5 text-[11px] font-bold tracking-[0.12em] text-[#7CC0FF]">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = item.href === '/notes';
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-[15px] font-bold transition mb-1 ${
                    active
                      ? 'bg-[#0B5ED7] text-white'
                      : 'bg-transparent text-blue-100 hover:bg-[#0B5ED7]/60'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* User Profile in Sidebar */}
        <div className="mt-auto px-1 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="w-full flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-left transition cursor-pointer group"
            title="Click to view/update profile"
          >
            <UserAvatar user={user} size="sm" showBadge={true} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white group-hover:text-[#FFD600] transition">
                {userName}
              </p>
              <p className="truncate text-[10px] text-blue-200">
                {user?.email || 'Signed in'}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Yellow Top Navbar */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FFD600] px-5 py-3 sm:px-6 sm:py-3.5 shadow-sm">
          {/* Left Title */}
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight text-[#072A44]">
              daily-notes
            </span>
          </div>

          {/* Right Action & Info Pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Clock Pill */}
            <div className="flex items-center gap-1.5 rounded-xl bg-[#072A44] px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold tabular-nums text-[#FFD600] shadow-xs">
              <FiClock className="h-4 w-4 shrink-0 text-[#FFD600]" />
              <span>
                {now
                  ? new Intl.DateTimeFormat('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    }).format(now)
                  : '--:--:--'}
              </span>
            </div>

            {/* English Date Pill */}
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#072A44] shadow-xs select-none">
              EN • {formatEnglishDate(now || new Date())}
            </div>

            {/* Nepali Date Pill */}
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#072A44] shadow-xs select-none">
              नेपाली (AD) • {toNepaliDigits(formatDateYMD(now || new Date()))}
            </div>

            {/* Make Bill Button */}
            <button
              type="button"
              onClick={() => setIsMakeBillOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-[#0B5ED7] px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#0A4FB3] transition cursor-pointer"
            >
              <span>+ Make Bill</span>
            </button>

            {/* Create Note Button */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#072A44] border border-[#072A44] px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#FFD600] shadow-xs hover:bg-[#0B5ED7] hover:text-white hover:border-[#0B5ED7] transition cursor-pointer"
            >
              <FiPlus className="h-4 w-4 stroke-[3]" />
              <span>+ Create Note</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-5 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Top 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Notes
                </p>
                <p className="text-xl sm:text-2xl font-black text-[#072A44] mt-1">
                  {stats.total}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">रेकर्ड गरिएका नोटहरू</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0B5ED7]">
                <FiFileText className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  Today's Notes
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                  {stats.today}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">आज प्रविष्टि गरिएको</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiCalendar className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tomorrow's Tasks
                </p>
                <p className="text-xl sm:text-2xl font-black text-[#0B5ED7] mt-1">
                  {stats.tasks}
                </p>
                <p className="text-[11px] text-blue-500 mt-0.5">भोलिको कार्य सूची</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0B5ED7]">
                <FiCheckSquare className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  Latest Entry
                </p>
                <p className="text-sm sm:text-base font-extrabold text-[#072A44] mt-1 truncate">
                  {stats.latestDate}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">पछिल्लो अपडेट</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiClock className="h-5 w-5" />
              </span>
            </div>
          </div>

          {/* Search Bar & Actions Bar */}
          <div className="rounded-2xl bg-white p-4 border-2 border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes by title, details, or tomorrow's tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-9 py-2 text-sm font-semibold text-[#072A44] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchNotesList}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                title="Refresh notes list"
              >
                <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-[#0B5ED7]/20 hover:bg-[#0A4FB3] transition cursor-pointer"
              >
                <FiPlus className="h-4 w-4" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Notes Grid */}
          {loading && notes.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center border-2 border-slate-200">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0B5ED7] border-t-transparent mb-3" />
              <p className="text-sm font-bold text-slate-600">Loading notes from server...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center border-2 border-dashed border-slate-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0B5ED7] mx-auto mb-3">
                <FiBookOpen className="h-7 w-7" />
              </div>
              <h3 className="text-base font-extrabold text-[#072A44]">
                {searchTerm ? 'No matching notes found' : 'No notes recorded yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'Try searching with different keywords or clear the search filter.'
                  : 'Start by recording your daily store work, customer notes, and tomorrow’s tasks.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow hover:bg-[#0A4FB3] transition cursor-pointer"
              >
                <FiPlus className="h-4 w-4" />
                <span>+ Create Your First Note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredNotes.map((note) => {
                const noteId = note._id || note.id;
                const isCopied = copiedId === noteId;
                const taskLines = (note.tommorow_tasks || '')
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean);

                return (
                  <div
                    key={noteId}
                    className="flex flex-col rounded-2xl bg-white border-2 border-slate-200/90 hover:border-[#0B5ED7]/50 shadow-xs hover:shadow-md transition duration-200 overflow-hidden group"
                  >
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100/70 px-2 py-0.5 text-[11px] font-bold text-[#072A44]">
                            <FiCalendar className="h-3 w-3 text-[#0B5ED7]" />
                            {formatDisplayDate(note.createdAt)}
                          </span>
                          {note.createdAt && (
                            <span className="text-[11px] font-semibold text-slate-400">
                              {formatNoteTime(note.createdAt)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-extrabold text-[#072A44] leading-snug break-words">
                          {note.title}
                        </h3>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(note)}
                          className="rounded-lg p-2 text-slate-400 hover:text-[#0B5ED7] hover:bg-blue-50 transition cursor-pointer"
                          title="Copy note to clipboard"
                        >
                          {isCopied ? (
                            <FiCheck className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <FiCopy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNote(note);
                            setIsEditOpen(true);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:text-[#0B5ED7] hover:bg-blue-50 transition cursor-pointer"
                          title="Edit note"
                        >
                          <FiEdit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(noteId)}
                          className="rounded-lg p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete note"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body: Content */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Today's Details
                        </p>
                        <p className="text-sm text-slate-700 font-normal leading-relaxed whitespace-pre-line">
                          {note.content}
                        </p>
                      </div>

                      {/* Tomorrow's Tasks Highlight Box */}
                      <div className="mt-auto rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-3.5 border border-blue-200/80">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FiCheckSquare className="h-4 w-4 text-[#0B5ED7]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[#072A44]">
                            Tomorrow's Agenda (भोलिको कार्य)
                          </span>
                        </div>
                        {taskLines.length > 0 ? (
                          <ul className="space-y-1.5">
                            {taskLines.map((line, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs sm:text-sm font-semibold text-[#072A44]"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-[#0B5ED7] mt-1.5 shrink-0" />
                                <span className="flex-1 leading-snug">{line}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No tasks specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateNoteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newNote) => {
          setNotes((prev) => [newNote, ...prev]);
        }}
      />

      <EditNoteModal
        isOpen={isEditOpen}
        note={editingNote}
        onClose={() => {
          setIsEditOpen(false);
          setEditingNote(null);
        }}
        onSuccess={(updatedNote) => {
          setNotes((prev) =>
            prev.map((n) =>
              (n._id || n.id) === (updatedNote._id || updatedNote.id) ? updatedNote : n
            )
          );
        }}
        onDelete={(deletedId) => {
          setNotes((prev) => prev.filter((n) => (n._id || n.id) !== deletedId));
        }}
      />

      <CreateBillModal
        isOpen={isMakeBillOpen}
        onClose={() => setIsMakeBillOpen(false)}
        onCreated={() => {
          setIsMakeBillOpen(false);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
      />
    </div>
  );
}
