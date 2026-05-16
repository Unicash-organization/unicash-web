'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

/* =========================================================================
   UNICASH OnboardingWizard — Phase U1
   -------------------------------------------------------------------------
   3-step modal that runs ONCE after signup to help new members earn their
   first Points and lower Day-1 churn. Mounts on /dashboard when
   `user.onboardingCompletedAt === null`. Completion (or skip from any
   step) hits POST /users/me/onboarding/complete and persists the flag.

   Patterns (from project memory):
   - Portal to document.body via createPortal (avoid transformed ancestors)
   - Bottom-sheet on mobile, centered glass card on desktop
   - Tap-outside-close DISABLED (we want positive action) — only an
     explicit "Skip" or "Get started" closes the modal
   - ESC key DISABLED for same reason
   - Brand pill buttons, v4 lavender + gold accent, no gambling language
   ========================================================================= */

const Icon = {
  Sparkles: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
    </svg>
  ),
  Receipt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8M16 12H8M13 16H8" />
    </svg>
  ),
  Gift: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M22 11H2M12 7V21M12 7c-1.7 0-3-1.3-3-3 0-1 .5-2 2-2 1.5 0 3 1.7 3 4 0-2.3 1.5-4 3-4 1.5 0 2 1 2 2 0 1.7-1.3 3-3 3" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55.47.98.97 1.21C12.15 18.75 13 20.24 13 22M14 14.66V17c0 .55-.47.98-.97 1.21C11.85 18.75 11 20.24 11 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Camera: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

type Step = 1 | 2 | 3;

