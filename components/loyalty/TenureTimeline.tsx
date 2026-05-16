/**
 * TenureTimeline — horizontal month dots from M0 to (tenureMonths + a few).
 *
 * Layout decisions:
 *   - Desktop (≥sm): full row of dots, anniversary milestones rendered as
 *     filled gold stars instead of dots.
 *   - Mobile (<sm): collapses to a compact pill "Month 7 of UniMax tenure"
 *     with a tap-to-expand toggle. The expanded view scrolls horizontally
 *     using `snap-x` so 36-month-plus members can swipe through.
 *
 * Purely presentational — no fetches.
 */

'use client';

import { useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';

interface Props {
  tenureMonths: number;
  /** Optional emphasis word above the timeline (e.g. "UniMax"). */
  tierLabel?: string;
  /** Anniversary milestones to highlight on the bar. Defaults to the spec set. */
  milestones?: number[];
}

const DEFAULT_MILESTONES = [3, 6, 12, 18, 24, 36];

export function TenureTimeline({
  tenureMonths,
  tierLabel,
  milestones = DEFAULT_MILESTONES,
}: Props) {
  // Render up to (current month + 3) so the user sees the next milestone landing.
  const lastMonth = Math.max(tenureMonths + 3, 12);
  const months = Array.from({ length: lastMonth + 1 }, (_, i) => i);
  const milestoneSet = new Set(milestones);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <div className="w-full">
      {/* Mobile compact view */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-full border border-[#E7E9F2] bg-white px-4 py-2 text-left text-[13px] font-semibold text-[#0F1222] transition-colors hover:bg-[#FBFAFF]"
          aria-expanded={mobileExpanded}
        >
          <span>
            Month <span className="font-extrabold text-[#6356E5]">{tenureMonths}</span>
            {tierLabel ? ` · ${tierLabel} tenure` : ' of tenure'}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${mobileExpanded ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {mobileExpanded && (
          <div className="mt-3 -mx-1 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
            <TimelineDots
              months={months}
              tenureMonths={tenureMonths}
              milestoneSet={milestoneSet}
            />
          </div>
        )}
      </div>

      {/* Desktop full view */}
      <div className="hidden sm:block">
        {tierLabel && (
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#667085]">
            {tierLabel} tenure
          </p>
        )}
        <div className="overflow-x-auto pb-2">
          <TimelineDots
            months={months}
            tenureMonths={tenureMonths}
            milestoneSet={milestoneSet}
          />
        </div>
      </div>
    </div>
  );
}

function TimelineDots({
  months,
  tenureMonths,
  milestoneSet,
}: {
  months: number[];
  tenureMonths: number;
  milestoneSet: Set<number>;
}) {
  return (
    <ol className="flex min-w-max items-center gap-1.5 sm:gap-2" role="list">
      {months.map((m) => {
        const reached = m <= tenureMonths;
        const isMilestone = milestoneSet.has(m);
        const isCurrent = m === tenureMonths;

        if (isMilestone) {
          return (
            <li
              key={m}
              className="flex flex-col items-center gap-1 snap-start"
              aria-label={`Month ${m} milestone${reached ? ' (reached)' : ''}`}
            >
              <Star
                className={`h-4 w-4 sm:h-[18px] sm:w-[18px] ${
                  reached
                    ? 'fill-[#FFC85D] text-[#FFC85D]'
                    : 'fill-transparent text-[#E7E9F2]'
                }`}
                aria-hidden
              />
              <span
                className={`text-[10px] font-bold ${
                  reached ? 'text-[#1A1432]' : 'text-[#A0A6B5]'
                }`}
              >
                {m}m
              </span>
            </li>
          );
        }

        return (
          <li
            key={m}
            className="flex flex-col items-center gap-1 snap-start"
            aria-label={`Month ${m}${isCurrent ? ' (current)' : ''}`}
          >
            <span
              className={`block rounded-full transition-colors ${
                isCurrent
                  ? 'h-3 w-3 bg-[#6356E5] ring-2 ring-[#E0DAFF]'
                  : reached
                    ? 'h-2 w-2 bg-[#8B7BFF]'
                    : 'h-2 w-2 bg-[#E7E9F2]'
              }`}
            />
            <span
              className={`text-[10px] font-medium tabular-nums ${
                isCurrent
                  ? 'font-bold text-[#6356E5]'
                  : reached
                    ? 'text-[#4B5563]'
                    : 'text-[#A0A6B5]'
              }`}
            >
              {m}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
