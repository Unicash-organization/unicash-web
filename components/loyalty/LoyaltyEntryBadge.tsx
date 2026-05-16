/**
 * LoyaltyEntryBadge — a compact gold-gradient pill that surfaces
 * "🎯 N Loyalty Entries" anywhere we want to signal the member's stake
 * in a Major Draw (DrawCard, dashboard header chip, /account/loyalty hero).
 *
 * Two density variants:
 *   - default: comfortable padding, used in card headers
 *   - sm:      tight, used inline alongside title rows
 *
 * Two states:
 *   - data:    `entries` is a positive integer
 *   - loading: skeleton-pill (set `loading=true`)
 */

'use client';

import { Sparkles, Target } from 'lucide-react';

interface Props {
  entries: number;
  /** "default" (sm:px-3 py-1.5) | "sm" (px-2 py-1) */
  size?: 'default' | 'sm';
  /** Show skeleton instead of value. */
  loading?: boolean;
  /** Append "in [Q3 2026 Major Draw]" subtitle if non-empty. */
  drawTitle?: string | null;
  /** Optional className to control margins / inline positioning. */
  className?: string;
}

export function LoyaltyEntryBadge({
  entries,
  size = 'default',
  loading = false,
  drawTitle = null,
  className = '',
}: Props) {
  const sizing =
    size === 'sm'
      ? 'gap-1 px-2 py-1 text-[11px]'
      : 'gap-1.5 px-3 py-1.5 text-[12.5px] sm:text-[13px]';

  if (loading) {
    return (
      <span
        aria-busy="true"
        className={`inline-flex items-center rounded-full bg-[#F4F1FB] ${sizing} text-transparent ${className}`}
      >
        <Target className="h-3.5 w-3.5 shrink-0 opacity-30" aria-hidden />
        <span className="animate-pulse">Loyalty Entries</span>
      </span>
    );
  }

  if (entries <= 0) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-[#F4F1FB] text-[#6356E5] ${sizing} font-semibold ${className}`}
      >
        <Target className="h-3.5 w-3.5 shrink-0" aria-hidden />
        No Loyalty Entries yet
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] font-bold tracking-tight text-[#1A1432] shadow-[0_1px_2px_rgba(15,18,34,.08)] ${sizing} ${className}`}
      title={drawTitle ? `Auto-applied to ${drawTitle}` : 'Auto-applied to the current Major Draw'}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="font-extrabold">{entries.toLocaleString('en-AU')}</span>
      <span className="font-semibold">{entries === 1 ? 'Loyalty Entry' : 'Loyalty Entries'}</span>
    </span>
  );
}
