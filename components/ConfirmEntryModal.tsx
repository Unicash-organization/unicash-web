'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import MembershipRequiredModal from './MembershipRequiredModal';

interface ConfirmEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  draw: {
    id: string;
    title: string;
    costPerEntry: number;
    state: string;
    entrants: number;
    cap: number;
    closedAt?: string;
    requiresMembership?: boolean;
    entryLimitMode?: 'single' | 'multi';
    maxEntriesPerMember?: number | null;
    /** Free Entry Draw campaign — no Points cost, one entry per account. */
    isFreeEntry?: boolean;
  };
  /** Entries the member already holds in this draw (MULTI) — caps the stepper. */
  alreadyEntered?: number;
  onSuccess?: () => void;
}

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const TicketIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M2 9V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z" />
    <path d="M13 5v2M13 17v2M13 11v2" />
  </svg>
);
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);
const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
const SpinnerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" fill="none" />
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function ConfirmEntryModal({
  isOpen,
  onClose,
  draw,
  alreadyEntered = 0,
  onSuccess,
}: ConfirmEntryModalProps) {
  /* ===== Logic preserved exactly — no changes ===== */
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // Brief success state before close (Solution 3)
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [membership, setMembership] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stats, setStats] = useState<{
    entryLimitMode: 'single' | 'multi';
    maxEntriesPerMember: number | null;
    remaining: number | null;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load live entry stats (mode + per-member cap + remaining) when the modal opens.
  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      return;
    }
    let active = true;
    api.draws
      .getEntryStats(draw.id)
      .then((res) => {
        if (active && res?.data) {
          setStats({
            entryLimitMode: res.data.entryLimitMode,
            maxEntriesPerMember: res.data.maxEntriesPerMember,
            remaining: res.data.remaining,
          });
        }
      })
      .catch(() => {
        /* fall back to draw props below */
      });
    return () => {
      active = false;
    };
  }, [isOpen, draw.id]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setShowToast(false);
      setSuccess(false); // Reset success state when modal closes
    } else if (draw.requiresMembership && user) {
      checkMembershipStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draw.requiresMembership, user]);

  const checkMembershipStatus = async () => {
    if (!user) return;
    setCheckingMembership(true);
    try {
      const [membershipRes, plansRes] = await Promise.all([
        api.membership.getUserMembership().catch(() => ({ data: null })),
        api.membership.getPlans().catch(() => ({ data: [] })),
      ]);
      setMembership(membershipRes.data);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setCheckingMembership(false);
    }
  };

  const isMulti =
    (stats?.entryLimitMode ?? draw.entryLimitMode) === 'multi';
  const maxPerMember = stats?.maxEntriesPerMember ?? draw.maxEntriesPerMember ?? null;
  const remainingCapacity = stats?.remaining ?? null;
  // Upper bound for the quantity stepper. Backend re-checks the real per-member
  // limit (existing entries + qty) and rejects with a clear message if exceeded.
  const maxQuantity = Math.max(
    1,
    Math.min(
      isMulti ? 99 : 1,
      // Per-member cap minus what the member already holds.
      maxPerMember != null ? maxPerMember - alreadyEntered : Infinity,
      remainingCapacity ?? Infinity,
    ),
  );
  const qty = Math.min(Math.max(1, quantity), maxQuantity);

  const isFreeEntryDraw = !!draw.isFreeEntry;
  const totalCredits = (user?.membershipCredits || 0) + (user?.boostCredits || 0);
  const totalCost = isFreeEntryDraw ? 0 : draw.costPerEntry * qty;
  const hasEnoughCredits = totalCredits >= totalCost;
  const isUnlimitedCapacity = draw.cap === -1;
  const isSoldOut = !isUnlimitedCapacity && (draw.state === 'soldOut' || draw.entrants >= draw.cap);
  const isClosedByDate = draw.closedAt ? new Date(draw.closedAt) < new Date() : false;
  const isClosed = draw.state === 'closed' || isClosedByDate;
  const isCanceled = membership?.status === 'canceled';
  const periodEnded =
    membership?.currentPeriodEnd && new Date(membership.currentPeriodEnd) < new Date();
  const hasActiveMembership =
    !!membership &&
    !isCanceled &&
    membership.status === 'active' &&
    !membership.isPaused &&
    !periodEnded;
  const isPaymentFailed =
    membership?.status === 'payment_failed' || membership?.status === 'past_due';
  const isPaused = membership?.isPaused;
  const needsMembership =
    draw.requiresMembership &&
    (!user || !hasActiveMembership || isPaymentFailed || isPaused || isCanceled);

  const handleEnter = async () => {
    if (needsMembership) {
      handleGetMembership();
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      /* Solution 1+2+3 — perceived speed boost without touching backend logic.

         Flow:
         1. Backend `enter` call (only awaited blocking step — required for confirmation)
         2. Show brief 600ms ✓ success state in CTA (premium feedback)
         3. Close modal
         4. Refresh user + parent draw data in BACKGROUND (Promise.all, fire-and-forget)
            → no longer blocks modal close

         Saves ~2.2s of perceived wait vs the old sequential await + 1.5s artificial delay.
         All API calls preserved exactly — same idempotency key, same enter endpoint,
         same refresh chain, just no longer serialized. */
      const idempotencyKey = `entry-${draw.id}-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await api.draws.enter(draw.id, idempotencyKey, qty);

      // Brief ✓ success state in CTA (Solution 3)
      setLoading(false);
      setSuccess(true);

      /* Free Entry Draw — conversion moment: keep the modal OPEN and show
         the membership nudge instead of auto-closing. onSuccess (which may
         reload the page) is deferred until the member dismisses the panel. */
      if (isFreeEntryDraw) {
        refreshUser().catch(() => {});
        return;
      }

      // Show toast (auto-dismisses via global toast lib)
      setToastMessage('Entry confirmed!');
      setShowToast(true);

      // Close modal after brief feedback (~600ms — long enough to read ✓)
      setTimeout(() => {
        onClose();
        setShowToast(false);
      }, 600);

      // Background refresh — non-blocking, parallel (Solution 2)
      Promise.all([
        refreshUser(),
        Promise.resolve(onSuccess?.()),
      ]).catch((err) => {
        // Refresh failures don't affect the entry — entry is already confirmed server-side
        console.warn('[ConfirmEntry] Background refresh failed:', err);
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to enter draw';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGetMembership = () => {
    onClose();
    const defaultPlan = plans.find((p: any) => p.tier === 'uni_plus') || plans[0];
    const planId = defaultPlan?.id || '';
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectDrawId', draw.id);
    }
    router.push(`/checkout?planId=${planId}&drawId=${draw.id}`);
  };

  const handleBuyBoostPack = () => {
    const hasActive =
      membership?.status === 'active' &&
      !membership?.isPaused &&
      membership?.currentPeriodEnd &&
      new Date(membership.currentPeriodEnd) > new Date();
    if (!user || !hasActive) {
      setShowMembershipModal(true);
    } else {
      onClose();
      router.push('/point-boosters#choose-boost-pack');
    }
  };

  if (!isOpen || !mounted) return null;

  /* ===== Visual layer — v4 redesign ===== */

  // Determine warning state for the alert block
  const warningState = needsMembership && !checkingMembership
    ? (isPaymentFailed
        ? { tone: 'error', title: 'Payment Failed', body: 'Your Membership payment failed. Please update your payment method to continue entering Bonus Draws.' }
        : isPaused
          ? { tone: 'warning', title: 'Membership Paused', body: 'Your Membership is currently paused. Resume your Membership to enter Bonus Draws.' }
          : isCanceled
            ? { tone: 'error', title: 'Membership Cancelled', body: 'Your Membership has been cancelled. Start a new Membership to enter Bonus Draws.' }
            : { tone: 'info', title: 'Members-only Bonus Draw', body: 'This Bonus Draw is exclusive to UNICASH Members. Join a Membership to unlock access.' })
    : null;

  // CTA state
  const renderPrimaryCta = () => {
    if (checkingMembership) {
      return (
        <button disabled className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E7E9F2] px-5 text-[14.5px] font-bold text-[#9CA0B3]">
          <SpinnerIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          Checking…
        </button>
      );
    }
    if (needsMembership) {
      return (
        <button
          onClick={handleGetMembership}
          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
        >
          Get Membership
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      );
    }
    if (!hasEnoughCredits && !isSoldOut && !isClosed) {
      return (
        <button
          onClick={handleBuyBoostPack}
          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
        >
          Get a Point Booster
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      );
    }
    return (
      <button
        onClick={handleEnter}
        disabled={loading || success || isSoldOut || isClosed}
        className={`inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
          success
            ? 'bg-gradient-to-r from-[#10B981] to-[#34D399] focus-visible:ring-[#10B981] disabled:opacity-100'
            : 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] hover:from-[#5346D6] hover:to-[#7867EC] focus-visible:ring-[#6356E5] disabled:opacity-60'
        }`}
      >
        {success ? (
          <>
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
            Entry confirmed
          </>
        ) : loading ? (
          <>
            <SpinnerIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            Confirming…
          </>
        ) : (
          <>
            Confirm Entry
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {createPortal(
        <div
          className="uc-cem-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cem-title"
          onClick={onClose}
        >
          <div
            className="uc-cem-modal relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-2.5 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-[#E0DAFF]" />
            </div>

            {/* Close (X) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              disabled={loading || checkingMembership}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/85 backdrop-blur transition-colors hover:bg-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            {/* Hero band */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
              <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />
              <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
                <TicketIcon className="h-7 w-7 text-[#FFE2B0]" />
              </span>
              <h2 id="cem-title" className="relative mt-4 text-[20px] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[22px]">
                {isFreeEntryDraw ? (success ? 'Entry Confirmed' : 'Confirm Free Entry') : 'Confirm Entry'}
              </h2>
              {draw.title && (
                <p className="relative mt-1 text-[12.5px] font-medium text-white/75 line-clamp-1">
                  {draw.title}
                </p>
              )}
            </div>

            {/* Free Entry success — conversion panel for Free accounts,
                plain congratulations for paid Members (no pointless upsell) */}
            {success && isFreeEntryDraw ? (
              <div className="px-6 pb-7 pt-6 text-center sm:px-7 sm:pb-8">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] ring-1 ring-[#A7F3D0]">
                  <CheckCircleIcon className="h-7 w-7 text-[#10B981]" />
                </span>
                <h3 className="mt-4 text-[22px] font-extrabold tracking-tight text-[#0F1222]">
                  You&apos;re in!
                </h3>
                {(() => {
                  const isPaidMember =
                    !!(user as any)?.state && (user as any).state !== 'free';
                  return isPaidMember ? (
                    <>
                      <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-[#4B5563]">
                        Good luck — the winner is selected live on Facebook.
                      </p>
                      <div className="mt-6 flex flex-col gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push('/dashboard/entries');
                          }}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                        >
                          View My Entries
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSuccess?.();
                          }}
                          className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                        >
                          Done
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-[#4B5563]">
                        Members get entries in every Major Draw automatically.
                      </p>
                      <div className="mt-6 flex flex-col gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push('/#membership-plans');
                          }}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                        >
                          Join Now
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSuccess?.();
                          }}
                          className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                        >
                          Maybe later
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
            <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
              {/* Quantity stepper — MULTI draws only */}
              {isMulti && !isSoldOut && !isClosed && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#E0DAFF] bg-white p-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                      Entries
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#9CA0B3]">
                      {maxPerMember != null
                        ? `Up to ${maxPerMember.toLocaleString()} per member`
                        : 'Add as many as you like'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-[#E0DAFF] bg-[#FBFAFF] p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Decrease"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6356E5] shadow-sm ring-1 ring-[#E0DAFF] transition hover:bg-[#F4F1FB] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      –
                    </button>
                    <span className="w-9 text-center text-[16px] font-extrabold tabular-nums text-[#0F1222]">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                      disabled={qty >= maxQuantity}
                      aria-label="Increase"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6356E5] shadow-sm ring-1 ring-[#E0DAFF] transition hover:bg-[#F4F1FB] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Cost summary card — Free Entry Draws show a simple green card */}
              {isFreeEntryDraw ? (
                <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1F7A37]">
                      Entry cost
                    </span>
                    <span className="text-[26px] font-extrabold leading-none tracking-tight text-[#1F7A37]">
                      Free
                    </span>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-[#166534]">
                    No Points needed · one entry per account
                  </p>
                </div>
              ) : (
              <div className="rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                    {qty > 1 ? `Total cost (${qty} entries)` : 'Entry cost'}
                  </span>
                  <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-[26px] font-extrabold leading-none tracking-tight text-transparent tabular-nums">
                    {totalCost.toLocaleString()}
                    <span className="ml-1.5 text-[13px] font-semibold text-[#667085]">Points</span>
                  </span>
                </div>
                {qty > 1 && (
                  <p className="mt-1 text-right text-[11px] text-[#9CA0B3] tabular-nums">
                    {draw.costPerEntry.toLocaleString()} Points × {qty}
                  </p>
                )}
                {user && (
                  <>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E0DAFF] pt-3">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                        Your balance
                      </span>
                      <span className={`inline-flex items-baseline gap-1.5 text-[14px] font-extrabold tracking-tight tabular-nums ${
                        hasEnoughCredits ? 'text-[#0F1222]' : 'text-[#EF4444]'
                      }`}>
                        {totalCredits.toLocaleString()}
                        <span className={`text-[11px] font-semibold ${
                          hasEnoughCredits ? 'text-[#667085]' : 'text-[#EF4444]/80'
                        }`}>Points</span>
                      </span>
                    </div>
                    {/* Status footnote — sufficient or insufficient indicator */}
                    {hasEnoughCredits ? (
                      <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981]">
                        <CheckCircleIcon className="h-3 w-3" />
                        <span>
                          {(totalCredits - totalCost).toLocaleString()} Points remaining after {qty > 1 ? 'entries' : 'entry'}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#EF4444]">
                        <AlertIcon className="h-3 w-3" />
                        <span>
                          Need {(totalCost - totalCredits).toLocaleString()} more Points to enter
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>
              )}

              {/* Membership warning block */}
              {warningState && (
                <div className={`mt-4 rounded-2xl p-4 ring-1 ${
                  warningState.tone === 'error'
                    ? 'bg-[#FEF2F2] ring-[#FCA5A5]/60'
                    : warningState.tone === 'warning'
                      ? 'bg-[#FFF7E6] ring-[#F8DDA8]'
                      : 'bg-[#F4F1FB] ring-[#E0DAFF]'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center ${
                      warningState.tone === 'error'
                        ? 'text-[#EF4444]'
                        : warningState.tone === 'warning'
                          ? 'text-[#9C5410]'
                          : 'text-[#6356E5]'
                    }`}>
                      <AlertIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[13.5px] font-extrabold tracking-tight ${
                        warningState.tone === 'error'
                          ? 'text-[#7F1D1D]'
                          : warningState.tone === 'warning'
                            ? 'text-[#9C5410]'
                            : 'text-[#0F1222]'
                      }`}>
                        {warningState.title}
                      </p>
                      <p className={`mt-1 text-[12.5px] leading-relaxed ${
                        warningState.tone === 'error'
                          ? 'text-[#991B1B]'
                          : warningState.tone === 'warning'
                            ? 'text-[#7C3F00]'
                            : 'text-[#4B5563]'
                      }`}>
                        {warningState.body}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-2xl bg-[#FEF2F2] p-4 ring-1 ring-[#FCA5A5]/60">
                  <div className="flex items-start gap-2.5">
                    <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
                    <p className="text-[13px] leading-relaxed text-[#991B1B]">{error}</p>
                  </div>
                </div>
              )}

              {/* Sold out */}
              {!error && isSoldOut && (
                <div className="mt-4 rounded-2xl bg-[#FEF2F2] p-4 ring-1 ring-[#FCA5A5]/60">
                  <div className="flex items-start gap-2.5">
                    <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
                    <p className="text-[13px] leading-relaxed text-[#991B1B]">
                      This Bonus Draw is sold out. Your Points were not used.
                    </p>
                  </div>
                </div>
              )}

              {/* Closed */}
              {!error && isClosed && (
                <div className="mt-4 rounded-2xl bg-[#FEF2F2] p-4 ring-1 ring-[#FCA5A5]/60">
                  <div className="flex items-start gap-2.5">
                    <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
                    <p className="text-[13px] leading-relaxed text-[#991B1B]">
                      This Bonus Draw has closed. Your Points were not used.
                    </p>
                  </div>
                </div>
              )}

              {/* CTAs — vertical stack */}
              <div className="mt-6 flex flex-col gap-2.5">
                {renderPrimaryCta()}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading || checkingMembership}
                  className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
            )}

            {/* Animations */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes uc-cem-slide-up {
                from { transform: translateY(100%); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }
              @keyframes uc-cem-scale-in {
                from { transform: scale(0.96); opacity: 0; }
                to   { transform: scale(1);    opacity: 1; }
              }
              @keyframes uc-cem-fade-in {
                from { opacity: 0; }
                to   { opacity: 1; }
              }
              .uc-cem-modal    { animation: uc-cem-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
              .uc-cem-backdrop { animation: uc-cem-fade-in 220ms ease-out; }
              @media (min-width: 640px) {
                .uc-cem-modal  { animation: uc-cem-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
              }
              @media (prefers-reduced-motion: reduce) {
                .uc-cem-modal,
                .uc-cem-backdrop { animation: none !important; }
              }
            ` }} />
          </div>
        </div>,
        document.body
      )}

      {/* Nested MembershipRequiredModal — already portals itself */}
      <MembershipRequiredModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        isPaused={membership?.isPaused}
        isCancelled={membership?.status === 'canceled' || membership?.cancelAtPeriodEnd}
      />

      {/* Success toast — portaled separately to avoid stacking issues */}
      {showToast &&
        createPortal(
          <div className="uc-toast-anim fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 rounded-full bg-[#10B981] px-5 py-3 text-white shadow-[0_20px_40px_-12px_rgba(16,185,129,0.45)]">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-[14px] font-bold">{toastMessage}</span>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes uc-toast-in {
                from { transform: translateY(20px); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }
              .uc-toast-anim { animation: uc-toast-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
              @media (prefers-reduced-motion: reduce) {
                .uc-toast-anim { animation: none !important; }
              }
            ` }} />
          </div>,
          document.body,
        )}
    </>
  );
}
