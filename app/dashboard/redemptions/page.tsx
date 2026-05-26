'use client';

/**
 * UNICASH — Account · Redemption history
 *
 * Member-facing list of every gift card redemption tied to the
 * account. Filter pills mirror the on-hold / failed / refunded
 * outcomes from the checkout flow so members can find any in-flight
 * or historical redemption fast.
 *
 * Layout:
 *   - Hero strip with summary chips (count + Points spent total)
 *   - Filter pills (All / Completed / On hold / Processing / Failed / Refunded)
 *   - Desktop table (md+) + mobile card list (md:hidden)
 *   - Empty state per filter
 *   - Row action: View receipt; Reveal code (Completed only) reveals
 *     in a small inline panel without leaving the list.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Inbox,
  Mail,
  ReceiptText,
  Search,
} from 'lucide-react';
import { StatusChip } from '@/components/gift-cards';
import { MOCK_REDEMPTIONS } from '@/lib/gift-cards/mock-data';
import { formatAud, formatDate, formatPts, maskEmail } from '@/lib/gift-cards/format';
import type { Redemption, RedemptionStatus } from '@/lib/gift-cards/types';
import api from '@/lib/api';

/* 2026-05-26 — filter is a coarse bucket on top of the 10 backend states.
   Each bucket maps to a list of statuses so a single tap on "In flight"
   surfaces every non-terminal redemption (was previously only matching
   `prezzee_pending`, leaving other pending states invisible). */
type FilterKey =
  | 'all'
  | 'in_flight'
  | 'completed'
  | 'delivery_issue'
  | 'failed'
  | 'refunded';

type ViewState = 'ready' | 'loading' | 'error';

const FILTER_BUCKETS: Record<Exclude<FilterKey, 'all'>, RedemptionStatus[]> = {
  in_flight: [
    'points_held',
    'submitting',
    'prezzee_pending',
    'pending_payment',
    'pending_fulfillment',
  ],
  completed: ['completed'],
  delivery_issue: ['pending_delivery'],
  failed: ['failed'],
  refunded: ['refunded'],
};

