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
 *   - (CodeCard removed 2026-05-20 — Prezzee-delivers mode, no in-app codes)
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
import type { Brand, Denomination, RedemptionStatus } from '@/lib/gift-cards/types';
import { formatAud, formatPts, formatDateTime } from '@/lib/gift-cards/format';

/* ──────────────────────────────────────────────────────────────────
   StatusChip — redemption + brand statuses

   2026-05-26 — Map every one of the 10 backend redemption states
   (per redemption.entity.ts) plus the 3 brand states. Three pending
   states are grouped under "Processing" because they describe normal
   in-flight work; only `pending_payment` and `pending_fulfillment`
   warrant the amber "On hold" tone (those indicate something needs
   intervention upstream). A separate "Delivery issue" tone covers
   the bounce-recovery state `pending_delivery`.
   ────────────────────────────────────────────────────────────────── */
type StatusStyle = { bg: string; text: string; dot: string; label: string };

const PROCESSING_STYLE: StatusStyle = {
  bg: '#F6F4FF',
  text: '#5648D8',
  dot: '#6356E5',
  label: 'Processing',
};
const ON_HOLD_STYLE: StatusStyle = {
  bg: '#FFFBEB',
  text: '#B45309',
  dot: '#F59E0B',
  label: 'On hold',
};
const STATUS_STYLES: Record<string, StatusStyle> = {
  /* Redemption — in-flight (normal, not scary) */
  points_held: PROCESSING_STYLE,
  submitting: PROCESSING_STYLE,
  prezzee_pending: PROCESSING_STYLE,
  /* Redemption — needs upstream intervention */
  pending_payment: ON_HOLD_STYLE,
  pending_fulfillment: ON_HOLD_STYLE,
  /* Redemption — delivery-specific issue (bounce / undeliverable email) */
  pending_delivery: {
    bg: '#FFF7ED',
    text: '#9A3412',
    dot: '#F97316',
    label: 'Delivery issue',
  },
  /* Redemption — terminal states */
  completed: { bg: '#ECFDF5', text: '#047857', dot: '#10B981', label: 'Completed' },
  failed: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', label: 'Failed' },
  refunded: { bg: '#F1ECFB', text: '#5648D8', dot: '#8B7BFF', label: 'Refunded' },
  cancelled: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', label: 'Cancelled' },
  /* Brand statuses (catalog admin) */
  live: { bg: '#ECFDF5', text: '#047857', dot: '#10B981', label: 'Live' },
  paused: { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B', label: 'Paused' },
  archived: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', label: 'Archived' },
};
/* Final-resort fallback when an unknown status string sneaks through —
   show a neutral chip with the raw value so it's debuggable rather
   than mis-rendering as something it isn't. */
const UNKNOWN_STYLE: StatusStyle = {
  bg: '#F1F5F9',
  text: '#475569',
  dot: '#94A3B8',
  label: 'Unknown',
};

export function StatusChip({
  status,
  className = '',
}: {
  status: RedemptionStatus | string;
  className?: string;
}) {
  const s = STATUS_STYLES[status] || UNKNOWN_STYLE;
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
   BalanceRow — two layouts:
   • Sufficient   → "Points balance  84,200 → 79,200 pts"   (after-state)
   • Insufficient → "Points balance  3,500 pts · Need 4,000 more"
   The post-redemption "negative balance" reading confused members
   (2026-05-26 feedback) because backend never allows a negative
   balance — show the shortfall directly instead.
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
  const shortfall = insufficient ? Math.abs(after) : 0;
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-[14px] ${
        insufficient ? 'border-[#FCA5A5] bg-[#FEF2F2]' : 'border-[#E7E9F2] bg-[#FBFAFF]'
      } ${className}`}
    >
      <div className="text-[#667085]">Points balance</div>
      {insufficient ? (
        <div className="flex items-center gap-2 font-semibold tabular-nums">
          <span className="text-[#0F1222]">{formatPts(currentPoints)}</span>
          <span aria-hidden className="text-[#FCA5A5]">·</span>
          <span className="text-[#B91C1C]">Need {formatPts(shortfall)} more</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 font-semibold tabular-nums">
          <span className="text-[#0F1222]">{formatPts(currentPoints)}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
          <span className="text-[#0F1222]">{formatPts(after)}</span>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   BrandCard — catalog grid card
   ────────────────────────────────────────────────────────────────── */
/**
 * Shared gift-card artwork tile (used by the catalog grid + brand detail hero).
 * Full-bleed card art (admin cardImageUrl wins, else Prezzee logoUrl), with a
 * brand-colour + wordmark fallback when there's no usable image. Inside a
 * `.group` (the grid card) the art zooms on hover.
 */
export function GiftCardArt({
  brand,
  className = '',
}: {
  brand: Pick<Brand, 'cardImageUrl' | 'logoUrl' | 'heroColor' | 'name'>;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const cardImg = brand.cardImageUrl || brand.logoUrl;
  const showImg = !!cardImg && !imgError;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ring-1 ring-[#E7E9F2] ${className}`}
      style={{ aspectRatio: '1.586 / 1', background: brand.heroColor }}
    >
      {showImg ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardImg as string}
            alt={brand.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/15 to-transparent" />
        </>
      ) : (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
          <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-[20px] font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
            {brand.name}
          </span>
        </>
      )}
      <span className="absolute right-2.5 top-2.5 z-10 rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6356E5] ring-1 ring-white/60 backdrop-blur-sm">
        eGift
      </span>
    </div>
  );
}

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
      {/* Gift-card art (shared with the brand detail hero) */}
      <GiftCardArt brand={brand} />
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

/* CodeCard removed 2026-05-20 — Prezzee-delivers mode means UNICASH never
   stores or displays gift codes. Prezzee emails the gift directly to
   recipientEmail. Replaced in SuccessPane by a "Sent to {email}" block. */

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
