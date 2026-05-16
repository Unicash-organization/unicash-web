'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingRing from '@/components/LoadingRing';

/* ==========================================================================
   UNICASH /unsubscribe — AU-02 Spam Act 2003 one-click unsubscribe page.

   Two entry modes:

   Mode A — one-click link from email footer
     /unsubscribe?email=user@x.com&cat=marketing&token=HMAC
     Auto-POSTs to /api/email/unsubscribe and shows success.

   Mode B — generic prompt link (older emails / fallback)
     /unsubscribe?cat=marketing  (no email, no token)
     Asks the user for their email + acts as a redirect to /account/email-preferences
     where they can sign in to manage all categories.

   States:
     verifying   — preflight + POST in flight
     success     — suppression row added
     already     — same (email, cat) was already suppressed; same UX
     invalid     — token mismatch or missing — generic error + manual CTA
     missing     — no token/email — show the "manage preferences" prompt
     error       — network blip; retry button

   Visual system mirrors /reset-password + /verify-email (painted purple shell
   + glass card). No PII exposed in URL beyond the email the user already
   entered when they signed up.
   ========================================================================== */

const Icon = {
  CheckCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  AlertCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

type State = 'verifying' | 'success' | 'already' | 'invalid' | 'missing' | 'error';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'all UNICASH emails',
  marketing: 'marketing & promotions',
  lifecycle: 'lifecycle reminders',
  draw_announcements: 'Bonus Draw announcements',
  milestone: 'milestone rewards',
  points_expiry: 'Points expiry reminders',
  product_updates: 'product updates',
  partner_offers: 'partner offers',
};

function UnsubscribeInner() {
  const search = useSearchParams();
  const email = search.get('email')?.trim().toLowerCase() ?? '';
  const cat = search.get('cat')?.trim() ?? 'marketing';
  const token = search.get('token')?.trim() ?? '';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const [state, setState] = useState<State>(token && email ? 'verifying' : 'missing');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (state !== 'verifying') return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/email/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, category: cat, token }),
        });
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          setState(data.alreadyUnsubscribed ? 'already' : 'success');
          return;
        }

        if (res.status === 400) {
          setState('invalid');
          return;
        }

        // Anything else — likely 429 throttle or 500. Show retry.
        setErrorMsg(`Server responded ${res.status}.`);
        setState('error');
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.message ?? 'Network error');
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, apiBase, email, cat, token]);

  const categoryLabel = CATEGORY_LABELS[cat] ?? `category "${cat}"`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#1A1432] text-white">
      {/* Painted purple shell — same visual system as /reset-password */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(139,123,255,0.45), transparent 70%), radial-gradient(40% 35% at 90% 80%, rgba(99,86,229,0.40), transparent 70%), radial-gradient(45% 40% at 5% 85%, rgba(255,200,93,0.18), transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[420px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_60px_-30px_rgba(99,86,229,0.55)] backdrop-blur-xl sm:p-8">
            {state === 'verifying' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <LoadingRing />
                </div>
                <h1 className="text-[22px] font-extrabold tracking-tight">
                  Processing your unsubscribe…
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  One moment while we update your email preferences.
                </p>
              </div>
            )}

            {(state === 'success' || state === 'already') && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981]/20 text-[#10B981]">
                  <Icon.CheckCircle className="h-7 w-7" />
                </div>
                <h1 className="text-[22px] font-extrabold tracking-tight">
                  You&apos;re unsubscribed
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  We&apos;ll stop sending you {categoryLabel}.
                  {email && (
                    <>
                      {' '}
                      Confirmation sent to{' '}
                      <span className="font-semibold text-white">{email}</span>.
                    </>
                  )}
                </p>
                {state === 'already' && (
                  <p className="mt-3 text-[12.5px] text-white/55">
                    (You were already unsubscribed from this category — nothing to change.)
                  </p>
                )}
                <p className="mt-4 text-[13px] text-white/65">
                  Important transactional emails (purchase receipts, security alerts) will still be sent.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/account/email-preferences"
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.55)] transition-transform hover:scale-[1.02]"
                  >
                    Manage email preferences <Icon.ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/"
                    className="text-[12.5px] font-semibold text-white/70 underline-offset-4 hover:underline"
                  >
                    Back to UNICASH home
                  </Link>
                </div>
              </div>
            )}

            {state === 'invalid' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B]/20 text-[#F59E0B]">
                  <Icon.AlertCircle className="h-7 w-7" />
                </div>
                <h1 className="text-[22px] font-extrabold tracking-tight">
                  Link not valid
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  This unsubscribe link is missing required information or no longer works.
                  You can still opt out — sign in and manage your preferences there.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/login?redirectTo=/account/email-preferences"
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 py-2.5 text-[14px] font-semibold text-white"
                  >
                    Sign in to manage preferences <Icon.ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {state === 'missing' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon.Mail className="h-6 w-6" />
                </div>
                <h1 className="text-[22px] font-extrabold tracking-tight">
                  Manage your emails
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  To unsubscribe from {categoryLabel}, sign in and toggle the
                  category off — it takes 5 seconds. Important transactional
                  emails (receipts, security) will still be sent.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/login?redirectTo=/account/email-preferences"
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 py-2.5 text-[14px] font-semibold text-white"
                  >
                    Sign in to manage preferences <Icon.ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/"
                    className="text-[12.5px] font-semibold text-white/70 underline-offset-4 hover:underline"
                  >
                    Back to UNICASH home
                  </Link>
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/20 text-[#EF4444]">
                  <Icon.AlertCircle className="h-7 w-7" />
                </div>
                <h1 className="text-[22px] font-extrabold tracking-tight">
                  Couldn&apos;t process unsubscribe
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  {errorMsg || 'A temporary network blip prevented your request from completing.'}
                </p>
                <button
                  type="button"
                  onClick={() => setState('verifying')}
                  className="mt-5 inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 py-2.5 text-[14px] font-semibold text-white"
                >
                  Try again
                </button>
                <p className="mt-3 text-[12.5px] text-white/55">
                  If this keeps happening, sign in and unsubscribe from your
                  email preferences page.
                </p>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-white/50">
            UNICASH respects your inbox. AU Spam Act 2003 — functional opt-out, no fee.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center bg-[#1A1432]">
          <LoadingRing />
        </main>
      }
    >
      <UnsubscribeInner />
    </Suspense>
  );
}
