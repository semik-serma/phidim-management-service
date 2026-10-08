'use client';

import { useState } from 'react';
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Noto_Sans } from 'next/font/google';
import toast from 'react-hot-toast';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login_user = async () => {
    try {
      const data = { email, password };
      const res = await api.post('/auth/login', data);

      const authUser = res.data?.data?.user || res.data?.user;
      const token = res.data?.token || res.data?.data?.token || res.data?.jwt;
      if (token) {
        localStorage.setItem('auth_token', token);
        document.cookie = `jwt=${token}; path=/; SameSite=Lax`;
      } else {
        document.cookie = `jwt=true; path=/; SameSite=Lax`;
      }
      if (authUser) {
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      }

      console.log("response:", res.data);
      toast.success("User logged in successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("login error:", error);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Login failed"
      );
    }
  };

  function validate() {
    const next = {};
    if (!email) next.email = 'Enter your email.';
    else if (!/^[^\s@]+@[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email or login identifier.';
    if (!password) next.password = 'Enter your password.';
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await login_user();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${notoSans.className} min-h-[100svh] grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-[#F0F6FF] via-white to-[#FFF8D6] text-[#072A44]`}>
      {/* Left: brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#072A44] via-[#0B5ED7] to-[#0A4FB3] text-white px-14 py-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FFD600] opacity-90" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-[#4DA3FF] opacity-40" />
        <div className="pointer-events-none absolute top-1/2 right-16 w-20 h-20 rounded-full border-4 border-[#FFD600] opacity-70" />

        <header className="relative z-10 flex items-center gap-2.5 text-base font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFD600] text-[#072A44] text-sm font-extrabold">
            •
          </span>
          Phidim Service Bill
        </header>

        <div className="relative z-10 max-w-md">
          <span className="inline-block mb-5 px-3.5 py-1.5 text-sm font-bold rounded-full bg-[#FFD600] text-[#072A44]">
            ACCESS
          </span>
          <h2 className="text-[42px] leading-[1.15] font-extrabold tracking-tight">
            Every service bill, <span className="text-[#FFD600]">tracked</span> and{" "}
            <span className="text-[#7CC0FF]">paid on time.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-blue-100">
            Issue, track, and settle service bills in one place, synced the moment you sign in.
          </p>
        </div>

        <p className="relative z-10 text-base text-blue-200">
          © {new Date().getFullYear()} Phidim Service Bill. All rights reserved.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-[420px] rounded-3xl bg-white p-9 shadow-xl shadow-[#0B5ED7]/10 border border-[#CFE0F5]">
          <header className="flex lg:hidden items-center gap-2.5 mb-8 text-base font-bold tracking-tight text-[#072A44]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFD600] text-[#072A44] text-sm font-extrabold">
              •
            </span>
            Phidim Service Bill
          </header>

          <span className="inline-block mb-4 px-3.5 py-1.5 text-sm font-bold rounded-full bg-[#FFD600] text-[#072A44]">
            WELCOME BACK
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-[#072A44]">Sign in</h1>
          <p className="text-base text-slate-500 leading-relaxed mb-8">
            Enter your details to continue to your account.
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-base font-bold text-[#072A44]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                placeholder="you@company.com or admin ID"
                className="w-full box-border rounded-xl border-2 border-[#CFE0F5] bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 transition focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100"
              />
              {errors.email && (
                <span
                  id="email-error"
                  className="text-sm font-medium text-red-600 border-l-2 border-red-500 pl-2"
                >
                  {errors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="text-base font-bold text-[#072A44]">
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-semibold text-[#0B5ED7] hover:text-[#072A44] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative flex">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  placeholder="••••••••"
                  className="w-full box-border rounded-xl border-2 border-[#CFE0F5] bg-white px-4 py-3 pr-16 text-base text-slate-800 placeholder:text-slate-400 transition focus:outline-none focus:border-[#0B5ED7] focus:ring-4 focus:ring-[#0B5ED7]/20 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-sm font-bold text-[#0B5ED7] hover:text-[#072A44] px-0.5 py-1 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <span
                  id="password-error"
                  className="text-sm font-medium text-red-600 border-l-2 border-red-500 pl-2"
                >
                  {errors.password}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-[#0B5ED7] text-white text-base font-bold py-3.5 shadow-lg shadow-[#0B5ED7]/30 transition hover:bg-[#0A4FB3] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6 text-sm font-medium text-slate-400 before:content-[''] before:flex-1 before:h-px before:bg-[#CFE0F5] after:content-[''] after:flex-1 after:h-px after:bg-[#CFE0F5]">
            or
          </div>

          <GoogleLoginButton />

          <p className="mt-6 text-center text-sm text-slate-400">
            Need access or an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}