'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { subscribeToToasts, type ToastEvent, type ToastType } from '@/lib/toast';

/* -----------------------------------------------------------------------
   ToastProvider — custom v4-branded toast notifications.

   Mounted once at app root (layout.tsx). Subscribes to the toast event
   bus from `lib/toast.ts` and renders a stack of toast cards via
   createPortal to document.body.

   Pattern: top-right stack, slide-in from right, auto-dismiss with timer
   progress bar (purple gradient), pause-on-hover, manual close button.
----------------------------------------------------------------------- */

type ToastItem = ToastEvent;

const TYPE_CONFIG: Record<ToastType, {
  borderColor: string;
  iconBg: string;
  iconText: string;
  iconRing: string;
  Icon: React.FC<{ className?: string }>;
  progressGradient: string;
}> = {
  success: {
    borderColor: 'border-[#A7F3D0]',
    iconBg: 'bg-[#ECFDF5]',
    iconText: 'text-[#10B981]',
    iconRing: 'ring-[#A7F3D0]',
    Icon: ({ className = '' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    progressGradient: 'from-[#10B981] to-[#34D399]',
  },
  error: {
    borderColor: 'border-[#FCA5A5]',
    iconBg: 'bg-[#FEE2E2]',
    iconText: 'text-[#B91C1C]',
    iconRing: 'ring-[#FCA5A5]',
    Icon: ({ className = '' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    progressGradient: 'from-[#EF4444] to-[#F97316]',
  },
  warning: {
    borderColor: 'border-[#FFC85D]/50',
    iconBg: 'bg-[#FFF6DA]',
    iconText: 'text-[#9C5410]',
    iconRing: 'ring-[#FFC85D]/40',
    Icon: ({ className = '' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    progressGradient: 'from-[#F59E0B] to-[#FBBF24]',
  },
  info: {
    borderColor: 'border-[#E0DAFF]',
    iconBg: 'bg-[#F4F1FB]',
    iconText: 'text-[#6356E5]',
    iconRing: 'ring-[#E0DAFF]',
    Icon: ({ className = '' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    progressGradient: 'from-[#6356E5] to-[#8B7BFF]',
  },
};

const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Subscribe to global toast events
  useEffect(() => {
    return subscribeToToasts((event) => {
      setToasts((prev) => [...prev, event]);
    });
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end gap-2.5 px-4 py-4 sm:items-end sm:px-6 sm:py-6"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>,
    document.body,
  );
}

/* -----------------------------------------------------------------------
   Single toast card with auto-dismiss timer + pause-on-hover
----------------------------------------------------------------------- */
function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100); // 100 → 0 over duration
  const [paused, setPaused] = useState(false);
  const cfg = TYPE_CONFIG[toast.type];
  const duration = toast.duration ?? 5000;
  const startedAt = useRef<number>(Date.now());
  const elapsedBeforePause = useRef<number>(0);

  // Slide-in animation on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, []);

  // Timer + progress bar
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();

    const tick = () => {
      const elapsed = elapsedBeforePause.current + (Date.now() - startedAt.current);
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        // Slide-out then remove
        setVisible(false);
        setTimeout(onDismiss, 220);
      }
    };

    const interval = setInterval(tick, 50);
    tick();

    return () => {
      clearInterval(interval);
      elapsedBeforePause.current += Date.now() - startedAt.current;
    };
  }, [paused, duration, onDismiss]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 220);
  };

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-white shadow-[0_18px_50px_-18px_rgba(15,18,34,0.25),0_4px_14px_-4px_rgba(15,18,34,0.06)] transition-all duration-200 ease-out ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
      } ${cfg.borderColor}`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${cfg.iconBg} ${cfg.iconRing}`}>
          <cfg.Icon className={`h-4 w-4 ${cfg.iconText}`} />
        </span>

        {/* Message */}
        <p className="min-w-0 flex-1 pt-1 text-[13.5px] font-semibold leading-snug text-[#0F1222]">
          {toast.message}
        </p>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss"
          className="-mr-1 -mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#A3A8BE] transition-colors hover:bg-[#F4F1FB] hover:text-[#0F1222]"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Timer progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${cfg.progressGradient} transition-[width] ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
