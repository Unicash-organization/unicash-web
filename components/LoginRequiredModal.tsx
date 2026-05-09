'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Path to redirect to after successful login. Defaults to /scan-receipts. */
  redirectAfterLogin?: string;
}

/* -----------------------------------------------------------------------
   Inline v4 icons — match MembershipRequiredModal style
----------------------------------------------------------------------- */
const ScanIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
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

export default function LoginRequiredModal({
  isOpen,
  onClose,
  redirectAfterLogin = '/scan-receipts',
}: LoginRequiredModalProps) {
  const [mounted, setMounted] = useState(false);

  /* Portal mount guard — `document` is undefined during SSR.
     Modal is only triggered by user click, so by the time isOpen=true,
     mounted is already true. */
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const loginHref = `/login?redirect=${encodeURIComponent(redirectAfterLogin)}`;

  /* ------------------------------------------------------------------
     JSX — bottom sheet on mobile, centered modal on desktop.
     Tap outside to close. Portaled to document.body to avoid
     transformed-ancestor containing-block issues (per UNICASH modal pattern).
  ------------------------------------------------------------------ */
  return createPortal(
    <div
      className="uc-backdrop-anim fixed inset-0 z-50 flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-modal-title"
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

        {/* Hero band — purple gradient with scan icon */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
          <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />

          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
            <ScanIcon className="h-7 w-7 text-[#FFE2B0]" />
          </span>
          <h2
            id="login-required-modal-title"
            className="relative mt-4 text-[20px] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[22px]"
          >
            Sign in to scan receipts
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <p className="text-[14px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
            Sign in to scan eligible receipts and earn Points for Bonus Draws or selected gift cards.
          </p>

          {/* CTAs — vertical stack, primary on top.
              Primary uses next/link (preserves SPA navigation). */}
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href={loginHref}
              onClick={onClose}
              className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              Sign in
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              Maybe later
            </button>
          </div>
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
