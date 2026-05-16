'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MembershipRequiredModal from './MembershipRequiredModal';
import api from '@/lib/api';

/* -----------------------------------------------------------------------
   Types — preserved from existing implementation. featuresConfig is the
   backend source of truth. DO NOT modify field names.
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

interface BoostPackCardProps {
  pack: {
    id: string;
    name: string;
    description?: string;
    price: number;
    credits: number;
    badgeText?: string;
    badgeType?: string;
    featuresConfig?: {
      features: PlanFeature[];
      badge?: { text: string; type: string };
    };
    isPopular?: boolean;
    /** When provided, allows the page to feed a stable display index so the
        v4 display copy matches the displayOrder of each pack. UI-only. */
    displayOrder?: number;
  };
  /** Display-only override index. Pure UI prop — backend data unaffected. */
  v4Index?: number;
}

/* -----------------------------------------------------------------------
   v4 display catalog — locked product copy & visual treatments.
   These ONLY change UI labels / taglines / badges / CTAs / icons.
   pack.id, pack.price (billing), pack.credits (Points logic) stay backend-driven.
----------------------------------------------------------------------- */

type V4Variant = 'spark' | 'pulse' | 'surge';

interface V4Display {
  variant: V4Variant;
  name: string;
  points: number;
  price: number;
  tagline: string;
  badge: 'MOST POPULAR' | 'BEST VALUE' | null;
  cta: string;
}

const V4_BOOSTER_DISPLAY: V4Display[] = [
  {
    variant: 'spark',
    name: 'Booster Spark',
    points: 250,
    price: 4.99,
    tagline: 'A simple top-up when you need a small Points boost.',
    badge: null,
    cta: 'Buy Booster Spark',
  },
  {
    variant: 'pulse',
    name: 'Booster Pulse',
    points: 1200,
    price: 19.99,
    tagline: 'A balanced top-up for Members who want more flexibility.',
    badge: 'MOST POPULAR',
    cta: 'Buy Booster Pulse',
  },
  {
    variant: 'surge',
    name: 'Booster Surge',
    points: 2000,
    price: 29.99,
    tagline: 'The best-value top-up for Members who want more extra Points.',
    badge: 'BEST VALUE',
    cta: 'Buy Booster Surge',
  },
];

/* Inline v4 icons — no extra deps. */
const SparkIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

const PulseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.5.5 0 0 1-.96 0L9.24 2.18a.5.5 0 0 0-.96 0l-2.35 8.36A2 2 0 0 1 4 12H2" />
  </svg>
);

const SurgeIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LockIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SpinnerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" fill="none" />
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

/* -----------------------------------------------------------------------
   BoostPackCard — v4 visual redesign.
   ALL existing logic preserved (props, state, handlers, modal, conditions).
----------------------------------------------------------------------- */

