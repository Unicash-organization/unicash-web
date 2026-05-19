'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import LoadingRing from '@/components/LoadingRing';

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const Icon = {
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
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
  Coins: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Receipt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M14 8H8M16 12H8M13 16H8" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  Gift: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    </svg>
  ),
  Sparkle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  ),
  Receipt2: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 8a4 4 0 0 0-4-4H3v18l4-4 4 4 4-4 6 6V12" />
    </svg>
  ),
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Receipt3: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Copy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   OrderIdRow — short masked Order ID with one-click copy.
   UUIDs are 36 chars and look messy on a premium receipt screen, so we
   show only the last 8 chars (e.g. "…a91f5f3a") and let the user copy
   the full ID if they need it for support. The full ID is also in the
   email receipt — this just keeps the UI clean.
----------------------------------------------------------------------- */
function OrderIdRow({ orderId }: { orderId: string }) {
  const [copied, setCopied] = useState(false);
  const shortId = orderId.length > 8 ? `…${orderId.slice(-8)}` : orderId;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(orderId);
      } else if (typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = orderId;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (_) {
      // No-op — full ID is also in the receipt email
    }
  };

  return (
    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10.5px] text-[#667085] sm:text-[11px]">
      <span>Order ref:</span>
      <span className="font-mono text-[#0F1222]" title={orderId}>{shortId}</span>
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
          copied
            ? 'bg-[#ECFDF5] text-[#10B981]'
            : 'text-[#6356E5] hover:bg-[#F4F1FB]'
        }`}
        aria-label={copied ? 'Order ID copied' : 'Copy full Order ID'}
      >
        {copied ? (
          <>
            <Icon.Check className="h-3 w-3" />
            Copied
          </>
        ) : (
          <>
            <Icon.Copy className="h-3 w-3" />
            Copy
          </>
        )}
      </button>
    </p>
  );
}

/* -----------------------------------------------------------------------
   CelebrationConfetti — full-page falling confetti.
   60 thin paper-style rectangles fall from top with gravity + rotation +
   horizontal drift. Purple + gold + white palette. Plays once on mount,
   ~3s duration, then component unmounts itself. Honors prefers-reduced-motion.
----------------------------------------------------------------------- */
function CelebrationConfetti() {
  const [active, setActive] = useState(true);
  const [particleCount, setParticleCount] = useState(60);

  useEffect(() => {
    // Adaptive particle count — fewer on mobile for performance + visual balance
    if (typeof window !== 'undefined') {
      setParticleCount(window.innerWidth < 640 ? 40 : 60);
    }
    // Unmount after animation completes (max duration ~3.4s + buffer)
    const t = setTimeout(() => setActive(false), 4500);
    return () => clearTimeout(t);
  }, []);

  if (!active) return null;

  // Deterministic particles — no SSR mismatch
  const palette = ['#6356E5', '#8B7BFF', '#FFE2B0', '#FFC85D', '#FFFFFF'];
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    left: (i * 17) % 100, // 0-100% spread horizontally
    delay: (i * 50) % 800, // 0-800ms stagger
    duration: 2400 + ((i * 73) % 1000), // 2400-3400ms fall duration
    color: palette[i % palette.length],
    rotateStart: (i * 31) % 360,
    rotateEnd: ((i * 31) % 360) + 720, // 2 full rotations during fall
    drift: ((i * 37) % 80) - 40, // -40 to +40 px horizontal drift
    width: 4 + (i % 3), // 4-6 px wide
    height: 8 + ((i * 7) % 8), // 8-15 px tall
  }));

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="uc-confetti absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            ['--drift' as any]: `${p.drift}px`,
            ['--rotate-start' as any]: `${p.rotateStart}deg`,
            ['--rotate-end' as any]: `${p.rotateEnd}deg`,
            animationDuration: `${p.duration}ms`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes uc-confetti-fall {
          0%   { transform: translate(0, -10vh) rotate(var(--rotate-start)); opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translate(var(--drift), 110vh) rotate(var(--rotate-end)); opacity: 0; }
        }
        .uc-confetti {
          animation-name: uc-confetti-fall;
          animation-timing-function: cubic-bezier(0.21, 0.61, 0.35, 1);
          animation-fill-mode: forwards;
          animation-iteration-count: 1;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .uc-confetti { animation: none !important; opacity: 0 !important; }
        }
      ` }} />
    </div>
  );
}

/* -----------------------------------------------------------------------
   V4 Booster catalog — canonical UNICASH packs.
   Used to resolve booster name when backend doesn't populate `payment.boostPack.name`.
   Match by exact price or credits amount (both are unique per pack).
----------------------------------------------------------------------- */
const V4_BOOSTER_CATALOG: { name: string; price: number; points: number; tagline: string }[] = [
  { name: 'Booster Spark', price: 4.99,  points: 250,   tagline: 'A simple top-up when you need a small Points boost.' },
  { name: 'Booster Pulse', price: 19.99, points: 1200,  tagline: 'A balanced top-up for Members who want more flexibility.' },
  { name: 'Booster Surge', price: 29.99, points: 2000,  tagline: 'The best-value top-up for Members who want more extra Points.' },
];

