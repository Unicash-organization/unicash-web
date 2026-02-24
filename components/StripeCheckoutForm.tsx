'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutFormProps {
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency?: string;
  buttonText?: string;
  /** When set, user pays with this saved card (no PaymentElement). Only used when logged in and has saved cards. */
  savedPaymentMethod?: { id: string; brand: string; last4: string } | null;
}

function CheckoutForm({ clientSecret, paymentId, amount, currency = 'AUD', buttonText = 'Pay and Start Membership', savedPaymentMethod = null }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { setAuth, user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [paymentMethodsAvailable, setPaymentMethodsAvailable] = useState<{
    applePay: boolean;
    googlePay: boolean;
  }>({ applePay: false, googlePay: false });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'applePay' | 'googlePay'>('card');

  useEffect(() => {
    if (!stripe) return;

    // Clear Stripe Link session if user is not logged in
    if (!user && typeof window !== 'undefined') {
      // Clear Stripe localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('__stripe') || key.startsWith('stripe')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Only enable Payment Request (Apple Pay/Google Pay) on HTTPS or localhost
    const isSecureContext = typeof window !== 'undefined' && 
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

    if (!isSecureContext) {
      console.log('Payment Request (Apple Pay/Google Pay) requires HTTPS. Current protocol:', window.location.protocol);
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'AU', // Australia
      currency: currency.toLowerCase(),
      total: {
        label: 'Total',
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    const handlePaymentMethod = async (ev: any) => {
      setLoading(true);
      setError(null);
      
      try {
        // Confirm payment with PaymentIntent
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          // Handle different error types with user-friendly messages
          let errorMessage = confirmError.message || 'Payment failed';
          
          if (confirmError.code === 'card_declined') {
            errorMessage = 'Your card was declined. Please try a different payment method or contact your bank.';
          } else if (confirmError.code === 'insufficient_funds') {
            errorMessage = 'Insufficient funds. Please use a different card or add funds to your account.';
          } else if (confirmError.code === 'expired_card') {
            errorMessage = 'Your card has expired. Please use a different card.';
          }
          
          setError(errorMessage);
          setLoading(false);
          return;
        }

        ev.complete('success');
        
        // Confirm on backend
        const confirmResponse = await api.payments.confirmPayment(paymentId);
        if (confirmResponse.data.success && confirmResponse.data.user) {
          // Check if user is already logged in
          const existingToken = localStorage.getItem('token');
          const isAlreadyLoggedIn = !!existingToken;
          
          if (isAlreadyLoggedIn) {
            // User is already logged in - keep existing token and refresh user data
            console.log('User already logged in, keeping existing token and refreshing user data');
            // Refresh user data to get updated membership and credits
            await refreshUser();
            // Redirect to thank-you page
            router.push(`/thank-you?paymentId=${paymentId}`);
          } else if (confirmResponse.data.token) {
            // New user or not logged in - set auth token and user data
            setAuth(confirmResponse.data.token, confirmResponse.data.user);
            router.push(`/thank-you?paymentId=${paymentId}`);
          } else {
            router.push(`/thank-you?paymentId=${paymentId}`);
          }
        } else {
          router.push(`/thank-you?paymentId=${paymentId}`);
        }
      } catch (err: any) {
        console.error('Payment confirmation error:', err);
        setError(err.response?.data?.message || 'An error occurred');
        ev.complete('fail');
        setLoading(false);
      }
    };

    pr.on('paymentmethod', handlePaymentMethod);

    // Check which payment methods are available
    pr.canMakePayment().then((result) => {
      console.log('Payment Request canMakePayment result:', result);
      if (result) {
        setPaymentRequest(pr);
        setPaymentMethodsAvailable({
          applePay: !!result.applePay,
          googlePay: !!result.googlePay,
        });
        console.log('Payment methods available:', {
          applePay: !!result.applePay,
          googlePay: !!result.googlePay,
        });
      } else {
        console.log('No payment methods available');
      }
    }).catch((error) => {
      console.error('Error checking payment methods:', error);
    });

    return () => {
      pr.off('paymentmethod', handlePaymentMethod);
    };
  }, [stripe, clientSecret, paymentId, amount, currency, setAuth, router, user, refreshUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe) return;

    setLoading(true);
    setError(null);

    try {
      // Pay with saved card: confirm with existing payment method
      if (savedPaymentMethod) {
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: savedPaymentMethod.id,
        }, { handleActions: false });

        if (confirmError) {
          let errorMessage = confirmError.message || 'Payment failed';
          if (confirmError.code === 'card_declined') {
            errorMessage = 'Your card was declined. Please try a different payment method or contact your bank.';
          } else if (confirmError.code === 'insufficient_funds') {
            errorMessage = 'Insufficient funds. Please use a different card or add funds to your account.';
          } else if (confirmError.code === 'expired_card') {
            errorMessage = 'Your card has expired. Please use a different card.';
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        const confirmResponse = await api.payments.confirmPayment(paymentId);
        if (confirmResponse.data.success && confirmResponse.data.user) {
          const existingToken = localStorage.getItem('token');
          if (existingToken) {
            await refreshUser();
            router.push(`/thank-you?paymentId=${paymentId}`);
          } else if (confirmResponse.data.token) {
            setAuth(confirmResponse.data.token, confirmResponse.data.user);
            router.push(`/thank-you?paymentId=${paymentId}`);
          } else {
            router.push(`/thank-you?paymentId=${paymentId}`);
          }
        } else {
          router.push(`/thank-you?paymentId=${paymentId}`);
        }
        return;
      }

      // New card: use PaymentElement
      if (!elements) {
        setLoading(false);
        return;
      }
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'An error occurred');
        setLoading(false);
        return;
      }

      const confirmParams: any = {
        return_url: `${window.location.origin}/checkout/success?payment_id=${paymentId}`,
      };

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams,
        redirect: 'if_required',
      });

      if (confirmError) {
        // Handle different error types with user-friendly messages
        let errorMessage = confirmError.message || 'Payment failed';
        
        // Map Stripe error codes to user-friendly messages
        if (confirmError.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please try a different payment method or contact your bank.';
        } else if (confirmError.code === 'insufficient_funds') {
          errorMessage = 'Insufficient funds. Please use a different card or add funds to your account.';
        } else if (confirmError.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please use a different card.';
        } else if (confirmError.code === 'incorrect_cvc') {
          errorMessage = 'Your card\'s security code is incorrect. Please check and try again.';
        } else if (confirmError.code === 'processing_error') {
          errorMessage = 'An error occurred while processing your payment. Please try again.';
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Payment succeeded, confirm on backend
      const confirmResponse = await api.payments.confirmPayment(paymentId);
      
      if (confirmResponse.data.success && confirmResponse.data.user) {
        // Check if user is already logged in
        const existingToken = localStorage.getItem('token');
        const isAlreadyLoggedIn = !!existingToken;
        
        if (isAlreadyLoggedIn) {
          // User is already logged in - keep existing token and refresh user data
          console.log('User already logged in, keeping existing token and refreshing user data');
          // Refresh user data to get updated membership and credits
          await refreshUser();
          // Redirect to thank-you page
          router.push(`/thank-you?paymentId=${paymentId}`);
        } else if (confirmResponse.data.token) {
          // New user or not logged in - set auth token and user data
          setAuth(confirmResponse.data.token, confirmResponse.data.user);
          // Wait a bit to ensure token is saved to localStorage
          await new Promise(resolve => setTimeout(resolve, 100));
          // Verify token is in localStorage
          const savedToken = localStorage.getItem('token');
          if (!savedToken) {
            console.error('Token was not saved to localStorage!');
            // Try again
            localStorage.setItem('token', confirmResponse.data.token);
          }
          // Redirect to thank-you page
          router.push(`/thank-you?paymentId=${paymentId}`);
        } else {
          console.warn('No token received from confirmPayment response and user not logged in');
          // Fallback: redirect to thank-you page
          router.push(`/thank-you?paymentId=${paymentId}`);
        }
      } else {
        // Payment succeeded but no user data, redirect to thank-you page
        router.push(`/thank-you?paymentId=${paymentId}`);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  const handleApplePayClick = async () => {
    if (!paymentRequest || !paymentMethodsAvailable.applePay) return;
    setSelectedPaymentMethod('applePay');
    // Trigger Apple Pay
    paymentRequest.show();
  };

  const handleGooglePayClick = async () => {
    if (!paymentRequest || !paymentMethodsAvailable.googlePay) return;
    setSelectedPaymentMethod('googlePay');
    // Trigger Google Pay
    paymentRequest.show();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Payment</h2>

        {/* Saved card: show label only, no PaymentElement */}
        {savedPaymentMethod ? (
          <div className="p-4 border-2 border-purple-500 bg-purple-50 rounded-lg mb-4">
            <p className="font-medium text-gray-900">
              Paying with {savedPaymentMethod.brand.toUpperCase()} •••• {savedPaymentMethod.last4}
            </p>
          </div>
        ) : (
        <>
        {/* Apple Pay and Google Pay Buttons */}
        {paymentRequest && (paymentMethodsAvailable.applePay || paymentMethodsAvailable.googlePay) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {paymentMethodsAvailable.applePay && (
              <button
                type="button"
                onClick={handleApplePayClick}
                className="flex items-center justify-center gap-2 bg-black text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-800 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Pay</span>
              </button>
            )}
            {paymentMethodsAvailable.googlePay && (
              <button
                type="button"
                onClick={handleGooglePayClick}
                className="flex items-center justify-center gap-2 bg-black text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-800 transition"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Pay with G Pay</span>
              </button>
            )}
          </div>
        )}

        {/* Credit/Debit Card Option */}
        <div
          onClick={() => setSelectedPaymentMethod('card')}
          className={`p-4 border-2 rounded-lg cursor-pointer transition mb-4 ${
            selectedPaymentMethod === 'card'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">Credit/ Debit Card</p>
              <p className="text-xs text-gray-500">Visa, Master Card, Amex</p>
            </div>
          </div>
        </div>

        {/* Payment Element for Card Details */}
        {selectedPaymentMethod === 'card' && (
          <div className="mb-4">
            <PaymentElement 
              key={user?.email || 'guest'} // Force re-render when user changes
              options={{
                layout: 'tabs',
                fields: {
                  billingDetails: {
                    email: 'auto', // Always collect email (will be pre-filled if user is logged in)
                  },
                },
                defaultValues: {
                  billingDetails: {
                    email: user?.email || undefined,
                    name: user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.firstName || user?.lastName || undefined,
                  },
                },
              }}
            />
          </div>
        )}
        </>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold mb-1">Payment Failed</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-red-600">
                You can try again with a different payment method. Your payment has not been processed.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || (!savedPaymentMethod && selectedPaymentMethod !== 'card')}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : buttonText}
      </button>

      {/* Security and Payment Logos */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-green-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">100% Safe and Secure Payments</span>
        </div>
        
        <div className="flex items-center justify-center gap-3 flex-wrap text-xs">
          <span className="font-semibold" style={{ color: '#635BFF' }}>stripe</span>
          <span className="text-gray-700">Apple Pay</span>
          <span className="font-semibold" style={{ color: '#0070BA' }}>PayPal</span>
          <span className="text-gray-700">Visa</span>
          <span className="text-gray-700">Google Pay</span>
        </div>
      </div>
    </form>
  );
}

export interface StripeCheckoutFormWrapperProps {
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency?: string;
  buttonText?: string;
  savedPaymentMethod?: { id: string; brand: string; last4: string } | null;
}

export default function StripeCheckoutFormWrapper({
  clientSecret,
  paymentId,
  amount,
  currency = 'AUD',
  buttonText,
  savedPaymentMethod = null,
}: StripeCheckoutFormWrapperProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#9333ea',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    // Note: paymentMethodTypes can only be used with 'mode', not with 'clientSecret'
    // We disable Link in PaymentElement options instead
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm
        clientSecret={clientSecret}
        paymentId={paymentId}
        amount={amount}
        currency={currency}
        buttonText={buttonText}
        savedPaymentMethod={savedPaymentMethod}
      />
    </Elements>
  );
}

