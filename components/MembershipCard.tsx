'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

/* -----------------------------------------------------------------------
   Types — preserved from existing implementation. featuresConfig is the
   backend source of truth; legacy fields (grandPrizeEntriesPerPeriod,
   freeCreditsPerPeriod) are still accepted as fallback. DO NOT modify.
----------------------------------------------------------------------- */

interface PlanFeature {
  type: 'grand_draw_entries' | 'free_credits' | 'early_access' | 'support' | 'access' | 'text' | 'comparison';
  label: string;
  value?: number | string;
  unit?: string;
  description?: string;
  subFeatures?: PlanFeature[];
  icon?: string;
}

interface MembershipCardProps {
  /** When set with onLandingEnter, replaces default CTAs with a single "Enter now" (e.g. membership landing page). */
  landingEnterMode?: boolean;
  onLandingEnter?: (plan: MembershipCardProps['plan']) => void;
  plan: {
    id: string;
    name: string;
    description?: string;
    priceMonthly: number;
    tier: string;
    badgeText?: string;
    badgeType?: string;
    featuresConfig?: {
      features: PlanFeature[];
      badge?: { text: string; type: string };
    };
    /* Legacy fields — retained for backend compatibility */
    freeCreditsPerPeriod?: number;
    grandPrizeEntriesPerPeriod?: number;
  };
  membership?: any;
  actionLoading?: string | null;
  onUpgradeDowngrade?: (planId: string) => void;
  showUpgradeConfirm?: boolean;
  showDowngradeConfirm?: boolean;
}

/* -----------------------------------------------------------------------
   v4 visual helpers
----------------------------------------------------------------------- */

const tierMeta = (tier: string) => {
  switch (tier) {
    case 'uni_one':
      return { label: 'Silver', icon: 'medal' };
    case 'uni_plus':
      return { label: 'Gold', icon: 'trophy' };
    case 'uni_max':
      return { label: 'Platinum', icon: 'crown' };
    default:
      return { label: '', icon: 'medal' };
  }
};

/* Tier icons — inline SVGs (no extra deps). All accept className */
const TierIcon = ({ name, className = '' }: { name: string; className?: string }) => {
  if (name === 'trophy') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
        <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    );
  }
  if (name === 'crown') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
        <path d="M5 21h14" />
      </svg>
    );
  }
  /* medal */
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" />
      <path d="M12 18v-2h-.5" />
    </svg>
  );
};

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* Tier-specific perks — sourced from UNICASH homepage v4 preview, locked copy.
   ** ** markers are rendered as <strong> to emphasize the key value of each line. */
const TIER_PERKS: Record<string, string[]> = {
  uni_one: [
    'Earn Points from eligible **everyday receipts**',
    'Earn **boosted Points** from eligible fuel receipts',
    'Add Point Boosters anytime',
    'Gift Card redemption from **20,000 Points**',
    'Cancel anytime',
  ],
  uni_plus: [
    'Earn **1 Point per $1** from eligible receipts',
    'Earn **2 Points per $1** from eligible fuel receipts',
    '**Better monthly value** for active members',
    'Access selected **exclusive Bonus Draws**',
    'Gift Card redemption from **20,000 Points**',
    'Cancel anytime',
  ],
  uni_max: [
    'Highest receipt earn rate · **1.5 Points per $1**',
    'Highest fuel earn rate · **3 Points per $1**',
    '**24-hour early access** to selected Bonus Draws',
    '**Priority support** for top-tier members',
    'Best option for **maximum monthly value**',
    'Cancel anytime',
  ],
};

/* Pull headline stats out of features so we can render them in a stats panel.
   Falls back to legacy plan.grandPrizeEntriesPerPeriod / plan.freeCreditsPerPeriod.
   Perks come from TIER_PERKS (canonical v4 copy) with API-features as fallback. */
