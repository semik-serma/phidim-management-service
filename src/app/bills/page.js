'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Noto_Sans } from 'next/font/google';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiHome,
  FiCreditCard,
  FiBookOpen,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
  FiPrinter,
  FiLock,
  FiLayers,
  FiEdit3,
  FiShare2,
  FiDownload,
  FiShield,
  FiFilter,
  FiPackage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  createBill,
  deleteBill,
  getAllBills,
  exportBillsToExcel,
  getAdminUsers,
} from '@/lib/billApi';
import UserAvatar from '@/components/UserAvatar';
import ProfileModal from '@/components/ProfileModal';
import Sidebar, { MobileNav } from '@/components/Sidebar';
import ShareBillModal from '@/components/ShareBillModal';
import AdminLogsModal from '@/components/AdminLogsModal';
import PrintBillModal from '@/components/PrintBillModal';
import CreateBillModal from '@/components/CreateBillModal';

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
  const shortBillNo = `#B-${(bill._id || bill.id || `${index + 1}`).toString().slice(-6).toUpperCase()}`;

  return {
    ...bill,
    id,
    billNo: bill.bill_no || bill.billNo || bill.number || shortBillNo,
    customer: bill.customer_name || bill.customer || bill.customerName || bill.name || 'Unnamed Customer',
    project: bill.project || 'General Project',
    phoneNumber: bill.phone_number || bill.phone || '',
    address: bill.address || '',
    items: Array.isArray(bill.items) ? bill.items : [],
    amount: Number(bill.grand_total || bill.amount || bill.total || bill.total_amount || 0),
    date: bill.bill_date || bill.date || bill.createdAt || '',
    role: bill.role || 'admin',
    status: bill.status || 'Active',
    description: bill.project || bill.description || bill.notes || '',
  };
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
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

const QUICK_PROJECT_SUGGESTIONS = [
  '⚡ House Wiring',
  '🔌 Meter Setup',
  '🛠️ Maintenance & Repair',
  '💡 Lighting & Inverter',
  '📦 Hardware & Supply',
];

