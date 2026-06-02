/**
 * LoyaltyCard — dashboard's "Loyalty Entries" panel.
 *
 * 2026-05-18 redesign: collapsed the per-draw loop (which rendered 13 nearly
 * identical breakdowns for an active member) into a single aggregated view:
 *   1. Hero — total entries today + tier badge
 *   2. Three-stat breakdown — Tenure / Anniversary / Streak earned so far
 *   3. Anniversary milestone timeline — earned vs upcoming, with bonus values
 *   4. Streak milestone timeline
 *   5. Projection slider — drag a month between 0 and 60 to see the entries
 *      you'd have at that tenure point. Educational; helps members weigh the
 *      long-term value of staying active.
 *
 * Self-contained: fetches its own data via `api.loyalty.summary()`.
 *
 * States covered:
 *   - loading            → skeleton card
 *   - error              → soft retry banner
 *   - not-eligible       → upgrade nudge
 *   - eligible           → new aggregated layout (independent of "draw open"
 *                          state — the per-draw cards lived to confirm draws
 *                          were active, which the dedicated /dashboard/entries
 *                          page already does much better)
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { LoyaltyStatusBadge } from './LoyaltyStatusBadge';
import { LoyaltySummary, MilestoneSchedule, SUBSOURCE_GROUP, LoyaltySubsource } from './types';

type LoadState = 'loading' | 'error' | 'ready';

const ANNIVERSARY_MILESTONES = [3, 6, 12, 18, 24] as const;
const STREAK_MILESTONES = [12, 24, 36] as const;
/** Slider range — 0 to 60 months covers all baseline milestones + yearly recurring. */
const PROJECT_MAX_MONTHS = 60;

function formatTenureLabel(tier: string | null, planName: string | null) {
  if (planName) return planName;
  if (tier) return tier.replace('uni_', 'Uni').replace('_', ' ');
  return 'Membership';
}

/**
 * Stripe billing cycle convention: signup day = cycle 1 paid. So at
 * tenureMonths=0 the member has already paid for 1 cycle and earned
 * `monthlyAccrual` tenure entries. Use this everywhere the projection
 * needs to mirror what BE actually grants via Stripe-cycle webhooks.
 */
function tenureEntriesAt(monthlyAccrual: number, tenureMonths: number): number {
  if (monthlyAccrual <= 0) return 0;
  const cyclesPaid = Math.max(0, tenureMonths) + 1; // +1 = signup cycle
  return monthlyAccrual * cyclesPaid;
}

/**
 * Sum of anniversary bonuses earned by month `m`, given the schedule.
 * Includes the recurring yearly bonus that fires every 12 months once
 * tenure ≥ 36 (so at month 36 the yearly fires once; 48 → twice; etc).
 */
function sumAnniversariesAt(schedule: MilestoneSchedule | null, m: number): number {
  if (!schedule) return 0;
  let total = 0;
  for (const ms of ANNIVERSARY_MILESTONES) {
    if (m >= ms) total += schedule.anniversary[String(ms) as keyof typeof schedule.anniversary] as number;
  }
  if (m >= 36) {
    const yearlies = Math.floor((m - 24) / 12); // 36→1, 48→2, 60→3
    total += yearlies * schedule.anniversary.yearlyRecurringAfter24;
  }
  return total;
}

function sumStreakAt(schedule: MilestoneSchedule | null, m: number): number {
  if (!schedule) return 0;
  let total = 0;
  for (const ms of STREAK_MILESTONES) {
    if (m >= ms) total += schedule.streak[String(ms) as keyof typeof schedule.streak] as number;
  }
  return total;
}

/**
 * When an open Major Draw exists, the breakdown rows in
 * currentDraws[0] are the source of truth — derived from real
 * loyalty_grants ledger writes. Sum them by SUBSOURCE_GROUP so the
 * three stat cards (Tenure / Anniversary / Streak) reflect what BE
 * actually granted, not a FE formula that can drift on edge cases
 * (signup cycle, mid-period upgrade, admin grant, etc).
 */
function deriveBreakdownFromLedger(summary: LoyaltySummary): {
  tenure: number;
  anniversary: number;
  streak: number;
  total: number;
} | null {
  const draw = summary.currentDraws?.[0];
  if (!draw || !Array.isArray(draw.breakdown) || draw.breakdown.length === 0) {
    return null;
  }
  let tenure = 0;
  let anniversary = 0;
  let streak = 0;
  for (const row of draw.breakdown) {
    const group = SUBSOURCE_GROUP[row.subsource as LoyaltySubsource];
    if (group === 'tenure') tenure += row.entries;
    else if (group === 'anniversary') anniversary += row.entries;
    else if (group === 'streak') streak += row.entries;
    // 'admin' and 'restore' fold into tenure for display — they're rare
    // and any place we'd show them separately would noise the card.
    else if (group === 'admin' || group === 'restore') tenure += row.entries;
  }
  return { tenure, anniversary, streak, total: tenure + anniversary + streak };
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
  return <EligibleLoyaltyCard summary={summary} />;
}

/**
 * Active eligible state — extracted so the projection slider's local state
 * lives in a child that only mounts once the API resolves.
 */
