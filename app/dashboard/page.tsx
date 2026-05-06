'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { notifyAndRetryMembershipAfterPaymentUpdate } from '@/lib/membershipPaymentRetry';
import LoadingRing from '@/components/LoadingRing';
import PaymentMethodsPanel from '@/components/PaymentMethodsPanel';

/* -----------------------------------------------------------------------
   Inline icons — minimal v4 set
----------------------------------------------------------------------- */
const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Coins: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  Receipt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M14 8H8M16 12H8M13 16H8" />
    </svg>
  ),
  Gift: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    </svg>
  ),
  Bolt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m13 2-3 8h6l-3 12-2-8H4l9-12Z" />
    </svg>
  ),
  Camera: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Lock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Alert: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Pause: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Refresh: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   Membership status → display config
----------------------------------------------------------------------- */
type MemberStatusKind = 'active' | 'paused' | 'canceled' | 'past_due' | 'none';

function resolveMemberStatus(membership: any): MemberStatusKind {
  if (!membership) return 'none';
  const s = (membership.status || '').toLowerCase();
  if (s === 'paused' || membership.isPaused) return 'paused';
  if (s === 'payment_failed' || s === 'past_due') return 'past_due';
  if (s === 'canceled' || s === 'cancelled') return 'canceled';
  if (s === 'active') return 'active';
  return 'none';
}

const STATUS_DISPLAY: Record<MemberStatusKind, { label: string; tone: 'success' | 'warning' | 'error' | 'neutral'; pillBg: string; pillText: string; ring: string; icon: React.FC<{ className?: string }> }> = {
  active:    { label: 'Active',    tone: 'success', pillBg: 'bg-[#ECFDF5]', pillText: 'text-[#10B981]', ring: 'ring-[#A7F3D0]', icon: Icon.Check },
  paused:    { label: 'Paused',    tone: 'warning', pillBg: 'bg-[#FEF3C7]', pillText: 'text-[#9C5410]', ring: 'ring-[#FFC85D]/40', icon: Icon.Pause },
  canceled:  { label: 'Cancelled', tone: 'neutral', pillBg: 'bg-[#F4F1FB]', pillText: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]', icon: Icon.Refresh },
  past_due:  { label: 'Payment due', tone: 'error', pillBg: 'bg-[#FEE2E2]', pillText: 'text-[#B91C1C]', ring: 'ring-[#FCA5A5]', icon: Icon.Alert },
  none:      { label: 'No Membership', tone: 'neutral', pillBg: 'bg-[#F4F1FB]', pillText: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]', icon: Icon.Crown },
};

/* -----------------------------------------------------------------------
   V4 plan name display fallback (when backend doesn't return plan.name)
----------------------------------------------------------------------- */
const V4_PLAN_BY_PRICE: Record<string, string> = {
  '19.99': 'UniOne',
  '49.99': 'UniPlus',
  '99.99': 'UniMax',
};

