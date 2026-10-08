'use client';

import { useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiKey,
  FiMail,
  FiShield,
  FiUser,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createAdminUser } from '@/lib/userApi';

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to audit logs, billing, transactions, and user management.',
  },
  {
    value: 'staff',
    label: 'Staff',
    description: 'Create and manage service bills, customer records, and notes.',
  },
  {
    value: 'accountant',
    label: 'Accountant',
    description: 'Manage debit & credit financial transactions and balance sheets.',
  },
];

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'staff',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: generated }));
    setErrors((prev) => ({ ...prev, password: '' }));

    if (navigator.clipboard) {
      navigator.clipboard.writeText(generated);
      setCopied(true);
      toast.success('Generated password copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.full_name.trim()) {
      nextErrors.full_name = 'Full name is required';
    }

    const emailTrimmed = form.email.trim();
    if (!emailTrimmed) {
      nextErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!['admin', 'staff', 'accountant'].includes(form.role)) {
      nextErrors.role = 'Please select a valid role';
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await createAdminUser({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });

      toast.success(`User account created for ${form.full_name}!`);
      setForm({
        full_name: '',
        email: '',
        role: 'staff',
        password: '',
      });
      setErrors({});
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create user:', err);
      const serverMsg = err.response?.data?.message || 'Failed to create user';

      if (err.response?.status === 409 || serverMsg.toLowerCase().includes('already exists')) {
        setErrors((prev) => ({
          ...prev,
          email: 'A user with this email address already exists.',
        }));
      } else {
        toast.error(serverMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-neutral-50/70">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <FiShield className="text-[#0B5ED7]" />
              Create New User
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Provision internal credentials and assign system access rights.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                <FiUser className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="e.g. Binod Rai"
                value={form.full_name}
                onChange={(e) => {
                  setForm({ ...form, full_name: e.target.value });
                  if (errors.full_name) setErrors({ ...errors, full_name: '' });
                }}
                className={`w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm text-neutral-900 transition focus:outline-none focus:ring-2 ${
                  errors.full_name
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-neutral-300 focus:border-[#0B5ED7] focus:ring-[#0B5ED7]/20'
                }`}
              />
            </div>
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <FiAlertCircle className="h-3 w-3" />
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                <FiMail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="user@phidim.gov.np or staff@company.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm text-neutral-900 transition focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-neutral-300 focus:border-[#0B5ED7] focus:ring-[#0B5ED7]/20'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <FiAlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Role & Permissions <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 font-medium transition focus:border-[#0B5ED7] focus:outline-none focus:ring-2 focus:ring-[#0B5ED7]/20"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const selected = form.role === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: opt.value })}
                    className={`flex-1 rounded-lg border py-1.5 px-2 text-xs font-medium transition text-center ${
                      selected
                        ? 'border-neutral-950 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password with Strong Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs font-semibold text-[#0B5ED7] hover:text-[#072A44] flex items-center gap-1 transition"
              >
                <FiKey className="h-3 w-3" />
                {copied ? 'Copied!' : 'Generate Strong Password'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min 6 characters)"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`w-full rounded-xl border pl-3.5 pr-20 py-2.5 text-sm font-mono text-neutral-900 transition focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-neutral-300 focus:border-[#0B5ED7] focus:ring-[#0B5ED7]/20'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                {form.password && (
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(form.password);
                        setCopied(true);
                        toast.success('Password copied to clipboard!');
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    title="Copy password"
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded transition"
                  >
                    {copied ? <FiCheck className="h-4 w-4 text-emerald-600" /> : <FiCopy className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded transition"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <FiAlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#0B5ED7] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0B5ED7]/20 transition hover:bg-[#0A4FB3] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? 'Creating User…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
