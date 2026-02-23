'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function UpdateCardForm({
  clientSecret,
  onSuccess,
  onClose,
  onError,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: typeof window !== 'undefined' ? window.location.href : '',
        },
      });
      if (result.error) {
        onError(result.error.message || 'Setup failed');
        setLoading(false);
        return;
      }
      const si = 'setupIntent' in result ? result.setupIntent : null;
      const paymentMethodId =
        si && (typeof (si as any).payment_method === 'string')
          ? (si as any).payment_method
          : (si as any)?.payment_method?.id;
      if (!paymentMethodId) {
        onError('Could not get payment method');
        setLoading(false);
        return;
      }
      await api.payments.setDefaultPaymentMethod(paymentMethodId);
      onSuccess();
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.message || err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          wallets: { applePay: 'never', googlePay: 'never' },
        }}
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save card'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function UpdateCardModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.payments
      .createSetupIntentForUpdateCard()
      .then((res) => {
        if (!cancelled && res.data?.clientSecret) setClientSecret(res.data.clientSecret);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load form');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const options: StripeElementsOptions = {
    clientSecret: clientSecret!,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#9333ea',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">Update payment method</h2>
        <p className="text-sm text-gray-600 mb-6">Enter your new card details below. Secured by Stripe.</p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {loading && !clientSecret && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        )}
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <UpdateCardForm
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onClose={onClose}
              onError={setError}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
