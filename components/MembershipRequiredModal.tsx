'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

export type MembershipRequiredContext = 'scan-receipts' | 'bonus-draw' | 'major-draw' | 'default';

interface MembershipRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  boostPackId?: string;
  message?: string;
  isPaused?: boolean;
  isCancelled?: boolean;
  /** Feature context that drives copy. Omit/'default' preserves existing boost-pack copy. */
  context?: MembershipRequiredContext;
  /** Backend user.state — used to vary copy for past-due / canceled / etc. */
  userState?:
    | 'NON_MEMBER'
    | 'INCOMPLETE'
    | 'MEMBER_PAST_DUE'
    | 'MEMBER_PAYMENT_FAILED'
    | 'MEMBER_CANCELED'
    | string;
}

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const CrownIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
    <path d="M5 21h14" />
  </svg>
);
const RefreshIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/* Active Membership benefits — shown in modal as inline value props */
const MEMBERSHIP_BENEFITS = [
  'Monthly Points credited every renewal',
  'Free Major Draw entries each month',
  'Top up anytime with Point Boosters',
  'Cancel anytime · No long-term commitment',
];

export default function MembershipRequiredModal({
  isOpen,
  onClose,
  boostPackId,
  message,
  isPaused = false,
  isCancelled = false,
  context = 'default',
  userState,
}: MembershipRequiredModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  /* Portal mount guard — `document` is undefined during SSR.
     useEffect runs after hydration; modal is only triggered by user click,
     so by the time isOpen=true, mounted is already true. */
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  /* ------------------------------------------------------------------
     State-driven content. Logic preserved exactly:
     - localStorage pendingBoostPackId on default state
     - router.push to /dashboard/membership or /#membership-plans
     - onClose called before navigation
  ------------------------------------------------------------------ */
  const getModalContent = () => {
    /* -------- context: scan-receipts ------------------------------------
       Phase 2 entry-point gating for the Scan Receipts feature.
       Copy varies by `userState` returned from backend (memberActive
       users never reach this modal — gating happens in MobileBottomNav).
    -------------------------------------------------------------------- */
    if (context === 'scan-receipts') {
      if (userState === 'MEMBER_PAST_DUE' || userState === 'MEMBER_PAYMENT_FAILED') {
        return {
          Icon: RefreshIcon,
          title: 'Update your payment',
          body: 'Update your payment to keep scanning receipts and earning Points.',
          primaryButton: 'Update payment',
          secondaryButton: 'Maybe later',
          primaryAction: () => {
            onClose();
            router.push('/dashboard/billing');
          },
        };
      }
      if (userState === 'MEMBER_CANCELED') {
        return {
          Icon: RefreshIcon,
          title: 'Resume your membership',
          body: 'Resume your membership to start earning Points from receipts again.',
          primaryButton: 'Resume membership',
          secondaryButton: 'Maybe later',
          primaryAction: () => {
            onClose();
            router.push('/dashboard/membership');
          },
        };
      }
      // NON_MEMBER, INCOMPLETE, undefined, or any other state → upsell
      return {
        Icon: CrownIcon,
        title: 'Members earn Points',
        body: 'Become a Member to scan receipts and earn Points for Bonus Draws or selected gift cards.',
        primaryButton: 'View Memberships',
        secondaryButton: 'Maybe later',
        primaryAction: () => {
          onClose();
          router.push('/#membership-plans');
        },
      };
    }

    /* -------- default / boost-pack flow (existing behaviour) ----------- */
    if (isPaused) {
      return {
        Icon: RefreshIcon,
        title: 'Resume your Membership',
        body:
          'Point Boosters are exclusive to active Members. Resume your Membership to top up Points anytime.',
        primaryButton: 'Resume Membership',
        secondaryButton: 'Maybe later',
        primaryAction: () => {
          onClose();
          router.push('/dashboard/membership');
        },
      };
    } else if (isCancelled) {
      return {
        Icon: RefreshIcon,
        title: 'Reactivate to top up Points',
        body:
          'Your Membership has been cancelled. Reactivate to unlock Point Boosters and keep earning Points for Bonus Draws.',
        primaryButton: 'Reactivate Membership',
        secondaryButton: 'Maybe later',
        primaryAction: () => {
          onClose();
          router.push('/#membership-plans');
        },
      };
    } else {
      return {
        Icon: CrownIcon,
        title: 'Become a UNICASH Member',
        body:
          message ||
          'Point Boosters are an exclusive Member perk. Active Members also receive Monthly Points and free Major Draw entries every renewal.',
        primaryButton: 'View Membership Plans',
        secondaryButton: 'Maybe later',
        primaryAction: () => {
          onClose();
          if (boostPackId) {
            // Save boostPackId to localStorage for later use in checkout — preserved
            if (typeof window !== 'undefined') {
              localStorage.setItem('pendingBoostPackId', boostPackId);
            }
            router.push('/#membership-plans');
          } else {
            router.push('/#membership-plans');
          }
        },
      };
    }
  };

  const modalContent = getModalContent();
  const Icon = modalContent.Icon;

  /* ------------------------------------------------------------------
     JSX — bottom sheet on mobile, centered modal on desktop.
     Tap outside to close (preserves onClose behaviour).

     IMPORTANT: portaled to document.body via createPortal because the
     Pulse BoostPackCard uses `lg:scale-[1.025]` (a CSS transform), which
     creates a new containing block per CSS spec — without portal, the
     modal's `position: fixed` would be constrained to that card's box
     instead of the viewport, making the modal smaller on Pulse vs Spark/Surge.
  ------------------------------------------------------------------ */
  return createPortal(
    <div
      className="uc-backdrop-anim fixed inset-0 z-50 flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-modal-title"
      onClick={onClose}
    >
      <div
        className="uc-modal-anim relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle (visual cue this is dismissable) */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[#E0DAFF]" />
        </div>

        {/* Close button — top right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/85 backdrop-blur transition-colors hover:bg-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Hero band — purple gradient with crown/refresh icon */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
          {/* Soft inner glows */}
          <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />

          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
            <Icon className="h-7 w-7 text-[#FFE2B0]" />
          </span>
          <h2
            id="membership-modal-title"
            className="relative mt-4 text-[20px] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[22px]"
          >
            {modalContent.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <p className="text-[14px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
            {modalContent.body}
          </p>

          {/* Membership benefit chips — inline value props */}
          <ul className="mt-5 space-y-2.5">
            {MEMBERSHIP_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] ring-1 ring-[#E0DAFF]">
                  <CheckIcon className="h-3 w-3 text-[#6356E5]" />
                </span>
                <span className="text-[13px] leading-relaxed text-[#0F1222] sm:text-[13.5px]">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>

          {/* CTAs — stacked vertically on all viewports.
              Modal CTAs are not competing for horizontal space; vertical stack
              prevents text wrap and matches Apple/Stripe/Linear modal pattern.
              Primary on top (most likely action), secondary below. */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={modalContent.primaryAction}
              className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              {modalContent.primaryButton}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              {modalContent.secondaryButton}
            </button>
          </div>

          {/* Footer trust line */}
          <p className="mt-4 text-center text-[11.5px] text-[#667085]">
            Bank-grade Stripe checkout · Cancel anytime
          </p>
        </div>

        {/* Animations — slide up on mobile, scale in on desktop. Reduced motion = none. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes uc-modal-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes uc-modal-scale-in {
            from { transform: scale(0.96); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
          @keyframes uc-backdrop-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .uc-modal-anim    { animation: uc-modal-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
          .uc-backdrop-anim { animation: uc-backdrop-fade-in 220ms ease-out; }
          @media (min-width: 640px) {
            .uc-modal-anim  { animation: uc-modal-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-modal-anim,
            .uc-backdrop-anim { animation: none !important; }
          }
        ` }} />
      </div>
    </div>,
    document.body
  );
}
