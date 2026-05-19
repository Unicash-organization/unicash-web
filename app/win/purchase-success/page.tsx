'use client';

/* ==========================================================================
   /win/purchase-success — guest Major Draw landing checkout receipt
   --------------------------------------------------------------------------
   2026-05-19 v2 redesign — align with /thank-you major_draw_entry layout:
     • light hero card (green check + purple eyebrow + dark headline w/ gold
       accent) replaces the dark #1A1432 hero
     • dedicated purchase summary card with package name, one-time amount,
       and the gold ENTRIES ADDED block — mirrors the logged-in /thank-you
     • bullet checklist (Entries locked / One-time / Winners published)
     • guest-only sections preserved: provisional password, email + order
       reference rows, sign-in CTA
   Data flow PRESERVED — sessionStorage payload, missing fallback, copy-to-
   clipboard. Only visual hierarchy + copy structure changed.
   ========================================================================== */

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
  /** Optional — set by BE when a named package was purchased (e.g. "PLATINUM") */
  packageName?: string | null;
};

const STORAGE_KEY = 'unicash_mdl_guest_success';

/* Inline icons — minimal, match the v4 set used elsewhere. */
const Icon = {
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Ticket: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z" />
      <path d="M9 7v10" strokeDasharray="2 2" />
    </svg>
  ),
  Copy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Shield: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
    </svg>
  ),
};