export default function OnboardingWizard() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [closing, setClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll while open
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted || typeof document === 'undefined' || !user) return null;
  // Hide if already completed
  if (user.onboardingCompletedAt) return null;

  /**
   * Mark complete on the server (idempotent) and refresh the auth
   * context so the wizard unmounts. Failure is swallowed — the
   * worst case is the wizard reappears next visit, which is fine.
   */
  const finish = async (action: 'completed' | 'skipped', navigateTo?: string) => {
    if (closing) return;
    setClosing(true);
    setSubmitting(true);
    try {
      await api.users.completeOnboarding();
      await refreshUser();
    } catch {
      /* best-effort; user can still navigate */
    } finally {
      setSubmitting(false);
      if (navigateTo) router.push(navigateTo);
    }
  };

  const firstName = user.firstName || 'there';
  const pointsBalance = (user.membershipCredits || 0) + (user.boostCredits || 0);

  /* Step 1 — Welcome + value prop */
  const renderStep1 = () => (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDFB] ring-1 ring-[#E0DAFF]">
        <Icon.Sparkles className="h-6 w-6 text-[#6356E5]" />
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6356e5]">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356e5]" />
        Welcome
      </span>
      <h2 className="mt-3 text-[24px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[28px]">
        Welcome, <span className="uc-gold-gradient">{firstName}</span>.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#4B5563]">
        UNICASH is a premium rewards platform built for Aussies. Here&rsquo;s how to make the most of it.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#EFEDF5] bg-[#FBFAFF] px-2 py-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-[#E0DAFF] text-[#6356E5]">
            <Icon.Receipt className="h-4 w-4" />
          </span>
          <span className="text-[11.5px] font-semibold leading-tight text-[#0F1222]">Scan Receipts</span>
          <span className="text-[10.5px] text-[#667085]">Earn Points</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#EFEDF5] bg-[#FBFAFF] px-2 py-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-[#E0DAFF] text-[#6356E5]">
            <Icon.Trophy className="h-4 w-4" />
          </span>
          <span className="text-[11.5px] font-semibold leading-tight text-[#0F1222]">Bonus Draws</span>
          <span className="text-[10.5px] text-[#667085]">Use Points</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#EFEDF5] bg-[#FBFAFF] px-2 py-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-[#E0DAFF] text-[#6356E5]">
            <Icon.Gift className="h-4 w-4" />
          </span>
          <span className="text-[11.5px] font-semibold leading-tight text-[#0F1222]">Gift Cards</span>
          <span className="text-[10.5px] text-[#667085]">Redeem rewards</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-4 py-3.5 text-white">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/80">
          Your balance
        </p>
        <p className="mt-1 text-[24px] font-extrabold leading-none tracking-tight">
          {pointsBalance.toLocaleString()}
          <span className="ml-1.5 text-[13.5px] font-semibold text-white/85">Points</span>
        </p>
      </div>
    </div>
  );

  /* Step 2 — Earn Points via scan */
  const renderStep2 = () => (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF6DA] ring-1 ring-[#FFC85D]/40">
        <Icon.Camera className="h-6 w-6 text-[#C49A2C]" />
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6356e5]">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356e5]" />
        Step 1 · Earn
      </span>
      <h2 className="mt-3 text-[22px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[26px]">
        Scan your first <span className="uc-gold-gradient">receipt</span>.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#4B5563]">
        Snap a photo of any eligible fuel or grocery receipt and we&rsquo;ll credit
        your Points within minutes.
      </p>

      <ul className="mt-5 space-y-2.5 text-left">
        <li className="flex items-start gap-2.5 text-[13px] text-[#0F1222]">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E5F7EE] text-[#10B981]">
            <Icon.Check className="h-3 w-3" />
          </span>
          Fuel receipts earn Fuel Rewards at your tier rate
        </li>
        <li className="flex items-start gap-2.5 text-[13px] text-[#0F1222]">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E5F7EE] text-[#10B981]">
            <Icon.Check className="h-3 w-3" />
          </span>
          Eligible grocery + retail receipts earn Points
        </li>
        <li className="flex items-start gap-2.5 text-[13px] text-[#0F1222]">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E5F7EE] text-[#10B981]">
            <Icon.Check className="h-3 w-3" />
          </span>
          Approvals usually take less than a minute
        </li>
      </ul>
    </div>
  );

  /* Step 3 — Use Points on Bonus Draws */
  const renderStep3 = () => (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDFB] ring-1 ring-[#E0DAFF]">
        <Icon.Trophy className="h-6 w-6 text-[#6356E5]" />
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6356e5]">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356e5]" />
        Step 2 · Spend
      </span>
      <h2 className="mt-3 text-[22px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[26px]">
        Enter <span className="uc-gold-gradient">Bonus Draws</span>.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#4B5563]">
        Use your Points to enter capped Bonus Draws. Winners are picked
        transparently and published when each draw closes.
      </p>

      <div className="mt-5 rounded-2xl border border-[#EFEDF5] bg-[#FBFAFF] p-4 text-left">
        <p className="text-[12.5px] font-semibold text-[#0F1222]">What makes UNICASH Bonus Draws different</p>
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-[#4B5563]">
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
            Every draw has a hard cap — no oversubscription
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
            Winner certificates are verifiable and published
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
            Max 1 entry per member — fair for everyone
          </li>
        </ul>
      </div>

      <p className="mt-4 text-[12.5px] text-[#667085]">
        Or <strong className="text-[#0F1222]">Redeem Gift Cards</strong> directly from your Points balance.
      </p>
    </div>
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
    >
      {/* Backdrop — intentionally NOT clickable. We want a positive
          action from the user (Get started or Skip). */}
      <div aria-hidden className="absolute inset-0 bg-[#0F1222]/55 backdrop-blur-sm" />

      <div className="relative w-full sm:max-w-md">
        <div className="m-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:m-6 sm:max-h-none sm:rounded-3xl">
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-2.5 sm:hidden">
            <div className="h-1.5 w-12 rounded-full bg-[#E0DAFF]" />
          </div>

          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-1.5 pt-4 pb-1 sm:pt-6">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                aria-hidden
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? 'w-7 bg-[#6356E5]'
                    : s < step
                      ? 'w-1.5 bg-[#6356E5]/60'
                      : 'w-1.5 bg-[#E7E9F2]'
                }`}
              />
            ))}
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-2 sm:px-8 sm:pb-8" id="onboarding-title">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          {/* CTA stack — bottom of card */}
          <div className="border-t border-[#EFEDF5] bg-[#FBFAFF] px-6 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-col gap-2">
              {step === 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="uc-lift-sm relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                  >
                    Get started
                    <Icon.ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => finish('skipped')}
                    disabled={submitting}
                    className="inline-flex h-10 w-full items-center justify-center rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    Skip for now
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => finish('completed', '/scan-receipts')}
                    disabled={submitting}
                    className="uc-lift-sm relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    <Icon.Camera className="h-4 w-4" />
                    Scan a Receipt now
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-[#E7E9F2] bg-white px-5 text-[13.5px] font-semibold text-[#4B5563] transition-colors hover:border-[#C8C5EA] hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#F4F1FB] px-5 text-[13.5px] font-semibold text-[#6356E5] transition-colors hover:bg-[#E7E3F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => finish('completed', '/giveaways')}
                    disabled={submitting}
                    className="uc-lift-sm relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    Browse Bonus Draws
                    <Icon.ArrowRight className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-[#E7E9F2] bg-white px-5 text-[13.5px] font-semibold text-[#4B5563] transition-colors hover:border-[#C8C5EA] hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => finish('completed')}
                      disabled={submitting}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#F4F1FB] px-5 text-[13.5px] font-semibold text-[#6356E5] transition-colors hover:bg-[#E7E3F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:opacity-60"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