function EligibleLoyaltyCard({ summary }: { summary: LoyaltySummary }) {
  const tierLabel = formatTenureLabel(summary.tier, summary.planName);
  const schedule = summary.milestoneSchedule;

  // Source-of-truth precedence:
  //   1. Ledger sums from currentDraws[0].breakdown — reflects actual
  //      loyalty_grants writes (signup snapshot, monthly cycles, anniv,
  //      streak, admin grants). New members at month 0 still have a
  //      `draw_open_snapshot` row of `monthlyAccrual` entries here.
  //   2. Predictive formula — if no Major Draw is open yet, fall back
  //      to the projection so the card isn't an awkward "0 entries"
  //      for an active member.
  const fromLedger = deriveBreakdownFromLedger(summary);
  const tenureEarned = fromLedger
    ? fromLedger.tenure
    : tenureEntriesAt(summary.monthlyAccrual, summary.tenureMonths);
  const anniversaryEarned = fromLedger
    ? fromLedger.anniversary
    : sumAnniversariesAt(schedule, summary.tenureMonths);
  const streakEarned = fromLedger
    ? fromLedger.streak
    : sumStreakAt(schedule, summary.streakMonths);
  const totalEarned = fromLedger
    ? fromLedger.total
    : tenureEarned + anniversaryEarned + streakEarned;

  // Projection slider — initialized to "now"; member drags to see future.
  const [projectMonth, setProjectMonth] = useState<number>(summary.tenureMonths);

  // For projection: Stripe-cycle math (signup = cycle 1, every 30 days
  // adds 1 cycle). Unbroken streak assumed (caveat shown in UI).
  const projectedTenure = tenureEntriesAt(summary.monthlyAccrual, projectMonth);
  const projectedAnniv = sumAnniversariesAt(schedule, projectMonth);
  const projectedStreak = sumStreakAt(schedule, projectMonth);
  const projectedTotal = projectedTenure + projectedAnniv + projectedStreak;

  return (
    <article className="rounded-3xl border border-[#E0DAFF] bg-white p-5 shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)] sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
            <Sparkles className="h-3 w-3" aria-hidden />
            Loyalty Entries · {tierLabel}
          </p>
          <h2 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight text-[#0F1222] sm:text-[22px]">
            Your entries in every Major Draw
          </h2>
        </div>
        {summary.loyaltyStatus !== 'none' && (
          <LoyaltyStatusBadge status={summary.loyaltyStatus} />
        )}
      </div>

      {/* Today's total — big gold block */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFF6DA] to-[#FFE2B0] p-4 ring-1 ring-[#FFC85D]/50 sm:p-5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#9C5410]">
          Your entries today
        </p>
        <p className="mt-1 text-[36px] font-extrabold leading-none tracking-tight text-[#7C5A00] tabular-nums sm:text-[44px]">
          {totalEarned.toLocaleString()}
        </p>
        <p className="mt-1 text-[12px] text-[#9C5410]/85">
          Applied to every open Major Draw — Month {summary.tenureMonths + 1} of {tierLabel} tenure.
        </p>
      </div>

      {/* Projection scrubber */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E0DAFF] bg-gradient-to-br from-[#FBFAFF] to-[#F4F1FB] p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">
            See your entries grow
          </p>
          <p className="text-[11px] text-[#667085]">
            Drag to see how many entries you’ll have the longer you stay a member.
          </p>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-[#667085]">Month</span>
          <span className="text-[24px] font-extrabold tabular-nums text-[#6356E5] sm:text-[28px]">
            {projectMonth + 1}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={PROJECT_MAX_MONTHS}
          step={1}
          value={projectMonth}
          onChange={(e) => setProjectMonth(parseInt(e.target.value, 10) || 0)}
          aria-label="Projected tenure month"
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E0DAFF] accent-[#6356E5] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6356E5] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_-2px_rgba(99,86,229,0.6)] [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white"
        />

        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-[#667085]">
          <span>Start</span>
          <span>Year 1</span>
          <span>Year 2</span>
          <span>Year 3</span>
          <span>Year 4</span>
          <span>Year 5</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <ProjectionStat label="Tenure" value={projectedTenure} />
          <ProjectionStat label="Anniversary" value={projectedAnniv} tone="gold" />
          <ProjectionStat label="Streak" value={projectedStreak} />
        </div>

        <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-[#E0DAFF]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6356E5]">
              Projected total at month {projectMonth + 1}
            </p>
            {projectMonth !== summary.tenureMonths && (
              <p className="text-[11px] text-[#667085]">
                {projectedTotal > totalEarned ? '+' : ''}
                {(projectedTotal - totalEarned).toLocaleString()} vs today
              </p>
            )}
          </div>
          <p className="mt-0.5 text-[24px] font-extrabold tracking-tight text-[#0F1222] tabular-nums sm:text-[28px]">
            {projectedTotal.toLocaleString()} entries
          </p>
        </div>

        <p className="mt-3 text-[10.5px] leading-relaxed text-[#667085]">
          This is an estimate if you stay an active {tierLabel} member. If you pause or cancel,
          your entries stop growing until you start again.
        </p>
      </div>
    </article>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function ProjectionStat({
  label,
  value,
  tone = 'purple',
}: {
  label: string;
  value: number;
  tone?: 'purple' | 'gold';
}) {
  const accent = tone === 'gold' ? 'text-[#9C5410]' : 'text-[#6356E5]';
  return (
    <div className="rounded-xl bg-white p-2.5 ring-1 ring-[#E0DAFF]">
      <p className={`text-[9.5px] font-bold uppercase tracking-[0.1em] ${accent}`}>{label}</p>
      <p className="mt-0.5 text-[15px] font-extrabold leading-tight tracking-tight text-[#0F1222] tabular-nums">
        +{value.toLocaleString()}
      </p>
    </div>
  );
}

