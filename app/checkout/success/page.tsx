'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import LoadingRing from '@/components/LoadingRing';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Format AUD currency - Always use A$ prefix
  const formatAUD = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `A$${numAmount.toFixed(2)}`;
  };

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

  useEffect(() => {
    if (sessionId) {
      fetchPaymentStatus();
      return;
    }
    const paymentIdParam = searchParams.get('payment_id');
    if (paymentIdParam) {
      let cancelled = false;
      (async () => {
        try {
          const res = await api.payments.confirmPayment(paymentIdParam);
          const g = res.data?.majorDrawLandingGuest;
          if (!cancelled && g) {
            try {
              sessionStorage.setItem('unicash_mdl_guest_success', JSON.stringify(g));
            } catch {
              /* ignore */
            }
            router.replace('/win/purchase-success');
            return;
          }
        } catch (e) {
          console.error('confirmPayment after redirect:', e);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, searchParams, router]);

  if (loading) {
    return <LoadingRing fullscreen label="Verifying payment" />;
  }

  /* L1 (2026-05-19) — neither session_id nor payment_id resolved a real
     payment row. Previously the page sat in `loading=false` and rendered
     a fake "Payment Successful!" card with no data. Now show a calm
     "we can't find this checkout" UI with CTAs back to dashboard or home
     so the user is never stranded staring at the wrong success message. */
  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl ring-1 ring-[#E0DAFF] shadow-sm p-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F4F1FB] ring-1 ring-[#E0DAFF] flex items-center justify-center text-[#6356E5]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-[#0F1222]">
              We can&apos;t find this checkout
            </h1>
            <p className="mt-2 text-[13.5px] sm:text-[14.5px] leading-relaxed text-[#4B5563]">
              This page expects a Stripe session reference and we didn&apos;t
              receive one. If you just completed a checkout, your receipt
              will arrive by email shortly. Otherwise head back to your
              account or browse Bonus Draws.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
              >
                Go to My Account
              </Link>
              <Link
                href="/giveaways"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] hover:border-[#6356E5] hover:text-[#6356E5]"
              >
                View Bonus Draws
              </Link>
            </div>
          </div>
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
            Thank you for your purchase. Your account has been created and your Points have been added.
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
                  <span className="font-medium">{formatAUD(parseFloat(payment.amount?.toString() || '0'))}</span>
                </div>
                {/*
                  FE-01 — UI label is "Points Granted". `payment.creditsGranted`
                  is the legacy backend field name (rename deferred to
                  BE-29 post-launch); we read it but render with the
                  brand-correct label.
                */}
                {payment.creditsGranted ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Granted:</span>
                    <span className="font-medium">{payment.creditsGranted}</span>
                  </div>
                ) : null}
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
    <Suspense fallback={<LoadingRing fullscreen label="Loading" />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

