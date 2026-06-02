'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import LoadingRing from '@/components/LoadingRing';

/* -----------------------------------------------------------------------
   /dashboard/entries — redesigned 2026-05-18

   Layout: Major Draws section (top) + Bonus Draws section (bottom),
   each rendered as a responsive 3-col card grid (1col mobile / 2col md /
   3col lg). Matches the public /winners page card pattern but adapted
   for the member's perspective — replaces "Winner: Logan T." with the
   member's own entry count (large, bold) so they immediately see their
   stake in each draw.

   Major Draw hero images don't yet have a dedicated upload (admin only
   has landing-page packages). We use a gradient placeholder + crown
   glyph as interim — backlog task to add Draw.heroImageUrl + admin
   upload UI.
----------------------------------------------------------------------- */

type GroupedRow = {
  key: string;
  drawId: string;
  drawType: string;
  source: string;
  subsource: string | null;
  creditsSpent: number;
  latestCreatedAt: string;
  count: number;
  orderNoSample: string | null;
};

type DrawMeta = {
  id: string;
  title: string;
  drawType: 'mini' | 'major' | string;
  state: 'open' | 'soldOut' | 'closed' | 'pending' | 'draft' | string;
  openAt?: string | null;
  closedAt?: string | null;
  entrants?: number;
  capacity?: number | null;
  cap?: number | null;
  // Bonus Draw image sources — gallery + single fallback
  images?: Array<{ id?: string; url?: string; order?: number; isPrimary?: boolean }> | null;
  prizeImage?: string | { url?: string } | null;
  // Major Draw image sources — landing page banner doubles as card hero
  landingBannerImage?: string | null;
  landingBannerMobileImage?: string | null;
  // Optional dedicated fields (future)
  heroImageUrl?: string | null;
  imageUrl?: string | null;
  // Major Draw live URL slug
  landingSlug?: string | null;
  prizeTitle?: string | null;
  winnerUserId?: string | null;
  isActive?: boolean;
};

/** Resolve the best image URL for a card. Returns null if nothing usable. */
function resolveDrawImage(draw: DrawMeta, kind: 'major' | 'mini'): string | null {
  if (kind === 'major') {
    // Major Draw — reuse the landing banner the admin already uploaded.
    if (draw.landingBannerImage) return draw.landingBannerImage;
    if (draw.heroImageUrl) return draw.heroImageUrl;
    if (draw.imageUrl) return draw.imageUrl;
    return null;
  }
  // Bonus Draw — sorted gallery, prefer isPrimary, fallback to prizeImage.
  if (Array.isArray(draw.images) && draw.images.length > 0) {
    const sorted = [...draw.images].sort((a, b) => {
      if (!!b.isPrimary !== !!a.isPrimary) return b.isPrimary ? 1 : -1;
      return (a.order || 0) - (b.order || 0);
    });
    const first = sorted[0];
    if (first?.url) return first.url;
  }
  if (draw.prizeImage) {
    return typeof draw.prizeImage === 'string'
      ? draw.prizeImage
      : draw.prizeImage.url || null;
  }
  if (draw.heroImageUrl) return draw.heroImageUrl;
  if (draw.imageUrl) return draw.imageUrl;
  return null;
}

/** Resolve the click-through URL for a card. */
function resolveDrawHref(draw: DrawMeta, kind: 'major' | 'mini'): string {
  if (kind === 'major') {
    return draw.landingSlug ? `/win/${draw.landingSlug}` : `/win/${draw.id}`;
  }
  return `/giveaways/${draw.id}`;
}

/** Composite row used for rendering — entries joined to draw metadata. */
type DrawCardData = {
  draw: DrawMeta;
  userEntries: number;
  /**
   * Major Draw split (per 2026-05-18 design): "accumulating" = the
   * auto-grants you keep getting just for being a member (the monthly
   * plan quota + loyalty tenure/anniversary/streak/snapshot grants).
   * "Purchased" = one-time top-ups bought via Stripe landing packages.
   * For Bonus Draws both numbers are folded into `userEntries` and not
   * rendered — every Bonus entry is Points-purchased so the breakdown
   * doesn't carry signal.
   */
  accumulatingEntries: number;
  purchasedEntries: number;
  hasLoyalty: boolean;
  hasMembership: boolean;
  latestEntryDate: string;
  orderNoSample: string | null;
};