export default function BillsPage() {
  const { user, loading, logout, updatePicture } = useAuth();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billsError, setBillsError] = useState('');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(null);

  // Bill Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [billForm, setBillForm] = useState({
    customer_name: '',
    phone_number: '',
    address: '',
    project: '',
    role: 'admin',
    bill_date: new Date().toISOString().split('T')[0],
    items: [{ particular: '', qty: 1, rate: '', total: 0 }],
  });

  useEffect(() => {
    if (isCreateOpen) {
      setBillForm((prev) => ({
        ...prev,
        role: 'admin',
      }));
    }
  }, [isCreateOpen]);

  // View Bill Details Modal State
  const [selectedBill, setSelectedBill] = useState(null);

  // Delete in-flight tracker
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(timer);
    };
  }, []);

  // Sharing & Export states
  const [sharingBill, setSharingBill] = useState(null);
  const [printingBill, setPrintingBill] = useState(null);
  const [isAdminLogsOpen, setIsAdminLogsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminFilters, setAdminFilters] = useState({
    role: '',
    userId: '',
    status: '',
  });

  const loadBills = async (overrideFilters) => {
    setBillsLoading(true);
    setBillsError('');
    try {
      const filters =
        overrideFilters !== undefined
          ? overrideFilters
          : adminFilters;
      const data = await getAllBills(filters);
      setBills(extractList(data).map(normalizeBill));
    } catch (error) {
      setBillsError(
        error.response?.data?.message || error.message || 'Unable to load bills.'
      );
    } finally {
      setBillsLoading(false);
    }
  };

  useEffect(() => {
    getAdminUsers()
      .then((res) => {
        if (Array.isArray(res)) setAdminUsers(res);
        else if (Array.isArray(res?.data)) setAdminUsers(res.data);
      })
      .catch(() => {});
  }, []);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const filters = adminFilters;
      const data = await exportBillsToExcel(filters);
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Phidim_All_Bills_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel bill report downloaded successfully!');
    } catch {
      toast.error('Failed to export bills to Excel');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function initBills() {
      const userRole = (user?.role || 'staff').toLowerCase();
      if (userRole !== 'admin' && userRole !== 'staff') {
        setBillsLoading(false);
        return;
      }
      try {
        const filters = userRole === 'admin' ? adminFilters : {};
        const data = await getAllBills(filters);
        if (!cancelled) setBills(extractList(data).map(normalizeBill));
      } catch (error) {
        if (!cancelled) {
          setBillsError(
            error.response?.data?.message ||
              error.message ||
              'Unable to load bills.'
          );
        }
      } finally {
        if (!cancelled) setBillsLoading(false);
      }
    }

    if (user) {
      initBills();
    }

    return () => {
      cancelled = true;
    };
  }, [user, adminFilters]);

  // Enhanced search filtering across all customer, project, phone, address, items, and amounts
  const filteredBills = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bills;

    const keywords = q.split(/\s+/).filter(Boolean);

    return bills.filter((bill) => {
      const itemsText = (bill.items || [])
        .map((item) => `${item.particular || ''} ${item.qty || ''} ${item.rate || ''} ${item.total || ''}`)
        .join(' ');

      const searchableText = [
        bill.billNo || '',
        bill.id || '',
        bill.customer || '',
        bill.project || '',
        bill.phoneNumber || '',
        bill.address || '',
        bill.status || '',
        bill.description || '',
        String(bill.amount || ''),
        formatDate(bill.date),
        itemsText,
      ]
        .join(' ')
        .toLowerCase();

      return keywords.every((kw) => searchableText.includes(kw));
    });
  }, [bills, search]);

  const totalAmount = useMemo(
    () => bills.reduce((sum, b) => sum + (b.amount || 0), 0),
    [bills]
  );

  // Dynamic Item row handlers
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
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setBillForm((prev) => {
      const nextItems = [...prev.items];
      const item = { ...nextItems[index], [field]: value };

      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      item.total = qty * rate;

      nextItems[index] = item;
      return { ...prev, items: nextItems };
    });
  };

  const computedGrandTotal = useMemo(() => {
    return billForm.items.reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const r = Number(item.rate) || 0;
      return sum + q * r;
    }, 0);
  }, [billForm.items]);

  // Handle Bill Creation Form Submit
  const handleCreateBillSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!billForm.customer_name.trim()) {
      setCreateError('Customer name is required.');
      return;
    }
    if (!billForm.phone_number.trim()) {
      setCreateError('Phone number is required.');
      return;
    }
    if (!billForm.address.trim()) {
      setCreateError('Address is required.');
      return;
    }
    if (!billForm.project.trim()) {
      setCreateError('Project / Service description is required.');
      return;
    }

    const validItems = billForm.items.filter((i) => i.particular.trim());
    if (validItems.length === 0) {
      setCreateError('Please add at least one item with a valid description.');
      return;
    }

    const invalidItem = validItems.some(
      (item) => Number(item.qty) <= 0 || Number(item.rate) < 0 || item.rate === ''
    );
    if (invalidItem) {
      setCreateError('Please enter valid quantities and rates for all items.');
      return;
    }

    const finalRole = billForm.role || user?.role || 'admin';

    setCreateSubmitting(true);
    try {
      await createBill({
        project: billForm.project.trim(),
        customer_name: billForm.customer_name.trim(),
        phone_number: billForm.phone_number.trim(),
        address: billForm.address.trim(),
        role: finalRole,
        bill_date: billForm.bill_date,
        items: validItems.map((item) => ({
          particular: item.particular.trim(),
          qty: Number(item.qty),
          rate: Number(item.rate),
        })),
      });

      toast.success('Bill created successfully!');
      setIsCreateOpen(false);
      setBillForm({
        customer_name: '',
        phone_number: '',
        address: '',
        project: '',
        role: user?.role || 'admin',
        bill_date: new Date().toISOString().split('T')[0],
        items: [{ particular: '', qty: 1, rate: '', total: 0 }],
      });
      await loadBills();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to create bill.';
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Bill Deletion
  const handleDeleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteBill(id);
      setBills((prev) => prev.filter((b) => (b.id || b._id) !== id));
      if (selectedBill?.id === id || selectedBill?._id === id) {
        setSelectedBill(null);
      }
      toast.success('Bill deleted successfully.');
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to delete bill.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push('/');
    }
  }

  const userRole = (user?.role || 'staff').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';
  const canAccessBills = isAdmin || isStaff;

  if (loading) {
    return (
      <div className={`${notoSans.className} min-h-screen flex items-center justify-center bg-[#F0F4FA]`}>
        <p className="text-base text-slate-500 font-semibold">Loading bills...</p>
      </div>
    );
  }
  if (!user) return null;

  if (!canAccessBills) {
    return (
      <div className={`${notoSans.className} min-h-screen flex items-center justify-center bg-[#F0F4FA] p-6 text-[#072A44]`}>
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-[#CFE0F5] text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <FiAlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#072A44]">
            Access Restricted
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The Bill Entry module is reserved exclusively for <strong>Staff</strong> and <strong>Administrators</strong>.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Your current assigned role is <span className="font-extrabold uppercase text-[#0B5ED7]">{userRole}</span>. As an accountant, you have access to Debit & Credit and Notes.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/transactions"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B5ED7] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0A4FB3] transition"
            >
              <FiCreditCard className="h-4 w-4" /> Go to Debit & Credit
            </Link>
            <Link
              href="/notes"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <FiBookOpen className="h-4 w-4" /> Go to Notes & Agenda
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <FiHome className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userName = user.full_name || user.name || user.email || 'User';
  const userPicture = user.picture || user.avatar || user.profile_picture || '';

  return (
    <div className={`${notoSans.className} min-h-screen flex bg-[#F0F4FA] text-[#0B1F3A]`}>
      {/* Desktop Sidebar */}
      <Sidebar user={user} onProfileClick={() => setIsProfileOpen(true)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Navigation */}
        <MobileNav user={user} onProfileClick={() => setIsProfileOpen(true)} />
        {/* Yellow top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FFD600] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#072A44]">Bills</h2>
            <span className="hidden sm:inline-block rounded-full bg-[#072A44] px-2.5 py-0.5 text-xs font-bold text-[#FFD600]">
              Invoicing & Services
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-[#072A44] px-4 py-2 text-base font-extrabold tabular-nums text-[#FFD600] shadow min-w-[140px] text-center">
              {now ? formatTime(now) : '--:--:--'}
            </span>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] transition cursor-pointer"
            >
              <FiPlus className="h-4 w-4 stroke-[3]" />
              Make Bill
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
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#CFE0F5] px-3 py-1.5 text-xs font-bold text-[#072A44]"
          >
            <FiHome /> Dashboard
          </Link>
          <Link
            href="/bills"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0B5ED7] px-3 py-1.5 text-xs font-bold text-white"
          >
            <FiFileText /> Bill Entry
          </Link>
          {isAdmin && (
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

        <main className="flex-1 p-6 space-y-5">
          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-6 py-5 shadow-sm border border-[#E1EAF6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bills</p>
                <p className="mt-2 text-3xl font-extrabold text-[#072A44]">{bills.length}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0B5ED7]">
                <FiFileText className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-2xl bg-white px-6 py-5 shadow-sm border border-[#E1EAF6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed Amount</p>
                <p className="mt-2 text-3xl font-extrabold text-[#072A44]">
                  Rs. {totalAmount.toLocaleString()}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm">
                Rs
              </span>
            </div>

            <div className="rounded-2xl bg-white px-6 py-5 shadow-sm border border-[#E1EAF6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Status</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-600">Active</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiCheckCircle className="h-5 w-5" />
              </span>
            </div>
          </section>

          {/* Bills table */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#E1EAF6]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-extrabold text-[#072A44]">Service Bills</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {search.trim() ? (
                    <span>
                      Showing <strong className="text-[#0B5ED7]">{filteredBills.length}</strong> of{' '}
                      <strong>{bills.length}</strong> bills matching &ldquo;
                      <span className="text-[#072A44] font-bold">{search}</span>&rdquo;
                    </span>
                  ) : (
                    <span>Showing all {bills.length} recorded bills</span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting || bills.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                  title="Export live bills directly to Excel (.xlsx)"
                >
                  <FiDownload className={`h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
                  {exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}
                </button>
                {user?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setIsAdminLogsOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border-2 border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
                    title="View admin audit trail and activity logs"
                  >
                    <FiShield className="h-4 w-4 text-amber-600" />
                    Audit Logs
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => loadBills()}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-[#CFE0F5] bg-white px-3.5 py-2 text-sm font-bold text-[#072A44] hover:bg-[#EEF4FC] transition cursor-pointer"
                  title="Refresh bills"
                >
                  <FiRefreshCw className={`h-4 w-4 ${billsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#0A4FB3] transition cursor-pointer"
                >
                  <FiPlus className="h-4 w-4 stroke-[3]" />
                  + Make Bill
                </button>
              </div>
            </div>

            {/* Scope / Role Security Banner */}
            <div className={`mt-4 rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs ${
              user?.role === 'staff'
                ? 'border-blue-200 bg-blue-50/70 text-blue-950'
                : user?.role === 'accountant'
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                : 'border-amber-200 bg-amber-50/70 text-amber-950'
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
                      ? 'Staff Member Billing Mode'
                      : user?.role === 'accountant'
                      ? 'Accountant Audit & Billing Mode'
                      : 'Admin Full Visibility Mode'}
                  </span>
                  <span className="text-slate-600 block text-[11px]">
                    {user?.role === 'staff'
                      ? 'Manage, issue, and print customer electrical service bills.'
                      : user?.role === 'accountant'
                      ? 'Manage customer service bills and cross-reference with ledger transactions.'
                      : 'Displaying all bills across all administrative and service accounts.'}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold bg-white text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
                Access: {user?.role || 'SYSTEM_ADMIN'}
              </span>
            </div>

            {/* Admin Dedicated Filters Toolbar */}
            <div className="mt-3 rounded-xl border border-[#CFE0F5] bg-[#F8FAFD] p-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-[#072A44] flex items-center gap-1">
                <FiFilter className="h-3.5 w-3.5 text-[#0B5ED7]" /> Filters:
              </span>

                <select
                  value={adminFilters.userId}
                  onChange={(e) => setAdminFilters({ ...adminFilters, userId: e.target.value })}
                  className="rounded-lg border border-[#CFE0F5] bg-white px-2.5 py-1.5 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-[#0B5ED7]"
                >
                  <option value="">All Users</option>
                  {adminUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>

                <select
                  value={adminFilters.status}
                  onChange={(e) => setAdminFilters({ ...adminFilters, status: e.target.value })}
                  className="rounded-lg border border-[#CFE0F5] bg-white px-2.5 py-1.5 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-[#0B5ED7]"
                >
                  <option value="">All Statuses</option>
                  <option value="issued">Issued</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {(adminFilters.role || adminFilters.userId || adminFilters.status) && (
                  <button
                    type="button"
                    onClick={() => setAdminFilters({ role: '', userId: '', status: '' })}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer ml-auto"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

            {/* Search Input */}
            <div className="relative mt-4">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name, phone, address, project, item particulars, bill no. or amount..."
                className="w-full rounded-xl border-2 border-[#CFE0F5] bg-white pl-12 pr-10 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            {search.trim() && (
              <div className="flex items-center gap-2 mt-2 px-1">
                <span className="text-xs text-slate-500">
                  Active filter: <span className="font-bold text-[#0B5ED7]">&ldquo;{search}&rdquo;</span> (found {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'})
                </span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer ml-1"
                >
                  Clear filter
                </button>
              </div>
            )}

            <div className="mt-5 overflow-x-auto rounded-xl border border-[#E1EAF6]">
              <div className="grid min-w-[750px] grid-cols-[1.2fr_1.8fr_1fr_1.2fr_1fr] gap-3 bg-[#EEF4FC] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-[#072A44]">
                <span>Bill / ID</span>
                <span>Customer & Project</span>
                <span>Date</span>
                <span className="text-right">Amount</span>
                <span className="text-center">Action</span>
              </div>

              {billsLoading && (
                <div className="px-5 py-12 text-center text-slate-500">
                  <FiRefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0B5ED7]" />
                  <p className="text-sm font-semibold">Loading bills from database...</p>
                </div>
              )}

              {!billsLoading && billsError && (
                <div className="px-5 py-10 text-center">
                  <FiAlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-base font-bold text-rose-600">{billsError}</p>
                  <button
                    type="button"
                    onClick={loadBills}
                    className="mt-3 rounded-lg bg-[#0B5ED7] px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!billsLoading && !billsError && bills.length === 0 && (
                <div className="px-5 py-12 text-center text-slate-500">
                  <FiFileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-base font-bold text-[#072A44]">No bills created yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click &ldquo;+ Make Bill&rdquo; to issue your first service bill.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-4 rounded-xl bg-[#0B5ED7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A4FB3] cursor-pointer"
                  >
                    + Create First Bill
                  </button>
                </div>
              )}

              {!billsLoading && !billsError && bills.length > 0 && filteredBills.length === 0 && (
                <div className="px-5 py-10 text-center text-slate-500">
                  <p className="text-sm font-bold text-[#072A44]">No bills match &ldquo;{search}&rdquo;</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try searching for another customer name, phone number, project, or item name.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-3 text-xs font-bold text-[#0B5ED7] hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {!billsLoading &&
                !billsError &&
                filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="grid min-w-[750px] grid-cols-[1.2fr_1.8fr_1fr_1.2fr_1fr] items-center gap-3 border-t border-[#E1EAF6] px-5 py-3.5 text-sm hover:bg-[#FAFBFD] transition"
                  >
                    {/* Bill number / ID */}
                    <div>
                      <span className="font-semibold text-[#072A44] block">
                        {bill.billNo}
                      </span>
                      {bill.items?.length > 0 && (
                        <span className="text-[11px] text-slate-400">
                          {bill.items.length} item{bill.items.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Customer & Project */}
                    <div>
                      <span className="font-bold text-[#072A44] block">
                        {bill.customer}
                      </span>
                      <span className="text-xs text-slate-500 block truncate">
                        {bill.project} {bill.phoneNumber ? `• ${bill.phoneNumber}` : ''}
                      </span>
                    </div>

                    {/* Date */}
                    <div>
                      <span className="text-slate-600 font-medium">
                        {formatDate(bill.date)}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <span className="font-extrabold text-base text-[#072A44]">
                        Rs. {bill.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBill(bill)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="View Full Bill Details"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintingBill(bill)}
                        className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        title="Print Official Bill (Phidim Service Format)"
                      >
                        <FiPrinter className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharingBill(bill)}
                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        title="Share Bill & Export Excel"
                      >
                        <FiShare2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBill(bill.id || bill._id)}
                        disabled={deletingId === (bill.id || bill._id)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                        title="Delete Bill"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </main>
      </div>

      {/* CREATE BILL MODAL */}
      <CreateBillModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(createdBill, autoPrint) => {
          loadBills();
          if (autoPrint && createdBill) {
            setPrintingBill(createdBill);
          }
        }}
      />

      {/* VIEW BILL DETAILS MODAL */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl border border-[#CFE0F5] my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E1EAF6] pb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B5ED7]">
                  Phidim Service Bill
                </span>
                <h3 className="text-xl font-extrabold text-[#072A44]">{selectedBill.billNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Header Box */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F0F4FA] p-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Customer:</span>
                  <span className="text-[#072A44] font-extrabold text-sm block">
                    {selectedBill.customer}
                  </span>
                  <span className="text-slate-600 block mt-0.5">
                    Phone: {selectedBill.phoneNumber || '—'}
                  </span>
                  <span className="text-slate-600 block">
                    Address: {selectedBill.address || '—'}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold text-[11px]">Role:</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      {selectedBill.role || 'admin'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold block">Date:</span>
                  <span className="text-[#072A44] font-bold block">
                    {formatDate(selectedBill.date)}
                  </span>
                  <span className="text-slate-500 font-semibold block mt-1">Project:</span>
                  <span className="text-[#072A44] font-bold block">
                    {selectedBill.project}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-[#E1EAF6] overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr] gap-2 bg-[#EEF4FC] px-4 py-2 text-xs font-extrabold text-[#072A44]">
                  <span>Item / Particular</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span className="text-right">Total</span>
                </div>

                <div className="divide-y divide-[#E1EAF6] text-xs">
                  {selectedBill.items?.length > 0 ? (
                    selectedBill.items.map((item, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr] items-center gap-2 px-4 py-2.5"
                      >
                        <span className="font-semibold text-[#072A44]">{item.particular}</span>
                        <span>{item.qty}</span>
                        <span>Rs. {Number(item.rate || 0).toLocaleString()}</span>
                        <span className="font-bold text-right text-[#072A44]">
                          Rs. {Number(item.total || (item.qty * item.rate) || 0).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-slate-400 text-center">No individual items recorded.</p>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center rounded-xl bg-[#072A44] px-5 py-3 text-white">
                <span className="text-xs uppercase font-extrabold tracking-wider text-blue-200">
                  Total Bill Amount
                </span>
                <span className="text-xl font-extrabold text-[#FFD600]">
                  Rs. {selectedBill.amount.toLocaleString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteBill(selectedBill.id || selectedBill._id)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete Bill
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBill;
                      setSelectedBill(null);
                      setSharingBill(b);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                    title="Generate shareable link or export to Excel"
                  >
                    <FiShare2 className="h-4 w-4 text-emerald-600" />
                    Share / Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBill;
                      setPrintingBill(b);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                    title="Print Official Formatted Bill"
                  >
                    <FiPrinter className="h-4 w-4" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBill(null)}
                    className="rounded-xl bg-[#072A44] px-5 py-2 text-xs font-bold text-white hover:bg-[#0B1F3A] transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE BILL MODAL */}
      {sharingBill && (
        <ShareBillModal
          bill={sharingBill}
          onClose={() => setSharingBill(null)}
        />
      )}

      {/* PRINT OFFICIAL BILL MODAL */}
      {printingBill && (
        <PrintBillModal
          bill={printingBill}
          isOpen={Boolean(printingBill)}
          onClose={() => setPrintingBill(null)}
        />
      )}

      {/* ADMIN AUDIT & ACTIVITY LOGS MODAL */}
      {isAdminLogsOpen && (
        <AdminLogsModal
          onClose={() => setIsAdminLogsOpen(false)}
        />
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdatePicture={updatePicture}
      />
    </div>
  );
}