/* -----------------------------------------------------------------------
   V4 Plan catalog — canonical UNICASH membership tiers.
   Used as a display fallback when backend hasn't populated `payment.plan`
   or `membership.plan` yet (e.g. immediately after checkout). Match by
   exact monthly price.
----------------------------------------------------------------------- */
const V4_PLAN_CATALOG: { name: string; priceMonthly: number; monthlyPoints: number; majorDrawEntries: number }[] = [
  { name: 'UniOne',  priceMonthly: 19.99, monthlyPoints: 300,  majorDrawEntries: 1 },
  { name: 'UniPlus', priceMonthly: 49.99, monthlyPoints: 1000, majorDrawEntries: 4 },
  { name: 'UniMax',  priceMonthly: 99.99, monthlyPoints: 2500, majorDrawEntries: 10 },
];

function resolvePlan(payment: any, membership: any) {
  // Priority 1 — backend membership data
  if (membership?.plan?.name) {
    return {
      name: membership.plan.name,
      priceMonthly: membership.plan.priceMonthly,
      monthlyPoints: membership.plan.freeCreditsPerPeriod || 0,
      majorDrawEntries: membership.plan.grandPrizeEntriesPerPeriod || 0,
    };
  }
  // Priority 2 — backend payment plan data
  if (payment?.plan?.name) {
    return {
      name: payment.plan.name,
      priceMonthly: payment.plan.priceMonthly,
      monthlyPoints: payment.plan.freeCreditsPerPeriod || 0,
      majorDrawEntries: payment.plan.grandPrizeEntriesPerPeriod || 0,
    };
  }
  // Priority 3 — match V4 catalog by amount (covers the common case of
  // /thank-you loading before the membership API has caught up)
  const amount = parseFloat(payment?.amount?.toString() || '0');
  const KNOWN_BOOSTER_PRICES = [4.99, 19.99, 29.99];
  // Exclude shared price $19.99 — it's a Booster Pulse, not a UniOne plan
  const matched = V4_PLAN_CATALOG.find(
    (p) => Math.abs(p.priceMonthly - amount) < 0.01 && !KNOWN_BOOSTER_PRICES.includes(amount),
  );
  if (matched) return matched;
  // Priority 4 — generic fallback
  return { name: 'Membership', priceMonthly: undefined as number | undefined, monthlyPoints: 0, majorDrawEntries: 0 };
}

function resolveBooster(payment: any): { name: string; tagline: string; isGeneric: boolean } {
  // Priority 1: backend-supplied name (use as-is, may include real DB name)
  const backendName = payment?.boostPack?.name;
  if (backendName && backendName.trim()) {
    // Try to match catalog for tagline; otherwise use backend name with neutral tagline
    const matched = V4_BOOSTER_CATALOG.find((b) => b.name === backendName);
    return {
      name: backendName,
      tagline: matched?.tagline || 'A one-time top-up added to your Points balance.',
      isGeneric: false,
    };
  }

  // Priority 2: match V4 catalog by amount or credits — works regardless of backend payload
  const amount = parseFloat(payment?.amount?.toString() || '0');
  const credits = Number(payment?.creditsGranted || 0);
  const match = V4_BOOSTER_CATALOG.find(
    (b) => Math.abs(b.price - amount) < 0.01 || b.points === credits,
  );
  if (match) return { name: match.name, tagline: match.tagline, isGeneric: false };

  // Priority 3: unknown pack — caller should lead with Points amount instead
  // of repeating the word "Point Booster"
  return { name: '', tagline: 'A one-time top-up added to your Points balance.', isGeneric: true };
}

/* -----------------------------------------------------------------------
   Type detection — scenario resolver from existing payment/membership data.
   No backend changes. Reads existing fields only.
----------------------------------------------------------------------- */
type SuccessKind =
  | 'membership'
  | 'booster'
  | 'booster_member' // 2026-05-19: existing active member buying a booster — diff copy from cold booster
  | 'combo'
  | 'reactivated'
  | 'major_draw_entry' // 2026-05-19: active member bought a Major Draw landing package
  | 'fallback';