/* ─── Icons ───────────────────────────────────────────────────────────── */
const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Search: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  Clock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Sparkle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.7 5.5L19 9l-5.3 1.5L12 16l-1.7-5.5L5 9l5.3-1.5L12 2z" />
    </svg>
  ),
  Ticket: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z" />
      <path d="M9 7v10" strokeDasharray="2 2" />
    </svg>
  ),
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */

/**
 * Countdown string: returns a compact "Closes in 3d 14h" / "Closes in 2h 15m"
 * style label. Null when there's no countdown to render (closed, no closedAt).
 */
function formatCountdown(closedAt: string | null | undefined, nowMs: number): string | null {
  if (!closedAt) return null;
  const ms = new Date(closedAt).getTime() - nowMs;
  if (ms <= 0) return null;
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (days >= 1) return `Closes in ${days}d ${hours}h`;
  if (hours >= 1) return `Closes in ${hours}h ${minutes}m`;
  return `Closes in ${minutes}m`;
}

/** "Closed 2 May" / "Closed 2 May · 12:52 pm". Uses Sydney timezone. */
function formatClosedAt(closedAt: string | null | undefined): string {
  if (!closedAt) return '';
  try {
    const d = new Date(closedAt);
    return d.toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
    });
  } catch {
    return '';
  }
}

function formatOpensAt(openAt: string | null | undefined): string {
  if (!openAt) return '';
  try {
    const d = new Date(openAt);
    return d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Australia/Sydney',
    });
  } catch {
    return '';
  }
}

/**
 * Status pill content + tone resolver. Drives both Major and Bonus cards.
 * Tones: 'open' (purple), 'closing' (amber), 'won' (gold), 'closed' (neutral),
 * 'upcoming' (lavender outline).
 */
type StatusTone = 'open' | 'closing' | 'won' | 'closed' | 'upcoming';
function resolveStatus(
  draw: DrawMeta,
  isWinner: boolean,
  nowMs: number,
): { label: string; tone: StatusTone } {
  if (isWinner) return { label: '🎉 You won', tone: 'won' };
  if (draw.state === 'closed') return { label: `Closed ${formatClosedAt(draw.closedAt)}`, tone: 'closed' };
  if (draw.state === 'soldOut') return { label: 'Sold out · Drawing soon', tone: 'closing' };
  if (draw.state === 'pending' || draw.state === 'draft') return { label: 'Awaiting open', tone: 'upcoming' };

  const openMs = draw.openAt ? new Date(draw.openAt).getTime() : 0;
  if (openMs > nowMs) return { label: `Opens ${formatOpensAt(draw.openAt)}`, tone: 'upcoming' };

  const cd = formatCountdown(draw.closedAt, nowMs);
  if (cd) {
    const tone: StatusTone = cd.startsWith('Closes in ') && cd.includes('m') && !cd.includes('h') && !cd.includes('d')
      ? 'closing'
      : 'open';
    return { label: cd, tone };
  }
  return { label: 'Drawing soon', tone: 'closing' };
}

const STATUS_PILL_STYLES: Record<StatusTone, string> = {
  open:     'bg-white/95 text-[#0F1222] ring-1 ring-[#E7E9F2]',
  closing:  'bg-[#FFF6DA] text-[#9C5410] ring-1 ring-[#FFC85D]/40',
  won:      'bg-gradient-to-r from-[#FFC85D] to-[#FFE2B0] text-[#7C5A00] ring-1 ring-[#FFC85D]',
  closed:   'bg-white/95 text-[#667085] ring-1 ring-[#E7E9F2]',
  upcoming: 'bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]',
};

