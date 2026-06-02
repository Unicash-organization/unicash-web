'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmEntryModal from './ConfirmEntryModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const SparkBoltIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);
const UsersIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const CalendarClockIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <circle cx="16" cy="16" r="6" />
    <path d="M16 14v2l1 1" />
  </svg>
);
const CoinsIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
);
const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const SpinnerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" fill="none" />
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
const TrophyIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

function getFeaturedDrawImageUrl(draw: any): string | null {
  if (draw.images && Array.isArray(draw.images) && draw.images.length > 0) {
    const sorted = [...draw.images].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const first = sorted[0];
    const url = typeof first === 'string' ? first : (first?.url ?? first);
    if (url) return url.startsWith('http') ? url : `${API_BASE}/${url}`;
  }
  const prize = draw.prizeImage;
  if (prize) {
    const url = typeof prize === 'string' ? prize : prize?.url ?? prize;
    if (url) return url.startsWith('http') ? url : `${API_BASE}/${url}`;
  }
  return null;
}

export default function FeaturedBonusDraw() {
  /* ===== Logic preserved exactly ===== */
  const { user } = useAuth();
  const [featuredDraw, setFeaturedDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<any>(null);
  // eslint-disable-next-line no-unused-vars
  const [checkingMembership, setCheckingMembership] = useState(false);
  /* CTA → ConfirmEntryModal trigger (matches DrawCard pattern) */
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  /* User entry status — same pattern as DrawCard */
  const [hasEntered, setHasEntered] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [checkingEntry, setCheckingEntry] = useState(false);
  /* Tracks whether membership status has been resolved at least once.
     Prevents flashing membership warnings during the ~1-2s async fetch on mount. */
  const [membershipReady, setMembershipReady] = useState(false);

  useEffect(() => {
    const fetchFeaturedDraw = async () => {
      try {
        const response = await api.draws.getAll();
        const featured = response.data.find((d: any) => d.state === 'open') || response.data[0];
        setFeaturedDraw(featured);
      } catch (error) {
        console.error('Error fetching featured draw:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedDraw();
  }, []);

  useEffect(() => {
    if (!featuredDraw) return;
    // No user → no membership to check, mark ready immediately
    if (!user) {
      setMembershipReady(true);
      return;
    }
    if (featuredDraw.requiresMembership) {
      checkMembership();
    } else {
      // Draw doesn't require membership — no need to gate on fetch
      setMembershipReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, featuredDraw?.requiresMembership]);

  /* Check if user has already entered this draw — drives "Entered" CTA state.
     Same pattern as DrawCard. Runs on user + draw id change. */
  useEffect(() => {
    const checkUserEntry = async () => {
      if (!user || !featuredDraw?.id) return;
      setCheckingEntry(true);
      try {
        const res = await api.entries
          .hasEntryForDraw(featuredDraw.id)
          .catch(() => ({ data: { hasEntry: false } }));
        setHasEntered(!!res.data?.hasEntry);
      } catch (error) {
        console.error('Error checking user entry:', error);
      } finally {
        setCheckingEntry(false);
      }
    };
    checkUserEntry();
  }, [user, featuredDraw?.id]);

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

  /* Skeleton — placeholder mirrors final 2-column featured draw layout */
  if (loading) {
    return (
      <section className="relative w-full overflow-hidden bg-white">
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Image placeholder */}
            <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-[#F4F1FB]" />
            {/* Info column */}
            <div className="space-y-4">
              <div className="h-5 w-32 animate-pulse rounded-full bg-[#F4F1FB]" />
              <div className="space-y-2">
                <div className="h-8 w-full animate-pulse rounded-lg bg-[#F4F1FB]" />
                <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[#F4F1FB]" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-full animate-pulse rounded bg-[#F4F1FB]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#F4F1FB]" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#F4F1FB]" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#F4F1FB]" />
                ))}
              </div>
              <div className="h-2 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
              <div className="h-12 w-48 animate-pulse rounded-full bg-[#F4F1FB]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredDraw) return null;

  const featuredImageUrl = getFeaturedDrawImageUrl(featuredDraw);
  const isUnlimited = featuredDraw.cap === -1;
  const entrants = featuredDraw.entrants || 0;
  const cap = featuredDraw.cap || 0;
  const entrantsProgress = isUnlimited ? 0 : Math.min(100, Math.round((entrants / (cap || 1)) * 100));

  /* Membership-eligibility — preserved exactly */
  const isCanceled = membership?.status === 'canceled';
  const periodEnded = membership?.currentPeriodEnd && new Date(membership.currentPeriodEnd) < new Date();
  const hasActiveMembership =
    !!membership &&
    !isCanceled &&
    membership.status === 'active' &&
    !membership.isPaused &&
    !periodEnded;
  const canEnterBonusDraw = !featuredDraw.requiresMembership || hasActiveMembership;

  // Per-member entry rule label (reflects SINGLE/MULTI + per-member cap).
  const entryRuleLabel =
    featuredDraw.entryLimitMode === 'multi'
      ? featuredDraw.maxEntriesPerMember != null
        ? `Max ${Number(featuredDraw.maxEntriesPerMember).toLocaleString()} entries per member`
        : 'Multiple entries per member'
      : 'Max 1 entry per member';

  /* v4 closing-date format — same as DrawCard */
  const closingLabel = (() => {
    const d = new Date(featuredDraw.closedAt);
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
  })();

  /* Short closing label for the mobile image overlay — weekday + date, no time/zone.
     e.g. "Closed Monday 30 May" / "Ends Monday 30 May". */
  const closingLabelShort = (() => {
    const d = new Date(featuredDraw.closedAt);
    if (isNaN(d.getTime())) return '';
    const verb = new Date() > d ? 'Closed' : 'Ends';
    const datePart = d.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'Australia/Sydney',
    });
    return `${verb} ${datePart}`;
  })();


  /* CTA decision — show neutral state while membership/entry are still resolving
     to avoid flashing "Join to Access" before fetch completes. */
  const stillResolving =
    checkingEntry ||
    checkingMembership ||
    (featuredDraw.requiresMembership && !!user && !membershipReady);
  const blocked = !stillResolving && featuredDraw.requiresMembership && !canEnterBonusDraw;
  const ctaText = stillResolving
    ? 'Checking…'
    : blocked
      ? (isCanceled ? 'Membership cancelled' : membership?.isPaused ? 'Membership paused' : 'Join to Access')
      : 'Enter Bonus Draw';

  /* Whole card click → details page (preserved) */
  const navigate = () => {
    window.location.href = `/giveaways/${featuredDraw.id}`;
  };
  const onCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate();
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Subtle gradient transition from hero lavender to white */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#F4F1FB] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3A2A06] shadow-[0_4px_12px_-2px_rgba(255,200,93,0.45)]">
            <SparkBoltIcon className="h-3 w-3" />
            Featured Bonus Draw
          </span>
          <h2 className="mt-4 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[34px] md:text-[40px]">
            This <span className="uc-gold-gradient">week&rsquo;s spotlight.</span>
          </h2>
        </div>

        {/* Featured card — whole card clickable */}
        <article
          role="link"
          tabIndex={0}
          aria-label={`View details for ${featuredDraw.title}`}
          onClick={navigate}
          onKeyDown={onCardKeyDown}
          className="group relative mx-auto mt-10 max-w-5xl cursor-pointer overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white shadow-[0_30px_80px_-30px_rgba(99,86,229,0.30),0_8px_24px_-12px_rgba(15,18,34,.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_100px_-30px_rgba(99,86,229,0.40),0_8px_24px_-12px_rgba(15,18,34,.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6356E5] sm:mt-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] md:aspect-auto md:min-h-[400px]">
              {/* Texture + gradients */}
              <div aria-hidden className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div aria-hidden className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/14 to-transparent" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

              {/* Top-left badge — switches to "Entered" green pill once user has entered.
                  Otherwise shows Members-only gold pill for member-restricted draws. */}
              {hasEntered ? (
                <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#E5F7EE] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#1F7A37] shadow-[0_6px_16px_-4px_rgba(31,122,55,0.35)] ring-1 ring-[#A7F3D0]">
                  ✓ Entered
                </span>
              ) : featuredDraw.requiresMembership ? (
                <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#3A2A06] shadow-[0_6px_16px_-4px_rgba(255,200,93,0.55)]">
                  <UsersIcon className="h-3 w-3" />
                  Members-only
                </span>
              ) : null}

              {/* Image or fallback */}
              {featuredImageUrl ? (
                <Image
                  src={featuredImageUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                    <TrophyIcon className="h-12 w-12 text-[#FFE2B0]" />
                  </span>
                </div>
              )}

              {/* Mobile-only closing pill — bottom-left over the image (short label) */}
              {closingLabelShort && (
                <span className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#0F1222] shadow-[0_6px_16px_-4px_rgba(15,18,34,0.35)] sm:hidden">
                  <CalendarClockIcon className="h-3.5 w-3.5 text-[#6356E5]" />
                  {closingLabelShort}
                </span>
              )}

            </div>

            {/* Body */}
            <div className="flex flex-col p-6 sm:p-8 md:p-9 lg:p-10">
              <h3 className="text-[22px] font-extrabold leading-tight tracking-tight text-[#0F1222] sm:text-[26px] md:text-[30px]">
                {featuredDraw.title}
              </h3>

              {/* Stats row — Max entry + Ends */}
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FBFAFF] px-2.5 py-1.5 text-[12px] font-medium text-[#4B5563] ring-1 ring-[#EFEDF5]">
                  <UsersIcon className="h-3.5 w-3.5 text-[#6356E5]" />
                  {entryRuleLabel}
                </span>
                {/* Desktop: full closing label in stats row. Mobile shows the short
                    pill over the image instead (above). */}
                <span className="hidden items-center gap-1.5 rounded-lg bg-[#FBFAFF] px-2.5 py-1.5 text-[12px] font-medium text-[#4B5563] ring-1 ring-[#EFEDF5] sm:inline-flex">
                  <CalendarClockIcon className="h-3.5 w-3.5 text-[#6356E5]" />
                  {closingLabel}
                </span>
              </div>

              {/* Member progress */}
              {!isUnlimited ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#4B5563]">
                      <span className="font-extrabold text-[#0F1222] tabular-nums">{entrants.toLocaleString()}</span>
                      <span className="text-[#667085]"> / {cap.toLocaleString()} entries</span>
                    </span>
                    <span className="rounded-full bg-[#F4F1FB] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF]">{entrantsProgress}%</span>
                  </div>
                  <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[#eceaf7] ring-1 ring-inset ring-[#E0DAFF]/60">
                    <div
                      className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-[#6356e5] to-[#8a7bff] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[width] duration-[900ms]"
                      style={{ width: `${entrantsProgress}%` }}
                    >
                      <span aria-hidden className="uc-fbd-shimmer absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-[13px] italic text-[#667085]">
                  Unlimited · {entrants.toLocaleString()} entries so far
                </p>
              )}

              <div className="flex-1" />

              {/* CTA row — Points chip + action button (side-by-side, matches DrawCard pattern).
                  stopPropagation prevents double-navigation since whole card is clickable. */}
              <div className="mt-6">
                {/* CTA layout — Points chip + action on one row (all sizes). On mobile the
                    unit shortens to "Pts" and the CTA to "Enter Draw" so both fit. */}
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-stretch gap-2 sm:gap-2.5">
                  <span className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#F4F1FB] px-3 text-[14px] font-extrabold tracking-tight tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF] sm:px-4">
                    <CoinsIcon className="h-4 w-4 shrink-0" />
                    {(featuredDraw.costPerEntry || 0).toLocaleString()}
                    <span className="sm:hidden">&nbsp;Pts</span>
                    <span className="hidden sm:inline">&nbsp;Points</span>
                  </span>
                  {(() => {
                    const ctaPrimaryCls = 'uc-lift-sm inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[15px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC]';
                    const ctaDisabledCls = 'inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[15px] font-bold bg-[#F4F1FB] text-[#a3a8be] cursor-not-allowed';

                    /* Already entered → green disabled pill */
                    if (hasEntered) {
                      return (
                        <button type="button" disabled aria-label={`You have entered ${featuredDraw.title}`} className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#E5F7EE] px-5 text-[15px] font-bold text-[#1F7A37]">
                          <span className="truncate">✓ Entered</span>
                        </button>
                      );
                    }

                    /* Still resolving membership/entry status */
                    if (stillResolving) {
                      return (
                        <button type="button" disabled aria-label={`Checking eligibility for ${featuredDraw.title}`} className={ctaDisabledCls}>
                          <span className="truncate">Checking…</span>
                        </button>
                      );
                    }

                    /* Membership cancelled → link to membership plans (pick plan to start fresh) */
                    if (featuredDraw.requiresMembership && isCanceled) {
                      return (
                        <Link href="/#membership-plans" onClick={(e) => e.stopPropagation()} aria-label={`Reactivate membership · ${featuredDraw.title}`} className={ctaPrimaryCls}>
                          <span className="truncate">Reactivate</span>
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      );
                    }

                    /* Membership paused → link to dashboard membership */
                    if (featuredDraw.requiresMembership && membership?.isPaused) {
                      return (
                        <Link href="/dashboard/membership" onClick={(e) => e.stopPropagation()} aria-label={`Resume membership · ${featuredDraw.title}`} className={ctaPrimaryCls}>
                          <span className="truncate">Resume Membership</span>
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      );
                    }

                    /* Membership required → link to membership plans */
                    if (featuredDraw.requiresMembership && !canEnterBonusDraw) {
                      return (
                        <Link href="/#membership-plans" onClick={(e) => e.stopPropagation()} aria-label={`Join to access · ${featuredDraw.title}`} className={ctaPrimaryCls}>
                          <span className="truncate">Join to Access</span>
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      );
                    }

                    /* Available — open ConfirmEntryModal */
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setShowConfirmModal(true);
                        }}
                        aria-label={`Enter Bonus Draw · ${featuredDraw.title}`}
                        className={ctaPrimaryCls}
                      >
                        <span className="truncate">
                          <span className="sm:hidden">Enter Draw</span>
                          <span className="hidden sm:inline">Enter Bonus Draw</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </button>
                    );
                  })()}
                </div>

                {/* Trust microcopy */}
                <p className="mt-3 text-center text-[11.5px] text-[#667085]">
                  Capped participation · Published Winners · Member-only
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Confirm Entry Modal — same component DrawCard uses, portaled to body */}
      <ConfirmEntryModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        draw={{
          id: featuredDraw.id,
          title: featuredDraw.title,
          costPerEntry: featuredDraw.costPerEntry,
          state: featuredDraw.state,
          entrants: featuredDraw.entrants || 0,
          cap: featuredDraw.cap ?? 100,
          closedAt: featuredDraw.closedAt,
          requiresMembership: featuredDraw.requiresMembership,
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes uc-fbd-shimmer-anim {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        .uc-fbd-shimmer { animation: uc-fbd-shimmer-anim 2.4s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .uc-fbd-shimmer { animation: none !important; }
        }
      ` }} />
    </section>
  );
}
