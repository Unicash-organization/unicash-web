'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDateGB } from '@/lib/timezone';

export default function MembershipPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
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
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [selectedDowngradePlanId, setSelectedDowngradePlanId] = useState<string | null>(null);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState<string | null>(null);

  // ✅ Auto-clear actionLoading when membership state updates after upgrade/downgrade
  // Note: This is a fallback - actionLoading should be cleared in handleConfirmUpgrade/Downgrade
  useEffect(() => {
    if (actionLoading && actionLoading.startsWith('upgrade-')) {
      const planId = actionLoading.replace('upgrade-', '');
      // If this plan is now the current plan, clear loading state
      if (membership?.planId === planId) {
        console.log('[useEffect] Upgrade completed - plan is now current, clearing actionLoading');
        setTimeout(() => {
          setActionLoading(null);
        }, 100);
      }
    } else if (actionLoading && actionLoading.startsWith('downgrade-')) {
      const planId = actionLoading.replace('downgrade-', '');
      // If this plan is now pending downgrade, clear loading state
      if (membership?.pendingDowngradePlanId === planId) {
        console.log('[useEffect] Downgrade completed - plan is now pending, clearing actionLoading');
        setTimeout(() => {
          setActionLoading(null);
        }, 100);
      }
    }
  }, [membership, actionLoading]);

  useEffect(() => {
    loadData();
    
    // Check for downgrade parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const downgradePlanId = urlParams.get('downgrade');
      const paymentUpdated = urlParams.get('paymentUpdated');
      
      if (downgradePlanId) {
        // Remove parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
        // Show downgrade confirm modal
        setSelectedDowngradePlanId(downgradePlanId);
        setShowDowngradeConfirm(true);
      }
      
      // Check if user just returned from Stripe billing portal
      if (paymentUpdated === 'true') {
        // Remove parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
        
        // Reload data and try to retry failed invoice
        setTimeout(async () => {
          await loadData();
          await refreshUser();
          
          // Check current membership status
          const updatedMembership = await api.membership.getUserMembership().catch(() => ({ data: null }));
          
          if (updatedMembership.data?.status !== 'payment_failed' && 
              updatedMembership.data?.status !== 'past_due') {
            // Payment already succeeded (Stripe auto-retried)
            alert('Payment method updated successfully! Your membership is now active.');
          } else {
            // Payment method updated but invoice still needs to be retried
            // Try to retry failed invoice immediately
            try {
              const retryResult = await api.payments.retryFailedInvoice();
              if (retryResult.data?.success) {
                // Reload data again to check if status changed
                await loadData();
                await refreshUser();
                
                const finalMembership = await api.membership.getUserMembership().catch(() => ({ data: null }));
                if (finalMembership.data?.status !== 'payment_failed' && 
                    finalMembership.data?.status !== 'past_due') {
                  alert('Payment method updated and invoice paid successfully! Your membership is now active.');
                } else {
                  alert('Payment method updated. We attempted to retry your payment. Please check back in a moment.');
                }
              } else {
                alert('Payment method updated. We attempted to retry your payment, but it may still be processing. Please check back in a few minutes.');
              }
            } catch (retryError: any) {
              console.error('Error retrying invoice:', retryError);
              // If retry fails, Stripe will auto-retry later
              alert('Payment method updated. Stripe will automatically retry your payment. Please check back in a few minutes.');
            }
          }
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membershipRes, plansRes] = await Promise.all([
        api.membership.getUserMembership().catch(() => ({ data: null })),
        api.membership.getPlans().catch(() => ({ data: [] })),
      ]);
      
      console.log('[loadData] Membership response:', membershipRes.data);
      console.log('[loadData] Plans response:', plansRes.data);
      
      // ✅ Force update membership state
      if (membershipRes.data) {
        setMembership(membershipRes.data);
        console.log('[loadData] ✅ Membership state updated, planId:', membershipRes.data.planId);
      } else {
        setMembership(null);
        console.log('[loadData] ⚠️ No membership data');
      }
      
      const plansData = Array.isArray(plansRes.data) ? plansRes.data : [];
      setPlans(plansData);
      
      console.log('[loadData] Loaded plans:', plansData);
      console.log('[loadData] Current membership planId:', membershipRes.data?.planId);

      // Load renewal history if membership exists
      if (membershipRes.data) {
        loadRenewalHistory();
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
      console.log('[Renewal History] Loading page:', page);
      const res = await api.membership.getRenewalHistory(page, 10);
      console.log('[Renewal History] Full API Response:', res);
      
      // Handle both direct response and nested data response
      const responseData = res.data || res;
      const renewalsData = responseData?.data || responseData || [];
      const total = responseData?.total || 0;
      
      console.log('[Renewal History] Parsed:', {
        renewalsCount: Array.isArray(renewalsData) ? renewalsData.length : 0,
        total,
        page,
        firstRenewal: Array.isArray(renewalsData) && renewalsData.length > 0 ? renewalsData[0] : null,
      });
      
      setRenewals(Array.isArray(renewalsData) ? renewalsData : []);
      setRenewalsTotal(total);
      setRenewalsPage(page);
    } catch (error: any) {
      console.error('[Renewal History] Error:', error);
      console.error('[Renewal History] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setRenewals([]);
      setRenewalsTotal(0);
    } finally {
      setLoadingRenewals(false);
    }
  };

  const handlePause = async () => {
    setActionLoading('pause');
    try {
      await api.membership.pause();
      await loadData();
      await refreshUser();
      setShowPauseConfirm(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to pause membership');
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
      alert(error.response?.data?.message || 'Failed to resume membership');
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
      alert(error.response?.data?.message || 'Failed to cancel membership');
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
      alert(error.response?.data?.message || 'Failed to cancel upgrade');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (planId: string) => {
    // ✅ Block if already processing ANY upgrade/downgrade (not just this plan)
    if (actionLoading !== null) {
      console.log('[handleUpgrade] Already processing an action, ignoring');
      return;
    }

    // ✅ Block if already processing upgrade/downgrade for this plan
    if (actionLoading === `upgrade-${planId}` || actionLoading === `downgrade-${planId}`) {
      console.log('[handleUpgrade] Already processing upgrade/downgrade for this plan, ignoring');
      return;
    }

    const newPlan = plans.find(p => p.id === planId);
    if (!newPlan || !membership?.plan) return;

    // ✅ Block if this is already the current plan
    if (membership.planId === planId) {
      console.log('[handleUpgrade] This is already the current plan, ignoring');
      return;
    }

    // Check if it's upgrade or downgrade
    const isUpgrade = isPlanUpgrade(membership.plan, newPlan);
    
    // ✅ Block if already has pending upgrade/downgrade
    if (isUpgrade && membership.pendingUpgradePlanId) {
      alert('You already have a pending upgrade scheduled. Please wait for it to be applied on your next billing date before upgrading again.');
      return;
    }
    
    if (!isUpgrade && membership.pendingDowngradePlanId) {
      alert('You already have a pending downgrade scheduled. Please wait for it to be applied on your next billing date before downgrading again.');
      return;
    }
    
    // Don't set actionLoading here - only set when user confirms. This way Cancel just closes modal without showing "Processing..."
    if (isUpgrade) {
      // Upgrade: show confirm modal first
      setSelectedUpgradePlanId(planId);
      setShowUpgradeConfirm(true);
    } else {
      // Downgrade: show confirm modal (no payment needed)
      setSelectedDowngradePlanId(planId);
      setShowDowngradeConfirm(true);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedUpgradePlanId) return;
    
    // ✅ Disable button immediately to prevent double-click
    setShowUpgradeConfirm(false);
    const loadingKey = `upgrade-${selectedUpgradePlanId}`;
    setActionLoading(loadingKey);
    
    try {
      console.log('[handleConfirmUpgrade] Starting upgrade for plan:', selectedUpgradePlanId);
      console.log('[handleConfirmUpgrade] Current membership planId:', membership?.planId);
      
      // ✅ Call upgrade API directly (no checkout needed - Stripe handles proration automatically)
      const response = await api.membership.upgrade(selectedUpgradePlanId);
      console.log('[handleConfirmUpgrade] Upgrade API response:', response);
      console.log('[handleConfirmUpgrade] Response data:', response?.data);
      console.log('[handleConfirmUpgrade] Response planId:', response?.data?.planId);
      console.log('[handleConfirmUpgrade] Response isProcessingChange:', response?.data?.isProcessingChange);
      console.log('[handleConfirmUpgrade] Expected planId:', selectedUpgradePlanId);
      console.log('[handleConfirmUpgrade] Response planId matches?', response?.data?.planId === selectedUpgradePlanId);
      
      // ✅ Use response data directly if planId matches (faster, more reliable)
      let updatedMembership = response?.data;
      
      // ✅ Use response data directly (upgrade is now pending, so planId won't change immediately)
      if (updatedMembership) {
        console.log('[handleConfirmUpgrade] ✅ Using response data directly');
        console.log('[handleConfirmUpgrade] Response pendingUpgradePlanId:', updatedMembership.pendingUpgradePlanId);
        setMembership(updatedMembership);
      } else {
        // ✅ Wait a bit for DB to update (flag should be cleared by now)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ✅ Force reload membership data to update state
        await loadData();
        await refreshUser();
        
        // ✅ Double-check: Fetch membership again to ensure state is updated
        const updatedMembershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
        updatedMembership = updatedMembershipRes.data;
      }
      
      console.log('[handleConfirmUpgrade] Updated membership after reload:', updatedMembership);
      console.log('[handleConfirmUpgrade] New planId:', updatedMembership?.planId);
      console.log('[handleConfirmUpgrade] Selected planId:', selectedUpgradePlanId);
      console.log('[handleConfirmUpgrade] Is current plan now?', updatedMembership?.planId === selectedUpgradePlanId);
      console.log('[handleConfirmUpgrade] isProcessingChange:', updatedMembership?.isProcessingChange);
      
      // ✅ Log flag status for debugging
      if (updatedMembership?.isProcessingChange) {
        console.warn('[handleConfirmUpgrade] ⚠️ WARNING: isProcessingChange is still true after upgrade! This should be false.');
      }
      
      // ✅ Update membership state directly
      if (updatedMembership) {
        setMembership(updatedMembership);
        console.log('[handleConfirmUpgrade] ✅ Membership state updated directly');
        console.log('[handleConfirmUpgrade] Final membership planId:', updatedMembership.planId);
        console.log('[handleConfirmUpgrade] Final membership plan name:', updatedMembership.plan?.name);
        console.log('[handleConfirmUpgrade] Final membership isProcessingChange:', updatedMembership.isProcessingChange);
        
        // ✅ Always clear actionLoading after state update (button will be disabled by isCurrentPlan check)
        if (updatedMembership.planId === selectedUpgradePlanId) {
          console.log('[handleConfirmUpgrade] ✅ Plan is now current, upgrade successful');
        } else {
          console.log('[handleConfirmUpgrade] ⚠️ WARNING: Plan not current after upgrade! Expected:', selectedUpgradePlanId, 'Got:', updatedMembership.planId);
        }
        
        // Clear actionLoading and show success message
        setActionLoading(null);
        setSelectedUpgradePlanId(null);
        alert('Upgrade scheduled successfully! Your plan will be upgraded on your next billing date. Stripe will handle proration automatically.');
      } else {
        console.error('[handleConfirmUpgrade] ❌ ERROR: Updated membership not found!');
        setActionLoading(null);
        setSelectedUpgradePlanId(null);
        alert('Upgrade successful! Your subscription has been updated. Stripe will handle proration automatically.');
      }
    } catch (error: any) {
      console.error('[handleConfirmUpgrade] Error:', error);
      setActionLoading(null);
      setSelectedUpgradePlanId(null);
      alert(error.response?.data?.message || 'Failed to upgrade membership');
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedDowngradePlanId) {
      setActionLoading(null); // Clear loading if no plan selected
      return;
    }
    
    // ✅ Disable button immediately to prevent double-click
    setShowDowngradeConfirm(false);
    const loadingKey = `downgrade-${selectedDowngradePlanId}`;
    // Note: actionLoading should already be set in handleUpgrade, but ensure it's set here too
    if (actionLoading !== loadingKey) {
      setActionLoading(loadingKey);
    }
    
    try {
      console.log('[handleConfirmDowngrade] Starting downgrade for plan:', selectedDowngradePlanId);
      console.log('[handleConfirmDowngrade] Current membership planId:', membership?.planId);
      
      await api.membership.upgrade(selectedDowngradePlanId); // This will handle downgrade internally
      
      // ✅ Force reload membership data to update state
      await loadData();
      await refreshUser();
      
      // ✅ Double-check: Fetch membership again to ensure state is updated
      const updatedMembershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
      const updatedMembership = updatedMembershipRes.data;
      
      console.log('[handleConfirmDowngrade] Updated membership after reload:', updatedMembership);
      console.log('[handleConfirmDowngrade] Pending downgrade planId:', updatedMembership?.pendingDowngradePlanId);
      console.log('[handleConfirmDowngrade] Selected planId:', selectedDowngradePlanId);
      console.log('[handleConfirmDowngrade] Is pending downgrade?', updatedMembership?.pendingDowngradePlanId === selectedDowngradePlanId);
      
      // ✅ Update membership state directly if loadData didn't update it
      if (updatedMembership) {
        setMembership(updatedMembership);
        console.log('[handleConfirmDowngrade] ✅ Membership state updated directly');
        
        // ✅ Only clear actionLoading if downgrade is now pending (downgrade successful)
        if (updatedMembership.pendingDowngradePlanId === selectedDowngradePlanId) {
          console.log('[handleConfirmDowngrade] ✅ Downgrade is now pending, clearing actionLoading');
          setActionLoading(null);
          setSelectedDowngradePlanId(null);
          alert('Downgrade scheduled successfully. It will apply on your next billing date.');
        } else {
          // If downgrade is not pending yet, keep actionLoading to prevent double-click
          console.log('[handleConfirmDowngrade] ⚠️ Downgrade not pending yet, keeping actionLoading');
          setSelectedDowngradePlanId(null);
          alert('Downgrade scheduled successfully. It will apply on your next billing date.');
        }
      } else {
        // Fallback: clear actionLoading even if membership not found
        setActionLoading(null);
        setSelectedDowngradePlanId(null);
        alert('Downgrade scheduled successfully. It will apply on your next billing date.');
      }
    } catch (error: any) {
      console.error('[handleConfirmDowngrade] Error:', error);
      setActionLoading(null);
      setSelectedDowngradePlanId(null);
      alert(error.response?.data?.message || 'Failed to downgrade membership');
    }
  };

  // Check if moving from oldPlan to newPlan is an upgrade
  const isPlanUpgrade = (oldPlan: any, newPlan: any): boolean => {
    // Define tier hierarchy
    const tierOrder: Record<string, number> = {
      'basic': 1,
      'premium': 2,
      'uni_one': 3,
      'uni_plus': 4,
      'uni_max': 5,
      'elite': 6,
    };

    const oldTierOrder = tierOrder[oldPlan.tier] || 0;
    const newTierOrder = tierOrder[newPlan.tier] || 0;

    // If tier is higher, it's an upgrade
    if (newTierOrder > oldTierOrder) {
      return true;
    }

    // If same tier but higher price, it's an upgrade
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly > oldPlan.priceMonthly) {
      return true;
    }

    // If same tier and price but more credits, it's an upgrade
    if (
      newTierOrder === oldTierOrder &&
      newPlan.priceMonthly === oldPlan.priceMonthly &&
      newPlan.freeCreditsPerPeriod > oldPlan.freeCreditsPerPeriod
    ) {
      return true;
    }

    return false;
  };

  const handleFixPayment = async () => {
    setActionLoading('fixPayment');
    try {
      // Return to membership page after updating payment method
      const returnUrl = `${window.location.origin}/dashboard/membership?paymentUpdated=true`;
      const res = await api.payments.createBillingPortalSession(returnUrl);
      
      if (res.data?.url) {
        // Direct redirect to Stripe billing portal
        window.location.href = res.data.url;
      }
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      alert(error.response?.data?.message || 'Failed to open payment update page. Please try again.');
      setActionLoading(null);
    }
  };


  const getPlanTierName = (tier?: string) => {
    const tierMap: Record<string, string> = {
      'UNI_ONE': 'Silver',
      'UNI_PLUS': 'Gold',
      'UNI_MAX': 'Platinum',
      'TEST': 'Basic',
    };
    return tierMap[tier || ''] || '';
  };

  const getPlanDisplayName = (plan: any) => {
    // Just return the plan name without tier in parentheses
    return plan?.name || 'Unknown';
  };

  const formatDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };

  const formatMembershipDate = (date: string | Date) => {
    const { formatUTCDateOnly } = require('@/lib/timezone');
    return formatUTCDateOnly(date);
  };

  const formatDateWithTime = (dateString: string) => {
    const { formatSydneyDate } = require('@/lib/timezone');
    return formatSydneyDate(dateString);
  };

  const formatCurrency = (amount: number | string, currency: string = 'AUD') => {
    // Always use A$ prefix for AUD to ensure consistent display
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (currency === 'AUD' || !currency) {
      return `A$${numAmount.toFixed(2)}`;
    }
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(numAmount);
  };

  const availablePlans = plans.filter((p) => p.id !== membership?.planId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Membership Plan</h1>

      {/* Past Due Warning */}
      {(membership?.status === 'payment_failed' || membership?.status === 'past_due') && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-red-800 mb-2">Payment failed</h3>
              <p className="mt-1 text-sm text-red-700 mb-4">
                We couldn't process your membership payment. Please update your payment method to keep your membership active.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleFixPayment}
                  disabled={actionLoading === 'fixPayment'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-sm disabled:opacity-50"
                >
                  {actionLoading === 'fixPayment' ? 'Opening...' : 'Update payment'}
                </button>
                <button
                  onClick={handleFixPayment}
                  disabled={actionLoading === 'fixPayment'}
                  className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg font-semibold hover:bg-red-50 transition text-sm disabled:opacity-50"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Current Plan</h2>
        
        {/* Scheduled to cancel (cancelAtPeriodEnd = true, still active) — synced from Stripe Dashboard */}
        {membership && membership.status !== 'canceled' && membership.cancelAtPeriodEnd && membership.currentPeriodEnd && new Date(membership.currentPeriodEnd) > new Date() ? (
          <div>
            <div className="mb-4 p-4 bg-orange-50 border border-orange-300 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-orange-800 font-semibold">
                    Cancellation scheduled — access until {formatMembershipDate(membership.currentPeriodEnd)}
                  </p>
                  <p className="text-orange-700 text-sm mt-1">
                    Your membership will remain active until the end of your current billing period. You won't be charged again.
                  </p>
                </div>
              </div>
            </div>
            {/* Fall through to show the normal active plan card below */}
          </div>
        ) : null}

        {/* Cancelled - Still in billing period */}
        {membership && membership.status === 'canceled' && membership.currentPeriodEnd && new Date(membership.currentPeriodEnd) > new Date() ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Plan: {getPlanDisplayName(membership.plan)} {membership.plan?.priceMonthly && `- ${formatCurrency(membership.plan.priceMonthly)}/month`}
                </h3>
                <p className="text-red-700 font-medium mb-3">
                  Status: Cancelled – access until {formatMembershipDate(membership.currentPeriodEnd)}
                </p>
                <p className="text-gray-700 mb-2">
                  Your UNICASH membership has been cancelled. You won't be charged again, 
                  and you'll keep dashboard access until {formatMembershipDate(membership.currentPeriodEnd)}.
                </p>
                <p className="text-sm text-gray-600 italic mb-4">
                  All of your entries have been removed. To enter future draws, 
                  you'll need to start a new membership.
                </p>
                <button
                  onClick={() => router.push('/#membership-plans')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  Start a new membership
                </button>
              </div>
            </div>
          </div>
        ) : 
        /* Cancelled and billing period ended - No active membership */
        (!membership || (membership.status === 'canceled' && (!membership.currentPeriodEnd || new Date(membership.currentPeriodEnd) <= new Date()))) ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Status: No active membership
            </h3>
            <p className="text-gray-700 mb-4">
              You don't have an active UNICASH membership. Join today to start 
              collecting credits and entering draws.
            </p>
            <button
              onClick={() => router.push('/#membership-plans')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              View membership plans
            </button>
          </div>
        ) :
        /* Active or Paused Membership */
        membership ? (
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div>
                  <h3 className="text-2xl font-bold text-purple-600">
                    {getPlanDisplayName(membership.plan)}
                  </h3>
                  {membership.plan?.priceMonthly && (
                    <p className="text-lg text-gray-600 mt-1">
                      {formatCurrency(membership.plan.priceMonthly)}/month
                    </p>
                  )}
                </div>
                {(membership.status === 'payment_failed' || membership.status === 'past_due') && (
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
                    PAYMENT FAILED
                  </span>
                )}
                {membership.isPaused && (
                  <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                    PAUSED
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-2">
                {membership.plan?.featuresConfig?.features?.[0]?.value 
                  ? `${membership.plan.featuresConfig.features[0].value} ${membership.plan.featuresConfig.features[0].label || 'Verified Entries'}/month`
                  : membership.plan?.grandPrizeEntriesPerPeriod 
                    ? `${membership.plan.grandPrizeEntriesPerPeriod} Verified Entries/month`
                    : 'N/A'
                }
              </p>
              
              {/* Show pause date if membership is paused */}
              {membership.isPaused && membership.pausedAt && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <span className="font-semibold">Paused on:</span> {formatMembershipDate(membership.pausedAt)}
                    {membership.pauseExpiresAt && (
                      <>
                        <br />
                        <span className="font-semibold">Expires on:</span> {formatMembershipDate(membership.pauseExpiresAt)}
                      </>
                    )}
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mb-4">
                Plan changes will apply on your next billing date. You can pause or cancel anytime.
              </p>
              
              {/* Actions based on state */}
              <div className="flex items-center space-x-4">
               
                {membership.isPaused ? (
                  <button
                    onClick={() => setShowResumeConfirm(true)}
                    disabled={actionLoading !== null}
                    className="text-purple-600 hover:text-purple-700 font-semibold disabled:opacity-50"
                  >
                    Resume Now
                  </button>
                ) : (
                  <>
                    {/* Show Pause button if membership is active and not paused, not processing change */}
                    {/* Note: Allow pause even if cancelAtPeriodEnd is true, as user may want to pause before cancellation takes effect */}
                    {(() => {
                      // Show pause if active, not paused, not processing, and not payment failed/past due
                      const canShowPause = membership.status === 'active' && 
                        !membership.isPaused &&
                        !membership.isProcessingChange &&
                        membership.status !== 'payment_failed' &&
                        membership.status !== 'past_due';
                      
                      return canShowPause ? (
                        <button
                          onClick={() => setShowPauseConfirm(true)}
                          disabled={actionLoading !== null}
                          className="text-gray-700 hover:text-gray-900 font-semibold disabled:opacity-50"
                        >
                          Pause
                        </button>
                      ) : null;
                    })()}
                    {/* Show Cancel button only if not already canceled AND not already scheduled to cancel */}
                    {membership.status !== 'canceled' && !membership.cancelAtPeriodEnd && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={actionLoading !== null}
                        className="text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
                      >
                        Cancel Membership
                      </button>
                    )}
                  </>
                )}
                {membership.pendingUpgradePlanId && (
                  <button
                    onClick={() => setShowCancelUpgradeConfirm(true)}
                    disabled={actionLoading !== null}
                    className="text-orange-600 hover:text-orange-700 font-semibold disabled:opacity-50"
                  >
                    Cancel Upgrade
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              {/* Hide "Next billing" when paused, canceled, or cancelAtPeriodEnd */}
              {membership.currentPeriodEnd && 
               !membership.isPaused && 
               membership.status !== 'canceled' &&
               !membership.cancelAtPeriodEnd && (
                <p className="text-sm text-gray-600">Next billing: {formatMembershipDate(membership.currentPeriodEnd)}</p>
              )}
              {/* Show "Access until" when cancelAtPeriodEnd */}
              {membership.currentPeriodEnd &&
               !membership.isPaused &&
               membership.cancelAtPeriodEnd && (
                <p className="text-sm text-orange-600 font-medium">Access until: {formatMembershipDate(membership.currentPeriodEnd)}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Available Plans */}
      {/* Hide Available Plans section if membership is cancelled but still in billing period, or if paused */}
      {plans.length > 0 && !(membership && (
        (membership.status === 'canceled' && membership.currentPeriodEnd && new Date(membership.currentPeriodEnd) > new Date()) ||
        membership.isPaused
      )) && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
          {availablePlans.length === 0 && membership && (
            <p className="text-gray-600 mb-4">You are already subscribed to all available plans.</p>
          )}
          
          {/* Payment Failed - Show Fix Payment Message */}
          {(membership?.status === 'payment_failed' || membership?.status === 'past_due') && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-semibold mb-1">Payment Required</p>
                  <p className="text-sm text-yellow-700">
                    Please fix your payment method before upgrading or downgrading your membership plan.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6">
            {availablePlans.map((plan) => {
              const isUpgrade = membership?.plan ? isPlanUpgrade(membership.plan, plan) : false;
              const isDowngrade = membership?.plan ? !isPlanUpgrade(membership.plan, plan) && membership.planId !== plan.id : false;
              const isPaymentFailed = membership?.status === 'payment_failed' || membership?.status === 'past_due';
              const hasPendingDowngrade = membership?.pendingDowngradePlanId === plan.id;
              const hasPendingUpgrade = membership?.pendingUpgradePlanId === plan.id; // ✅ Check if THIS plan has pending upgrade
              const hasPendingUpgradeOther = membership?.pendingUpgradePlanId && membership?.pendingUpgradePlanId !== plan.id;
              const hasPendingDowngradeOther = membership?.pendingDowngradePlanId && membership?.pendingDowngradePlanId !== plan.id;
              const isCurrentPlan = membership?.planId === plan.id;
              const isProcessingChange = membership?.isProcessingChange || false; // ✅ Check DB lock flag
              
              // Debug log
              if (isProcessingChange) {
                console.log(`[MembershipCard] ⚠️ Membership isProcessingChange=true, blocking actions for plan ${plan.name}`);
              }
              
              // ✅ Block upgrade if already has pending upgrade (to this plan or another plan)
              const canUpgrade = !isUpgrade || (!hasPendingUpgrade && !hasPendingUpgradeOther);
              // ✅ Block downgrade if already has pending downgrade
              const canDowngrade = !isDowngrade || !hasPendingDowngradeOther;
              // ✅ Block if membership is processing a change (DB lock)
              const canPerformAction = canUpgrade && canDowngrade && !isProcessingChange;
              
              return (
                <div key={plan.id} className="bg-white rounded-2xl shadow-lg p-6 relative">
                  {plan.badgeText && (
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded text-xs font-semibold ${
                      plan.badgeType === 'popular' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {plan.badgeText}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    {formatCurrency(plan.priceMonthly || 0)}/month
                  </p>
                  
                  {/* Pending Upgrade Status */}
                  {hasPendingUpgrade && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>⏳ Pending Upgrade:</strong> This plan will be activated on your next billing date ({membership?.currentPeriodEnd ? formatMembershipDate(membership.currentPeriodEnd) : 'next renewal'}). Credits will reset to {plan.freeCreditsPerPeriod} credits/month.
                      </p>
                    </div>
                  )}
                  
                  {/* Pending Downgrade Status */}
                  {hasPendingDowngrade && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>⏳ Pending Downgrade:</strong> This plan will be activated on your next billing date ({membership?.currentPeriodEnd ? formatMembershipDate(membership.currentPeriodEnd) : 'next renewal'}). Credits will reset to {plan.freeCreditsPerPeriod} credits/month.
                      </p>
                    </div>
                  )}
                  
                  {/* Block message if already has pending upgrade/downgrade */}
                  {!canPerformAction && !hasPendingUpgrade && !hasPendingDowngrade && (
                    <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <p className="text-sm text-orange-800">
                        {isProcessingChange ? (
                          <><strong>⏳ Processing Change:</strong> An upgrade or downgrade is currently in progress. Please wait for it to complete.</>
                        ) : hasPendingUpgradeOther ? (
                          <><strong>⚠️ Pending Upgrade:</strong> You already have a pending upgrade scheduled. Please wait for it to be applied on your next billing date before upgrading again.</>
                        ) : hasPendingDowngradeOther ? (
                          <><strong>⚠️ Pending Downgrade:</strong> You already have a pending downgrade scheduled. Please wait for it to be applied on your next billing date before downgrading again.</>
                        ) : null}
                      </p>
                    </div>
                  )}
                  
                  {/* Upgrade/Downgrade Info */}
                  {!hasPendingDowngrade && !isCurrentPlan && (
                    <div className={`mb-4 p-3 rounded-lg ${
                      isUpgrade ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      {isUpgrade ? (
                        <p className="text-sm text-blue-800">
                          <strong>Upgrade:</strong> Plan will change immediately. Credits will reset to {plan.freeCreditsPerPeriod} credits/month on your next billing date.
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-800">
                          <strong>Downgrade:</strong> Plan will change on your next billing date ({membership?.currentPeriodEnd ? formatMembershipDate(membership.currentPeriodEnd) : 'next renewal'}). Credits will reset to {plan.freeCreditsPerPeriod} credits/month.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 mb-6">
                    {plan.featuresConfig?.features && Array.isArray(plan.featuresConfig.features) && plan.featuresConfig.features.map((feature: any, idx: number) => (
                      <p key={idx} className="text-gray-600">
                        {feature.value !== undefined && feature.value !== null && feature.value !== '' && (
                          <span className="font-semibold">{feature.value} </span>
                        )}
                        {feature.label}
                        {feature.unit && ` ${feature.unit}`}
                        {feature.description && (
                          <span className="text-gray-500 text-sm"> - {feature.description}</span>
                        )}
                        {feature.subFeatures && Array.isArray(feature.subFeatures) && feature.subFeatures.length > 0 && (
                          <span className="text-purple-600 font-semibold">
                            {' '}{feature.subFeatures.map((sf: any) => sf.label).join(', ')}
                          </span>
                        )}
                      </p>
                    ))}
                    {(!plan.featuresConfig?.features || !Array.isArray(plan.featuresConfig.features) || plan.featuresConfig.features.length === 0) && (
                      <p className="text-gray-600">
                        {plan.freeCreditsPerPeriod || 0} credits/month
                      </p>
                    )}
                  </div>
                  
                  {/* Payment Failed - Show Fix Payment Button */}
                  {isPaymentFailed ? (
                    <button
                      onClick={handleFixPayment}
                      disabled={actionLoading === 'fixPayment'}
                      className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {actionLoading === 'fixPayment' ? 'Opening...' : 'Fix payment'}
                    </button>
                  ) : isCurrentPlan ? (
                    <button
                      disabled={true}
                      className="w-full bg-gray-300 text-gray-600 font-bold py-3 px-6 rounded-lg cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={
                        actionLoading !== null ||
                        actionLoading === `upgrade-${plan.id}` ||
                        actionLoading === `downgrade-${plan.id}` ||
                        (showUpgradeConfirm && selectedUpgradePlanId === plan.id) ||
                        (showDowngradeConfirm && selectedDowngradePlanId === plan.id) ||
                        !canPerformAction ||
                        isCurrentPlan ||
                        isProcessingChange
                      }
                      className={`w-full font-bold py-3 px-6 rounded-lg transition ${
                        !canPerformAction || isCurrentPlan || actionLoading === `upgrade-${plan.id}` || actionLoading === `downgrade-${plan.id}` || (showUpgradeConfirm && selectedUpgradePlanId === plan.id) || (showDowngradeConfirm && selectedDowngradePlanId === plan.id)
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                      } disabled:opacity-50`}
                    >
                      {actionLoading === `upgrade-${plan.id}` || actionLoading === `downgrade-${plan.id}`
                        ? 'Processing...'
                        : isProcessingChange
                          ? 'Processing Change...'
                          : !canPerformAction || isCurrentPlan
                            ? (isCurrentPlan ? 'Current Plan' : hasPendingUpgrade ? 'Pending Upgrade' : hasPendingUpgradeOther ? 'Pending Upgrade' : hasPendingDowngradeOther ? 'Pending Downgrade' : `Get ${plan.name}`)
                            : isUpgrade
                              ? `Upgrade - Get ${plan.name}`
                              : isDowngrade
                                ? `Downgrade - Get ${plan.name}`
                                : `Get ${plan.name}`
                      }
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Renewal History */}
      {membership && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {loadingRenewals ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading renewal history...</p>
            </div>
          ) : renewals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-2">No renewal history found</p>
              <p className="text-xs text-gray-400">
                Your renewal history will appear here once your membership is renewed.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {renewals.map((renewal: any) => (
                  <div 
                    key={renewal.id} 
                    className={`rounded-lg p-4 border ${
                      renewal.status === 'succeeded' 
                        ? 'bg-green-50 border-green-200' 
                        : renewal.status === 'failed'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            renewal.status === 'succeeded' 
                              ? 'bg-green-100 text-green-800' 
                              : renewal.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {renewal.status === 'succeeded' ? '✅ Succeeded' : 
                             renewal.status === 'failed' ? '❌ Failed' : 
                             renewal.status === 'pending' ? '⏳ Pending' : renewal.status}
                          </span>
                          {renewal.failureReason && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                              {renewal.failureReason}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-gray-600">Period:</span>
                            <p className="text-gray-900 font-medium">
                              {formatDateWithTime(renewal.periodStart)} - {formatDateWithTime(renewal.periodEnd)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <p className="text-gray-900 font-medium">
                              {formatCurrency(renewal.amount / 100, renewal.currency?.toUpperCase() || 'AUD')}
                            </p>
                          </div>
                          {renewal.creditsGranted !== null && renewal.creditsGranted !== undefined && (
                            <div>
                              <span className="text-gray-600">Credits Granted:</span>
                              <p className="text-gray-900 font-medium">{renewal.creditsGranted}</p>
                            </div>
                          )}
                          {renewal.grandPrizeEntriesGranted !== null && renewal.grandPrizeEntriesGranted !== undefined && (
                            <div>
                              <span className="text-gray-600">Grand Prize Entries:</span>
                              <p className="text-gray-900 font-medium">{renewal.grandPrizeEntriesGranted}</p>
                            </div>
                          )}
                        </div>
                        {renewal.failureMessage && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                            <strong>Error:</strong> {renewal.failureMessage}
                          </div>
                        )}
                        {renewal.failedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Failed: {formatDateWithTime(renewal.failedAt)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateWithTime(renewal.createdAt)}
                        </p>
                        {renewal.stripeInvoiceId && (
                          <a
                            href={`https://dashboard.stripe.com/test/invoices/${renewal.stripeInvoiceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block"
                          >
                            View Stripe Invoice →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {renewalsTotal > renewals.length && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => loadRenewalHistory(renewalsPage + 1)}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                  >
                    Load More ({renewalsTotal - renewals.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel your membership?"
        message="Are you sure you want to cancel your UNICASH membership? All of your entries will be deleted immediately, and you will lose access to all active draws."
        confirmText="Cancel membership"
        cancelText="Keep my membership"
        type="danger"
      />

      <ConfirmModal
        isOpen={showPauseConfirm}
        onClose={() => setShowPauseConfirm(false)}
        onConfirm={handlePause}
        title="Pause your membership?"
        message={`You're pausing your membership for 30 days.
No charges and no entries will be issued during this period.
You can resume anytime. Your membership will automatically reactivate after 30 days with all your data saved.`}
        confirmText="Pause membership"
        cancelText="Keep my membership active"
        type="warning"
      />

      <ConfirmModal
        isOpen={showResumeConfirm}
        onClose={() => setShowResumeConfirm(false)}
        onConfirm={handleResume}
        title="Resume your membership?"
        message="Billing will restart from your next renewal, and you'll start receiving monthly credits and member perks again."
        confirmText="Resume membership"
        cancelText="Keep it paused"
        type="info"
      />

      <ConfirmModal
        isOpen={showCancelUpgradeConfirm}
        onClose={() => setShowCancelUpgradeConfirm(false)}
        onConfirm={handleCancelUpgrade}
        title="Cancel Upgrade"
        message="Are you sure you want to cancel your pending upgrade?"
        confirmText="Cancel Upgrade"
        cancelText="Keep Upgrade"
        type="warning"
      />

      {/* Upgrade Confirmation Modal */}
      {selectedUpgradePlanId && (
        <ConfirmModal
          isOpen={showUpgradeConfirm}
          onClose={() => {
            setShowUpgradeConfirm(false);
            setSelectedUpgradePlanId(null);
            if (actionLoading === `upgrade-${selectedUpgradePlanId}`) setActionLoading(null);
          }}
          onConfirm={handleConfirmUpgrade}
          title={`You're upgrading to ${plans.find(p => p.id === selectedUpgradePlanId)?.name || 'this plan'}${plans.find(p => p.id === selectedUpgradePlanId)?.tier === 'uni_plus' ? ' (Gold)' : plans.find(p => p.id === selectedUpgradePlanId)?.tier === 'uni_max' ? ' (Platinum)' : plans.find(p => p.id === selectedUpgradePlanId)?.tier === 'uni_one' ? ' (Silver)' : ''}.`}
          message={
            membership?.currentPeriodEnd
              ? `This change will take effect on your next billing date (${formatMembershipDate(membership.currentPeriodEnd)}). No payment will be charged today.`
              : 'This change will take effect on your next billing date. No payment will be charged today.'
          }
          confirmText="Confirm Upgrade"
          cancelText="Cancel"
          type="info"
        />
      )}

      {/* Downgrade Confirmation Modal */}
      <ConfirmModal
        isOpen={showDowngradeConfirm}
        onClose={() => {
          setShowDowngradeConfirm(false);
          setSelectedDowngradePlanId(null);
          if (selectedDowngradePlanId && actionLoading === `downgrade-${selectedDowngradePlanId}`) setActionLoading(null);
        }}
        onConfirm={handleConfirmDowngrade}
        title={`You're downgrading to ${plans.find(p => p.id === selectedDowngradePlanId)?.name || 'this plan'}${plans.find(p => p.id === selectedDowngradePlanId)?.tier === 'uni_plus' ? ' (Gold)' : plans.find(p => p.id === selectedDowngradePlanId)?.tier === 'uni_max' ? ' (Platinum)' : plans.find(p => p.id === selectedDowngradePlanId)?.tier === 'uni_one' ? ' (Silver)' : ''}.`}
          message={
            membership?.currentPeriodEnd
              ? `This change will take effect on your next billing date (${formatMembershipDate(membership.currentPeriodEnd)}). No payment will be charged today.`
              : 'This change will take effect on your next billing date. No payment will be charged today.'
          }
        confirmText="Confirm Downgrade"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}

