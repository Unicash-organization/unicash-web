'use client';

/* ==========================================================================
   UNICASH /winners — v4 redesign
   --------------------------------------------------------------------------
   - Visual + section structure mirrors `previews/homepage-v4.html` & app/page.tsx
   - All data fetching, API calls, pagination handlers PRESERVED
   - Pure UI/UX redesign — no backend / business logic touched
   - Only renders fields actually returned by api.winners.getPaginated
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';

/* -------------------------------------------------------------------------- */
/*  Types — mirror existing API response shape                                */
/* -------------------------------------------------------------------------- */

/** Subset of Draw fields actually returned by `winner.draw` (joined relation). */
interface RelatedDraw {
  id?: string;
  title?: string;
  image?: string | null;
  images?: Array<{ url?: string; order?: number; isPrimary?: boolean }> | null;
  prizeImage?: { url?: string } | null;
  cap?: number;
  entrants?: number;
  costPerEntry?: number;
  closedAt?: string | null;
  state?: string;
}

interface Winner {
  id: string;
  winnerName: string;
  profileImageUrl: string | null;
  prizeAmount: string;
  prizeType: string;
  drawReference: string;
  wonDate: string;
  verificationCertificate: string | null;
  proofLink: string | null;
  isFeatured: boolean;
  /** Joined via `leftJoinAndSelect` in WinnersService — may be null for legacy winners. */
  draw?: RelatedDraw | null;
}

interface PaginationResult {
  data: Winner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* -------------------------------------------------------------------------- */
/*  Inline icons                                                              */
/* -------------------------------------------------------------------------- */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  CheckCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  Calendar: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Hash: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  ),
  Gift: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M12 7v15M22 11H2M16 7l-4-4-4 4M8 22h8" />
    </svg>
  ),
  Fuel: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="3" x2="15" y1="22" y2="22" />
      <line x1="4" x2="14" y1="9" y2="9" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </svg>
  ),
  Smartphone: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="14" height="20" x="5" y="2" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
  ChevronDown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Sparkles: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z" />
      <path d="M19 14v4M21 16h-4M5 18v3M6.5 19.5h-3" />
    </svg>
  ),
  AlertCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

/* Pick a contextual icon + gradient based on prizeType — calm, not casino */
function getPrizeTheme(prizeType: string): {
  Icon: (p: { className?: string }) => React.JSX.Element;
  gradient: string;
} {
  const t = (prizeType || '').toLowerCase();
  if (t.includes('fuel') || t.includes('petrol')) {
    return {
      Icon: Icon.Fuel,
      gradient: 'linear-gradient(135deg, #6356E5 0%, #8B7BFF 60%, #A192FF 100%)',
    };
  }
  if (t.includes('iphone') || t.includes('phone') || t.includes('tech') || t.includes('air')) {
    return {
      Icon: Icon.Smartphone,
      gradient: 'linear-gradient(135deg, #4538B8 0%, #6356E5 55%, #8B7BFF 100%)',
    };
  }
  if (t.includes('gift') || t.includes('card') || t.includes('voucher')) {
    return {
      Icon: Icon.Gift,
      gradient: 'linear-gradient(135deg, #6356E5 0%, #8B7BFF 60%, #FFE2B0 130%)',
    };
  }
  return {
    Icon: Icon.Trophy,
    gradient: 'linear-gradient(135deg, #5346D6 0%, #6356E5 50%, #8B7BFF 100%)',
  };
}

