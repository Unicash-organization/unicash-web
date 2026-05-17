'use client';

/**
 * UNICASH — Account · Loyalty Entries history
 *
 * Detail companion to the /dashboard/membership loyalty card. Two tabs:
 *   - Current Major Draw — breakdown table + tenure timeline + status copy
 *   - History           — paginated list of past draws with totals
 *
 * Mobile shows a card list per row; desktop shows a tidy table. No tabs
 * library — small button-pill toggle keeps the bundle slim, same idiom
 * as /account/redemptions filter row.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { EntryBreakdown } from '@/components/loyalty/EntryBreakdown';
import { TenureTimeline } from '@/components/loyalty/TenureTimeline';
import { LoyaltyEntryBadge } from '@/components/loyalty/LoyaltyEntryBadge';
import { LoyaltyStatusBadge } from '@/components/loyalty/LoyaltyStatusBadge';
import type {
  LoyaltyHistoryResponse,
  LoyaltyHistoryRow,
  LoyaltySummary,
} from '@/components/loyalty/types';

type Tab = 'current' | 'history';
type ViewState = 'loading' | 'ready' | 'error';

const TABS: { value: Tab; label: string }[] = [
  { value: 'current', label: 'Current Major Draws' },
  { value: 'history', label: 'History' },
];

export default function LoyaltyAccountPage() {
  const [tab, setTab] = useState<Tab>('current');

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
            <Sparkles className="h-3 w-3" aria-hidden /> Loyalty Entries
          </p>
          <h1 className="mt-1 text-[24px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222] sm:text-[28px]">
            Your{' '}
            <span className="bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] bg-clip-text text-transparent">
              tenure
            </span>{' '}
            history
          </h1>
        </div>
        <Link
          href="/dashboard/membership"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#6356E5] hover:text-[#5648D8]"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Back to Membership
        </Link>
      </header>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t.value
                ? 'bg-[#6356E5] text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)]'
                : 'border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#FBFAFF]'
            }`}
            aria-pressed={tab === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'current' ? <CurrentTab /> : <HistoryTab />}
    </main>
  );
}

// ─── Current tab ─────────────────────────────────────────────────────

function CurrentTab() {
  const [state, setState] = useState<ViewState>('loading');
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api.loyalty
      .summary()
      .then((r) => {
        if (cancelled) return;
        setSummary(r.data as LoyaltySummary);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [retry]);

  if (state === 'loading') return <SkeletonBlock />;
  if (state === 'error' || !summary) {
    return (
      <ErrorBanner onRetry={() => setRetry((v) => v + 1)} message="Couldn't load your loyalty summary." />
    );
  }

  if (!summary.eligible) {
    return (
      <EmptyState
        title={
          summary.reason === 'no_membership'
            ? 'Become a member to start earning'
            : 'Loyalty Entries are launching soon'
        }
        body={
          summary.reason === 'no_membership'
            ? 'Loyalty Entries are auto-applied to every Major Draw. Browse our Membership plans to start accumulating.'
            : 'Your current plan will start earning once the rollout reaches your tier.'
        }
        cta={
          summary.reason === 'no_membership'
            ? { href: '/membership', label: 'View Membership' }
            : null
        }
      />
    );
  }

  const draws = summary.currentDraws ?? [];
  // V2 spec — no aggregate total across draws (each Major Draw is an
  // independent lottery pool, summing entries misleads probability).
  // Per-draw breakdown is rendered in the draw card list below.

  if (draws.length === 0) {
    return (
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
          Current Major Draws
        </p>
        <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">
          No Major Draw is open right now
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">
          Your next Loyalty Entries will land when the next Major Draw opens.
          You&apos;re still accumulating tenure in the meantime.
        </p>
        <div className="mt-5">
          <TenureTimeline
            tenureMonths={summary.tenureMonths}
            tierLabel={summary.planName ?? undefined}
          />
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status + tenure headline. V2 spec — no aggregate "X total entries
          across N draws" line because each Major Draw is an independent
          pool; summing them misleads members about win probability. */}
      <article className="rounded-3xl border border-[#E0DAFF] bg-white p-5 shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
              Your Loyalty Entries
            </p>
            <h2 className="mt-1 text-[22px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222] sm:text-[26px]">
              Entries in{' '}
              <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-transparent">
                {draws.length}
              </span>{' '}
              {draws.length === 1 ? 'Major Draw' : 'Major Draws'}
            </h2>
            <p className="mt-1 text-[12.5px] font-semibold text-[#4B5563]">
              Month {summary.tenureMonths} · {summary.planName ?? summary.tier} ·{' '}
              <span className="capitalize">{summary.loyaltyStatus}</span> status
            </p>
          </div>
          {summary.loyaltyStatus !== 'none' && (
            <LoyaltyStatusBadge status={summary.loyaltyStatus} />
          )}
        </div>

        <div className="mt-6">
          <TenureTimeline
            tenureMonths={summary.tenureMonths}
            tierLabel={summary.planName ?? undefined}
          />
        </div>
      </article>

      {/* Per-draw breakdown cards */}
      {draws.map((d) => (
        <article
          key={d.drawId}
          className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
                {d.drawTitle}
              </p>
              <h3 className="mt-1 text-[18px] font-extrabold tracking-tight leading-[1.15] text-[#0F1222] sm:text-[20px]">
                <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-transparent">
                  {d.entries.toLocaleString('en-AU')}
                </span>{' '}
                Loyalty {d.entries === 1 ? 'Entry' : 'Entries'}
              </h3>
            </div>
            <Link
              href={`/giveaways/${d.drawId}`}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#6356E5] hover:text-[#5648D8]"
            >
              View draw <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-5">
            <EntryBreakdown rows={d.breakdown} total={d.entries} hideHeader />
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── History tab ─────────────────────────────────────────────────────

function HistoryTab() {
  const [state, setState] = useState<ViewState>('loading');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LoyaltyHistoryRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api.loyalty
      .history({ page, limit })
      .then((r) => {
        if (cancelled) return;
        const data = r.data as LoyaltyHistoryResponse;
        setRows(data.rows);
        setHasMore(data.hasMore);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [page, retry]);

  if (state === 'loading' && rows.length === 0) return <SkeletonBlock />;
  if (state === 'error') {
    return (
      <ErrorBanner
        onRetry={() => setRetry((v) => v + 1)}
        message="Couldn't load your draw history."
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No draw history yet"
        body="Once Loyalty Entries land in a Major Draw, that draw will appear here with its totals and outcome."
        cta={null}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white">
      <ul role="list" className="divide-y divide-[#EFEDF5]">
        {rows.map((r) => (
          <li key={r.drawId}>
            <Link
              href={`/giveaways/${r.drawId}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[#FBFAFF] sm:px-5 sm:py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold tracking-tight text-[#0F1222] sm:text-[15px]">
                  {r.drawTitle}
                </p>
                <p className="mt-0.5 text-[12px] text-[#667085]">
                  <span className="capitalize">{r.drawState.replace('_', ' ')}</span>
                  {' · '}
                  Last grant {new Date(r.lastGrantAt).toLocaleDateString('en-AU')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <LoyaltyEntryBadge entries={r.entries} size="sm" />
                <ChevronRight className="h-4 w-4 text-[#A0A6B5]" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-[#EFEDF5] px-4 py-3 sm:px-5">
        <span className="text-[12px] text-[#667085]">Page {page}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 1 || state === 'loading'}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-full border border-[#E7E9F2] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0F1222] transition-colors enabled:hover:bg-[#FBFAFF] disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!hasMore || state === 'loading'}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-full bg-[#6356E5] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors enabled:hover:bg-[#5648D8] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-UI ───────────────────────────────────────────────────

function SkeletonBlock() {
  return (
    <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-7">
      <div className="h-3 w-24 animate-pulse rounded-full bg-[#F4F1FB]" />
      <div className="mt-3 h-7 w-56 animate-pulse rounded-full bg-[#F4F1FB]" />
      <div className="mt-5 h-32 w-full animate-pulse rounded-2xl bg-[#FBFAFF]" />
    </article>
  );
}

function ErrorBanner({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <article className="rounded-3xl border border-[#FFE0CC] bg-[#FFF8F1] p-5 sm:p-7">
      <p className="text-[13px] font-bold text-[#0F1222]">{message}</p>
      <p className="mt-1 text-[12px] text-[#667085]">
        Usually a temporary network blip. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0F1222] transition-colors hover:bg-white/80"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
      </button>
    </article>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string } | null;
}) {
  return (
    <article className="rounded-3xl border border-[#E0DAFF] bg-gradient-to-br from-[#FBFAFF] to-[#F4F1FB] p-6 text-center sm:p-10">
      <Inbox className="mx-auto h-7 w-7 text-[#6356E5]" aria-hidden />
      <h2 className="mt-3 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[#4B5563]">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)] transition-transform hover:scale-[1.02]"
        >
          {cta.label}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </article>
  );
}
