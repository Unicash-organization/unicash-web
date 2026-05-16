/**
 * DrawLoyaltyPanel — "Your Loyalty Entries in this draw" panel rendered
 * inside /giveaways/[id]. Used ONLY when `drawType === 'major'` because
 * loyalty entries do not apply to mini draws.
 *
 * States:
 *   - logged-out  → upgrade nudge with /membership CTA
 *   - logged-in, not-member  → upgrade nudge
 *   - logged-in, member, 0 entries → "Earning is paused / no entries yet"
 *   - logged-in, member with entries → headline + breakdown + link to /account/loyalty
 *
 * Fetches its own data via `api.loyalty.forDraw(drawId)`. The error path
 * silently hides the panel — we never want a network blip to break the
 * surrounding draw-detail page.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { EntryBreakdown } from './EntryBreakdown';
import { LoyaltyEntryBadge } from './LoyaltyEntryBadge';
import type { LoyaltyDrawDetail } from './types';

interface Props {
  drawId: string;
  /** Pass `true` when the auth context has a user. */
  isLoggedIn: boolean;
  /** Pass `true` when the user has an active Membership. */
  hasActiveMembership: boolean;
}

export function DrawLoyaltyPanel({
  drawId,
  isLoggedIn,
  hasActiveMembership,
}: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [detail, setDetail] = useState<LoyaltyDrawDetail | null>(null);

  useEffect(() => {
    // Don't even hit the endpoint if the user can't have entries.
    if (!isLoggedIn || !hasActiveMembership) {
      setState('ready');
      return;
    }
    let cancelled = false;
    setState('loading');
    api.loyalty
      .forDraw(drawId)
      .then((r) => {
        if (cancelled) return;
        setDetail(r.data as LoyaltyDrawDetail);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [drawId, isLoggedIn, hasActiveMembership]);

  // Logged-out + no membership → upgrade nudge.
  if (!isLoggedIn || !hasActiveMembership) {
    return (
      <article className="mt-4 rounded-2xl border border-[#E0DAFF] bg-gradient-to-br from-[#FBFAFF] to-[#F4F1FB] p-4">
        <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
          <Sparkles className="h-3 w-3" aria-hidden /> Loyalty Entries
        </p>
        <p className="mt-1 text-[13.5px] font-extrabold tracking-tight text-[#0F1222] sm:text-[14.5px]">
          Members earn auto-applied entries in this draw
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
          The longer you stay a member, the more Loyalty Entries land in every
          Major Draw — automatically, no purchase required.
        </p>
        <Link
          href="/membership"
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)] transition-transform hover:scale-[1.02]"
        >
          View Membership <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </article>
    );
  }

  // Silent failure — don't disrupt the page.
  if (state === 'error') return null;

  if (state === 'loading') {
    return (
      <article className="mt-4 rounded-2xl border border-[#E7E9F2] bg-white p-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-[#F4F1FB]" />
        <div className="mt-2 h-5 w-44 animate-pulse rounded-full bg-[#F4F1FB]" />
        <div className="mt-3 h-16 w-full animate-pulse rounded-xl bg-[#FBFAFF]" />
      </article>
    );
  }

  const entries = detail?.entries ?? 0;

  if (entries === 0) {
    return (
      <article className="mt-4 rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-4">
        <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
          <Sparkles className="h-3 w-3" aria-hidden /> Your Loyalty Entries
        </p>
        <p className="mt-1 text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">
          No Loyalty Entries here yet
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
          Your next monthly accrual lands automatically into the active Major Draw.
        </p>
      </article>
    );
  }

  return (
    <article className="mt-4 rounded-2xl border border-[#E0DAFF] bg-white p-4 shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
            <Sparkles className="h-3 w-3" aria-hidden /> Your Loyalty Entries
          </p>
          <p className="mt-1 text-[15px] font-extrabold tracking-tight text-[#0F1222] sm:text-[16px]">
            <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-transparent">
              {entries.toLocaleString('en-AU')}
            </span>{' '}
            Loyalty {entries === 1 ? 'Entry' : 'Entries'} in this draw
          </p>
        </div>
        <LoyaltyEntryBadge entries={entries} size="sm" />
      </div>
      <div className="mt-3">
        <EntryBreakdown
          rows={detail?.breakdown ?? []}
          total={entries}
          defaultCollapsed
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href="/account/loyalty"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6356E5] hover:text-[#5648D8]"
        >
          See full tenure history
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
