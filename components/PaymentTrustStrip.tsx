'use client';

/**
 * Shared trust / payment method strip — keep in sync with Stripe checkout form.
 */
export default function PaymentTrustStrip() {
  return (
    <div className="space-y-3 py-6">
      <div className="flex items-center justify-center gap-2 text-green-600">
        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium">100% Safe and Secure Payments</span>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap text-xs opacity-90 text-gray-600">
        <span className="font-semibold" style={{ color: '#635BFF' }}>
          stripe
        </span>
        <span className="text-gray-700">Apple Pay</span>
        <span className="font-semibold" style={{ color: '#0070BA' }}>
          PayPal
        </span>
        <span className="text-gray-700">Visa</span>
        <span className="text-gray-700">Google Pay</span>
      </div>
    </div>
  );
}
