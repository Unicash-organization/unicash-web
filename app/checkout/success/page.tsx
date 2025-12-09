'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchPaymentStatus();
    }
  }, [sessionId]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await api.payments.getPaymentBySession(sessionId!);
      setPayment(response.data);
    } catch (error) {
      console.error('Error fetching payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your purchase. Your account has been created and credits have been granted.
          </p>

          {payment && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium">{payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${payment.amount}</span>
                </div>
                {payment.creditsGranted && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credits Granted:</span>
                    <span className="font-medium">{payment.creditsGranted}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    payment.status === 'succeeded' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Link href="/giveaways">
              <button className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition">
                Start Entering Draws
              </button>
            </Link>
            <Link href="/">
              <button className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