const formatAUD = (amount: number, currency: string) =>
  currency?.toUpperCase() === 'AUD'
    ? `A$${Number(amount).toFixed(2)}`
    : `${Number(amount).toFixed(2)} ${currency || ''}`.trim();

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

  /* ─── Missing payload fallback ─── */
  if (missing || !data) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white">
        <BackgroundMesh />
        <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-12 text-center sm:px-6">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF] shadow-sm">
            <Icon.Ticket className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">
            We couldn&apos;t load your receipt
          </h1>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-[#4B5563] sm:text-[14.5px]">
            Open this page from the confirmation that followed your checkout,
            or sign in to see your entries.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
            >
              Sign in
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] hover:border-[#6356E5] hover:text-[#6356E5]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const loginHref = `/login?email=${encodeURIComponent(data.email)}`;
  const amountLabel = formatAUD(data.amount, data.currency);
  const orderNo = data.orderNo?.trim() || data.paymentId;
  const entries = Number(data.entryCount) || 0;
  const entryWord = entries === 1 ? 'entry' : 'entries';

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white">
      <BackgroundMesh />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        {/* ============================================================
            SUCCESS HERO CARD — light, mirrors /thank-you
        ============================================================ */}
        <article className="relative overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white px-5 py-7 text-center shadow-[0_18px_50px_-22px_rgba(99,86,229,0.28),0_4px_14px_-8px_rgba(15,18,34,.06)] sm:px-10 sm:py-10 sm:shadow-[0_30px_80px_-30px_rgba(99,86,229,0.30),0_8px_24px_-12px_rgba(15,18,34,.06)]">
          {/* Soft glow halo behind icon */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-4 -z-0 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#6356E5]/15 via-[#8B7BFF]/10 to-[#FFE2B0]/15 blur-3xl sm:top-6 sm:h-40 sm:w-40" />

          {/* Success check icon */}
          <div className="relative z-20 mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10B981] to-[#34D399] shadow-[0_14px_30px_-8px_rgba(16,185,129,0.50)] ring-4 ring-white sm:mb-4 sm:h-16 sm:w-16">
            <Icon.Check className="h-7 w-7 text-white sm:h-8 sm:w-8" />
          </div>

          {/* Eyebrow */}
          <p className="relative z-20 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5] sm:text-[11px] sm:tracking-[0.18em]">
            ✨ Major Draw Entries Added
          </p>

          {/* Headline */}
          <h1 className="relative z-20 mt-2 text-[23px] font-extrabold leading-[1.12] tracking-tight text-[#0F1222] sm:mt-2.5 sm:text-[32px] md:text-[36px]">
            You&rsquo;re in the{' '}
            <span className="bg-gradient-to-r from-[#FFC85D] to-[#F59E0B] bg-clip-text text-transparent">
              Major Draw.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="relative z-20 mx-auto mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-[#4B5563] sm:mt-3 sm:text-[15.5px]">
            Your entries are locked into the Major Draw pool. Watch the draw
            close on the live page — Winners are published for transparency.
          </p>
        </article>

        {/* ============================================================
            PURCHASE SUMMARY CARD — package + gold entries + checklist
        ============================================================ */}
        <article className="mt-4 rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:mt-5 sm:p-7">
          {/* Hero row — drawTitle + amount */}
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
                Your Major Draw entries
              </p>
              <h2 className="mt-1 text-[20px] font-extrabold leading-[1.2] tracking-tight text-[#0F1222] sm:text-[24px]">
                {data.drawTitle || 'Major Draw entry package'}
              </h2>
              {data.packageName && (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#4B5563] sm:text-[13px]">
                  Package: <span className="font-semibold text-[#0F1222]">{data.packageName}</span>
                </p>
              )}
            </div>
            <p className="shrink-0 whitespace-nowrap text-right text-[16px] font-extrabold tracking-tight text-[#0F1222] sm:text-[18px]">
              {amountLabel}
              <span className="ml-0.5 text-[11.5px] font-semibold text-[#667085] sm:text-[12px]">
                one-time
              </span>
            </p>
          </div>

          {/* Big gold entries block */}
          {entries > 0 && (
            <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF6DA] to-[#FFE2B0] p-4 ring-1 ring-[#FFC85D]/55 sm:mt-5 sm:p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#9C5410] sm:text-[11px]">
                Entries added
              </p>
              <p className="mt-1 text-[34px] font-extrabold leading-none tracking-tight text-[#7C5A00] tabular-nums sm:text-[40px]">
                {entries.toLocaleString()}
                <span className="ml-2 text-[13px] font-semibold text-[#9C5410] sm:text-[14px]">
                  {entryWord}
                </span>
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#9C5410]/85">
                Locked into the Major Draw pool. Each entry is a single chance —
                Winners are drawn when the Major Draw closes.
              </p>
            </div>
          )}

          {/* Inclusions checklist */}
          <ul className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-[#4B5563] sm:mt-5 sm:text-[13.5px]">
            <li className="flex items-start gap-2">
              <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
              <span>Entries locked into the Major Draw pool</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
              <span>One-time purchase · No auto-renew</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
              <span>Winners published for transparency</span>
            </li>
          </ul>
        </article>

        {/* ============================================================
            ACCOUNT & RECEIPT — guest-specific details + temp password
        ============================================================ */}
        <article className="mt-4 rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:mt-5 sm:p-7">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
            Account &amp; receipt
          </p>

          {/* Detail rows */}
          <dl className="mt-3 divide-y divide-[#EFEDF5] rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] px-4 sm:px-5">
            <DetailRow label="Email" value={data.email} valueClass="break-all" />
            <DetailRow label="Amount paid" value={amountLabel} />
            <DetailRow
              label="Order number"
              value={orderNo}
              valueClass="font-mono text-[13px]"
              subValue={
                data.orderNo?.trim()
                  ? `Payment reference: ${data.paymentId}`
                  : undefined
              }
            />
          </dl>

          {/* Provisional password OR sign-in nudge */}
          {data.provisionalPassword ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#FFC85D]/55 bg-gradient-to-br from-[#FFF6DA] to-[#FFE2B0]/80 p-4 sm:mt-5 sm:p-5">
              <p className="text-[13px] font-extrabold text-[#7C5A00]">
                Your temporary password
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#9C5410]/90">
                We created an account for you. Use this password to sign in,
                then you&rsquo;ll be prompted to set a new one.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  type="text"
                  readOnly
                  value={data.provisionalPassword}
                  aria-label="Temporary password"
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 rounded-full border border-[#FFC85D]/60 bg-white px-4 py-2.5 font-mono text-[13px] text-[#0F1222] shadow-inner focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
                />
                <button
                  type="button"
                  onClick={() => copyPasswordToClipboard(data.provisionalPassword!)}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#7C5A00] ring-1 ring-[#FFC85D]/60 transition hover:bg-[#FFF6DA] active:scale-[0.98]"
                >
                  <Icon.Copy className="h-3.5 w-3.5" />
                  {passwordCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-[11.5px] text-[#9C5410]/85">
                Save it now — for security it won&apos;t be shown on this page
                again after you leave.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-[#E0DAFF] bg-[#F4F1FB] px-4 py-3 text-[12.5px] leading-relaxed text-[#0F1222] sm:mt-5">
              You already have an account with this email. Sign in with your
              existing password to see your new entries.
            </div>
          )}
        </article>

        {/* ============================================================
            CTAs — locked pill style
        ============================================================ */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Link
            href={loginHref}
            className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
          >
            Sign in to view entries
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] hover:border-[#6356E5] hover:text-[#6356E5]"
          >
            Back to home
          </Link>
        </div>

        {/* Trust line */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] font-semibold text-[#667085]">
          <span className="inline-flex items-center gap-1">
            <Icon.Shield className="h-3 w-3 text-[#6356E5]" />
            Entries locked in
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon.Check className="h-3 w-3 text-[#10B981]" />
            Winners published
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon.Shield className="h-3 w-3 text-[#9C5410]" />
            Transparent outcomes
          </span>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────── */

function DetailRow({
  label,
  value,
  valueClass = '',
  subValue,
}: {
  label: string;
  value: string;
  valueClass?: string;
  subValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#667085]">
        {label}
      </dt>
      <div className="text-right">
        <dd className={`text-[13px] font-semibold text-[#0F1222] sm:text-[13.5px] ${valueClass}`}>
          {value}
        </dd>
        {subValue && (
          <p className="mt-0.5 break-all font-mono text-[10.5px] text-[#A3A8BE]">{subValue}</p>
        )}
      </div>
    </div>
  );
}

function BackgroundMesh() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 left-[15%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/15 blur-[140px]" />
      <div className="absolute right-[-10%] top-1/4 h-[380px] w-[380px] rounded-full bg-[#FFE2B0]/14 blur-[120px]" />
      <div className="absolute left-[-12%] bottom-[-10%] h-[360px] w-[360px] rounded-full bg-[#6356E5]/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(rgba(99,86,229,0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
    </div>
  );
}

export default function MajorDrawPurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white flex items-center justify-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[#6356E5] border-t-transparent" />
        </div>
      }
    >
      <PurchaseSuccessContent />
    </Suspense>
  );
}
