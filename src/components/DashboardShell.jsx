'use client';

import React from 'react';
import Sidebar, { MobileNav } from './Sidebar';

export default function DashboardShell({ user, logout, children, actions }) {
  return (
    <div className="min-h-screen flex bg-[#F0F4FA] text-[#0B1F3A]">
      {/* Desktop Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Navigation */}
        <MobileNav user={user} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {actions && <div className="mb-6 flex justify-end">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
