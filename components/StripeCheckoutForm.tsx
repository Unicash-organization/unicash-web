'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import api from '@/lib/api';
import PaymentTrustStrip from '@/components/PaymentTrustStrip';
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
  /** Major draw landing: guest checkout — no auto-login; success page shows password + Login. */
  guestLandingFlow?: boolean;
  onGuestLandingPurchaseComplete?: () => void;
}

function CheckoutForm({
  clientSecret,
  paymentId,
  amount,
  currency = 'AUD',
  buttonText = 'Pay and Start Membership',
  savedPaymentMethod = null,
  guestLandingFlow = false,
  onGuestLandingPurchaseComplete,
}: StripeCheckoutFormProps) {
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

  const navigateAfterConfirm = useCallback(
    async (confirmResponse: { data?: any }) => {
      const data = confirmResponse?.data;
      if (guestLandingFlow && data?.majorDrawLandingGuest) {
        try {
          sessionStorage.setItem(
            'unicash_mdl_guest_success',
            JSON.stringify(data.majorDrawLandingGuest),
          );
        } catch {
          /* ignore */
        }
        onGuestLandingPurchaseComplete?.();
        router.push('/win/purchase-success');
        return;
      }

      if (data?.success && data?.user) {
        const existingToken = localStorage.getItem('token');
        const isAlreadyLoggedIn = !!existingToken;

        if (isAlreadyLoggedIn) {
          await refreshUser();
          router.push(`/thank-you?paymentId=${paymentId}`);
        } else if (data.token) {
          setAuth(data.token, data.user);
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (!localStorage.getItem('token')) {
            localStorage.setItem('token', data.token);
          }
          router.push(`/thank-you?paymentId=${paymentId}`);
        } else {
          router.push(`/thank-you?paymentId=${paymentId}`);
        }
      } else {
        router.push(`/thank-you?paymentId=${paymentId}`);
      }
    },
    [
      guestLandingFlow,
      paymentId,
      router,
      setAuth,
      refreshUser,
      onGuestLandingPurchaseComplete,
    ],
  );

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

        const confirmResponse = await api.payments.confirmPayment(paymentId);
        await navigateAfterConfirm(confirmResponse);
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
  }, [stripe, clientSecret, paymentId, amount, currency, user, navigateAfterConfirm]);

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
        await navigateAfterConfirm(confirmResponse);
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

      const confirmResponse = await api.payments.confirmPayment(paymentId);
      await navigateAfterConfirm(confirmResponse);
    } catch (err: any) {
      // Enhanced error logging — surfaces actual Stripe / backend / network error
      // instead of generic "An error occurred during payment" message.
      console.error('Payment error:', err);
      console.error('Payment error response:', err?.response);
      console.error('Payment error response data:', err?.response?.data);
      console.error('Payment error message:', err?.message);
      console.error('Payment error code:', err?.code);
      console.error('Payment error type:', err?.type);

      // Build the user-facing message — try response.data.message first (backend),
      // then err.message (Stripe / native), then fallback.
      const userMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'An error occurred during payment. Please try again or refresh the page.';

      setError(userMessage);
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1a1a1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1a1a1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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

        {/* Credit/Debit Card Option — v4 themed */}
        <button
          type="button"
          onClick={() => setSelectedPaymentMethod('card')}
          aria-pressed={selectedPaymentMethod === 'card'}
          className={`group mb-4 flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 ${
            selectedPaymentMethod === 'card'
              ? 'border-[#6356E5] bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] shadow-[0_8px_24px_-12px_rgba(99,86,229,0.35)]'
              : 'border-[#E0DAFF] bg-[#FBFAFF] hover:border-[#c8c5ea] hover:bg-white'
          }`}
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
              selectedPaymentMethod === 'card'
                ? 'bg-white text-[#6356E5] ring-1 ring-[#E0DAFF] shadow-[0_2px_8px_-3px_rgba(99,86,229,0.2)]'
                : 'bg-white text-[#667085] ring-1 ring-[#E7E9F2]'
            }`}
            aria-hidden
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-[14.5px] font-extrabold tracking-tight ${
              selectedPaymentMethod === 'card' ? 'text-[#0f1222]' : 'text-[#0f1222]'
            }`}>
              Credit / Debit Card
            </span>
            <span className="mt-0.5 block text-[12px] text-[#667085]">Visa, Mastercard, Amex</span>
          </span>
          {selectedPaymentMethod === 'card' && (
            <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6356E5] text-white shadow-[0_4px_12px_-4px_rgba(99,86,229,0.5)]">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </button>

        {/* Payment Element for Card Details — full-width so its left + right edges
            align cleanly with the Credit/Debit Card box above and the Pay button below.
            Stripe handles its own internal field layout responsively. */}
        {selectedPaymentMethod === 'card' && (
          <div className="mb-4 w-full">
            <PaymentElement
              key={user?.email || 'guest'} // Force re-render when user changes
              options={{
                /* Accordion layout — when Klarna/etc. are restricted server-side via
                   payment_method_types: ['card'], this renders Card form directly without tabs.
                   paymentMethodOrder prioritizes Card so it's always the active/expanded item. */
                layout: {
                  type: 'accordion',
                  defaultCollapsed: false,
                  radios: false,
                  spacedAccordionItems: false,
                },
                paymentMethodOrder: ['card'],
                /* Use Stripe's default fields handling — DON'T opt out of address.
                   Opting out (`address: 'never'`) forces us to pass country + postal_code
                   manually in confirmParams, which is fragile.
                   With default behavior, Stripe shows the minimal card form (number + expiry
                   + CVC) for AU cards and doesn't render a country field — same UX as Apple,
                   Stripe Dashboard, etc. */
                defaultValues: {
                  billingDetails: {
                    email: user?.email || undefined,
                    name: user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || user?.lastName || undefined,
                    address: {
                      country: 'AU', // pre-fill if Stripe asks for country (it usually doesn't for AU cards)
                    },
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
        className="uc-lift-sm relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden />
            Processing…
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {buttonText}
          </>
        )}
      </button>

      <PaymentTrustStrip />
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
  guestLandingFlow?: boolean;
  onGuestLandingPurchaseComplete?: () => void;
}

export default function StripeCheckoutFormWrapper({
  clientSecret,
  paymentId,
  amount,
  currency = 'AUD',
  buttonText,
  savedPaymentMethod = null,
  guestLandingFlow = false,
  onGuestLandingPurchaseComplete,
}: StripeCheckoutFormWrapperProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    /* Appearance synced with UNICASH Design System v4 — pure styling, no logic change.
       Variables drive Stripe's defaults; Rules override per-element to match the v4
       input look (rounded-2xl, lavender bg, brand-purple focus ring). */
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6356E5',         // brand purple
        colorBackground: '#FBFAFF',      // soft lavender input bg (matches v4 inputs)
        colorText: '#0F1222',            // main text
        colorTextSecondary: '#4B5563',
        colorTextPlaceholder: '#A3A8BE',
        colorDanger: '#EF4444',
        colorSuccess: '#10B981',
        colorWarning: '#F59E0B',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontWeightNormal: '500',
        fontWeightMedium: '600',
        fontWeightBold: '700',
        fontSizeBase: '14px',
        spacingUnit: '4px',
        borderRadius: '14px',           // closer to v4 rounded-2xl (16px)
        focusBoxShadow: '0 0 0 2px rgba(99, 86, 229, 0.30)',
        focusOutline: 'none',
      },
      rules: {
        // Input fields — match v4 inputs (lavender bg, brand-tinted border, premium focus)
        '.Input': {
          border: '1px solid #E0DAFF',
          boxShadow: 'inset 0 1px 2px rgba(15, 18, 34, 0.04)',
          padding: '12px 14px',
          fontSize: '14px',
          color: '#0F1222',
        },
        '.Input:hover': {
          borderColor: '#C8C5EA',
          backgroundColor: '#FFFFFF',
        },
        '.Input:focus': {
          borderColor: '#6356E5',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 0 0 2px rgba(99, 86, 229, 0.30)',
        },
        '.Input--invalid': {
          borderColor: '#FCA5A5',
          color: '#991B1B',
          boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.20)',
        },
        // Field labels above inputs
        '.Label': {
          fontSize: '12.5px',
          fontWeight: '600',
          color: '#0F1222',
          marginBottom: '6px',
        },
        // Section headings inside PaymentElement (e.g. "Payment", "Card")
        '.PaymentMethodMessaging': {
          fontSize: '12.5px',
          color: '#667085',
        },
        // Tab option pills (Card / Klarna / etc.) — v4 themed
        '.Tab': {
          border: '1px solid #E7E9F2',
          borderRadius: '14px',
          padding: '10px 12px',
          backgroundColor: '#FFFFFF',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
        },
        '.Tab:hover': {
          borderColor: '#C8C5EA',
          backgroundColor: '#FBFAFF',
        },
        '.Tab--selected': {
          borderColor: '#6356E5',
          backgroundColor: '#F4F1FB',
          boxShadow: '0 0 0 1px #6356E5',
        },
        '.TabLabel': {
          fontSize: '13px',
          fontWeight: '600',
        },
        '.TabIcon--selected': {
          fill: '#6356E5',
        },
        // Error messages
        '.Error': {
          fontSize: '12px',
          color: '#991B1B',
          marginTop: '6px',
        },
        // Section dividers
        '.Block': {
          backgroundColor: 'transparent',
        },
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
        guestLandingFlow={guestLandingFlow}
        onGuestLandingPurchaseComplete={onGuestLandingPurchaseComplete}
      />
    </Elements>
  );
}

