'use client';

/**
 * ScanReceiptModal — Phase 6 Scan Receipts upload flow.
 *
 * Visual states (internal state machine):
 *   idle      → file picker / drag-drop area + camera capture
 *   preview   → file selected, show thumbnail + Upload CTA
 *   uploading → POST /receipts/upload in flight
 *   processing→ backend OCR running (poll GET /receipts/:id every 2s)
 *   result    → terminal status reached (approved | rejected | duplicate | needs_review)
 *
 * Pattern: bottom-sheet on mobile, centered modal on desktop, portaled to
 * document.body via createPortal (avoids transformed-ancestor containing-block
 * issues — see UNICASH modal pattern).
 *
 * Gating is handled by callers (MobileBottomNav, /scan-receipts page) —
 * this modal assumes user is logged in + memberActive.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

/* -----------------------------------------------------------------------
   Inline icons — match v4 modal style
----------------------------------------------------------------------- */
const Icon = {
  Close: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Camera: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Upload: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Image: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Spinner: ({ className = '' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" fill="none" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Alert: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  Copy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Clock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Trash: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.85h-7a2 2 0 0 1-2-1.85L5 6M10 11v6M14 11v6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Sparkles: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   Types — mirror backend ReceiptStatus + ReceiptRejectReason enums
----------------------------------------------------------------------- */
type ReceiptStatus =
  | 'uploaded'
  | 'processing'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'duplicate';

type RejectReason =
  | 'not_a_receipt'
  | 'image_unclear'
  | 'missing_required_data'
  | 'duplicate_receipt'
  | 'receipt_too_old'
  | 'unsupported_receipt_type'
  | 'amount_not_eligible'
  | 'monthly_limit_reached'
  | 'manual_review_failed'
  | 'other';

interface ReceiptDto {
  id: string;
  status: ReceiptStatus;
  merchantName?: string | null;
  receiptDate?: string | null;
  receiptTotal?: string | number | null;
  category?: string | null;
  fuelLitres?: string | number | null;
  fuelType?: string | null;
  pointsAwarded?: number;
  pointsCalculated?: number;
  rejectReason?: RejectReason | null;
  imageUrl?: string;
  createdAt?: string;
  approvedAt?: string;
}

const REJECT_COPY: Record<RejectReason, { title: string; body: string }> = {
  not_a_receipt:           { title: "Doesn't look like a receipt", body: "We couldn't recognise this image as a receipt. Make sure the merchant name, date and total are clearly visible." },
  image_unclear:           { title: 'Image is unclear',            body: "Try uploading a sharper photo with the merchant, date and total fully visible." },
  missing_required_data:   { title: 'Missing required details',    body: "We couldn't read the merchant, date or total. Please re-upload a clearer image." },
  duplicate_receipt:       { title: 'Duplicate receipt',           body: 'This receipt has already been submitted.' },
  receipt_too_old:         { title: 'Receipt is too old',          body: 'Receipts must be uploaded within 14 days of the purchase date.' },
  unsupported_receipt_type:{ title: 'Receipt not eligible',        body: 'Only fuel receipts are eligible at the moment. We will support more merchants soon.' },
  amount_not_eligible:     { title: 'Amount below minimum',        body: 'Receipt total must be at least A$10 to be eligible.' },
  monthly_limit_reached:   { title: 'Monthly limit reached',       body: "You've reached this month's Points cap. Try again after your next billing cycle." },
  manual_review_failed:    { title: 'Receipt declined',            body: 'After admin review, this receipt did not meet the eligibility criteria.' },
  other:                   { title: 'Receipt rejected',            body: 'We were unable to award Points for this receipt. Please contact support if you think this is a mistake.' },
};

/* -----------------------------------------------------------------------
   Constants
----------------------------------------------------------------------- */
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000; // 90s — fall back to "we'll notify you"

type InternalState =
  | { kind: 'idle' }
  | { kind: 'preview'; file: File; previewUrl: string }
  | { kind: 'uploading'; file: File; previewUrl: string }
  | { kind: 'processing'; receiptId: string; previewUrl: string; pollStartedAt: number }
  | { kind: 'result'; receipt: ReceiptDto; previewUrl?: string }
  | { kind: 'error'; message: string; previewUrl?: string };

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a terminal status is reached (approved/rejected/etc). */
  onComplete?: (receipt: ReceiptDto) => void;
}

/* -----------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------- */
function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function formatAUD(amount: number | string | null | undefined): string {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return `A$${n.toFixed(2)}`;
}

function isTerminalStatus(s: ReceiptStatus): boolean {
  return s === 'approved' || s === 'rejected' || s === 'duplicate' || s === 'needs_review';
}

/* =======================================================================
   COMPONENT
======================================================================= */
export default function ScanReceiptModal({ isOpen, onClose, onComplete }: ScanReceiptModalProps) {
  const { refreshUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<InternalState>({ kind: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAbortRef = useRef<boolean>(false);

  /* Mount guard for portal — document undefined during SSR. */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Reset on open/close. Clean up object URL + polling. */
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      revokePreviewIfAny(state);
      setState({ kind: 'idle' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopPolling();
      revokePreviewIfAny(state);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- helpers -------- */
  const stopPolling = useCallback(() => {
    pollAbortRef.current = true;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const revokePreviewIfAny = (s: InternalState) => {
    if ('previewUrl' in s && s.previewUrl && typeof URL !== 'undefined') {
      try { URL.revokeObjectURL(s.previewUrl); } catch {}
    }
  };

  /* -------- file selection -------- */
  const handleFilePicked = (file: File | null) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setState({ kind: 'error', message: 'Please select an image (JPG, PNG, HEIC, or WebP).' });
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      setState({ kind: 'error', message: `Image is ${sizeMb.toFixed(1)} MB — please use one under ${MAX_FILE_SIZE_MB} MB.` });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setState({ kind: 'preview', file, previewUrl });
  };

  const handleClickFileInput = () => fileInputRef.current?.click();
  const handleClickCameraInput = () => cameraInputRef.current?.click();

  const handleClearPreview = () => {
    revokePreviewIfAny(state);
    setState({ kind: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  /* -------- upload + polling -------- */
  const handleUpload = async () => {
    if (state.kind !== 'preview') return;
    const { file, previewUrl } = state;
    setState({ kind: 'uploading', file, previewUrl });

    try {
      const idempotencyKey = generateIdempotencyKey();
      const res = await api.receipts.upload(file, idempotencyKey);
      const receiptId = res.data.id;

      // Backend returns immediately with status='uploaded' or 'processing'.
      // Begin polling.
      pollAbortRef.current = false;
      const pollStartedAt = Date.now();
      setState({ kind: 'processing', receiptId, previewUrl, pollStartedAt });
      pollReceipt(receiptId, previewUrl, pollStartedAt);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const message =
        code === 'MEMBERSHIP_REQUIRED'
          ? 'Membership required to scan receipts.'
          : err?.response?.data?.message || err?.message || 'Upload failed. Please try again.';
      setState({ kind: 'error', message, previewUrl });
    }
  };

  const pollReceipt = useCallback(
    async (receiptId: string, previewUrl: string, pollStartedAt: number) => {
      if (pollAbortRef.current) return;
      try {
        const res = await api.receipts.getById(receiptId);
        const receipt = res.data as ReceiptDto;

        if (isTerminalStatus(receipt.status)) {
          // Refresh user to pick up new boostCredits if approved.
          if (receipt.status === 'approved') {
            refreshUser().catch(() => {});
          }
          setState({ kind: 'result', receipt, previewUrl });
          onComplete?.(receipt);
          return;
        }

        // Still uploaded / processing — check timeout
        if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) {
          setState({
            kind: 'result',
            receipt: { ...receipt, status: 'needs_review' },
            previewUrl,
          });
          onComplete?.({ ...receipt, status: 'needs_review' });
          return;
        }

        pollTimerRef.current = setTimeout(() => {
          pollReceipt(receiptId, previewUrl, pollStartedAt);
        }, POLL_INTERVAL_MS);
      } catch (err: any) {
        // Network errors during poll — keep trying until timeout
        if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) {
          setState({ kind: 'error', message: 'We lost connection while processing your receipt. Check your receipt history shortly.', previewUrl });
          return;
        }
        pollTimerRef.current = setTimeout(() => {
          pollReceipt(receiptId, previewUrl, pollStartedAt);
        }, POLL_INTERVAL_MS);
      }
    },
    [onComplete, refreshUser],
  );

  /* -------- close handler — guard against close-during-upload -------- */
  const safeClose = () => {
    if (state.kind === 'uploading') return; // don't allow close mid-upload
    onClose();
  };

  /* -------- "scan another" reset (from result screen) -------- */
  const handleScanAnother = () => {
    revokePreviewIfAny(state);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    setState({ kind: 'idle' });
  };

  /* =====================================================================
     RENDER
  ===================================================================== */
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="uc-srm-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-receipt-modal-title"
      onClick={safeClose}
    >
      <div
        className="uc-srm-modal relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[#E0DAFF]" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={safeClose}
          aria-label="Close"
          disabled={state.kind === 'uploading'}
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/85 backdrop-blur transition-colors hover:bg-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40"
        >
          <Icon.Close className="h-4 w-4" />
        </button>

        {/* Hero band — gradient with state-driven icon */}
        <ScanHero state={state} />

        {/* Body */}
        <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          {state.kind === 'idle' && (
            <ScanIdle
              onPickFile={handleClickFileInput}
              onPickCamera={handleClickCameraInput}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
              onFileChange={handleFilePicked}
            />
          )}

          {state.kind === 'preview' && (
            <ScanPreview
              previewUrl={state.previewUrl}
              fileName={state.file.name}
              fileSizeMb={state.file.size / (1024 * 1024)}
              onUpload={handleUpload}
              onRemove={handleClearPreview}
            />
          )}

          {state.kind === 'uploading' && (
            <ScanProgress label="Uploading receipt…" sub="Don't close this window." previewUrl={state.previewUrl} />
          )}

          {state.kind === 'processing' && (
            <ScanProgress label="Reading your receipt…" sub="This usually takes a few seconds." previewUrl={state.previewUrl} />
          )}

          {state.kind === 'result' && (
            <ScanResult
              receipt={state.receipt}
              onScanAnother={handleScanAnother}
              onDone={onClose}
            />
          )}

          {state.kind === 'error' && (
            <ScanError message={state.message} onRetry={handleScanAnother} onClose={onClose} />
          )}
        </div>

        {/* Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes uc-srm-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes uc-srm-scale-in {
            from { transform: scale(0.96); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
          @keyframes uc-srm-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .uc-srm-modal    { animation: uc-srm-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
          .uc-srm-backdrop { animation: uc-srm-fade-in 220ms ease-out; }
          @media (min-width: 640px) {
            .uc-srm-modal  { animation: uc-srm-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-srm-modal,
            .uc-srm-backdrop { animation: none !important; }
          }
        ` }} />
      </div>
    </div>,
    document.body,
  );
}

/* =======================================================================
   SUB-COMPONENTS
======================================================================= */

function ScanHero({ state }: { state: InternalState }) {
  // Hero adapts to state — keep visual hierarchy consistent.
  let title = 'Scan a receipt';
  let HeroIcon: React.FC<{ className?: string }> = Icon.Camera;
  let iconTone: 'gold' | 'success' | 'warning' | 'error' = 'gold';

  if (state.kind === 'uploading') { title = 'Uploading…';      HeroIcon = Icon.Upload;  iconTone = 'gold'; }
  else if (state.kind === 'processing') { title = 'Processing…'; HeroIcon = Icon.Sparkles; iconTone = 'gold'; }
  else if (state.kind === 'result') {
    const s = state.receipt.status;
    if (s === 'approved')         { title = 'Points awarded!';         HeroIcon = Icon.CheckCircle; iconTone = 'success'; }
    else if (s === 'duplicate')   { title = 'Duplicate receipt';       HeroIcon = Icon.Copy;        iconTone = 'error'; }
    else if (s === 'rejected')    { title = 'Receipt not accepted';    HeroIcon = Icon.Alert;       iconTone = 'error'; }
    else if (s === 'needs_review') { title = "We're reviewing it";     HeroIcon = Icon.Clock;       iconTone = 'warning'; }
  }
  else if (state.kind === 'error') { title = 'Something went wrong'; HeroIcon = Icon.Alert; iconTone = 'error'; }

  const iconBg = {
    gold:    'bg-white/15 ring-white/25 text-[#FFE2B0]',
    success: 'bg-[#10B981]/20 ring-[#A7F3D0]/40 text-[#A7F3D0]',
    warning: 'bg-[#FFC85D]/20 ring-[#FFC85D]/40 text-[#FFE2B0]',
    error:   'bg-[#EF4444]/20 ring-[#FCA5A5]/40 text-[#FCA5A5]',
  }[iconTone];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
      <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />
      <span className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur ${iconBg}`}>
        <HeroIcon className="h-7 w-7" />
      </span>
      <h2
        id="scan-receipt-modal-title"
        className="relative mt-4 text-[20px] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[22px]"
      >
        {title}
      </h2>
    </div>
  );
}

/* ============== IDLE ============== */
function ScanIdle({
  onPickFile,
  onPickCamera,
  fileInputRef,
  cameraInputRef,
  onFileChange,
}: {
  onPickFile: () => void;
  onPickCamera: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (f: File | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFileChange(f);
  };

  return (
    <>
      <p className="text-[14px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
        Upload an eligible fuel receipt. Make sure the merchant, date and total are clearly visible.
      </p>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />

      {/* Drop zone — desktop primary, mobile secondary (camera CTA above) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onPickFile}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPickFile(); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-[#FBFAFF] px-5 py-8 text-center transition-colors hover:border-[#6356E5] hover:bg-[#F4F1FB] ${
          dragOver ? 'border-[#6356E5] bg-[#F4F1FB]' : 'border-[#E0DAFF]'
        }`}
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
          <Icon.Image className="h-5 w-5" />
        </span>
        <p className="mt-1 text-[13.5px] font-bold tracking-tight text-[#0F1222]">Choose a photo</p>
        <p className="text-[11.5px] text-[#667085]">JPG, PNG or HEIC · up to {MAX_FILE_SIZE_MB} MB</p>
      </div>

      {/* CTAs — vertical stack. Camera primary on mobile, hidden on desktop. */}
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onPickCamera}
          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 sm:hidden"
        >
          <Icon.Camera className="h-5 w-5 shrink-0" />
          Take a photo
        </button>
        <button
          type="button"
          onClick={onPickFile}
          className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
        >
          <Icon.Upload className="h-4 w-4 shrink-0" />
          Upload from gallery
        </button>
      </div>

      <p className="mt-4 text-center text-[11.5px] text-[#667085]">
        Members earn Points · Subject to monthly caps and eligibility
      </p>
    </>
  );
}

/* ============== PREVIEW ============== */
function ScanPreview({
  previewUrl,
  fileName,
  fileSizeMb,
  onUpload,
  onRemove,
}: {
  previewUrl: string;
  fileName: string;
  fileSizeMb: number;
  onUpload: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      <p className="text-[13.5px] leading-relaxed text-[#4B5563]">
        Review your receipt before uploading. Make sure the merchant, date and total are clearly visible.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Receipt preview"
          className="h-auto max-h-[300px] w-full object-contain"
        />
        <div className="flex items-center justify-between gap-3 border-t border-[#E0DAFF] px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-[#0F1222]">{fileName}</p>
            <p className="text-[11px] text-[#667085]">{fileSizeMb.toFixed(1)} MB</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove image"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#F4F1FB] hover:text-[#EF4444]"
          >
            <Icon.Trash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
        >
          Upload receipt
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
        >
          Pick another image
        </button>
      </div>
    </>
  );
}

/* ============== PROGRESS (uploading + processing) ============== */
function ScanProgress({ label, sub, previewUrl }: { label: string; sub: string; previewUrl?: string }) {
  return (
    <div className="flex flex-col items-center py-2">
      {previewUrl && (
        <div className="relative mb-5 w-full overflow-hidden rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="h-auto max-h-[180px] w-full object-contain opacity-90" />
          {/* Scan-line shimmer over preview */}
          <div className="uc-srm-scanline pointer-events-none absolute inset-x-2 top-0 h-1 rounded-full bg-gradient-to-r from-transparent via-[#6356E5] to-transparent shadow-[0_0_24px_#6356E5]" aria-hidden />
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes uc-srm-scan {
              0%   { top: 6px; opacity: 0.0; }
              10%  { opacity: 1; }
              90%  { opacity: 1; }
              100% { top: calc(100% - 6px); opacity: 0; }
            }
            .uc-srm-scanline { animation: uc-srm-scan 1.6s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .uc-srm-scanline { animation: none !important; opacity: 0.6; top: 50% !important; }
            }
          ` }} />
        </div>
      )}
      <Icon.Spinner className="h-9 w-9 animate-spin text-[#6356E5] motion-reduce:animate-none" />
      <p className="mt-4 text-[15px] font-extrabold tracking-tight text-[#0F1222]">{label}</p>
      <p className="mt-1 text-center text-[12.5px] text-[#667085]">{sub}</p>
    </div>
  );
}

/* ============== RESULT ============== */
function ScanResult({
  receipt,
  onScanAnother,
  onDone,
}: {
  receipt: ReceiptDto;
  onScanAnother: () => void;
  onDone: () => void;
}) {
  const status = receipt.status;
  const points = receipt.pointsAwarded ?? 0;
  const total = receipt.receiptTotal != null ? Number(receipt.receiptTotal) : null;
  const merchant = receipt.merchantName || '—';
  const dateStr = receipt.receiptDate
    ? new Date(receipt.receiptDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  /* APPROVED — celebrate + summary */
  if (status === 'approved') {
    return (
      <>
        <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-5 text-center">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#10B981]">You earned</p>
          <p className="mt-1 text-[44px] font-extrabold leading-none tracking-tight tabular-nums text-[#10B981] sm:text-[52px]">
            +{points.toLocaleString()}
            <span className="ml-2 text-[16px] font-semibold text-[#10B981]/80">Points</span>
          </p>
          {receipt.pointsCalculated != null && receipt.pointsCalculated > points && (
            <>
              <p className="mt-1.5 text-[11.5px] text-[#10B981]/80">
                ({receipt.pointsCalculated.toLocaleString()} calculated · capped to your monthly limit)
              </p>
              <a
                href="/dashboard/membership"
                className="mt-1.5 inline-block text-[11.5px] font-semibold text-[#6356E5] underline-offset-2 hover:underline"
              >
                Upgrade for a higher monthly cap →
              </a>
            </>
          )}
        </div>

        <ReceiptSummary merchant={merchant} dateStr={dateStr} total={total} category={receipt.category} fuelLitres={receipt.fuelLitres} fuelType={receipt.fuelType} />

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onScanAnother}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
          >
            <Icon.Camera className="h-4 w-4 shrink-0" />
            Scan another
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222]"
          >
            Done
          </button>
        </div>
      </>
    );
  }

  /* NEEDS_REVIEW — pending admin */
  if (status === 'needs_review') {
    return (
      <>
        <p className="text-[14px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
          We've received your receipt and an admin will review it shortly. You'll see Points credited to your account once it's approved.
        </p>
        {(merchant !== '—' || total !== null) && (
          <ReceiptSummary merchant={merchant} dateStr={dateStr} total={total} category={receipt.category} fuelLitres={receipt.fuelLitres} fuelType={receipt.fuelType} />
        )}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onScanAnother}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
          >
            <Icon.Camera className="h-4 w-4 shrink-0" />
            Scan another
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222]"
          >
            Close
          </button>
        </div>
      </>
    );
  }

  /* DUPLICATE / REJECTED — error tone */
  const reason = receipt.rejectReason || 'other';
  const copy = REJECT_COPY[reason];
  const isDup = status === 'duplicate';
  return (
    <>
      <div className={`rounded-2xl p-4 ring-1 ${isDup ? 'bg-[#F4F1FB] ring-[#E0DAFF]' : 'bg-[#FEF2F2] ring-[#FCA5A5]/60'}`}>
        <p className={`text-[14px] font-extrabold tracking-tight ${isDup ? 'text-[#0F1222]' : 'text-[#7F1D1D]'}`}>
          {copy.title}
        </p>
        <p className={`mt-1 text-[12.5px] leading-relaxed ${isDup ? 'text-[#4B5563]' : 'text-[#991B1B]'}`}>
          {copy.body}
        </p>
      </div>

      {(merchant !== '—' || total !== null) && (
        <ReceiptSummary merchant={merchant} dateStr={dateStr} total={total} category={receipt.category} fuelLitres={receipt.fuelLitres} fuelType={receipt.fuelType} />
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onScanAnother}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
        >
          Try another receipt
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222]"
        >
          Close
        </button>
      </div>
    </>
  );
}

function ReceiptSummary({
  merchant,
  dateStr,
  total,
  category,
  fuelLitres,
  fuelType,
}: {
  merchant: string;
  dateStr: string;
  total: number | null;
  category?: string | null;
  fuelLitres?: string | number | null;
  fuelType?: string | null;
}) {
  const litresNum = fuelLitres != null ? Number(fuelLitres) : null;
  return (
    <dl className="mt-4 rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-4">
      <div className="flex items-center justify-between gap-3 text-[12.5px]">
        <dt className="font-semibold text-[#667085]">Merchant</dt>
        <dd className="truncate text-right font-extrabold tracking-tight text-[#0F1222]">{merchant}</dd>
      </div>
      {dateStr && (
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px]">
          <dt className="font-semibold text-[#667085]">Date</dt>
          <dd className="text-right text-[#0F1222]">{dateStr}</dd>
        </div>
      )}
      {total !== null && (
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px]">
          <dt className="font-semibold text-[#667085]">Total</dt>
          <dd className="text-right font-extrabold tracking-tight tabular-nums text-[#0F1222]">{formatAUD(total)}</dd>
        </div>
      )}
      {category === 'fuel' && (litresNum !== null || fuelType) && (
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px]">
          <dt className="font-semibold text-[#667085]">Fuel</dt>
          <dd className="text-right text-[#0F1222]">
            {litresNum !== null ? `${litresNum.toFixed(2)}L` : ''}{litresNum !== null && fuelType ? ' · ' : ''}{fuelType || ''}
          </dd>
        </div>
      )}
    </dl>
  );
}

/* ============== ERROR ============== */
function ScanError({ message, onRetry, onClose }: { message: string; onRetry: () => void; onClose: () => void }) {
  return (
    <>
      <div className="rounded-2xl bg-[#FEF2F2] p-4 ring-1 ring-[#FCA5A5]/60">
        <div className="flex items-start gap-2.5">
          <Icon.Alert className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
          <p className="text-[13px] leading-relaxed text-[#991B1B]">{message}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
        >
          Try again
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222]"
        >
          Close
        </button>
      </div>
    </>
  );
}
