'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';
import { formatAustralianPhone } from '@/lib/australianPhone';

/* ==========================================================================
   UNICASH /checkout — v4 redesigned UI
   --------------------------------------------------------------------------
   - Visual + layout matches UNICASH Design System v4
   - All payment/Stripe/auth/API/scenario/validation logic preserved verbatim
   - DB field references (plan.grandPrizeEntriesPerPeriod, plan.freeCreditsPerPeriod,
     pack.credits) are unchanged — only displayed labels swapped to v4 terminology
     (Major Draw / Points / Booster Points / Point Booster).
   - Sticky mobile CTA on Step 1 (Continue button) and Step 2 (passive total only,
     to avoid duplicating the Stripe form's own pay button).
   ========================================================================== */

/** Matches API BadRequest when logged-in user's submitted email ≠ session account email. */
function isLoggedInEmailMismatchPaymentMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return message.includes('Use the email address on your logged-in UniCash account');
}

/* -------------------------------------------------------------------------- */
/*  Inline icons + brand helpers                                              */
/* -------------------------------------------------------------------------- */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  ArrowLeft: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 19-7-7 7-7M19 12H5" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Lock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  AlertCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
  Info: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  CheckCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Coins: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  Medal: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" />
    </svg>
  ),
  Spinner: ({ className = '' }: { className?: string }) => (
    <svg className={`animate-spin motion-reduce:animate-none ${className}`} viewBox="0 0 50 50" aria-hidden>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#E0DAFF" strokeWidth="4" />
      <circle cx="25" cy="25" r="20" fill="none" stroke="#6356e5" strokeWidth="4" strokeLinecap="round" strokeDasharray="78 48" />
    </svg>
  ),
};

/* Use the official asset shipped with the app — same as Header on the homepage. */
const UnicashLogo = ({ className = 'h-7 w-auto' }: { className?: string }) => (
  <Image
    src="/images/green-logo.svg"
    alt="UNICASH"
    width={150}
    height={40}
    className={className}
    priority
  />
);

const UnicashMark = ({ className = 'h-7 w-7' }: { className?: string }) => (
  <svg viewBox="0 0 515 515" xmlns="http://www.w3.org/2000/svg" aria-label="UNICASH" role="img" className={className}>
    <path fill="#6356E5" d="M257.507 0C115.286 0 0 115.291 0 257.507C0 399.718 115.286 515.014 257.507 515.014H515.014V257.507C515.014 115.291 399.718 0 257.507 0ZM406.511 406.511C324.217 488.81 190.797 488.81 108.503 406.516C26.2091 324.222 26.2091 190.797 108.503 108.503C190.797 26.2091 324.217 26.2091 406.511 108.503C488.81 190.792 488.805 324.217 406.511 406.511Z" />
    <path fill="#6356E5" d="M277.464 224.485C247.444 213.185 235.084 205.769 235.084 194.114C235.084 184.226 242.5 174.338 265.454 174.338C290.885 174.338 307.129 182.459 316.312 186.348L326.55 146.439C314.901 140.79 299.007 135.84 275.342 134.784V103.703H240.733V137.251C202.942 144.668 181.048 169.038 181.048 200.119C181.048 234.378 206.83 252.038 244.622 264.754C270.759 273.586 282.058 282.053 282.058 295.479C282.058 309.606 268.281 317.378 248.155 317.378C225.201 317.378 204.363 309.961 189.531 301.835L178.932 343.154C192.353 350.926 215.307 357.281 238.972 358.337V391.895H273.586V355.87C314.2 348.804 336.449 321.966 336.449 290.53C336.444 258.743 319.489 239.322 277.464 224.485Z" />
  </svg>
);

/* Painted lavender background — softer than Hero (form readability comes first) */
function PaintedBackground() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(720px 480px at 14% 16%, rgba(139,123,255,.15), transparent 62%)',
            'radial-gradient(620px 420px at 88% 12%, rgba(201,192,242,.20), transparent 60%)',
            'radial-gradient(560px 380px at 50% 100%, rgba(99,86,229,.07), transparent 62%)',
            'radial-gradient(420px 320px at 92% 78%, rgba(255,226,176,.08), transparent 60%)',
            'linear-gradient(180deg, #FBFAFF 0%, #F4F1FB 100%)',
          ].join(', '),
        }}
      />
      <div aria-hidden className="uc-dot-light absolute inset-0 opacity-[0.04]" />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   v4 display overrides — names, taglines, headline numbers + perks.
   These are PURE DISPLAY values keyed by `plan.tier` / sort-index. The actual
   plan.id / pack.id passed to the payment intent comes from the API, so the
   payment plumbing is unchanged. If the backend seed data has different
   priceMonthly / freeCreditsPerPeriod values than v4, those raw numbers stay
   the source of truth for ACTUAL billing — only labels are overridden.
   ──────────────────────────────────────────────────────────────────────── */

const V4_PLAN_DISPLAY: Record<string, {
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  tagline: string;
  drawEntries: number;
  monthlyPoints: number;
}> = {
  uni_one: {
    label: 'Silver',
    icon: Icon.Medal,
    tagline: 'Everyday rewards made simple.',
    drawEntries: 1,
    monthlyPoints: 3000,
  },
  uni_plus: {
    label: 'Gold',
    icon: Icon.Trophy,
    tagline: 'More value for active members.',
    drawEntries: 4,
    monthlyPoints: 10000,
  },
  uni_max: {
    label: 'Platinum',
    icon: Icon.Crown,
    tagline: 'Top-tier rewards and access.',
    drawEntries: 10,
    monthlyPoints: 25000,
  },
};

const tierDisplay = (tier: string | undefined) => {
  if (tier && V4_PLAN_DISPLAY[tier]) return V4_PLAN_DISPLAY[tier];
  return { label: '', icon: Icon.Medal, tagline: '', drawEntries: 0, monthlyPoints: 0 };
};

/* v4 Point Booster display data — applied by sort position (smallest → largest).
   API pack.id, pack.price, pack.displayOrder remain the source of truth for billing. */
const V4_BOOSTER_DISPLAY: Array<{
  name: string;
  tagline: string;
  price: number;
  points: number;
  badge: 'MOST POPULAR' | 'BEST VALUE' | null;
}> = [
  { name: 'Booster Spark', tagline: 'Quick top-up. Just enough for one Bonus Draw.', price: 4.99, points: 250, badge: null },
  { name: 'Booster Pulse', tagline: "Balanced top-up. Members' most-loved Booster.", price: 19.99, points: 1200, badge: 'MOST POPULAR' },
  { name: 'Booster Surge', tagline: 'Maximum Points. Lowest cost per Point.', price: 29.99, points: 2000, badge: 'BEST VALUE' },
];

/* Display-only term swap — backend field names stay as-is (plan.freeCreditsPerPeriod etc). */
function rewriteTerms(text: string): string {
  return text
    .replace(/Boost Credits/gi, 'Booster Points')
    .replace(/Boost Pack/gi, 'Point Booster')
    .replace(/UniCash Credits/gi, 'Points')
    .replace(/Major Reward/gi, 'Major Draw')
    .replace(/Grand Draw/gi, 'Major Draw')
    .replace(/Grand Prize/gi, 'Major Draw')
    .replace(/free credits/gi, 'Monthly Points')
    .replace(/credits/gi, 'Points')
    .replace(/credit/gi, 'Point');
}