function extractStats(plan: MembershipCardProps['plan']) {
  const features = plan.featuresConfig?.features || [];
  const drawFeat = features.find((f) => f.type === 'grand_draw_entries');
  const pointsFeat = features.find((f) => f.type === 'free_credits');

  const drawEntries =
    typeof drawFeat?.value === 'number' ? drawFeat.value :
    typeof plan.grandPrizeEntriesPerPeriod === 'number' ? plan.grandPrizeEntriesPerPeriod : null;

  const monthlyPoints =
    typeof pointsFeat?.value === 'number' ? pointsFeat.value :
    typeof plan.freeCreditsPerPeriod === 'number' ? plan.freeCreditsPerPeriod : null;

  /* Prefer tier-based v4 perks. If tier isn't recognized, fall back to API-derived perks. */
  let perks: string[] = TIER_PERKS[plan.tier] || [];
  if (perks.length === 0) {
    perks = features
      .filter((f) => f.type !== 'grand_draw_entries' && f.type !== 'free_credits')
      .map((f) => {
        if (f.description) return f.description;
        if (f.type === 'early_access' && f.value) return `${f.value}${f.unit || 'h'} early access to selected Bonus Draws`;
        return f.label;
      })
      .map(rewriteCreditsToPoints);
  }

  return { drawEntries, monthlyPoints, perks };
}

/* Render a perk string with **bold** markers converted to <strong>. */
function renderPerkText(perk: string, isPopular: boolean) {
  const parts = perk.split(/(\*\*[^*]+\*\*)/g);
  const strongCls = isPopular ? 'font-bold text-white' : 'font-bold text-[#0f1222]';
  return parts.map((part, k) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={k} className={strongCls}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={k}>{part}</React.Fragment>
    )
  );
}

/* Display-only word swap. The underlying API field name (freeCreditsPerPeriod)
   is preserved in the JS code — only the surface text shown to users changes. */
function rewriteCreditsToPoints(text: string): string {
  return text
    .replace(/UniCash Credits/gi, 'Points')
    .replace(/free credits/gi, 'Points')
    .replace(/credits/gi, 'Points')
    .replace(/credit/gi, 'Point');
}

/* -----------------------------------------------------------------------
   MembershipCard — v4 PlanCard styling, ALL existing logic preserved.
----------------------------------------------------------------------- */

