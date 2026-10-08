'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiFileText,
  FiCreditCard,
  FiBookOpen,
  FiPackage,
  FiUsers,
} from 'react-icons/fi';
import UserAvatar from './UserAvatar';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: FiHome, roles: ['admin', 'staff', 'accountant'] },
  { label: 'Bill Entry', href: '/bills', icon: FiFileText, roles: ['admin', 'staff'] },
  { label: 'Debit & Credit', href: '/transactions', icon: FiCreditCard, roles: ['admin', 'accountant'] },
  { label: 'Notes & Agenda', href: '/notes', icon: FiBookOpen, roles: ['admin', 'staff', 'accountant'] },
  { label: 'Products & Inventory', href: '/products', icon: FiPackage, roles: ['admin', 'staff', 'accountant'] },
  { label: 'Users & Roles', href: '/users', icon: FiUsers, roles: ['admin'] },
];

export default function Sidebar({ user, onProfileClick, currentPath }) {
  const pathname = usePathname();
  const activePath = currentPath || pathname;

  const userRole = (user?.role || 'staff').toLowerCase();
  const isAdmin = userRole === 'admin';
  const userName = user?.full_name || user?.name || user?.email || 'User';

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="print:hidden hidden md:flex w-[220px] shrink-0 flex-col bg-[#072A44] text-white px-3 pt-5 pb-6 sticky top-0 h-screen select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <img
          src="/logo.png"
          alt="Phidim Service Logo"
          className="h-8 w-8 object-contain shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-black tracking-wide leading-tight truncate text-white">
            PHIDIM SERVICE
          </span>
          <span className="text-[10px] font-bold tracking-wider text-[#7CC0FF] uppercase truncate">
            {isAdmin ? 'ADMIN CONTROL' : `${userRole.toUpperCase()} PORTAL`}
          </span>
        </div>
      </div>

      {/* Navigation Label */}
      <div className="px-3 mb-2 text-[10px] font-extrabold tracking-[0.14em] text-[#7CC0FF] uppercase">
        NAVIGATION
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            activePath === item.href ||
            (item.href === '/dashboard' && activePath === '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] transition ${
                active
                  ? 'bg-[#0B5ED7] text-white font-bold shadow-md shadow-[#0B5ED7]/25'
                  : 'text-blue-100 hover:bg-[#0B5ED7]/50 hover:text-white font-medium'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-blue-200'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card at Bottom */}
      <div className="mt-auto px-1 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onProfileClick}
          className="w-full flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2 text-left transition cursor-pointer group"
          title="Click to view/update profile"
        >
          <UserAvatar user={user} size="sm" showBadge={true} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white group-hover:text-[#FFD600] transition">
              {userName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="truncate text-[10px] text-blue-200">
                {user?.email || 'Signed in'}
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold bg-[#FFD600] text-[#072A44] shrink-0">
                {userRole}
              </span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ user, onProfileClick, currentPath }) {
  const pathname = usePathname();
  const activePath = currentPath || pathname;
  const userRole = (user?.role || 'staff').toLowerCase();
  const isAdmin = userRole === 'admin';

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="print:hidden md:hidden border-b border-[#CFE0F5] bg-white sticky top-0 z-20 shadow-xs">
      {/* Brand & User Row */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#072A44] text-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Phidim Service Logo" className="h-7 w-7 object-contain" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-white">PHIDIM SERVICE</span>
            <span className="text-[9px] font-bold text-[#7CC0FF] uppercase">
              {isAdmin ? 'ADMIN CONTROL' : `${userRole.toUpperCase()} PORTAL`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 transition cursor-pointer"
        >
          <UserAvatar user={user} size={24} />
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FFD600] text-[#072A44]">
            {userRole}
          </span>
        </button>
      </div>

      {/* Horizontal Nav Scroll */}
      <nav className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-white scrollbar-none">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            activePath === item.href ||
            (item.href === '/dashboard' && activePath === '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                active
                  ? 'bg-[#0B5ED7] text-white shadow-xs'
                  : 'border border-[#CFE0F5] bg-white text-[#072A44] hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