function resolveSuccessKind(payment: any, membership: any): SuccessKind {
  if (!payment) return 'fallback';

  // 2026-05-19 — Major Draw landing one-time package (e.g. /win/[slug] "5×
  // ENTRIES" promo). BE stores payment.metadata.majorDrawLanding=true; guest
  // path lands on /win/purchase-success, but logged-in members land here.
  // Detect first because the dollar amount can be huge ($500+) which would
  // otherwise fall to 'fallback'.
  if (payment.metadata?.majorDrawLanding === true) return 'major_draw_entry';

  // Membership signals — ANY of these strongly indicates a membership purchase.
  // Backend may not always populate `payment.plan` directly, so we cross-reference
  // multiple sources: payment plan, payment planId, Stripe subscription ID,
  // membership API data, and amount matching known plan prices.
  const amount = parseFloat(payment.amount?.toString() || '0');
  const KNOWN_PLAN_PRICES = [19.99, 49.99, 99.99]; // UniOne / UniPlus / UniMax
  const KNOWN_BOOSTER_PRICES = [4.99, 19.99, 29.99];
  const KNOWN_BOOSTER_POINTS = [250, 1200, 2000];

  const hasSubscription = !!(payment.subscriptionId || payment.stripeSubscriptionId);
  const hasPlanData = !!(payment.plan?.name || payment.planId);
  const membershipPlanMatch = !!membership?.plan?.name;
  // Amount matches a plan price BUT not a booster price (avoid false-positive
  // for Booster Pulse which is also $19.99)
  const amountMatchesPlan =
    KNOWN_PLAN_PRICES.includes(amount) &&
    !KNOWN_BOOSTER_PRICES.includes(amount);

  const hasPlan = hasSubscription || hasPlanData || membershipPlanMatch || amountMatchesPlan;

  // Strict booster signal — explicit boostPack reference
  const hasBoostExplicit = !!(payment.boostPack?.name || payment.boostPackId);
  // Booster amount/points match catalog (only when no plan signal)
  const credits = Number(payment.creditsGranted || 0);
  const amountMatchesBooster = KNOWN_BOOSTER_PRICES.includes(amount) && !hasSubscription;
  const pointsMatchesBooster = KNOWN_BOOSTER_POINTS.includes(credits) && !hasSubscription;
  const hasBoost = hasBoostExplicit || (!hasPlan && (amountMatchesBooster || pointsMatchesBooster));
  // Loose fallback — credits granted with no plan signal at all
  const hasBoostFallback = !hasPlan && !hasBoost && credits > 0;

  // Reactivated detection — preserved-data signal only
  const isReactivated =
    payment.isReactivation === true ||
    payment.metadata?.isReactivation === true ||
    payment.metadata?.scenario === 'reactivation';

  // 2026-05-19 — existing active member buying a standalone booster. The
  // generic 'booster' copy ("Your Points top-up is complete") reads wrong
  // for someone who's been a UNICASH member for months. Detect by checking
  // membership API state.
  const memberIsActive = membership?.status === 'active' || membership?.status === 'pending_cancel';

  // Combo — both membership and booster in same checkout
  if (hasPlan && hasBoostExplicit) return 'combo';
  if (hasPlan && isReactivated) return 'reactivated';
  if (hasPlan) return 'membership';
  if ((hasBoost || hasBoostFallback) && memberIsActive) return 'booster_member';
  if (hasBoost || hasBoostFallback) return 'booster';
  return 'fallback';
}

