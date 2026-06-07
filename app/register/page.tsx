'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';

/* ==========================================================================
   UNICASH /register — payment-free Free Starter signup (v4 UI)
   --------------------------------------------------------------------------
   - Creates a Free account (UserState defaults to FREE on the backend), logs
     the user in, fires a verification email (non-blocking), then sends them
     straight to the dashboard.
   - If the email already exists, we surface a clear error + "Log in instead"
     link instead of attempting any account takeover.
   ========================================================================== */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Eye: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  ),
  AlertCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
};

const UnicashMark = ({ className = 'h-9 w-9' }: { className?: string }) => (
  <svg viewBox="0 0 515 515" xmlns="http://www.w3.org/2000/svg" aria-label="UNICASH" role="img" className={className}>
    <path fill="#6356E5" d="M257.507 0C115.286 0 0 115.291 0 257.507C0 399.718 115.286 515.014 257.507 515.014H515.014V257.507C515.014 115.291 399.718 0 257.507 0ZM406.511 406.511C324.217 488.81 190.797 488.81 108.503 406.516C26.2091 324.222 26.2091 190.797 108.503 108.503C190.797 26.2091 324.217 26.2091 406.511 108.503C488.81 190.792 488.805 324.217 406.511 406.511Z" />
    <path fill="#6356E5" d="M277.464 224.485C247.444 213.185 235.084 205.769 235.084 194.114C235.084 184.226 242.5 174.338 265.454 174.338C290.885 174.338 307.129 182.459 316.312 186.348L326.55 146.439C314.901 140.79 299.007 135.84 275.342 134.784V103.703H240.733V137.251C202.942 144.668 181.048 169.038 181.048 200.119C181.048 234.378 206.83 252.038 244.622 264.754C270.759 273.586 282.058 282.053 282.058 295.479C282.058 309.606 268.281 317.378 248.155 317.378C225.201 317.378 204.363 309.961 189.531 301.835L178.932 343.154C192.353 350.926 215.307 357.281 238.972 358.337V391.895H273.586V355.87C314.2 348.804 336.449 321.966 336.449 290.53C336.444 258.743 319.489 239.322 277.464 224.485Z" />
  </svg>
);

function PaintedBackground() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(700px 480px at 96% 4%, rgba(15,18,34,.32), transparent 55%)',
            'radial-gradient(900px 600px at 24% 36%, rgba(170,150,255,.42), transparent 60%)',
            'radial-gradient(540px 420px at 70% 28%, rgba(255,226,176,.10), transparent 70%)',
            'radial-gradient(900px 600px at 95% 96%, rgba(58,46,168,.42), transparent 62%)',
            'linear-gradient(170deg, #4538B8 0%, #5C4FD8 36%, #6E60E8 70%, #7867EC 100%)',
          ].join(', '),
        }}
      />
      <div aria-hidden className="uc-dot-stage absolute inset-0 opacity-30" />
      <div aria-hidden className="uc-blob-a absolute -left-24 top-6 h-[480px] w-[480px] rounded-full bg-[#A192FF]/40 blur-[140px]" />
      <div aria-hidden className="uc-blob-b absolute right-[-12%] bottom-[-14%] hidden h-[560px] w-[560px] rounded-full bg-[#3D30B8]/50 blur-[150px] sm:block" />
      <div aria-hidden className="uc-blob-c absolute left-[-2%] top-[26%] hidden h-[340px] w-[340px] rounded-full bg-[#FFE2B0]/16 blur-[120px] sm:block" />
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6356e5]">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356e5]" />
      {children}
    </span>
  );
}

const FREE_PERKS = [
  'Earn Points from eligible receipts, including fuel',
  'Redeem all gift cards',
  'Points never expire',
  'No credit card needed',
];

export default function RegisterPage() {
  const { setAuth } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ firstName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);

  const inputCls =
    'h-12 w-full rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] px-4 text-base sm:text-[14px] text-[#0f1222] placeholder-[#a3a8be] shadow-[inset_0_1px_2px_rgba(15,18,34,0.04)] transition-all hover:border-[#c8c5ea] hover:bg-white focus:border-[#6356e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6356e5]/30 disabled:opacity-60';

  const primaryBtnCls =
    'uc-lift-sm relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8] disabled:cursor-not-allowed disabled:opacity-60';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailExists(false);

    const email = formData.email.trim();
    if (!email || !formData.password) {
      setError('Please enter your email and a password.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const deviceId = getDeviceFingerprint();
      const res = await api.auth.register({
        email,
        password: formData.password,
        firstName: formData.firstName.trim() || undefined,
        deviceId,
      });
      const { token, user } = res.data;
      setAuth(token, user);

      // Fire verification email (non-blocking — never gate dashboard on it).
      api.auth.resendEmailVerification().catch(() => {});

      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (typeof msg === 'string' && msg.toLowerCase().includes('already registered')) {
        setEmailExists(true);
        setError('An account with this email already exists.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-[#0f1222]">
      <PaintedBackground />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_30px_80px_-30px_rgba(15,18,34,0.45)] backdrop-blur-xl sm:p-9">
            {/* Brand + heading */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EDFB] ring-1 ring-[#E0DAFF]">
                <UnicashMark className="h-6 w-6" />
              </div>
              <Eyebrow>Free Starter</Eyebrow>
              <h1 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px]">
                Get started <span className="uc-gold-gradient">free.</span>
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#4b5563] sm:text-[14px]">
                Scan receipts, earn Points, and redeem gift cards — no credit card needed.
              </p>
            </div>

            {/* Perks */}
            <ul className="mt-6 space-y-2.5">
              {FREE_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-[13.5px] text-[#0f1222]">
                  <Icon.Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6356e5]" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            {/* Error */}
            {error && (
              <div id="register-error" role="alert" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#FCA5A5]/50 bg-[#FEF2F2] p-3.5">
                <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#991B1B]">
                  <p>{error}</p>
                  {emailExists && (
                    <Link
                      href="/login"
                      className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#B91C1C] underline-offset-2 hover:underline"
                    >
                      Log in instead
                      <Icon.ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-[12.5px] font-semibold text-[#0f1222]">
                  First name <span className="font-normal text-[#a3a8be]">(optional)</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Your first name"
                  disabled={loading}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-[12.5px] font-semibold text-[#0f1222]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@email.com"
                  disabled={loading}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? 'register-error' : undefined}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[12.5px] font-semibold text-[#0f1222]">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? 'register-error' : undefined}
                    className={`${inputCls} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#F4F1FB] hover:text-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-1"
                  >
                    {showPassword ? <Icon.EyeOff className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={primaryBtnCls}>
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden />
                    Creating your account…
                  </>
                ) : (
                  <>
                    Get started free
                    <Icon.ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-[11.5px] leading-relaxed text-[#a3a8be]">
              By continuing you agree to our{' '}
              <Link href="/terms" className="font-semibold text-[#667085] underline-offset-2 hover:underline">Terms</Link>{' '}and{' '}
              <Link href="/privacy" className="font-semibold text-[#667085] underline-offset-2 hover:underline">Privacy Policy</Link>.
            </p>

            <p className="mt-4 text-center text-[13px] text-[#667085]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="rounded-md font-semibold text-[#6356E5] transition-colors hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-center text-[12.5px] text-white/80">
            Free forever · Cancel anytime · No credit card needed
          </p>
        </div>
      </div>
    </main>
  );
}
