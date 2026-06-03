'use client';

/**
 * UNICASH — Redeem Gift Cards · Catalog
 *
 * Discovery surface. Section order (top → bottom):
 *   1. Compact hero strip (H1 + value prop + balance chips)
 *   2. Sticky filter row (category pills, sort, member-only toggle)
 *   3. Search input
 *   4. Featured (horizontal scroll)
 *   5. Most popular grid
 *   6. New grid
 *   7. All gift cards grid (client-paginated)
 *
 * State coverage:
 *   - loading (skeleton grid)
 *   - empty filter (reset CTA)
 *   - member-only locked card (overlay + Join CTA)
 *   - insufficient Points (inline check on each card hover — handled
 *     inside BrandCard via balance prop, not blocking the catalog)
 *
 * Mobile: filters collapse into a Filters bottom-sheet; category
 * pills stay inline scrollable. Bottom-nav remains visible.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Filter, Search, Coins, Fuel, X } from 'lucide-react';
import {
  BrandCard,
  BottomSheet,
} from '@/components/gift-cards';
import { MOCK_BRANDS, MOCK_MEMBER_BALANCE } from '@/lib/gift-cards/mock-data';
import { formatAud, formatPts } from '@/lib/gift-cards/format';
import type { Brand, GiftCardCategory } from '@/lib/gift-cards/types';
import api from '@/lib/api';

type SortKey = 'popular' | 'newest' | 'lowestPts' | 'highestValue';
type ViewState = 'ready' | 'loading' | 'error';

const CATEGORIES: Array<'All' | GiftCardCategory> = [
  'All',
  'Groceries',
  'Fuel',
  'Tech',
  'Lifestyle',
  'Travel',
  'Entertainment',
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'lowestPts', label: 'Lowest Points' },
  { value: 'highestValue', label: 'Highest value' },
];

const PAGE_SIZE = 12;

/* Smallest active denomination on a brand — used for sort + display. */
function smallestPoints(b: Brand): number {
  const active = b.denominations.filter((d) => d.active);
  if (!active.length) return Infinity;
  return Math.min(...active.map((d) => d.pointsRequired));
}

function highestValue(b: Brand): number {
  const active = b.denominations.filter((d) => d.active);
  if (!active.length) return 0;
  return Math.max(...active.map((d) => d.valueAud));
}