/* -----------------------------------------------------------------------
   Main page
----------------------------------------------------------------------- */
function ThankYouContent() {
  /* ===== ALL ORIGINAL LOGIC PRESERVED ===== */
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const { user, refreshUser } = useAuth();
  const [payment, setPayment] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirectDrawId, setRedirectDrawId] = useState<string | null>(null);
  const hasRefreshedOnce = useRef(false);

  const formatAUD = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `A$${numAmount.toFixed(2)}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDrawId = sessionStorage.getItem('redirectDrawId');
      if (storedDrawId) {
        setRedirectDrawId(storedDrawId);
      }
    }
    if (paymentId) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!user && !token) return;
    if (hasRefreshedOnce.current) return;
    hasRefreshedOnce.current = true;
    const run = async () => {
      try {
        await refreshUser();
      } catch (_) {}
    };
    run();
  }, [refreshUser]);

  useEffect(() => {
    if (!user?.id) return;
    fetchMembership();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!redirectDrawId || membership?.status !== 'active') return;
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') sessionStorage.removeItem('redirectDrawId');
      router.push(`/giveaways/${redirectDrawId}`);
    }, 2000);
    return () => clearTimeout(t);
  }, [redirectDrawId, membership?.status, router]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await api.payments.getPaymentById(paymentId!);
      setPayment(response.data);
    } catch (error) {
      console.error('Error fetching payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembership = async () => {
    try {
      const response = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(response.data);
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  if (loading) {
    return <LoadingRing fullscreen label="Loading" />;
  }

  /* L2 (2026-05-19) — missing paymentId AND no payment data at all means
     the user landed here without going through checkout (deep-link, stale
     bookmark, refresh after sessionStorage cleared). Previously rendered
     a blank page. Now shows a calm fallback with CTAs so they're never
     stranded. */
  if (!paymentId && !payment) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white">
        <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-12 text-center sm:px-6">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF] shadow-sm">
            <Icon.Crown className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">
            Nothing to confirm yet
          </h1>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
            We couldn&apos;t find a recent purchase tied to this link. If you just
            completed a checkout, your receipt will arrive shortly. Otherwise
            head back to your account or browse Bonus Draws.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <a
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
            >
              Go to My Account
            </a>
            <a
              href="/giveaways"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] hover:border-[#6356E5] hover:text-[#6356E5]"
            >
              View Bonus Draws
            </a>
          </div>
        </div>
      </main>
    );
  }

  /* ===== Derived display data — read-only from existing fields ===== */
  const successKind = resolveSuccessKind(payment, membership);
  const resolvedPlan = resolvePlan(payment, membership);
  const planName = resolvedPlan.name;
  const planPrice = resolvedPlan.priceMonthly;
  const monthlyPoints = resolvedPlan.monthlyPoints;
  const majorDrawEntries = resolvedPlan.majorDrawEntries;
  const creditsGranted = payment?.creditsGranted || 0;
  const { name: boostPackName, tagline: boostPackTagline, isGeneric: isBoosterGeneric } = resolveBooster(payment);
  const userEmail = user?.email || payment?.customerEmail;
  const orderId = payment?.id;
  const amount = payment?.amount;

  /* ===== Scenario-specific content ===== */
  const scenarioConfig: Record<SuccessKind, {
    eyebrow: string;
    headline: React.ReactNode;
    sub: string;
    iconTone: 'green' | 'gold';
  }> = {
    membership: {
      eyebrow: 'Membership Active',
      headline: <>Welcome to <span className="uc-gold-gradient">UNICASH.</span></>,
      sub: 'Your Membership is active. You can now access your Monthly Points, Major Draw entries, Fuel Rewards, and member-only Bonus Draws.',
      iconTone: 'green',
    },
    combo: {
      eyebrow: 'Membership + Booster Active',
      headline: <>You&rsquo;re all set with <span className="uc-gold-gradient">UNICASH.</span></>,
      sub: 'Your Membership is active and your Point Booster has been added to your balance. Start exploring member-only Bonus Draws right away.',
      iconTone: 'green',
    },
    booster: {
      eyebrow: 'Point Booster Added',
      headline: <>Your Points top-up is <span className="uc-gold-gradient">complete.</span></>,
      sub: 'Your Point Booster has been added to your UNICASH balance. You can use Points for eligible member-only Bonus Draws.',
      iconTone: 'green',
    },
    // 2026-05-19 — existing member buying a Booster. Headline focuses on
    // the boost being added on TOP of what they already have, not on a
    // fresh "your Points top-up is complete" framing that sounds cold.
    booster_member: {
      eyebrow: 'Points Topped Up',
      headline: <>Your Points balance just <span className="uc-gold-gradient">grew.</span></>,
      sub: 'Your Point Booster has been added on top of your existing Membership Points. Use them anytime on member-only Bonus Draws.',
      iconTone: 'green',
    },
    // 2026-05-19 — Major Draw landing one-time package purchase. Could be
    // a brand-new member (auto-account-created) or an existing active
    // member topping up entries on a specific Major Draw.
    major_draw_entry: {
      eyebrow: 'Major Draw Entries Added',
      headline: <>You&rsquo;re in the <span className="uc-gold-gradient">Major Draw.</span></>,
      sub: 'Your entries are locked into the Major Draw pool. Watch the draw close on the live page — Winners are published for transparency.',
      iconTone: 'gold',
    },
    reactivated: {
      eyebrow: 'Membership Reactivated',
      headline: <>Welcome back to <span className="uc-gold-gradient">UNICASH.</span></>,
      sub: 'Your Membership is active again. You can continue earning Points, accessing Bonus Draws, and using your UNICASH rewards.',
      iconTone: 'gold',
    },
    fallback: {
      eyebrow: 'Payment received',
      headline: <>Payment <span className="uc-gold-gradient">received.</span></>,
      sub: "We're confirming your UNICASH details. You can continue to your account or contact support if anything looks incorrect.",
      iconTone: 'green',
    },
  };

  const config = scenarioConfig[successKind];

  /* ===== Next-action cards per scenario ===== */
  const nextActionsByKind: Record<SuccessKind, { Icon: React.FC<{ className?: string }>; iconBg: string; iconColor: string; title: string; body: string; href: string }[]> = {
    membership: [
      { Icon: Icon.Trophy, iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]', iconColor: 'text-[#6356E5]', title: 'View Bonus Draws', body: 'Use Points to access member-only Bonus Draws.', href: '/giveaways' },
      { Icon: Icon.Receipt, iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]', iconColor: 'text-[#10B981]', title: 'Scan Receipts', body: 'Earn Points and Fuel Rewards from eligible receipts.', href: '/scan-receipts' },
      { Icon: Icon.Crown, iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconColor: 'text-[#C49A2C]', title: 'Manage Membership', body: 'View your plan, billing, Points, and reward activity.', href: '/dashboard/membership' },
    ],
    combo: [
      { Icon: Icon.Trophy, iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]', iconColor: 'text-[#6356E5]', title: 'View Bonus Draws', body: 'Use your Points right away on member-only Bonus Draws.', href: '/giveaways' },
      { Icon: Icon.Coins, iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]', iconColor: 'text-[#10B981]', title: 'Check Points balance', body: 'See your Membership + Booster Points combined.', href: '/dashboard' },
      { Icon: Icon.Crown, iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconColor: 'text-[#C49A2C]', title: 'Manage Membership', body: 'View your plan, billing, Points, and reward activity.', href: '/dashboard/membership' },
    ],
    booster: [
      { Icon: Icon.Trophy, iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]', iconColor: 'text-[#6356E5]', title: 'View Bonus Draws', body: 'Use your Points for eligible member-only Bonus Draws.', href: '/giveaways' },
      { Icon: Icon.Coins, iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]', iconColor: 'text-[#10B981]', title: 'Check Points balance', body: 'See your updated Points and reward activity.', href: '/dashboard' },
      { Icon: Icon.Receipt, iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconColor: 'text-[#C49A2C]', title: 'Scan Receipts', body: 'Earn more Points from eligible receipts.', href: '/scan-receipts' },
    ],
    booster_member: [
      { Icon: Icon.Trophy, iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]', iconColor: 'text-[#6356E5]', title: 'View Bonus Draws', body: 'Use your topped-up Points on member-only Bonus Draws.', href: '/giveaways' },
      { Icon: Icon.Coins, iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]', iconColor: 'text-[#10B981]', title: 'Check Points balance', body: 'See your Membership + Booster Points combined.', href: '/dashboard' },
      { Icon: Icon.Crown, iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconColor: 'text-[#C49A2C]', title: 'Manage Membership', body: 'View your plan, billing, and reward activity.', href: '/dashboard/membership' },
    ],
    major_draw_entry: [
      { Icon: Icon.Trophy, iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconColor: 'text-[#C49A2C]', title: 'View My Entries', body: 'See your Major Draw + Bonus Draw entries.', href: '/dashboard/entries' },
      { Icon: Icon.Crown, iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]', iconColor: 'text-[#6356E5]', title: 'Go to My Account', body: 'Check your Membership, Points, and reward activity.', href: '/dashboard' },
      { Icon: Icon.Receipt, iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]', iconColor: 'text-[#10B981]', title: 'Browse Bonus Draws', body: 'Use Points to enter member-only Bonus Draws.', href: '/giveaways' },
    ],
    reactivated: [
      { Icon: Icon.Crown, iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]', iconColor: 'text-[#6356E5]', title: 'Continue to My Account', body: 'Review your active Membership and Points.', href: '/dashboard' },
      { Icon: Icon.Trophy, iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconColor: 'text-[#C49A2C]', title: 'View Bonus Draws', body: 'Use Points for member-only Bonus Draws.', href: '/giveaways' },
      { Icon: Icon.Receipt, iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]', iconColor: 'text-[#10B981]', title: 'Scan Receipts', body: 'Start earning Points again from eligible receipts.', href: '/scan-receipts' },
    ],
    fallback: [
      { Icon: Icon.Crown, iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]', iconColor: 'text-[#6356E5]', title: 'Go to My Account', body: 'View your account and any pending purchases.', href: '/dashboard' },
      { Icon: Icon.Trophy, iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconColor: 'text-[#C49A2C]', title: 'View Bonus Draws', body: 'Browse member-only Bonus Draws.', href: '/giveaways' },
      { Icon: Icon.Mail, iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]', iconColor: 'text-[#10B981]', title: 'Contact Support', body: 'If anything looks incorrect, reach out and we\'ll help.', href: 'mailto:support@unicash.com' },
    ],
  };

  const nextActions = nextActionsByKind[successKind];

  /* Primary + secondary CTA based on scenario */
  const primaryCta =
    successKind === 'major_draw_entry'
      ? { label: 'View My Entries', href: '/dashboard/entries' }
      : successKind === 'booster' || successKind === 'booster_member'
        ? { label: 'View Bonus Draws', href: '/giveaways' }
        : { label: 'Go to My Account', href: '/dashboard' };
  const secondaryCta =
    successKind === 'major_draw_entry'
      ? { label: 'Go to My Account', href: '/dashboard' }
      : successKind === 'booster' || successKind === 'booster_member'
        ? { label: 'Go to My Account', href: '/dashboard' }
        : { label: 'View Bonus Draws', href: '/giveaways' };

  /* Receipt note per scenario */
  const receiptPrefix = userEmail ? `A receipt has been sent to ${userEmail}.` : 'Your receipt will be sent to your registered email address.';
  const receiptNote =
    successKind === 'membership' || successKind === 'reactivated'
      ? `${receiptPrefix} Your Membership renews monthly until cancelled.`
      : successKind === 'booster'
        ? `${receiptPrefix} This Point Booster is a one-time purchase and does not auto-renew.`
        : successKind === 'booster_member'
          ? `${receiptPrefix} This Point Booster is a one-time top-up and does not affect your Membership renewal.`
          : successKind === 'combo'
            ? `${receiptPrefix} Your Membership renews monthly. Your Point Booster is a one-time purchase and does not auto-renew.`
            : successKind === 'major_draw_entry'
              ? `${receiptPrefix} This Major Draw entry package is a one-time purchase and does not auto-renew.`
              : 'Your receipt will be sent to your registered email address.';

  /* Trust line per scenario */
  const trustLine =
    successKind === 'booster' || successKind === 'booster_member'
      ? ['One-time purchase', 'No auto-renew', 'Points added to your balance']
      : successKind === 'reactivated'
        ? ['Membership active', 'Secure checkout', 'Cancel anytime']
        : successKind === 'combo'
          ? ['Membership active', 'Booster added', 'Cancel anytime']
          : successKind === 'major_draw_entry'
            ? ['Entries locked in', 'Winners published', 'Transparent outcomes']
            : ['Secure checkout', 'Membership active', 'Winners published'];

  /* =====================================================================
     JSX — v4 redesigned thank you page
  ===================================================================== */
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white">
      {/* Full-page falling confetti — plays once, then unmounts */}
      <CelebrationConfetti />

      {/* Painted mesh background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-[15%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/15 blur-[140px]" />
        <div className="absolute right-[-10%] top-1/4 h-[380px] w-[380px] rounded-full bg-[#FFE2B0]/14 blur-[120px]" />
        <div className="absolute left-[-12%] bottom-[-10%] h-[360px] w-[360px] rounded-full bg-[#6356E5]/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(99,86,229,0.18) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        {/* ============================================================
            SUCCESS HERO CARD
        ============================================================ */}
        <article className="relative overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white px-5 py-7 text-center shadow-[0_18px_50px_-22px_rgba(99,86,229,0.28),0_4px_14px_-8px_rgba(15,18,34,.06)] sm:px-10 sm:py-10 sm:shadow-[0_30px_80px_-30px_rgba(99,86,229,0.30),0_8px_24px_-12px_rgba(15,18,34,.06)]">
          {/* Soft glow halo behind icon */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-4 -z-0 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#6356E5]/15 via-[#8B7BFF]/10 to-[#FFE2B0]/15 blur-3xl sm:top-6 sm:h-40 sm:w-40" />

          {/* Success check icon */}
          <div className="relative z-20 mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10B981] to-[#34D399] shadow-[0_14px_30px_-8px_rgba(16,185,129,0.50)] ring-4 ring-white sm:mb-4 sm:h-16 sm:w-16">
            <Icon.Check className="h-7 w-7 text-white sm:h-8 sm:w-8" />
          </div>

          {/* Eyebrow */}
          <p className="relative z-20 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5] sm:text-[11px] sm:tracking-[0.18em]">
            ✨ {config.eyebrow}
          </p>

          {/* Headline — tighter on mobile, scales up on larger */}
          <h1 className="relative z-20 mt-2 text-[23px] font-extrabold leading-[1.12] tracking-tight text-[#0F1222] sm:mt-2.5 sm:text-[32px] md:text-[36px]">
            {config.headline}
          </h1>

          {/* Subheadline */}
          <p className="relative z-20 mx-auto mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-[#4B5563] sm:mt-3 sm:text-[15.5px]">
            {config.sub}
          </p>

          {/* Auto-redirect note when redirecting to draw */}
          {redirectDrawId && membership?.status === 'active' && (
            <div className="relative z-20 mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-[#F4F1FB] px-3.5 py-1.5 text-[12px] font-semibold text-[#6356E5] ring-1 ring-[#E0DAFF] sm:mt-5 sm:px-4 sm:py-2 sm:text-[12.5px]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#6356E5]" />
              Redirecting to your Bonus Draw…
            </div>
          )}
        </article>

        {/* ============================================================
            PURCHASE SUMMARY CARD — scenario-specific
        ============================================================ */}
        <article className="mt-4 rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:mt-5 sm:p-7">
          {(successKind === 'membership' || successKind === 'reactivated') && (
            <>
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Your Membership</p>
                  <h2 className="mt-1 truncate text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[24px]">{planName}</h2>
                </div>
                {planPrice && (
                  <p className="shrink-0 whitespace-nowrap text-right text-[16px] font-extrabold tracking-tight text-[#0F1222] sm:text-[18px]">
                    {formatAUD(planPrice)}<span className="ml-0.5 text-[11.5px] font-semibold text-[#667085] sm:text-[12px]">/month</span>
                  </p>
                )}
              </div>

              {/* Stats grid */}
              {(monthlyPoints > 0 || majorDrawEntries > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                  {monthlyPoints > 0 && (
                    <div className="rounded-2xl bg-[#F4F1FB] p-3.5 ring-1 ring-[#E0DAFF] sm:p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085] sm:text-[10.5px] sm:tracking-[0.14em]">Monthly Points</p>
                      <p className="mt-1 text-[20px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[22px]">
                        {Number(monthlyPoints).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {majorDrawEntries > 0 && (
                    <div className="rounded-2xl bg-[#FFF6DA] p-3.5 ring-1 ring-[#FFC85D]/40 sm:p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9C5410] sm:text-[10.5px] sm:tracking-[0.14em]">
                        <span className="sm:hidden">Major Draw</span>
                        <span className="hidden sm:inline">Major Draw entries</span>
                      </p>
                      <p className="mt-1 text-[20px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[22px]">
                        {majorDrawEntries}<span className="ml-1 text-[11px] font-semibold text-[#667085] sm:text-[12px]">/mo</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* What's included */}
              <div className="mt-4 rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] p-3.5 sm:mt-5 sm:p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6356E5] sm:text-[11px]">Included today</p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[#4B5563] sm:text-[13.5px]">
                  {monthlyPoints > 0 && (
                    <li className="flex items-start gap-2">
                      <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                      <span>{Number(monthlyPoints).toLocaleString()} Monthly Points</span>
                    </li>
                  )}
                  {majorDrawEntries > 0 && (
                    <li className="flex items-start gap-2">
                      <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                      <span>{majorDrawEntries} Major Draw {majorDrawEntries === 1 ? 'entry' : 'entries'} monthly</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                    <span>Access to member-only Bonus Draws</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                    <span>Fuel Rewards from eligible fuel receipts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                    <span>Gift Card redemption from 2,000 Points</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {successKind === 'booster' && (
            <>
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  {isBoosterGeneric ? (
                    /* No real pack name — lead with Points figure to avoid
                       repeating "Point Booster" four times */
                    <>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Points top-up</p>
                      {creditsGranted > 0 ? (
                        <h2 className="mt-1 text-[20px] font-extrabold leading-[1.2] tracking-tight text-[#0F1222] sm:text-[24px]">
                          <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-transparent tabular-nums">
                            +{Number(creditsGranted).toLocaleString()} Points
                          </span>{' '}
                          added
                        </h2>
                      ) : (
                        <h2 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[24px]">
                          Top-up complete
                        </h2>
                      )}
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#4B5563] sm:text-[13px]">{boostPackTagline}</p>
                    </>
                  ) : (
                    /* Real pack name resolved — show eyebrow + name + tagline */
                    <>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Your Point Booster</p>
                      <h2 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[24px]">{boostPackName}</h2>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#4B5563] sm:text-[13px]">{boostPackTagline}</p>
                    </>
                  )}
                </div>
                {amount && (
                  <p className="shrink-0 whitespace-nowrap text-right text-[16px] font-extrabold tracking-tight text-[#0F1222] sm:text-[18px]">
                    {formatAUD(parseFloat(amount.toString()))}<span className="ml-0.5 text-[11.5px] font-semibold text-[#667085] sm:text-[12px]">one-time</span>
                  </p>
                )}
              </div>

              {/* Points granted — only render the big Points block when we
                  have a real pack name (otherwise the headline already shows
                  the Points figure prominently) */}
              {!isBoosterGeneric && creditsGranted > 0 && (
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] p-4 ring-1 ring-[#E0DAFF] sm:mt-5 sm:p-5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6356E5] sm:text-[11px]">Added</p>
                  <p className="mt-1 bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-[28px] font-extrabold leading-none tracking-tight text-transparent tabular-nums sm:text-[34px]">
                    {Number(creditsGranted).toLocaleString()}
                    <span className="ml-1.5 text-[13px] font-semibold text-[#667085] sm:text-[14px]">Points</span>
                  </p>
                </div>
              )}

              {/* What's included */}
              <ul className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-[#4B5563] sm:mt-5 sm:text-[13.5px]">
                <li className="flex items-start gap-2">
                  <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                  <span>Added to your Points balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                  <span>One-time purchase · No auto-renew</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                  <span>Use Points for member-only Bonus Draws</span>
                </li>
              </ul>
            </>
          )}

          {successKind === 'combo' && (
            <>
              {/* Block 1 — Membership */}
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Your Membership</p>
                  <h2 className="mt-1 truncate text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">{planName}</h2>
                </div>
                {planPrice && (
                  <p className="shrink-0 whitespace-nowrap text-right text-[15px] font-extrabold tracking-tight text-[#0F1222] sm:text-[16px]">
                    {formatAUD(planPrice)}<span className="ml-0.5 text-[11px] font-semibold text-[#667085] sm:text-[11.5px]">/month</span>
                  </p>
                )}
              </div>

              {(monthlyPoints > 0 || majorDrawEntries > 0) && (
                <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
                  {monthlyPoints > 0 && (
                    <div className="rounded-xl bg-[#F4F1FB] p-3 ring-1 ring-[#E0DAFF]">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#667085] sm:text-[10px] sm:tracking-[0.14em]">Monthly Points</p>
                      <p className="mt-0.5 text-[17px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[18px]">
                        {Number(monthlyPoints).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {majorDrawEntries > 0 && (
                    <div className="rounded-xl bg-[#FFF6DA] p-3 ring-1 ring-[#FFC85D]/40">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9C5410] sm:text-[10px] sm:tracking-[0.14em]">
                        <span className="sm:hidden">Major Draw</span>
                        <span className="hidden sm:inline">Major Draw entries</span>
                      </p>
                      <p className="mt-0.5 text-[17px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[18px]">
                        {majorDrawEntries}<span className="ml-1 text-[10.5px] font-semibold text-[#667085] sm:text-[11px]">/mo</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="my-4 flex items-center gap-3 sm:my-5">
                <span className="h-px flex-1 bg-[#EFEDF5]" />
                <span className="rounded-full bg-[#F4F1FB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">+ Bonus</span>
                <span className="h-px flex-1 bg-[#EFEDF5]" />
              </div>

              {/* Block 2 — Booster */}
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  {isBoosterGeneric ? (
                    /* No real pack name — lead with Points figure */
                    <>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Bonus Points top-up</p>
                      {creditsGranted > 0 ? (
                        <h3 className="mt-1 text-[17px] font-extrabold leading-[1.2] tracking-tight text-[#0F1222] sm:text-[20px]">
                          <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-transparent tabular-nums">
                            +{Number(creditsGranted).toLocaleString()} Points
                          </span>{' '}
                          added
                        </h3>
                      ) : (
                        <h3 className="mt-1 text-[17px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">
                          Top-up added
                        </h3>
                      )}
                      <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563] sm:text-[12.5px]">{boostPackTagline}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Your Point Booster</p>
                      <h3 className="mt-1 text-[17px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">{boostPackName}</h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563] sm:text-[12.5px]">{boostPackTagline}</p>
                    </>
                  )}
                </div>
                {payment?.boostPack?.price && (
                  <p className="shrink-0 whitespace-nowrap text-right text-[14px] font-extrabold tracking-tight text-[#0F1222] sm:text-[15px]">
                    {formatAUD(parseFloat(payment.boostPack.price.toString()))}<span className="ml-0.5 text-[10.5px] font-semibold text-[#667085] sm:text-[11px]">one-time</span>
                  </p>
                )}
              </div>

              {/* Big Points block — only when we have a real pack name; the
                  generic headline above already leads with the Points figure */}
              {!isBoosterGeneric && creditsGranted > 0 && (
                <div className="mt-3 rounded-xl bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] p-3 ring-1 ring-[#E0DAFF] sm:p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">Booster Points added</p>
                  <p className="mt-0.5 bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-[22px] font-extrabold leading-none tracking-tight text-transparent tabular-nums sm:text-[24px]">
                    {Number(creditsGranted).toLocaleString()}
                    <span className="ml-1.5 text-[11.5px] font-semibold text-[#667085] sm:text-[12px]">Points</span>
                  </p>
                </div>
              )}

              {/* Combined "What's included" */}
              <div className="mt-4 rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] p-3.5 sm:mt-5 sm:p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6356E5] sm:text-[11px]">Included today</p>
                <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-[#4B5563] sm:text-[13px]">
                  {monthlyPoints > 0 && (
                    <li className="flex items-start gap-2">
                      <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                      <span>{Number(monthlyPoints).toLocaleString()} Monthly Points</span>
                    </li>
                  )}
                  {creditsGranted > 0 && (
                    <li className="flex items-start gap-2">
                      <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                      <span><span className="font-semibold text-[#0F1222]">+{Number(creditsGranted).toLocaleString()}</span> Booster Points (one-time)</span>
                    </li>
                  )}
                  {majorDrawEntries > 0 && (
                    <li className="flex items-start gap-2">
                      <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                      <span>{majorDrawEntries} Major Draw {majorDrawEntries === 1 ? 'entry' : 'entries'} monthly</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                    <span>Access to member-only Bonus Draws</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                    <span>Fuel Rewards from eligible fuel receipts</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {successKind === 'fallback' && (
            <div className="text-center">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Payment received</p>
              <h2 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0F1222]">
                We&rsquo;re finalising your purchase
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#4B5563]">
                Your UNICASH purchase is being confirmed. If your Membership or Points don&rsquo;t appear shortly, please contact support.
              </p>
            </div>
          )}
        </article>

        {/* ============================================================
            PRIMARY + SECONDARY CTAs — moved up right after summary.
            User sees action button immediately without scrolling past
            the Account Access card (which is now in footer).
        ============================================================ */}
        <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:gap-3">
          <Link
            href={primaryCta.href}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 sm:flex-1 sm:text-[14.5px]"
          >
            {primaryCta.label}
            <Icon.ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
          <Link
            href={secondaryCta.href}
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#E0DAFF] bg-white px-5 text-[14px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 sm:flex-1 sm:text-[14.5px]"
          >
            {secondaryCta.label}
          </Link>
        </div>

        {/* ============================================================
            WHAT YOU CAN DO NEXT — 3 action cards
        ============================================================ */}
        <section className="mt-8 sm:mt-10">
          <p className="mb-3 text-center text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5] sm:mb-4 sm:text-[11px] sm:tracking-[0.18em]">
            What you can do next
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
            {nextActions.map(({ Icon: ActionIcon, iconBg, iconColor, title, body, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-start gap-3 rounded-2xl border border-[#E7E9F2] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-all hover:-translate-y-0.5 hover:border-[#C9C0F2] hover:shadow-[0_8px_24px_-12px_rgba(99,86,229,0.20)] sm:flex-col sm:gap-0 sm:p-5"
              >
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${iconBg} sm:h-10 sm:w-10`}>
                  <ActionIcon className={`h-3.5 w-3.5 ${iconColor} sm:h-4 sm:w-4`} />
                </span>
                <div className="min-w-0 flex-1 sm:mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-extrabold tracking-tight text-[#0F1222] sm:text-[14px]">{title}</p>
                    <Icon.ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6356E5] transition-transform group-hover:translate-x-0.5 sm:hidden" />
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[#4B5563] sm:mt-1">{body}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================
            UNIFIED FOOTER CARD — 3 mini blocks separated by hairlines:
            • Receipt note + Order ID
            • Account access (magic-link friendly)
            • Trust line + Support
        ============================================================ */}
        <article className="mt-6 overflow-hidden rounded-2xl border border-[#E7E9F2] bg-white sm:mt-8">
          {/* Block 1: Receipt note + Order ID */}
          <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
              <Icon.Receipt3 className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-[12px] leading-relaxed text-[#4B5563] sm:text-[12.5px]">
              <p>{receiptNote}</p>
              {orderId && <OrderIdRow orderId={orderId} />}
            </div>
          </div>

          {/* Block 2: Account access (magic-link friendly) */}
          <div className="flex items-start gap-3 border-t border-[#EFEDF5] px-4 py-3.5 sm:px-5 sm:py-4">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
              <Icon.Mail className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-[12px] leading-relaxed text-[#4B5563] sm:text-[12.5px]">
              <p className="font-semibold text-[#0F1222]">Account access</p>
              <p className="mt-0.5">
                Log in anytime with your email
                {userEmail && (
                  <>
                    {' '}
                    <span className="break-all font-semibold text-[#0F1222]">({userEmail})</span>
                  </>
                )}
                . You can set a password later from Account Settings.
              </p>
            </div>
          </div>

          {/* Block 3: Trust line + Support */}
          <div className="border-t border-[#EFEDF5] bg-[#FBFAFF] px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] text-[#667085] sm:gap-x-2.5 sm:gap-y-1 sm:text-[11.5px]">
              {trustLine.map((item, i) => (
                <React.Fragment key={item}>
                  {i > 0 && <span aria-hidden className="text-[#cfc8e8]">·</span>}
                  <span className="inline-flex items-center gap-1">
                    {i === 0 && <Icon.ShieldCheck className="h-3 w-3 text-[#10B981]" />}
                    {item}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <p className="mt-1.5 text-center text-[11px] text-[#667085] sm:mt-2 sm:text-[11.5px]">
              Need help?{' '}
              <a
                href="mailto:support@unicash.com"
                className="font-semibold text-[#6356E5] hover:text-[#5346D6]"
              >
                Contact UNICASH Support
              </a>
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<LoadingRing fullscreen label="Loading" />}>
      <ThankYouContent />
    </Suspense>
  );
}
