'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Noto_Sans } from 'next/font/google';
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiBookOpen,
  FiCheckSquare,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiPlus,
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { getAllBills } from '@/lib/billApi';
import { getTransactions } from '@/lib/transactionApi';
import { getNotes } from '@/lib/noteApi';
import UserAvatar from '@/components/UserAvatar';
import ProfileModal from '@/components/ProfileModal';
import CreateBillModal from '@/components/CreateBillModal';
import CreateTransactionModal from '@/components/CreateTransactionModal';
import CreateNoteModal from '@/components/CreateNoteModal';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.bills)) return payload.data.bills;
  if (Array.isArray(payload?.bills)) return payload.bills;
  return [];
}

function normalizeBill(bill, index) {
  const id = bill.id || bill._id || bill.bill_id || bill.billId || `BILL-${index + 1}`;
  return {
    ...bill,
    id,
    reference: bill.bill_no || bill.billNo || bill.number || bill.reference || id,
    customer: bill.customer || bill.customer_name || bill.customerName || bill.name || '-',
    amount: Number(bill.amount || bill.total || bill.total_amount || bill.grand_total || 0),
    date: bill.date || bill.bill_date || bill.created_at || bill.createdAt || '',
  };
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'U'
  );
}

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

export default function DashboardPage() {
  const { user, loading, logout, updatePicture } = useAuth();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMakeBillOpen, setIsMakeBillOpen] = useState(false);
  const [isNewTransOpen, setIsNewTransOpen] = useState(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);

  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billsError, setBillsError] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [transLoading, setTransLoading] = useState(true);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  const [now, setNow] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(timer);
    };
  }, []);

  const loadData = async () => {
    // Load Bills
    setBillsError('');
    try {
      const data = await getAllBills();
      setBills(extractList(data).map(normalizeBill));
    } catch (error) {
      setBillsError(error.response?.data?.message || error.message || 'Unable to load bills.');
    } finally {
      setBillsLoading(false);
    }

    // Load Transactions
    try {
      const txData = await getTransactions();
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (error) {
      console.error('Error fetching transactions on dashboard:', error);
    } finally {
      setTransLoading(false);
    }

    // Load Notes
    try {
      const notesData = await getNotes();
      setNotes(Array.isArray(notesData) ? notesData : []);
    } catch (error) {
      console.error('Error fetching notes on dashboard:', error);
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push('/');
    }
  }

  if (loading) {
    return (
      <div className={`${notoSans.className} min-h-screen flex items-center justify-center bg-[#F0F4FA]`}>
        <p className="text-base text-slate-500 font-semibold">Loading dashboard...</p>
      </div>
    );
  }
  if (!user) return null;

  const userName = user.full_name || user.name || user.email || 'User';
  const userPicture = user.picture || user.avatar || user.profile_picture || '';

  // Calculate totals
  const totalBillsAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

  let creditTotal = 0;
  let debitTotal = 0;
  transactions.forEach((t) => {
    const amt = Number(t.amount || 0);
    if (t.transactionType?.toLowerCase().includes('credit')) {
      creditTotal += amt;
    } else {
      debitTotal += amt;
    }
  });
  const netBalance = creditTotal - debitTotal;

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
              const active = item.href === '/dashboard';
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
                {user.email || 'Signed in'}
              </p>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Yellow top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FFD600] px-6 py-4">
          <h2 className="text-xl font-extrabold text-[#072A44]">Dashboard</h2>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-[#072A44] px-4 py-2 text-base font-extrabold tabular-nums text-[#FFD600] shadow min-w-[140px] text-center">
              {now ? formatTime(now) : '--:--:--'}
            </span>

            <button
              type="button"
              onClick={() => setIsMakeBillOpen(true)}
              className="rounded-xl bg-[#0B5ED7] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] transition cursor-pointer"
            >
              + Make Bill
            </button>

            <button
              type="button"
              onClick={() => setIsNewTransOpen(true)}
              className="rounded-xl border-2 border-[#072A44] bg-[#072A44] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#0A4FB3] hover:border-[#0A4FB3] transition cursor-pointer"
            >
              + New Transaction
            </button>

            <button
              type="button"
              onClick={() => setIsNewNoteOpen(true)}
              className="rounded-xl border-2 border-[#072A44] bg-[#072A44] px-4 py-2 text-sm font-bold text-[#FFD600] shadow hover:bg-[#0B5ED7] hover:text-white hover:border-[#0B5ED7] transition cursor-pointer"
            >
              + Add Note
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-1.5 shadow hover:shadow-md hover:ring-2 hover:ring-[#072A44]/20 transition cursor-pointer text-left group"
              title="Click to view/update profile picture"
            >
              <UserAvatar user={user} size="sm" showBadge={true} />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#072A44] group-hover:text-[#0B5ED7] transition leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border-2 border-[#072A44] bg-white px-4 py-2 text-sm font-bold text-[#072A44] hover:bg-[#072A44] hover:text-white transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden gap-2 overflow-x-auto border-b border-[#CFE0F5] bg-white px-4 py-2.5">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0B5ED7] px-3 py-1.5 text-xs font-bold text-white"
          >
            <FiHome /> Dashboard
          </Link>
          <Link
            href="/bills"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#CFE0F5] px-3 py-1.5 text-xs font-bold text-[#072A44]"
          >
            <FiFileText /> Bills
          </Link>
          <Link
            href="/transactions"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#CFE0F5] px-3 py-1.5 text-xs font-bold text-[#072A44]"
          >
            <FiCreditCard /> Transactions
          </Link>
        </div>

        <main className="flex-1 p-6 space-y-6">
          {/* Scope Indicator */}
          <div className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs ${
            user?.role === 'staff'
              ? 'border-blue-200 bg-blue-50/80 text-blue-950'
              : user?.role === 'accountant'
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
              : 'border-amber-200 bg-amber-50/80 text-amber-950'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-white font-black text-xs ${
                user?.role === 'staff'
                  ? 'bg-blue-600'
                  : user?.role === 'accountant'
                  ? 'bg-emerald-600'
                  : 'bg-amber-500'
              }`}>
                {user?.role === 'staff' ? '👤' : user?.role === 'accountant' ? '💼' : '👑'}
              </span>
              <div>
                <span className="font-extrabold">
                  {user?.role === 'staff'
                    ? 'Staff Workspace Access'
                    : user?.role === 'accountant'
                    ? 'Accountant Ledger Access'
                    : 'System Administrator Access'}
                </span>
                <span className="text-slate-600 block text-[11px]">
                  {user?.role === 'staff'
                    ? 'Staff permissions active for service billing and transaction tracking.'
                    : user?.role === 'accountant'
                    ? 'Financial ledger, accounts, and debit/credit reconciliation access.'
                    : 'Full system visibility enabled. All billing and transaction records across the system are accessible.'}
                </span>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold bg-white text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
              ROLE: {user?.role || 'ADMIN'}
            </span>
          </div>

          {/* Quick Metrics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E1EAF6]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bills</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0B5ED7]">
                  <FiFileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#072A44]">{bills.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                Amount: Rs. {totalBillsAmount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E1EAF6]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transactions
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FiCreditCard className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#072A44]">{transactions.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                Connected with /transaction
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E1EAF6]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Money In</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FiArrowDownLeft className="h-4 w-4 stroke-[3]" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                Rs. {creditTotal.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Total Credits recorded</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E1EAF6]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#072A44]">Net Balance</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFD600]/20 text-[#072A44] font-bold text-xs">
                  Rs
                </span>
              </div>
              <p className={`mt-2 text-3xl font-extrabold ${netBalance >= 0 ? 'text-[#072A44]' : 'text-rose-600'}`}>
                Rs. {netBalance.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Debits: Rs. {debitTotal.toLocaleString()}
              </p>
            </div>
          </section>

          {/* Grid with Recent Bills & Recent Transactions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bills Section */}
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#E1EAF6]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-[#072A44]">Recent Bills</h3>
                <Link
                  href="/bills"
                  className="text-xs font-bold text-[#0B5ED7] hover:underline"
                >
                  View All Bills &rarr;
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-[#E1EAF6]">
                <div className="grid grid-cols-[1.2fr_1.5fr_1fr] gap-2 bg-[#EEF4FC] px-4 py-2.5 text-xs font-extrabold text-[#072A44]">
                  <span>Bill No.</span>
                  <span>Customer</span>
                  <span className="text-right">Amount</span>
                </div>

                {billsLoading && (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">Loading bills...</p>
                )}
                {!billsLoading && billsError && (
                  <p className="px-4 py-8 text-center text-xs text-rose-600">{billsError}</p>
                )}
                {!billsLoading && !billsError && bills.length === 0 && (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">No bills found.</p>
                )}

                {!billsLoading &&
                  !billsError &&
                  bills.slice(0, 5).map((bill) => (
                    <div
                      key={bill.id}
                      className="grid grid-cols-[1.2fr_1.5fr_1fr] items-center gap-2 border-t border-[#E1EAF6] px-4 py-3 text-xs"
                    >
                      <span className="font-semibold">{bill.reference}</span>
                      <span className="truncate">{bill.customer}</span>
                      <span className="font-bold text-right">Rs. {bill.amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </section>

            {/* Transactions Section */}
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#E1EAF6]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-[#072A44]">Recent Transactions</h3>
                <Link
                  href="/transactions"
                  className="text-xs font-bold text-[#0B5ED7] hover:underline"
                >
                  Manage Transactions &rarr;
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-[#E1EAF6]">
                <div className="grid grid-cols-[1.2fr_1fr_1.2fr] gap-2 bg-[#EEF4FC] px-4 py-2.5 text-xs font-extrabold text-[#072A44]">
                  <span>Reference</span>
                  <span>Account</span>
                  <span className="text-right">Amount</span>
                </div>

                {transLoading && (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">Loading transactions...</p>
                )}
                {!transLoading && transactions.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-slate-500">
                    <p>No transactions recorded yet.</p>
                    <Link
                      href="/transactions"
                      className="mt-2 inline-block font-bold text-[#0B5ED7] hover:underline"
                    >
                      + Create first transaction
                    </Link>
                  </div>
                )}

                {!transLoading &&
                  transactions.slice(0, 5).map((tx) => {
                    const id = tx._id || tx.id;
                    const isCredit = tx.transactionType?.toLowerCase().includes('credit');
                    return (
                      <div
                        key={id}
                        className="grid grid-cols-[1.2fr_1fr_1.2fr] items-center gap-2 border-t border-[#E1EAF6] px-4 py-3 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-bold text-[#072A44] block truncate">
                            {tx.reference || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(tx.date)}
                          </span>
                        </div>
                        <div>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {tx.account || 'Cash'}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-right ${
                            isCredit ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isCredit ? '+' : '-'} Rs. {Number(tx.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>

          {/* Daily Notes & Agenda Section */}
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-[#E1EAF6]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0B5ED7]">
                  <FiBookOpen className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-[#072A44]">Daily Notes & Agenda</h3>
                  <p className="text-xs text-slate-500">दैनिक टिपोट र भोलिका प्राथमिकता कार्यहरू</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewNoteOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#072A44] px-3.5 py-1.5 text-xs font-bold text-[#FFD600] hover:bg-[#0B5ED7] hover:text-white transition cursor-pointer"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  <span>+ Add Note</span>
                </button>
                <Link
                  href="/notes"
                  className="text-xs font-bold text-[#0B5ED7] hover:underline"
                >
                  View All Notes ({notes.length}) &rarr;
                </Link>
              </div>
            </div>

            {notesLoading ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">Loading notes...</p>
            ) : notes.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-xs text-slate-500">No notes recorded yet.</p>
                <button
                  type="button"
                  onClick={() => setIsNewNoteOpen(true)}
                  className="mt-2 inline-block font-bold text-xs text-[#0B5ED7] hover:underline cursor-pointer"
                >
                  + Create your first note
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.slice(0, 3).map((note) => {
                  const id = note._id || note.id;
                  return (
                    <div
                      key={id}
                      className="flex flex-col rounded-xl border border-[#E1EAF6] p-4 bg-slate-50/50 hover:border-[#0B5ED7]/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-[#072A44] truncate">{note.title}</h4>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">{note.content}</p>
                      <div className="mt-auto rounded-lg bg-blue-50/70 p-2.5 border border-blue-100">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#0B5ED7] mb-1">
                          <FiCheckSquare className="h-3 w-3" />
                          <span>Tomorrow's Agenda:</span>
                        </div>
                        <p className="text-xs font-semibold text-[#072A44] line-clamp-2">
                          {note.tommorow_tasks || 'None'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdatePicture={updatePicture}
      />

      <CreateBillModal
        isOpen={isMakeBillOpen}
        onClose={() => setIsMakeBillOpen(false)}
        onSuccess={loadData}
      />

      <CreateTransactionModal
        isOpen={isNewTransOpen}
        onClose={() => setIsNewTransOpen(false)}
        onSuccess={loadData}
        user={user}
      />

      <CreateNoteModal
        isOpen={isNewNoteOpen}
        onClose={() => setIsNewNoteOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}