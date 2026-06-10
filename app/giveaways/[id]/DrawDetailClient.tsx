'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DrawCard from '@/components/DrawCard';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import ConfirmEntryModal from '@/components/ConfirmEntryModal';
import LoadingRing from '@/components/LoadingRing';
import { useAuth } from '@/contexts/AuthContext';
import { DrawLoyaltyPanel } from '@/components/loyalty/DrawLoyaltyPanel';

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const Icon = {
  ArrowLeft: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Bell: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  ChevronDown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Eye: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Sparkle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   CompactCountdown — premium inline countdown for image overlay.
   Renders as: "01 day 14 hours 32 mins" with grammatically correct pluralization.
   Updates every 30s (no seconds shown so 30s precision is enough).
----------------------------------------------------------------------- */
function CompactCountdown({ targetDate }: { targetDate: string }) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(targetDate).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  // If less than 1 hour remaining, show only "X mins" for tight focus
  if (days === 0 && hours === 0) {
    return (
      <span className="inline-flex items-baseline gap-1">
        <span className="font-extrabold tabular-nums">{String(mins).padStart(2, '0')}</span>
        <span className="text-[10.5px] font-semibold text-[#667085]">{mins === 1 ? 'min' : 'mins'}</span>
      </span>
    );
  }

  // If less than 1 day, show "Xh Ym"
  if (days === 0) {
    return (
      <span className="inline-flex items-baseline gap-1">
        <span className="font-extrabold tabular-nums">{String(hours).padStart(2, '0')}</span>
        <span className="text-[10.5px] font-semibold text-[#667085]">{hours === 1 ? 'hour' : 'hours'}</span>
        <span className="ml-1 font-extrabold tabular-nums">{String(mins).padStart(2, '0')}</span>
        <span className="text-[10.5px] font-semibold text-[#667085]">{mins === 1 ? 'min' : 'mins'}</span>
      </span>
    );
  }

  // Default: "Xd Yh Zm"
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-extrabold tabular-nums">{String(days).padStart(2, '0')}</span>
      <span className="text-[10.5px] font-semibold text-[#667085]">{days === 1 ? 'day' : 'days'}</span>
      <span className="ml-1 font-extrabold tabular-nums">{String(hours).padStart(2, '0')}</span>
      <span className="text-[10.5px] font-semibold text-[#667085]">{hours === 1 ? 'hour' : 'hours'}</span>
      <span className="ml-1 font-extrabold tabular-nums">{String(mins).padStart(2, '0')}</span>
      <span className="text-[10.5px] font-semibold text-[#667085]">{mins === 1 ? 'min' : 'mins'}</span>
    </span>
  );
}

/* -----------------------------------------------------------------------
   FAQ + trust items — locked v4 copy
----------------------------------------------------------------------- */
const FAQ_FALLBACK = [
  {
    q: 'How do I enter a Bonus Draw?',
    a: 'Use Points from your UNICASH balance. The Points required are shown before you enter.',
  },
  {
    q: 'Do Membership plans include Bonus Draw entries?',
    a: 'No. Membership plans include Major Draw entries. Bonus Draws require Points.',
  },
  {
    q: 'How do I get more Points?',
    a: 'You can earn Points from eligible receipts and Fuel Rewards, or use an optional Point Booster.',
  },
  {
    q: 'Can I enter more than once?',
    a: 'Each Bonus Draw shows its own entry limit before you enter.',
  },
  {
    q: 'What happens after the Bonus Draw closes?',
    a: 'The outcome is recorded and Winners are published for transparency.',
  },
  {
    q: 'Are Point Boosters subscriptions?',
    a: 'No. Point Boosters are one-time purchases and do not auto-renew.',
  },
  {
    q: 'Are Winners published?',
    a: 'Yes. Winners are published with draw details for transparency.',
  },
];


/* Live entry-list card — recent public entries scroll in a ticker with a LIVE
   badge. Reads the public entry list (masked names only). The whole card links
   to the full Entry List. */
