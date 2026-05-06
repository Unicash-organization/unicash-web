'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

/* ==========================================================================
   UNICASH /forgot-password — v4 redesigned UI
   --------------------------------------------------------------------------
   - Visual matches the v4 design system + /login painted-purple aesthetic
   - All auth/API logic preserved verbatim:
       * handleSubmit
       * api.auth.requestPasswordReset(email, redirectTo)
       * email / loading / error / success state
       * redirectTo computation (window.location.origin/reset-password)
       * disabled-after-success behavior
   - No env, API, or backend changes
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/*  Inline icons + brand helpers (mirrors /login)                             */
/* -------------------------------------------------------------------------- */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  ArrowLeft: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 19-7-7 7-7M19 12H5" />
    </svg>
  ),
  AlertCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
  CheckCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  KeyRound: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  ),
  MailCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      <path d="m16 19 2 2 4-4" />
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

/* -------------------------------------------------------------------------- */
/*  ForgotPasswordPage — UI redesign only, all auth/API logic preserved.      */
/* -------------------------------------------------------------------------- */

export default function ForgotPasswordPage() {
  /* --- State preserved verbatim --- */
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* Lightweight client-side validator — surfaces errors via the styled error card
     instead of the browser's native validation tooltip. Server still validates. */
  const validateEmail = (value: string): string | null => {
    const v = value.trim();
    if (!v) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address.';
    return null;
  };

  /* --- Submit handler preserved (added format check + reused redirectTo logic) --- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
      await api.auth.requestPasswordReset(email.trim(), redirectTo);
      setSuccess(
        'If an account exists with this email, you will receive a password reset link shortly. Please check your inbox and spam folder.'
      );
      setEmail('');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* --- Visual classes (matches /login) --- */
  const inputCls =
    'h-12 w-full rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] px-4 text-[14px] text-[#0f1222] placeholder-[#a3a8be] shadow-[inset_0_1px_2px_rgba(15,18,34,0.04)] transition-all hover:border-[#c8c5ea] hover:bg-white focus:border-[#6356e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6356e5]/30 disabled:opacity-60';

  const primaryBtnCls =
    'uc-lift-sm relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8] disabled:cursor-not-allowed disabled:opacity-60';

  const sent = !!success;

  return (
    <main className="relative min-h-screen overflow-hidden text-[#0f1222]">
      <PaintedBackground />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_30px_80px_-30px_rgba(15,18,34,0.45)] backdrop-blur-xl sm:p-9">
            {/* Brand mark — switches to mail-check icon after success for narrative payoff */}
            <div className="text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-colors ${sent ? 'bg-[#E5F7EE] ring-[#86EFAC]/50' : 'bg-[#F0EDFB] ring-[#E0DAFF]'}`}>
                {sent ? <Icon.MailCheck className="h-6 w-6 text-[#10B981]" /> : <Icon.KeyRound className="h-6 w-6 text-[#6356E5]" />}
              </div>
              <Eyebrow>{sent ? 'Email sent' : 'Reset password'}</Eyebrow>
              <h1 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px]">
                {sent ? (
                  <>Check your <span className="uc-gold-gradient">inbox.</span></>
                ) : (
                  <>Forgot your <span className="uc-gold-gradient">password?</span></>
                )}
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#4b5563] sm:text-[14px]">
                {sent ? (
                  <>We&rsquo;ve sent a password reset link to your email if an account exists. The link expires in 24 hours.</>
                ) : (
                  <>Enter the email connected to your UNICASH account and we&rsquo;ll send you a secure link to reset your password.</>
                )}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div id="forgot-error" role="alert" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#FCA5A5]/50 bg-[#FEF2F2] p-3.5">
                <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                <div className="text-[13px] leading-relaxed text-[#991B1B]">{error}</div>
              </div>
            )}

            {/* Success */}
            {success && (
              <div role="status" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#86EFAC]/50 bg-[#F0FDF4] p-3.5">
                <Icon.CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                <div className="text-[13px] leading-relaxed text-[#166534]">{success}</div>
              </div>
            )}

            {/* Form — noValidate suppresses native browser tooltips; we surface
                validation errors in the styled error card above for a calm v4 look. */}
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  disabled={sent}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? 'forgot-error' : undefined}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>

              <button type="submit" disabled={loading || sent} className={primaryBtnCls}>
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden />
                    Sending reset link…
                  </>
                ) : sent ? (
                  <>
                    <Icon.CheckCircle className="h-4 w-4" />
                    Email sent
                  </>
                ) : (
                  <>
                    Send reset link
                    <Icon.ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Resend hint after success — re-enables form via tiny inline action */}
              {sent && (
                <p className="text-center text-[12.5px] text-[#667085]">
                  Didn&rsquo;t get the email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess('');
                      setError('');
                    }}
                    className="rounded-md font-semibold text-[#6356E5] transition-colors hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    Try another email
                  </button>
                </p>
              )}
            </form>

            {/* Footer link — Back to login */}
            <p className="mt-6 text-center text-[13px] text-[#667085]">
              Remembered your password?{' '}
              <Link
                href="/login"
                className="rounded-md font-semibold text-[#6356E5] transition-colors hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Trust line — under card on the painted bg */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#FFE2B0]" />
              Secure reset
            </span>
            <span aria-hidden className="text-white/35">·</span>
            <span>24-hour link expiry</span>
            <span aria-hidden className="text-white/35">·</span>
            <span>Email verification</span>
          </div>

          {/* Brand mark + back to homepage */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <UnicashMark className="h-7 w-7 opacity-80" />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md text-[12.5px] text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8]"
            >
              <Icon.ArrowLeft className="h-3.5 w-3.5" />
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
