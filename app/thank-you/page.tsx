'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const { user, refreshUser } = useAuth();
  const [payment, setPayment] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirectDrawId, setRedirectDrawId] = useState<string | null>(null);

  // Format AUD currency - Always use A$ prefix
  const formatAUD = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `A$${numAmount.toFixed(2)}`;
  };

  useEffect(() => {
    // Check for drawId in sessionStorage (from checkout redirect)
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
    // Check if user is logged in (either from context or localStorage token)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (user || token) {
      // User is logged in - refresh user data to get updated membership and credits
      if (user) {
        fetchMembership();
        refreshUser(); // Refresh user to get updated credits
        
        // Auto-redirect to draw if drawId exists and user is now logged in
        if (redirectDrawId && membership?.status === 'active') {
          // Small delay to ensure everything is loaded
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('redirectDrawId');
            }
            router.push(`/giveaways/${redirectDrawId}`);
          }, 2000); // 2 second delay to show thank you message
        }
      } else if (token) {
        // Token exists but user not in context - refresh user
        refreshUser();
      }
    }
  }, [user, membership, redirectDrawId, router, refreshUser]);

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const planName = membership?.plan?.name || payment?.plan?.name || 'Membership';
  const creditsGranted = payment?.creditsGranted || 0;
  const totalCredits = (user?.membershipCredits || 0) + (user?.boostCredits || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to UNICASH!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your {planName} membership is now active. You're all set to start entering draws!
          </p>

          {/* Credits Display */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-8 border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Credits</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Membership Credits</p>
                <p className="text-3xl font-bold text-purple-600">{user?.membershipCredits || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Renew monthly</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Boost Credits</p>
                <p className="text-3xl font-bold text-green-600">{user?.boostCredits || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Never expire</p>
              </div>
            </div>
            <div className="bg-purple-600 text-white rounded-lg p-4">
              <p className="text-sm mb-1">Total Credits</p>
              <p className="text-4xl font-bold">{totalCredits}</p>
            </div>
          </div>

          {/* Grand Prize Entry Info */}
          {membership?.plan?.grandPrizeEntriesPerPeriod > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <h3 className="text-xl font-bold text-yellow-900">Grand Prize Entry Granted!</h3>
              </div>
              <p className="text-gray-700">
                You've been automatically entered into this month's Grand Prize draw! 
                Check your entries in your dashboard.
              </p>
            </div>
          )}

          {/* Payment Details */}
          {payment && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-900 mb-4 text-center">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium">{payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatAUD(parseFloat(payment.amount?.toString() || '0'))}</span>
                </div>
                {creditsGranted > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credits Granted:</span>
                    <span className="font-medium">{creditsGranted}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">{payment.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-4">
            {redirectDrawId ? (
              <>
                <Link href={`/giveaways/${redirectDrawId}`}>
                  <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition text-lg shadow-lg">
                    Return to Draw →
                  </button>
                </Link>
                <p className="text-sm text-gray-500 text-center">
                  You'll be automatically redirected in a few seconds...
                </p>
              </>
            ) : (
              <Link href="/giveaways">
                <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition text-lg shadow-lg">
                  Enter Now →
                </button>
              </Link>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/dashboard">
                <button className="w-full bg-white border-2 border-purple-600 text-purple-600 font-semibold py-3 px-6 rounded-lg hover:bg-purple-50 transition">
                  Go to Dashboard
                </button>
              </Link>
              <Link href="/">
                <button className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-8">
            Need help? Contact us at{' '}
            <a href="mailto:support@unicash.com" className="text-purple-600 hover:underline">
              support@unicash.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}