/* Title gradient family — rotates by draw id hash so cards don't all look same. */
function pickGradient(seed: string): string {
  const variants = [
    'from-[#6356E5] via-[#7C6BE8] to-[#8B7BFF]',
    'from-[#5346D6] via-[#6F62E0] to-[#8B7BFF]',
    'from-[#6356E5] via-[#9080F0] to-[#FFC85D]',
    'from-[#534AB7] via-[#6356E5] to-[#8B7BFF]',
    'from-[#3C3489] via-[#6356E5] to-[#7C6BE8]',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return variants[Math.abs(h) % variants.length];
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

/** Zero-padded 6-digit entry number. */
function fmtEntryNo(n: number): string {
  return String(n).padStart(6, '0');
}

/** Pills rendered per "page" inside an expanded order (bounds the DOM). */
const NUM_CHUNK = 120;
/** Orders with at most this many numbers auto-expand; larger stay collapsed. */
const AUTO_EXPAND_MAX = 60;
/** Cap how many search matches we render at once. */
const MATCH_CAP = 240;

/**
 * Entry-numbers modal — count-first, with a "check a number" search and
 * collapsible orders (large orders stay collapsed, expand renders in chunks).
 * Bottom-sheet on mobile + centred on desktop; portals to document.body.
 */
function EntryNumbersModal({
  drawId,
  drawTitle,
  onClose,
}: {
  drawId: string;
  drawTitle: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  const [orders, setOrders] = useState<{ orderNo: string; entryNumbers: number[] }[]>([]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.entries.getMyDrawEntryNumbers(drawId);
        if (!active) return;
        setCount(res.data.count);
        const list = res.data.orders || [];
        setOrders(list);
        const exp: Record<string, boolean> = {};
        const vis: Record<string, number> = {};
        list.forEach((o) => {
          exp[o.orderNo] = o.entryNumbers.length <= AUTO_EXPAND_MAX;
          vis[o.orderNo] = NUM_CHUNK;
        });
        setExpanded(exp);
        setVisible(vis);
      } catch (err: any) {
        if (active) setError(err.response?.data?.message || 'Failed to load entry numbers');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [drawId]);

  const q = query.trim();
  const matches = useMemo(() => {
    if (!q) return null;
    const out: { orderNo: string; n: number }[] = [];
    for (const o of orders) {
      for (const n of o.entryNumbers) {
        if (fmtEntryNo(n).includes(q)) {
          out.push({ orderNo: o.orderNo, n });
          if (out.length >= MATCH_CAP + 1) return out;
        }
      }
    }
    return out;
  }, [q, orders]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4 animate-[fadeIn_.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E7E9F2] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">
              My entry numbers
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-[15.5px] font-extrabold tracking-tight text-[#0F1222]">
              {drawTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-[#667085] hover:bg-[#F4F1FB]"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingRing size="sm" label="Loading entry numbers" />
          </div>
        ) : error ? (
          <p className="py-10 text-center text-[13px] text-red-600">{error}</p>
        ) : count === 0 ? (
          <p className="py-10 text-center text-[13px] text-[#667085]">No entry numbers found.</p>
        ) : (
          <>
            {/* Count + reassurance + search (fixed above the scroll area) */}
            <div className="border-b border-[#E7E9F2] px-5 py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[30px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums">
                  {count.toLocaleString()}
                </span>
                <span className="text-[14px] font-semibold text-[#667085]">
                  entry {count === 1 ? 'number' : 'numbers'}
                </span>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#10B981]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                You’re entered in this draw.
              </p>
              <div className="relative mt-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0B4]">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  inputMode="numeric"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Check a number — e.g. 089754"
                  className="h-11 w-full rounded-xl border border-[#E7E9F2] pl-9 pr-9 text-sm focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9AA0B4] hover:bg-[#F4F1FB] hover:text-[#667085]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {matches !== null ? (
                /* Search results */
                matches.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[13px] font-semibold text-[#0F1222]">No match in your numbers</p>
                    <p className="mt-1 text-[12px] text-[#667085]">
                      “{q}” isn’t one of your entry numbers in this draw.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-2.5 text-[12px] font-semibold text-[#667085]">
                      {matches.length > MATCH_CAP ? `${MATCH_CAP}+` : matches.length}{' '}
                      {matches.length === 1 ? 'match' : 'matches'} in your numbers
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                      {matches.slice(0, MATCH_CAP).map((m) => (
                        <span
                          key={`${m.orderNo}-${m.n}`}
                          className="rounded-lg bg-[#F4F1FB] px-2 py-1.5 text-center font-mono text-[12.5px] font-bold text-[#6356E5] ring-1 ring-[#E0DAFF]"
                        >
                          {fmtEntryNo(m.n)}
                        </span>
                      ))}
                    </div>
                    {matches.length > MATCH_CAP && (
                      <p className="mt-3 text-center text-[11.5px] text-[#9AA0B4]">
                        Showing first {MATCH_CAP}. Type more digits to narrow it down.
                      </p>
                    )}
                  </>
                )
              ) : (
                /* Orders, collapsible */
                <div className="space-y-2.5">
                  {orders.map((o) => {
                    const isOpen = !!expanded[o.orderNo];
                    const shown = visible[o.orderNo] ?? NUM_CHUNK;
                    const slice = isOpen ? o.entryNumbers.slice(0, shown) : [];
                    const more = o.entryNumbers.length - slice.length;
                    return (
                      <div key={o.orderNo} className="overflow-hidden rounded-2xl border border-[#E7E9F2]">
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((s) => ({ ...s, [o.orderNo]: !s[o.orderNo] }))
                          }
                          className="flex w-full items-center justify-between gap-2 bg-[#FBFAFF] px-3.5 py-2.5 text-left"
                        >
                          <span className="min-w-0 truncate text-[12.5px] font-semibold text-[#667085]">
                            Order <span className="font-mono text-[#0F1222]">{o.orderNo}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#6356E5] ring-1 ring-[#E0DAFF] tabular-nums">
                              {o.entryNumbers.length.toLocaleString()}
                            </span>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`h-4 w-4 text-[#9AA0B4] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-[#E7E9F2] p-3">
                            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                              {slice.map((n) => (
                                <span
                                  key={n}
                                  className="rounded-lg bg-[#F4F1FB] px-2 py-1.5 text-center font-mono text-[12.5px] font-bold text-[#6356E5] ring-1 ring-[#E0DAFF]"
                                >
                                  {fmtEntryNo(n)}
                                </span>
                              ))}
                            </div>
                            {more > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setVisible((s) => ({
                                    ...s,
                                    [o.orderNo]: (s[o.orderNo] ?? NUM_CHUNK) + NUM_CHUNK,
                                  }))
                                }
                                className="mt-3 w-full rounded-xl border border-[#E0DAFF] bg-white py-2 text-[12.5px] font-bold text-[#6356E5] hover:bg-[#F4F1FB]"
                              >
                                Show {Math.min(more, NUM_CHUNK).toLocaleString()} more
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function DrawCard({
  data,
  nowMs,
  drawKind,
}: {
  data: DrawCardData;
  nowMs: number;
  drawKind: 'major' | 'mini';
}) {
  const { draw, userEntries, accumulatingEntries, purchasedEntries, hasLoyalty } = data;
  const { user } = useAuth();
  const [showNumbers, setShowNumbers] = useState(false);
  const isWinner = !!(draw.winnerUserId && user?.id && draw.winnerUserId === user.id);
  const status = resolveStatus(draw, isWinner, nowMs);

  const capacity = Math.max(0, Number(draw.capacity ?? draw.cap ?? 0));
  const entrants = Math.max(0, Number(draw.entrants ?? 0));
  const pct = capacity > 0 ? Math.min(100, Math.round((entrants / capacity) * 100)) : 0;

  const imageUrl = resolveDrawImage(draw, drawKind);
  const gradientClass = pickGradient(draw.id);
  const href = resolveDrawHref(draw, drawKind);

  // Source pill: hidden on Major Draws per design lock 2026-05-18 — the
  // crown glyph + "Major Draws" section heading already signal type, the
  // extra pill was noise. Bonus cards show a subtle Loyalty pill only when
  // the user has loyalty-granted entries there (rare).
  const showSourcePill = drawKind === 'mini' && hasLoyalty;

  return (
    <>
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-all hover:-translate-y-0.5 hover:border-[#D8D2F2] hover:shadow-[0_18px_40px_-20px_rgba(99,86,229,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
    >
      {/* Hero */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={draw.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          // Gradient placeholder when no image is set on the Draw row.
          // Major Draws reuse landingBannerImage; Bonus Draws use images[]
          // or prizeImage. If neither is populated yet, render this glyph
          // tile so the grid stays visually balanced.
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}>
            {drawKind === 'major' ? (
              <Icon.Crown className="h-14 w-14 text-white/90" />
            ) : (
              <Icon.Trophy className="h-14 w-14 text-white/90" />
            )}
          </div>
        )}

        {/* Bottom-row pills — status (right) + optional source (left). */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          {showSourcePill ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#6356E5] ring-1 ring-[#E0DAFF] backdrop-blur">
              <Icon.Sparkle className="h-2.5 w-2.5" />
              Loyalty
            </span>
          ) : (
            <span />
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur ${STATUS_PILL_STYLES[status.tone]}`}>
            {status.tone !== 'won' && <Icon.Clock className="h-3 w-3" />}
            {status.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 text-[15.5px] font-extrabold leading-snug tracking-tight text-[#0F1222] transition-colors group-hover:text-[#6356E5] sm:text-[17px]">
          {draw.title}
        </h3>

        {/* Progress — only if capacity is known. */}
        {capacity > 0 && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2 text-[11.5px] text-[#667085]">
              <span>
                <span className="font-bold text-[#0F1222] tabular-nums">{entrants.toLocaleString()}</span>
                {' / '}
                {capacity.toLocaleString()} entries
              </span>
              <span className="rounded-full bg-[#F4F1FB] px-2 py-0.5 text-[10.5px] font-bold text-[#6356E5] ring-1 ring-[#E0DAFF] tabular-nums">
                {pct}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F4F1FB]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF]"
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </div>
        )}

        {/* Member's stake — big gold-accented count + Major Draw breakdown.
            Big total stays the visual anchor (it's what the member cares
            about). Below the divider: 2-col breakdown so the member can
            instantly see how the stake was built — auto-granted via
            membership/loyalty vs. paid extras via Stripe landing
            packages. Bonus Draws skip the breakdown (single source). */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFF6DA] to-[#FFE2B0] p-3 ring-1 ring-[#FFC85D]/50">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9C5410]">Your entries</p>
              <p className="mt-0.5 text-[28px] font-extrabold leading-none tracking-tight text-[#7C5A00] tabular-nums sm:text-[32px]">
                {userEntries.toLocaleString()}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[#9C5410] ring-1 ring-[#FFC85D]/50">
              <Icon.Ticket className="h-4 w-4" />
            </span>
          </div>

          {drawKind === 'major' && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#FFC85D]/40 pt-2.5">
              <div className="min-w-0">
                <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#9C5410]/85">
                  Accumulating
                </p>
                <p className="mt-0.5 text-[15px] font-extrabold leading-tight tracking-tight text-[#7C5A00] tabular-nums">
                  {accumulatingEntries.toLocaleString()}
                </p>
              </div>
              <div className="min-w-0 border-l border-[#FFC85D]/40 pl-2">
                <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#9C5410]/85">
                  One-time
                </p>
                <p className="mt-0.5 text-[15px] font-extrabold leading-tight tracking-tight text-[#7C5A00] tabular-nums">
                  {purchasedEntries.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* View entry numbers — opens modal; stops the card's link navigation. */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowNumbers(true);
          }}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E0DAFF] bg-white px-4 py-2 text-[12.5px] font-bold text-[#6356E5] transition-colors hover:bg-[#F4F1FB]"
        >
          <Icon.Ticket className="h-3.5 w-3.5" />
          View entry numbers
        </button>
      </div>
    </Link>
    {showNumbers && (
      <EntryNumbersModal
        drawId={draw.id}
        drawTitle={draw.title}
        onClose={() => setShowNumbers(false)}
      />
    )}
    </>
  );
}

function SectionEmpty({
  kind,
  searchActive,
}: {
  kind: 'major' | 'mini';
  searchActive: boolean;
}) {
  if (searchActive) {
    return (
      <article className="rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-8 text-center">
        <p className="text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">No match in this section</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
          Try a different search term or clear the search to see everything.
        </p>
      </article>
    );
  }

  if (kind === 'major') {
    return (
      <article className="overflow-hidden rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-10 text-center sm:py-12">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
          <Icon.Crown className="h-5 w-5" />
        </span>
        <p className="mt-3 text-[15px] font-extrabold tracking-tight text-[#0F1222] sm:text-[16px]">
          No active Major Draw yet
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563]">
          A new Major Draw opens every month. Active Members get free entries automatically.
        </p>
        <Link
          href="/membership"
          className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
        >
          View Membership
          <Icon.ArrowRight className="h-4 w-4" />
        </Link>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-10 text-center sm:py-12">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
        <Icon.Trophy className="h-5 w-5" />
      </span>
      <p className="mt-3 text-[15px] font-extrabold tracking-tight text-[#0F1222] sm:text-[16px]">
        No Bonus Draw entries yet
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563]">
        Use your Points to enter Bonus Draws between Major Draws.
      </p>
      <Link
        href="/giveaways"
        className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
      >
        View Bonus Draws
        <Icon.ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function Section({
  title,
  count,
  kind,
  cards,
  nowMs,
  searchActive,
}: {
  title: string;
  count: number;
  kind: 'major' | 'mini';
  cards: DrawCardData[];
  nowMs: number;
  searchActive: boolean;
}) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">
          {title}
        </h2>
        {count > 0 && (
          <span className="rounded-full bg-[#F4F1FB] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6356E5] ring-1 ring-[#E0DAFF] tabular-nums">
            {count} {count === 1 ? 'draw' : 'draws'}
          </span>
        )}
      </header>

      {cards.length === 0 ? (
        <SectionEmpty kind={kind} searchActive={searchActive} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <DrawCard key={c.draw.id} data={c} nowMs={nowMs} drawKind={kind} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function EntriesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drawsById, setDrawsById] = useState<Map<string, DrawMeta>>(new Map());
  const [entriesByDraw, setEntriesByDraw] = useState<Map<string, GroupedRow[]>>(new Map());
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Live countdown — refresh every 30s. Cheap because each card is pure.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setDrawsById(new Map());
      setEntriesByDraw(new Map());
      return;
    }
    setLoading(true);
    try {
      const [drawsRes, miniRes, majorRes] = await Promise.all([
        api.draws.getAll({ userId: user.id, includeMajor: true, includeFuture: true }).catch(() => ({ data: [] })),
        api.entries.getMyEntriesGrouped({
          page: 1,
          limit: 200,
          drawType: 'mini',
          sort: sortOrder,
        }).catch(() => ({ data: { data: [], total: 0 } })),
        api.entries.getMyEntriesGrouped({
          page: 1,
          limit: 200,
          drawType: 'major',
          sort: sortOrder,
        }).catch(() => ({ data: { data: [], total: 0 } })),
      ]);

      // Index draws by id for cheap lookup
      const drawList = ((drawsRes.data || []) as DrawMeta[]) || [];
      const byId = new Map<string, DrawMeta>();
      for (const d of drawList) {
        if (d?.id) byId.set(d.id, d);
      }
      setDrawsById(byId);

      // Group entries by drawId — aggregate count + flags across sources.
      const grouped = new Map<string, GroupedRow[]>();
      const collect = (payload: any) => {
        const list = ((payload?.data?.data || []) as Array<any>) || [];
        for (const r of list) {
          const row: GroupedRow = {
            key: `${r.drawId}-${r.source}-${r.subsource ?? ''}-${r.dayUtc}`,
            drawId: r.drawId,
            drawType: r.draw?.drawType || 'mini',
            source: r.source,
            subsource: r.subsource ?? null,
            creditsSpent: Number(r.creditsSpent) || 0,
            latestCreatedAt: r.latestCreatedAt,
            count: Number(r.count) || 0,
            orderNoSample: r.sampleOrderNo ? String(r.sampleOrderNo).trim() : null,
          };
          const list2 = grouped.get(row.drawId) || [];
          list2.push(row);
          grouped.set(row.drawId, list2);
        }
      };
      collect(miniRes);
      collect(majorRes);
      setEntriesByDraw(grouped);
    } finally {
      setLoading(false);
    }
  }, [user, sortOrder]);

  useEffect(() => { loadData(); }, [loadData]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /** Composite cards = one per draw, joined with entries the user has there. */
  const cards: DrawCardData[] = useMemo(() => {
    const out: DrawCardData[] = [];
    Array.from(entriesByDraw.entries()).forEach(([drawId, rows]: [string, GroupedRow[]]) => {
      const draw = drawsById.get(drawId);
      if (!draw) return;
      const userEntries = rows.reduce((s: number, r: GroupedRow) => s + r.count, 0);
      if (userEntries <= 0) return;

      // Major Draw breakdown (see DrawCardData comment):
      //  accumulating = membership_credit + loyalty (auto-granted)
      //  purchased    = external_payment (Stripe one-time landing pkg)
      // Bonus Draws collapse both to the total; we don't render this
      // breakdown for them but compute it anyway for type safety.
      const accumulatingEntries = rows
        .filter((r: GroupedRow) => r.source === 'membership_credit' || r.source === 'loyalty')
        .reduce((s: number, r: GroupedRow) => s + r.count, 0);
      const purchasedEntries = rows
        .filter((r: GroupedRow) => r.source === 'external_payment')
        .reduce((s: number, r: GroupedRow) => s + r.count, 0);

      const hasLoyalty = rows.some((r: GroupedRow) => r.source === 'loyalty');
      const hasMembership = rows.some((r: GroupedRow) => r.source === 'membership_credit');
      const latest = rows.reduce<string>(
        (acc: string, r: GroupedRow) =>
          new Date(r.latestCreatedAt).getTime() > new Date(acc).getTime() ? r.latestCreatedAt : acc,
        rows[0]?.latestCreatedAt || new Date(0).toISOString(),
      );
      const orderNoSample = rows.find((r: GroupedRow) => r.orderNoSample)?.orderNoSample ?? null;
      out.push({
        draw,
        userEntries,
        accumulatingEntries,
        purchasedEntries,
        hasLoyalty,
        hasMembership,
        latestEntryDate: latest,
        orderNoSample,
      });
    });
    return out;
  }, [entriesByDraw, drawsById]);

  /** Split by drawType, then filter by search, then sort. */
  const { majorCards, miniCards } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (c: DrawCardData) =>
      !q ||
      c.draw.title?.toLowerCase().includes(q) ||
      c.orderNoSample?.toLowerCase().includes(q);

    const filter = (c: DrawCardData) => matches(c);

    const sortFn = (a: DrawCardData, b: DrawCardData) => {
      const aT = new Date(a.latestEntryDate).getTime();
      const bT = new Date(b.latestEntryDate).getTime();
      return sortOrder === 'newest' ? bT - aT : aT - bT;
    };

    return {
      majorCards: cards.filter((c) => c.draw.drawType === 'major').filter(filter).sort(sortFn),
      miniCards: cards.filter((c) => c.draw.drawType === 'mini').filter(filter).sort(sortFn),
    };
  }, [cards, search, sortOrder]);

  const hasAnyEntries = cards.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[30px]">My Entries</h1>
      </header>

      {!user ? (
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-8 text-center">
          <p className="text-[13.5px] text-[#4B5563]">Sign in to view your entries.</p>
        </article>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <LoadingRing size="md" label="Loading your entries" />
        </div>
      ) : !hasAnyEntries ? (
        <article className="overflow-hidden rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-12 text-center sm:py-14">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Trophy className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[16px] font-extrabold tracking-tight text-[#0F1222] sm:text-[17px]">
            No entries yet
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5563] sm:text-[13.5px]">
            Your Membership unlocks free Major Draw entries.<br />
            Use your Points to enter Bonus Draws anytime.
          </p>
          <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              href="/membership"
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] sm:w-auto"
            >
              View Membership
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/giveaways"
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] hover:bg-[#FBFAFF] sm:w-auto"
            >
              Browse Bonus Draws
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      ) : (
        <>
          {/* Controls — search (flex-1) + small sort dropdown on the right.
              Compact single-row pill so mobile stays uncluttered. */}
          <article className="overflow-hidden rounded-full border border-[#E7E9F2] bg-white shadow-[0_1px_2px_rgba(15,18,34,.04)]">
            <div className="flex items-stretch divide-x divide-[#EFEDF5]">
              <div className="relative flex-1 min-w-0">
                <Icon.Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search draws by title or order no…"
                  className="h-11 w-full rounded-l-full border-0 bg-transparent pl-10 pr-3 text-[13px] text-[#0F1222] placeholder:text-[#667085] focus:outline-none focus:ring-0"
                />
              </div>
              <div className="relative shrink-0">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="h-11 w-[124px] cursor-pointer appearance-none border-0 bg-transparent pl-3.5 pr-8 text-[12.5px] font-semibold text-[#667085] hover:text-[#0F1222] focus:outline-none focus:ring-0"
                  aria-label="Sort order"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]"
                  aria-hidden
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </article>

          <Section
            title="Major Draws"
            count={majorCards.length}
            kind="major"
            cards={majorCards}
            nowMs={nowMs}
            searchActive={!!search.trim()}
          />

          <Section
            title="Bonus Draws"
            count={miniCards.length}
            kind="mini"
            cards={miniCards}
            nowMs={nowMs}
            searchActive={!!search.trim()}
          />
        </>
      )}
    </div>
  );
}
