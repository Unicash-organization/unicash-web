'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import LoadingRing from '@/components/LoadingRing';

/* -----------------------------------------------------------------------
   Inline icons
----------------------------------------------------------------------- */
const Icon = {
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  Bolt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m13 2-3 8h6l-3 12-2-8H4l9-12Z" />
    </svg>
  ),
  Gift: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    </svg>
  ),
  Receipt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   V4 catalog fallback — derive plan/booster name from amount or credits
   when backend metadata is missing. Keeps Purchase History rows specific
   ("UniMax", "Booster Pulse") instead of generic ("Membership", "Point Booster").
----------------------------------------------------------------------- */
const V4_PLAN_BY_PRICE: Record<string, string> = {
  '19.99': 'UniOne',
  '49.99': 'UniPlus',
  '99.99': 'UniMax',
};
const V4_BOOSTER_CATALOG: { name: string; price: number; points: number }[] = [
  { name: 'Booster Spark', price: 4.99, points: 250 },
  { name: 'Booster Pulse', price: 19.99, points: 1200 },
  { name: 'Booster Surge', price: 29.99, points: 2000 },
];

function resolvePlanName(payment: any): string {
  // Priority 1: backend-hydrated relation
  if (payment.plan?.name) return payment.plan.name;
  // Priority 2: metadata.planName
  if (payment.metadata?.planName) return payment.metadata.planName;
  // Priority 3: V4 catalog by amount
  const amount = parseFloat(payment.amount?.toString() || '0');
  const matched = V4_PLAN_BY_PRICE[amount.toFixed(2)];
  if (matched) return matched;
  // Fallback
  return 'Membership';
}

function resolveBoosterName(payment: any): string {
  // Priority 1: backend-hydrated relation
  if (payment.boostPack?.name) return payment.boostPack.name;
  // Priority 2: metadata.packName
  if (payment.metadata?.packName) return payment.metadata.packName;
  // Priority 3: V4 catalog by amount or credits
  const amount = parseFloat(payment.amount?.toString() || '0');
  const credits = Number(payment.creditsGranted || 0);
  const matched = V4_BOOSTER_CATALOG.find(
    (b) => Math.abs(b.price - amount) < 0.01 || b.points === credits,
  );
  if (matched) return matched.name;
  // Fallback
  return 'Point Booster';
}

