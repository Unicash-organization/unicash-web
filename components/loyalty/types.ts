/**
 * Shared types for the Sprint 2 Loyalty UI.
 * Mirror the backend DTOs returned by /api/me/loyalty/*.
 */

export type LoyaltyStatus = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export type LoyaltySubsource =
  | 'signup_bonus'
  | 'tier_quota'
  | 'tenure_monthly'
  | 'upgrade_delta'
  | 'anniversary_3m'
  | 'anniversary_6m'
  | 'anniversary_12m'
  | 'anniversary_18m'
  | 'anniversary_24m'
  | 'anniversary_yearly'
  | 'streak_12'
  | 'streak_24'
  | 'streak_36'
  | 'admin_grant'
  | 'restore_full'
  | 'restore_partial';

export interface LoyaltyBreakdownRow {
  subsource: LoyaltySubsource;
  entries: number;
  grantCount: number;
}

export interface LoyaltyCurrentDraw {
  drawId: string;
  drawTitle: string;
  drawState: string;
  entries: number;
  breakdown: LoyaltyBreakdownRow[];
}

export interface LoyaltyNextAnniversary {
  milestoneMonths: number;
  at: string; // ISO
  bonusEntries: number;
}

export interface LoyaltySummary {
  eligible: boolean;
  reason: 'no_membership' | 'plan_disabled' | null;
  tier: string | null;
  planName: string | null;
  tenureMonths: number;
  streakMonths: number;
  loyaltyStatus: LoyaltyStatus;
  monthlyAccrual: number;
  /** Per-draw snapshot, one entry per currently-OPEN Major Draw. */
  currentDraws: LoyaltyCurrentDraw[];
  /** Sum of entries across every open Major Draw. */
  totalEntriesAcrossDraws: number;
  /** @deprecated Back-compat alias for first/newest open draw. Prefer currentDraws[0]. */
  currentDraw: LoyaltyCurrentDraw | null;
  nextAccrualAt: string | null;
  nextAnniversary: LoyaltyNextAnniversary | null;
}

export interface LoyaltyDrawDetail {
  drawId: string;
  entries: number;
  breakdown: LoyaltyBreakdownRow[];
}

export interface LoyaltyHistoryRow {
  drawId: string;
  drawTitle: string;
  drawState: string;
  entries: number;
  grantCount: number;
  firstGrantAt: string;
  lastGrantAt: string;
}

export interface LoyaltyHistoryResponse {
  page: number;
  limit: number;
  hasMore: boolean;
  rows: LoyaltyHistoryRow[];
}

// ─── UX helpers ────────────────────────────────────────────────────

/**
 * Human-readable label for a subsource. Premium, calm copy — never
 * "ticket"/"raffle"/"jackpot". See feedback_unicash_terminology memory.
 */
export const SUBSOURCE_LABELS: Record<LoyaltySubsource, string> = {
  signup_bonus: 'Sign-up bonus',
  tier_quota: 'Tier quota',
  tenure_monthly: 'Monthly tenure',
  upgrade_delta: 'Tier upgrade bonus',
  anniversary_3m: '3-month anniversary',
  anniversary_6m: '6-month anniversary',
  anniversary_12m: '1-year anniversary',
  anniversary_18m: '18-month anniversary',
  anniversary_24m: '2-year anniversary',
  anniversary_yearly: 'Yearly anniversary',
  streak_12: '12-month unbroken streak',
  streak_24: '2-year unbroken streak',
  streak_36: '3-year unbroken streak',
  admin_grant: 'Manual grant',
  restore_full: 'Restored — full',
  restore_partial: 'Restored — partial',
};

/** Grouping for the EntryBreakdown UI (badge color + label). */
export const SUBSOURCE_GROUP: Record<
  LoyaltySubsource,
  'tenure' | 'anniversary' | 'streak' | 'admin' | 'restore'
> = {
  signup_bonus: 'tenure',
  tier_quota: 'tenure',
  tenure_monthly: 'tenure',
  upgrade_delta: 'tenure',
  anniversary_3m: 'anniversary',
  anniversary_6m: 'anniversary',
  anniversary_12m: 'anniversary',
  anniversary_18m: 'anniversary',
  anniversary_24m: 'anniversary',
  anniversary_yearly: 'anniversary',
  streak_12: 'streak',
  streak_24: 'streak',
  streak_36: 'streak',
  admin_grant: 'admin',
  restore_full: 'restore',
  restore_partial: 'restore',
};
