/**
 * LoyaltyCard — dashboard's "Loyalty Entries" panel.
 *
 * Self-contained: fetches its own data via `api.loyalty.summary()` so the
 * /dashboard/membership page just mounts it without prop-drilling.
 *
 * States covered (spec §E.3):
 *   - loading            → skeleton card
 *   - error              → soft retry banner
 *   - not-eligible       → upgrade nudge (no Membership / plan flag off)
 *   - no-major-draw-open → "no Major Draw right now" copy + next-accrual hint
 *   - eligible-empty     → eligible but 0 entries this draw yet (rare on M0)
 *   - eligible-with-data → headline number + breakdown + tenure timeline +
 *                          next-accrual + next-anniversary countdown
 *
 * Talks only to the LoyaltyEntryBadge / TenureTimeline / EntryBreakdown
 * subcomponents. No fancy state library — `useEffect + useState` keeps it
 * legible.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { LoyaltyEntryBadge } from './LoyaltyEntryBadge';
import { LoyaltyStatusBadge } from './LoyaltyStatusBadge';
import { TenureTimeline } from './TenureTimeline';
import { EntryBreakdown } from './EntryBreakdown';
import { LoyaltySummary } from './types';

type LoadState = 'loading' | 'error' | 'ready';

function formatTenureLabel(tier: string | null, planName: string | null) {
  if (planName) return planName;
  if (tier) return tier.replace('uni_', 'Uni').replace('_', ' ');
  return 'Membership';
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function LoyaltyCard() {
  const [state, setState] = useState<LoadState>('loading');
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [retryToken, setRetryToken] = useState(0);

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
      .catch((err) => {
        if (cancelled) return;
        console.error('[LoyaltyCard] summary fetch failed', err);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  // ─── Skeleton ──────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7">
        <div className="h-3 w-24 animate-pulse rounded-full bg-[#F4F1FB]" />
        <div className="mt-3 h-6 w-44 animate-pulse rounded-full bg-[#F4F1FB]" />
        <div className="mt-5 h-9 w-32 animate-pulse rounded-full bg-[#F4F1FB]" />
        <div className="mt-4 h-24 w-full animate-pulse rounded-2xl bg-[#FBFAFF]" />
      </article>
    );
  }

  // ─── Error / retry ─────────────────────────────────────────────────
  if (state === 'error' || !summary) {
    return (
      <article className="rounded-3xl border border-[#FFE0CC] bg-[#FFF8F1] p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#B7791F]" aria-hidden />
          <p className="text-[13px] font-bold text-[#0F1222]">
            Couldn&apos;t load your Loyalty Entries
          </p>
        </div>
        <p className="mt-1 text-[12px] text-[#667085]">
          This is usually a temporary network blip. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => setRetryToken((v) => v + 1)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0F1222] transition-colors hover:bg-white/80"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </button>
      </article>
    );
  }

  // ─── Not eligible ──────────────────────────────────────────────────
  if (!summary.eligible) {
    const reason = summary.reason;
    return (
      <article className="rounded-3xl border border-[#E0DAFF] bg-gradient-to-br from-[#FBFAFF] to-[#F4F1FB] p-5 sm:p-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
          Loyalty Entries
        </p>
        <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">
          {reason === 'no_membership'
            ? 'Become a member to start earning'
            : 'Loyalty Entries are launching soon'}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">
          {reason === 'no_membership'
            ? 'Loyalty Entries are auto-applied to every Major Draw — the longer you stay a member, the more entries you accumulate.'
            : 'Your current plan will start earning Loyalty Entries once the rollout reaches your tier.'}
        </p>
        {reason === 'no_membership' && (
          <Link
            href="/membership"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)] transition-transform hover:scale-[1.02]"
          >
            View Membership <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </article>
    );
  }

  // ─── Eligible ──────────────────────────────────────────────────────
  const tierLabel = formatTenureLabel(summary.tier, summary.planName);
  const accrualDays = daysUntil(summary.nextAccrualAt);
  const anniversaryDays = summary.nextAnniversary
    ? daysUntil(summary.nextAnniversary.at)
    : null;
  // Multi-draw: each open Major Draw is its own grant cycle. Render an
  // aggregate headline (total entries) + per-draw breakdown card list.
  const draws = summary.currentDraws ?? [];
  const hasDraws = draws.length > 0;
  const totalEntries = summary.totalEntriesAcrossDraws ?? 0;
  // "First cycle" state — member is eligible and at least one Major Draw is
  // open, but no entries have accrued yet (tenure = 0 OR next-accrual still
  // pending). Showing 4× "No Loyalty Entries yet" cards plus a "0 across N"
  // headline is noise; collapse to a calm tenure + countdown view instead.
  const isEmptyCycle = hasDraws && totalEntries === 0;

  return (
    <article className="rounded-3xl border border-[#E0DAFF] bg-white p-5 shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)] sm:p-7">
      {/* Header — full version only when user actually has entries to brag about,
          or when no Major Draw is currently open (paused state needs explanation). */}
      {!isEmptyCycle && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
              <Sparkles className="h-3 w-3" aria-hidden />
              Loyalty Entries · {tierLabel}
            </p>
            <h2 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">
              {hasDraws ? (
                <>
                  <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-transparent">
                    {totalEntries.toLocaleString('en-AU')}
                  </span>{' '}
                  across {draws.length}{' '}
                  {draws.length === 1 ? 'Major Draw' : 'Major Draws'}
                </>
              ) : (
                'Earning is paused'
              )}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {summary.loyaltyStatus !== 'none' && (
              <LoyaltyStatusBadge status={summary.loyaltyStatus} />
            )}
            {hasDraws && (
              <LoyaltyEntryBadge entries={totalEntries} drawTitle={null} />
            )}
          </div>
        </div>
      )}

      {/* No major draw open */}
      {!hasDraws && (
        <div className="mt-4 rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-4">
          <p className="text-[13px] font-semibold text-[#0F1222]">
            No Major Draw is open right now.
          </p>
          <p className="mt-1 text-[12px] text-[#667085]">
            Your next Loyalty Entries will land when the next Major Draw opens.
            You&apos;ll still accumulate tenure in the meantime.
          </p>
        </div>
      )}

      {/* Per-draw cards — each open Major Draw is its own grant cycle.
          Skipped in `isEmptyCycle`: showing "No Loyalty Entries yet" 4× is noise. */}
      {hasDraws && !isEmptyCycle && (
        <div className="mt-5 space-y-4">
          {draws.map((d) => (
            <div
              key={d.drawId}
              className="rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">
                  {d.drawTitle}
                </p>
                <LoyaltyEntryBadge entries={d.entries} size="sm" />
              </div>
              <div className="mt-3">
                <EntryBreakdown rows={d.breakdown} total={d.entries} hideHeader />
              </div>
            </div>
          ))}
          <TenureTimeline tenureMonths={summary.tenureMonths} tierLabel={tierLabel} />
        </div>
      )}

      {/* Empty-cycle layout — just the tenure progress so the user sees
          their current state without the noisy per-draw "0 entries" cards. */}
      {isEmptyCycle && (
        <TenureTimeline tenureMonths={summary.tenureMonths} tierLabel={tierLabel} />
      )}

      {/* Next accrual + anniversary hints */}
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {accrualDays !== null && (
          <HintTile
            label="Next monthly accrual"
            value={
              accrualDays === 0 ? 'Today' : `In ${accrualDays} day${accrualDays > 1 ? 's' : ''}`
            }
            delta={`+${summary.monthlyAccrual} entries`}
          />
        )}
        {summary.nextAnniversary && anniversaryDays !== null && (
          <HintTile
            label={`Next anniversary · ${summary.nextAnniversary.milestoneMonths} month`}
            value={
              anniversaryDays === 0
                ? 'Today'
                : `In ${anniversaryDays} day${anniversaryDays > 1 ? 's' : ''}`
            }
            delta={`+${summary.nextAnniversary.bonusEntries} bonus entries`}
            tone="gold"
          />
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href="/account/loyalty"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#6356E5] hover:text-[#5648D8]"
        >
          View full history <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function HintTile({
  label,
  value,
  delta,
  tone = 'purple',
}: {
  label: string;
  value: string;
  delta: string;
  tone?: 'purple' | 'gold';
}) {
  const palette =
    tone === 'gold'
      ? {
          bg: 'bg-[#FFF6E5]',
          border: 'border-[#FCE6B5]',
          eyebrow: 'text-[#9A6A00]',
        }
      : {
          bg: 'bg-[#FBFAFF]',
          border: 'border-[#E7E9F2]',
          eyebrow: 'text-[#6356E5]',
        };
  return (
    <div className={`rounded-2xl border ${palette.border} ${palette.bg} px-3 py-2.5`}>
      <p className={`text-[10.5px] font-bold uppercase tracking-[0.12em] ${palette.eyebrow}`}>
        {label}
      </p>
      <p className="mt-1 text-[14px] font-extrabold tracking-tight text-[#0F1222]">{value}</p>
      <p className="mt-0.5 text-[11.5px] font-semibold text-[#4B5563]">{delta}</p>
    </div>
  );
}