export default function MembershipCard({
  plan,
  landingEnterMode,
  onLandingEnter,
  membership: externalMembership,
  actionLoading,
  onUpgradeDowngrade,
  showUpgradeConfirm,
  showDowngradeConfirm,
}: MembershipCardProps) {
  const { user } = useAuth();
  const [internalMembership, setInternalMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const membership = externalMembership !== undefined ? externalMembership : internalMembership;

  useEffect(() => {
    if (externalMembership === undefined) {
      if (user) {
        checkMembership();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, externalMembership]);

  const checkMembership = async () => {
    if (!user) return;
    try {
      const response = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setInternalMembership(response.data);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const badgeText = plan.badgeText || plan.featuresConfig?.badge?.text;
  const badgeType = plan.badgeType || plan.featuresConfig?.badge?.type;

  const isPopular = badgeType === 'popular';
  const isBest = badgeType === 'best_value';

  const hasThisPlan = membership?.planId === plan.id;
  const hasActiveMembership =
    membership?.status === 'active' &&
    membership?.currentPeriodEnd &&
    new Date(membership.currentPeriodEnd) > new Date();
  const isPaymentFailed = membership?.status === 'payment_failed' || membership?.status === 'past_due';
  const isCancelled = membership?.status === 'canceled' || membership?.cancelAtPeriodEnd;
  const isPaused = membership?.isPaused;

  const isPlanUpgrade = (oldPlan: any, newPlan: any): boolean => {
    const tierOrder: Record<string, number> = {
      basic: 1, premium: 2, uni_one: 3, uni_plus: 4, uni_max: 5, elite: 6,
    };
    const oldTierOrder = tierOrder[oldPlan?.tier] || 0;
    const newTierOrder = tierOrder[newPlan?.tier] || 0;
    if (newTierOrder > oldTierOrder) return true;
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly > oldPlan.priceMonthly) return true;
    if (
      newTierOrder === oldTierOrder &&
      newPlan.priceMonthly === oldPlan.priceMonthly &&
      newPlan.freeCreditsPerPeriod > oldPlan.freeCreditsPerPeriod
    ) return true;
    return false;
  };

  const isUpgrade = hasActiveMembership && membership?.plan ? isPlanUpgrade(membership.plan, plan) : false;
  const isDowngrade = hasActiveMembership && membership?.plan ? !isPlanUpgrade(membership.plan, plan) && !hasThisPlan : false;

  const tier = tierMeta(plan.tier);
  const { drawEntries, monthlyPoints, perks } = extractStats(plan);
  const isFree = plan.tier === 'free';

  /* Card shell — three visual variants: popular (purple gradient), best (white + gold ring), default (white) */
  const cardCls = isPopular
    ? 'relative flex h-full flex-col rounded-3xl bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] p-6 text-white shadow-[0_30px_80px_-30px_rgba(99,86,229,0.55)] sm:p-7'
    : isBest
      ? 'relative flex h-full flex-col rounded-3xl bg-white p-6 ring-2 ring-[#FFC85D]/50 shadow-[0_10px_28px_-12px_rgba(255,200,93,.25)] sm:p-7'
      : 'relative flex h-full flex-col rounded-3xl bg-white p-6 ring-1 ring-[#E7E2F4]/60 shadow-[0_10px_28px_-12px_rgba(99,86,229,.20)] sm:p-7';

  const tierIconBg = isPopular ? 'bg-white/15 ring-1 ring-white/20 backdrop-blur' : 'bg-[#F0EDFB] ring-1 ring-[#E0DAFF]';
  const tierIconColor = isPopular ? 'text-[#FFE2B0]' : isBest ? 'text-[#C49A2C]' : 'text-[#6356e5]';
  const tierLabelColor = isPopular ? 'text-white/70' : isBest ? 'text-[#9C5410]' : 'text-[#6356e5]';
  const planNameColor = isPopular ? 'text-white' : 'text-[#0f1222]';
  const taglineColor = isPopular ? 'text-white/80' : 'text-[#667085]';
  /* UniPlus price uses gold-gradient on the purple card surface — matches v4 PlanCard rule. */
  const priceColor = isPopular ? 'uc-gold-gradient' : 'text-[#0f1222]';
  const priceUnitColor = isPopular ? 'text-white/75' : 'text-[#667085]';
  const perkText = isPopular ? 'text-white/95' : 'text-[#0f1222]';
  const perkIcon = isPopular ? 'text-[#FFE2B0]' : 'text-[#6356e5]';

  const statsBg = isPopular
    ? 'bg-[#0F0830]/30 ring-1 ring-white/10 backdrop-blur'
    : isBest
      ? 'bg-[#FFF6E2] ring-1 ring-[#FFC85D]/40'
      : 'bg-[#F4F1FB] ring-1 ring-[#E0DAFF]';
  const statIconBg = isPopular ? 'bg-white/15 ring-1 ring-white/20' : 'bg-white ring-1 ring-[#E0DAFF]';
  const statIconCol = isPopular ? 'text-[#FFE2B0]' : isBest ? 'text-[#C49A2C]' : 'text-[#6356e5]';
  const statLabel = isPopular ? 'text-white/65' : 'text-[#667085]';
  const statValue = isPopular ? 'text-white' : 'text-[#0f1222]';

  const ribbonCls = isPopular
    ? 'bg-white text-[#6356e5]'
    : isBest
      ? 'bg-[#FFC85D] text-[#3A2A06]'
      : 'bg-[#f5f3ff] text-[#6356e5]';

  /* CTA visual — three variants. focus-visible ring color matches surface */
  const ctaPrimaryCls =
    'bg-white text-[#6356e5] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.30)] hover:bg-white/95 focus-visible:ring-white focus-visible:ring-offset-[#5346d6]';
  const ctaBestCls =
    'bg-[#0f1222] text-white hover:bg-[#1B1F38] focus-visible:ring-[#6356e5] focus-visible:ring-offset-white';
  const ctaDefaultCls =
    'border border-[#e7e9f2] bg-white text-[#0f1222] hover:border-[#6356e5] hover:text-[#6356e5] focus-visible:ring-[#6356e5] focus-visible:ring-offset-white';

  const pickCtaCls = isPopular ? ctaPrimaryCls : isBest ? ctaBestCls : ctaDefaultCls;

  /* Disabled CTA visual */
  const ctaDisabledCls = isPopular
    ? 'bg-white/30 text-white/70 cursor-not-allowed'
    : 'bg-gray-200 text-gray-500 cursor-not-allowed';

  const ctaBaseCls =
    'relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  /* -----------------------------------------------------------------
     Render the CTA button — preserves every state branch from the
     original component (landingEnterMode, paymentFailed, paused,
     cancelled, hasThisPlan, upgrade, downgrade, default).
  ----------------------------------------------------------------- */
  const renderCta = () => {
    if (landingEnterMode && onLandingEnter) {
      return (
        <button
          type="button"
          onClick={() => onLandingEnter(plan)}
          disabled={loading}
          className={`${ctaBaseCls} ${pickCtaCls}`}
        >
          {loading ? 'Loading…' : 'Enter now'}
        </button>
      );
    }

    /* Free plan — new visitor / non-member → payment-FREE signup, never Stripe
       checkout. (Current-Free → "Current Plan" via hasThisPlan; paid user
       viewing Free → "Downgrade" via isDowngrade — both handled below.) */
    if (isFree && !hasThisPlan && !isUpgrade && !isDowngrade) {
      return (
        <Link href="/register">
          <button type="button" disabled={loading} className={`${ctaBaseCls} ${pickCtaCls}`}>
            {loading ? 'Loading…' : 'Get started free'}
          </button>
        </Link>
      );
    }

    if (isPaymentFailed && hasThisPlan) {
      return (
        <Link href="/dashboard/membership">
          <button
            type="button"
            disabled={loading}
            className={`${ctaBaseCls} bg-[#EF4444] text-white hover:bg-[#DC2626] focus-visible:ring-[#EF4444] focus-visible:ring-offset-white`}
          >
            {loading ? 'Loading…' : 'Fix payment'}
          </button>
        </Link>
      );
    }

    if (isPaymentFailed && !hasThisPlan) {
      return (
        <button type="button" disabled className={`${ctaBaseCls} ${ctaDisabledCls}`}>
          Fix payment required
        </button>
      );
    }

    if (isPaused && hasThisPlan) {
      return (
        <Link href="/dashboard/membership">
          <button type="button" disabled={loading} className={`${ctaBaseCls} ${pickCtaCls}`}>
            {loading ? 'Loading…' : 'Resume Membership'}
          </button>
        </Link>
      );
    }

    if (isPaused && !hasThisPlan) {
      return (
        <button type="button" disabled className={`${ctaBaseCls} ${ctaDisabledCls}`}>
          Resume membership required
        </button>
      );
    }

    if (isCancelled && hasThisPlan) {
      return (
        <Link href={`/checkout?planId=${plan.id}&reactivate=true`}>
          <button type="button" disabled={loading} className={`${ctaBaseCls} ${pickCtaCls}`}>
            {loading ? 'Loading…' : 'Reactivate'}
          </button>
        </Link>
      );
    }

    if (isCancelled && !hasThisPlan) {
      return (
        <Link href={`/checkout?planId=${plan.id}`}>
          <button type="button" disabled={loading} className={`${ctaBaseCls} ${ctaDefaultCls}`}>
            {loading ? 'Loading…' : `Get ${plan.name}`}
          </button>
        </Link>
      );
    }

    if (hasThisPlan) {
      return (
        <button type="button" disabled className={`${ctaBaseCls} ${ctaDisabledCls}`}>
          {loading ? 'Loading…' : 'Current Plan'}
        </button>
      );
    }

    if (isUpgrade && !isPaymentFailed) {
      const isProcessing = actionLoading === `upgrade-${plan.id}` || showUpgradeConfirm;
      if (onUpgradeDowngrade) {
        return (
          <button
            type="button"
            onClick={() => onUpgradeDowngrade(plan.id)}
            disabled={loading || actionLoading !== null || isProcessing}
            className={`${ctaBaseCls} ${isProcessing ? ctaDisabledCls : pickCtaCls}`}
          >
            {isProcessing ? 'Processing…' : loading ? 'Loading…' : 'Upgrade'}
            {!isProcessing && (isPopular || isBest) && <ArrowRight className="h-4 w-4" />}
          </button>
        );
      }
      return (
        <Link href={`/checkout?planId=${plan.id}&upgrade=true`}>
          <button type="button" disabled={loading} className={`${ctaBaseCls} ${pickCtaCls}`}>
            {loading ? 'Loading…' : 'Upgrade'}
            {(isPopular || isBest) && <ArrowRight className="h-4 w-4" />}
          </button>
        </Link>
      );
    }

    if (isDowngrade && !isPaymentFailed) {
      const isProcessing = actionLoading === `downgrade-${plan.id}` || showDowngradeConfirm;
      if (onUpgradeDowngrade) {
        return (
          <button
            type="button"
            onClick={() => onUpgradeDowngrade(plan.id)}
            disabled={loading || actionLoading !== null || isProcessing}
            className={`${ctaBaseCls} ${isProcessing ? ctaDisabledCls : pickCtaCls}`}
          >
            {isProcessing ? 'Processing…' : loading ? 'Loading…' : 'Downgrade'}
          </button>
        );
      }
      return (
        <Link href={`/dashboard/membership?downgrade=${plan.id}`}>
          <button type="button" disabled={loading} className={`${ctaBaseCls} ${pickCtaCls}`}>
            {loading ? 'Loading…' : 'Downgrade'}
          </button>
        </Link>
      );
    }

    /* Default — new purchase. v4 uses plan-specific CTA wording (Get UniOne / Get UniPlus / Get UniMax). */
    return (
      <Link href={`/checkout?planId=${plan.id}`}>
        <button type="button" disabled={loading} className={`${ctaBaseCls} ${pickCtaCls}`}>
          {loading ? 'Loading…' : `Get ${plan.name}`}
          {(isPopular || isBest) && <ArrowRight className="h-4 w-4" />}
        </button>
      </Link>
    );
  };

  /* -----------------------------------------------------------------
     JSX — v4 PlanCard layout
  ----------------------------------------------------------------- */
  return (
    <div className={cardCls}>
      {/* Subtle gold corner glow for BEST VALUE */}
      {isBest && (
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#FFC85D]/18 blur-3xl" />
      )}

      {/* Top ribbon — popular / best */}
      {(isPopular || isBest) && badgeText && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] shadow-md ${ribbonCls}`}>
            {badgeText}
          </span>
        </div>
      )}

      {/* Tier header — icon + label + name */}
      <div className="relative flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tierIconBg}`}>
          <TierIcon name={tier.icon} className={`h-4 w-4 ${tierIconColor}`} />
        </span>
        <div>
          {tier.label && (
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tierLabelColor}`}>{tier.label}</p>
          )}
          <h3 className={`-mt-0.5 text-[22px] font-extrabold tracking-tight ${planNameColor}`}>{isFree ? `${plan.name} Starter` : plan.name}</h3>
        </div>
      </div>

      {/* Tagline */}
      {plan.description && (
        <p className={`relative mt-3 min-h-[34px] line-clamp-2 text-[12.5px] leading-snug ${taglineColor}`}>{rewriteCreditsToPoints(plan.description)}</p>
      )}

      {/* Price */}
      <div className="relative mt-6 flex items-baseline gap-2">
        <span className={`text-[48px] font-black leading-none tracking-[-0.025em] sm:text-[56px] ${priceColor}`}>
          ${parseFloat(plan.priceMonthly.toString()).toFixed(2).replace(/\.00$/, '')}
        </span>
        <span className={`text-[13px] font-medium ${priceUnitColor}`}>/month</span>
      </div>

      {/* Stats panel — ONE hero stat so it survives the narrow 4-column width.
          Free = "Points on every receipt"; paid = Major Draw entries. Monthly
          Points moved into the perks list below. */}
      {(isFree || drawEntries !== null) && (
        <div
          className={`relative -mx-6 grid h-[92px] grid-cols-2 divide-x border-y sm:-mx-7 ${isFree ? 'mt-8' : 'mt-6'} ${
            isPopular
              ? 'border-white/15 divide-white/15 bg-white/10'
              : isBest
                ? 'border-[#FFC85D]/40 divide-[#FFC85D]/40 bg-[#FFF6E2]'
                : 'border-[#E0DAFF] divide-[#E0DAFF] bg-[#F4F1FB]'
          }`}
        >
          {isFree ? (
            <>
              <div className="flex h-full flex-col justify-center px-4">
                <p className={`text-[18px] font-extrabold leading-none whitespace-nowrap ${isPopular ? 'text-white' : 'text-[#6356e5]'}`}>Points</p>
                <p className={`mt-2 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] ${statLabel}`}>On every receipt</p>
              </div>
              <div className="flex h-full flex-col justify-center px-4">
                <p className={`text-[18px] font-extrabold leading-none whitespace-nowrap ${isPopular ? 'text-white' : 'text-[#6356e5]'}`}>Gift cards</p>
                <p className={`mt-2 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] ${statLabel}`}>Redeem anytime</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-full flex-col justify-center px-4">
                <p className={`text-[24px] font-extrabold leading-none ${statValue}`}>{drawEntries}</p>
                <p className={`mt-2 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] ${statLabel}`}>Major Draw entries / mo</p>
              </div>
              <div className="flex h-full flex-col justify-center px-4">
                <p className={`text-[24px] font-extrabold leading-none ${statValue}`}>
                  {monthlyPoints !== null ? Number(monthlyPoints).toLocaleString() : '—'}
                </p>
                <p className={`mt-2 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] ${statLabel}`}>Monthly Points</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Divider */}
      <div className={`relative mt-6 h-px ${isPopular ? 'bg-white/15' : 'bg-[#e7e9f2]'}`} />

      {/* Perks — flex-1 pushes CTA to bottom. Free shows its own benefit list;
          paid prepends a Monthly Points line (moved out of the hero stat box). */}
      <ul className="relative mt-5 space-y-2.5 text-[13.5px]">
        {isFree ? (
          [
            'Free for everyone',
            'Earn Points from eligible receipts, including fuel',
            'Redeem all gift cards',
            'Points never expire',
            'Cancel anytime',
          ].map((perk, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${perkIcon}`} />
              <span className={perkText}>{perk}</span>
            </li>
          ))
        ) : (
          <>
            {perks.length > 0 ? (
              perks.map((perk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${perkIcon}`} />
                  <span className={perkText}>{renderPerkText(perk, isPopular)}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2">
                <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${perkIcon}`} />
                <span className={perkText}>Cancel anytime</span>
              </li>
            )}
          </>
        )}
      </ul>

      <div className="relative mt-auto pt-6">
        {isFree && (
          <p className={`mb-2.5 text-center text-[12px] ${statLabel}`}>No credit card needed</p>
        )}
        {renderCta()}
      </div>
    </div>
  );
}
