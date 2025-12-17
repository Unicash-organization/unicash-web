'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [selectedDowngradePlanId, setSelectedDowngradePlanId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // Check for downgrade parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const downgradePlanId = urlParams.get('downgrade');
      if (downgradePlanId) {
        // Remove parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
        // Show downgrade confirm modal
        setSelectedDowngradePlanId(downgradePlanId);
        setShowDowngradeConfirm(true);
      }
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membershipRes, plansRes] = await Promise.all([
        api.membership.getUserMembership().catch(() => ({ data: null })),
        api.membership.getPlans().catch(() => ({ data: [] })),
      ]);
      
      console.log('Membership response:', membershipRes.data);
      console.log('Plans response:', plansRes.data);
      
      setMembership(membershipRes.data);
      const plansData = Array.isArray(plansRes.data) ? plansRes.data : [];
      setPlans(plansData);
      
      console.log('Loaded plans:', plansData);
      console.log('Current membership planId:', membershipRes.data?.planId);

      // Load renewal history if membership exists
      if (membershipRes.data) {
        loadRenewalHistory();
      }
    } catch (error) {
      console.error('Error loading membership data:', error);
      setPlans([]);
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
    const newPlan = plans.find(p => p.id === planId);
    if (!newPlan || !membership?.plan) return;

    // Check if it's upgrade or downgrade
    const isUpgrade = isPlanUpgrade(membership.plan, newPlan);
    
    if (isUpgrade) {
      // Upgrade: redirect to checkout to pay for upgrade
      router.push(`/checkout?planId=${planId}&upgrade=true`);
    } else {
      // Downgrade: show confirm modal (no payment needed)
      setSelectedDowngradePlanId(planId);
      setShowDowngradeConfirm(true);
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedDowngradePlanId) return;
    
    setShowDowngradeConfirm(false);
    setActionLoading(`downgrade-${selectedDowngradePlanId}`);
    
    try {
      await api.membership.upgrade(selectedDowngradePlanId); // This will handle downgrade internally
      await loadData();
      await refreshUser();
      alert('Downgrade scheduled successfully. It will apply on your next billing date. You will receive prorated credits for the remaining period.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to downgrade membership');
    } finally {
      setActionLoading(null);
      setSelectedDowngradePlanId(null);
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

  // Calculate proration info for display
  const getProrationInfo = (newPlan: any) => {
    if (!membership?.plan || !membership.currentPeriodStart || !membership.currentPeriodEnd) {
      return null;
    }

    const now = new Date();
    const periodStart = new Date(membership.currentPeriodStart);
    const periodEnd = new Date(membership.currentPeriodEnd);

    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysRemaining = Math.ceil(
      (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysRemaining <= 0 || totalDays <= 0) {
      return null;
    }

    const prorationRatio = daysRemaining / totalDays;
    const creditDifference = newPlan.freeCreditsPerPeriod - membership.plan.freeCreditsPerPeriod;
    const prorationCredits = Math.floor(creditDifference * prorationRatio);

    return {
      daysRemaining,
      prorationCredits,
      isUpgrade: isPlanUpgrade(membership.plan, newPlan),
    };
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
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateWithTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount);
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
      {membership?.status === 'past_due' && membership?.pastDueAt && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-red-800">Payment Failed - Action Required</h3>
              <p className="mt-1 text-sm text-red-700">
                Your membership payment failed. Please update your payment method to continue enjoying your membership benefits.
                {(() => {
                  const pastDueDate = new Date(membership.pastDueAt);
                  const daysPastDue = Math.floor((new Date().getTime() - pastDueDate.getTime()) / (1000 * 60 * 60 * 24));
                  const daysRemaining = 7 - daysPastDue;
                  return daysRemaining > 0 
                    ? ` You have ${daysRemaining} day(s) remaining in your grace period.`
                    : ' Your grace period has expired. Please update your payment method immediately.';
                })()}
              </p>
              <Link href="/dashboard/security-billing">
                <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold">
                  Update Payment Method
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Current Plan</h2>
        
        {/* Cancelled - Still in billing period */}
        {membership && membership.status === 'canceled' && membership.currentPeriodEnd && new Date(membership.currentPeriodEnd) > new Date() ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Plan: {getPlanDisplayName(membership.plan)} Monthly
                </h3>
                <p className="text-red-700 font-medium mb-3">
                  Status: Cancelled – access until {formatDate(membership.currentPeriodEnd)}
                </p>
                <p className="text-gray-700 mb-2">
                  Your UNICASH membership has been cancelled. You won't be charged again, 
                  and you'll keep dashboard access until {formatDate(membership.currentPeriodEnd)}.
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
                <h3 className="text-2xl font-bold text-purple-600">
                  {getPlanDisplayName(membership.plan)}
                </h3>
                {membership.status === 'past_due' && (
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
                    PAST DUE
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
                    {!membership.cancelAtPeriodEnd && (
                      <button
                        onClick={() => setShowPauseConfirm(true)}
                        disabled={actionLoading !== null}
                        className="text-gray-700 hover:text-gray-900 font-semibold disabled:opacity-50"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={actionLoading !== null}
                      className="text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
                    >
                      Cancel Membership
                    </button>
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
              {membership.currentPeriodEnd && (
                <p className="text-sm text-gray-600">Next billing: {formatDate(membership.currentPeriodEnd)}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Available Plans */}
      {plans.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
          {availablePlans.length === 0 && membership && (
            <p className="text-gray-600 mb-4">You are already subscribed to all available plans.</p>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {availablePlans.map((plan) => {
              const isUpgrade = membership?.plan ? isPlanUpgrade(membership.plan, plan) : false;
              const isDowngrade = membership?.plan ? !isPlanUpgrade(membership.plan, plan) : false;
              const prorationInfo = membership?.plan ? getProrationInfo(plan) : null;
              
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
                  
                  {/* Proration info */}
                  {prorationInfo && (
                    <div className={`mb-4 p-3 rounded-lg ${
                      isUpgrade ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      {isUpgrade ? (
                        <p className="text-sm text-blue-800">
                          <strong>Upgrade:</strong> You'll pay the prorated difference and receive {Math.abs(prorationInfo.prorationCredits)} additional credits for the remaining {prorationInfo.daysRemaining} days.
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-800">
                          <strong>Downgrade:</strong> Will apply on next billing date. You'll receive {Math.abs(prorationInfo.prorationCredits)} prorated credits for the remaining {prorationInfo.daysRemaining} days.
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
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={actionLoading !== null || actionLoading === `upgrade-${plan.id}` || actionLoading === `downgrade-${plan.id}`}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
                  >
                    {actionLoading === `upgrade-${plan.id}` || actionLoading === `downgrade-${plan.id}` 
                      ? 'Processing...' 
                      : isUpgrade 
                        ? `Upgrade - Get ${plan.name}` 
                        : isDowngrade 
                          ? `Downgrade - Get ${plan.name}` 
                          : `Get ${plan.name}`
                    }
                  </button>
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
        message="You are pausing your subscription. No charges will occur during this period. You can return at any time – everything will be saved!"
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

      <ConfirmModal
        isOpen={showDowngradeConfirm}
        onClose={() => {
          setShowDowngradeConfirm(false);
          setSelectedDowngradePlanId(null);
        }}
        onConfirm={handleConfirmDowngrade}
        title="Confirm Downgrade"
        message={
          selectedDowngradePlanId
            ? `Are you sure you want to downgrade to ${plans.find(p => p.id === selectedDowngradePlanId)?.name || 'this plan'}? The downgrade will apply on your next billing date, and you will receive prorated credits for the remaining period.`
            : 'Are you sure you want to downgrade your membership?'
        }
        confirmText="Confirm Downgrade"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}

