/**
 * UNICASH Redeem Gift Cards — shared types
 *
 * One canonical shape per concept, used by both the member side
 * (catalog / detail / checkout / history / receipt) and the admin
 * console (catalog editor / queue / detail). Keep this file free of
 * runtime imports so it stays cheap to consume in any layer.
 */

export type GiftCardCategory =
  | 'Groceries'
  | 'Fuel'
  | 'Tech'
  | 'Lifestyle'
  | 'Travel'
  | 'Entertainment';

export type DeliveryType = 'instant' | 'scheduled' | 'review';

export type BrandStatus = 'live' | 'paused' | 'archived';

export type StockLevel = 'in_stock' | 'low' | 'out_of_stock';

/**
 * Gift card fulfillment provider.
 *
 *   - prezzee   PRIMARY — Prezzee Smart eGift Cards API. Covers the AU
 *               top-tier brands (Coles, Woolworths, BP, JB Hi-Fi,
 *               Bunnings, Westfield, Myer, Uber). Delivery is instant
 *               digital code via response payload + webhook confirmation.
 *               Docs: https://developers.prezzee.com
 *   - incomm    Secondary failover for selected brands when Prezzee is
 *               degraded. Same brand coverage, slower SLA, kept warm.
 *   - blackhawk Secondary failover (US-origin SKUs not in Prezzee).
 *   - givv      Tertiary — niche AU-only retailers Prezzee doesn't carry.
 *   - direct    Direct brand integrations (Netflix, Uber, etc.) where
 *               the brand publishes its own gift card API.
 */
export type ProviderId =
  | 'prezzee'
  | 'incomm'
  | 'blackhawk'
  | 'givv'
  | 'direct';

export interface Denomination {
  id: string;
  valueAud: number;
  pointsRequired: number;
  providerCostAud: number;
  stockLevel: StockLevel;
  capPerMemberPerMonth: number;
  active: boolean;
  providerSku?: string;
}

export interface Brand {
  id: string;
  name: string;
  category: GiftCardCategory;
  logoUrl: string;
  heroColor: string;
  description: string;
  terms: string;
  faq: Array<{ q: string; a: string }>;
  deliveryType: DeliveryType;
  memberOnly: boolean;
  featured: boolean;
  status: BrandStatus;
  providerId: ProviderId;
  denominations: Denomination[];
  /** Redemption count last 30d — drives "Most popular" sort. */
  popularity30d?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 2026-05-20 — 10-state machine aligned with the Prezzee-delivers
 * backend (replaces the legacy 7-state). See redemption.entity.ts.
 */
export type RedemptionStatus =
  | 'points_held'
  | 'submitting'
  | 'prezzee_pending'
  | 'completed'
  | 'pending_payment'
  | 'pending_fulfillment'
  | 'pending_delivery'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type RedemptionFailureReason =
  | 'out_of_stock'
  | 'provider_error'
  | 'network_failure'
  | 'fraud_rejected'
  | 'cap_exceeded'
  | 'invalid_request'
  /* Member-side errors (backend rejected, Points never moved). */
  | 'insufficient_points'
  | 'feature_not_enabled'
  | 'auth_required'
  | 'member_invalid';

export type RedemptionChannel = 'web' | 'ios' | 'android';

/** Delivery telemetry mirrored from Prezzee List Order Items. */
export type EmailDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'failed';

export type VoucherUrlStatus = 'pending' | 'clicked' | 'expired';

export interface FraudSignals {
  /** 0..1 — recent redemption velocity vs member baseline. */
  velocity: number;
  geo: 'AU' | 'foreign';
  deviceTrust: 'trusted' | 'new' | 'risky';
  /** 0..100 — composite score. Green ≤30, amber 31–69, red ≥70. */
  score: number;
  ipCountry?: string;
  deviceCountry?: string;
  accountAgeDays?: number;
  recentFailures1h?: number;
  recentRedemptions24h?: number;
}

export interface Redemption {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  brandId: string;
  brandName: string;
  brandLogoUrl: string;
  denominationId: string;
  valueAud: number;
  pointsDebited: number;
  quantity: number;
  status: RedemptionStatus;
  fraudSignals: FraudSignals;
  /** Prezzee order linkage (replaces legacy `providerRef`). */
  prezzeeOrderUuid?: string | null;
  prezzeeOrderNumber?: string | null;
  prezzeeOrderStatus?: string | null;
  /* Recipient — Prezzee delivers gift email here (default = member's own). */
  recipientEmail: string;
  recipientName?: string | null;
  giftMessage?: string | null;
  giftStyleCode?: string | null;
  /* Delivery telemetry — mirrored from Prezzee List Order Items. */
  emailDeliveryStatus?: EmailDeliveryStatus | null;
  voucherUrlStatus?: VoucherUrlStatus | null;
  emailDeliveredAt?: string | null;
  recipientClickedAt?: string | null;
  createdAt: string;
  completedAt: string | null;
  refundedAt: string | null;
  failureReason: RedemptionFailureReason | null;
  channel: RedemptionChannel;
  /** Provider request payload (sanitised) for admin Provider tab. */
  providerRequest?: Record<string, any>;
  providerResponse?: Record<string, any>;
  providerLatencyMs?: number;
  providerHttpStatus?: number;
}

export interface LedgerEntry {
  id: string;
  redemptionId: string;
  memberId: string;
  type: 'debit' | 'refund';
  points: number;
  audCostEx: number;
  marginAud: number;
  at: string;
  reversedBy: string | null;
}

export interface ProviderHealth {
  id: ProviderId;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  successRate24h: number;
  avgLatencyMs: number;
  lastWebhookAt: string;
  failoverPriority: number;
  brands: string[];
  webhookUrl: string;
  retryPolicy: { maxAttempts: number; backoffMs: number };
  /** 24 hourly buckets of success-rate %, latest last. */
  successSeries24h: number[];
}

export interface ActivityLogEntry {
  id: string;
  at: string;
  adminId: string;
  adminName: string;
  action: string;
  reason: string;
  targetId: string;
  diff?: Record<string, { from: any; to: any }>;
}

/** Member's reward balances — used by checkout cost calculator. */
export interface MemberBalance {
  pointsAvailable: number;
  pointsHeld: number;
  fuelRewardsAud: number;
  isMember: boolean;
}
