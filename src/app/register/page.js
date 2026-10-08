'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    toast.error('Public registration is disabled. Please contact an administrator.', {
      id: 'reg-disabled',
    });
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F6FF] via-white to-[#FFF8D6] px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <h1 className="text-2xl font-extrabold text-[#072A44] mb-2">
          Registration Closed
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Public self-registration is disabled for Phidim Service Bill. Accounts are provisioned exclusively by system administrators.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center w-full rounded-xl bg-[#0B5ED7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A4FB3]"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}