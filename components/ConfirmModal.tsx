'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /**
   * QW-7 — message accepts ReactNode so callers can pass rich content
   * (e.g. an itemised list of what the user is about to lose).
   * Plain strings continue to work and render with `whitespace-pre-line`.
   */
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  confirmDisabled?: boolean;
}

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const AlertTriangleIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const InfoIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

/* Type → icon + button gradient mapping */
const TYPE_CONFIG = {
  danger: {
    Icon: AlertTriangleIcon,
    iconColor: 'text-[#FCA5A5]',
    btnCls:
      'bg-gradient-to-r from-[#EF4444] to-[#F87171] hover:from-[#DC2626] hover:to-[#EF4444] text-white shadow-[0_14px_30px_-12px_rgba(239,68,68,0.55)] focus-visible:ring-[#EF4444]',
  },
  warning: {
    Icon: AlertTriangleIcon,
    iconColor: 'text-[#FFC85D]',
    btnCls:
      'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] text-white shadow-[0_14px_30px_-12px_rgba(245,158,11,0.55)] focus-visible:ring-[#F59E0B]',
  },
  success: {
    Icon: CheckCircleIcon,
    iconColor: 'text-[#A7F3D0]',
    btnCls:
      'bg-gradient-to-r from-[#10B981] to-[#34D399] hover:from-[#059669] hover:to-[#10B981] text-white shadow-[0_14px_30px_-12px_rgba(16,185,129,0.55)] focus-visible:ring-[#10B981]',
  },
  info: {
    Icon: InfoIcon,
    iconColor: 'text-[#FFE2B0]',
    btnCls:
      'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] hover:from-[#5346D6] hover:to-[#7867EC] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] focus-visible:ring-[#6356E5]',
  },
} as const;

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  confirmDisabled = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.Icon;

  return createPortal(
    <div
      className="uc-cm-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cm-title"
      onClick={onClose}
    >
      <div
        className="uc-cm-modal relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:rounded-3xl"
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

        {/* Hero band — UNICASH purple gradient (brand consistent across all types) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
          <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />
          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
            <Icon className={`h-7 w-7 ${cfg.iconColor}`} />
          </span>
          <h2 id="cm-title" className="relative mt-4 text-[20px] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[22px]">
            {title}
          </h2>
        </div>

        {/* Body — string messages keep whitespace-pre-line; ReactNode
           messages render as a styled block so callers can compose lists
           or paragraphs. */}
        <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          {typeof message === 'string' ? (
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
              {message}
            </p>
          ) : (
            <div className="text-[14px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
              {message}
            </div>
          )}

          {/* CTAs — vertical stack */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={`inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[14.5px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${cfg.btnCls}`}
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              {cancelText}
            </button>
          </div>
        </div>

        {/* Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes uc-cm-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes uc-cm-scale-in {
            from { transform: scale(0.96); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
          @keyframes uc-cm-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .uc-cm-modal    { animation: uc-cm-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
          .uc-cm-backdrop { animation: uc-cm-fade-in 220ms ease-out; }
          @media (min-width: 640px) {
            .uc-cm-modal  { animation: uc-cm-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-cm-modal,
            .uc-cm-backdrop { animation: none !important; }
          }
        ` }} />
      </div>
    </div>,
    document.body,
  );
}