/* -----------------------------------------------------------------------
   Status pill mapping
----------------------------------------------------------------------- */
const STATUS_PILL: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  succeeded: { label: 'Paid',     bg: 'bg-[#ECFDF5]', text: 'text-[#10B981]', ring: 'ring-[#A7F3D0]' },
  pending:   { label: 'Pending',  bg: 'bg-[#FEF3C7]', text: 'text-[#9C5410]', ring: 'ring-[#FFC85D]/40' },
  failed:    { label: 'Failed',   bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', ring: 'ring-[#FCA5A5]' },
  canceled:  { label: 'Cancelled',bg: 'bg-[#F4F1FB]', text: 'text-[#667085]', ring: 'ring-[#E7E9F2]' },
  refunded:  { label: 'Refunded', bg: 'bg-[#F4F1FB]', text: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]' },
};

export default function PurchasesPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPayments = async () => {
    try {
      const res = await api.payments.getPaymentsByUserId(user?.id || '');
      setPayments(res.data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };

  const formatCurrency = (amount: number | string, currency: string = 'AUD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    if (currency === 'AUD' || !currency) return `A$${numAmount.toFixed(2)}`;
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(numAmount);
  };

  /* -----------------------------------------------------------------------
     Map payment row → display config (icon + title + subtitle + tone)
  ----------------------------------------------------------------------- */
  const describePayment = (payment: any): {
    icon: React.FC<{ className?: string }>;
    title: string;
    subtitle: string;
    iconBg: string; iconText: string;
  } => {
    if (payment.paymentType === 'membership') {
      const planName = resolvePlanName(payment);
      const isRenewal = !!payment.metadata?.isRenewal;
      return {
        icon: Icon.Crown,
        title: `${planName} Membership`,
        subtitle: isRenewal ? 'Monthly renewal' : 'Initial subscription',
        iconBg: 'bg-[#FFF6DA] ring-[#FFC85D]/40',
        iconText: 'text-[#C49A2C]',
      };
    }
    if (payment.metadata?.majorDrawLanding === true) {
      const snap = payment.metadata?.packageSnapshot || {};
      const n = payment.creditsGranted ?? snap.entryCount ?? payment.metadata?.entryCount ?? 0;
      const entryWord = n === 1 ? 'entry' : 'entries';
      // BE snapshots the draw title at purchase time on
      // payment.metadata.packageSnapshot.drawTitleAtPurchase, so the
      // member sees the actual draw they bought into (e.g. "Win an iPad
      // Pro") rather than the generic "One-time package" wrapper. If the
      // snapshot is missing (very old payments before the field landed),
      // fall back to the old copy so nothing renders as blank.
      const drawTitle = snap.drawTitleAtPurchase || snap.drawTitle || null;
      return {
        icon: Icon.Gift,
        title: drawTitle || 'Major Draw package',
        subtitle: `${n.toLocaleString()} ${entryWord}`,
        iconBg: 'bg-[#ECFDF5] ring-[#A7F3D0]',
        iconText: 'text-[#10B981]',
      };
    }
    // Point Booster
    const packName = resolveBoosterName(payment);
    const points = Number(payment.creditsGranted) || 0;
    return {
      icon: Icon.Bolt,
      title: packName,
      subtitle: points > 0 ? `+${points.toLocaleString()} Points` : 'One-time top-up',
      iconBg: 'bg-[#F4F1FB] ring-[#E0DAFF]',
      iconText: 'text-[#6356E5]',
    };
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header — simple H1, no eyebrow (sidebar active state is breadcrumb) */}
      <header>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">Purchase History</h1>
      </header>

      {loading ? (
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-6">
          <ul className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 py-1">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#F4F1FB]" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-4 w-44 max-w-full animate-pulse rounded bg-[#F4F1FB]" />
                  <div className="h-3 w-28 animate-pulse rounded bg-[#F4F1FB]" />
                </div>
                <div className="h-5 w-20 shrink-0 animate-pulse rounded bg-[#F4F1FB]" />
              </li>
            ))}
          </ul>
        </article>
      ) : payments.length === 0 ? (
        <article className="overflow-hidden rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-10 text-center sm:py-12">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Receipt className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[15px] font-extrabold tracking-tight text-[#0F1222] sm:text-[16px]">No purchases yet</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563]">
            Your Membership payments and Point Booster purchases will appear here.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/#membership-plans"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 text-[12.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
            >
              View Membership plans
            </Link>
            <Link
              href="/boost-packs"
              className="inline-flex h-10 items-center rounded-full border border-[#E0DAFF] bg-white px-4 text-[12.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5]"
            >
              Buy Point Booster
            </Link>
          </div>
        </article>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-2.5 sm:hidden">
            {payments.map((payment: any) => {
              const cfg = describePayment(payment);
              const ItemIcon = cfg.icon;
              const status = (payment.status || '').toLowerCase();
              const pill = STATUS_PILL[status] || STATUS_PILL.succeeded;
              return (
                <li key={payment.id}>
                  <article className="rounded-2xl border border-[#E7E9F2] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,18,34,.04)]">
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${cfg.iconBg}`}>
                        <ItemIcon className={`h-4 w-4 ${cfg.iconText}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">{cfg.title}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-[#667085]">{cfg.subtitle}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="whitespace-nowrap text-[14px] font-extrabold tracking-tight text-[#0F1222] tabular-nums">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EFEDF5] pt-2.5">
                      <p className="text-[11px] text-[#667085]">{formatDate(payment.createdAt)}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${pill.bg} ${pill.text} ${pill.ring}`}>
                        {pill.label}
                      </span>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <article className="hidden overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#EFEDF5]">
                <thead className="bg-[#FBFAFF]">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Date</th>
                    <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Item</th>
                    <th className="px-5 py-3 text-right text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Amount</th>
                    <th className="px-5 py-3 text-right text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEDF5] bg-white">
                  {payments.map((payment: any) => {
                    const cfg = describePayment(payment);
                    const ItemIcon = cfg.icon;
                    const status = (payment.status || '').toLowerCase();
                    const pill = STATUS_PILL[status] || STATUS_PILL.succeeded;
                    return (
                      <tr key={payment.id} className="transition-colors hover:bg-[#FBFAFF]">
                        <td className="whitespace-nowrap px-5 py-3.5 text-[12.5px] text-[#667085]">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${cfg.iconBg}`}>
                              <ItemIcon className={`h-4 w-4 ${cfg.iconText}`} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-extrabold tracking-tight text-[#0F1222]">{cfg.title}</p>
                              <p className="mt-0.5 truncate text-[11.5px] text-[#667085]">{cfg.subtitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right text-[13px] font-extrabold text-[#0F1222] tabular-nums">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ring-1 ${pill.bg} ${pill.text} ${pill.ring}`}>
                            {pill.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </div>
  );
}
