'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import LoadingRing from '@/components/LoadingRing';

/* ==========================================================================
   UNICASH /verify-email — AUTH-01 confirm landing page
   --------------------------------------------------------------------------
   Member receives AUTH-01 "Welcome & verify email" with a link
   /verify-email?token=<32-byte-hex>. This page:
     1. reads ?token=
     2. POSTs to /auth/verify-email/confirm
     3. shows success / expired / invalid / generic-error states
     4. on success → redirect /login (2.5s)
   Visual system matches /reset-password (painted purple shell + glass card).
   ========================================================================== */

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
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Clock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

type VerifyState = 'verifying' | 'success' | 'expired' | 'invalid' | 'no_token' | 'error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'no_token');
  const [errorDetail, setErrorDetail] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await api.auth.confirmEmailVerification(token);
        if (cancelled) return;
        setState('success');
        setTimeout(() => {
          if (!cancelled) router.push('/login');
        }, 2500);
      } catch (err: any) {
        if (cancelled) return;
        const message: string =
          err?.response?.data?.message || err?.message || 'Failed to verify email.';
        const lower = message.toLowerCase();
        if (lower.includes('expired')) {
          setState('expired');
        } else if (lower.includes('invalid')) {
          setState('invalid');
        } else {
          setState('error');
          setErrorDetail(message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  /* ---------- copy + visuals per state ---------- */

  const visual = (() => {
    switch (state) {
      case 'success':
        return {
          icon: <Icon.CheckCircle className="h-6 w-6 text-[#10B981]" />,
          iconBg: 'bg-[#E5F7EE] ring-[#86EFAC]/50',
          eyebrow: 'Email verified',
          title: (
            <>
              You&rsquo;re <span className="uc-gold-gradient">verified.</span>
            </>
          ),
          body: 'Your UNICASH account is now active. Redirecting you to login…',
          cta: { href: '/login', label: 'Continue to login' },
        };
      case 'verifying':
        return {
          icon: (
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#6356E5]/30 border-t-[#6356E5]"
              aria-hidden
            />
          ),
          iconBg: 'bg-[#F0EDFB] ring-[#E0DAFF]',
          eyebrow: 'Verifying',
          title: (
            <>
              Just a <span className="uc-gold-gradient">moment…</span>
            </>
          ),
          body: 'Confirming your email — this should only take a second.',
          cta: null,
        };
      case 'expired':
        return {
          icon: <Icon.Clock className="h-6 w-6 text-[#F59E0B]" />,
          iconBg: 'bg-[#FEF3C7] ring-[#FCD34D]/50',
          eyebrow: 'Link expired',
          title: (
            <>
              This link has <span className="uc-gold-gradient">expired.</span>
            </>
          ),
          body: 'Verify links are valid for 24 hours for your security. Log in and we’ll send you a fresh one.',
          cta: { href: '/login', label: 'Log in to resend' },
        };
      case 'invalid':
        return {
          icon: <Icon.AlertCircle className="h-6 w-6 text-[#EF4444]" />,
          iconBg: 'bg-[#FEF2F2] ring-[#FCA5A5]/50',
          eyebrow: 'Invalid link',
          title: (
            <>
              This link isn&rsquo;t <span className="uc-gold-gradient">valid.</span>
            </>
          ),
          body: 'It may have already been used, or the URL got cut off. Log in to request a new verify email.',
          cta: { href: '/login', label: 'Log in to resend' },
        };
      case 'no_token':
        return {
          icon: <Icon.Mail className="h-6 w-6 text-[#6356E5]" />,
          iconBg: 'bg-[#F0EDFB] ring-[#E0DAFF]',
          eyebrow: 'Verify email',
          title: (
            <>
              Open the link from your <span className="uc-gold-gradient">welcome email.</span>
            </>
          ),
          body: 'We sent you a verify email after signup. Click the button in that email to land on this page automatically.',
          cta: { href: '/login', label: 'Go to login' },
        };
      case 'error':
      default:
        return {
          icon: <Icon.AlertCircle className="h-6 w-6 text-[#EF4444]" />,
          iconBg: 'bg-[#FEF2F2] ring-[#FCA5A5]/50',
          eyebrow: 'Something went wrong',
          title: (
            <>
              We hit a <span className="uc-gold-gradient">snag.</span>
            </>
          ),
          body:
            errorDetail ||
            'We couldn’t verify your email right now. Please try again, or contact support if this keeps happening.',
          cta: { href: '/login', label: 'Back to login' },
        };
    }
  })();

  const primaryBtnCls =
    'uc-lift-sm relative inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-6 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8]';

  return (
    <main className="relative min-h-screen overflow-hidden text-[#0f1222]">
      <PaintedBackground />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_30px_80px_-30px_rgba(15,18,34,0.45)] backdrop-blur-xl sm:p-9">
            <div className="text-center">
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-colors ${visual.iconBg}`}
                role="status"
                aria-live="polite"
              >
                {visual.icon}
              </div>
              <Eyebrow>{visual.eyebrow}</Eyebrow>
              <h1 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px]">
                {visual.title}
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#4b5563] sm:text-[14px]">
                {visual.body}
              </p>
            </div>

            {visual.cta && (
              <div className="mt-7 flex justify-center">
                <Link href={visual.cta.href} className={primaryBtnCls}>
                  {visual.cta.label}
                  <Icon.ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {(state === 'expired' || state === 'invalid' || state === 'error') && (
              <p className="mt-6 text-center text-[13px] text-[#667085]">
                Need help?{' '}
                <a
                  href="mailto:support@unicash.com.au"
                  className="rounded-md font-semibold text-[#6356E5] transition-colors hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                >
                  Email support
                </a>
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#FFE2B0]" />
              Secure verification
            </span>
            <span aria-hidden className="text-white/35">·</span>
            <span>24-hour link expiry</span>
            <span aria-hidden className="text-white/35">·</span>
            <span>Single-use link</span>
          </div>

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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingRing fullscreen label="Loading" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
