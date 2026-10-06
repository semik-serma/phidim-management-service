'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBookOpen, FiCreditCard, FiFileText, FiHome, FiLogOut } from 'react-icons/fi';
import UserAvatar from './UserAvatar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/bills', label: 'Bills', icon: FiFileText },
  { href: '/transactions', label: 'Debit & Credit', icon: FiCreditCard },
  { href: '/notes', label: 'Notes', icon: FiBookOpen },
];

export default function DashboardShell({ user, logout, children, actions }) {
  const pathname = usePathname();
  const displayName = user?.full_name || user?.name || user?.email || 'Admin';

  return (
    <div className="min-h-[100svh] bg-white text-neutral-950 lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-neutral-50 lg:flex lg:min-h-[100svh] lg:flex-col">
        <div className="border-b border-neutral-200 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-950 text-xs font-semibold">
              P
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Phidim Service Bill
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  active
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-600 hover:bg-white hover:text-neutral-950'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <div className="mb-4 flex items-center gap-3">
            <UserAvatar user={user} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium">{displayName}</p>
              <p className="text-[12.5px] text-neutral-500">Signed in</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 border border-neutral-300 bg-white px-3 py-2.5 text-left text-[14px] font-medium text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
          >
            <FiLogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-neutral-200 lg:hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-950 text-xs font-semibold">
                P
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                Phidim Service Bill
              </span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-[13.5px] font-medium border-b border-neutral-950"
            >
              Logout
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-neutral-200 px-5 py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-[13px] font-medium ${
                    active
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
          {actions && <div className="mb-6 flex justify-end">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
