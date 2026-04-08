'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

type GuestSuccessPayload = {
  entryCount: number;
  drawTitle: string;
  email: string;
  provisionalPassword: string | null;
  paymentId: string;
  /** Public order id (e.g. UNC482888), same as entry order numbers */
  orderNo?: string | null;
  amount: number;
  currency: string;
};

const STORAGE_KEY = 'unicash_mdl_guest_success';

function PurchaseSuccessContent() {
  const [data, setData] = useState<GuestSuccessPayload | null>(null);
  const [missing, setMissing] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const copyPasswordToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setPasswordCopied(true);
      window.setTimeout(() => setPasswordCopied(false), 2000);
      return;
    } catch {
      /* fallback */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setPasswordCopied(true);
      window.setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setMissing(true);
        return;
      }
      const parsed = JSON.parse(raw) as GuestSuccessPayload;
      if (!parsed?.paymentId || !parsed?.email) {
        setMissing(true);
        return;
      }
      setData(parsed);
    } catch {
      setMissing(true);
    }
  }, []);

  if (missing || !data) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-stone-900 mb-2">Unable to load receipt</h1>
          <p className="text-stone-600 text-sm mb-6">
            Open this page from the confirmation after your purchase, or sign in to see your entries.
          </p>
          <Link
            href="/login"
            className="inline-block w-full rounded-xl bg-[#7A3036] text-white font-semibold py-3 hover:opacity-95"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const loginHref = `/login?email=${encodeURIComponent(data.email)}`;
  const amountLabel =
    data.currency?.toUpperCase() === 'AUD'
      ? `$${Number(data.amount).toFixed(2)} AUD`
      : `${Number(data.amount).toFixed(2)} ${data.currency || ''}`.trim();

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="rounded-t-2xl bg-[#7A3036] text-white px-6 py-8 text-center">
          <p className="text-xs uppercase tracking-widest opacity-90 mb-2">Payment successful</p>
          <h1 className="text-2xl font-bold">Thank you for your purchase</h1>
          {data.drawTitle && (
            <p className="text-sm text-white/85 mt-3">{data.drawTitle}</p>
          )}
        </div>
        <div className="rounded-b-2xl border border-t-0 border-stone-200 bg-white px-6 py-8 shadow-lg space-y-6">
          <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-4 text-center">
            <p className="text-sm text-stone-600">Your entries</p>
            <p className="text-4xl font-bold text-orange-600 tabular-nums">{data.entryCount}</p>
            <p className="text-xs text-stone-500 mt-1">
              Entries are on your account for the email below. Sign in to view them.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <span className="text-stone-500">Email</span>
              <span className="text-right break-all">{data.email}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <span className="text-stone-500">Amount paid</span>
              <span>{amountLabel}</span>
            </div>
            <div className="border-b border-stone-100 pb-2 space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Order number</span>
                <span className="font-mono text-sm font-semibold text-stone-900 text-right break-all">
                  {data.orderNo?.trim() || data.paymentId}
                </span>
              </div>
              {data.orderNo?.trim() ? (
                <p className="text-xs text-stone-400 text-right font-mono break-all">
                  Payment reference: {data.paymentId}
                </p>
              ) : null}
            </div>
          </div>

          {data.provisionalPassword ? (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">Your temporary password</p>
              <p className="text-xs text-amber-800 mb-2">
                We created an account for you. Use this password to sign in, then you&apos;ll be asked to set a new one.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
                <input
                  type="text"
                  readOnly
                  value={data.provisionalPassword}
                  aria-label="Temporary password"
                  className="flex-1 min-w-0 rounded-lg bg-white px-3 py-2.5 text-sm font-mono text-stone-900 border border-amber-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  onClick={() => copyPasswordToClipboard(data.provisionalPassword!)}
                  className="shrink-0 rounded-lg border border-amber-300 bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-200 active:scale-[0.98] transition"
                >
                  {passwordCopied ? 'Copied!' : 'Copy to clipboard'}
                </button>
              </div>
              <p className="text-xs text-amber-800 mt-2">
                Save it now — for security it won&apos;t be shown again on this page after you leave.
              </p>
            </div>
          ) : (
            <p className="text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
              You already have an account with this email. Sign in with your existing password to see your new entries.
            </p>
          )}

          <Link
            href={loginHref}
            className="flex w-full items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 uppercase tracking-wide text-sm"
          >
            Go to login
          </Link>
          <Link href="/" className="block text-center text-sm text-stone-600 hover:text-stone-900">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MajorDrawPurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[#7A3036] border-t-transparent" />
        </div>
      }
    >
      <PurchaseSuccessContent />
    </Suspense>
  );
}
