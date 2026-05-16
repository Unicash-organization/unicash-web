'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import PaymentMethodsPanel from '@/components/PaymentMethodsPanel';
import LoadingRing from '@/components/LoadingRing';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { notifyAndRetryMembershipAfterPaymentUpdate } from '@/lib/membershipPaymentRetry';

/* -----------------------------------------------------------------------
   Inline icons
----------------------------------------------------------------------- */
const Icon = {
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Alert: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Clock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  X: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   Status badge helper
----------------------------------------------------------------------- */
const STATUS_PILL: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  active:         { label: 'Active',         bg: 'bg-[#ECFDF5]', text: 'text-[#10B981]', ring: 'ring-[#A7F3D0]' },
  paused:         { label: 'Paused',         bg: 'bg-[#FEF3C7]', text: 'text-[#9C5410]', ring: 'ring-[#FFC85D]/40' },
  canceled:       { label: 'Cancelled',      bg: 'bg-[#F4F1FB]', text: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]' },
  payment_failed: { label: 'Payment failed', bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', ring: 'ring-[#FCA5A5]' },
  past_due:       { label: 'Payment due',    bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', ring: 'ring-[#FCA5A5]' },
};

export default function MembershipPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  /* ===== State — preserved 1:1 from original ===== */
  const [membership, setMembership] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [renewalsPage, setRenewalsPage] = useState(1);
  const [renewalsTotal, setRenewalsTotal] = useState(0);
  const [loadingRenewals, setLoadingRenewals] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [showCancelUpgradeConfirm, setShowCancelUpgradeConfirm] = useState(false);
  const [showCancelDowngradeConfirm, setShowCancelDowngradeConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [selectedDowngradePlanId, setSelectedDowngradePlanId] = useState<string | null>(null);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState<string | null>(null);
  const [showManagePaymentModal, setShowManagePaymentModal] = useState(false);
  const [hidePaymentMethodsShell, setHidePaymentMethodsShell] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => { setPortalMounted(true); }, []);

  /* ===== Auto-clear actionLoading — preserved ===== */
  useEffect(() => {
    if (actionLoading && actionLoading.startsWith('upgrade-')) {
      const planId = actionLoading.replace('upgrade-', '');
      if (membership?.planId === planId) {
        setTimeout(() => setActionLoading(null), 100);
      }
    } else if (actionLoading && actionLoading.startsWith('downgrade-')) {
      const planId = actionLoading.replace('downgrade-', '');
      if (membership?.pendingDowngradePlanId === planId) {
        setTimeout(() => setActionLoading(null), 100);
      }
    }
  }, [membership, actionLoading]);

  /* ===== Initial load + URL params — preserved ===== */
  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const downgradePlanId = urlParams.get('downgrade');
      const paymentUpdated = urlParams.get('paymentUpdated');
      if (downgradePlanId) {
        window.history.replaceState({}, '', window.location.pathname);
        setSelectedDowngradePlanId(downgradePlanId);
        setShowDowngradeConfirm(true);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll while billing modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showManagePaymentModal && !hidePaymentMethodsShell) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showManagePaymentModal, hidePaymentMethodsShell]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membershipRes, plansRes] = await Promise.all([
        api.membership.getUserMembership().catch(() => ({ data: null })),
        api.membership.getPlans().catch(() => ({ data: [] })),
      ]);
      if (membershipRes.data) setMembership(membershipRes.data);
      else setMembership(null);
      const plansData = Array.isArray(plansRes.data) ? plansRes.data : [];
      setPlans(plansData);
      if (membershipRes.data && membershipRes.data.status !== 'canceled') {
        loadRenewalHistory();
      } else {
        setRenewals([]);
        setRenewalsTotal(0);
        setRenewalsPage(1);
      }
    } catch (error) {
      console.error('[loadData] Error loading membership data:', error);
      setPlans([]);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRenewalHistory = async (page: number = 1) => {
    try {
      setLoadingRenewals(true);
      const res = await api.membership.getRenewalHistory(page, 10);
      const responseData = res.data || res;
      const renewalsData = (responseData as any)?.data || responseData || [];
      const total = (responseData as any)?.total || 0;
      setRenewals(Array.isArray(renewalsData) ? renewalsData : []);
      setRenewalsTotal(total);
      setRenewalsPage(page);
    } catch (error: any) {
      console.error('[Renewal History] Error:', error);
      setRenewals([]);
      setRenewalsTotal(0);
    } finally {
      setLoadingRenewals(false);
    }
  };

  /* ===== Handlers — preserved 1:1 ===== */
  const handlePause = async () => {
    setActionLoading('pause');
    try {
      await api.membership.pause();
      await loadData();
      await refreshUser();
      setShowPauseConfirm(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to pause Membership', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading('resume');
    try {
      await api.membership.resume();
      await loadData();
      await refreshUser();
      setShowResumeConfirm(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to resume Membership', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await api.membership.cancel();
      await loadData();
      await refreshUser();
      setShowCancelConfirm(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to cancel Membership', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelUpgrade = async () => {
    setActionLoading('cancelUpgrade');
    try {
      await api.membership.cancelUpgrade();
      await loadData();
      await refreshUser();
      setShowCancelUpgradeConfirm(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to cancel upgrade', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelDowngrade = async () => {
    setActionLoading('cancelDowngrade');
    try {
      await api.membership.cancelDowngrade();
      await loadData();
      await refreshUser();
      setShowCancelDowngradeConfirm(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to cancel downgrade', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (actionLoading !== null) return;
    if (actionLoading === `upgrade-${planId}` || actionLoading === `downgrade-${planId}`) return;
    const newPlan = plans.find(p => p.id === planId);
    if (!newPlan || !membership?.plan) return;
    if (membership.planId === planId) return;
    const isUpgrade = isPlanUpgrade(membership.plan, newPlan);
    if (isUpgrade && membership.pendingUpgradePlanId) {
      showToast('You already have a pending upgrade scheduled. Please wait for it to be applied on your next billing date before upgrading again.', 'info');
      return;
    }
    if (!isUpgrade && membership.pendingDowngradePlanId) {
      showToast('You already have a pending downgrade scheduled. Please wait for it to be applied on your next billing date before downgrading again.', 'info');
      return;
    }
    if (isUpgrade) {
      setSelectedUpgradePlanId(planId);
      setShowUpgradeConfirm(true);
    } else {
      setSelectedDowngradePlanId(planId);
      setShowDowngradeConfirm(true);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedUpgradePlanId) return;
    setShowUpgradeConfirm(false);
    const loadingKey = `upgrade-${selectedUpgradePlanId}`;
    setActionLoading(loadingKey);
    try {
      const response = await api.membership.upgrade(selectedUpgradePlanId);
      let updatedMembership = response?.data;
      if (updatedMembership) {
        setMembership(updatedMembership);
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadData();
        await refreshUser();
        const updatedMembershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
        updatedMembership = updatedMembershipRes.data;
      }
      if (updatedMembership) {
        setMembership(updatedMembership);
        setActionLoading(null);
        setSelectedUpgradePlanId(null);
        showToast('Upgrade scheduled successfully! Your plan will be upgraded on your next billing date. Stripe will handle proration automatically.', 'success');
      } else {
        setActionLoading(null);
        setSelectedUpgradePlanId(null);
        showToast('Upgrade successful! Your subscription has been updated.', 'success');
      }
    } catch (error: any) {
      setActionLoading(null);
      setSelectedUpgradePlanId(null);
      showToast(error.response?.data?.message || 'Failed to upgrade Membership', 'error');
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedDowngradePlanId) {
      setActionLoading(null);
      return;
    }
    setShowDowngradeConfirm(false);
    const loadingKey = `downgrade-${selectedDowngradePlanId}`;
    if (actionLoading !== loadingKey) setActionLoading(loadingKey);
    try {
      await api.membership.upgrade(selectedDowngradePlanId);
      await loadData();
      await refreshUser();
      const updatedMembershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
      const updatedMembership = updatedMembershipRes.data;
      if (updatedMembership) {
        setMembership(updatedMembership);
        if (updatedMembership.pendingDowngradePlanId === selectedDowngradePlanId) {
          setActionLoading(null);
        }
        setSelectedDowngradePlanId(null);
        showToast('Downgrade scheduled successfully. It will apply on your next billing date.', 'success');
      } else {
        setActionLoading(null);
        setSelectedDowngradePlanId(null);
        showToast('Downgrade scheduled successfully. It will apply on your next billing date.', 'success');
      }
    } catch (error: any) {
      setActionLoading(null);
      setSelectedDowngradePlanId(null);
      showToast(error.response?.data?.message || 'Failed to downgrade Membership', 'error');
    }
  };

  const isPlanUpgrade = (oldPlan: any, newPlan: any): boolean => {
    const tierOrder: Record<string, number> = {
      basic: 1, premium: 2, uni_one: 3, uni_plus: 4, uni_max: 5, elite: 6,
    };
    const oldTierOrder = tierOrder[oldPlan.tier] || 0;
    const newTierOrder = tierOrder[newPlan.tier] || 0;
    if (newTierOrder > oldTierOrder) return true;
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly > oldPlan.priceMonthly) return true;
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly === oldPlan.priceMonthly && newPlan.freeCreditsPerPeriod > oldPlan.freeCreditsPerPeriod) return true;
    return false;
  };

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
    await refreshUser();
    await notifyAndRetryMembershipAfterPaymentUpdate({ quietIfMembershipHealthy: false });
    await loadData();
    const m = await api.membership.getUserMembership().catch(() => ({ data: null }));
    if (m.data?.status && m.data.status !== 'payment_failed' && m.data.status !== 'past_due') {
      closeManagePaymentModal();
    }
  };

  /* ===== Format helpers ===== */
  const formatMembershipDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };
  const formatCurrency = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `A$${(Number(n) || 0).toFixed(2)}`;
  };

  if (loading) {
    /* Skeleton screens — placeholder cards mirror the final layout so user
       gets instant structural orientation. */
    return (
      <div className="space-y-5 sm:space-y-6">
        <header>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">Membership</h1>
        </header>

        {/* Status hero skeleton */}
        <article className="overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white p-5 shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)] sm:p-7">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-20 animate-pulse rounded-full bg-[#F4F1FB]" />
              <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-[#F4F1FB]" />
            </div>
            <div className="h-7 w-28 animate-pulse rounded-md bg-[#F4F1FB]" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-4 w-48 animate-pulse rounded bg-[#F4F1FB]" />
            <div className="h-4 w-40 animate-pulse rounded bg-[#F4F1FB]" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="h-20 animate-pulse rounded-2xl bg-[#F4F1FB]" />
            <div className="h-20 animate-pulse rounded-2xl bg-[#F4F1FB]" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#EFEDF5] pt-4 sm:gap-3">
            <div className="h-10 w-36 animate-pulse rounded-full bg-[#F4F1FB]" />
            <div className="h-10 w-40 animate-pulse rounded-full bg-[#F4F1FB]" />
            <div className="h-10 w-32 animate-pulse rounded-full bg-[#F4F1FB]" />
          </div>
        </article>

        {/* Benefits card skeleton */}
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-7">
          <div className="space-y-2">
            <div className="h-4 w-44 animate-pulse rounded bg-[#F4F1FB]" />
            <div className="h-5 w-24 animate-pulse rounded bg-[#F4F1FB]" />
          </div>
          <ul className="mt-3 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded bg-[#F4F1FB]" />
                <div className="h-4 w-56 max-w-full animate-pulse rounded bg-[#F4F1FB]" />
              </li>
            ))}
          </ul>
        </article>

        {/* Available plans skeleton */}
        <section>
          <div className="mb-4 h-6 w-44 animate-pulse rounded bg-[#F4F1FB]" />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {[0, 1].map((i) => (
              <article key={i} className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-6">
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-[#F4F1FB]" />
                  <div className="h-6 w-32 animate-pulse rounded-md bg-[#F4F1FB]" />
                  <div className="h-5 w-28 animate-pulse rounded bg-[#F4F1FB]" />
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="h-4 w-40 animate-pulse rounded bg-[#F4F1FB]" />
                  <div className="h-4 w-44 animate-pulse rounded bg-[#F4F1FB]" />
                </div>
                <div className="mt-5 h-11 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ===== Derived display ===== */
  const status = (membership?.status || '').toLowerCase();
  const isPaymentDue = status === 'payment_failed' || status === 'past_due';
  const isPaused = !!membership?.isPaused;
  const isCanceled = status === 'canceled';
  const isScheduledCancel = !!membership?.cancelAtPeriodEnd && status !== 'canceled' && membership?.currentPeriodEnd && new Date(membership.currentPeriodEnd) > new Date();
  const cancelAccessUntil = isCanceled && membership?.currentPeriodEnd && new Date(membership.currentPeriodEnd) > new Date();
  const noActiveMembership = !membership || (isCanceled && (!membership?.currentPeriodEnd || new Date(membership.currentPeriodEnd) <= new Date()));

  const planDisplayKind = isPaused ? 'paused' : isPaymentDue ? (status === 'past_due' ? 'past_due' : 'payment_failed') : 'active';
  const statusPill = STATUS_PILL[planDisplayKind] || STATUS_PILL.active;

  const planName = membership?.plan?.name || 'Membership';
  const planPrice = parseFloat(membership?.plan?.priceMonthly || '0');
  const monthlyPoints = Number(membership?.plan?.freeCreditsPerPeriod || 0);
  const majorDrawEntries = Number(membership?.plan?.grandPrizeEntriesPerPeriod || 0);

  const availablePlans = plans.filter((p) => p.id !== membership?.planId);
  const renewalsTotalPages = Math.max(1, Math.ceil((renewalsTotal || 0) / 10));

  /* =====================================================================
     JSX
  ===================================================================== */
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============================================================
          PAGE HEADER — simple H1, no eyebrow (sidebar active state is breadcrumb)
      ============================================================ */}
      <header>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">Membership</h1>
      </header>

      {/* ============================================================
          PAYMENT DUE WARNING (preserved)
      ============================================================ */}
      {isPaymentDue && (
        <article className="overflow-hidden rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#B91C1C] ring-1 ring-[#FCA5A5]">
              <Icon.Alert className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-extrabold tracking-tight text-[#7F1D1D] sm:text-[14px]">Payment failed</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#7F1D1D]/90">
                We couldn't process your Membership payment. Please update your payment method to keep your benefits active.
              </p>
              <button
                type="button"
                onClick={handleOpenManagePayment}
                className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#F97316] px-4 text-[12.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(239,68,68,0.55)] transition-all hover:opacity-95"
              >
                Update Payment Method
                <Icon.ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ============================================================
          NO ACTIVE MEMBERSHIP
      ============================================================ */}
      {noActiveMembership ? (
        <article className="overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white px-5 py-7 text-center shadow-[0_18px_50px_-30px_rgba(99,86,229,0.25)] sm:px-7 sm:py-9">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Membership</p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-tight text-[#0F1222] sm:text-[26px]">No active Membership</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#4B5563]">
            Join UNICASH to unlock Monthly Points, Major Draw entries, Fuel Rewards, and member-only Bonus Draws.
          </p>
          <Link
            href="/#membership-plans"
            className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
          >
            View Membership plans
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      ) : cancelAccessUntil ? (
        /* ============================================================
            CANCELLED — still in billing period
        ============================================================ */
        <article className="overflow-hidden rounded-3xl border border-[#FCA5A5] bg-white shadow-[0_18px_50px_-30px_rgba(185,28,28,0.18)]">
          <div className="bg-[#FEF2F2] px-5 py-4 sm:px-7 sm:py-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#B91C1C] ring-1 ring-[#FCA5A5]">
              <Icon.Alert className="h-3 w-3" />
              Cancelled
            </span>
            <p className="mt-2 text-[13.5px] font-bold text-[#7F1D1D]">
              Access until {formatMembershipDate(membership.currentPeriodEnd)}
            </p>
          </div>
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">{planName}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">
              Your UNICASH Membership has been cancelled. You won't be charged again, and you keep dashboard access until {formatMembershipDate(membership.currentPeriodEnd)}.
            </p>
            <p className="mt-2 text-[12.5px] italic text-[#667085]">
              All of your entries have been removed. To enter future Bonus Draws, you'll need to start a new Membership.
            </p>
            <button
              type="button"
              onClick={() => router.push('/#membership-plans')}
              className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
            >
              Reactivate Membership
              <Icon.ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </article>
      ) : (
        /* ============================================================
            CURRENT PLAN CARD — Active / Paused / Scheduled-cancel
        ============================================================ */
        <article className="overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)]">
          {/* Scheduled-cancel banner */}
          {isScheduledCancel && (
            <div className="border-b border-[#FFC85D]/30 bg-[#FFF6DA] px-5 py-3 sm:px-7">
              <div className="flex items-start gap-2">
                <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-[#9C5410]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold text-[#7C2D12] sm:text-[13px]">
                    Cancellation scheduled — access until {formatMembershipDate(membership.currentPeriodEnd)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#9C5410]">
                    Your Membership stays active until the end of your current billing period. You won't be charged again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending upgrade banner — shown when next renewal will switch plan UP.
              Cancel action lives on the pending plan card in Available Plans below. */}
          {!isScheduledCancel && membership?.pendingUpgradePlanId && (() => {
            const pendingPlan = plans.find((p) => p.id === membership.pendingUpgradePlanId);
            const pendingName = pendingPlan?.name || 'a higher plan';
            const pendingPoints = Number(pendingPlan?.freeCreditsPerPeriod || 0);
            return (
              <div className="border-b border-[#E0DAFF] bg-[#F4F1FB] px-5 py-3 sm:px-7">
                <div className="flex items-start gap-2">
                  <Icon.Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#6356E5]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-[#0F1222] sm:text-[13px]">
                      Scheduled upgrade — activates {membership.currentPeriodEnd ? formatMembershipDate(membership.currentPeriodEnd) : 'on next renewal'}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#6356E5]">
                      Your plan will upgrade to <span className="font-bold">{pendingName}</span>
                      {pendingPoints > 0 && <> — Points reset to {pendingPoints.toLocaleString()}/mo at activation</>}.
                      Cancel anytime from the {pendingName} card below.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pending downgrade banner — same lavender style as upgrade for consistency.
              Lavender = "scheduled plan change" (continuing with new plan).
              Gold is reserved for cancellation/ending states only. */}
          {!isScheduledCancel && !membership?.pendingUpgradePlanId && membership?.pendingDowngradePlanId && (() => {
            const pendingPlan = plans.find((p) => p.id === membership.pendingDowngradePlanId);
            const pendingName = pendingPlan?.name || 'a lower plan';
            const pendingPoints = Number(pendingPlan?.freeCreditsPerPeriod || 0);
            return (
              <div className="border-b border-[#E0DAFF] bg-[#F4F1FB] px-5 py-3 sm:px-7">
                <div className="flex items-start gap-2">
                  <Icon.Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#6356E5]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-[#0F1222] sm:text-[13px]">
                      Scheduled downgrade — activates {membership.currentPeriodEnd ? formatMembershipDate(membership.currentPeriodEnd) : 'on next renewal'}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#6356E5]">
                      Your plan will downgrade to <span className="font-bold">{pendingName}</span>
                      {pendingPoints > 0 && <> — Points reset to {pendingPoints.toLocaleString()}/mo at activation</>}.
                      Cancel anytime from the {pendingName} card below.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Top: status pill + plan + price */}
          <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:gap-4 sm:px-7 sm:pt-7">
            <div className="min-w-0 flex-1">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] ring-1 ${statusPill.bg} ${statusPill.text} ${statusPill.ring}`}>
                {statusPill.label}
              </span>
              <h2 className="mt-2 truncate text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">
                {planName} <span className="text-[#667085]">Membership</span>
              </h2>
            </div>
            {planPrice > 0 && (
              <p className="shrink-0 whitespace-nowrap text-right">
                <span className="text-[26px] font-extrabold leading-none tracking-tight text-[#6356E5] tabular-nums sm:text-[32px]">
                  {formatCurrency(planPrice)}
                </span>
                <span className="ml-1.5 text-[12px] font-medium text-[#667085]">/ month</span>
              </p>
            )}
          </div>

          {/* Renewal/billing line */}
          <div className="mt-3 px-5 text-[12.5px] text-[#667085] sm:px-7">
            {membership?.currentPeriodEnd && !isPaused && !isScheduledCancel && (
              <p>Next renewal: <span className="font-semibold text-[#0F1222]">{formatMembershipDate(membership.currentPeriodEnd)}</span></p>
            )}
            {isPaused && membership?.pausedAt && (
              <p>
                Paused since: <span className="font-semibold text-[#0F1222]">{formatMembershipDate(membership.pausedAt)}</span>
                {membership.pauseExpiresAt && (
                  <> · Resumes: <span className="font-semibold text-[#0F1222]">{formatMembershipDate(membership.pauseExpiresAt)}</span></>
                )}
              </p>
            )}
            {membership?.createdAt && (
              <p className="mt-0.5">Member since: <span className="font-semibold text-[#0F1222]">{formatMembershipDate(membership.createdAt)}</span></p>
            )}
          </div>

          {/* Per-month stats */}
          {(monthlyPoints > 0 || majorDrawEntries > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-2.5 px-5 sm:gap-3 sm:px-7">
              {monthlyPoints > 0 && (
                <div className="rounded-2xl bg-[#F4F1FB] p-3.5 ring-1 ring-[#E0DAFF] sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085] sm:text-[10.5px] sm:tracking-[0.14em]">Monthly Points</p>
                  <p className="mt-1 text-[20px] font-extrabold leading-none tracking-tight text-[#0F1222] tabular-nums sm:text-[22px]">
                    {monthlyPoints.toLocaleString()}
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
                    {majorDrawEntries}<span className="ml-1 text-[12px] font-medium text-[#667085]">/ month</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pause/Cancel/Resume actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#EFEDF5] px-5 pb-5 pt-4 sm:gap-3 sm:px-7 sm:pb-7">
            {isPaused ? (
              <button
                type="button"
                onClick={() => setShowResumeConfirm(true)}
                disabled={actionLoading !== null}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 text-[12.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] disabled:opacity-50"
              >
                Resume Now
              </button>
            ) : (
              <>
                {membership.status === 'active' && !isPaused && !membership.isProcessingChange && !isPaymentDue && (
                  <button
                    type="button"
                    onClick={() => setShowPauseConfirm(true)}
                    disabled={actionLoading !== null}
                    className="inline-flex h-10 items-center rounded-full border border-[#E0DAFF] bg-white px-4 text-[12.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5] disabled:opacity-50"
                  >
                    Pause Membership
                  </button>
                )}
                {!isCanceled && !membership.cancelAtPeriodEnd && (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={actionLoading !== null}
                    className="inline-flex h-10 items-center rounded-full border border-[#FCA5A5] bg-white px-4 text-[12.5px] font-bold text-[#B91C1C] transition-colors hover:bg-[#FEE2E2] disabled:opacity-50"
                  >
                    Cancel Membership
                  </button>
                )}
              </>
            )}
            {/* Cancel scheduled upgrade/downgrade buttons removed from action row —
                pending state is signalled via the inline banner at the top of this card,
                and the actual Cancel button lives on the pending plan in Available Plans below.
                This keeps the action row focused on current-state controls. */}
            <button
              type="button"
              onClick={handleOpenManagePayment}
              className="inline-flex h-10 items-center rounded-full border border-[#E0DAFF] bg-white px-4 text-[12.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5]"
            >
              Manage Billing
            </button>
          </div>
        </article>
      )}

      {/* ============================================================
          INCLUDED BENEFITS (existing plan only)
      ============================================================ */}
      {membership && !isCanceled && !isPaused && (monthlyPoints > 0 || majorDrawEntries > 0) && (
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Included with your Membership</p>
          <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Benefits</h2>
          <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-[#4B5563]">
            {monthlyPoints > 0 && (
              <li className="flex items-start gap-2">
                <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                <span>{monthlyPoints.toLocaleString()} Monthly Points</span>
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
              <span>Redeem Gift Cards from 2,000 Points</span>
            </li>
          </ul>
        </article>
      )}

      {/* ============================================================
          LOYALTY ENTRIES (Sprint 2 — Major Draw auto-applied entries)
          Self-contained: fetches its own data via api.loyalty.summary().
          Returns its own non-eligible state if Membership is missing /
          paused / canceled, so we mount it unconditionally for logged-in
          users to give the upgrade nudge a home.
      ============================================================ */}
      <LoyaltyCard />

      {/* ============================================================
          AVAILABLE PLANS (upgrade/downgrade) — only for active Members
      ============================================================ */}
      {plans.length > 0 && membership && !isPaused && !isCanceled && (
        <section>
          {/* Outside-card eyebrow dropped — H2 alone is enough orientation, matches Entries rhythm */}
          <h2 className="mb-4 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">Available plans</h2>

          {availablePlans.length === 0 && (
            <p className="text-[13px] text-[#667085]">You're already on the highest tier.</p>
          )}

          {isPaymentDue && (
            <div className="mb-4 rounded-2xl border border-[#FFC85D] bg-[#FFF6DA] p-3.5">
              <p className="text-[12.5px] leading-relaxed text-[#9C5410]">
                <strong>Payment required.</strong> Please fix your payment method before changing plans.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {availablePlans.map((plan) => {
              const isUpgrade = membership?.plan ? isPlanUpgrade(membership.plan, plan) : false;
              const hasPendingDowngrade = membership?.pendingDowngradePlanId === plan.id;
              const hasPendingUpgrade = membership?.pendingUpgradePlanId === plan.id;
              const hasPendingUpgradeOther = membership?.pendingUpgradePlanId && membership?.pendingUpgradePlanId !== plan.id;
              const hasPendingDowngradeOther = membership?.pendingDowngradePlanId && membership?.pendingDowngradePlanId !== plan.id;
              const isProcessingChange = membership?.isProcessingChange || false;
              const canUpgrade = !isUpgrade || (!hasPendingUpgrade && !hasPendingUpgradeOther);
              const canDowngrade = isUpgrade || !hasPendingDowngradeOther;
              const canPerformAction = canUpgrade && canDowngrade && !isProcessingChange && !isPaymentDue;
              const planPlanPrice = plan?.priceMonthly ? formatCurrency(plan.priceMonthly) : '—';
              const planPlanPoints = Number(plan?.freeCreditsPerPeriod || 0);
              const planMajorDraw = Number(plan?.grandPrizeEntriesPerPeriod || 0);

              return (
                <article
                  key={plan.id}
                  className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-6 ${
                    isUpgrade ? 'border-[#E0DAFF]' : 'border-[#E7E9F2]'
                  }`}
                >
                  {plan.badgeText && (
                    <span
                      className={`absolute right-4 top-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ${
                        plan.badgeType === 'popular'
                          ? 'bg-[#F4F1FB] text-[#6356E5] ring-[#E0DAFF]'
                          : 'bg-[#FFF6DA] text-[#9C5410] ring-[#FFC85D]/40'
                      }`}
                    >
                      {plan.badgeText}
                    </span>
                  )}

                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6356E5]">
                    {isUpgrade ? 'Upgrade' : 'Downgrade'}
                  </p>
                  <h3 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">{plan.name}</h3>
                  <p className="mt-1 text-[16px] font-extrabold tracking-tight text-[#0F1222]">
                    {planPlanPrice}<span className="ml-1 text-[12px] font-medium text-[#667085]">/ month</span>
                  </p>

                  {/* Pending state info removed from plan card body — kept clean.
                      Pending banner lives at top of Current Plan card; explanation
                      for disabled CTA shows as subtle helper text below the button. */}

                  {/* Plan stats */}
                  {(planPlanPoints > 0 || planMajorDraw > 0) && (
                    <ul className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-[#4B5563]">
                      {planPlanPoints > 0 && (
                        <li className="flex items-start gap-2">
                          <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                          <span>{planPlanPoints.toLocaleString()} Monthly Points</span>
                        </li>
                      )}
                      {planMajorDraw > 0 && (
                        <li className="flex items-start gap-2">
                          <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                          <span>{planMajorDraw} Major Draw {planMajorDraw === 1 ? 'entry' : 'entries'} monthly</span>
                        </li>
                      )}
                    </ul>
                  )}

                  {/* CTA — when pending, replace dead-end "Pending" with active Cancel button.
                      Cross-plan warning shows below CTA if a different pending change exists. */}
                  {hasPendingUpgrade ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelUpgradeConfirm(true)}
                      disabled={actionLoading !== null}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[#FCA5A5] bg-white px-5 text-[13.5px] font-bold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === 'cancelUpgrade' ? 'Cancelling…' : 'Cancel scheduled upgrade'}
                    </button>
                  ) : hasPendingDowngrade ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelDowngradeConfirm(true)}
                      disabled={actionLoading !== null}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[#FCA5A5] bg-white px-5 text-[13.5px] font-bold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === 'cancelDowngrade' ? 'Cancelling…' : 'Cancel scheduled downgrade'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={!canPerformAction || actionLoading !== null}
                      className={`mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-[13.5px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        isUpgrade
                          ? 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.55)] hover:from-[#5346D6] hover:to-[#7867EC]'
                          : 'border border-[#E0DAFF] bg-white text-[#0F1222] hover:border-[#6356E5] hover:text-[#6356E5]'
                      }`}
                    >
                      {actionLoading === `upgrade-${plan.id}` || actionLoading === `downgrade-${plan.id}`
                        ? 'Processing…'
                        : isUpgrade
                          ? `Upgrade to ${plan.name}`
                          : `Downgrade to ${plan.name}`}
                    </button>
                  )}

                  {/* Helper text below CTA — informational gray tone.
                      Two cases:
                      - CTA enabled + pending elsewhere → warns it will replace
                      - CTA disabled (processing/payment/pending elsewhere) → explains why */}
                  {!hasPendingUpgrade && !hasPendingDowngrade && (
                    <>
                      {canPerformAction && (hasPendingUpgradeOther || hasPendingDowngradeOther) && (
                        <p className="mt-2 text-center text-[11.5px] leading-relaxed text-[#667085]">
                          <strong className="font-semibold text-[#0F1222]">Note —</strong> this will replace your scheduled {hasPendingUpgradeOther ? 'upgrade' : 'downgrade'}.
                        </p>
                      )}
                      {!canPerformAction && (
                        <p className="mt-2 text-center text-[11.5px] leading-relaxed text-[#667085]">
                          {isProcessingChange ? (
                            'Processing your previous request — please wait.'
                          ) : isPaymentDue ? (
                            'Update your payment method first to change plans.'
                          ) : hasPendingUpgradeOther ? (
                            'Cancel your scheduled upgrade above to switch to this plan.'
                          ) : hasPendingDowngradeOther ? (
                            'Cancel your scheduled downgrade above to switch to this plan.'
                          ) : null}
                        </p>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================
          RENEWAL HISTORY (preserved, mobile cards + desktop table)
      ============================================================ */}
      {membership && !isCanceled && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              {/* Outside-card eyebrow dropped — H2 alone is enough */}
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">Past renewals</h2>
            </div>
          </div>

          {loadingRenewals ? (
            <div className="flex justify-center rounded-2xl border border-[#E7E9F2] bg-white py-10">
              <LoadingRing label="Loading history" />
            </div>
          ) : renewals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-4 py-6 text-center">
              <p className="text-[13px] font-extrabold tracking-tight text-[#0F1222]">No renewals yet</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
                Your Membership renewals will appear here.
              </p>
            </div>
          ) : (
            <article className="overflow-hidden rounded-2xl border border-[#E7E9F2] bg-white">
              <ul className="divide-y divide-[#EFEDF5]">
                {renewals.map((r: any, i: number) => (
                  <li key={r.id || i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                      <Icon.Clock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-extrabold tracking-tight text-[#0F1222]">{r.planName || 'Membership renewal'}</p>
                      <p className="mt-0.5 text-[11.5px] text-[#667085]">
                        {r.createdAt ? formatMembershipDate(r.createdAt) : '—'}
                      </p>
                    </div>
                    {r.amount != null && (
                      <p className="shrink-0 whitespace-nowrap text-right text-[13px] font-extrabold text-[#0F1222] tabular-nums">
                        {formatCurrency(r.amount)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              {renewalsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#EFEDF5] bg-[#FBFAFF] px-4 py-2.5 text-[12px] text-[#667085] sm:px-5">
                  <span>Page {renewalsPage} of {renewalsTotalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={renewalsPage <= 1 || loadingRenewals}
                      onClick={() => loadRenewalHistory(Math.max(1, renewalsPage - 1))}
                      className="inline-flex h-8 items-center rounded-full border border-[#E0DAFF] bg-white px-3 text-[11.5px] font-bold text-[#0F1222] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={renewalsPage >= renewalsTotalPages || loadingRenewals}
                      onClick={() => loadRenewalHistory(Math.min(renewalsTotalPages, renewalsPage + 1))}
                      className="inline-flex h-8 items-center rounded-full border border-[#E0DAFF] bg-white px-3 text-[11.5px] font-bold text-[#0F1222] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </article>
          )}
        </section>
      )}

      {/* ============================================================
          CONFIRM MODALS — preserved
      ============================================================ */}
      {/*
       * QW-7 — itemise what the member is about to lose so the cancel CTA
       * becomes an informed choice rather than a one-tap mistake. Concrete
       * numbers pulled from their current plan (monthly Points + Major Draw
       * entries) + the actual end-of-period date.
       */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel Membership"
        message={
          <>
            <p>
              You&rsquo;ll keep <strong className="text-[#0F1222]">{planName}</strong> benefits until{' '}
              <strong className="text-[#0F1222]">
                {membership?.currentPeriodEnd ? formatMembershipDate(membership.currentPeriodEnd) : 'the end of this billing period'}
              </strong>
              . After that, you&rsquo;ll lose:
            </p>
            <ul className="mt-3 space-y-2 rounded-2xl bg-[#FBFAFF] p-4 ring-1 ring-[#E0DAFF]">
              {monthlyPoints > 0 && (
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#6356E5]" />
                  <span>
                    <strong className="text-[#0F1222]">{monthlyPoints.toLocaleString()} Points</strong> every billing period
                  </span>
                </li>
              )}
              {majorDrawEntries > 0 && (
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#6356E5]" />
                  <span>
                    <strong className="text-[#0F1222]">{majorDrawEntries.toLocaleString()} Major Draw {majorDrawEntries === 1 ? 'entry' : 'entries'}</strong> every period
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#6356E5]" />
                <span>Access to member-only Bonus Draws</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#6356E5]" />
                <span>Higher Points rate when you Scan Receipts</span>
              </li>
            </ul>
            <p className="mt-3 text-[13px] text-[#667085]">
              You won&rsquo;t be charged again. You can resume any time — your account, balance, and history stay intact.
            </p>
          </>
        }
        confirmText="Cancel Membership"
        cancelText="Keep Membership"
        type="danger"
        confirmDisabled={actionLoading === 'cancel'}
      />
      <ConfirmModal
        isOpen={showPauseConfirm}
        onClose={() => setShowPauseConfirm(false)}
        onConfirm={handlePause}
        title="Pause Membership"
        message="Pause your Membership? You can resume anytime. While paused, your Monthly Points and Major Draw entries are not issued."
        confirmText="Pause Membership"
        cancelText="Keep Active"
        type="warning"
        confirmDisabled={actionLoading === 'pause'}
      />
      <ConfirmModal
        isOpen={showResumeConfirm}
        onClose={() => setShowResumeConfirm(false)}
        onConfirm={handleResume}
        title="Resume Membership"
        message="Resume your Membership now? You'll start receiving Monthly Points and Major Draw entries again."
        confirmText="Resume Now"
        cancelText="Keep Paused"
        type="info"
        confirmDisabled={actionLoading === 'resume'}
      />
      <ConfirmModal
        isOpen={showCancelUpgradeConfirm}
        onClose={() => setShowCancelUpgradeConfirm(false)}
        onConfirm={handleCancelUpgrade}
        title="Cancel scheduled upgrade"
        message="Cancel the scheduled upgrade? Your current plan will continue as-is."
        confirmText="Cancel Upgrade"
        cancelText="Keep Scheduled"
        type="warning"
        confirmDisabled={actionLoading === 'cancelUpgrade'}
      />
      <ConfirmModal
        isOpen={showCancelDowngradeConfirm}
        onClose={() => setShowCancelDowngradeConfirm(false)}
        onConfirm={handleCancelDowngrade}
        title="Cancel scheduled downgrade"
        message="Cancel the scheduled downgrade? Your current plan will continue as-is — no Points reset."
        confirmText="Cancel Downgrade"
        cancelText="Keep Scheduled"
        type="warning"
        confirmDisabled={actionLoading === 'cancelDowngrade'}
      />
      <ConfirmModal
        isOpen={showUpgradeConfirm}
        onClose={() => { setShowUpgradeConfirm(false); setSelectedUpgradePlanId(null); }}
        onConfirm={handleConfirmUpgrade}
        title="Confirm upgrade"
        message="Your plan will upgrade on your next billing date. Monthly Points reset to the new plan's allocation at activation."
        confirmText="Confirm Upgrade"
        cancelText="Cancel"
        type="info"
        confirmDisabled={actionLoading?.startsWith('upgrade-') || false}
      />
      <ConfirmModal
        isOpen={showDowngradeConfirm}
        onClose={() => { setShowDowngradeConfirm(false); setSelectedDowngradePlanId(null); }}
        onConfirm={handleConfirmDowngrade}
        title="Confirm downgrade"
        message="Your plan will downgrade on your next billing date. Monthly Points reset to the new plan's allocation at activation."
        confirmText="Confirm Downgrade"
        cancelText="Cancel"
        type="warning"
        confirmDisabled={actionLoading?.startsWith('downgrade-') || false}
      />

      {/* ============================================================
          MANAGE PAYMENT MODAL — v4 wrapper around PaymentMethodsPanel
      ============================================================ */}
      {portalMounted && showManagePaymentModal && createPortal(
        <div
          className={`fixed inset-0 z-[100] flex items-end justify-center sm:items-center ${hidePaymentMethodsShell ? 'pointer-events-none opacity-0' : ''}`}
          aria-modal="true"
          role="dialog"
          aria-label="Manage payment method"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[#0F1222]/45 backdrop-blur-[2px]"
            onClick={closeManagePaymentModal}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#E7E9F2] bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.45)] sm:mx-4 sm:rounded-3xl">
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
                <Icon.X className="h-4 w-4" />
              </button>
            </div>
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
