'use client';

/**
 * UNICASH Redeem Gift Cards — shared components
 *
 * One file because every component here is small and tightly
 * coupled to the gift card data shape. Co-locating keeps imports
 * trivial across the 5 member + 6 admin routes that consume them.
 *
 * Components:
 *   - StatusChip          status pill with tone map
 *   - FraudScorePill      green/amber/red score badge
 *   - DenominationChip    selectable denomination button
 *   - BalanceRow          "X pts → Y pts after" calculator row
 *   - BrandCard           catalog grid card
 *   - CodeCard            reveal-once code surface
 *   - RedemptionTimeline  vertical timeline of redemption events
 *   - BottomSheet         portalled modal — bottom sheet mobile / centered desktop
 *   - Toast               portalled bottom-centered toast
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  ShieldAlert,
  Lock,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import type { Brand, Denomination, RedemptionStatus, RedemptionCode } from '@/lib/gift-cards/types';
import { formatAud, formatPts, formatDateTime, maskCode } from '@/lib/gift-cards/format';

/* ──────────────────────────────────────────────────────────────────
   StatusChip — redemption + brand statuses
   ────────────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: '#F4F1FB', text: '#5648D8', dot: '#8B7BFF', label: 'Draft' },
  processing: { bg: '#F6F4FF', text: '#5648D8', dot: '#6356E5', label: 'Processing' },
  on_hold: { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B', label: 'On hold' },
  completed: { bg: '#ECFDF5', text: '#047857', dot: '#10B981', label: 'Completed' },
  failed: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', label: 'Failed' },
  refunded: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', label: 'Refunded' },
  cancelled: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', label: 'Cancelled' },
  live: { bg: '#ECFDF5', text: '#047857', dot: '#10B981', label: 'Live' },
  paused: { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B', label: 'Paused' },
  archived: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', label: 'Archived' },
};

export function StatusChip({
  status,
  className = '',
}: {
  status: RedemptionStatus | string;
  className?: string;
}) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${className}`}
      style={{ background: s.bg, color: s.text }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────
   FraudScorePill — green ≤30, amber 31–69, red ≥70
   ────────────────────────────────────────────────────────────────── */
