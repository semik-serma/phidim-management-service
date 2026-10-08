'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Noto_Sans } from 'next/font/google';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiKey,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Sidebar, { MobileNav } from '@/components/Sidebar';
import CreateUserModal from '@/components/CreateUserModal';
import ProfileModal from '@/components/ProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { deleteAdminUser, getAdminUsers, updateUserRole } from '@/lib/userApi';

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

function formatTime(date) {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export default function UsersManagementPage() {
  const { user, isAdmin, loading: authLoading, logout, updatePicture } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to retrieve users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, isAdmin]);

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

  // Metrics
  const metrics = useMemo(() => {
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
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q);

      const userRole = (u.role || 'staff').toLowerCase();
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // If still checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4FA] text-[#072A44]">
        <div className="flex items-center gap-3">
          <FiRefreshCw className="h-5 w-5 animate-spin text-[#0B5ED7]" />
          <span className="text-sm font-bold">Verifying administrator access…</span>
        </div>
      </div>
    );
  }

  // Route Guard: Access Denied for Non-Admins
  if (!isAdmin) {
    return (
      <div className={`${notoSans.className} min-h-screen flex bg-[#F0F4FA] text-[#0B1F3A]`}>
        <Sidebar user={user} onProfileClick={() => setIsProfileOpen(true)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileNav user={user} onProfileClick={() => setIsProfileOpen(true)} />
          <div className="mx-auto max-w-xl py-20 px-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
              <FiAlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#072A44]">
              Access Restricted
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              The Users & Roles dashboard is reserved exclusively for System Administrators.
              Your current assigned role is <span className="font-bold uppercase tracking-wider text-[#072A44]">{user?.role || 'Staff'}</span>.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B5ED7] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0B5ED7]/25 hover:bg-[#0A4FB3] transition"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${notoSans.className} min-h-screen flex bg-[#F0F4FA] text-[#0B1F3A]`}>
      {/* Desktop Sidebar */}
      <Sidebar user={user} onProfileClick={() => setIsProfileOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header / Navigation */}
        <MobileNav user={user} onProfileClick={() => setIsProfileOpen(true)} />

        {/* Phidim Yellow Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FFD600] px-5 py-3 sm:px-6 sm:py-3.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#072A44] text-[#FFD600] shadow-xs">
              <FiShield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#072A44] leading-tight">
                Users & Roles Management
              </h1>
              <p className="text-xs font-semibold text-[#072A44]/80">
                Provision user accounts, configure access privileges, and audit assigned roles
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Clock Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#072A44] px-3.5 py-1.5 text-xs font-extrabold tabular-nums text-[#FFD600] shadow-xs">
              <FiClock className="h-3.5 w-3.5" />
              <span>{now ? formatTime(now) : '--:--:--'}</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#072A44]/30 bg-white/70 px-3.5 py-2 text-xs font-bold text-[#072A44] hover:bg-white transition cursor-pointer disabled:opacity-50"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Create User Quick Action */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#072A44] px-4 py-2 text-xs font-bold text-[#FFD600] shadow-sm hover:bg-[#0A3D63] transition cursor-pointer"
            >
              <FiPlus className="h-4 w-4" />
              <span>Create User</span>
            </button>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#E1EAF6] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Users</span>
                <span className="p-2 rounded-xl bg-[#0B5ED7]/10 text-[#0B5ED7]">
                  <FiUsers className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-[#072A44]">{metrics.total}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active registered accounts</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5 shadow-xs">
              <div className="flex items-center justify-between text-purple-700 text-xs font-bold uppercase tracking-wider">
                <span>Admins</span>
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <FiShield className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-purple-950">{metrics.admins}</p>
              <p className="text-xs text-purple-700/80 mt-0.5">Full system authority</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <span>Staff</span>
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <FiUserCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-950">{metrics.staff}</p>
              <p className="text-xs text-emerald-700/80 mt-0.5">Billing & customer tasks</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-xs">
              <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider">
                <span>Accountants</span>
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <FiKey className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-blue-950">{metrics.accountants}</p>
              <p className="text-xs text-blue-700/80 mt-0.5">Finance & balance ledgers</p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E1EAF6] bg-white p-3.5 shadow-xs">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <FiSearch className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#0B5ED7] focus:outline-none focus:ring-2 focus:ring-[#0B5ED7]/20"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'admin', 'staff', 'accountant'].map((roleKey) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setRoleFilter(roleKey)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition cursor-pointer ${
                    roleFilter === roleKey
                      ? 'bg-[#072A44] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {roleKey === 'all' ? 'All Roles' : roleKey}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
              <FiAlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-2xl border border-[#E1EAF6] bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E1EAF6] bg-[#F8FAFC] text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">User</th>
                    <th scope="col" className="px-6 py-3.5">Assigned Role</th>
                    <th scope="col" className="px-6 py-3.5">Change Role</th>
                    <th scope="col" className="px-6 py-3.5">Created Date</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1EAF6]">
                  {loading ? (
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
                        <p className="font-bold text-[#072A44]">No users found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {search || roleFilter !== 'all'
                            ? 'Try adjusting your search query or role filter.'
                            : 'Get started by creating your first team member.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userRole = (u.role || 'staff').toLowerCase();
                      const badge = ROLE_BADGES[userRole] || ROLE_BADGES.staff;
                      const isSelf = user?._id === u._id || user?.id === u._id;
                      const initials = (u.full_name || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                      const createdFormatted = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—';

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                          {/* User Column */}
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
                                  <FiMail className="h-3 w-3 text-slate-400" />
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${badge.bg}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>

                          {/* Quick Role Change Selector */}
                          <td className="px-6 py-4">
                            <select
                              value={userRole}
                              disabled={changingRoleId === u._id}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 transition focus:border-[#0B5ED7] focus:outline-none focus:ring-1 focus:ring-[#0B5ED7] disabled:opacity-50 cursor-pointer"
                            >
                              <option value="admin">Admin</option>
                              <option value="staff">Staff</option>
                              <option value="accountant">Accountant</option>
                            </select>
                          </td>

                          {/* Created Date */}
                          <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <FiClock className="h-3.5 w-3.5 text-slate-400" />
                              {createdFormatted}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {isSelf ? (
                              <span className="text-xs text-slate-400 italic font-medium">Current Session</span>
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
        </main>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdatePicture={updatePicture}
      />

      {/* Delete Confirmation Modal */}
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
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/25 transition cursor-pointer"
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