const drawNameOf = (w: Winner) => {
  const t = (w.prizeType || '').trim();
  const a = (w.prizeAmount || '').trim();
  if (a && t) return `${a} ${t}`;
  return t || a || 'Bonus Draw';
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6356e5]">{children}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function WinnersPage() {
  /* ───── PRESERVED state + handlers ───── */
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const limit = 9; // 3-grid friendly

  useEffect(() => {
    loadWinners(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWinners = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setErrorMsg(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.winners.getPaginated(pageNum, limit);
      const result: PaginationResult = response.data;

      if (reset) {
        setWinners(result.data || []);
      } else {
        setWinners((prev) => [...prev, ...(result.data || [])]);
      }

      setTotal(result.total || 0);
      setHasMore(pageNum < (result.totalPages || 0));
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching winners:', error);
      setErrorMsg('We couldn’t load Winners right now.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadWinners(page + 1);
    }
  };

  const handleRetry = () => loadWinners(1, true);

  return (
    <main className="bg-white">
      {/* ====================================================================
          HERO — painted lavender mesh + trust intro + stats
      ==================================================================== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(720px 480px at 14% 16%, rgba(139,123,255,.16), transparent 62%)',
              'radial-gradient(620px 420px at 88% 12%, rgba(201,192,242,.22), transparent 60%)',
              'radial-gradient(560px 380px at 50% 100%, rgba(99,86,229,.10), transparent 62%)',
              'radial-gradient(420px 320px at 92% 78%, rgba(255,226,176,.12), transparent 60%)',
              'linear-gradient(180deg, #FBFAFF 0%, #FBFAFF 100%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 sm:h-48"
          style={{
            background: [
              'radial-gradient(1100px 220px at 50% -30%, rgba(99,86,229,.18), transparent 72%)',
              'radial-gradient(700px 180px at 20% -22%, rgba(139,123,255,.14), transparent 70%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-5 pt-16 pb-10 text-center sm:px-6 sm:pt-24 sm:pb-12 lg:px-8">
          <Eyebrow>Winners</Eyebrow>
          <h1 className="mt-3 text-[32px] font-extrabold leading-[1.08] tracking-tight text-[#0f1222] sm:text-[44px] md:text-[52px]">
            Published Winners. <span className="uc-gold-gradient">Clear outcomes.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
            Every completed Bonus Draw is published with clear details so Members can see the outcome, reward, and
            draw information.
          </p>

          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] font-semibold text-[#4b5563] sm:text-[13px]">
            {['Published Winners', 'Draw details', 'Clear limits', 'Transparent outcomes'].map((c, i) => (
              <li key={c} className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#6356E5]/70" aria-hidden />
                <span>{c}</span>
                {i < 3 ? <span className="text-[#cfc8e8]" aria-hidden>·</span> : null}
              </li>
            ))}
          </ul>

          {/* Hero CTAs */}
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/#draws"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6356E5] px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(99,86,229,.45)] transition hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              View Bonus Draws
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq#cat-bonus-draws"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[14px] font-semibold text-[#0f1222] transition hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              How Bonus Draws Work
            </Link>
          </div>

          {/* Live counter (only when we actually have data) */}
          {total > 0 && (
            <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-[#E0DAFF] bg-white/80 px-4 py-1.5 text-[12.5px] font-semibold text-[#0f1222] shadow-[0_8px_24px_-12px_rgba(99,86,229,.25)] backdrop-blur-sm">
              <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#6356E5]" />
              <span className="text-[#6356E5]">{total}</span>
              <span className="text-[#4b5563]">{total === 1 ? 'Winner published' : 'Winners published'}</span>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          WINNERS GRID
      ==================================================================== */}
      <section className="relative bg-[#FBFAFF]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6356e5]/15 to-transparent"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          {/* Loading skeleton */}
          {loading && winners.length === 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : errorMsg && winners.length === 0 ? (
            <ErrorState onRetry={handleRetry} />
          ) : winners.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {winners.map((w) => (
                  <WinnerCard key={w.id} winner={w} />
                ))}
              </div>

              {/* Pagination footer */}
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="text-[12.5px] text-[#7a8195]">
                  Showing <span className="font-semibold text-[#0f1222]">{winners.length}</span> of{' '}
                  <span className="font-semibold text-[#0f1222]">{total}</span> published Winners
                </p>
                {hasMore && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[14px] font-semibold text-[#0f1222] transition hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#6356E5]/30 border-t-[#6356E5]" />
                        Loading…
                      </>
                    ) : (
                      <>
                        Load more Winners
                        <Icon.ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ====================================================================
          TRANSPARENCY BLOCK
      ==================================================================== */}
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              'radial-gradient(700px 360px at 18% 100%, rgba(139,123,255,.10), transparent 60%)',
              'radial-gradient(640px 320px at 88% 0%, rgba(99,86,229,.08), transparent 65%)',
            ].join(', '),
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <Eyebrow>Transparency</Eyebrow>
            <h2 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
              How UNICASH publishes <span className="uc-gold-gradient">outcomes.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15px]">
              Completed Bonus Draws are recorded and Winners are published with key draw details so Members can see
              outcomes clearly.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {[
              {
                icon: Icon.Trophy,
                title: 'Winner displayed clearly',
                body: 'Every published Winner is shown with their display name on the Bonus Draw card.',
              },
              {
                icon: Icon.Hash,
                title: 'Draw details published',
                body: 'Each Bonus Draw shows its Draw ID and published date when the outcome is recorded.',
              },
              {
                icon: Icon.ShieldCheck,
                title: 'Member limits shown',
                body: 'Active Bonus Draws display the member limit and entry rules before you join.',
              },
              {
                icon: Icon.CheckCircle,
                title: 'Outcomes recorded',
                body: 'After a Bonus Draw closes, the outcome is recorded and published for transparency.',
              },
            ].map((row) => {
              const Ic = row.icon;
              return (
                <div
                  key={row.title}
                  className="rounded-2xl border border-[#e7e9f2] bg-[#FBFAFF] p-5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                    <Ic className="h-[18px] w-[18px]" />
                  </span>
                  <p className="mt-4 text-[14px] font-semibold tracking-tight text-[#0f1222]">{row.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#4b5563]">{row.body}</p>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-[12px] text-[#7a8195]">
            Some Bonus Draws may include a Draw ID or verification reference where available.
          </p>
        </div>
      </section>

      {/* ====================================================================
          FAQ
      ==================================================================== */}
      <FaqSection />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Winner Card                                                               */
/* -------------------------------------------------------------------------- */

/* Pull the best image URL out of the joined Draw — mirrors DrawCard's helper */
function getDrawImageUrl(draw: RelatedDraw | null | undefined): string | null {
  if (!draw) return null;
  if (Array.isArray(draw.images) && draw.images.length > 0) {
    const sorted = [...draw.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const url = sorted[0]?.url;
    if (url) return url.startsWith('http') ? url : getImageUrl(url);
  }
  if (draw.image) return draw.image.startsWith('http') ? draw.image : getImageUrl(draw.image);
  if (draw.prizeImage?.url) {
    return draw.prizeImage.url.startsWith('http') ? draw.prizeImage.url : getImageUrl(draw.prizeImage.url);
  }
  return null;
}

/* "Closed 12 May · 11:06 am AEST" — mirrors DrawCard's closingLabel format */
function formatClosedAt(closedAt: string | null | undefined): string | null {
  if (!closedAt) return null;
  const d = new Date(closedAt);
  if (Number.isNaN(d.getTime())) return null;
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
  return `Closed ${datePart} · ${timePart}`;
}

function WinnerCard({ winner }: { winner: Winner }) {
  const theme = getPrizeTheme(winner.prizeType);
  const PrizeIcon = theme.Icon;
  const initial = winner.winnerName?.[0]?.toUpperCase() ?? '?';
  const profileSrc = winner.profileImageUrl ? getImageUrl(winner.profileImageUrl) : null;

  /* Pull from joined Bonus Draw when present — fallback to winner-level fields */
  const draw = winner.draw ?? null;
  const drawImageUrl = getDrawImageUrl(draw);
  const title = (draw?.title || drawNameOf(winner)).trim();

  const cap = typeof draw?.cap === 'number' ? draw.cap : null;
  const entrants = typeof draw?.entrants === 'number' ? draw.entrants : null;
  const hasProgress = cap !== null && cap > 0 && entrants !== null;
  const pct = hasProgress ? Math.min(100, Math.round((entrants! / cap!) * 100)) : 0;

  const closedLabel = formatClosedAt(draw?.closedAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C9C0F2] hover:shadow-[0_30px_60px_-30px_rgba(99,86,229,.30),0_8px_24px_-12px_rgba(15,18,34,.10)]">
      {/* ─── Image area — real Bonus Draw image when available ─── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1B1B22] via-[#2A2A38] to-[#4B4DBD]">
        {drawImageUrl ? (
          <Image
            src={drawImageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <>
            {/* Fallback dark texture + centered prize icon */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            <PrizeIcon className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-white/90" />
          </>
        )}

        {/* Subtle overlays for legibility of badges */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/15 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

        {/* Featured pill — top-left (gold) when featured */}
        {winner.isFeatured && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#FFF6DA] px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8a6a05] ring-1 ring-[#FFE2B0]">
            <Icon.Sparkles className="h-3 w-3" />
            Featured
          </span>
        )}

        {/* Published-date chip — bottom-right */}
        <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#0f1222] backdrop-blur">
          <Icon.Calendar className="h-3 w-3 text-[#6356E5]" />
          Published {formatDate(winner.wonDate)}
        </span>
      </div>

      {/* ─── Body ─── */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Bonus Draw title — clamp at 2 lines so long titles never break the card */}
        <h3
          className="text-[17px] font-extrabold leading-[1.25] tracking-tight text-[#0F1222] sm:text-[18px]"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={title}
        >
          {title}
        </h3>

        {/* Member progress — only when joined draw has cap data */}
        {hasProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#4B5563]">
                <span className="font-semibold tabular-nums text-[#0f1222]">
                  {entrants!.toLocaleString()}
                </span>
                <span className="text-[#667085]"> / {cap!.toLocaleString()} members joined</span>
              </span>
              <span className="rounded-full bg-[#F4F1FB] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#6356E5] ring-1 ring-[#E0DAFF]">
                {pct}%
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#eceaf7] ring-1 ring-inset ring-[#E0DAFF]/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6356e5] to-[#8a7bff] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Closing-date pill */}
        {closedLabel && (
          <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#FBFAFF] px-2.5 py-1.5 text-[12px] font-medium text-[#4B5563] ring-1 ring-[#EFEDF5]">
            <Icon.Calendar className="h-3.5 w-3.5 text-[#6356E5]" />
            {closedLabel}
          </p>
        )}

        {/* Winner panel — premium gold celebration block (calm but standout) */}
        <div
          className="relative mt-5 overflow-hidden rounded-2xl p-4 shadow-[0_10px_28px_-14px_rgba(196,154,44,.45)]"
          style={{
            background:
              'linear-gradient(135deg, #FFF1C9 0%, #FFF8E0 55%, #FFFAEB 100%)',
            border: '1.5px solid #FFC85D',
          }}
        >
          {/* Decorative gold bloom — top-right, soft glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#FFC85D]/25 blur-2xl"
          />
          {/* Decorative micro-sparkles — corner accent */}
          <Icon.Sparkles
            className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-[#C49A2C]/50"
            aria-hidden
          />

          <div className="relative flex items-center gap-3.5">
            {/* Avatar — double ring (white inner + gold outer halo) */}
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #FFC85D 0%, #FFE2B0 100%)',
                  filter: 'blur(6px)',
                  opacity: 0.5,
                }}
              />
              {profileSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileSrc}
                  alt=""
                  className="relative h-12 w-12 rounded-full object-cover ring-[3px] ring-white"
                  style={{ boxShadow: '0 0 0 2px #FFC85D' }}
                />
              ) : (
                <div
                  className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-[16px] font-extrabold text-white ring-[3px] ring-white"
                  style={{ boxShadow: '0 0 0 2px #FFC85D' }}
                >
                  {initial}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Icon.Trophy className="h-3.5 w-3.5 text-[#C49A2C]" aria-hidden />
                <span
                  className="text-[10.5px] font-extrabold uppercase tracking-[0.14em]"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, #8a6a05 0%, #C49A2C 50%, #8a6a05 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Winner
                </span>
              </div>
              <p className="mt-0.5 truncate text-[17px] font-extrabold leading-tight tracking-tight text-[#3A2A06]">
                {winner.winnerName}
              </p>
            </div>

            {/* Verified pill — gold trophy badge instead of plain check */}
            <span
              className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-[0_4px_10px_-3px_rgba(196,154,44,.55)]"
              style={{
                background: 'linear-gradient(135deg, #FFE2B0 0%, #FFC85D 100%)',
              }}
              aria-label="Verified Winner"
            >
              <Icon.CheckCircle className="h-[18px] w-[18px] text-[#3A2A06]" />
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Trust line — kept (no CTA, no proof link per request) */}
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#FBFAFF] px-3 py-2 text-[11.5px] text-[#4b5563] ring-1 ring-[#EFEDF5]">
          <Icon.ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#6356E5]" aria-hidden />
          <span>Outcome published for transparency.</span>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton card (loading state)                                             */
/* -------------------------------------------------------------------------- */

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1B1B22] via-[#2A2A38] to-[#4B4DBD]">
        <div className="absolute inset-0 animate-pulse bg-black/10" />
      </div>
      <div className="space-y-3 p-5 sm:p-6">
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#F4F1FB]" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-[#F4F1FB]" />
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#FFE2B0]/50 bg-[#FFF6DA]/40 p-3.5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#F4F1FB]" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#F4F1FB]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#F4F1FB]" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full animate-pulse rounded bg-[#F4F1FB]" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-[#F4F1FB]" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-[#F4F1FB]" />
        </div>
        <div className="mt-3 h-8 animate-pulse rounded-xl bg-[#F4F1FB]" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#e7e9f2] bg-white p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
        <Icon.Trophy className="h-6 w-6" />
      </div>
      <h3 className="text-[20px] font-extrabold tracking-tight text-[#0f1222]">
        No Winners published yet.
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#4b5563]">
        Completed Bonus Draw outcomes will appear here after they’re recorded and published. Check back soon for the
        first published Winners.
      </p>
      <Link
        href="/#draws"
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6356E5] px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(99,86,229,.45)] transition hover:bg-[#5346D6]"
      >
        View Bonus Draws
        <Icon.ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Error state                                                               */
/* -------------------------------------------------------------------------- */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-[#FBC0C0] bg-[#FEF2F2] p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#EF4444] ring-1 ring-[#FBC0C0]">
        <Icon.AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-[20px] font-extrabold tracking-tight text-[#7F1D1D]">
        We couldn’t load Winners right now.
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#a83333]">
        Please refresh the page or try again shortly.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#EF4444] px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(239,68,68,.4)] transition hover:bg-[#dc2626]"
      >
        Refresh
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ section                                                               */
/* -------------------------------------------------------------------------- */

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Why does UNICASH publish Winners?',
    a: 'Published Winners help Members see completed Bonus Draw outcomes clearly and transparently.',
  },
  {
    q: 'What information is shown?',
    a: 'The Winner display name, Bonus Draw name, reward, published date, and available draw details.',
  },
  {
    q: 'Why are names shortened?',
    a: 'Winner names may be shown in a privacy-safe format such as first name and last initial.',
  },
  {
    q: 'Where can I see active Bonus Draws?',
    a: 'Visit the Bonus Draws page to view current member-only Bonus Draws.',
  },
];

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <section className="relative bg-[#FBFAFF]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6356e5]/15 to-transparent"
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 sm:px-6 sm:py-20 md:grid-cols-12 md:gap-12 lg:px-8">
        <div className="md:col-span-5">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px] md:text-[36px]">
            About <span className="uc-gold-gradient">Winners.</span>
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#4b5563] sm:text-[14.5px]">
            Short, clear answers about how Winners are shown on UNICASH.
          </p>
          <Link
            href="/faq"
            className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#6356E5] hover:text-[#5346D6]"
          >
            Browse all FAQs
            <Icon.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="md:col-span-7">
          <div className="space-y-3">
            {FAQ_ITEMS.map((f, i) => {
              const open = openIdx === i;
              const panelId = `winners-faq-panel-${i}`;
              const triggerId = `winners-faq-trigger-${i}`;
              return (
                <div
                  key={f.q}
                  className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                    open ? 'border-[#d1cbf5] shadow-[0_10px_30px_-18px_rgba(99,86,229,.35)]' : 'border-[#e7e9f2] hover:border-[#d1cbf5]'
                  }`}
                >
                  <h3>
                    <button
                      id={triggerId}
                      type="button"
                      onClick={() => setOpenIdx(open ? -1 : i)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6356e5]"
                    >
                      <span className="text-[14.5px] font-semibold tracking-tight text-[#0f1222] sm:text-[15px]">
                        {f.q}
                      </span>
                      <span
                        aria-hidden
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356e5] transition-transform duration-300 ${
                          open ? 'rotate-180' : ''
                        }`}
                      >
                        <Icon.ChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </h3>
                  <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
                    {open && (
                      <div className="px-5 pb-5 text-[13.5px] leading-relaxed text-[#4b5563] sm:text-[14px]">
                        {f.a}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