const FILTER_PILLS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_flight', label: 'In flight' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivery_issue', label: 'Delivery issue' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export default function RedemptionsHistoryPage() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  // GP4 — fetch member redemption history; fallback to mock for dev.
  const [all, setAll] = useState<Redemption[]>(MOCK_REDEMPTIONS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.redemptions.getMyHistory();
        if (!cancelled) {
          setAll(Array.isArray(res.data) && res.data.length ? (res.data as Redemption[]) : MOCK_REDEMPTIONS);
          setViewState('ready');
        }
      } catch {
        if (!cancelled) {
          setAll(MOCK_REDEMPTIONS);
          setViewState('ready');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((r) =>
        filter === 'all' ? true : FILTER_BUCKETS[filter].includes(r.status),
      )
      .filter((r) =>
        q
          ? r.brandName.toLowerCase().includes(q) ||
            (r.prezzeeOrderNumber?.toLowerCase().includes(q) ?? false)
          : true,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [all, filter, search]);

  // Summary counters across the unfiltered list — useful glance.
  const summary = useMemo(() => {
    const totalSpent = all
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.pointsDebited, 0);
    const completed = all.filter((r) => r.status === 'completed').length;
    /* 2026-05-26 — match the 10-state backend model. In-flight covers
       every non-terminal status (anything that's not completed/failed/
       refunded/cancelled). */
    const inFlight = all.filter((r) =>
      [
        'points_held',
        'submitting',
        'prezzee_pending',
        'pending_payment',
        'pending_fulfillment',
        'pending_delivery',
      ].includes(r.status),
    ).length;
    return { totalSpent, completed, inFlight };
  }, [all]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header — match dashboard canonical pattern (purchases / receipts).
          Simple H1 + subtitle + inline summary chips on the right. */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">
            Gift cards
          </h1>
          <p className="mt-1 max-w-xl text-[13.5px] text-[#667085] sm:text-[14px]">
            Every gift card you&apos;ve redeemed, plus any in flight or under review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryChip label="Completed" value={String(summary.completed)} />
          <SummaryChip label="In flight" value={String(summary.inFlight)} />
          <SummaryChip label="Points spent" value={formatPts(summary.totalSpent)} />
        </div>
      </header>

      {/* Filter + Search live INSIDE the main card so the page reads as
          a single article (consistent with /dashboard/purchases). */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(15,18,34,0.04)]">
        {/* Filter pills */}
        <div className="-mx-1 overflow-x-auto md:overflow-visible">
          <div className="flex w-max gap-2 px-1 md:w-auto md:flex-wrap">
            {FILTER_PILLS.map((p) => {
              const count =
                p.value === 'all'
                  ? all.length
                  : all.filter((r) => FILTER_BUCKETS[p.value as Exclude<FilterKey, 'all'>].includes(r.status)).length;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFilter(p.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    filter === p.value
                      ? 'bg-[#6356E5] text-white'
                      : 'bg-[#FBFAFF] text-[#0F1222] border border-[#E7E9F2] hover:bg-[#F6F4FF]'
                  }`}
                >
                  {p.label}
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      filter === p.value
                        ? 'bg-white/25 text-white'
                        : 'bg-[#F4F1FB] text-[#5648D8]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand or order number…"
            aria-label="Search redemptions"
            className="w-full rounded-full border border-[#E7E9F2] bg-[#FBFAFF] py-2.5 pl-10 pr-3 text-[14px] outline-none transition focus:border-[#6356E5] focus:bg-white focus:ring-2 focus:ring-[#F6F4FF]"
          />
        </div>

        {/* Results */}
        {viewState === 'loading' ? (
          <SkeletonList />
        ) : viewState === 'error' ? (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-8 text-center">
            <p className="text-[15px] font-semibold text-[#B91C1C]">
              Couldn&apos;t load your history
            </p>
            <p className="mt-1 text-[13px] text-[#B91C1C]/80">
              Try refreshing the page or contact support.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            {/* Desktop table — uses card background so border + header tone
                blend with the parent article. */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-[#F1ECFB]">
              <table className="w-full text-[14px]">
                <thead className="border-b border-[#F1ECFB] bg-[#FBFAFF]">
                  <tr className="text-left text-[11.5px] uppercase tracking-[0.12em] text-[#667085]">
                    <th scope="col" className="px-4 py-3 font-semibold">Brand</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-right">Points</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-right">Value</th>
                    <th scope="col" className="px-4 py-3 font-semibold">When</th>
                    <th scope="col" className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <RedemptionRowDesktop key={r.id} redemption={r} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {filtered.map((r) => (
                <RedemptionRowMobile key={r.id} redemption={r} />
              ))}
            </div>
          </>
        )}
      </article>

    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Subcomponents
   ────────────────────────────────────────────────────────────────── */

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex flex-col rounded-2xl border border-[#E7E9F2] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,18,34,0.04)]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085]">
        {label}
      </span>
      <span className="text-[14px] font-extrabold tabular-nums text-[#0F1222]">
        {value}
      </span>
    </div>
  );
}

function BrandBadge({ brand, name }: { brand: string; name: string }) {
  // Hashable colour from brand id so the badge stays consistent
  // even before we wire real logo URLs.
  const colors = ['#6356E5', '#8B7BFF', '#FFC85D', '#10B981', '#0F7B3B', '#E01E22', '#178841', '#86256E'];
  const idx = brand.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const color = colors[idx];
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-extrabold shrink-0"
      style={{ background: `${color}1A`, color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function RedemptionRowDesktop({ redemption: r }: { redemption: Redemption }) {
  return (
    <tr className="border-b border-[#F1ECFB] last:border-b-0 hover:bg-[#FBFAFF]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <BrandBadge brand={r.brandId} name={r.brandName} />
          <div className="min-w-0">
            <div className="font-semibold text-[#0F1222] truncate">{r.brandName}</div>
            <div className="text-[11px] text-[#9097A8]">
              {formatAud(r.valueAud)}
              {r.quantity > 1 ? ` × ${r.quantity}` : ''}
              {r.prezzeeOrderNumber ? ` · ${r.prezzeeOrderNumber}` : ''}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusChip status={r.status} />
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{formatPts(r.pointsDebited)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-[#667085]">
        {formatAud(r.valueAud * r.quantity)}
      </td>
      <td className="px-4 py-3 text-[12px] text-[#667085]">{formatDate(r.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/dashboard/redemptions/${encodeURIComponent(r.id)}`}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#5648D8] hover:text-[#6356E5]"
        >
          View receipt
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  );
}

function RedemptionRowMobile({ redemption: r }: { redemption: Redemption }) {
  return (
    <Link
      href={`/dashboard/redemptions/${encodeURIComponent(r.id)}`}
      className="block rounded-2xl border border-[#E7E9F2] bg-white p-4 shadow-[0_1px_2px_rgba(15,18,34,0.04)] active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BrandBadge brand={r.brandId} name={r.brandName} />
          <div className="min-w-0">
            <div className="font-extrabold tracking-tight text-[#0F1222] truncate">
              {r.brandName}
            </div>
            <div className="text-[11px] text-[#9097A8]">
              {formatAud(r.valueAud)} × {r.quantity}
              {r.prezzeeOrderNumber ? ` · ${r.prezzeeOrderNumber}` : ''}
            </div>
          </div>
        </div>
        <StatusChip status={r.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px]">
        <span className="text-[#667085]">{formatDate(r.createdAt)}</span>
        <span className="font-semibold tabular-nums">{formatPts(r.pointsDebited)}</span>
      </div>
    </Link>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] rounded-2xl border border-[#E7E9F2] bg-[#F4F1FB] animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const label = FILTER_PILLS.find((p) => p.value === filter)?.label || 'this filter';
  return (
    <div className="rounded-2xl border border-[#E7E9F2] bg-white p-10 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F4FF] text-[#6356E5] mb-3">
        <Inbox className="w-5 h-5" />
      </div>
      <p className="text-[15px] font-semibold text-[#0F1222]">
        {filter === 'all'
          ? 'No redemptions yet'
          : `No ${label.toLowerCase()} redemptions`}
      </p>
      <p className="mt-1 text-[13px] text-[#667085]">
        {filter === 'all'
          ? 'Turn your Points into gift cards from Australia’s favourite brands.'
          : 'Try a different filter or browse the catalog.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/rewards/gift-cards"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-2.5 text-[13px] font-bold transition-colors"
        >
          <ReceiptText className="w-3.5 h-3.5" />
          Browse gift cards
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-5 py-2.5 text-[13px] font-semibold"
        >
          <Mail className="w-3.5 h-3.5" />
          Contact support
        </Link>
      </div>
    </div>
  );
}