function LiveEntryListCard({ drawId, href }: { drawId: string; href: string }) {
  const [rows, setRows] = useState<{ name: string; num: string }[]>([]);
  useEffect(() => {
    let active = true;
    api.entries
      .getPublicDrawEntries(drawId, undefined, 1, 8)
      .then((res: any) => {
        const data = res?.data?.data ?? (Array.isArray(res?.data) ? res.data : []);
        if (!active) return;
        setRows(
          (data || []).map((e: any) => ({
            name: e.maskedName || 'UNICASH Member',
            num: e.ticketNumber != null ? String(e.ticketNumber).padStart(6, '0') : '—',
          })),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [drawId]);

  const loop = rows.length > 0 ? [...rows, ...rows] : [];
  const dur = `${Math.max(6, rows.length * 1.6)}s`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E7E9F2] bg-white p-4 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-all hover:-translate-y-0.5 hover:border-[#6356E5] hover:shadow-[0_8px_24px_-12px_rgba(99,86,229,0.20)] sm:p-5"
    >
      {/* LIVE badge */}
      <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#10B981] ring-1 ring-[#A7F3D0]">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]" />
        </span>
        Live
      </span>

      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F1FB] ring-1 ring-[#E0DAFF]">
        <Icon.Eye className="h-4 w-4 text-[#6356E5]" />
      </span>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#667085]">Live entry list</p>

      {loop.length > 0 ? (
        <div className="uc-ticker-mask mt-1.5 h-9 overflow-hidden">
          <div className="uc-ticker flex flex-col gap-1" style={{ ['--uc-ticker-dur' as never]: dur }}>
            {loop.map((r, i) => (
              <span key={i} className="flex items-center justify-between gap-2 text-[11.5px] leading-[17px]">
                <span className="truncate font-semibold text-[#0F1222]">{r.name}</span>
                <span className="shrink-0 font-mono font-bold text-[#6356E5]">{r.num}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-[12px] text-[#9AA0B4]">No entries yet — be the first.</p>
      )}

      <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-extrabold text-[#6356E5]">
        View all entries
        <Icon.ArrowRight className="h-3.5 w-3.5 shrink-0" />
      </p>
    </Link>
  );
}

/* -----------------------------------------------------------------------
   Page component — ALL logic preserved, JSX simplified
----------------------------------------------------------------------- */

export default function DrawDetailClient() {
  /* ===== ALL ORIGINAL STATE + HOOKS — preserved exactly ===== */
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { id } = params;
  const [draw, setDraw] = useState<any>(null);
  // Live entry count from /draws/:id/entry-stats (authoritative — avoids the
  // drifty draw.entrants column). Null until loaded; falls back to draw.entrants.
  const [soldEntries, setSoldEntries] = useState<number | null>(null);
  const [relatedDraws, setRelatedDraws] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [rulesTerms, setRulesTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  // MULTI draws: how many valid entries the member already holds in this draw.
  const [myEntryCount, setMyEntryCount] = useState(0);
  const [checkingEntry, setCheckingEntry] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [checkingWaitlist, setCheckingWaitlist] = useState(false);
  const [addingToWaitlist, setAddingToWaitlist] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [membership, setMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);
  /* Tracks whether membership status has been resolved at least once.
     Prevents flashing membership warnings during the ~1-2s async fetch. */
  const [membershipReady, setMembershipReady] = useState(false);

  const loadDraw = async () => {
    if (!id) return;
    try {
      const drawRes = await api.draws.get(id as string);
      setDraw(drawRes.data);
      api.draws
        .getEntryStats(id as string)
        .then((r) => setSoldEntries(r.data?.soldEntries ?? null))
        .catch(() => {});
    } catch (error) {
      console.error('Error fetching draw:', error);
    }
  };

  useEffect(() => {
    if (!id) return;
    if (authLoading) return;

    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [drawRes, allDrawsRes, faqsRes, settingsRes] = await Promise.all([
          api.draws.get(id as string, user?.id),
          api.draws.getAll(user?.id),
          api.faqs.getAll('draws').catch(() => ({ data: [] })),
          api.settings.getByKey('rules_and_terms').catch(() => ({ data: null })),
        ]);
        setDraw(drawRes.data);
        api.draws
          .getEntryStats(id as string)
          .then((r) => setSoldEntries(r.data?.soldEntries ?? null))
          .catch(() => {});
        setRelatedDraws(allDrawsRes.data.filter((d: any) => d.id !== id).slice(0, 3));
        setFaqs(faqsRes.data || []);
        setRulesTerms(settingsRes.data?.value || '');
        setFetchError(null);
      } catch (error: any) {
        console.error('Error fetching draw:', error);
        setFetchError(error?.response?.data?.message || error?.message || 'Failed to load draw');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user?.id, authLoading]);

  useEffect(() => {
    if (!user) {
      setMembershipReady(true);
      return;
    }
    if (id) {
      checkUserEntry();
      checkWaitlistStatus();
      if (draw?.requiresMembership) {
        checkMembership();
      } else if (draw) {
        setMembershipReady(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, draw?.requiresMembership]);

  const checkUserEntry = async () => {
    if (!user) return;
    setCheckingEntry(true);
    try {
      // Use the precise count (drives MULTI per-member-limit logic). hasEntered
      // derives from it. Falls back to the boolean endpoint on error.
      const res = await api.entries
        .getMyDrawEntryNumbers(id as string)
        .catch(() => null);
      if (res?.data) {
        const c = res.data.count ?? 0;
        setMyEntryCount(c);
        setHasEntered(c > 0);
      } else {
        const fallback = await api.entries
          .hasEntryForDraw(id as string)
          .catch(() => ({ data: { hasEntry: false } }));
        const entered = !!fallback.data?.hasEntry;
        setHasEntered(entered);
        setMyEntryCount(entered ? 1 : 0);
      }
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
      const res = await api.waitlist
        .check(id as string)
        .catch(() => ({ data: { isOnWaitlist: false } }));
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
      await api.waitlist.add(id as string);
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
      await api.waitlist.remove(id as string);
      setIsOnWaitlist(false);
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    } finally {
      setAddingToWaitlist(false);
    }
  };

  /* ===== Loading + error + not-found states ===== */
  if (authLoading || loading) {
    /* Skeleton — placeholder mirrors final draw detail page layout
       (image + info card + entry CTA). Replaces fullscreen white box. */
    return (
      <main className="relative min-h-screen bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          {/* Back link */}
          <div className="mb-6 h-5 w-32 animate-pulse rounded bg-[#F4F1FB]" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
            {/* Image */}
            <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-[#F4F1FB]" />

            {/* Info card */}
            <article className="rounded-3xl border border-[#E0DAFF] bg-white p-6 shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)] sm:p-7">
              <div className="space-y-3">
                <div className="h-5 w-36 animate-pulse rounded-full bg-[#F4F1FB]" />
                <div className="space-y-2">
                  <div className="h-7 w-full animate-pulse rounded-lg bg-[#F4F1FB]" />
                  <div className="h-7 w-3/4 animate-pulse rounded-lg bg-[#F4F1FB]" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#F4F1FB]" />
                ))}
              </div>
              <div className="mt-5 space-y-1.5">
                <div className="h-4 w-full animate-pulse rounded bg-[#F4F1FB]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#F4F1FB]" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#F4F1FB]" />
              </div>
              <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
              <div className="mt-2 h-4 w-48 animate-pulse rounded bg-[#F4F1FB]" />
            </article>
          </div>

          {/* More draws section */}
          <div className="mt-12 space-y-4 sm:mt-16">
            <div className="h-7 w-48 animate-pulse rounded bg-[#F4F1FB]" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <article key={i} className="overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white">
                  <div className="aspect-[4/3] w-full animate-pulse bg-[#F4F1FB]" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[#F4F1FB]" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-[#F4F1FB]" />
                    <div className="h-11 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="relative flex min-h-[60vh] items-center justify-center px-5 py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-[#FCA5A5]/60 bg-[#FEF2F2] p-7 text-center shadow-[0_1px_2px_rgba(15,18,34,.04)]">
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#7F1D1D]">Unable to load draw</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#991B1B]">{fetchError}</p>
          <Link
            href="/giveaways"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-6 text-[13.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
          >
            View all Bonus Draws
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  if (!draw) {
    return (
      <main className="relative flex min-h-[60vh] items-center justify-center px-5 py-20 text-center">
        <div className="mx-auto max-w-md">
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222]">Bonus Draw not found</h1>
          <p className="mt-2 text-[13.5px] text-[#4B5563]">This Bonus Draw may have been removed or never existed.</p>
          <Link
            href="/giveaways"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-6 text-[13.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
          >
            View all Bonus Draws
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  /* ===== Derived data + status logic — preserved exactly ===== */

  const drawImages =
    draw.images && Array.isArray(draw.images) && draw.images.length > 0
      ? draw.images
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((img: any) => ({
            id: img.id,
            url: img.url || img,
            order: img.order || 0,
            isPrimary: img.isPrimary || false,
          }))
      : draw.prizeImage
        ? [{ url: typeof draw.prizeImage === 'string' ? draw.prizeImage : draw.prizeImage.url || draw.prizeImage }]
        : [];

  const isUnlimited = draw.cap === -1;
  // Prefer the live entry count from entry-stats; fall back to draw.entrants
  // until it loads. cap = max number of TOTAL entries.
  const entrants = soldEntries ?? draw.entrants ?? 0;
  const cap = draw.cap || 0;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((entrants / (cap || 1)) * 100));

  const isClosedByDate = draw.closedAt ? new Date(draw.closedAt) < new Date() : false;
  const isSoldOut = !isUnlimited && (draw.state === 'soldOut' || entrants >= cap);
  const isClosed = draw.state === 'closed' || isClosedByDate;

  const isCanceled = membership?.status === 'canceled';
  const periodEnded =
    membership?.currentPeriodEnd && new Date(membership.currentPeriodEnd) < new Date();
  const hasActiveMembership =
    !!membership &&
    !isCanceled &&
    membership.status === 'active' &&
    !membership.isPaused &&
    !periodEnded;
  const canEnterBonusDraw = !draw.requiresMembership || hasActiveMembership;

  // Per-member entry mode. SINGLE: one entry blocks further entries. MULTI:
  // member may enter again until they hit maxEntriesPerMember (null = unlimited).
  const isMultiEntry = draw.entryLimitMode === 'multi';
  const maxPerMember: number | null =
    draw.maxEntriesPerMember != null ? Number(draw.maxEntriesPerMember) : null;
  // True when the member can't enter again: SINGLE + already entered, or
  // MULTI + reached the per-member cap.
  const reachedEntryLimit = isMultiEntry
    ? maxPerMember != null && myEntryCount >= maxPerMember
    : hasEntered;
  // MULTI draw where the member already has entries but can still add more.
  const canEnterAgain = isMultiEntry && myEntryCount > 0 && !reachedEntryLimit;

  // Human label for the per-member entry rule (chips).
  const entryRuleLabel = !isMultiEntry
    ? 'Max 1 entry per Member'
    : maxPerMember != null
      ? `Max ${maxPerMember.toLocaleString()} entries per Member`
      : 'Multiple entries per Member';

  const isDisabled =
    isClosed || isSoldOut || reachedEntryLimit || isCanceled || (draw.requiresMembership && !canEnterBonusDraw);

  const totalPoints = (user?.membershipCredits || 0) + (user?.boostCredits || 0);
  const hasEnoughPoints = totalPoints >= (draw.costPerEntry || 0);

  /* Closing label — v4 format */
  const closingLabel = (() => {
    const d = new Date(draw.closedAt);
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


  /* Status badge — single source of truth.
     "Entered" intentionally omitted because the CTA button already shows
     "✓ Entered" status — avoids duplicate visual signal on the image. */
  const statusBadge = (() => {
    if (isClosed) return { tone: 'neutral', text: 'Closed' };
    if (isSoldOut) return { tone: 'neutral', text: 'Full' };
    if (draw.requiresMembership) return { tone: 'gold', text: 'Members-only' };
    return null;
  })();

  /* Entry state resolver — drives CTA + helper. Logic preserved. */
  type EntryStateKind =
    | 'entered'
    | 'closed'
    | 'full'
    | 'membership-cancelled'
    | 'membership-paused'
    | 'membership-required'
    | 'login-required'
    | 'insufficient-points'
    | 'available'
    | 'resolving';

  const stillResolving =
    checkingEntry ||
    checkingMembership ||
    (draw.requiresMembership && !!user && !membershipReady);

  const entryState: { kind: EntryStateKind; ctaLabel: string; helper: string } = (() => {
    if (stillResolving) return { kind: 'resolving', ctaLabel: 'Checking…', helper: 'Checking your eligibility…' };
    if (reachedEntryLimit)
      return {
        kind: 'entered',
        ctaLabel: '✓ Entered',
        helper: isMultiEntry
          ? `You have ${myEntryCount} ${myEntryCount === 1 ? 'entry' : 'entries'} — the maximum for this Bonus Draw.`
          : 'You are already entered in this Bonus Draw.',
      };
    if (isClosed) return { kind: 'closed', ctaLabel: 'Closed', helper: 'This Bonus Draw has closed. Winners will be published after verification.' };
    if (isSoldOut) return { kind: 'full', ctaLabel: 'Full', helper: 'This Bonus Draw is full. Winners will be announced soon.' };
    if (draw.requiresMembership && isCanceled) return { kind: 'membership-cancelled', ctaLabel: 'Reactivate Membership', helper: 'Your Membership has been cancelled. Reactivate to enter member-only Bonus Draws.' };
    if (draw.requiresMembership && membership?.isPaused) return { kind: 'membership-paused', ctaLabel: 'Resume Membership', helper: 'Your Membership is paused. Resume to enter this member-only Bonus Draw.' };
    if (draw.requiresMembership && !user) return { kind: 'login-required', ctaLabel: 'Log in to Enter', helper: 'Log in to use Points for this member-only Bonus Draw.' };
    if (draw.requiresMembership && !hasActiveMembership) return { kind: 'membership-required', ctaLabel: 'Join to Access', helper: 'Bonus Draws are available to active UNICASH Members.' };
    if (!user) return { kind: 'login-required', ctaLabel: 'Log in to Enter', helper: 'Log in to use Points for this Bonus Draw.' };
    if (!hasEnoughPoints) return { kind: 'insufficient-points', ctaLabel: 'Get More Points', helper: 'Top up with a Point Booster or earn more Points from eligible receipts.' };
    if (canEnterAgain) {
      const remainingTxt =
        maxPerMember != null ? ` You can add ${maxPerMember - myEntryCount} more.` : '';
      return {
        kind: 'available',
        ctaLabel: 'Enter Again',
        helper: `You have ${myEntryCount} ${myEntryCount === 1 ? 'entry' : 'entries'} in this Bonus Draw.${remainingTxt}`,
      };
    }
    return { kind: 'available', ctaLabel: 'Enter Bonus Draw', helper: 'Points are used only after you confirm your entry.' };
  })();

  /* Primary CTA renderer — single source of truth */
  const renderPrimaryButton = () => {
    const baseCls = 'inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[14.5px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2';

    if (entryState.kind === 'resolving') {
      return (
        <button type="button" disabled className={`${baseCls} bg-[#F4F1FB] text-[#a3a8be] cursor-not-allowed`}>
          <span className="truncate">{entryState.ctaLabel}</span>
        </button>
      );
    }
    if (entryState.kind === 'entered') {
      return (
        <button type="button" disabled aria-label={`You have entered ${draw.title}`} className={`${baseCls} bg-[#E5F7EE] text-[#1F7A37]`}>
          <span className="truncate">{entryState.ctaLabel}</span>
        </button>
      );
    }
    if (entryState.kind === 'closed' || entryState.kind === 'full') {
      return (
        <button type="button" disabled className={`${baseCls} bg-[#F4F1FB] text-[#a3a8be] cursor-not-allowed`}>
          <span className="truncate">{entryState.ctaLabel}</span>
        </button>
      );
    }
    if (entryState.kind === 'membership-cancelled') {
      // Cancelled membership → pick a new plan to start fresh
      return (
        <Link href="/#membership-plans" className={`${baseCls} bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC]`}>
          <span className="truncate">{entryState.ctaLabel}</span>
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      );
    }
    if (entryState.kind === 'membership-paused') {
      // Paused membership → resume from dashboard (reversible)
      return (
        <Link href="/dashboard/membership" className={`${baseCls} bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC]`}>
          <span className="truncate">{entryState.ctaLabel}</span>
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      );
    }
    if (entryState.kind === 'login-required') {
      return (
        <Link href="/login" className={`${baseCls} bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC]`}>
          <span className="truncate">{entryState.ctaLabel}</span>
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      );
    }
    if (entryState.kind === 'membership-required') {
      return (
        <Link href="/#membership-plans" className={`${baseCls} bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC]`}>
          <span className="truncate">{entryState.ctaLabel}</span>
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      );
    }
    if (entryState.kind === 'insufficient-points') {
      return (
        <Link href="/point-boosters#choose-boost-pack" className={`${baseCls} bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC]`}>
          <span className="truncate">{entryState.ctaLabel}</span>
          <Icon.ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          if (isCanceled || isClosed || isSoldOut || reachedEntryLimit || !canEnterBonusDraw) return;
          setShowConfirmModal(true);
        }}
        disabled={isDisabled}
        aria-label={`${entryState.ctaLabel} · ${draw.title}`}
        className={`${baseCls} bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC] disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="truncate">
          {/* Shorten the entry CTA on mobile so it fits beside the Points chip */}
          {entryState.ctaLabel === 'Enter Bonus Draw' ? (
            <>
              <span className="sm:hidden">Enter Draw</span>
              <span className="hidden sm:inline">Enter Bonus Draw</span>
            </>
          ) : (
            entryState.ctaLabel
          )}
        </span>
        <Icon.ArrowRight className="h-4 w-4 shrink-0" />
      </button>
    );
  };

  /* Info cards (the live Entry List card is rendered separately, first). */
  const detailFacts: {
    label: string;
    value: string;
    Icon: React.FC<{ className?: string }>;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      label: 'Entries',
      value: `${isUnlimited ? 'Unlimited' : cap.toLocaleString() + ' cap'} · ${entryRuleLabel}`,
      Icon: Icon.Users,
      iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]',
      iconColor: 'text-[#6356E5]',
    },
  ];

  /* Winner selection livestream — strongest trust cue: members can watch the
     winner being selected live. */
  const winnerSelectionLabel = (() => {
    if (!draw.winnerSelectionAt) return '';
    const d = new Date(draw.winnerSelectionAt);
    if (isNaN(d.getTime())) return '';
    const datePart = d.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Australia/Sydney',
    });
    const timePart = d.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
      timeZoneName: 'short',
    });
    return `${datePart} · ${timePart}`;
  })();
  /* Closes — full date + time (same format as the winner selection card). */
  const closesFullLabel = (() => {
    const d = new Date(draw.closedAt);
    if (isNaN(d.getTime())) return '';
    const datePart = d.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Australia/Sydney',
    });
    const timePart = d.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
      timeZoneName: 'short',
    });
    return `${datePart} · ${timePart}`;
  })();

  detailFacts.push(
    {
      label: isClosed ? 'Closed' : 'Closes',
      value: closesFullLabel,
      Icon: Icon.CalendarClock,
      iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40',
      iconColor: 'text-[#C49A2C]',
    },
    {
      label: 'Winner selected live',
      value: winnerSelectionLabel || 'To be announced',
      Icon: Icon.Trophy,
      iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40',
      iconColor: 'text-[#C49A2C]',
    },
  );

  /* Optional rich content (overview / prize details / rules) — collapsed if present */
  const hasRichContent = !!(draw.overview || draw.description || draw.prizeDetails || draw.prizeDescription || rulesTerms);

  /* =====================================================================
     JSX — simplified single-card detail page
  ===================================================================== */

  return (
    <div>
      {/* ============================================================
          BREADCRUMB
      ============================================================ */}
      <div className="border-b border-[#E7E9F2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-3 text-[12.5px] sm:px-6 lg:px-8">
          <Link
            href="/giveaways"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold text-[#6356E5] transition-colors hover:bg-[#F4F1FB]"
          >
            <Icon.ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Bonus Draws</span>
          </Link>
          <span aria-hidden className="text-[#cfc8e8]">/</span>
          <span className="truncate text-[#667085]">{draw.title}</span>
        </div>
      </div>

      {/* ============================================================
          MAIN BONUS DRAW DETAIL CARD — enlarged Featured-card style.
          ALL key info concentrated here: image + status + title +
          progress + closing time + Points chip + CTA.
      ============================================================ */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[15%] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/15 blur-[140px]" />
          <div className="absolute right-[-10%] top-1/4 h-[360px] w-[360px] rounded-full bg-[#FFE2B0]/14 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage:
                'radial-gradient(rgba(99,86,229,0.18) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <article className="overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white shadow-[0_30px_80px_-30px_rgba(99,86,229,0.30),0_8px_24px_-12px_rgba(15,18,34,.08)]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* IMAGE — left on desktop (58% width for stronger visual weight), top on mobile */}
              <div className="relative lg:col-span-7">
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] lg:aspect-auto lg:h-full lg:min-h-[520px]">
                  {/* Texture + gradients */}
                  <div aria-hidden className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div aria-hidden className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/14 to-transparent" />
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

                  {/* Status badge — top-left (excludes Entered, which is shown via CTA) */}
                  {statusBadge && (
                    <span
                      className={`absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] ${
                        statusBadge.tone === 'gold'
                          ? 'bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] text-[#3A2A06] shadow-[0_6px_16px_-4px_rgba(255,200,93,0.55)]'
                          : 'bg-white text-[#667085] ring-1 ring-[#E7E9F2]'
                      }`}
                    >
                      {statusBadge.tone === 'gold' && <Icon.Users className="h-3 w-3" />}
                      {statusBadge.text}
                    </span>
                  )}

                  {/* Image — fills parent container (no aspect-video mismatch).
                      Renders primary image directly with object-cover. */}
                  {drawImages.length > 0 ? (
                    <Image
                      src={
                        drawImages[0].url.startsWith('http')
                          ? drawImages[0].url
                          : `${API_BASE}/${drawImages[0].url}`
                      }
                      alt={draw.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                        <Icon.Trophy className="h-12 w-12 text-[#FFE2B0]" />
                      </span>
                    </div>
                  )}

                  {/* Soft gradient overlay at bottom — improves countdown chip readability */}
                  {drawImages.length > 0 && (
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                  )}

                  {/* Countdown overlay — bottom-left, glassmorphism.
                      Compact inline format: "01 day 14 hours 32 mins" — premium feel
                      without the 4-box flip-clock visual. */}
                  {!isClosed && draw.closedAt && (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2.5 rounded-2xl bg-white/90 px-3.5 py-2 shadow-[0_8px_24px_-6px_rgba(15,18,34,0.30)] ring-1 ring-white/40 backdrop-blur-md">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_4px_10px_-2px_rgba(99,86,229,0.45)]">
                        <Icon.CalendarClock className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                          Entries close in
                        </p>
                        <div className="-mt-0.5 text-[13px] tracking-tight text-[#0F1222]">
                          <CompactCountdown targetDate={draw.closedAt as string} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* "Closed" overlay when draw is closed */}
                  {isClosed && (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-[0_8px_24px_-6px_rgba(15,18,34,0.30)] ring-1 ring-white/40 backdrop-blur-md">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4F1FB] text-[#667085] ring-1 ring-[#E7E9F2]">
                        <Icon.CalendarClock className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-[12px] font-extrabold tracking-tight text-[#0F1222]">{closingLabel}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENT — right on desktop (42% width), below on mobile */}
              <div className="flex flex-col p-6 sm:p-8 lg:col-span-5 lg:p-8">
                {/* Centered content group — vertically balanced so the column has no
                    awkward void; the trust footer stays pinned below it. */}
                <div className="flex flex-1 flex-col justify-center">
                {/* Eyebrow */}
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6356E5]">
                  {draw.requiresMembership ? 'Member-only Bonus Draw' : 'Bonus Draw'}
                </p>

                {/* Title */}
                <h1 className="mt-1 text-[24px] font-extrabold leading-[1.15] tracking-tight text-[#0F1222] sm:text-[28px] md:text-[32px]">
                  {draw.title}
                </h1>

                {/* Member progress */}
                {!isUnlimited ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="text-[#4B5563]">
                        <span className="font-extrabold text-[#0F1222] tabular-nums">{entrants.toLocaleString()}</span>
                        <span className="text-[#667085]">{' '}/ {cap.toLocaleString()} entries</span>
                      </span>
                      <span className="rounded-full bg-[#F4F1FB] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF]">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[#eceaf7] ring-1 ring-inset ring-[#E0DAFF]/60">
                      <div
                        className="relative h-full rounded-full bg-gradient-to-r from-[#6356e5] to-[#8a7bff] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[width] duration-[900ms]"
                        style={{ width: `${pct}%` }}
                      >
                        <span aria-hidden className="uc-bdd-shimmer absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-[13px] italic text-[#667085]">
                    Unlimited · {entrants.toLocaleString()} entries so far
                  </p>
                )}

                {/* CTA row — Points chip + state-driven button on one row (all sizes).
                    Mobile shortens "Points"→"Pts" so both fit beside each other. */}
                <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-stretch gap-2 sm:gap-2.5">
                  <span className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#F4F1FB] px-3 text-[14px] font-extrabold tracking-tight tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF] sm:px-4">
                    <Icon.Coins className="h-4 w-4 shrink-0" />
                    {entryState.kind === 'insufficient-points' ? 'Need ' : ''}
                    {(draw.costPerEntry || 0).toLocaleString()}
                    <span className="sm:hidden">&nbsp;Pts</span>
                    <span className="hidden sm:inline">&nbsp;Points</span>
                  </span>
                  {renderPrimaryButton()}
                </div>

                {/* Helper text */}
                <p className="mt-3 text-center text-[12px] leading-relaxed text-[#667085] sm:text-left">
                  {entryState.helper}
                </p>

                {/* Sprint 2 — Loyalty Entries panel for Major Draws only */}
                {draw.drawType === 'major' && (
                  <DrawLoyaltyPanel
                    drawId={id as string}
                    isLoggedIn={!!user}
                    hasActiveMembership={hasActiveMembership}
                  />
                )}
                </div>

                {/* Trust footer — chips only (View Entry List moved to the live card below) */}
                <div className="mt-4 border-t border-[#EFEDF5] pt-4">
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-[#4B5563]">
                    <span className="inline-flex items-center gap-1">
                      <Icon.ShieldCheck className="h-3 w-3 text-[#10B981]" />
                      <span className="font-semibold">Capped</span>
                    </span>
                    <span aria-hidden className="text-[#cfc8e8]">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon.Trophy className="h-3 w-3 text-[#C49A2C]" />
                      <span className="font-semibold">Winners published</span>
                    </span>
                    <span aria-hidden className="text-[#cfc8e8]">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon.Coins className="h-3 w-3 text-[#6356E5]" />
                      <span className="font-semibold">Points-based</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* For sold-out / closed draws — passive retention link only.
              Helper message is already inside the entry panel's state-driven helper text. */}
          {(isSoldOut || isClosed) && !hasEntered && (
            <div className="mx-auto mt-5 max-w-md text-center">
              <Link
                href="/giveaways"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#E0DAFF] bg-white px-5 text-[12.5px] font-bold text-[#6356E5] transition-colors hover:border-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
              >
                Browse open Bonus Draws
                <Icon.ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          SHORT DETAILS — at-a-glance facts (4-5 mini cards) +
          optional collapsed rich content (overview/prize/rules).
      ============================================================ */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          {/* Section CTA — links to the live video when set, else the UNICASH
              Facebook page (always valid before the stream starts). */}
          <div className="mb-8 text-center sm:mb-10">
            <a
              href={draw.livestreamUrl || 'https://www.facebook.com/Unicash.au/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border border-[#E7E9F2] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0F1222] shadow-sm transition hover:bg-[#F6F4FF]"
            >
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444]/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EF4444]" />
              </span>
              Watch the winner selection live on Facebook
              <Icon.ArrowRight className="h-3.5 w-3.5 text-[#6356E5]" />
            </a>
          </div>

          {/* Stat grid — live Entry List card first, then info cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
            <LiveEntryListCard drawId={id as string} href={`/draws/${id}/entries`} />
            {detailFacts.map((fact) => {
              const FactIcon = fact.Icon;
              return (
                <div
                  key={fact.label}
                  className="group relative overflow-hidden rounded-2xl border border-[#E7E9F2] bg-white p-4 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-all hover:-translate-y-0.5 hover:border-[#C9C0F2] hover:shadow-[0_8px_24px_-12px_rgba(99,86,229,0.20)] sm:p-5"
                >
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${fact.iconBg}`}>
                    <FactIcon className={`h-4 w-4 ${fact.iconColor}`} />
                  </span>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#667085]">{fact.label}</p>
                  <p className="mt-1 text-[14px] font-extrabold leading-tight tracking-tight text-[#0F1222] sm:text-[14.5px]">
                    {fact.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Optional rich content — single collapsed details element with balanced layout */}
          {hasRichContent && (
            <details className="group mx-auto mt-6 max-w-2xl rounded-2xl border border-[#E7E9F2] bg-white transition-shadow open:shadow-[0_8px_24px_-12px_rgba(15,18,34,0.12)] open:ring-1 open:ring-[#E0DAFF]">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-left sm:px-6 sm:py-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                  <Icon.Eye className="h-4 w-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-extrabold tracking-tight text-[#0F1222] sm:text-[14.5px]">
                    Read more about this Bonus Draw
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-[#667085]">
                    Overview · Prize details · Rules &amp; Terms
                  </span>
                </span>
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF] transition-transform group-open:rotate-180">
                  <Icon.ChevronDown className="h-3.5 w-3.5" />
                </span>
              </summary>
              <div className="space-y-4 border-t border-[#EFEDF5] px-5 py-4 text-[13.5px] leading-relaxed text-[#4B5563] sm:px-6 sm:py-5">
                {(draw.overview || draw.description) && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">Overview</p>
                    <div
                      className="rich-text-content prose prose-sm mt-2 max-w-none"
                      dangerouslySetInnerHTML={{ __html: draw.overview || draw.description }}
                    />
                  </div>
                )}
                {(draw.prizeDetails || draw.prizeDescription) && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">Prize details</p>
                    <div
                      className="rich-text-content prose prose-sm mt-2 max-w-none"
                      dangerouslySetInnerHTML={{ __html: draw.prizeDetails || draw.prizeDescription }}
                    />
                  </div>
                )}
                {rulesTerms && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">Rules &amp; Terms</p>
                    <div
                      className="rich-text-content prose prose-sm mt-2 max-w-none"
                      dangerouslySetInnerHTML={{ __html: rulesTerms }}
                    />
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </section>

      {/* ============================================================
          MORE BONUS DRAWS — related (replaces How It Works)
      ============================================================ */}
      {relatedDraws.length > 0 && (
        <section className="relative w-full overflow-hidden bg-[#FBFAFF]">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[280px] w-[680px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/8 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="mb-8 text-center sm:mb-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] shadow-sm ring-1 ring-[#E0DAFF]">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356E5]" />
                Keep exploring
              </span>
              <h2 className="mt-4 text-[24px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[30px] md:text-[34px]">
                More <span className="uc-gold-gradient">Bonus Draws.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {relatedDraws.map((relatedDraw: any) => (
                <DrawCard
                  key={relatedDraw.id}
                  id={relatedDraw.id}
                  title={relatedDraw.title}
                  image={typeof relatedDraw.prizeImage === 'string' ? relatedDraw.prizeImage : relatedDraw.prizeImage?.url}
                  images={relatedDraw.images}
                  creditsPerEntry={relatedDraw.costPerEntry}
                  entrants={relatedDraw.entrants || 0}
                  cap={relatedDraw.cap ?? 100}
                  closedAt={relatedDraw.closedAt}
                  state={relatedDraw.state}
                  requiresMembership={relatedDraw.requiresMembership}
                  entryLimitMode={relatedDraw.entryLimitMode}
                  maxEntriesPerMember={relatedDraw.maxEntriesPerMember}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          TRUST + FAQ (full)
      ============================================================ */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          {/* FAQ section header */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F1FB] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] ring-1 ring-[#E0DAFF]">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356E5]" />
              FAQ
            </span>
            <h2 className="mt-4 text-[24px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[30px] md:text-[36px]">
              Common <span className="uc-gold-gradient">questions.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-[#4B5563] sm:text-[15px]">
              Quick answers about Bonus Draws, Points, and Membership.
            </p>
          </div>

          {/* FAQ list — uses backend faqs if available, else fallback */}
          <div className="mx-auto mt-8 space-y-3 sm:mt-10">
            {faqs.length > 0
              ? faqs.map((faq, idx) => (
                  <details
                    key={faq.id || idx}
                    open={idx === 0}
                    className="group rounded-2xl border border-[#E7E9F2] bg-white px-5 py-4 transition-shadow open:shadow-[0_8px_24px_-12px_rgba(15,18,34,0.12)] open:ring-1 open:ring-[#E0DAFF] sm:px-6 sm:py-5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                      <span className="text-[14.5px] font-extrabold tracking-tight text-[#0F1222] sm:text-[15.5px]">
                        {faq.question}
                      </span>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF] transition-transform group-open:rotate-180">
                        <Icon.ChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </summary>
                    <div
                      className="rich-text-content prose prose-sm mt-3 max-w-none text-[13.5px] leading-relaxed text-[#4B5563]"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </details>
                ))
              : FAQ_FALLBACK.map((faq, idx) => (
                  <details
                    key={idx}
                    open={idx === 0}
                    className="group rounded-2xl border border-[#E7E9F2] bg-white px-5 py-4 transition-shadow open:shadow-[0_8px_24px_-12px_rgba(15,18,34,0.12)] open:ring-1 open:ring-[#E0DAFF] sm:px-6 sm:py-5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                      <span className="text-[14.5px] font-extrabold tracking-tight text-[#0F1222] sm:text-[15.5px]">
                        {faq.q}
                      </span>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF] transition-transform group-open:rotate-180">
                        <Icon.ChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </summary>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-[#4B5563]">{faq.a}</p>
                  </details>
                ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          MOBILE STICKY CTA — only when actionable
      ============================================================ */}
      {!reachedEntryLimit && !isClosed && !isSoldOut && (
        <>
          <div
            /* Glass blur without iOS drift: fixed wrapper has NO backdrop-filter;
               the frosted layer is a separate -z-10 child so it stays pinned. */
            className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E7E9F2] px-4 py-3 shadow-[0_-12px_30px_-12px_rgba(15,18,34,0.18)] lg:hidden"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
          >
            <div aria-hidden className="absolute inset-0 -z-10 bg-white/80 backdrop-blur-xl" />
            <div className="mx-auto flex max-w-md items-center gap-2.5">
              <span className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#F4F1FB] px-3.5 text-[13px] font-extrabold tracking-tight tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF]">
                <Icon.Coins className="h-3.5 w-3.5 shrink-0" />
                {entryState.kind === 'insufficient-points' ? 'Need ' : ''}
                {(draw.costPerEntry || 0).toLocaleString()} Pts
              </span>
              <div className="min-w-0 flex-1">{renderPrimaryButton()}</div>
            </div>
          </div>
          <div className="h-24 lg:hidden" aria-hidden />
        </>
      )}

      {/* ============================================================
          ConfirmEntryModal — preserved exactly
      ============================================================ */}
      {draw && (
        <ConfirmEntryModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          draw={{
            id: draw.id,
            title: draw.title,
            costPerEntry: draw.costPerEntry,
            state: draw.state,
            entrants: draw.entrants || 0,
            cap: draw.cap ?? 0, // Keep -1 for unlimited, default to 0 if null
            requiresMembership: draw.requiresMembership,
            entryLimitMode: draw.entryLimitMode,
            maxEntriesPerMember: draw.maxEntriesPerMember ?? null,
          }}
          alreadyEntered={myEntryCount}
          onSuccess={() => {
            loadDraw();
            checkUserEntry();
          }}
        />
      )}

      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes uc-bdd-shimmer-anim {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        .uc-bdd-shimmer { animation: uc-bdd-shimmer-anim 2.4s ease-in-out infinite; will-change: transform; }
        /* Live entry ticker — seamless vertical scroll (list is duplicated, move up 50%). */
        @keyframes uc-ticker-scroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .uc-ticker { animation: uc-ticker-scroll var(--uc-ticker-dur, 8s) linear infinite; will-change: transform; }
        .uc-ticker-mask { -webkit-mask-image: linear-gradient(to bottom, transparent, #000 25%, #000 75%, transparent); mask-image: linear-gradient(to bottom, transparent, #000 25%, #000 75%, transparent); }
        @media (prefers-reduced-motion: reduce) {
          .uc-bdd-shimmer, .uc-ticker { animation: none !important; }
        }
      ` }} />
    </div>
  );
}
