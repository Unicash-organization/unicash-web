/**
 * EntryBreakdown — vertical list of "where these N Loyalty Entries came from".
 *
 * Groups subsource rows by category (tenure / anniversary / streak / admin /
 * restore) and shows the running entry count per group. The header row is the
 * grand total. Used in:
 *   - /dashboard/membership loyalty card (expanded by default)
 *   - /giveaways/:drawId panel (collapsible)
 *   - /account/loyalty current-draw tab
 *
 * Pure presentational. Empty state covered: when `rows` is `[]`, renders the
 * "no Loyalty Entries yet" affordance with a soft purple stripe.
 */

'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  LoyaltyBreakdownRow,
  SUBSOURCE_GROUP,
  SUBSOURCE_LABELS,
} from './types';

interface Props {
  rows: LoyaltyBreakdownRow[];
  /** Total — should equal sum(row.entries) but caller-supplied for trust. */
  total: number;
  /** Show as collapsed by default. Click row to expand. */
  defaultCollapsed?: boolean;
  /** Hide the header total row (used inside cards that already show it). */
  hideHeader?: boolean;
}

const GROUP_LABEL: Record<string, string> = {
  tenure: 'Tenure',
  anniversary: 'Anniversary',
  streak: 'Streak',
  admin: 'Manual',
  restore: 'Restored',
};

// Soft purple stripe + matching dot. Stays calm — no neon, no urgency.
const GROUP_STYLE: Record<
  string,
  { stripe: string; dot: string; text: string }
> = {
  tenure: { stripe: 'bg-[#F4F1FB]', dot: 'bg-[#6356E5]', text: 'text-[#6356E5]' },
  anniversary: {
    stripe: 'bg-[#FFF6E5]',
    dot: 'bg-[#FFC85D]',
    text: 'text-[#9A6A00]',
  },
  streak: {
    stripe: 'bg-[#FBFAFF]',
    dot: 'bg-[#8B7BFF]',
    text: 'text-[#5648D8]',
  },
  admin: { stripe: 'bg-[#FBFAFF]', dot: 'bg-[#667085]', text: 'text-[#667085]' },
  restore: {
    stripe: 'bg-[#E8F8F0]',
    dot: 'bg-[#10B981]',
    text: 'text-[#0F8A5C]',
  },
};

export function EntryBreakdown({
  rows,
  total,
  defaultCollapsed = false,
  hideHeader = false,
}: Props) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);

  // Group rows. Each group keeps its rows in the order returned (server orders
  // by entries DESC) so the dominant mechanic shows first.
  const groups = useMemo(() => {
    const map = new Map<string, { entries: number; rows: LoyaltyBreakdownRow[] }>();
    for (const r of rows) {
      const g = SUBSOURCE_GROUP[r.subsource] ?? 'tenure';
      if (!map.has(g)) map.set(g, { entries: 0, rows: [] });
      const entry = map.get(g)!;
      entry.entries += r.entries;
      entry.rows.push(r);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].entries - a[1].entries)
      .map(([group, payload]) => ({ group, ...payload }));
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] p-4 text-center">
        <p className="text-[13px] font-semibold text-[#0F1222]">
          No Loyalty Entries yet
        </p>
        <p className="mt-1 text-[12px] text-[#667085]">
          Your first entries land on the next monthly accrual.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E9F2] bg-white">
      {!hideHeader && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-[#FBFAFF]"
          aria-expanded={expanded}
        >
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">
              Total
            </span>
            <span className="block text-[18px] font-extrabold tracking-tight text-[#0F1222]">
              {total.toLocaleString('en-AU')}{' '}
              <span className="text-[14px] font-semibold text-[#4B5563]">
                Loyalty {total === 1 ? 'Entry' : 'Entries'}
              </span>
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[#667085] transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      )}

      {expanded && (
        <ul role="list" className="divide-y divide-[#EFEDF5] border-t border-[#EFEDF5]">
          {groups.map(({ group, entries: groupTotal, rows: groupRows }) => {
            const style = GROUP_STYLE[group];
            return (
              <li key={group}>
                <div className={`px-4 py-2 ${style.stripe}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]">
                      <span
                        className={`inline-block h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                        aria-hidden
                      />
                      <span className={style.text}>{GROUP_LABEL[group]}</span>
                    </span>
                    <span className="text-[13px] font-extrabold tabular-nums text-[#0F1222]">
                      +{groupTotal}
                    </span>
                  </div>
                </div>
                <ul role="list" className="px-4 py-1.5">
                  {groupRows.map((r) => (
                    <li
                      key={r.subsource}
                      className="flex items-center justify-between py-1.5 text-[13px]"
                    >
                      <span className="text-[#4B5563]">
                        {SUBSOURCE_LABELS[r.subsource] ?? r.subsource}
                        {r.grantCount > 1 && (
                          <span className="ml-1 text-[11px] text-[#A0A6B5]">
                            ×{r.grantCount}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums text-[#0F1222]">
                        +{r.entries}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
