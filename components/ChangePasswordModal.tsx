'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const LockIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const InfoIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="uc-cpm-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cpm-title"
      onClick={onClose}
    >
      <div
        className="uc-cpm-modal relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:rounded-3xl"
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
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/85 backdrop-blur transition-colors hover:bg-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Hero band — purple gradient with lock icon */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
          <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />
          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
            <LockIcon className="h-7 w-7 text-[#FFE2B0]" />
          </span>
          <h2 id="cpm-title" className="relative mt-4 text-[20px] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[22px]">
            Set your password
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <p className="text-[14px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
            For security, please change your password to something you&rsquo;ll remember and use regularly.
          </p>

          {/* Info note */}
          <div className="mt-4 rounded-2xl bg-[#F4F1FB] p-4 ring-1 ring-[#E0DAFF]">
            <div className="flex items-start gap-2.5">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6356E5]" />
              <p className="text-[12.5px] leading-relaxed text-[#4B5563]">
                <span className="font-semibold text-[#0F1222]">Note:</span> Since your account was created automatically, you don&rsquo;t need to enter your current password for your first password change.
              </p>
            </div>
          </div>

          {/* CTAs — vertical stack */}
          <div className="mt-6 flex flex-col gap-2.5">
            <Link href="/dashboard/password" onClick={onClose} className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2">
              Change password now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              Later
            </button>
          </div>
        </div>

        {/* Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes uc-cpm-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes uc-cpm-scale-in {
            from { transform: scale(0.96); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
          @keyframes uc-cpm-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .uc-cpm-modal    { animation: uc-cpm-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
          .uc-cpm-backdrop { animation: uc-cpm-fade-in 220ms ease-out; }
          @media (min-width: 640px) {
            .uc-cpm-modal  { animation: uc-cpm-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-cpm-modal,
            .uc-cpm-backdrop { animation: none !important; }
          }
        ` }} />
      </div>
    </div>,
    document.body,
  );
}
