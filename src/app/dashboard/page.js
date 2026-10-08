'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Noto_Sans } from 'next/font/google';
import {
  FiAlertCircle,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiBookOpen,
  FiCheck,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiKey,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiPackage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getAllBills } from '@/lib/billApi';
import { getTransactions } from '@/lib/transactionApi';
import { getNotes } from '@/lib/noteApi';
import { deleteAdminUser, getAdminUsers, updateUserRole } from '@/lib/userApi';
import UserAvatar from '@/components/UserAvatar';
import ProfileModal from '@/components/ProfileModal';
import Sidebar, { MobileNav } from '@/components/Sidebar';
import CreateBillModal from '@/components/CreateBillModal';
import CreateTransactionModal from '@/components/CreateTransactionModal';
import CreateNoteModal from '@/components/CreateNoteModal';
import CreateUserModal from '@/components/CreateUserModal';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const ROLE_BADGES = {
  admin: {
    bg: 'bg-purple-100 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
    label: 'Admin',
  },
  staff: {
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Staff',
  },
  accountant: {
    bg: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Accountant',
  },
};

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

export default function DashboardPage() {
  const { user, loading, logout, updatePicture } = useAuth();
  const router = useRouter();

  // Tab State: 'overview' or 'users'
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMakeBillOpen, setIsMakeBillOpen] = useState(false);
  const [isNewTransOpen, setIsNewTransOpen] = useState(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Overview Data
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billsError, setBillsError] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [transLoading, setTransLoading] = useState(true);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  // Users & Roles Data
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [changingRoleId, setChangingRoleId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const [now, setNow] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(timer);
    };
  }, []);

  // Check URL query parameters for ?tab=users
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'users') {
        setActiveTab('users');
      }
    }
  }, []);

  const loadData = async () => {
    const userRole = (user?.role || 'staff').toLowerCase();
    const canBills = userRole === 'admin' || userRole === 'staff';
    const canTrans = userRole === 'admin' || userRole === 'accountant';

    // Load Bills (Admin and Staff only)
    if (canBills) {
      setBillsError('');
      try {
        const data = await getAllBills();
        setBills(extractList(data).map(normalizeBill));
      } catch (error) {
        setBillsError(error.response?.data?.message || error.message || 'Unable to load bills.');
      } finally {
        setBillsLoading(false);
      }
    } else {
      setBillsLoading(false);
    }

    // Load Transactions (Admin and Accountant only)
    if (canTrans) {
      try {
        const txData = await getTransactions();
        setTransactions(Array.isArray(txData) ? txData : []);
      } catch (error) {
        console.error('Error fetching transactions on dashboard:', error);
      } finally {
        setTransLoading(false);
      }
    } else {
      setTransLoading(false);
    }

    // Load Notes (Admin, Staff, Accountant)
    try {
      const notesData = await getNotes();
      setNotes(Array.isArray(notesData) ? notesData : []);
    } catch (error) {
      console.error('Error fetching notes on dashboard:', error);
    } finally {
      setNotesLoading(false);
    }
  };

  const loadUsers = async () => {
    if (user?.role !== 'admin') return;
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsersError(err.response?.data?.message || 'Failed to retrieve users list');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
    if (user.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  // Role modification
  const handleRoleChange = async (userId, newRole) => {
    if (!userId || !newRole) return;
    setChangingRoleId(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Failed to change role:', err);
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setChangingRoleId(null);
    }
  };

  // Delete user
  const confirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteAdminUser(deletingUser._id);
      setUsers((prev) => prev.filter((u) => u._id !== deletingUser._id));
      toast.success(`User ${deletingUser.full_name} deleted successfully`);
      setDeletingUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push('/');
    }
  }

  // User metrics
  const userMetrics = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role?.toLowerCase() === 'admin').length;
    const staff = users.filter((u) => u.role?.toLowerCase() === 'staff').length;
    const accountants = users.filter((u) => u.role?.toLowerCase() === 'accountant').length;
    return { total, admins, staff, accountants };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const q = userSearch.trim().toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q);

      const userRole = (u.role || 'staff').toLowerCase();
      const matchesRole = userRoleFilter === 'all' || userRole === userRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  if (loading) {
    return (
      <div className={`${notoSans.className} min-h-screen flex items-center justify-center bg-[#F0F4FA]`}>
        <p className="text-base text-slate-500 font-semibold">Loading dashboard...</p>
      </div>
    );
  }
  if (!user) return null;

  const userRole = (user.role || 'staff').toLowerCase();
  const userName = user.full_name || user.name || user.email || 'User';
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';
  const isAccountant = userRole === 'accountant';
  const canAccessBills = isAdmin || isStaff;
  const canAccessTransactions = isAdmin || isAccountant;
  const canAccessNotes = true;

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
      {/* Desktop Sidebar */}
      <Sidebar user={user} onProfileClick={() => setIsProfileOpen(true)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Navigation */}
        <MobileNav user={user} onProfileClick={() => setIsProfileOpen(true)} />
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FFD600] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#072A44]">
              {activeTab === 'users' ? 'Users & Roles' : 'Dashboard'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-[#072A44] px-4 py-2 text-base font-extrabold tabular-nums text-[#FFD600] shadow min-w-[140px] text-center">
              {now ? formatTime(now) : '--:--:--'}
            </span>

            {/* Admin Quick Action: Create User Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(true)}
                className="rounded-xl bg-[#072A44] border-2 border-[#072A44] px-4 py-2 text-sm font-bold text-[#FFD600] shadow hover:bg-[#0B5ED7] hover:text-white hover:border-[#0B5ED7] transition cursor-pointer flex items-center gap-1.5"
              >
                <FiPlus className="h-4 w-4" /> Create User
              </button>
            )}

            {canAccessBills && (
              <button
                type="button"
                onClick={() => setIsMakeBillOpen(true)}
                className="rounded-xl bg-[#0B5ED7] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] transition cursor-pointer"
              >
                + Make Bill
              </button>
            )}

            {canAccessTransactions && (
              <button
                type="button"
                onClick={() => setIsNewTransOpen(true)}
                className="rounded-xl border-2 border-[#072A44] bg-[#072A44] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#0A4FB3] hover:border-[#0A4FB3] transition cursor-pointer"
              >
                + New Transaction
              </button>
            )}

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
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0B5ED7] text-white'
                : 'border border-[#CFE0F5] text-[#072A44]'
            }`}
          >
            <FiHome /> Dashboard
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#0B5ED7] text-white'
                  : 'border border-[#CFE0F5] text-[#072A44]'
              }`}
            >
              <FiUsers /> Users & Roles
            </button>
          )}

          {canAccessBills && (
            <Link
              href="/bills"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#CFE0F5] px-3 py-1.5 text-xs font-bold text-[#072A44]"
            >
              <FiFileText /> Bill Entry
            </Link>
          )}
          {canAccessTransactions && (
            <Link
              href="/transactions"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#CFE0F5] px-3 py-1.5 text-xs font-bold text-[#072A44]"
            >
              <FiCreditCard /> Debit & Credit
            </Link>
          )}
          <Link
            href="/notes"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#CFE0F5] px-3 py-1.5 text-xs font-bold text-[#072A44]"
          >
            <FiBookOpen /> Notes & Agenda
          </Link>
          <Link
            href="/products"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#CFE0F5] px-3 py-1.5 text-xs font-bold text-[#072A44]"
          >
            <FiPackage /> Products
          </Link>
        </div>

        <main className="flex-1 p-6 space-y-6">
          {/* Scope Indicator */}
          <div className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs ${
            userRole === 'staff'
              ? 'border-blue-200 bg-blue-50/80 text-blue-950'
              : userRole === 'accountant'
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
              : 'border-amber-200 bg-amber-50/80 text-amber-950'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-white font-black text-xs ${
                userRole === 'staff'
                  ? 'bg-blue-600'
                  : userRole === 'accountant'
                  ? 'bg-emerald-600'
                  : 'bg-amber-500'
              }`}>
                {userRole === 'staff' ? '👤' : userRole === 'accountant' ? '💼' : '👑'}
              </span>
              <div>
                <span className="font-extrabold">
                  {userRole === 'staff'
                    ? 'Staff Workspace Access'
                    : userRole === 'accountant'
                    ? 'Accountant Ledger Access'
                    : 'System Administrator Access'}
                </span>
                <span className="text-slate-600 block text-[11px]">
                  {userRole === 'staff'
                    ? 'Staff permissions active for Bill Entry and noting things section (Notes & Agenda).'
                    : userRole === 'accountant'
                    ? 'Financial ledger active for Debit & Credit transactions and notes.'
                    : 'Full system management active: Bill Entry, Debit & Credit, Notes & Agenda, and Users & Roles.'}
                </span>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold bg-white text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
              ROLE: {userRole.toUpperCase()}
            </span>
          </div>

          {/* Admin Tabs Switcher */}
          {isAdmin && (
            <div className="flex items-center gap-2 border-b border-[#CFE0F5] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#072A44] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#CFE0F5]'
                }`}
              >
                <FiHome className="h-4 w-4" />
                Dashboard Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#0B5ED7] text-white shadow-md shadow-[#0B5ED7]/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#CFE0F5]'
                }`}
              >
                <FiUsers className="h-4 w-4" />
                Users & Roles
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#0B5ED7]'
                }`}>
                  {users.length}
                </span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: USERS & ROLES MANAGEMENT (Admin only)                     */}
          {/* ============================================================== */}
          {activeTab === 'users' && isAdmin ? (
            <div className="space-y-6">
              {/* Header inside tab */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-[#E1EAF6] shadow-xs">
                <div>
                  <h3 className="text-xl font-extrabold text-[#072A44] flex items-center gap-2">
                    <FiShield className="text-[#0B5ED7]" />
                    Users & Roles Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provision accounts, assign system access privileges, or reset roles.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={loadUsers}
                    disabled={usersLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                  >
                    <FiRefreshCw className={`h-3.5 w-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateUserOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#0B5ED7]/25 hover:bg-[#0A4FB3] transition cursor-pointer"
                  >
                    <FiPlus className="h-4 w-4" />
                    Create User
                  </button>
                </div>
              </div>

              {/* User Metric Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#E1EAF6] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>Total Users</span>
                    <FiUsers className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-[#072A44]">{userMetrics.total}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active accounts</p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 shadow-xs">
                  <div className="flex items-center justify-between text-purple-700 text-xs font-bold uppercase tracking-wider">
                    <span>Admins</span>
                    <FiShield className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-purple-900">{userMetrics.admins}</p>
                  <p className="text-[11px] text-purple-600/80 mt-0.5">Full privileges</p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    <span>Staff</span>
                    <FiUserCheck className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-900">{userMetrics.staff}</p>
                  <p className="text-[11px] text-emerald-600/80 mt-0.5">Billing & customer tasks</p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-xs">
                  <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider">
                    <span>Accountants</span>
                    <FiKey className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-blue-900">{userMetrics.accountants}</p>
                  <p className="text-[11px] text-blue-600/80 mt-0.5">Ledger & reconciliation</p>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E1EAF6] bg-white p-3.5 shadow-xs">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <FiSearch className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#0B5ED7] focus:outline-none focus:ring-2 focus:ring-[#0B5ED7]/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['all', 'admin', 'staff', 'accountant'].map((roleKey) => (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setUserRoleFilter(roleKey)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition cursor-pointer ${
                        userRoleFilter === roleKey
                          ? 'bg-[#072A44] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {roleKey === 'all' ? 'All Roles' : roleKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {usersError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
                  <FiAlertCircle className="h-5 w-5 shrink-0" />
                  <span>{usersError}</span>
                </div>
              )}

              {/* Users Table */}
              <div className="rounded-2xl border border-[#E1EAF6] bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#E1EAF6] bg-[#EEF4FC] text-[11px] font-extrabold uppercase tracking-wider text-[#072A44]">
                      <tr>
                        <th scope="col" className="px-6 py-3.5">User</th>
                        <th scope="col" className="px-6 py-3.5">Current Role</th>
                        <th scope="col" className="px-6 py-3.5">Change Role</th>
                        <th scope="col" className="px-6 py-3.5">Created Date</th>
                        <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1EAF6]">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            <FiRefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0B5ED7]" />
                            Loading users list…
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            <FiUsers className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="font-bold text-slate-700">No users found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {userSearch || userRoleFilter !== 'all'
                                ? 'Try adjusting your search query or role filter.'
                                : 'Get started by creating your first team member.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const uRole = (u.role || 'staff').toLowerCase();
                          const badge = ROLE_BADGES[uRole] || ROLE_BADGES.staff;
                          const isSelf = user?._id === u._id || user?.id === u._id;
                          const initials = (u.full_name || 'U')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                          const createdFormatted = u.createdAt ? formatDate(u.createdAt) : '—';

                          return (
                            <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {u.picture ? (
                                    <img
                                      src={u.picture}
                                      alt={u.full_name}
                                      className="h-9 w-9 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0B5ED7] to-[#072A44] text-xs font-bold text-white shadow-xs">
                                      {initials}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-[#072A44] truncate">
                                        {u.full_name || 'Unnamed User'}
                                      </span>
                                      {isSelf && (
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0B5ED7] border border-blue-200">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                      <FiMail className="h-3 w-3" />
                                      {u.email}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${badge.bg}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                  {badge.label}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <select
                                  value={uRole}
                                  disabled={changingRoleId === u._id}
                                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 transition focus:border-[#0B5ED7] focus:outline-none focus:ring-1 focus:ring-[#0B5ED7] disabled:opacity-50"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="staff">Staff</option>
                                  <option value="accountant">Accountant</option>
                                </select>
                              </td>

                              <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <FiClock className="h-3.5 w-3.5 text-slate-400" />
                                  {createdFormatted}
                                </div>
                              </td>

                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                {isSelf ? (
                                  <span className="text-xs text-slate-400 italic">Current Session</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingUser(u)}
                                    title="Delete user"
                                    className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* TAB 2: OVERVIEW (Metrics, Bills, Transactions, Notes)           */
            /* ============================================================== */
            <>
              {/* Quick Metrics */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {canAccessBills && (
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
                )}

                {canAccessTransactions && (
                  <>
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
                  </>
                )}

                {/* For Staff or Accountant, show Daily Notes & Agenda metric */}
                {(!canAccessBills || !canAccessTransactions) && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E1EAF6]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes & Agenda</p>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <FiBookOpen className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-[#072A44]">{notes.length}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      दैनिक टिपोट र कार्यहरू
                    </p>
                  </div>
                )}
              </section>

              {/* Grid with Recent Bills & Recent Transactions */}
              {(canAccessBills || canAccessTransactions) && (
                <div className={`grid grid-cols-1 gap-6 ${canAccessBills && canAccessTransactions ? 'lg:grid-cols-2' : ''}`}>
                  {/* Bills Section */}
                  {canAccessBills && (
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
                  )}

                  {/* Transactions Section */}
                  {canAccessTransactions && (
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
                            <p>No transactions yet.</p>
                            <button
                              type="button"
                              onClick={() => setIsNewTransOpen(true)}
                              className="mt-2 text-xs font-bold text-[#0B5ED7] hover:underline cursor-pointer"
                            >
                              + Record first transaction
                            </button>
                          </div>
                        )}
                        {!transLoading &&
                          transactions.slice(0, 5).map((t) => {
                            const isCredit = t.transactionType?.toLowerCase().includes('credit');
                            const amt = Number(t.amount || 0);
                            return (
                              <div
                                key={t._id || t.id}
                                className="grid grid-cols-[1.2fr_1fr_1.2fr] items-center gap-2 border-t border-[#E1EAF6] px-4 py-3 text-xs"
                              >
                                <span className="font-semibold truncate">{t.reference || '—'}</span>
                                <span className="text-slate-500 truncate">{t.account || 'Cash'}</span>
                                <span className={`font-bold text-right ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isCredit ? '+' : '-'}Rs. {amt.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* Daily Notes & Agenda Section */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#E1EAF6]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1EAF6] pb-4">
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
            </>
          )}
        </main>
      </div>

      {/* Modals */}
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

      {/* Create User Modal (Admin only) */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onSuccess={loadUsers}
      />

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiTrash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#072A44]">Delete User Account</h3>
            <p className="mt-1 text-xs text-slate-500">
              Are you sure you want to remove <span className="font-bold text-slate-800">{deletingUser.full_name}</span> ({deletingUser.email})? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}