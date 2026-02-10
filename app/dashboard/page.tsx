'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { formatTimeRemaining } from '@/lib/utils';
import MembershipRequiredModal from '@/components/MembershipRequiredModal';

export default function DashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [membership, setMembership] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [creditLedger, setCreditLedger] = useState<any[]>([]);
  const [activeDraws, setActiveDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [fixingPayment, setFixingPayment] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadData();
      
      // Check if user just returned from Stripe billing portal
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentUpdated = urlParams.get('paymentUpdated');
        
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
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [membershipRes, paymentsRes, entriesRes, ledgerRes, drawsRes] = await Promise.all([
        api.membership.getUserMembership().catch(() => ({ data: null })),
        api.payments.getPaymentsByUserId(user?.id || '').catch(() => ({ data: [] })),
        api.entries.getUserEntries().catch(() => ({ data: [] })),
        api.users.getCreditLedger().catch(() => ({ data: [] })),
        api.draws.getAll(user?.id).catch(() => ({ data: [] })), // Pass userId for early access filtering
      ]);

      setMembership(membershipRes.data);
      setPayments(paymentsRes.data || []);
      setEntries(entriesRes.data || []);
      setCreditLedger(ledgerRes.data || []);
      
      // Find all active draws with entries
      const userEntryDrawIds = new Set(entriesRes.data?.map((e: any) => e.drawId) || []);
      const drawsWithEntries = drawsRes.data?.filter((d: any) => 
        d.state === 'open' && userEntryDrawIds.has(d.id)
      ) || [];
      
      const drawsWithUserEntries = drawsWithEntries.map((draw: any) => {
        const drawEntries = entriesRes.data?.filter((e: any) => e.drawId === draw.id) || [];
        return { ...draw, userEntries: drawEntries.length };
      });
      
      setActiveDraws(drawsWithUserEntries);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getUserDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getPlanTierName = (tier?: string) => {
    const tierMap: Record<string, string> = {
      'UNI_ONE': 'Silver',
      'UNI_PLUS': 'Gold',
      'UNI_MAX': 'Platinum',
      'TEST': 'Basic',
    };
    return tierMap[tier?.toUpperCase() || ''] || '';
  };

  const getPlanDisplayName = (plan: any) => {
    // Just return the plan name without tier in parentheses
    return plan?.name || 'Unknown';
  };

  const handleFixPayment = async () => {
    try {
      setFixingPayment(true);
      // Return to dashboard after updating payment method
      const returnUrl = `${window.location.origin}/dashboard?paymentUpdated=true`;
      const res = await api.payments.createBillingPortalSession(returnUrl);
      
      if (res.data?.url) {
        // Direct redirect to Stripe billing portal
        window.location.href = res.data.url;
      }
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      alert(error.response?.data?.message || 'Failed to open payment update page. Please try again.');
      setFixingPayment(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };

  const formatMembershipDate = (date: string | Date) => {
    const { formatUTCDateOnly } = require('@/lib/timezone');
    return formatUTCDateOnly(date);
  };

  const formatDateTime = (date: string | Date) => {
    const { formatDateTime: formatDT } = require('@/lib/timezone');
    return formatDT(date);
  };

  const formatCurrency = (amount: number | string, currency: string = 'AUD') => {
    // Always use A$ prefix for AUD to ensure consistent display
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    if (currency === 'AUD' || !currency) {
      return `A$${numAmount.toFixed(2)}`;
    }
    return new Intl.NumberFormat('en-AU', { 
      style: 'currency', 
      currency: currency || 'AUD' 
    }).format(numAmount);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hi {getUserDisplayName()}</h1>
          {membership && (
            <div className="flex items-center space-x-4 mb-2">
              <p className="text-gray-600">
                You're on {getPlanDisplayName(membership.plan)} ({getPlanTierName(membership.plan?.tier)})
              </p>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                (membership.status === 'past_due' || membership.status === 'payment_failed')
                  ? 'bg-red-600 text-white' 
                  : 'bg-purple-600 text-white'
              }`}>
                {(membership.status === 'past_due' || membership.status === 'payment_failed') 
                  ? 'PAYMENT FAILED' 
                  : getPlanTierName(membership.plan?.tier).toUpperCase()}
              </span>
            </div>
          )}
          {/* Account Locked Warning */}
          {user?.isLocked && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-bold text-red-800">Account Locked</h3>
                  <p className="mt-1 text-sm text-red-700">
                    Your account has been locked due to a payment dispute (chargeback). 
                    {user.lockReason === 'chargeback_dispute' && ' Any credits or entries associated with the disputed payment have been revoked.'}
                  </p>
                  <p className="mt-2 text-xs text-red-600">
                    {user.lockedAt && (() => {
                      const { formatSydneyDateOnly } = require('@/lib/timezone');
                      return `Locked on: ${formatSydneyDateOnly(user.lockedAt)}`;
                    })()}
                  </p>
                  <Link href="/contact" className="mt-3 inline-block">
                    <button className="text-sm font-semibold text-red-800 hover:text-red-900 underline">
                      Contact Support to Resolve
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {(membership?.status === 'payment_failed' || membership?.status === 'past_due') && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
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
                      disabled={fixingPayment}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-sm disabled:opacity-50"
                    >
                      {fixingPayment ? 'Opening...' : 'Update payment'}
                    </button>
                    <button
                      onClick={handleFixPayment}
                      disabled={fixingPayment}
                      className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg font-semibold hover:bg-red-50 transition text-sm disabled:opacity-50"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {membership?.currentPeriodEnd && (
            <p className="text-sm text-gray-600">
              Next billing: {formatMembershipDate(membership.currentPeriodEnd)} · Active since: {formatDate(membership.createdAt)}
            </p>
          )}
        </div>
        {/* Badge Placeholder */}
        <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <span className="text-gray-400 text-sm font-medium">BADGE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Membership Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Membership Plan</h2>
          {membership ? (
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ background: 'linear-gradient(180deg, #9186FF 0%, #6356E5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {getPlanDisplayName(membership.plan)} ({getPlanTierName(membership.plan?.tier)})
              </h3>
              <p className="text-gray-600 mb-4">
                Includes: {Array.isArray(membership.plan?.featuresConfig) && membership.plan.featuresConfig[0]?.value 
                  ? `${membership.plan.featuresConfig[0].value} Verified Entries/ month`
                  : 'N/A'
                }
                {Array.isArray(membership.plan?.featuresConfig) && membership.plan.featuresConfig[1]?.value && (
                  <span> +{membership.plan.featuresConfig[1].value} Credits</span>
                )}
              </p>
              {membership.currentPeriodEnd && (
                <p className="text-sm text-gray-600 mb-4">Next billing: {formatMembershipDate(membership.currentPeriodEnd)}</p>
              )}
              <div className="flex justify-end">
                <Link href="/dashboard/membership">
                  <span className="font-semibold cursor-pointer hover:opacity-80 transition" style={{ background: 'linear-gradient(180deg, #9186FF 0%, #6356E5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Manage Plan →
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">No active membership</p>
              <Link href="/checkout">
                <button className="btn-primary">Subscribe Now</button>
              </Link>
            </div>
          )}
        </div>

        {/* Credit Balance Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Credit Balance</h2>
          <div className="space-y-3 mb-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-700 font-semibold">Boost:</span>
                <span className="text-gray-900 font-bold">{user.boostCredits || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Never expire</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-700 font-semibold">Membership:</span>
                <span className="text-gray-900 font-bold">{user.membershipCredits || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Renew monthly</p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-900 font-bold">Total:</span>
                <span className="font-bold text-xl" style={{ background: 'linear-gradient(180deg, #9186FF 0%, #6356E5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {(user.membershipCredits || 0) + (user.boostCredits || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500">Never expire</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link href="/giveaways">
              <button className="bg-purple-600 border-2 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition">
                Use Credit
              </button>
            </Link>
            <button
              onClick={() => {
                // Check if user has active membership
                const hasActiveMembership = membership?.status === 'active' && 
                  membership?.currentPeriodEnd && 
                  new Date(membership.currentPeriodEnd) > new Date();
                
                if (!hasActiveMembership) {
                  setShowMembershipModal(true);
                } else {
                  router.push('/checkout');
                }
              }}
              className="ml-4 border-2 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition" 
              style={{ borderColor: '#9186FF', background: 'linear-gradient(180deg, #9186FF 0%, #6356E5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Buy Boost Pack
            </button>
          </div>
        </div>
      </div>

      {/* Active Entries */}
      {activeDraws.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Active Entries</h2>
          <div className="space-y-4">
            {activeDraws.map((draw: any) => {
              const primaryImage = Array.isArray(draw.images) && draw.images.length > 0
                ? draw.images.find((img: any) => img.isPrimary) || draw.images[0]
                : null;
              const imageUrl = primaryImage?.url || primaryImage?.src || null;
              
              return (
                <div key={draw.id} className="flex items-center space-x-6 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-500">
                    {imageUrl ? (
                      <img src={imageUrl} alt={draw.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                        🎁
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{draw.title || 'Major Reward Draw'}</h3>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{draw.entrants || 0}/{draw.cap || 100} entrants</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(((draw.entrants || 0) / (draw.cap || 100)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Time left: {formatTimeRemaining(draw.closedAt)}</span>
                      <span>Drawn: {formatDateTime(draw.closedAt)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-purple-600 text-white px-6 py-3 rounded-lg text-center">
                      <p className="text-sm font-medium">You have</p>
                      <p className="text-2xl font-bold">{draw.userEntries || 0}</p>
                      <p className="text-sm font-medium">entries</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credits Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Credits Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance After</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creditLedger.slice(0, 10).map((ledger: any) => (
                <tr key={ledger.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(ledger.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      ledger.transactionType === 'grant' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ledger.transactionType === 'grant' ? 'Earned' : 'Spent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ledger.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      ledger.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ledger.amount > 0 ? '+' : ''}{ledger.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ledger.balanceAfter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      ledger.transactionType === 'grant' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ledger.transactionType === 'grant' ? 'Success' : (ledger.amount < 0 ? 'Failed' : 'Success')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Purchase History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount (AUD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promo Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.slice(0, 10).map((payment: any) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentType === 'membership' 
                      ? `${payment.metadata?.planName || 'Membership'} ${payment.metadata?.isRenewal ? 'Renewal' : ''}`
                      : `Boost Pack ${payment.metadata?.packName || ''} (${payment.creditsGranted || 0} credits)`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.discountAmount && payment.discountAmount > 0 ? (
                      <div>
                        <div className="text-gray-400 line-through text-xs">
                          {formatCurrency(
                            payment.metadata?.originalAmount 
                              ? parseFloat(payment.metadata.originalAmount.toString())
                              : (parseFloat(payment.amount.toString()) + parseFloat(payment.discountAmount.toString())),
                            payment.currency
                          )}
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(payment.amount.toString()), payment.currency)}
                        </div>
                        <div className="text-xs text-green-600">
                          Saved: {formatCurrency(parseFloat(payment.discountAmount.toString()), payment.currency)}
                        </div>
                      </div>
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(parseFloat(payment.amount.toString()), payment.currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.promoCode ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {payment.promoCode}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        // Show payment details in a modal or navigate to payment detail page
                        alert(`Payment ID: ${payment.id}\nStatus: ${payment.status}\n${payment.promoCode ? `Promo Code: ${payment.promoCode}\nDiscount: ${formatCurrency(parseFloat(payment.discountAmount?.toString() || '0'), payment.currency)}` : ''}`);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo Code Usage Summary */}
      {payments.some((p: any) => p.promoCode) && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Promo Code Usage</h2>
          <div className="space-y-3">
            {payments
              .filter((p: any) => p.promoCode && p.status === 'succeeded')
              .map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {payment.promoCode}
                      </span>
                      <span className="text-sm text-gray-600">
                        Used on {formatDate(payment.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {payment.paymentType === 'membership' 
                        ? `${payment.metadata?.planName || 'Membership'}`
                        : `Boost Pack ${payment.metadata?.packName || ''}`
                      }
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      -{formatCurrency(parseFloat(payment.discountAmount?.toString() || '0'), payment.currency)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Payment #{payment.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