/* -------------------------------------------------------------------------- */
/*  CheckoutContent — UI redesigned. ALL business logic preserved verbatim.   */
/* -------------------------------------------------------------------------- */

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const packId = searchParams.get('packId');
  const boostPackId = searchParams.get('boostPackId');
  const drawId = searchParams.get('drawId');
  const isUpgradeParam = searchParams.get('upgrade') === 'true';
  const { user, loading: authLoading, login: authLogin } = useAuth();

  const [step, setStep] = useState<'info' | 'pay'>('info');
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [boostPacks, setBoostPacks] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [savedCards, setSavedCards] = useState<{ id: string; brand: string; last4: string; exp_month: number; exp_year: number; isDefault: boolean }[]>([]);
  const [payWithSavedId, setPayWithSavedId] = useState<string | null>(null);
  const intentPackIdRef = useRef<string | null>(null);
  const selectedPlanRef = useRef<any>(null);
  const selectedPackRef = useRef<any>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  selectedPlanRef.current = selectedPlan;
  selectedPackRef.current = selectedPack;

  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  // RESUME-1 — same 3-state branching as MembershipLandingCheckoutModal.
  //   'login'   → user exists, no active membership, can resume after login
  //   'blocked' → user exists with active membership, already a member
  //   null      → no email-exists state
  const [resumeMode, setResumeMode] = useState<null | 'login' | 'blocked'>(null);
  const [resumePassword, setResumePassword] = useState('');
  const [resumePasswordError, setResumePasswordError] = useState<string | null>(null);
  const [resumeLoggingIn, setResumeLoggingIn] = useState(false);
  const [resumeResetSent, setResumeResetSent] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeValidating, setPromoCodeValidating] = useState(false);
  const [promoCodeValid, setPromoCodeValid] = useState<{ valid: boolean; promoCode?: any; error?: string; discount?: number } | null>(null);
  const [promoExpanded, setPromoExpanded] = useState(false);
  /* Mobile-only: order summary collapsed by default to keep checkout compact.
     Desktop (lg+) ignores this state and always shows full summary. */
  const [summaryOpen, setSummaryOpen] = useState(false);

  /* ---------------- Scenario detection (preserved verbatim) ---------------- */
  const isNewUser = !user;
  const hasActiveMembership = userMembership?.status === 'active' &&
    userMembership?.currentPeriodEnd &&
    new Date(userMembership.currentPeriodEnd) > new Date();
  const hasExpiredMembership = userMembership &&
    (!userMembership?.currentPeriodEnd || new Date(userMembership.currentPeriodEnd) <= new Date());
  const effectivePackId = boostPackId || packId;
  const wantsOnlyBoost = effectivePackId && !planId && effectivePackId !== 'boost';
  // eslint-disable-next-line no-unused-vars
  const wantsBoostPack = effectivePackId === 'boost' || (hasActiveMembership && !planId && !effectivePackId);
  // eslint-disable-next-line no-unused-vars
  const wantsOnlyMembership = planId && !packId;
  // eslint-disable-next-line no-unused-vars
  const wantsCombo = (planId && packId) || (selectedPlan && selectedPack);
  // Suppress requiresMembership while either auth context OR local data
  // fetch is still resolving. `hasActiveMembership` defaults false on first
  // render because userMembership is null until the fetch lands — without
  // this gate, the banner + plan selector + warning copy all flashed for
  // ~200ms on every refresh, even for active members. See 2026-05-18 fix.
  const isInitialLoad = authLoading || loading;
  const requiresMembership = !isInitialLoad && (isNewUser || !hasActiveMembership) && (wantsOnlyBoost || !!boostPackId);
  const skipPlanSelection = hasActiveMembership && wantsOnlyBoost && !planId;
  const shouldPreSelectOldPlan = hasExpiredMembership && !planId;
  const shouldAutoLoadPlan = hasActiveMembership && !wantsOnlyBoost;

  /* ---------------- Phone formatters (preserved verbatim) ----------------- */
  const denormalizePhoneNumber = (phone: string): string => {
    if (!phone || !phone.trim()) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('614') && cleaned.length === 11) {
      const withZero = `0${cleaned.substring(2)}`;
      return formatAustralianPhone(withZero);
    }
    if (cleaned.startsWith('04') && cleaned.length === 10) {
      return formatAustralianPhone(cleaned);
    }
    return '';
  };
  // eslint-disable-next-line no-unused-vars
  const normalizePhoneNumber = (phone: string): string => {
    if (!phone || !phone.trim()) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('04') && cleaned.length === 10) {
      return `+61${cleaned.substring(1)}`;
    }
    return `+61${cleaned.substring(1)}`;
  };

  /* ---------------- Initial data fetch + scenario application ------------- */
  useEffect(() => {
    if (drawId && typeof window !== 'undefined') {
      sessionStorage.setItem('redirectDrawId', drawId);
    }

    if (!planId && !packId && !boostPackId && !drawId && user && typeof window !== 'undefined') {
      api.membership.getUserMembership()
        .then((res) => {
          const membership = res.data;
          const hasActive = membership?.status === 'active' &&
            membership?.currentPeriodEnd &&
            new Date(membership.currentPeriodEnd) > new Date();
          if (hasActive) router.push('/');
        })
        .catch(() => {});
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [boostPacksRes, plansRes, membershipRes] = await Promise.all([
          api.membership.getBoostPacks(),
          api.membership.getPlans(),
          user ? api.membership.getUserMembership().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);

        setBoostPacks(boostPacksRes.data || []);
        setPlans(plansRes.data || []);
        setUserMembership(membershipRes.data);

        let resolvedPackId = boostPackId || packId;
        if (!resolvedPackId && typeof window !== 'undefined') {
          const pendingPackId = localStorage.getItem('pendingBoostPackId');
          if (pendingPackId) {
            resolvedPackId = pendingPackId;
            localStorage.removeItem('pendingBoostPackId');
          }
        }
        if (resolvedPackId && boostPacksRes.data) {
          if (resolvedPackId !== 'boost') {
            const pack = boostPacksRes.data.find((p: any) => p.id === resolvedPackId);
            if (pack) setSelectedPack(pack);
          }
        }

        if (skipPlanSelection) {
          setSelectedPlan(null);
        } else if (shouldAutoLoadPlan && membershipRes.data?.plan) {
          const currentPlan = plansRes.data?.find((p: any) => p.id === membershipRes.data.plan.id);
          if (currentPlan) setSelectedPlan(currentPlan);
        } else if (shouldPreSelectOldPlan && membershipRes.data?.plan) {
          const oldPlan = plansRes.data?.find((p: any) => p.id === membershipRes.data.plan.id);
          if (oldPlan) setSelectedPlan(oldPlan);
        } else {
          if (planId && plansRes.data) {
            const plan = plansRes.data.find((p: any) => p.id === planId);
            if (plan) setSelectedPlan(plan);
          } else if (drawId && plansRes.data?.length > 0) {
            const recommendedPlan = plansRes.data.find((p: any) => p.tier === 'uni_plus') ||
                                   plansRes.data.find((p: any) => p.tier === 'premium') ||
                                   plansRes.data[0];
            if (recommendedPlan) setSelectedPlan(recommendedPlan);
          } else if (!user && plansRes.data?.length > 0) {
            const premiumPlan = plansRes.data.find((p: any) => p.tier === 'premium') || plansRes.data[0];
            if (premiumPlan) setSelectedPlan(premiumPlan);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, planId, packId, boostPackId, drawId, shouldAutoLoadPlan, shouldPreSelectOldPlan, skipPlanSelection, router]);

  /* ---------------- Auto-fill form for logged-in user --------------------- */
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        const userPhone = (user as any).phone || '';
        const displayPhone = userPhone ? denormalizePhoneNumber(userPhone) : '';
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: displayPhone,
        });
      } else {
        setFormData({ firstName: '', lastName: '', email: '', phone: '' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  /* ---------------- Original total + AUD formatter ------------------------ */
  const originalTotalAmount = (skipPlanSelection || (hasActiveMembership && wantsOnlyBoost && !planId))
    ? (selectedPack ? parseFloat(selectedPack.price?.toString() || '0') : 0)
    : selectedPlan
      ? parseFloat(selectedPlan.priceMonthly?.toString() || '0') + (selectedPack ? parseFloat(selectedPack.price?.toString() || '0') : 0)
      : (selectedPack ? parseFloat(selectedPack.price?.toString() || '0') : 0);

  const formatAUD = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `A$${numAmount.toFixed(2)}`;
  };

  /* ---------------- Re-validate promo on plan/pack change ----------------- */
  useEffect(() => {
    if (promoCodeValid?.valid && promoCode && originalTotalAmount > 0) {
      api.promoCodes.validate(promoCode.trim(), originalTotalAmount)
        .then((response) => {
          if (response.data.valid) setPromoCodeValid(response.data);
          else { setPromoCodeValid(null); setPromoCode(''); }
        })
        .catch(() => { setPromoCodeValid(null); setPromoCode(''); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan?.id, selectedPack?.id]);

  /* ---------------- Saved cards (preserved) ------------------------------- */
  useEffect(() => {
    if (!user) {
      setSavedCards([]);
      setPayWithSavedId(null);
      return;
    }
    api.payments.listPaymentMethods()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setSavedCards(list);
        const defaultCard = list.find((c) => c.isDefault) ?? list[0];
        setPayWithSavedId(defaultCard?.id ?? null);
      })
      .catch(() => { setSavedCards([]); setPayWithSavedId(null); });
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email' && user?.email) return;

    let formattedValue = value;
    if (name === 'phone') formattedValue = formatAustralianPhone(value);

    setFormData({ ...formData, [name]: formattedValue });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateInfo = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleaned = formData.phone.replace(/\D/g, '');
      if (cleaned.length !== 10 || !cleaned.startsWith('04')) {
        newErrors.phone = 'Please enter a valid mobile number (04XX XXX XXX)';
      }
    }

    if (requiresMembership && !selectedPlan) {
      newErrors.membership = 'Membership is required to purchase Point Boosters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createPaymentIntent = async (plan: any, pack: any) => {
    const cleanedPhone = formData.phone.replace(/\s+/g, '');
    if (plan) {
      const payload = {
        planId: plan.id,
        boostPackId: pack?.id || undefined,
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerPhone: cleanedPhone,
        promoCode: promoCodeValid?.valid ? promoCode.trim() : undefined,
      };
      const res = await api.payments.createMembershipPaymentIntent({
        planId: payload.planId,
        boostPackId: payload.boostPackId,
        customerEmail: payload.customerEmail,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        promoCode: payload.promoCode,
      });
      return res;
    }
    if (pack) {
      return await api.payments.createBoostPackPaymentIntent({
        boostPackId: pack.id,
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerPhone: cleanedPhone,
        promoCode: promoCodeValid?.valid ? promoCode.trim() : undefined,
      });
    }
    return null;
  };

  const handleContinueToPayment = async () => {
    if (!validateInfo()) return;
    if (isProcessingPayment) return;
    if (requiresMembership && !selectedPlan) {
      setErrors({ membership: 'Please select a Membership plan to continue' });
      return;
    }
    if (skipPlanSelection && !selectedPack) {
      showToast('Please select a Point Booster', 'warning');
      return;
    }
    if (!selectedPlan && !selectedPack) {
      showToast('Please select a Membership plan or Point Booster', 'warning');
      return;
    }

    setPaymentError(null);

    if (isNewUser && formData.email?.trim()) {
      try {
        const checkRes = await api.auth.checkEmail(formData.email.trim());
        const data = checkRes.data ?? {
          exists: false,
          hasActiveMembership: false,
          canResumeCheckout: false,
        };
        // RESUME-1 — 3-state branch identical to membership checkout modal.
        if (data.exists && data.hasActiveMembership) {
          setResumeMode('blocked');
          setShowEmailExistsModal(true);
          return;
        }
        if (data.exists && data.canResumeCheckout) {
          setResumeMode('login');
          setResumePassword('');
          setResumePasswordError(null);
          setResumeResetSent(false);
          setShowEmailExistsModal(true);
          return;
        }
        // Fresh email → continue to payment intent below.
      } catch {
        // proceed on network failure — backend re-checks at intent time.
      }
    }

    setLoading(true);
    setIsProcessingPayment(true);
    try {
      const response = await createPaymentIntent(selectedPlan, selectedPack);
      if (response?.data?.clientSecret) {
        intentPackIdRef.current = selectedPack?.id ?? null;
        setClientSecret(response.data.clientSecret);
        setPaymentId(response.data.paymentId);
        setStep('pay');
      } else {
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to initialize payment. Please try again.';
      setPaymentError(msg.includes('Throttler') ? 'Too many requests. Please wait a moment and try again.' : msg);
    } finally {
      setLoading(false);
      setIsProcessingPayment(false);
    }
  };

  // RESUME-1 — log in with existing password from the inline modal, then
  // jump straight to creating the payment intent. Mirrors MembershipLanding
  // CheckoutModal.handleLoginAndContinue so the behaviour is consistent
  // between booster + membership checkouts.
  const handleResumeLogin = async () => {
    if (!resumePassword.trim()) {
      setResumePasswordError('Enter your password to continue.');
      return;
    }
    setResumeLoggingIn(true);
    setResumePasswordError(null);
    try {
      await authLogin(formData.email.trim().toLowerCase(), resumePassword);
      // Close + reset modal state.
      setShowEmailExistsModal(false);
      setResumeMode(null);
      setResumePassword('');
      // Continue with payment intent — checkEmail re-check would now skip
      // (isNewUser becomes false on next render), but we proceed directly
      // since we know the auth context just updated.
      setLoading(true);
      setIsProcessingPayment(true);
      try {
        const response = await createPaymentIntent(selectedPlan, selectedPack);
        if (response?.data?.clientSecret) {
          intentPackIdRef.current = selectedPack?.id ?? null;
          setClientSecret(response.data.clientSecret);
          setPaymentId(response.data.paymentId);
          setStep('pay');
        } else {
          setPaymentError('Failed to initialize payment. Please try again.');
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.message || 'Failed to initialize payment. Please try again.';
        setPaymentError(msg);
      } finally {
        setLoading(false);
        setIsProcessingPayment(false);
      }
    } catch (e: any) {
      setResumePasswordError(
        typeof e?.message === 'string'
          ? e.message
          : 'Incorrect password. Try again or reset your password below.',
      );
    } finally {
      setResumeLoggingIn(false);
    }
  };

  // RESUME-1 — fire password reset email so the member can recover without
  // losing their place in the checkout funnel.
  const handleResumeForgotPassword = async () => {
    if (!formData.email?.trim()) {
      setResumePasswordError('Enter your email first.');
      return;
    }
    setResumePasswordError(null);
    try {
      await api.auth.requestPasswordReset(formData.email.trim().toLowerCase());
    } catch {
      // Backend deliberately vague to avoid enumeration; mirror that on the
      // client by always pretending success.
    }
    setResumeResetSent(true);
  };

  const handlePackChangeInStep2 = async (newPack: any) => {
    const newPackId = newPack?.id ?? null;
    if (newPackId === intentPackIdRef.current) {
      setSelectedPack(newPack);
      return;
    }
    setSelectedPack(newPack);

    if (step !== 'pay' || !clientSecret) return;

    const planToSend = selectedPlanRef.current;
    const packToSend = newPack;

    setClientSecret(null);
    setPaymentId(null);
    setPaymentError(null);
    setIsProcessingPayment(true);
    intentPackIdRef.current = newPackId;

    try {
      const response = await createPaymentIntent(planToSend, packToSend);
      if (response?.data?.clientSecret) {
        setClientSecret(response.data.clientSecret);
        setPaymentId(response.data.paymentId);
      } else {
        setPaymentError('Failed to update payment. Please try again.');
      }
    } catch (error: any) {
      setPaymentError(error?.response?.data?.message || 'Failed to update payment. Please try again.');
      setStep('info');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const discountAmount = promoCodeValid?.valid && promoCodeValid.discount ? promoCodeValid.discount : 0;
  const totalAmount = Math.max(0, originalTotalAmount - discountAmount);

  const isUpgradeFromPlan = hasActiveMembership && selectedPlan && userMembership?.plan?.id !== selectedPlan.id;
  const isUpgrade = isUpgradeParam || isUpgradeFromPlan;

  /* ---------------- Loading screen --------------------------------------- */
  if (loading && !clientSecret) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <PaintedBackground />
        <div className="relative text-center">
          <Icon.Spinner className="mx-auto h-12 w-12" />
          <p className="mt-4 text-[14px] text-[#4b5563]">Loading checkout…</p>
        </div>
      </main>
    );
  }

  /* ---------------- Visual classes (shared) ------------------------------- */
  const inputCls =
    'h-12 w-full rounded-2xl border bg-[#FBFAFF] px-4 text-[14px] text-[#0f1222] placeholder-[#a3a8be] shadow-[inset_0_1px_2px_rgba(15,18,34,0.04)] transition-all hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6356e5]/30 disabled:cursor-not-allowed disabled:opacity-60';
  const inputBorder = (hasErr: boolean) =>
    hasErr ? 'border-[#FCA5A5] focus:border-[#EF4444] focus:ring-[#EF4444]/30' : 'border-[#E0DAFF] hover:border-[#c8c5ea] focus:border-[#6356e5]';

  /* Compact eye-catching field error — soft red pill with alert icon */
  const FieldError = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <p
      id={id}
      role="alert"
      className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[#FEF2F2] px-2.5 py-1 text-[12px] font-medium text-[#991B1B] ring-1 ring-[#FCA5A5]/50"
    >
      <Icon.AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#EF4444]" />
      <span>{children}</span>
    </p>
  );

  const primaryBtnCls =
    'uc-lift-sm relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const TierIcon = selectedPlan ? tierDisplay(selectedPlan.tier).icon : Icon.Medal;
  const tierMeta = selectedPlan ? tierDisplay(selectedPlan.tier) : { label: '', icon: Icon.Medal, tagline: '' };

  /* -------------------- Render order summary card ------------------------
     On mobile (<lg) the card collapses to a thin total bar with a chevron toggle —
     this avoids repeating the full breakdown on Step 1 + Step 2. The collapsed
     contents are still mounted (so booster selection logic is preserved) — they're
     just hidden via class. Desktop always shows everything. */
  const summaryDetailCls = `${summaryOpen ? 'block' : 'hidden'} lg:block`;
  const renderOrderSummary = () => (
    <div className="overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white shadow-[0_30px_80px_-50px_rgba(15,18,34,0.18)]">
      {/* Mobile collapsible header — total prominent, expand chevron */}
      <button
        type="button"
        onClick={() => setSummaryOpen((v) => !v)}
        aria-expanded={summaryOpen}
        aria-controls="order-summary-body"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6356e5] lg:hidden"
      >
        <span className="flex flex-col">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#667085]">Order summary</span>
          <span className="mt-0.5 text-[13.5px] font-semibold text-[#0f1222]">
            {summaryOpen ? 'Hide details' : 'View details'}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="flex flex-col items-end">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Total today</span>
            <span className="text-[18px] font-extrabold tracking-tight text-[#6356E5]">{formatAUD(totalAmount)}</span>
          </span>
          <span aria-hidden className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356e5] transition-transform duration-300 ${summaryOpen ? 'rotate-180' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </span>
      </button>

      {/* Desktop title — only on lg+ where collapsible header is hidden */}
      <h2 className="hidden px-7 pt-7 text-[20px] font-extrabold tracking-tight text-[#0f1222] lg:block sm:text-[22px]">Order summary</h2>

      <div id="order-summary-body" className={`${summaryDetailCls} px-5 pb-6 lg:px-7 lg:pb-7`}>
        {/* Spacer so content doesn't touch the desktop title */}
        <div className="hidden lg:block lg:pt-0" />

      {/* Selected Membership — uses v4 display values (drawEntries + monthlyPoints) keyed by tier */}
      {selectedPlan && !skipPlanSelection && (() => {
        const meta = tierDisplay(selectedPlan.tier);
        const drawEntries = (selectedPlan.majorDrawEntriesPerPeriod ?? selectedPlan.grandPrizeEntriesPerPeriod ?? meta.drawEntries ?? 0);
        const monthlyPoints = (selectedPlan.monthlyPointsGrant ?? selectedPlan.freeCreditsPerPeriod ?? meta.monthlyPoints ?? 0);
        const TierIconComp = meta.icon;
        return (
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] p-4 ring-1 ring-[#E0DAFF]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-[#E0DAFF] shadow-[0_2px_8px_-3px_rgba(99,86,229,0.15)]">
                <TierIconComp className="h-5 w-5 text-[#6356E5]" />
              </span>
              <div className="min-w-0 flex-1">
                {meta.label && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">{meta.label}</p>
                )}
                <div className="mt-0.5 flex items-baseline justify-between gap-2">
                  <p className="text-[17px] font-extrabold tracking-tight text-[#0f1222]">{selectedPlan.name}</p>
                  <p className="whitespace-nowrap text-[18px] font-extrabold tracking-tight text-[#6356E5]">
                    {formatAUD(selectedPlan.priceMonthly)}
                    <span className="ml-0.5 text-[12px] font-semibold text-[#667085]">/mo</span>
                  </p>
                </div>
                {meta.tagline && (
                  <p className="mt-1 text-[12px] leading-relaxed text-[#4b5563]">{meta.tagline}</p>
                )}
                {/* Stats grid — Major Draw + Monthly Points */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-[#E0DAFF]">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Major Draw</p>
                    <p className="mt-1 text-[18px] font-extrabold leading-none tracking-tight text-[#0f1222]">
                      {drawEntries}
                      <span className="ml-1.5 text-[12px] font-semibold text-[#667085]">{drawEntries === 1 ? 'entry' : 'entries'}</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-[#E0DAFF]">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Monthly</p>
                    <p className="mt-1 text-[18px] font-extrabold leading-none tracking-tight text-[#0f1222]">
                      {Number(monthlyPoints).toLocaleString()}
                      <span className="ml-1.5 text-[12px] font-semibold text-[#667085]">Points</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Boost Pack selector — only if user wants/has boost flow */}
      {(wantsOnlyBoost || (selectedPlan && !skipPlanSelection)) && (
        <div className="mt-5">
          <h3 className="text-[13px] font-extrabold tracking-tight text-[#0f1222]">
            {selectedPack ? 'Selected Point Booster' : 'Add Point Booster (optional)'}
          </h3>
          <p className="mt-0.5 text-[11.5px] text-[#667085]">One-time purchase · Booster Points never expire</p>

          <div className="mt-3 space-y-2">
            {boostPacks
              .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
              .map((pack: any, index: number) => {
                const isSelected = selectedPack?.id === pack.id;
                /* v4 display override by sort position. pack.id (used by handlePackChangeInStep2)
                   stays the actual API ID — this only changes labels/badges/points display. */
                const v4 = V4_BOOSTER_DISPLAY[index];
                const displayName = v4?.name ?? rewriteTerms(pack.name || 'Point Booster');
                const displayPoints = v4?.points ?? Number(pack.credits || 0);
                const displayPrice = v4?.price ?? parseFloat(pack.price?.toString() || '0');
                const displayBadge = v4?.badge ?? (pack.badgeText || pack.featuresConfig?.badge?.text || null);
                const displayTagline = v4?.tagline;
                return (
                  <button
                    type="button"
                    key={pack.id}
                    onClick={() => handlePackChangeInStep2(isSelected ? null : pack)}
                    aria-pressed={isSelected}
                    className={`relative flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-[#6356e5] bg-[#F4F1FB] shadow-[0_8px_20px_-12px_rgba(99,86,229,0.4)]'
                        : 'border-[#E7E9F2] bg-white hover:border-[#c8c5ea]'
                    }`}
                  >
                    {displayBadge && (
                      <span
                        className={`absolute -right-1.5 -top-2 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] shadow ${
                          displayBadge === 'MOST POPULAR'
                            ? 'bg-[#6356E5] text-white'
                            : 'bg-[#FFC85D] text-[#3A2A06]'
                        }`}
                      >
                        {rewriteTerms(String(displayBadge))}
                      </span>
                    )}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected ? 'border-[#6356e5] bg-[#6356e5]' : 'border-[#cfc8e8] bg-white'
                      }`}
                      aria-hidden
                    >
                      {isSelected && <Icon.Check className="h-3 w-3 text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold tracking-tight text-[#0f1222]">{displayName}</p>
                      <p className="mt-0.5 text-[13px] font-extrabold tracking-tight text-[#6356E5]">
                        {Number(displayPoints).toLocaleString()} Points
                      </p>
                      {displayTagline && (
                        <p className="mt-1 text-[11.5px] leading-relaxed text-[#667085]">{displayTagline}</p>
                      )}
                    </div>
                    <p className="shrink-0 whitespace-nowrap text-[17px] font-extrabold tracking-tight text-[#6356E5]">
                      {formatAUD(displayPrice)}
                    </p>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Plan selector when membership is required by current scenario */}
      {requiresMembership && plans.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[13px] font-extrabold tracking-tight text-[#0f1222]">Select Membership</h3>
          <p className="mt-0.5 text-[11.5px] text-[#667085]">
            Required to purchase Point Boosters and access Bonus Draws.
          </p>
          <div className="mt-3 space-y-2">
            {plans.map((plan: any) => {
              const isSelected = selectedPlan?.id === plan.id;
              const meta = tierDisplay(plan.tier);
              const drawEntries = (plan.majorDrawEntriesPerPeriod ?? plan.grandPrizeEntriesPerPeriod ?? meta.drawEntries ?? 0);
              const monthlyPoints = (plan.monthlyPointsGrant ?? plan.freeCreditsPerPeriod ?? meta.monthlyPoints ?? 0);
              return (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-[#6356e5] bg-[#F4F1FB]'
                      : 'border-[#E7E9F2] bg-white hover:border-[#c8c5ea]'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected ? 'border-[#6356e5] bg-[#6356e5]' : 'border-[#cfc8e8] bg-white'
                    }`}
                    aria-hidden
                  >
                    {isSelected && <Icon.Check className="h-3 w-3 text-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-extrabold tracking-tight text-[#0f1222]">
                      {plan.name}
                      {meta.label && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">· {meta.label}</span>}
                    </p>
                    <p className="text-[11.5px] text-[#667085]">
                      {drawEntries} Major Draw {drawEntries === 1 ? 'entry' : 'entries'}
                      {monthlyPoints > 0 && ` + ${Number(monthlyPoints).toLocaleString()} Monthly Points`}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-[14px] font-bold text-[#6356E5]">
                    {formatAUD(plan.priceMonthly)}<span className="text-[10.5px] font-medium text-[#667085]">/mo</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedPlan && !selectedPack && !requiresMembership && (
        <div className="mt-5 rounded-2xl bg-[#FBFAFF] p-4 text-center text-[12.5px] text-[#667085] ring-1 ring-[#E7E9F2]">
          Select a Membership plan or Point Booster to continue.
        </div>
      )}

      {/* Subtotal + discount */}
      {(selectedPlan || selectedPack) && (
        <div className="mt-5 space-y-2 border-t border-[#E7E9F2] pt-4 text-[13px]">
          {selectedPlan && !skipPlanSelection && (
            <div className="flex justify-between">
              <span className="text-[#4b5563]">Membership</span>
              <span className={`font-semibold ${discountAmount > 0 ? 'text-[#a3a8be] line-through' : 'text-[#0f1222]'}`}>
                {formatAUD(selectedPlan.priceMonthly)}
              </span>
            </div>
          )}
          {selectedPack && (
            <div className="flex justify-between">
              <span className="text-[#4b5563]">Point Booster <span className="text-[#a3a8be]">· one-time</span></span>
              <span className="font-semibold text-[#0f1222]">{formatAUD(parseFloat(selectedPack.price?.toString() || '0'))}</span>
            </div>
          )}
          {promoCodeValid?.valid && discountAmount > 0 && (
            <div className="flex justify-between text-[#10B981]">
              <span className="font-semibold">Promo · {promoCode}</span>
              <span className="font-semibold">−{formatAUD(discountAmount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="mt-4 border-t-2 border-[#E7E9F2] pt-4">
        {discountAmount > 0 && (
          <div className="flex justify-between text-[12px] text-[#667085]">
            <span>Subtotal</span>
            <span className="text-[#a3a8be] line-through">{formatAUD(originalTotalAmount)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <p className="text-[14px] font-extrabold tracking-tight text-[#0f1222]">Total due today</p>
          <p className="text-[24px] font-extrabold tracking-tight text-[#6356E5]">{formatAUD(totalAmount)}</p>
        </div>

        {selectedPlan && !skipPlanSelection && (
          <div className="mt-3 space-y-1.5 text-[11.5px] leading-relaxed text-[#667085]">
            <p>Next charge: <span className="font-semibold text-[#0f1222]">{formatAUD(selectedPlan.priceMonthly)}</span> in 1 month for Membership renewal.</p>
            {selectedPack && <p>Point Booster is a one-time purchase and does not auto-renew.</p>}
            <p>Cancel anytime from your account.</p>
          </div>
        )}
        {!selectedPlan && selectedPack && (
          <p className="mt-3 text-[11.5px] text-[#667085]">One-time payment for Point Booster only. No subscription.</p>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-[#7a8195]">
          By completing the purchase, you agree to our{' '}
          <Link href="/terms" className="text-[#6356E5] underline-offset-2 hover:underline">Terms of Service</Link>
          {' '}including auto-renewal terms, and acknowledge our{' '}
          <Link href="/privacy" className="text-[#6356E5] underline-offset-2 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
      </div>
    </div>
  );

  /* -------------------- Render --------------------------------------------- */
  return (
    <div className="relative min-h-screen overflow-hidden">
      <PaintedBackground />

      {/* Minimal in-page checkout header — replaces the global site header on /checkout.
          Logo size + header height match the global Header pattern: h-14/h-7 mobile, h-16/h-9 desktop. */}
      <header className="relative border-b border-[#E7E9F2] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Link href="/" aria-label="UNICASH home" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2">
            <UnicashLogo className="h-7 w-auto sm:h-9" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F2] bg-[#FBFAFF] px-3 py-1.5 text-[11.5px] font-semibold text-[#0f1222]">
            <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            <span className="hidden sm:inline">Secure checkout</span>
            <span className="sm:hidden">Secure</span>
          </span>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10 sm:pb-12 lg:px-8">
        {/* Page heading — centered on every viewport for a balanced, premium intro.
            Constrained to max-w-2xl + mx-auto so the heading block doesn't stretch on wide
            screens and feels intentionally framed. */}
        <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e7e9f2] bg-white px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#6356e5]">
            <Icon.ShieldCheck className="h-3 w-3 text-[#10B981]" />
            Secure checkout
          </span>
          <h1 className="mt-3 text-[26px] font-extrabold leading-[1.05] tracking-tight text-[#0f1222] sm:text-[32px]">
            Checkout
          </h1>
          {/* Mobile copy — concise */}
          <p className="mt-1.5 text-[13.5px] text-[#4b5563] sm:hidden">
            Start your <span className="font-semibold text-[#0f1222]">UNICASH Membership</span>.
          </p>
          {/* Desktop copy — full sentence + inline trust pills, all centered */}
          <div className="mt-2 hidden flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:flex">
            <p className="text-[14px] text-[#4b5563]">
              Start your <span className="font-semibold text-[#0f1222]">UNICASH Membership</span> in just a few steps.
            </p>
            <span aria-hidden className="hidden text-[#cfc8e8] md:inline">·</span>
            <span className="hidden items-center gap-1 text-[12.5px] text-[#667085] md:inline-flex">
              <Icon.Lock className="h-3 w-3 text-[#6356e5]" />
              Cancel anytime
            </span>
            <span aria-hidden className="hidden text-[#cfc8e8] md:inline">·</span>
            <span className="hidden items-center gap-1 text-[12.5px] text-[#667085] md:inline-flex">
              <Icon.ShieldCheck className="h-3 w-3 text-[#10B981]" />
              Bank-grade Stripe
            </span>
          </div>
        </div>

        {/* Step indicator — full width above the grid, aligned to page padding.
            Completed step: green check + soft green tint. Active: lavender bg + purple icon. */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5 rounded-full bg-white p-1.5 ring-1 ring-[#E7E9F2] sm:gap-2 sm:p-2">
            {/* Step 1 — Your details */}
            <div className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 transition-colors sm:px-4 sm:py-2.5 ${
              step === 'info' ? 'bg-[#F4F1FB]' : step === 'pay' ? 'bg-[#E5F7EE]/60' : ''
            }`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                step === 'pay' ? 'bg-[#10B981] text-white' : 'bg-[#6356E5] text-white'
              }`}>
                {step === 'pay' ? <Icon.Check className="h-3.5 w-3.5" /> : '1'}
              </span>
              <span className={`text-[12.5px] font-semibold sm:text-[13px] ${
                step === 'pay' ? 'text-[#1F7A37]' : step === 'info' ? 'text-[#0f1222]' : 'text-[#667085]'
              }`}>
                Your details
              </span>
            </div>

            {/* Step 2 — Secure payment */}
            <div className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 transition-colors sm:px-4 sm:py-2.5 ${
              step === 'pay' ? 'bg-[#F4F1FB]' : ''
            }`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                step === 'pay' ? 'bg-[#6356E5] text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)]' : 'bg-[#E0DAFF] text-[#6356e5]'
              }`}>
                2
              </span>
              <span className={`text-[12.5px] font-semibold sm:text-[13px] ${step === 'pay' ? 'text-[#0f1222]' : 'text-[#667085]'}`}>
                Secure payment
              </span>
            </div>
          </div>
        </div>

        {/* Two-column layout — 7/5 split at lg+. Form card now fills the full col-span-7 width
            so it visually balances with the summary card on the right (no internal dead space). */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            {/* Form card — fills column on lg+; centered with max-w-xl on smaller screens */}
            <div className="mx-auto max-w-xl rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(15,18,34,0.18)] sm:p-7 lg:max-w-none">
              {step === 'info' && (
                <>
                  {/* Contextual banners */}
                  {drawId && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#E0DAFF] bg-[#F4F1FB] p-3.5">
                      <Icon.Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6356E5]" />
                      <div className="text-[13px] leading-relaxed text-[#0f1222]">
                        <p className="font-semibold">Complete your Membership to enter</p>
                        <p className="mt-0.5 text-[#4b5563]">
                          You&rsquo;re joining UNICASH to enter a member-only Bonus Draw. After payment, you&rsquo;ll be redirected back to the draw.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* requiresMembership is already false during isInitialLoad
                      (see its computation above) — no extra guard needed here. */}
                  {requiresMembership && !drawId && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#FFC85D]/50 bg-[#FFF6E2] p-3.5">
                      <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9C5410]" />
                      <div className="text-[13px] leading-relaxed text-[#0f1222]">
                        <p className="font-semibold">Membership required</p>
                        <p className="mt-0.5 text-[#4b5563]">
                          {boostPackId
                            ? "You need an active UNICASH Membership to purchase Point Boosters. Pick a plan to continue."
                            : "Active Membership required to purchase Point Boosters. Pick a plan below to continue."}
                        </p>
                      </div>
                    </div>
                  )}

                  {isUpgrade && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#E0DAFF] bg-[#F4F1FB] p-3.5">
                      <Icon.Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6356E5]" />
                      <p className="text-[13px] leading-relaxed text-[#0f1222]">
                        <span className="font-semibold">Upgrading Membership:</span> from {userMembership?.plan?.name} to {selectedPlan?.name}.
                        Stripe will prorate and charge the difference.
                      </p>
                    </div>
                  )}

                  {shouldPreSelectOldPlan && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#FFC85D]/50 bg-[#FFF6E2] p-3.5">
                      <Icon.Info className="mt-0.5 h-4 w-4 shrink-0 text-[#9C5410]" />
                      <p className="text-[13px] leading-relaxed text-[#0f1222]">
                        <span className="font-semibold">Renewing Membership:</span> we&rsquo;ve pre-selected your previous plan ({userMembership?.plan?.name}). Change it below if you prefer a different tier.
                      </p>
                    </div>
                  )}

                  {/* Personal info */}
                  <h2 className="text-[15px] font-extrabold tracking-tight text-[#0f1222]">Personal information</h2>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-[12.5px] font-semibold text-[#0f1222]">
                        First name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                        autoComplete="given-name"
                        aria-invalid={!!errors.firstName || undefined}
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                        className={`mt-1.5 ${inputCls} ${inputBorder(!!errors.firstName)}`}
                      />
                      {errors.firstName && <FieldError id="firstName-error">{errors.firstName}</FieldError>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-[12.5px] font-semibold text-[#0f1222]">
                        Last name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        autoComplete="family-name"
                        aria-invalid={!!errors.lastName || undefined}
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                        className={`mt-1.5 ${inputCls} ${inputBorder(!!errors.lastName)}`}
                      />
                      {errors.lastName && <FieldError id="lastName-error">{errors.lastName}</FieldError>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="email" className="block text-[12.5px] font-semibold text-[#0f1222]">
                      Email <span className="text-[#EF4444]">*</span>
                    </label>
                    {user?.email && (
                      <p className="mt-1 text-[11.5px] text-[#667085]">
                        Purchasing as your logged-in account. To use a different email, log out first.
                      </p>
                    )}
                    <input
                      ref={emailInputRef}
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly={!!user?.email}
                      aria-readonly={!!user?.email}
                      onChange={handleInputChange}
                      placeholder="you@email.com"
                      autoComplete="email"
                      aria-invalid={!!errors.email || undefined}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={`mt-1.5 ${inputCls} ${inputBorder(!!errors.email)} ${user?.email ? 'cursor-not-allowed bg-[#F4F1FB]' : ''}`}
                    />
                    {errors.email && <FieldError id="email-error">{errors.email}</FieldError>}
                    {paymentError && isLoggedInEmailMismatchPaymentMessage(paymentError) && (
                      <div role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-[#FCA5A5]/50 bg-[#FEF2F2] p-3 text-[12.5px] text-[#991B1B]">
                        <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                        <span>{paymentError}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <label htmlFor="phone" className="block text-[12.5px] font-semibold text-[#0f1222]">
                      Phone number <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="04XX XXX XXX"
                      maxLength={14}
                      autoComplete="tel-national"
                      aria-invalid={!!errors.phone || undefined}
                      aria-describedby={errors.phone ? 'phone-error' : 'phone-help'}
                      className={`mt-1.5 ${inputCls} ${inputBorder(!!errors.phone)}`}
                    />
                    {errors.phone ? (
                      <FieldError id="phone-error">{errors.phone}</FieldError>
                    ) : (
                      <p id="phone-help" className="mt-1.5 text-[11.5px] text-[#667085]">
                        Australian mobile number. Auto-formats as you type (04XX XXX XXX).
                      </p>
                    )}
                  </div>

                  {/* Promo code — compact collapsible row.
                      Shows as a thin inline link by default to save vertical space; expands into the input + Apply button on click.
                      If a code is already valid, renders as a compact applied chip with a Remove action. */}
                  <div className="mt-5">
                    {promoCodeValid?.valid ? (
                      <div role="status" className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#86EFAC]/60 bg-[#F0FDF4] px-3 py-1.5 text-[12.5px] text-[#166534]">
                        <Icon.CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                        <span className="truncate">
                          Promo <span className="font-bold">{promoCode}</span> applied · −{formatAUD(promoCodeValid.discount || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setPromoCode(''); setPromoCodeValid(null); setPromoExpanded(false); }}
                          aria-label="Remove promo code"
                          className="rounded-md p-0.5 text-[#10B981] transition-colors hover:bg-[#10B981]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
                        >
                          <Icon.X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : !promoExpanded ? (
                      <button
                        type="button"
                        onClick={() => setPromoExpanded(true)}
                        aria-expanded={false}
                        className="inline-flex items-center gap-1.5 rounded-md text-[12.5px] font-semibold text-[#6356E5] transition-colors hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                      >
                        <span aria-hidden className="text-[#a3a8be]">+</span>
                        Have a promo code?
                      </button>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor="promo" className="text-[12.5px] font-semibold text-[#0f1222]">
                            Promo code
                          </label>
                          <button
                            type="button"
                            onClick={() => { setPromoExpanded(false); setPromoCode(''); setPromoCodeValid(null); }}
                            aria-label="Cancel promo code"
                            className="rounded-md text-[11.5px] font-medium text-[#667085] transition-colors hover:text-[#0f1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5]"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="mt-1.5 flex gap-2">
                          <input
                            id="promo"
                            type="text"
                            value={promoCode}
                            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoCodeValid(null); }}
                            placeholder="Enter code"
                            autoComplete="off"
                            autoFocus
                            className="h-11 flex-1 rounded-xl border border-[#E0DAFF] bg-white px-3.5 text-[13.5px] uppercase text-[#0f1222] placeholder-[#a3a8be] transition-all hover:border-[#c8c5ea] focus:border-[#6356e5] focus:outline-none focus:ring-2 focus:ring-[#6356e5]/30"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!promoCode.trim()) return;
                              setPromoCodeValidating(true);
                              try {
                                const response = await api.promoCodes.validate(promoCode.trim(), originalTotalAmount);
                                setPromoCodeValid(response.data);
                              } catch (error: any) {
                                setPromoCodeValid({ valid: false, error: error?.response?.data?.error || 'Failed to validate promo code' });
                              } finally {
                                setPromoCodeValidating(false);
                              }
                            }}
                            disabled={promoCodeValidating || !promoCode.trim()}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#6356E5] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {promoCodeValidating ? 'Checking…' : 'Apply'}
                          </button>
                        </div>
                        {promoCodeValid && !promoCodeValid.valid && (
                          <p role="alert" className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[#FEF2F2] px-2.5 py-1 text-[12px] font-medium text-[#991B1B] ring-1 ring-[#FCA5A5]/50">
                            <Icon.AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#EF4444]" />
                            <span>{promoCodeValid.error || 'Invalid promo code'}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {errors.membership && (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-[#FCA5A5]/50 bg-[#FEF2F2] p-3.5 text-[13px] text-[#991B1B]">
                      <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                      <span>{errors.membership}</span>
                    </div>
                  )}

                  {paymentError && !isLoggedInEmailMismatchPaymentMessage(paymentError) && (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-[#FCA5A5]/50 bg-[#FEF2F2] p-3.5 text-[13px] text-[#991B1B]">
                      <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Inline (desktop) Continue button — sticky bar covers mobile */}
                  <div className="mt-6 hidden lg:block">
                    <button
                      onClick={handleContinueToPayment}
                      disabled={loading || isProcessingPayment || (requiresMembership && !selectedPlan)}
                      className={primaryBtnCls}
                    >
                      {loading || isProcessingPayment ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden />
                          Processing…
                        </>
                      ) : (
                        <>
                          <Icon.Lock className="h-4 w-4" />
                          Continue to Secure Payment
                          <Icon.ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    {requiresMembership && !selectedPlan && (
                      <p className="mt-2 text-center text-[12.5px] text-[#991B1B]">Please select a Membership plan to continue.</p>
                    )}

                    {/* Trust strip — moved INSIDE the form card so it sits anchored to the CTA, not floating beneath */}
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[#E7E9F2] pt-4 text-[12px] text-[#667085]">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                        Bank-grade Stripe checkout
                      </span>
                      <span aria-hidden className="text-[#cfc8e8]">·</span>
                      <span>Membership renews monthly</span>
                      <span aria-hidden className="text-[#cfc8e8]">·</span>
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                </>
              )}

              {step === 'pay' && !clientSecret && isProcessingPayment && (
                <div className="py-12 text-center">
                  <Icon.Spinner className="mx-auto h-10 w-10" />
                  <p className="mt-3 text-[14px] text-[#4b5563]">Updating payment…</p>
                </div>
              )}

              {step === 'pay' && clientSecret && paymentId && (
                <div>
                  {/* No outer heading — Stripe's PaymentElement renders its own "Payment" label,
                      and we don't want duplicate section titles. Saved-cards header below acts as
                      the only label when relevant. */}
                  {savedCards.length > 0 && (
                    <div className="mb-4 sm:mb-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">Saved cards</h3>
                      <div className="mt-2.5 space-y-1.5 sm:mt-3 sm:space-y-2">
                        {savedCards.map((card) => {
                          const isSelected = payWithSavedId === card.id;
                          return (
                            <label
                              key={card.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all sm:p-3.5 ${
                                isSelected ? 'border-[#6356e5] bg-[#F4F1FB]' : 'border-[#E7E9F2] bg-white hover:border-[#c8c5ea]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="payWithCard"
                                checked={isSelected}
                                onChange={() => setPayWithSavedId(card.id)}
                                className="sr-only"
                              />
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                  isSelected ? 'border-[#6356e5] bg-[#6356e5]' : 'border-[#cfc8e8] bg-white'
                                }`}
                                aria-hidden
                              >
                                {isSelected && <Icon.Check className="h-3 w-3 text-white" />}
                              </span>
                              <span className="flex-1 text-[13.5px] font-semibold text-[#0f1222]">
                                {card.brand.toUpperCase()} •••• {card.last4}
                                {card.isDefault && <span className="ml-2 text-[11px] font-medium text-[#6356E5]">(Default)</span>}
                              </span>
                            </label>
                          );
                        })}
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all sm:p-3.5 ${
                            payWithSavedId === null ? 'border-[#6356e5] bg-[#F4F1FB]' : 'border-[#E7E9F2] bg-white hover:border-[#c8c5ea]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payWithCard"
                            checked={payWithSavedId === null}
                            onChange={() => setPayWithSavedId(null)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              payWithSavedId === null ? 'border-[#6356e5] bg-[#6356e5]' : 'border-[#cfc8e8] bg-white'
                            }`}
                            aria-hidden
                          >
                            {payWithSavedId === null && <Icon.Check className="h-3 w-3 text-white" />}
                          </span>
                          <span className="flex-1 text-[13.5px] font-semibold text-[#0f1222]">Use a new card</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <StripeCheckoutForm
                    key={`${user?.id || 'guest'}-${paymentId}-${payWithSavedId ?? 'new'}`}
                    clientSecret={clientSecret}
                    paymentId={paymentId}
                    amount={totalAmount}
                    currency="AUD"
                    buttonText={selectedPlan ? 'Pay & Start Membership' : 'Complete Payment'}
                    savedPaymentMethod={
                      payWithSavedId
                        ? (() => {
                            const c = savedCards.find((x) => x.id === payWithSavedId);
                            return c ? { id: c.id, brand: c.brand, last4: c.last4 } : null;
                          })()
                        : null
                    }
                  />

                  {/* Note: StripeCheckoutForm internally renders <PaymentTrustStrip /> with the
                      "100% Safe and Secure Payments" + provider logos. We don't duplicate trust messaging here. */}

                  <button
                    type="button"
                    onClick={() => {
                      setStep('info');
                      setClientSecret(null);
                      setPaymentId(null);
                    }}
                    className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium text-[#667085] transition-colors hover:text-[#0f1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    <Icon.ArrowLeft className="h-3.5 w-3.5" />
                    Back to your details
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right column — sticky order summary on desktop, normal flow on mobile */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-6">
              {renderOrderSummary()}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA bar — Step 1 has button, Step 2 shows total only (Stripe form has its own pay button) */}
      <div
        /* Glass blur without iOS drift: fixed wrapper has NO backdrop-filter;
           the frosted layer is a separate -z-10 child so it stays pinned. */
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E7E9F2] shadow-[0_-12px_30px_-12px_rgba(15,18,34,0.18)] lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div aria-hidden className="absolute inset-0 -z-10 bg-white/80 backdrop-blur-xl" />
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Total today</p>
            <p className="text-[18px] font-extrabold tracking-tight text-[#6356E5]">{formatAUD(totalAmount)}</p>
          </div>
          {step === 'info' ? (
            <button
              onClick={handleContinueToPayment}
              disabled={loading || isProcessingPayment || (requiresMembership && !selectedPlan)}
              className="uc-lift-sm inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading || isProcessingPayment ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden />
                  Processing…
                </>
              ) : (
                <>
                  <Icon.Lock className="h-4 w-4" />
                  Continue
                  <Icon.ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F1FB] px-3.5 py-2 text-[12px] font-semibold text-[#6356E5]">
              <Icon.Lock className="h-3.5 w-3.5" />
              Complete payment above
            </span>
          )}
        </div>
      </div>

      {/* RESUME-1 — Email-exists modal. Two modes:
            * 'login'   — inline login (existing user, no active membership)
            * 'blocked' — terminal "already a member" screen
          Both kept inside the same wrapper so the open/close UX feels the same. */}
      {showEmailExistsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1222]/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-exists-title"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(15,18,34,0.45)] sm:p-7">
            <button
              type="button"
              onClick={() => {
                setShowEmailExistsModal(false);
                setResumeMode(null);
                setResumePassword('');
                setResumePasswordError(null);
                setResumeResetSent(false);
              }}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#F4F1FB] hover:text-[#0f1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5]"
            >
              <Icon.X className="h-4 w-4" />
            </button>

            {resumeMode === 'login' ? (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8EC] ring-1 ring-[#FFE2B0]">
                  <Icon.AlertCircle className="h-6 w-6 text-[#9C5410]" />
                </div>
                <h2
                  id="email-exists-title"
                  className="mt-4 text-center text-[20px] font-extrabold tracking-tight text-[#0f1222] sm:text-[22px]"
                >
                  Welcome back
                </h2>
                <p className="mt-2 text-center text-[13.5px] leading-relaxed text-[#4b5563]">
                  We found your UNICASH account for{' '}
                  <span className="font-semibold text-[#0f1222]">{formData.email}</span>.
                  Enter your password to continue with checkout.
                </p>

                <div className="mt-5 space-y-3">
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-[#E0DAFF] bg-[#F4F1FB] px-4 py-3.5 text-[14.5px] text-[#667085]"
                  />
                  <input
                    type="password"
                    placeholder="Password*"
                    autoFocus
                    value={resumePassword}
                    onChange={(e) => {
                      setResumePassword(e.target.value);
                      if (resumePasswordError) setResumePasswordError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !resumeLoggingIn) handleResumeLogin();
                    }}
                    className="w-full rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] px-4 py-3.5 text-[14.5px] text-[#0F1222] transition focus:border-[#6356E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6356E5]/30"
                  />

                  {resumePasswordError && (
                    <div className="rounded-2xl bg-[#FEF2F2] p-3 ring-1 ring-[#FCA5A5]/60">
                      <div className="flex items-start gap-2">
                        <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                        <p className="text-[13px] text-[#991B1B]">{resumePasswordError}</p>
                      </div>
                    </div>
                  )}

                  {resumeResetSent ? (
                    <div className="rounded-2xl bg-[#ECFDF5] p-3 ring-1 ring-[#A7F3D0]">
                      <p className="text-[12.5px] text-[#065F46]">
                        If an account exists for{' '}
                        <span className="font-semibold">{formData.email}</span>, we&apos;ve sent
                        a password reset link. Check your inbox.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResumeForgotPassword}
                      className="text-[12.5px] font-semibold text-[#6356E5] hover:underline"
                    >
                      Forgot your password?
                    </button>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={resumeLoggingIn}
                    onClick={handleResumeLogin}
                    className="uc-lift-sm inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resumeLoggingIn ? (
                      <>
                        <Icon.Spinner className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                        Logging you in…
                      </>
                    ) : (
                      <>
                        Log in &amp; continue
                        <Icon.ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, email: '' }));
                      setShowEmailExistsModal(false);
                      setResumeMode(null);
                      setResumePassword('');
                      setResumePasswordError(null);
                      setResumeResetSent(false);
                      setTimeout(() => emailInputRef.current?.focus(), 0);
                    }}
                    className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#E7E9F2] bg-white text-[13px] font-semibold text-[#667085] transition-colors hover:border-[#c8c5ea] hover:bg-[#FBFAFF] hover:text-[#6356E5]"
                  >
                    Use a different email
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F1FB] ring-1 ring-[#E0DAFF]">
                  <Icon.AlertCircle className="h-6 w-6 text-[#6356E5]" />
                </div>
                <h2
                  id="email-exists-title"
                  className="mt-4 text-center text-[20px] font-extrabold tracking-tight text-[#0f1222] sm:text-[22px]"
                >
                  You&apos;re already a UNICASH member
                </h2>
                <p className="mt-2 text-center text-[13.5px] leading-relaxed text-[#4b5563]">
                  The email <span className="font-semibold text-[#0f1222]">{formData.email}</span>{' '}
                  has an active membership. Log in to manage your benefits, scan receipts, or join
                  Bonus Draws.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="uc-lift-sm inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[14px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    Log in to your account
                    <Icon.ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, email: '' }));
                      setShowEmailExistsModal(false);
                      setResumeMode(null);
                      setTimeout(() => emailInputRef.current?.focus(), 0);
                    }}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#E7E9F2] bg-white text-[14px] font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    Use a different email
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
          <PaintedBackground />
          <div className="relative text-center">
            <Icon.Spinner className="mx-auto h-12 w-12" />
            <p className="mt-4 text-[14px] text-[#4b5563]">Loading checkout…</p>
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
