'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadPaymentMethod();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPaymentMethod = async () => {
    try {
      setLoading(true);
      const res = await api.payments.getPaymentMethod();
      setPaymentMethod(res.data);
    } catch (error: any) {
      console.error('Error loading payment method:', error);
      setPaymentMethod(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCard = async () => {
    try {
      setUpdating(true);
      const returnUrl = `${window.location.origin}/dashboard/billing`;
      const res = await api.payments.createBillingPortalSession(returnUrl);
      
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      alert(error.response?.data?.message || 'Failed to open billing portal. Please try again.');
      setUpdating(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };

  const getCardBrandColor = (brand?: string) => {
    const brandMap: Record<string, string> = {
      visa: 'bg-blue-600',
      mastercard: 'bg-red-600',
      amex: 'bg-blue-500',
      discover: 'bg-orange-600',
    };
    return brandMap[brand?.toLowerCase() || ''] || 'bg-gray-600';
  };

  const getCardBrandName = (brand?: string) => {
    if (!brand) return 'CARD';
    return brand.toUpperCase();
  };

  const formatExpiryDate = (month?: number, year?: number) => {
    if (!month || !year) return 'N/A';
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString().slice(-2);
    return `${monthStr}/${yearStr}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing</h1>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Current Payment Method</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : paymentMethod ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-8 ${getCardBrandColor(paymentMethod.card?.brand)} rounded flex items-center justify-center text-white font-bold text-xs`}>
                  {getCardBrandName(paymentMethod.card?.brand)}
                </div>
                <span className="text-gray-700">{getCardBrandName(paymentMethod.card?.brand)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card number</label>
                <input
                  type="text"
                  value={`**** **** **** ${paymentMethod.card?.last4 || '****'}`}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expire date</label>
                <input
                  type="text"
                  value={formatExpiryDate(paymentMethod.card?.expMonth, paymentMethod.card?.expYear)}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
            </div>
            {paymentMethod.type === 'card' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid via</label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">Card</span>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500">Last updated: {formatDate(new Date())}</p>
            <button
              onClick={handleUpdateCard}
              disabled={updating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Opening...' : 'Update Card'}
            </button>
            <p className="text-xs text-gray-500 mt-4">
              All card details are securely encrypted and managed by Stripe — PCI Level 1 certified. UNICASH never stores your payment information.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">No payment method on file.</p>
            <p className="text-sm text-gray-500">
              You can add a payment method when you subscribe to a membership plan or purchase a boost pack.
            </p>
            <button
              onClick={() => router.push('/#membership-plans')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

