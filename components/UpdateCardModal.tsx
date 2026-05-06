'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const CardIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);
const SpinnerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" fill="none" />
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
const LockIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function UpdateCardForm({
  clientSecret,
  onSuccess,
  onClose,
  onError,
  setAsDefault,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onClose: () => void;
  onError: (message: string) => void;
  setAsDefault: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [setAsDefaultChecked, setSetAsDefaultChecked] = useState(setAsDefault);

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
      if (setAsDefaultChecked) {
        await api.payments.setDefaultPaymentMethod(paymentMethodId);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.message || err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          wallets: { applePay: 'never', googlePay: 'never' },
        }}
      />
      <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[#E7E9F2] bg-white p-3 transition hover:border-[#c8c5ea]">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            setAsDefaultChecked ? 'border-[#6356E5] bg-[#6356E5]' : 'border-[#cfc8e8] bg-white'
          }`}
        >
          {setAsDefaultChecked && <CheckIcon className="h-3 w-3 text-white" />}
        </span>
        <input
          type="checkbox"
          checked={setAsDefaultChecked}
          onChange={(e) => setSetAsDefaultChecked(e.target.checked)}
          className="sr-only"
        />
        <span className="text-[13.5px] font-semibold text-[#0F1222]">Set as default payment method</span>
      </label>

      {/* CTAs — vertical stack */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <SpinnerIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Saving…
            </>
          ) : (
            <>
              <LockIcon className="h-4 w-4" />
              Save card
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-[#667085] transition-colors hover:text-[#0F1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
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
  setAsDefault = false,
  overlayClassName,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setAsDefault?: boolean;
  /** When set, use this for the overlay. Default: high z + portal to body to sit above other modals. */
  overlayClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  /* Stripe Elements appearance — synced with v4 design system */
  const options: StripeElementsOptions = {
    clientSecret: clientSecret!,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6356E5',
        colorBackground: '#FBFAFF',
        colorText: '#0F1222',
        colorTextSecondary: '#4B5563',
        colorTextPlaceholder: '#A3A8BE',
        colorDanger: '#EF4444',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontWeightNormal: '500',
        fontWeightBold: '700',
        fontSizeBase: '14px',
        spacingUnit: '4px',
        borderRadius: '14px',
        focusBoxShadow: '0 0 0 2px rgba(99, 86, 229, 0.30)',
        focusOutline: 'none',
      },
      rules: {
        '.Input': {
          border: '1px solid #E0DAFF',
          padding: '12px 14px',
          fontSize: '14px',
        },
        '.Input:focus': {
          borderColor: '#6356E5',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 0 0 2px rgba(99, 86, 229, 0.30)',
        },
        '.Label': {
          fontSize: '12.5px',
          fontWeight: '600',
          color: '#0F1222',
          marginBottom: '6px',
        },
      },
    },
  };

  const overlay =
    overlayClassName ||
    'uc-ucm-backdrop fixed inset-0 z-[200] flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4';

  return createPortal(
    <div
      className={overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="uc-ucm-modal relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:max-h-[90vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ucm-title"
      >
        {/* Mobile drag handle */}
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[#E0DAFF]" />
        </div>

        {/* Close (X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/85 backdrop-blur transition-colors hover:bg-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Hero band */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
          <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />
          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
            <CardIcon className="h-7 w-7 text-[#FFE2B0]" />
          </span>
          <h2 id="ucm-title" className="relative mt-4 text-[20px] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[22px]">
            Update payment method
          </h2>
          <p className="relative mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-white/75">
            <LockIcon className="h-3 w-3" />
            Bank-grade Stripe checkout
          </p>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#FBFAFF] px-5 py-5 sm:px-6 sm:py-6">
          {error && (
            <div className="mb-4 rounded-2xl bg-[#FEF2F2] p-3.5 ring-1 ring-[#FCA5A5]/60">
              <div className="flex items-start gap-2">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                <p className="text-[13px] text-[#991B1B]">{error}</p>
              </div>
            </div>
          )}

          {loading && !clientSecret && (
            <div className="flex justify-center py-10">
              <SpinnerIcon className="h-8 w-8 animate-spin text-[#6356E5] motion-reduce:animate-none" />
            </div>
          )}

          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <UpdateCardForm
                clientSecret={clientSecret}
                onSuccess={onSuccess}
                onClose={onClose}
                onError={setError}
                setAsDefault={setAsDefault}
              />
            </Elements>
          )}
        </div>

        {/* Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes uc-ucm-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes uc-ucm-scale-in {
            from { transform: scale(0.96); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
          @keyframes uc-ucm-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .uc-ucm-modal    { animation: uc-ucm-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
          .uc-ucm-backdrop { animation: uc-ucm-fade-in 220ms ease-out; }
          @media (min-width: 640px) {
            .uc-ucm-modal  { animation: uc-ucm-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-ucm-modal,
            .uc-ucm-backdrop { animation: none !important; }
          }
        ` }} />
      </div>
    </div>,
    document.body,
  );
}