export default function BoostPackCard({ pack, v4Index }: BoostPackCardProps) {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [userCredits, setUserCredits] = useState<{ boostCredits: number; membershipCredits: number } | null>(null);

  useEffect(() => {
    if (user) {
      checkMembership();
      // User already has credits from AuthContext
      setUserCredits({
        boostCredits: user.boostCredits || 0,
        membershipCredits: user.membershipCredits || 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkMembership = async () => {
    if (!user) return;
    setCheckingMembership(true);
    try {
      const response = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(response.data);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setCheckingMembership(false);
    }
  };

  const handleGetBoostPack = (e: React.MouseEvent) => {
    e.preventDefault();

    // Don't proceed if checking membership
    if (checkingMembership) return;

    // Check if user has active membership (not paused, period valid)
    const hasActiveMembership = membership?.status === 'active' &&
      !membership?.isPaused && // Block if paused
      membership?.currentPeriodEnd &&
      new Date(membership.currentPeriodEnd) > new Date();

    const isPaused = membership?.isPaused;
    const isCancelled = membership?.status === 'canceled' || membership?.cancelAtPeriodEnd;

    if (!user || !hasActiveMembership || isPaused) {
      // Determine appropriate message based on membership status
      if (isPaused) {
        setShowMembershipModal(true);
      } else if (isCancelled) {
        setShowMembershipModal(true);
      } else {
        setShowMembershipModal(true);
      }
    } else {
      window.location.href = `/checkout?boostPackId=${pack.id}`;
    }
  };

  // Mirror backend logic — preserved exactly
  const isCanceled = membership?.status === 'canceled';
  const periodEnded =
    membership?.currentPeriodEnd &&
    new Date(membership.currentPeriodEnd) < new Date();

  const hasActiveMembership =
    !!membership &&
    !isCanceled &&
    membership.status === 'active' &&
    !membership.isPaused &&
    !periodEnded;

  const canBuyBoostPack = !!(user && hasActiveMembership);
  const isPaused = membership?.isPaused;

  /* ------------------------------------------------------------------
     v4 display resolution — picks override copy by index (0/1/2),
     falls back to backend pack data if index is out of range.
     Backend pack.id is always used for the actual checkout call.
  ------------------------------------------------------------------ */
  const v4 = typeof v4Index === 'number' ? V4_BOOSTER_DISPLAY[v4Index] : undefined;
  const displayName = v4?.name ?? pack.name;
  const displayPoints = v4?.points ?? pack.credits;
  const displayPrice = v4?.price ?? parseFloat(pack.price.toString());
  const displayTagline = v4?.tagline ?? pack.description ?? '';
  const displayBadge: 'MOST POPULAR' | 'BEST VALUE' | null =
    v4?.badge ??
    ((pack.badgeType === 'popular' ? 'MOST POPULAR'
      : pack.badgeType === 'best_value' ? 'BEST VALUE'
      : null));
  const displayCta = v4?.cta ?? `Buy ${pack.name}`;
  const variant: V4Variant = v4?.variant ?? 'spark';

  const isPopular = displayBadge === 'MOST POPULAR';
  const isBest = displayBadge === 'BEST VALUE';

  /* Variant-driven visual tokens (matches v4 PlanCard conventions).
     Mobile: tighter padding (p-6) for compact 3-card stack.
     Desktop: original p-8 + Pulse scale lift. */
  const cardCls = isPopular
    ? 'relative flex h-full flex-col rounded-3xl bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] p-6 text-white shadow-[0_30px_80px_-30px_rgba(99,86,229,0.55)] ring-2 ring-[#6356E5]/40 sm:p-8 lg:-mt-3 lg:z-10 lg:scale-[1.025] lg:ring-0'
    : isBest
      ? 'relative flex h-full flex-col rounded-3xl border-2 border-[#FFC85D]/40 bg-white p-6 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-8'
      : 'relative flex h-full flex-col rounded-3xl border border-[#e7e9f2] bg-white p-6 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-8';

  const iconWrapCls = isPopular
    ? 'bg-white/15 ring-1 ring-white/20 backdrop-blur'
    : isBest
      ? 'bg-[#FFF6DA] ring-1 ring-[#FFC85D]/40'
      : 'bg-[#F0EDFB] ring-1 ring-[#E0DAFF]';
  const iconColorCls = isPopular ? 'text-[#FFE2B0]' : isBest ? 'text-[#C49A2C]' : 'text-[#6356E5]';

  const nameColor = isPopular ? 'text-white' : 'text-[#0F1222]';
  const taglineColor = isPopular ? 'text-white/85' : 'text-[#4B5563]';
  const priceColor = isPopular ? 'uc-gold-gradient' : 'text-[#0F1222]';
  const priceUnitColor = isPopular ? 'text-white/70' : 'text-[#667085]';

  const statsBg = isPopular
    ? 'bg-[#0F0830]/30 ring-1 ring-white/10 backdrop-blur'
    : isBest
      ? 'bg-[#FFF6DA] ring-1 ring-[#FFC85D]/40'
      : 'bg-[#F4F1FB] ring-1 ring-[#E0DAFF]';
  const statValueColor = isPopular ? 'text-white' : 'text-[#0F1222]';
  const statLabelColor = isPopular ? 'text-white/70' : 'text-[#667085]';

  const noteColor = isPopular ? 'text-white/75' : 'text-[#667085]';
  const checkColor = isPopular ? 'text-[#FFE2B0]' : 'text-[#6356E5]';
  const featureTextColor = isPopular ? 'text-white/95' : 'text-[#0F1222]';

  const ribbonCls = isPopular
    ? 'bg-white text-[#6356E5]'
    : isBest
      ? 'bg-[#FFC85D] text-[#3A2A06]'
      : 'bg-[#F4F1FB] text-[#6356E5]';

  const ctaPopularCls =
    'bg-white text-[#6356E5] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.30)] hover:bg-white/95 focus-visible:ring-white focus-visible:ring-offset-[#5346D6]';
  const ctaBestCls =
    'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC] focus-visible:ring-[#6356E5] focus-visible:ring-offset-white';
  const ctaDefaultCls =
    'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC] focus-visible:ring-[#6356E5] focus-visible:ring-offset-white';

  const ctaPickCls = isPopular ? ctaPopularCls : isBest ? ctaBestCls : ctaDefaultCls;
  const ctaDisabledCls = isPopular
    ? 'bg-white/30 text-white/70 cursor-not-allowed'
    : 'bg-[#E7E9F2] text-[#9CA0B3] cursor-not-allowed';
  const ctaBaseCls =
    'relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  /* Variant icon */
  const VariantIcon = variant === 'pulse' ? PulseIcon : variant === 'surge' ? SurgeIcon : SparkIcon;

  /* Inline feature list — short, scannable. */
  const featureList = [
    'Added to your Points balance',
    'No auto-renew · One-time purchase',
    'Use Points for member-only Bonus Draws',
  ];

  /* CTA disabled ONLY while membership is being checked.
     For users without active membership, button stays clickable so handleGetBoostPack
     can open MembershipRequiredModal — which then guides them to plans/reactivate/resume.
     Previously disabled-when-no-membership prevented click → modal never opened → dead-end. */
  const ctaDisabled = !!checkingMembership;

  return (
    <div className={cardCls}>
      {/* Top ribbon */}
      {displayBadge && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] shadow-md ${ribbonCls}`}>
            {displayBadge}
          </span>
        </div>
      )}

      {/* Subtle gold corner glow for BEST VALUE */}
      {isBest && (
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#FFC85D]/18 blur-3xl" />
      )}

      {/* Header — icon + name */}
      <div className="relative flex items-center gap-3">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconWrapCls}`}>
          <VariantIcon className={`h-5 w-5 ${iconColorCls}`} />
        </span>
        <h3 className={`text-[22px] font-extrabold tracking-tight ${nameColor}`}>
          {displayName}
        </h3>
      </div>

      {/* Tagline */}
      {displayTagline && (
        <p className={`mt-3 text-[14px] leading-relaxed ${taglineColor}`}>
          {displayTagline}
        </p>
      )}

      {/* Price block — smaller on mobile so $XX.XX doesn't dominate the card */}
      <div className="mt-5 flex items-baseline gap-1.5 sm:mt-6">
        <span className={`text-[36px] font-black leading-none tracking-[-0.025em] sm:text-[52px] ${priceColor}`}>
          ${displayPrice.toFixed(2).replace(/\.00$/, '')}
        </span>
        <span className={`text-[12.5px] font-semibold sm:text-[13px] ${priceUnitColor}`}>one-time</span>
      </div>

      {/* Points pill */}
      <div className={`mt-4 rounded-2xl px-4 py-3.5 sm:mt-5 ${statsBg}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${statLabelColor}`}>
              You&rsquo;ll receive
            </p>
            <p className={`mt-1 text-[24px] font-extrabold leading-none tracking-tight sm:text-[26px] ${statValueColor}`}>
              {Number(displayPoints).toLocaleString()}
              <span className={`ml-1.5 text-[13.5px] font-semibold sm:text-[14px] ${statLabelColor}`}>Points</span>
            </p>
          </div>
          {/*
           * QW-2 — savings chip relative to Spark (the cheapest pack per Point).
           * Spark: A$4.99 / 250 = A$0.01996 per Point.
           * Pulse: A$19.99 / 1,200 = A$0.01666 per Point → ~17% cheaper.
           * Surge: A$29.99 / 2,000 = A$0.01500 per Point → ~25% cheaper.
           * Shown on Pulse + Surge only so the chip justifies the
           * MOST POPULAR / BEST VALUE ribbon without doing arithmetic in
           * the user's head.
           */}
          {(variant === 'pulse' || variant === 'surge') && (() => {
            const sparkPerPoint = 4.99 / 250;
            const perPoint = displayPrice / displayPoints;
            const savings = Math.round((1 - perPoint / sparkPerPoint) * 100);
            if (savings <= 0) return null;
            const chipCls = isPopular
              ? 'bg-[#FFE2B0]/95 text-[#3A2A06]'
              : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';
            return (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] ${chipCls}`}
                aria-label={`Save ${savings} percent versus Booster Spark`}
              >
                Save {savings}%
              </span>
            );
          })()}
        </div>
      </div>

      {/* Feature checklist — tighter spacing on mobile */}
      <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
        {featureList.map((line) => (
          <li key={line} className="flex items-start gap-2.5">
            <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${checkColor}`} />
            <span className={`text-[13px] leading-relaxed sm:text-[13.5px] ${featureTextColor}`}>{line}</span>
          </li>
        ))}
      </ul>

      {/* Spacer — pushes CTA to card bottom for even alignment */}
      <div className="flex-1" />

      <div className="mt-6">
        <button
          onClick={handleGetBoostPack}
          disabled={ctaDisabled}
          aria-label={`${displayCta} — ${Number(displayPoints).toLocaleString()} Points for $${displayPrice.toFixed(2)}`}
          className={`${ctaBaseCls} ${ctaDisabled ? ctaDisabledCls : ctaPickCls}`}
        >
          {checkingMembership ? (
            <>
              <SpinnerIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Checking…
            </>
          ) : (
            <>
              {!ctaDisabled && <LockIcon className="h-4 w-4" />}
              {displayCta}
            </>
          )}
        </button>

        <p className={`mt-3 text-center text-[11.5px] ${noteColor}`}>
          One-time purchase · No auto-renew
        </p>
      </div>

      {/* Membership Required Modal — props preserved exactly */}
      <MembershipRequiredModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        boostPackId={pack.id}
        isPaused={membership?.isPaused}
        isCancelled={membership?.status === 'canceled' || membership?.cancelAtPeriodEnd}
      />
    </div>
  );
}
