'use client';

/**
 * Shared trust / payment method strip — keep in sync with Stripe checkout form.
 */
export default function PaymentTrustStrip() {
  return (
    <div className="space-y-2 py-7 sm:py-8">
      <div className="flex items-center justify-center gap-2 text-[#10B981]">
        <svg
          className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[13px] sm:text-sm font-semibold tracking-tight text-[#0f1222]">
          100% Safe and Secure Payments
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-[12px] text-[#667085]">
        <span className="font-semibold" style={{ color: '#635BFF' }}>
          stripe
        </span>
        <span aria-hidden className="text-[#cfc8e8]">
          •
        </span>
        <span>Apple Pay</span>
        <span aria-hidden className="text-[#cfc8e8]">
          •
        </span>
        <span className="font-semibold" style={{ color: '#0070BA' }}>
          PayPal
        </span>
        <span aria-hidden className="text-[#cfc8e8]">
          •
        </span>
        <span>Visa</span>
        <span aria-hidden className="text-[#cfc8e8]">
          •
        </span>
        <span>Google Pay</span>
      </div>
    </div>
  );
}