export default function DashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [membership, setMembership] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [creditLedger, setCreditLedger] = useState<any[]>([]);
  const [activeDraws, setActiveDraws] = useState<any[]>([]);
  const [activeEntriesTab, setActiveEntriesTab] = useState<'mini' | 'major'>('mini');
  const [loading, setLoading] = useState(true);

  /* Stripe billing modal state — preserved from original dashboard.
     `showManagePaymentModal` controls the v4 wrapper; `hidePaymentMethodsShell`
     hides the wrapper while the inner Stripe Elements (Add/Update Card)
     modal is open, to avoid two stacked modals. */
  const [showManagePaymentModal, setShowManagePaymentModal] = useState(false);
  const [hidePaymentMethodsShell, setHidePaymentMethodsShell] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => { setPortalMounted(true); }, []);

  /* ===== Data fetching — preserved from original ===== */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadData();
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentUpdated = urlParams.get('paymentUpdated');
        if (paymentUpdated === 'true') {
          window.history.replaceState({}, '', window.location.pathname);
          setTimeout(async () => {
            await loadData();
            await refreshUser();
            await notifyAndRetryMembershipAfterPaymentUpdate({ quietIfMembershipHealthy: false });
            await loadData();
          }, 1000);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [membershipRes, paymentsRes, entryCountsRes, ledgerRes, drawsRes] = await Promise.all([
        api.membership.getUserMembership().catch(() => ({ data: null })),
        api.payments.getPaymentsByUserId(user?.id || '').catch(() => ({ data: [] })),
        api.entries.getMyEntryCountsByDraw().catch(() => ({ data: [] })),
        api.users.getCreditLedger().catch(() => ({ data: [] })),
        api.draws.getAll({ userId: user?.id, includeMajor: true, includeFuture: true }).catch(() => ({ data: [] })),
      ]);

      let currentMembership = membershipRes.data;
      setMembership(currentMembership);
      setPayments(paymentsRes.data || []);
      setCreditLedger(ledgerRes.data || []);

      const countsList = (entryCountsRes.data || []) as { drawId: string; count: number }[];
      const countByDraw = new Map<string, number>(countsList.map((c) => [c.drawId, c.count]));
      const userEntryDrawIds = new Set(countsList.map((c) => c.drawId));
      const drawsWithEntries = drawsRes.data?.filter((d: any) => userEntryDrawIds.has(d.id)) || [];
      const drawsWithUserEntries = drawsWithEntries.map((draw: any) => ({
        ...draw,
        userEntries: countByDraw.get(draw.id) ?? 0,
      }));
      drawsWithUserEntries.sort((a: any, b: any) => {
        const aTime = a.closedAt ? new Date(a.closedAt).getTime() : 0;
        const bTime = b.closedAt ? new Date(b.closedAt).getTime() : 0;
        return bTime - aTime;
      });
      setActiveDraws(drawsWithUserEntries);

      // Auto-heal payment failed membership — preserved
      if (currentMembership && (currentMembership.status === 'payment_failed' || currentMembership.status === 'past_due')) {
        try {
          const retryResult = await api.payments.retryFailedInvoice();
          if (retryResult.data?.success) {
            const refreshedMembership = await api.membership.getUserMembership().catch(() => ({ data: null }));
            if (refreshedMembership.data) setMembership(refreshedMembership.data);
          }
        } catch (err) {
          console.error('Auto retry invoice on dashboard load failed:', err);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ===== Stripe billing modal handlers — preserved logic ===== */
  const closeManagePaymentModal = () => {
    setShowManagePaymentModal(false);
    setHidePaymentMethodsShell(false);
  };
  const handleOpenManagePayment = () => {
    setHidePaymentMethodsShell(false);
    setShowManagePaymentModal(true);
  };
  const handlePaymentMethodsChanged = async () => {
    await loadData();
    await notifyAndRetryMembershipAfterPaymentUpdate({ quietIfMembershipHealthy: false });
    await loadData();
    const m = await api.membership.getUserMembership().catch(() => ({ data: null }));
    if (m.data?.status && m.data.status !== 'payment_failed' && m.data.status !== 'past_due') {
      closeManagePaymentModal();
    }
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showManagePaymentModal && !hidePaymentMethodsShell) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showManagePaymentModal, hidePaymentMethodsShell]);

  /* ===== Memoised lists — MUST be declared before any early return so
     React hook ordering stays consistent across renders. ===== */
  const recentLedger = useMemo(() => {
    return (creditLedger || [])
      .filter((l: any) => l.metadata?.action !== 'admin_force_sync')
      .slice(0, 5);
  }, [creditLedger]);

  const recentPayments = useMemo(() => (payments || []).slice(0, 3), [payments]);

  /* ===== Format helpers ===== */
  const formatDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };
  const formatDateTimeSydney = (date: string | Date) => {
    const { formatSydneyDateTime24h } = require('@/lib/timezone');
    return formatSydneyDateTime24h(date);
  };
  const formatAUD = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `A$${n.toFixed(2)}`;
  };

  if (authLoading || loading) {
    /* Skeleton screens — placeholder cards mirror the final layout so user
       gets instant structural orientation. Each grey div animates with
       Tailwind's animate-pulse (opacity 0.5 ↔ 1) for a subtle shimmer.
       Pure visual placeholder; no logic, no API change. */
    return (
      <div className="space-y-5 sm:space-y-6">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6356E5] sm:hidden">Welcome back</p>
          <h1 className="mt-1 text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:mt-0 sm:text-[28px]">
            <span className="sm:hidden">Loading…</span>
            <span className="hidden sm:inline">Dashboard</span>
          </h1>
        </header>

        {/* Status hero skeleton */}
        <article className="overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white p-5 shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)] sm:p-7">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-24 animate-pulse rounded-full bg-[#F4F1FB]" />
              <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-[#F4F1FB]" />
            </div>
            <div className="h-7 w-28 animate-pulse rounded-md bg-[#F4F1FB]" />
          </div>
          <div className="mt-3 h-4 w-40 animate-pulse rounded bg-[#F4F1FB]" />
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="h-20 animate-pulse rounded-2xl bg-[#F4F1FB]" />
            <div className="h-20 animate-pulse rounded-2xl bg-[#F4F1FB]" />
          </div>
          <div className="mt-5 h-11 w-48 animate-pulse rounded-full bg-[#F4F1FB]" />
        </article>

        {/* Points balance skeleton */}
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-7">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[#F4F1FB]" />
            <div className="h-12 w-40 animate-pulse rounded-lg bg-[#F4F1FB]" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#F4F1FB]" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="h-16 animate-pulse rounded-2xl bg-[#F4F1FB]" />
            <div className="h-16 animate-pulse rounded-2xl bg-[#F4F1FB]" />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="h-11 w-full animate-pulse rounded-full bg-[#F4F1FB] sm:w-44" />
            <div className="h-11 w-full animate-pulse rounded-full bg-[#F4F1FB] sm:w-40" />
          </div>
        </article>

        {/* Quick actions skeleton */}
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-6">
          <div className="h-4 w-28 animate-pulse rounded bg-[#F4F1FB]" />
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#F4F1FB]" />
            ))}
          </div>
        </article>

        {/* Active entries preview skeleton */}
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-6">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-[#F4F1FB]" />
            <div className="h-5 w-32 animate-pulse rounded bg-[#F4F1FB]" />
          </div>
          <div className="mt-3 h-9 w-48 animate-pulse rounded-full bg-[#F4F1FB]" />
          <div className="mt-4 space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#F4F1FB]" />
            ))}
          </div>
        </article>

        {/* Recent activity skeleton */}
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-6">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-[#F4F1FB]" />
            <div className="h-5 w-44 animate-pulse rounded bg-[#F4F1FB]" />
          </div>
          <ul className="mt-4 divide-y divide-[#EFEDF5]">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-[#F4F1FB]" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-4 w-40 max-w-full animate-pulse rounded bg-[#F4F1FB]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[#F4F1FB]" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-[#F4F1FB]" />
              </li>
            ))}
          </ul>
        </article>
      </div>
    );
  }
  if (!user) return null;

  /* ===== Derived display values ===== */
  const firstName = user.firstName || user.email?.split('@')[0] || 'Member';
  const memberStatus = resolveMemberStatus(membership);
  const statusCfg = STATUS_DISPLAY[memberStatus];
  const StatusIcon = statusCfg.icon;

  const planPriceMonthly = parseFloat(membership?.plan?.priceMonthly || '0');
  const planName = membership?.plan?.name || V4_PLAN_BY_PRICE[planPriceMonthly.toFixed(2)] || (membership ? 'Membership' : '');
  const monthlyPoints = Number(membership?.plan?.freeCreditsPerPeriod || 0);
  const majorDrawEntries = Number(membership?.plan?.grandPrizeEntriesPerPeriod || 0);

  const boostPoints = Number(user.boostCredits) || 0;
  const memberPoints = Number(user.membershipCredits) || 0;
  const totalPoints = boostPoints + memberPoints;

  const miniDrawEntries = activeDraws.filter((d) => d.drawType === 'mini');
  const majorDrawEntriesList = activeDraws.filter((d) => d.drawType === 'major');
  const visibleEntries = activeEntriesTab === 'mini' ? miniDrawEntries.slice(0, 3) : majorDrawEntriesList.slice(0, 3);

  /* ===== Status hero CTA per state ===== */
  type HeroCta =
    | { label: string; href: string; tone?: 'urgent' }
    | { label: string; onClick: () => void; tone: 'urgent' };
  const heroCta: HeroCta = (() => {
    if (memberStatus === 'past_due')  return { label: 'Update Payment Method', onClick: handleOpenManagePayment, tone: 'urgent' };
    if (memberStatus === 'canceled')  return { label: 'Reactivate Membership', href: '/dashboard/membership' };
    if (memberStatus === 'paused')    return { label: 'Resume Membership', href: '/dashboard/membership' };
    if (memberStatus === 'none')      return { label: 'Join UNICASH', href: '/#membership-plans' };
    return { label: 'Manage Membership', href: '/dashboard/membership' };
  })();

  /* ===== Quick actions ===== */
  const quickActions = [
    { label: 'View Bonus Draws', href: '/giveaways',     Icon: Icon.Trophy, tone: 'purple' as const },
    { label: 'Scan Receipt',     href: '/scan-receipts', Icon: Icon.Camera, tone: 'green' as const },
    { label: 'Buy Point Booster',href: '/boost-packs',   Icon: Icon.Bolt,   tone: 'gold' as const },
    { label: 'Redeem Gift Cards',href: '/gift-cards',    Icon: Icon.Gift,   tone: 'lavender' as const },
  ];

  const toneStyles: Record<string, { iconBg: string; iconText: string }> = {
    purple:   { iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]',    iconText: 'text-[#6356E5]' },
    green:    { iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]',    iconText: 'text-[#10B981]' },
    gold:     { iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40', iconText: 'text-[#C49A2C]' },
    lavender: { iconBg: 'bg-[#FBFAFF] ring-[#E0DAFF]',    iconText: 'text-[#6356E5]' },
  };

  /* =====================================================================
     JSX
  ===================================================================== */
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============================================================
          PAGE HEADER — single <header> matching the structure used on
          all other dashboard pages (Entries, Membership, etc.) so the
          DOM rhythm is identical and the sidebar/H1 align consistently.
          Content adapts to viewport: mobile shows greeting, desktop
          shows "Dashboard".
      ============================================================ */}
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6356E5] sm:hidden">
          Welcome back
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:mt-0 sm:text-[28px]">
          <span className="sm:hidden">Hi {firstName}</span>
          <span className="hidden sm:inline">Dashboard</span>
        </h1>
      </header>

      {/* ============================================================
          ACCOUNT-LOCKED WARNING (preserved logic)
      ============================================================ */}
      {user.isLocked && (
        <article className="overflow-hidden rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#B91C1C] ring-1 ring-[#FCA5A5]">
              <Icon.Lock className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-extrabold tracking-tight text-[#7F1D1D] sm:text-[14px]">Account locked</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#7F1D1D]/90">
                Your account has been locked due to a payment dispute.
                {user.lockReason === 'chargeback_dispute' && ' Any Points or entries from the disputed payment have been revoked.'}
              </p>
              {user.lockedAt && (
                <p className="mt-1 text-[11px] text-[#B91C1C]/80">Locked on: {formatDate(user.lockedAt)}</p>
              )}
              <Link
                href="/contact"
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#B91C1C] underline-offset-2 hover:underline"
              >
                Contact UNICASH Support →
              </Link>
            </div>
          </div>
        </article>
      )}

      {/* ============================================================
          STATUS HERO CARD — Membership state + plan + price + renewal
      ============================================================ */}
      <article className="overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white shadow-[0_18px_50px_-30px_rgba(99,86,229,0.25)]">
        {memberStatus === 'none' ? (
          // No active Membership
          <div className="px-5 py-6 sm:px-7 sm:py-7">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Membership</p>
            <h2 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">No active Membership yet</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#4B5563]">
              Join UNICASH to unlock Monthly Points, Major Draw entries, and member-only Bonus Draws.
            </p>
            <Link
              href="/#membership-plans"
              className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
            >
              Join UNICASH
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Top: status pill + plan name + price */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:gap-4 sm:px-7 sm:pt-7">
              <div className="min-w-0 flex-1">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] ring-1 ${statusCfg.pillBg} ${statusCfg.pillText} ${statusCfg.ring}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </span>
                <h2 className="mt-2 truncate text-[22px] font-extrabold tracking-tight text-[#0F1222] sm:text-[26px]">
                  {planName} <span className="text-[#667085]">Membership</span>
                </h2>
              </div>
              {planPriceMonthly > 0 && (
                <p className="shrink-0 whitespace-nowrap text-right">
                  <span className="text-[26px] font-extrabold leading-none tracking-tight text-[#6356E5] tabular-nums sm:text-[32px]">
                    {formatAUD(planPriceMonthly)}
                  </span>
                  <span className="ml-1.5 text-[12px] font-medium text-[#667085]">/ month</span>
                </p>
              )}
            </div>

            {/* Renewal/scheduled change line */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-5 text-[12.5px] text-[#667085] sm:px-7">
              {membership?.cancelAtPeriodEnd && memberStatus === 'active' && (
                <span className="inline-flex items-center gap-1 text-[#B45309]">
                  <Icon.Alert className="h-3 w-3" />
                  Cancels on {formatDate(membership.currentPeriodEnd)}
                </span>
              )}
              {!membership?.cancelAtPeriodEnd && membership?.currentPeriodEnd && memberStatus === 'active' && (
                <span>Next renewal: <span className="font-semibold text-[#0F1222]">{formatDate(membership.currentPeriodEnd)}</span></span>
              )}
              {memberStatus === 'paused' && membership?.pauseExpiresAt && (
                <span>Resumes: <span className="font-semibold text-[#0F1222]">{formatDate(membership.pauseExpiresAt)}</span></span>
              )}
              {memberStatus === 'past_due' && (
                <span className="text-[#B91C1C]">Update payment to keep benefits active.</span>
              )}
              {memberStatus === 'canceled' && (
                <span>You can reactivate anytime.</span>
              )}
            </div>

            {/* Per-month stats (chips) */}
            {(monthlyPoints > 0 || majorDrawEntries > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-2.5 px-5 sm:gap-3 sm:px-7">
                <div className="rounded-2xl bg-[#F4F1FB] p-3.5 ring-1 ring-[#E0DAFF] sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085] sm:text-[10.5px] sm:tracking-[0.14em]">Monthly Points</p>
                  <p className="mt-1 text-[20px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[22px]">
                    {monthlyPoints.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FFF6DA] p-3.5 ring-1 ring-[#FFC85D]/40 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9C5410] sm:text-[10.5px] sm:tracking-[0.14em]">
                    <span className="sm:hidden">Major Draw</span>
                    <span className="hidden sm:inline">Major Draw entries</span>
                  </p>
                  <p className="mt-1 text-[20px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[22px]">
                    {majorDrawEntries}<span className="ml-1 text-[12px] font-medium text-[#667085]">/ month</span>
                  </p>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-5 px-5 pb-5 sm:px-7 sm:pb-7">
              {'href' in heroCta ? (
                <Link
                  href={heroCta.href}
                  className={`inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-[13.5px] font-bold text-white transition-all sm:w-auto ${
                    heroCta.tone === 'urgent'
                      ? 'bg-gradient-to-r from-[#EF4444] to-[#F97316] shadow-[0_14px_30px_-12px_rgba(239,68,68,0.55)] hover:opacity-95'
                      : 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] hover:from-[#5346D6] hover:to-[#7867EC]'
                  }`}
                >
                  {heroCta.label}
                  <Icon.ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={heroCta.onClick}
                  className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#F97316] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(239,68,68,0.55)] transition-all hover:opacity-95 sm:w-auto"
                >
                  {heroCta.label}
                  <Icon.ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </article>

      {/* ============================================================
          POINTS BALANCE CARD
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Available Points</p>
            <p className="mt-1 bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-[40px] font-extrabold leading-none tracking-tight text-transparent tabular-nums sm:text-[52px]">
              {totalPoints.toLocaleString()}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#4B5563]">
              Use Points for member-only Bonus Draws or to Redeem Gift Cards from 2,000 Points.
            </p>
          </div>
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] text-[#6356E5] ring-1 ring-[#E0DAFF] sm:inline-flex">
            <Icon.Coins className="h-5 w-5" />
          </span>
        </div>

        {/* Breakdown */}
        {(memberPoints > 0 || boostPoints > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-2xl bg-[#FBFAFF] p-3 ring-1 ring-[#E0DAFF]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">Membership Points</p>
              <p className="mt-0.5 text-[18px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[20px]">
                {memberPoints.toLocaleString()}
              </p>
              <p className="mt-1 text-[10.5px] text-[#667085]">Renew monthly</p>
            </div>
            <div className="rounded-2xl bg-[#F4F1FB] p-3 ring-1 ring-[#E0DAFF]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">Booster Points</p>
              <p className="mt-0.5 text-[18px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[20px]">
                {boostPoints.toLocaleString()}
              </p>
              <p className="mt-1 text-[10.5px] text-[#667085]">Never expire</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Link
            href="/giveaways"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] sm:w-auto"
          >
            View Bonus Draws
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/boost-packs"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5] sm:w-auto"
          >
            Buy Point Booster
          </Link>
        </div>
      </article>

      {/* ============================================================
          QUICK ACTIONS — wrapped card to match Entries-page rhythm
          (no outside-card eyebrows; eyebrow lives inside the card)
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-6">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Quick actions</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {quickActions.map(({ label, href, Icon: ActionIcon, tone }) => {
            const t = toneStyles[tone];
            return (
              <Link
                key={label}
                href={href}
                className="group flex flex-col items-start gap-2.5 rounded-2xl border border-[#E7E9F2] bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-[#C9C0F2] hover:shadow-[0_8px_24px_-12px_rgba(99,86,229,0.20)] sm:p-4"
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${t.iconBg}`}>
                  <ActionIcon className={`h-4 w-4 ${t.iconText}`} />
                </span>
                <span className="text-[12.5px] font-extrabold tracking-tight text-[#0F1222] sm:text-[13px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </article>

      {/* ============================================================
          ACTIVE ENTRIES PREVIEW
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">My Entries</p>
            <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Active draws</h2>
          </div>
          <Link
            href="/dashboard/entries"
            className="hidden whitespace-nowrap text-[12.5px] font-bold text-[#6356E5] hover:text-[#5346D6] sm:inline-flex sm:items-center sm:gap-1"
          >
            View all
            <Icon.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-3 inline-flex rounded-full bg-[#F4F1FB] p-0.5 ring-1 ring-[#E0DAFF]">
          {(['mini', 'major'] as const).map((tab) => {
            const active = activeEntriesTab === tab;
            const count = tab === 'mini' ? miniDrawEntries.length : majorDrawEntriesList.length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveEntriesTab(tab)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
                  active ? 'bg-white text-[#0F1222] shadow-[0_1px_2px_rgba(15,18,34,.06)]' : 'text-[#667085] hover:text-[#0F1222]'
                }`}
              >
                {tab === 'mini' ? 'Bonus Draws' : 'Major Draws'}
                <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${active ? 'bg-[#F4F1FB] text-[#6356E5]' : 'bg-white text-[#667085]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {visibleEntries.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-4 py-6 text-center">
            <p className="text-[13px] font-extrabold tracking-tight text-[#0F1222]">
              {activeEntriesTab === 'mini' ? 'No active Bonus Draw entries yet' : 'No Major Draw entries yet'}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
              {activeEntriesTab === 'mini'
                ? 'Use your Points to access member-only Bonus Draws.'
                : 'Major Draw entries are included with your Membership each month.'}
            </p>
            <Link
              href={activeEntriesTab === 'mini' ? '/giveaways' : '/major-reward'}
              className="mt-3 inline-flex h-9 items-center gap-1 rounded-full border border-[#E0DAFF] bg-white px-4 text-[12px] font-bold text-[#6356E5] hover:border-[#6356E5]"
            >
              {activeEntriesTab === 'mini' ? 'View Bonus Draws' : 'View Major Draw'}
              <Icon.ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {visibleEntries.map((draw: any) => {
              const closed = draw.closedAt ? new Date(draw.closedAt) < new Date() : false;
              return (
                <li key={draw.id}>
                  <Link
                    href={`/giveaways/${draw.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-[#E7E9F2] bg-white p-3 transition-all hover:border-[#C9C0F2] hover:shadow-[0_8px_24px_-12px_rgba(99,86,229,0.20)]"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                      <Icon.Trophy className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">{draw.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-[#667085]">
                        {draw.userEntries} {draw.userEntries === 1 ? 'entry' : 'entries'} ·{' '}
                        {closed ? 'Closed' : (draw.closedAt ? `Closes ${formatDateTimeSydney(draw.closedAt)}` : 'Active')}
                      </p>
                    </div>
                    <Icon.ArrowRight className="h-4 w-4 shrink-0 text-[#6356E5] transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Mobile View all link */}
        <Link
          href="/dashboard/entries"
          className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full border border-[#E0DAFF] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#6356E5] hover:border-[#6356E5] sm:hidden"
        >
          View all entries
          <Icon.ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </article>

      {/* ============================================================
          RECENT ACTIVITY (Points ledger preview)
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Recent activity</p>
            <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Points + purchases</h2>
          </div>
          <Link
            href="/dashboard/purchases"
            className="hidden whitespace-nowrap text-[12.5px] font-bold text-[#6356E5] hover:text-[#5346D6] sm:inline-flex sm:items-center sm:gap-1"
          >
            View all
            <Icon.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentLedger.length === 0 && recentPayments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-4 py-6 text-center">
            <p className="text-[13px] font-extrabold tracking-tight text-[#0F1222]">No activity yet</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
              Your Membership payments, Point Booster purchases, and Points activity will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[#EFEDF5]">
            {recentLedger.map((row: any) => {
              const isCredit = Number(row.amount) >= 0;
              return (
                <li key={`l-${row.id}`} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${isCredit ? 'bg-[#ECFDF5] ring-[#A7F3D0] text-[#10B981]' : 'bg-[#F4F1FB] ring-[#E0DAFF] text-[#6356E5]'}`}>
                    <Icon.Coins className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold tracking-tight text-[#0F1222]">{row.description || (isCredit ? 'Points granted' : 'Points used')}</p>
                    <p className="mt-0.5 text-[11px] text-[#667085]">{formatDate(row.createdAt)}</p>
                  </div>
                  <p className={`shrink-0 whitespace-nowrap text-right text-[13px] font-extrabold tabular-nums ${isCredit ? 'text-[#10B981]' : 'text-[#0F1222]'}`}>
                    {isCredit ? '+' : ''}{Number(row.amount).toLocaleString()} <span className="text-[10.5px] font-semibold text-[#667085]">Points</span>
                  </p>
                </li>
              );
            })}
            {recentPayments.map((p: any) => {
              const isMembership = p.paymentType === 'membership';
              const isOneTimePackage = p.metadata?.majorDrawLanding === true;
              const itemLabel = isMembership
                ? `${p.metadata?.planName || planName || 'Membership'}${p.metadata?.isRenewal ? ' renewal' : ''}`
                : isOneTimePackage
                  ? `One-time package`
                  : `Point Booster${p.metadata?.packName ? ` · ${p.metadata.packName}` : ''}`;
              return (
                <li key={`p-${p.id}`} className="flex items-center gap-3 py-2.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF6DA] text-[#C49A2C] ring-1 ring-[#FFC85D]/40">
                    {isMembership ? <Icon.Crown className="h-4 w-4" /> : <Icon.Bolt className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold tracking-tight text-[#0F1222]">{itemLabel}</p>
                    <p className="mt-0.5 text-[11px] text-[#667085]">{formatDate(p.createdAt)}</p>
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-right text-[13px] font-extrabold text-[#0F1222] tabular-nums">
                    {formatAUD(Number(p.amount) || 0)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href="/dashboard/purchases"
          className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full border border-[#E0DAFF] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#6356E5] hover:border-[#6356E5] sm:hidden"
        >
          View Purchase History
          <Icon.ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </article>

      {/* ============================================================
          MANAGE PAYMENT MODAL — v4 wrapper around PaymentMethodsPanel.
          Bottom-sheet on mobile, centered on desktop. createPortal'd to
          document.body to escape transformed ancestors. The wrapper is
          hidden when the inner Stripe Elements (Add/Update Card) modal
          is open, so we never see two stacked modals.
      ============================================================ */}
      {portalMounted && showManagePaymentModal && createPortal(
        <div
          className={`fixed inset-0 z-[100] flex items-end justify-center sm:items-center ${hidePaymentMethodsShell ? 'pointer-events-none opacity-0' : ''}`}
          aria-modal="true"
          role="dialog"
          aria-label="Manage payment method"
        >
          {/* Backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[#0F1222]/45 backdrop-blur-[2px]"
            onClick={closeManagePaymentModal}
          />

          {/* Sheet / Card */}
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#E7E9F2] bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.45)] sm:mx-4 sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#EFEDF5] px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Billing</p>
                <h3 className="mt-0.5 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Manage payment method</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563]">
                  Securely update or add a card. Changes are processed via Stripe.
                </p>
              </div>
              <button
                type="button"
                onClick={closeManagePaymentModal}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#F4F1FB] hover:text-[#0F1222]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body — host PaymentMethodsPanel inside the wrapper modal. */}
            <div className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <PaymentMethodsPanel
                title=""
                wrapperClassName="space-y-4"
                onCardsChanged={handlePaymentMethodsChanged}
                onUpdateCardOpenChange={setHidePaymentMethodsShell}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
