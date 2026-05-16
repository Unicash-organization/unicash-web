/**
 * AnniversaryModal — single-fire celebration when a tenure, streak, or
 * status milestone has just landed.
 *
 * Behaviour:
 *   - On mount, fetches `api.loyalty.listNotifications()`.
 *   - If the response has rows, renders the modal for `rows[0]`.
 *   - Dismiss → `api.loyalty.dismissNotification(id)` (optimistic) →
 *     next pending row pops, or modal closes if list is empty.
 *
 * Rendering rules (project memory: feedback_unicash_modal_pattern):
 *   - MUST createPortal to document.body so transformed ancestors can't
 *     break position:fixed.
 *   - Bottom-sheet on mobile, centred glass card on desktop.
 *   - Vertical CTA stack.
 *   - Tap outside + ESC → dismiss.
 *   - Respect prefers-reduced-motion → kill the confetti shimmer.
 *
 * Mount this once globally inside the dashboard layout so every authenticated
 * page can pop the celebration.
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Sparkles, X, Crown, Award, Gem, Star } from 'lucide-react';
import api from '@/lib/api';
import { LoyaltyStatusBadge } from './LoyaltyStatusBadge';
import { LoyaltyEntryBadge } from './LoyaltyEntryBadge';
import type { LoyaltyStatus } from './types';

interface NotificationRow {
  id: string;
  kind:
    | 'anniversary'
    | 'yearly_anniversary'
    | 'streak'
    | 'status_promotion';
  milestone: number;
  tenureMonthsAtTrigger: number;
  streakMonthsAtTrigger: number;
  entriesGranted: number;
  statusFrom: LoyaltyStatus | null;
  statusTo: LoyaltyStatus | null;
  drawId: string | null;
  createdAt: string;
}

const STATUS_PERKS: Record<Exclude<LoyaltyStatus, 'none'>, string> = {
  bronze: 'profile badge and early prize peeks',
  silver: 'priority support and a A$10 birthday gift card',
  gold: 'quarterly A$25 gift cards and a dark-purple profile ring',
  platinum: 'founder thank-you call, custom event invites, and +20% Points on Scan Receipts',
};

function celebrationTitle(n: NotificationRow): string {
  switch (n.kind) {
    case 'anniversary':
      return `Happy ${n.milestone}-month anniversary 🎉`;
    case 'yearly_anniversary':
      return `${Math.floor(n.milestone / 12)} years of UNICASH 🎉`;
    case 'streak':
      return `${n.milestone}-month unbroken streak ✨`;
    case 'status_promotion':
      return `You're now ${labelFor(n.statusTo)}`;
  }
}

function celebrationBody(n: NotificationRow): string {
  switch (n.kind) {
    case 'anniversary':
      return `We've added ${n.entriesGranted.toLocaleString('en-AU')} bonus Loyalty Entries to your current Major Draw to thank you for sticking with us.`;
    case 'yearly_anniversary':
      return `Your loyalty just unlocked ${n.entriesGranted.toLocaleString('en-AU')} bonus Loyalty Entries. Keep going.`;
    case 'streak':
      return `An unbroken ${n.milestone}-month streak adds ${n.entriesGranted.toLocaleString('en-AU')} Loyalty Entries to your next Major Draw. Premium tenure, premium reward.`;
    case 'status_promotion':
      return `Your tenure unlocked the ${labelFor(n.statusTo)} status tier. ${labelFor(n.statusTo)} members get ${STATUS_PERKS[(n.statusTo ?? 'bronze') as Exclude<LoyaltyStatus, 'none'>]}.`;
  }
}

function labelFor(s: LoyaltyStatus | null): string {
  if (!s || s === 'none') return 'Member';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function IconFor(kind: NotificationRow['kind'], statusTo: LoyaltyStatus | null) {
  if (kind === 'status_promotion') {
    if (statusTo === 'platinum') return Crown;
    if (statusTo === 'gold') return Gem;
    if (statusTo === 'silver') return Star;
    return Award;
  }
  return Sparkles;
}

export function AnniversaryModal() {
  const [queue, setQueue] = useState<NotificationRow[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Fetch once on mount. Silent fail — no toast — modal just doesn't show.
  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    api.loyalty
      .listNotifications()
      .then((r) => {
        if (cancelled) return;
        const rows = (r.data?.rows ?? []) as NotificationRow[];
        setQueue(rows);
      })
      .catch(() => {
        // Sprint 3 wave 1 — silent. Modal just won't appear.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ESC + lock body scroll while a modal is up
  useEffect(() => {
    if (!mounted || queue.length === 0 || hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void handleDismiss();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, queue.length, hidden]);

  if (!mounted || hidden || queue.length === 0) return null;

  const current = queue[0];

  async function handleDismiss() {
    // Optimistic: remove the head of the queue immediately, then call API.
    setQueue((prev) => prev.slice(1));
    try {
      await api.loyalty.dismissNotification(current.id);
    } catch {
      // If the dismiss call fails, the row stays pending on next reload —
      // that's an acceptable fallback. Don't surface the error here.
    }
  }

  const IconCmp = IconFor(current.kind, current.statusTo);

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loyalty-celebration-title"
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#1A1432]/55 backdrop-blur-sm sm:items-center"
      onClick={handleDismiss}
    >
      <article
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_60px_-12px_rgba(15,18,34,0.35)] sm:rounded-3xl"
      >
        {/* Hero strip — soft purple→gold for the celebratory feel */}
        <div className="relative bg-gradient-to-br from-[#1A1432] via-[#3F2C8C] to-[#6356E5] p-5 pb-12 text-white sm:p-7 sm:pb-14">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 motion-safe:transition-all"
            aria-label="Dismiss celebration"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em]">
            <Sparkles className="h-3 w-3" aria-hidden /> Loyalty milestone
          </div>
          <h2
            id="loyalty-celebration-title"
            className="mt-3 text-[22px] font-extrabold leading-[1.15] tracking-tight sm:text-[26px]"
          >
            {celebrationTitle(current)}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">
            {celebrationBody(current)}
          </p>
        </div>

        {/* Floating icon medallion */}
        <div className="-mt-9 flex justify-center">
          <div
            className={`flex h-[68px] w-[68px] items-center justify-center rounded-full border-4 border-white shadow-[0_8px_18px_-6px_rgba(15,18,34,0.28)] motion-safe:transition-transform ${
              current.kind === 'status_promotion'
                ? 'bg-gradient-to-br from-[#FFE2B0] to-[#FFC85D]'
                : 'bg-[#6356E5]'
            }`}
          >
            <IconCmp
              className={`h-7 w-7 ${
                current.kind === 'status_promotion' ? 'text-[#1A1432]' : 'text-white'
              }`}
              aria-hidden
              strokeWidth={2.25}
            />
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-3 px-5 pt-3 pb-5 sm:px-7 sm:pb-7">
          {current.entriesGranted > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] px-3.5 py-3">
              <span className="text-[12.5px] font-semibold text-[#0F1222]">
                New Loyalty Entries
              </span>
              <LoyaltyEntryBadge entries={current.entriesGranted} size="sm" />
            </div>
          )}
          {current.kind === 'status_promotion' && current.statusTo && (
            <div className="flex items-center justify-between rounded-2xl border border-[#E7E9F2] bg-white px-3.5 py-3">
              <span className="text-[12.5px] font-semibold text-[#0F1222]">
                New status
              </span>
              <LoyaltyStatusBadge status={current.statusTo} />
            </div>
          )}
          <div className="flex items-center justify-between rounded-2xl border border-[#E7E9F2] bg-white px-3.5 py-3">
            <span className="text-[12.5px] font-semibold text-[#0F1222]">Tenure</span>
            <span className="text-[12.5px] font-extrabold tabular-nums text-[#1A1432]">
              {current.tenureMonthsAtTrigger} month
              {current.tenureMonthsAtTrigger === 1 ? '' : 's'}
            </span>
          </div>

          {/* CTAs — vertical stack */}
          <div className="mt-2 flex flex-col gap-2">
            <Link
              href="/account/loyalty"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)] transition-transform hover:scale-[1.01]"
            >
              View Loyalty Entries
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#0F1222] transition-colors hover:bg-[#FBFAFF]"
            >
              Got it
            </button>
          </div>
        </div>
      </article>
    </div>
  );

  return createPortal(modal, document.body);
}
