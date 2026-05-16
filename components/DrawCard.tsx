'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatTimeRemaining } from '@/lib/utils';
import ConfirmEntryModal from './ConfirmEntryModal';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getDisplayImageUrl(draw: { image?: string; images?: Array<{ url?: string; order?: number }> }): string | null {
  if (draw.images && Array.isArray(draw.images) && draw.images.length > 0) {
    const sorted = [...draw.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const first = sorted[0];
    const raw = typeof first === 'string' ? first : (first && typeof first === 'object' ? (first as { url?: string }).url : undefined);
    const url = typeof raw === 'string' ? raw : null;
    if (url) return url.startsWith('http') ? url : `${API_BASE}/${url}`;
  }
  if (draw.image) return draw.image.startsWith('http') ? draw.image : `${API_BASE}/${draw.image}`;
  return null;
}

interface DrawCardProps {
  id: string;
  title: string;
  image?: string;
  images?: Array<{ id?: string; url: string; order?: number; isPrimary?: boolean }>;
  /** Backend field name kept for compatibility — UI displays "Points". */
  creditsPerEntry: number;
  entrants: number;
  cap: number;
  closedAt: string;
  state: string;
  requiresMembership?: boolean;
}

/* Inline SVG helpers (avoids extra deps) */
const Icon = {
  Coins: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Users: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  CalendarClock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="16" cy="16" r="6" />
      <path d="M16 14v2l1 1" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Bell: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
};

export default function DrawCard({
  id,
  title,
  image,
  images,
  creditsPerEntry,
  entrants,
  cap,
  closedAt,
  state,
  requiresMembership = false,
}: DrawCardProps) {
  const displayImageUrl = getDisplayImageUrl({ image, images });
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [checkingEntry, setCheckingEntry] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [checkingWaitlist, setCheckingWaitlist] = useState(false);
  const [addingToWaitlist, setAddingToWaitlist] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);
  /* Tracks whether membership status has been resolved at least once.
     Prevents flashing membership warnings during the ~1-2s async fetch window. */
  const [membershipReady, setMembershipReady] = useState(false);

  // QW-9 / U5 — closing-soon reminder opt-in. `null` until we've fetched.
  const [reminderOn, setReminderOn] = useState<boolean | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);

  useEffect(() => {
    setTimeRemaining(formatTimeRemaining(closedAt));
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(closedAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [closedAt]);

  useEffect(() => {
    // No user → mark membership as resolved (nothing to check) so warnings don't flash
    if (!user) {
      setMembershipReady(true);
      return;
    }
    if (id) {
      checkUserEntry();
      checkWaitlistStatus();
      checkReminder();
      if (requiresMembership) {
        checkMembership();
      } else {
        // Draw doesn't require membership — no fetch needed
        setMembershipReady(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, requiresMembership]);

  const checkReminder = async () => {
    if (!user) {
      setReminderOn(false);
      return;
    }
    try {
      const res = await api.draws.reminderStatus(id);
      setReminderOn(!!res.data?.subscribed);
    } catch {
      setReminderOn(false);
    }
  };

  const toggleReminder = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    // The whole card is a click target → stop bubbling so the toggle
    // doesn't also navigate to the draw detail page.
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (!user || reminderBusy) return;
    setReminderBusy(true);
    // Optimistic — flip immediately; revert on failure
    const next = !reminderOn;
    setReminderOn(next);
    // Dev-only breadcrumb so we can see the flip even on a slow network
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[DrawCard] reminder toggle ${id.slice(0, 8)} → ${next}`);
    }
    try {
      if (next) await api.draws.remindMe(id);
      else await api.draws.unremindMe(id);
    } catch (err: any) {
      // Revert on error
      setReminderOn(!next);
      const serverMsg = err?.response?.data?.message;
      showToast(
        serverMsg ||
          'We couldn’t update your reminder. Please try again.',
        'error',
      );
      // eslint-disable-next-line no-console
      console.error('[DrawCard] reminder toggle failed', err);
    } finally {
      setReminderBusy(false);
    }
  };

  const checkUserEntry = async () => {
    if (!user) return;
    setCheckingEntry(true);
    try {
      const res = await api.entries.hasEntryForDraw(id).catch(() => ({ data: { hasEntry: false } }));
      setHasEntered(!!res.data?.hasEntry);
    } catch (error) {
      console.error('Error checking user entry:', error);
    } finally {
      setCheckingEntry(false);
    }
  };

  const checkWaitlistStatus = async () => {
    if (!user) return;
    setCheckingWaitlist(true);
    try {
      const res = await api.waitlist.check(id).catch(() => ({ data: { isOnWaitlist: false } }));
      setIsOnWaitlist(res.data?.isOnWaitlist || false);
    } catch (error) {
      console.error('Error checking waitlist status:', error);
    } finally {
      setCheckingWaitlist(false);
    }
  };

  const checkMembership = async () => {
    if (!user) return;
    setCheckingMembership(true);
    try {
      const response = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(response.data);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setCheckingMembership(false);
      setMembershipReady(true);
    }
  };

  const handleAddToWaitlist = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setAddingToWaitlist(true);
    try {
      await api.waitlist.add(id);
      setIsOnWaitlist(true);
      showToast('Added to waitlist successfully.', 'success');
    } catch (error: any) {
      console.error('Error adding to waitlist:', error);
      showToast(error.response?.data?.message || 'Failed to add to waitlist', 'error');
    } finally {
      setAddingToWaitlist(false);
    }
  };

  const handleRemoveFromWaitlist = async () => {
    if (!user) return;
    setAddingToWaitlist(true);
    try {
      await api.waitlist.remove(id);
      setIsOnWaitlist(false);
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    } finally {
      setAddingToWaitlist(false);
    }
  };

  /* ---- Status logic — preserved ---- */
  const isClosedByDate = new Date(closedAt) < new Date();
  // Any post-OPEN admin transition (drawn / published / drawing) is
  // treated as 'closed' from the member's POV — the draw is over. This
  // also keeps the Remind me button correctly hidden once an admin has
  // resolved a draw, since the status === 'open' gate fails.
  const isAdminResolved =
    state === 'drawn' ||
    state === 'drawing' ||
    state === 'published';
  const status: 'open' | 'soldOut' | 'closed' | 'canceled' =
    state === 'canceled' ? 'canceled'
    : cap !== -1 && (state === 'soldOut' || entrants >= cap) ? 'soldOut'
    : state === 'closed' || isClosedByDate || isAdminResolved ? 'closed'
    : 'open';

  /* Membership entry-eligibility — mirrors backend DrawsService.enterDraw */
  const isCanceled = membership?.status === 'canceled';
  const periodEnded = membership?.currentPeriodEnd && new Date(membership.currentPeriodEnd) < new Date();
  const hasActiveMembership =
    !!membership && !isCanceled && membership.status === 'active' && !membership.isPaused && !periodEnded;
  const canEnterBonusDraw = !requiresMembership || hasActiveMembership;

  /* ---- v4 visual derivations ---- */
  const pct = cap === -1 ? 0 : Math.min(100, Math.round((entrants / cap) * 100));
  const pointsLabel = `${creditsPerEntry.toLocaleString()} Points`;

  /* v4 closing-date format: "Ends 28 May · 8:00 PM AEST" — date + time + tz abbreviation.
     Uses Australia/Sydney as the canonical UNICASH timezone (AEST/AEDT auto). */
  const closingLabel = React.useMemo(() => {
    const d = new Date(closedAt);
    if (isNaN(d.getTime())) return '';
    const verb = new Date() > d ? 'Closed' : 'Ends';
    const datePart = d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Australia/Sydney',
    });
    const timePart = d.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
      timeZoneName: 'short',
    });
    return `${verb} ${datePart} · ${timePart}`;
  }, [closedAt]);

  /* Animated progress fill — fills from 0 to pct when the bar scrolls into view,
     and re-triggers the one-shot shimmer sweep via a remount key. */
  const progressRef = React.useRef<HTMLDivElement>(null);
  const [progressW, setProgressW] = React.useState(0);
  const [shimmerKey, setShimmerKey] = React.useState(0);
  React.useEffect(() => {
    const target = pct;
    const el = progressRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setProgressW(target);
          setShimmerKey((k) => k + 1);
          io.disconnect();
        }
      },
      { rootMargin: '-40px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pct]);

  const navigate = () => {
    window.location.href = `/giveaways/${id}`;
  };
  const onCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate();
    }
  };

  /* CTA renderer — preserves all original branches.
     All buttons use `w-full min-w-0` + `truncate` on text for safe rendering
     when stacked (mobile/sm 2-col) or compressed (md+ grid 1fr column). */
  const ctaBaseCls =
    'uc-lift-sm inline-flex h-11 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[13px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2';

  const renderCta = () => {
    if (hasEntered) {
      return (
        <button
          type="button"
          disabled
          aria-label={`You have entered ${title}`}
          className={`${ctaBaseCls} bg-[#E5F7EE] text-[#1F7A37]`}
        >
          <span className="truncate">✓ Entered</span>
        </button>
      );
    }

    if (status === 'open') {
      // Show "Checking…" while async fetches are in-flight or membership not yet resolved.
      const stillResolving =
        checkingEntry ||
        checkingMembership ||
        (requiresMembership && !!user && !membershipReady);

      if (stillResolving) {
        return (
          <button
            type="button"
            disabled
            aria-label={`Checking eligibility for ${title}`}
            className={`${ctaBaseCls} bg-[#F4F1FB] text-[#a3a8be] cursor-not-allowed`}
          >
            <span className="truncate">Checking…</span>
          </button>
        );
      }

      // Membership cancelled → link to membership plans page (pick plan to start fresh)
      if (requiresMembership && isCanceled) {
        return (
          <Link
            href="/#membership-plans"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Reactivate membership to enter ${title}`}
            className={`${ctaBaseCls} bg-[#6356e5] text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] hover:bg-[#5346d6]`}
          >
            <span className="truncate">Reactivate</span>
            <Icon.ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        );
      }

      // Membership paused → link to dashboard membership (resume)
      if (requiresMembership && membership?.isPaused) {
        return (
          <Link
            href="/dashboard/membership"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Resume membership to enter ${title}`}
            className={`${ctaBaseCls} bg-[#6356e5] text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] hover:bg-[#5346d6]`}
          >
            <span className="truncate">Resume Membership</span>
            <Icon.ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        );
      }

      // Membership required (no active membership) → link to membership plans
      if (requiresMembership && !canEnterBonusDraw) {
        return (
          <Link
            href="/#membership-plans"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Join to access ${title}`}
            className={`${ctaBaseCls} bg-[#6356e5] text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] hover:bg-[#5346d6]`}
          >
            <span className="truncate">Join to Access</span>
            <Icon.ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        );
      }

      // Available — open ConfirmEntryModal (preserved logic)
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowConfirmModal(true);
          }}
          aria-label={`Enter Bonus Draw · ${title}`}
          className={`${ctaBaseCls} bg-[#6356e5] text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] hover:bg-[#5346d6]`}
        >
          <span className="truncate">Enter Bonus Draw</span>
          <Icon.ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </button>
      );
    }

    /* Sold-out — disabled "Full" (no waitlist; matches detail page Option B). */
    if (status === 'soldOut') {
      return (
        <button
          type="button"
          disabled
          aria-label={`${title} is full`}
          className={`${ctaBaseCls} bg-[#F4F1FB] text-[#a3a8be] cursor-not-allowed`}
        >
          <span className="truncate">Full</span>
        </button>
      );
    }

    /* Closed / canceled — draw has ended permanently. */
    return (
      <button
        type="button"
        disabled
        aria-label={`Closed: ${title}`}
        className={`${ctaBaseCls} bg-[#F4F1FB] text-[#a3a8be] cursor-not-allowed`}
      >
        <span className="truncate">Closed</span>
      </button>
    );
  };

  /* Status badge — top-left of image */
  const renderStatusBadge = () => {
    if (hasEntered) {
      return (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E5F7EE] px-2.5 py-1 text-[11px] font-semibold text-[#1F7A37]">
          ✓ Entered
        </span>
      );
    }
    if (requiresMembership && !hasActiveMembership && user) {
      return (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#6356E5] backdrop-blur">
          Members-only
        </span>
      );
    }
    if (status === 'soldOut') {
      return (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#0f1222] backdrop-blur">
          Full
        </span>
      );
    }
    if (status === 'closed' || status === 'canceled') {
      return (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#667085] backdrop-blur">
          Closed
        </span>
      );
    }
    return null;
  };

  /* ---------------------------------------------------------------------
     JSX — v4 DrawCard layout
  --------------------------------------------------------------------- */
  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`View details for ${title}`}
      onClick={navigate}
      onKeyDown={onCardKeyDown}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C9C0F2] hover:shadow-[0_30px_60px_-30px_rgba(99,86,229,.30),0_8px_24px_-12px_rgba(15,18,34,.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6356E5]"
    >
      {/* Image area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1B1B22] via-[#2A2A38] to-[#4B4DBD]">
        {/* Soft texture */}
        <div aria-hidden className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        {/* Top highlight + bottom shadow gradients */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/14 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

        {renderStatusBadge()}

        {/* Time-left chip — bottom-right of image */}
        {status === 'open' && timeRemaining && (
          <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#0f1222] backdrop-blur">
            {timeRemaining}
          </span>
        )}

        {displayImageUrl ? (
          <Image
            src={displayImageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl text-white/30">🎁</div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Title */}
        <h3 className="text-[17px] font-extrabold leading-tight tracking-tight text-[#0F1222] sm:text-[18px]">
          {title}
        </h3>

        {/* Entry rule + trust signal.
            QW-9 — the "Verified & published" chip anchors the Bonus Draw
            as a premium, transparent product (not gambling). Sits next to
            the existing entry rule so it's part of the title group, not
            visual clutter. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-[#667085]">
            <Icon.Users className="h-3.5 w-3.5 text-[#6356E5]" />
            Max 1 entry per member
          </span>
          <span aria-hidden className="text-[#D1D5DB]">·</span>
          <span
            className="inline-flex items-center gap-1.5 text-[#0F766E]"
            title="Winners are picked transparently and published when the draw closes."
          >
            <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            Verified &amp; published
          </span>
        </div>

        {/* Member progress */}
        {cap !== -1 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#4B5563]">
                <span className="font-semibold text-[#0f1222] tabular-nums">{entrants.toLocaleString()}</span>
                <span className="text-[#667085]"> / {cap.toLocaleString()} members joined</span>
              </span>
              <span className="rounded-full bg-[#F4F1FB] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF]">{pct}%</span>
            </div>
            <div ref={progressRef} className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#eceaf7] ring-1 ring-inset ring-[#E0DAFF]/60">
              <div
                className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-[#6356e5] to-[#8a7bff] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${progressW}%` }}
              >
                {/* One-shot shimmer sweep — re-mounts via key to retrigger animation */}
                {progressW > 0 && (
                  <span
                    key={shimmerKey}
                    aria-hidden
                    className="uc-shimmer-bar absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-[12px] italic text-[#667085]">Unlimited entries</p>
        )}

        {/* Closing date + reminder toggle.
            U5 — opt-in "Remind me" sits next to the closing time so the
            time-pressure context is right there. Hidden for guests,
            already-entered members, and non-OPEN draws.
            Layout uses justify-between so both pills stay on the same row
            at every viewport — date on the left grows naturally, reminder
            stays a fixed-width icon button so it never wraps. */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-[#FBFAFF] px-2.5 py-1.5 text-[12px] font-medium text-[#4B5563] ring-1 ring-[#EFEDF5]">
            <Icon.CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#6356E5]" />
            <span className="truncate">{closingLabel}</span>
          </p>
          {/*
           * Only show on OPEN draws when the user hasn't entered yet and
           * we know the subscription state. Closed / sold-out / canceled
           * draws don't render this at all.
           *
           * Stop-propagation handlers below (mousedown/touchstart/click
           * on the button itself) keep the outer <article onClick={navigate}>
           * from hijacking the tap. We deliberately do NOT use
           * onClickCapture — that fires before descendants and would
           * kill the button's own onClick handler.
           */}
          {user && !hasEntered && status === 'open' && reminderOn !== null && (
            <button
              type="button"
              onClick={toggleReminder}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  toggleReminder(e);
                }
              }}
              disabled={reminderBusy}
              aria-pressed={reminderOn}
              aria-label={reminderOn ? 'Reminder set — tap to remove' : 'Remind me before this Bonus Draw closes'}
              title={reminderOn ? 'Reminder set — tap to remove' : 'Remind me before this Bonus Draw closes'}
              /*
               * Mobile: 36×36 icon-only square (fits next to the date pill
               * without wrapping). Desktop sm+: same icon + short label.
               * ON state is solid purple so the flip is obvious.
               */
              className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5]/40 disabled:opacity-60 w-9 sm:w-auto sm:px-2.5 ${
                reminderOn
                  ? 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)] hover:from-[#5346D6] hover:to-[#7867EC]'
                  : 'bg-white text-[#4B5563] ring-1 ring-[#EFEDF5] hover:text-[#6356E5] hover:ring-[#E0DAFF]'
              }`}
            >
              {reminderOn ? (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden>
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  <span className="hidden sm:inline">Reminder set</span>
                </>
              ) : (
                <>
                  <Icon.Bell className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Remind me</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA row — Points chip + action button.
            Stacks vertically below md (mobile + sm 2-col where each card is narrow);
            switches to horizontal grid at md+ where card has enough width for both. */}
        <div className="mt-5 flex flex-col gap-2 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:items-stretch">
          <span className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#F4F1FB] px-3.5 text-[12.5px] font-extrabold tracking-tight tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF] md:w-auto">
            <Icon.Coins className="h-3.5 w-3.5 shrink-0" />
            {pointsLabel}
          </span>
          {renderCta()}
        </div>
      </div>

      {/* Confirm Entry Modal — preserved */}
      <ConfirmEntryModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        draw={{
          id,
          title,
          costPerEntry: creditsPerEntry,
          state,
          entrants,
          cap,
          closedAt,
          requiresMembership,
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </article>
  );
}