function applyFilters(
  brands: Brand[],
  opts: { category: string; sort: SortKey; memberOnly: boolean; search: string },
) {
  const search = opts.search.trim().toLowerCase();
  let arr = brands.filter((b) => b.status === 'live');
  if (opts.category !== 'All') arr = arr.filter((b) => b.category === opts.category);
  if (opts.memberOnly) arr = arr.filter((b) => b.memberOnly);
  if (search) arr = arr.filter((b) => b.name.toLowerCase().includes(search));
  arr.sort((a, b) => {
    if (opts.sort === 'popular') return (b.popularity30d ?? 0) - (a.popularity30d ?? 0);
    if (opts.sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (opts.sort === 'lowestPts') return smallestPoints(a) - smallestPoints(b);
    if (opts.sort === 'highestValue') return highestValue(b) - highestValue(a);
    return 0;
  });
  return arr;
}

export default function GiftCardsClient() {
  const router = useRouter();
  const balance = MOCK_MEMBER_BALANCE; // TODO: load member balance from auth context

  // GP4 — fetch live catalog from backend. The MOCK_BRANDS fallback is for
  // LOCAL DEV ONLY — never on production (it leaked fake Coles/Woolworths/BP
  // cards on prod). In prod an empty/failed catalog shows the empty state.
  const FALLBACK_BRANDS = process.env.NODE_ENV === 'production' ? [] : MOCK_BRANDS;
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [viewState, setViewState] = useState<ViewState>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setViewState('loading');
      try {
        const res = await api.giftCards.list();
        if (!cancelled) {
          setBrands(Array.isArray(res.data) && res.data.length ? (res.data as Brand[]) : FALLBACK_BRANDS);
          setViewState('ready');
        }
      } catch {
        if (!cancelled) {
          setBrands(FALLBACK_BRANDS);
          setViewState('ready');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter state — lifted to page so chips + bottom-sheet share it.
  const [category, setCategory] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('popular');
  const [memberOnly, setMemberOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Reset page when filters change.
  useEffect(() => {
    setPage(1);
  }, [category, sort, memberOnly, search]);

  const filtered = useMemo(
    () => applyFilters(brands, { category, sort, memberOnly, search }),
    [brands, category, sort, memberOnly, search],
  );

  const featured = useMemo(
    () => brands.filter((b) => b.featured && b.status === 'live').slice(0, 6),
    [brands],
  );

  const popular = useMemo(
    () =>
      [...brands]
        .filter((b) => b.status === 'live')
        .sort((a, b) => (b.popularity30d ?? 0) - (a.popularity30d ?? 0))
        .slice(0, 4),
    [brands],
  );

  const fresh = useMemo(
    () =>
      [...brands]
        .filter((b) => b.status === 'live')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [brands],
  );

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const resetFilters = () => {
    setCategory('All');
    setSort('popular');
    setMemberOnly(false);
    setSearch('');
  };

  const activeFilterCount =
    (category !== 'All' ? 1 : 0) +
    (sort !== 'popular' ? 1 : 0) +
    (memberOnly ? 1 : 0) +
    (search ? 1 : 0);

  const openBrand = (brand: Brand) => {
    router.push(`/rewards/gift-cards/${encodeURIComponent(brand.id)}`);
  };

  /* ──────────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-[#FBFAFF] min-h-screen">
      {/* Hero strip */}
      <section className="bg-gradient-to-b from-white to-[#FBFAFF] border-b border-[#E7E9F2]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6356E5]">
                Rewards
              </p>
              <h1 className="mt-2 text-[28px] sm:text-[40px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222]">
                Redeem{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
                  Gift Cards
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-[15px] text-[#667085]">
                Turn your Points into instant digital gift cards from Australia&apos;s favourite brands.
              </p>
            </div>

            {/* Balance chips */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E7E9F2] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,18,34,0.04)]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#F6F4FF] text-[#6356E5]">
                  <Coins className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#667085]">Points</div>
                  <div className="text-[14px] font-extrabold tabular-nums">
                    {formatPts(balance.pointsAvailable)}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E7E9F2] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,18,34,0.04)]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFBEB] text-[#B45309]">
                  <Fuel className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#667085]">Fuel Rewards</div>
                  <div className="text-[14px] font-extrabold tabular-nums">
                    {formatAud(balance.fuelRewardsAud)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky filter row + search */}
      <div className="sticky top-0 z-20 border-b border-[#E7E9F2] bg-[#FBFAFF]/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          {/* Category pills — always scrollable inline on mobile */}
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto">
            <div className="flex gap-2 px-4 sm:px-6 lg:px-8 w-max">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    category === c
                      ? 'bg-[#6356E5] text-white'
                      : 'bg-white text-[#0F1222] border border-[#E7E9F2] hover:bg-[#F6F4FF]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop sort + member-only + search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands..."
                aria-label="Search gift card brands"
                className="w-full rounded-full border border-[#E7E9F2] bg-white py-2 pl-10 pr-3 text-[14px] outline-none transition focus:border-[#6356E5] focus:ring-2 focus:ring-[#F6F4FF]"
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white px-4 py-2 text-[13px] font-semibold text-[#0F1222] hover:bg-[#F6F4FF]"
                >
                  <span className="text-[#667085]">Sort:</span>
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 mt-2 z-20 w-48 rounded-2xl border border-[#E7E9F2] bg-white shadow-xl overflow-hidden">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSort(opt.value);
                            setSortOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#F6F4FF] ${
                            opt.value === sort ? 'text-[#6356E5]' : 'text-[#0F1222]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <label className="inline-flex items-center gap-2 rounded-full border border-[#E7E9F2] bg-white px-4 py-2 text-[13px] font-semibold cursor-pointer hover:bg-[#F6F4FF]">
                <input
                  type="checkbox"
                  checked={memberOnly}
                  onChange={(e) => setMemberOnly(e.target.checked)}
                  className="accent-[#6356E5]"
                />
                Member-only
              </label>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label="Open filters"
              className="md:hidden inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white px-4 py-2 text-[13px] font-semibold text-[#0F1222]"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#6356E5] text-white text-[10px] font-bold px-1.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
        {viewState === 'loading' ? (
          <SkeletonGrid count={8} />
        ) : viewState === 'error' ? (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-8 text-center">
            <p className="text-[15px] font-semibold text-[#B91C1C]">
              Couldn&apos;t load gift cards
            </p>
            <p className="mt-1 text-[13px] text-[#B91C1C]/80">Try refreshing the page.</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F1FB]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#6356E5]">
                <path d="M3 7h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 7v13M3 11h18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 7c-1.5-3-5-3-5-1s3.5 1 5 1Zm0 0c1.5-3 5-3 5-1s-3.5 1-5 1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-4 text-[16px] font-extrabold tracking-tight text-[#0F1222]">Gift cards are coming soon</p>
            <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-[#667085]">
              We&apos;re finalising our gift card range. Check back shortly to redeem your Points for premium brands.
            </p>
          </div>
        ) : (
          <>
            {/* Featured row — only when no active filter narrows the catalog. */}
            {activeFilterCount === 0 && featured.length > 0 && (
              <section>
                <header className="mb-4">
                  <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222]">
                    Featured this{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
                      week
                    </span>
                  </h2>
                </header>
                <div className="-mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto">
                  <div className="flex gap-4 px-4 sm:px-6 lg:px-8 pb-2">
                    {featured.map((b) => (
                      <div key={b.id} className="w-[260px] shrink-0">
                        <BrandCard brand={b} isMember={balance.isMember} onClick={() => openBrand(b)} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Most popular */}
            {activeFilterCount === 0 && (
              <section>
                <header className="mb-4">
                  <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222]">
                    Most{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
                      popular
                    </span>
                  </h2>
                  <p className="mt-1 text-[14px] text-[#667085]">Top redeemed by members in the last 30 days.</p>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {popular.map((b) => (
                    <BrandCard key={b.id} brand={b} isMember={balance.isMember} onClick={() => openBrand(b)} />
                  ))}
                </div>
              </section>
            )}

            {/* New */}
            {activeFilterCount === 0 && (
              <section>
                <header className="mb-4">
                  <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222]">
                    New{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
                      arrivals
                    </span>
                  </h2>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fresh.map((b) => (
                    <BrandCard key={b.id} brand={b} isMember={balance.isMember} onClick={() => openBrand(b)} />
                  ))}
                </div>
              </section>
            )}

            {/* All — paginated. Always rendered, drives the "filtered" view. */}
            <section>
              <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222]">
                  All{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
                    gift cards
                  </span>
                </h2>
                <p className="text-[13px] text-[#667085]">
                  {filtered.length} brand{filtered.length === 1 ? '' : 's'}
                </p>
              </header>

              {filtered.length === 0 ? (
                <EmptyFilters onReset={resetFilters} />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {paginated.map((b) => (
                      <BrandCard key={b.id} brand={b} isMember={balance.isMember} onClick={() => openBrand(b)} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0F1222] hover:bg-[#F6F4FF]"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Trust strip */}
            <section className="rounded-3xl bg-[#1A1432] text-white p-6 sm:p-8 relative overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  background:
                    'radial-gradient(60% 50% at 80% 10%, rgba(139,123,255,0.35) 0%, rgba(26,20,50,0) 70%), radial-gradient(50% 40% at 10% 90%, rgba(255,200,93,0.18) 0%, rgba(26,20,50,0) 70%)',
                }}
              />
              <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
                <TrustItem title="Instant delivery" body="Codes arrive within seconds via email + in-app." />
                <TrustItem title="2-year code validity" body="Plenty of time to spend on what matters." />
                <TrustItem title="Secure & encrypted" body="Codes are encrypted at rest; reveal is logged." />
              </div>
              <div className="relative mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#FFE2B0] hover:text-white"
                >
                  Need help with a redemption? Contact support →
                </Link>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Mobile filters bottom-sheet */}
      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
        primaryAction={
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            className="w-full rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white font-semibold py-3 text-[14px]"
          >
            Apply filters
          </button>
        }
        secondaryAction={
          <button
            type="button"
            onClick={resetFilters}
            className="w-full rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] font-semibold py-3 text-[14px]"
          >
            Reset
          </button>
        }
      >
        <div className="space-y-5 py-2">
          <FilterSection title="Sort">
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((opt) => {
                const active = opt.value === sort;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={`rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors ${
                      active
                        ? 'border-[#6356E5] bg-[#F6F4FF] text-[#5648D8]'
                        : 'border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#FBFAFF]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>
          <FilterSection title="Show">
            <label className="flex items-center justify-between rounded-2xl border border-[#E7E9F2] bg-white px-4 py-3 cursor-pointer">
              <span className="text-[14px] font-semibold">Member-only brands</span>
              <input
                type="checkbox"
                checked={memberOnly}
                onChange={(e) => setMemberOnly(e.target.checked)}
                className="accent-[#6356E5]"
              />
            </label>
          </FilterSection>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Local subcomponents
   ────────────────────────────────────────────────────────────── */

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-wide text-[#667085] mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[200px] rounded-2xl border border-[#E7E9F2] bg-[#F4F1FB] animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function EmptyFilters({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-[#E7E9F2] bg-white p-10 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F4FF] text-[#6356E5] mb-3">
        <X className="w-5 h-5" />
      </div>
      <p className="text-[15px] font-semibold text-[#0F1222]">No gift cards match these filters</p>
      <p className="mt-1 text-[13px] text-[#667085]">Try clearing one or browsing all brands.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white px-4 py-2 text-[13px] font-semibold text-[#0F1222] hover:bg-[#F6F4FF]"
      >
        Reset filters
      </button>
    </div>
  );
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-[15px] font-extrabold tracking-tight">{title}</div>
      <p className="mt-1 text-[13px] text-[#C9C2E8]">{body}</p>
    </div>
  );
}