export function FraudScorePill({ score, className = '' }: { score: number; className?: string }) {
  let bg = '#ECFDF5';
  let text = '#047857';
  let label = 'Low';
  if (score >= 70) {
    bg = '#FEF2F2';
    text = '#B91C1C';
    label = 'High';
  } else if (score >= 31) {
    bg = '#FFFBEB';
    text = '#B45309';
    label = 'Medium';
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${className}`}
      style={{ background: bg, color: text }}
      aria-label={`Fraud score ${score} out of 100, ${label} risk`}
    >
      <ShieldAlert className="w-3 h-3" />
      {score}
      <span className="opacity-70">· {label}</span>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────
   DenominationChip — selectable, shows AUD value + Points required
   ────────────────────────────────────────────────────────────────── */
export function DenominationChip({
  denom,
  selected,
  disabled,
  onClick,
}: {
  denom: Denomination;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const outOfStock = denom.stockLevel === 'out_of_stock' || !denom.active;
  const isDisabled = disabled || outOfStock;
  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-pressed={selected}
      aria-label={`Select ${formatAud(denom.valueAud)} for ${formatPts(denom.pointsRequired)}`}
      className={[
        'flex flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3 min-w-[96px] transition-all',
        isDisabled
          ? 'bg-[#F4F1FB] text-[#94A3B8] border-[#E7E9F2] cursor-not-allowed line-through'
          : selected
          ? 'bg-[#6356E5] text-white border-[#6356E5] shadow-[0_4px_14px_-4px_rgba(99,86,229,0.5)]'
          : 'bg-white text-[#0F1222] border-[#E7E9F2] hover:border-[#6356E5] hover:text-[#5346D6]',
      ].join(' ')}
    >
      <span className="text-[18px] font-extrabold tracking-tight tabular-nums">
        {formatAud(denom.valueAud)}
      </span>
      <span className={`text-[11px] font-semibold tabular-nums ${selected ? 'text-white/80' : 'text-[#667085]'}`}>
        {formatPts(denom.pointsRequired)}
      </span>
      {denom.stockLevel === 'low' && !outOfStock && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#B45309]">Low stock</span>
      )}
      {outOfStock && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#EF4444]">Out of stock</span>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────
   BalanceRow — "Points balance 84,200 → 79,200 pts"
   ────────────────────────────────────────────────────────────────── */
export function BalanceRow({
  currentPoints,
  pointsRequired,
  className = '',
}: {
  currentPoints: number;
  pointsRequired: number;
  className?: string;
}) {
  const after = currentPoints - pointsRequired;
  const insufficient = after < 0;
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-[14px] ${
        insufficient ? 'border-[#FCA5A5] bg-[#FEF2F2]' : 'border-[#E7E9F2] bg-[#FBFAFF]'
      } ${className}`}
    >
      <div className="text-[#667085]">Points balance</div>
      <div className="flex items-center gap-1.5 font-semibold tabular-nums">
        <span className="text-[#0F1222]">{formatPts(currentPoints)}</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
        <span className={insufficient ? 'text-[#B91C1C]' : 'text-[#0F1222]'}>
          {formatPts(after)}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   BrandCard — catalog grid card
   ────────────────────────────────────────────────────────────────── */
export function BrandCard({
  brand,
  isMember,
  onClick,
}: {
  brand: Brand;
  isMember: boolean;
  onClick: () => void;
}) {
  const smallest = [...brand.denominations]
    .filter((d) => d.active)
    .sort((a, b) => a.valueAud - b.valueAud)[0];
  const locked = brand.memberOnly && !isMember;
  const anyLow = brand.denominations.some((d) => d.stockLevel === 'low');
  const allOut = brand.denominations.every((d) => d.stockLevel === 'out_of_stock' || !d.active);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${brand.name} gift card`}
      className="group relative flex flex-col items-stretch gap-3 rounded-2xl border border-[#E7E9F2] bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,18,34,0.04)] transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(99,86,229,0.18)]"
    >
      <div
        className="flex h-20 w-full items-center justify-center rounded-xl"
        style={{ background: `${brand.heroColor}14` }}
      >
        <span className="text-[20px] font-extrabold tracking-tight" style={{ color: brand.heroColor }}>
          {brand.name}
        </span>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-extrabold tracking-tight text-[#0F1222] truncate">{brand.name}</div>
          <div className="text-[12px] text-[#667085]">{brand.category}</div>
        </div>
        <div className="text-right shrink-0">
          {smallest && (
            <>
              <div className="text-[11px] text-[#667085]">From</div>
              <div className="text-[14px] font-extrabold tabular-nums text-[#0F1222]">
                {formatPts(smallest.pointsRequired)}
              </div>
              <div className="text-[11px] text-[#667085]">
                · {formatAud(smallest.valueAud)}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {brand.deliveryType === 'instant' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] text-[#047857] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" /> Instant
          </span>
        )}
        {brand.deliveryType === 'review' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] text-[#B45309] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3" /> Review
          </span>
        )}
        {brand.memberOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F1FB] text-[#5648D8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            <Lock className="w-3 h-3" /> Member
          </span>
        )}
        {anyLow && (
          <span className="rounded-full bg-[#FFFBEB] text-[#B45309] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            Low stock
          </span>
        )}
        {allOut && (
          <span className="rounded-full bg-[#FEF2F2] text-[#B91C1C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            Out of stock
          </span>
        )}
      </div>
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#1A1432]/55 backdrop-blur-sm text-white">
          <Lock className="w-6 h-6" />
          <div className="text-[13px] font-bold">Members only</div>
          <span className="rounded-full bg-white text-[#5648D8] px-4 py-1.5 text-[12px] font-bold">
            Join UNICASH
          </span>
        </div>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────
   CodeCard — reveal-once gift card code surface
   ────────────────────────────────────────────────────────────────── */
export function CodeCard({
  code,
  brandName,
  onReveal,
  onCopy,
}: {
  code: RedemptionCode;
  brandName: string;
  onReveal?: () => void;
  onCopy?: () => void;
}) {
  const [revealed, setRevealed] = useState(!!code.revealedAt);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setRevealed(true);
    setConfirming(false);
    onReveal?.();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      onCopy?.();
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7E9F2] bg-gradient-to-br from-[#F6F4FF] via-white to-[#FBFAFF] p-5 shadow-[0_10px_30px_-12px_rgba(99,86,229,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#5648D8]">{brandName}</div>
          <div className="mt-0.5 text-[12px] text-[#667085]">
            Expires {formatDateTime(code.expiresAt)}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
            code.status === 'delivered'
              ? 'bg-[#ECFDF5] text-[#047857]'
              : code.status === 'reissued'
              ? 'bg-[#F6F4FF] text-[#5648D8]'
              : 'bg-[#FEF2F2] text-[#B91C1C]'
          }`}
        >
          {code.status}
        </span>
      </div>

      <div
        className="mt-4 rounded-xl bg-white border border-[#E7E9F2] px-4 py-3 font-mono text-[18px] sm:text-[22px] tracking-[0.15em] font-extrabold text-[#0F1222] text-center break-all select-all"
        aria-live="polite"
      >
        {revealed ? code.code : maskCode(code.code)}
      </div>

      {code.pin && revealed && (
        <div className="mt-2 text-center text-[12px] text-[#667085]">
          PIN: <span className="font-mono font-bold tracking-widest text-[#0F1222]">{code.pin}</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {!revealed ? (
          <button
            type="button"
            onClick={handleReveal}
            className={`col-span-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold transition-colors ${
              confirming
                ? 'bg-[#1A1432] text-white hover:bg-[#0F1222]'
                : 'bg-[#6356E5] text-white hover:bg-[#5648D8]'
            }`}
          >
            <Eye className="w-4 h-4" />
            {confirming ? 'Tap again to confirm reveal' : 'Reveal code'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6356E5] text-white px-5 py-3 text-[14px] font-bold hover:bg-[#5648D8] transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy code'}
            </button>
            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E7E9F2] bg-white px-5 py-3 text-[14px] font-bold text-[#0F1222] hover:bg-[#F6F4FF] transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              Hide
            </button>
          </>
        )}
      </div>

      {revealed && (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#B45309]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Code revealed — treat like cash.
        </p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   RedemptionTimeline — vertical timeline of state events
   ────────────────────────────────────────────────────────────────── */
export function RedemptionTimeline({
  steps,
}: {
  steps: Array<{ label: string; at?: string; status: 'done' | 'current' | 'pending' | 'failed' }>;
}) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const tone =
          s.status === 'done'
            ? 'bg-[#10B981] border-[#10B981]'
            : s.status === 'current'
            ? 'bg-[#6356E5] border-[#6356E5] animate-pulse'
            : s.status === 'failed'
            ? 'bg-[#EF4444] border-[#EF4444]'
            : 'bg-white border-[#E7E9F2]';
        return (
          <li key={i} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`block h-3 w-3 rounded-full border-2 ${tone}`} />
              {i < steps.length - 1 && <span className="mt-1 flex-1 w-px bg-[#E7E9F2]" />}
            </div>
            <div className="pb-1">
              <div className="text-[13px] font-semibold text-[#0F1222]">{s.label}</div>
              {s.at && <div className="text-[11px] text-[#667085]">{formatDateTime(s.at)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ──────────────────────────────────────────────────────────────────
   BottomSheet — portalled modal, mobile-first
   ────────────────────────────────────────────────────────────────── */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-[#1A1432]/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-[18px] font-extrabold tracking-tight text-[#0F1222]">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F4F1FB] text-[#667085]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 pb-3 overflow-y-auto flex-1">{children}</div>
          {(primaryAction || secondaryAction) && (
            <div className="px-5 pt-3 pb-5 border-t border-[#F1ECFB] flex flex-col gap-2">
              {primaryAction}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ──────────────────────────────────────────────────────────────────
   Toast — bottom-centered, auto-dismiss
   ────────────────────────────────────────────────────────────────── */
export function Toast({
  message,
  tone = 'success',
  onClose,
}: {
  message: string | null;
  tone?: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(id);
  }, [message, onClose]);
  if (!message || typeof document === 'undefined') return null;
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertCircle : Loader2;
  const iconColor = tone === 'success' ? '#10B981' : tone === 'error' ? '#EF4444' : '#8B7BFF';
  return createPortal(
    <div className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1A1432] px-4 py-2.5 text-[13px] font-medium text-white shadow-2xl">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        {message}
      </div>
    </div>,
    document.body,
  );
}
