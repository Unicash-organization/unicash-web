'use client';

/**
 * UNICASH — Account · Redemption receipt
 *
 * Per-redemption receipt the member lands on from:
 *   - Success pane of the checkout flow
 *   - History list row tap
 *   - Email "View receipt" CTA
 *
 * Surface is status-aware:
 *   - completed   → full code reveal block + wallet buttons + resend email
 *   - on_hold     → amber notice + "Points held" panel + track-history CTA
 *   - processing  → animated pending state
 *   - failed      → failure summary + ledger ribbon
 *   - refunded    → muted note + ledger ribbon
 *
 * Mock-data fallback: when the URL id doesn't match any seeded
 * redemption (e.g. the random id minted in the G3 success path), we
 * render the most recent completed redemption so the demo flow still
 * lands on a believable receipt. The real implementation will return
 * 404 for unknown ids — search for `MOCK FALLBACK` to find the gate.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Mail,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { StatusChip } from '@/components/gift-cards';
import {
  MOCK_REDEMPTIONS,
  getRedemption,
} from '@/lib/gift-cards/mock-data';
import api from '@/lib/api';
import {
  formatAud,
  formatDateTime,
  formatPts,
  maskCode,
} from '@/lib/gift-cards/format';
import type { Redemption, RedemptionFailureReason } from '@/lib/gift-cards/types';

type ViewState = 'ready' | 'loading' | 'not_found';

export default function RedemptionReceiptPage() {
  const params = useParams();
  const id = decodeURIComponent((params?.id as string) || '');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // GP4 — try the real API first; fall back to mock seed so the
  // post-G3 demo path still lands on a receipt.
  const [redemption, setRedemption] = useState<Redemption | undefined>(getRedemption(id));
  const fallback = useMemo(
    () => [...MOCK_REDEMPTIONS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0],
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.redemptions.getById(id);
        if (!cancelled && res.data) {
          setRedemption(res.data as Redemption);
          setViewState('ready');
        } else if (!cancelled) {
          setRedemption(getRedemption(id) ?? fallback);
          setViewState('ready');
        }
      } catch {
        if (!cancelled) {
          setRedemption(getRedemption(id) ?? fallback);
          setViewState('ready');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fallback]);

  if (viewState === 'loading') {
    return <ReceiptSkeleton />;
  }

  if (!redemption || viewState === 'not_found') {
    return (
      <div className="bg-[#FBFAFF] min-h-screen">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F1222]">
            Receipt not found
          </h1>
          <p className="mt-2 text-[#667085]">
            We couldn&apos;t find a redemption with that id. It may have been removed or you might be on the wrong account.
          </p>
          <Link
            href="/account/redemptions"
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
          >
            Back to redemption history
          </Link>
        </div>
      </div>
    );
  }

  const totalAud = redemption.valueAud * redemption.quantity;
  const isCompleted = redemption.status === 'completed';
  /* 2026-05-20 — "on hold" UI bucket covers all Prezzee PENDING_* states
     plus prezzee_pending (we're polling) and submitting (brief). */
  const isOnHold =
    redemption.status === 'prezzee_pending' ||
    redemption.status === 'pending_payment' ||
    redemption.status === 'pending_fulfillment' ||
    redemption.status === 'pending_delivery';
  const isProcessing =
    redemption.status === 'points_held' || redemption.status === 'submitting';
  const isFailedOrRefunded =
    redemption.status === 'failed' || redemption.status === 'refunded';
  const isBounce = redemption.status === 'pending_delivery';

  /* Real backend call (replaces legacy 900ms mock) — calls Prezzee
     Regenerate Gift PIN via our /redemptions/:id/resend-email endpoint. */
  const handleResendEmail = async () => {
    if (emailSending) return;
    setEmailSending(true);
    setEmailSent(false);
    try {
      await api.redemptions.resendEmail(redemption.id);
      setEmailSent(true);
      window.setTimeout(() => setEmailSent(false), 3200);
    } catch {
      /* swallow — UI returns to idle; user can retry */
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="bg-[#FBFAFF] min-h-screen">
      {/* Back link */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-6">
        <Link
          href="/account/redemptions"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#5648D8] hover:text-[#6356E5]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to redemption history
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        {/* Header card */}
        <section className="rounded-3xl border border-[#E7E9F2] bg-white shadow-[0_1px_2px_rgba(15,18,34,0.04)] overflow-hidden">
          <div
            className="h-2"
            style={{
              background:
                isCompleted
                  ? 'linear-gradient(90deg, #FFE2B0, #FFC85D)'
                  : isOnHold
                  ? '#F59E0B'
                  : isFailedOrRefunded
                  ? '#EF4444'
                  : '#6356E5',
            }}
          />
          <div className="p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={redemption.status} />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9097A8]">
                {redemption.id}
              </span>
            </div>
            <h1 className="text-[22px] sm:text-[28px] font-extrabold tracking-tight leading-[1.15] text-[#0F1222]">
              {isCompleted
                ? 'Your gift card '
                : isOnHold
                ? 'Redemption on '
                : isProcessing
                ? 'Redemption '
                : 'Redemption '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
                {isCompleted
                  ? 'receipt'
                  : isOnHold
                  ? 'hold'
                  : isProcessing
                  ? 'in progress'
                  : redemption.status === 'failed'
                  ? 'failed'
                  : 'refunded'}
              </span>
            </h1>
            <p className="text-[14px] text-[#667085]">
              {isCompleted
                ? `Completed ${formatDateTime(redemption.completedAt || redemption.createdAt)}.`
                : isOnHold
                ? "We're confirming a few details — usually under 30 minutes."
                : isProcessing
                ? "Hang tight — we're securing your code with the provider."
                : `Closed ${formatDateTime(redemption.refundedAt || redemption.createdAt)}.`}
            </p>
          </div>
        </section>

        {/* Order summary */}
        <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5">
          <h2 className="text-[16px] font-extrabold tracking-tight text-[#0F1222]">Order summary</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <SummaryRow label="Brand" value={redemption.brandName} />
            <SummaryRow label="Denomination" value={formatAud(redemption.valueAud)} />
            <SummaryRow label="Quantity" value={String(redemption.quantity)} />
            <SummaryRow label="Total face value" value={formatAud(totalAud)} />
            <SummaryRow label="Points debited" value={formatPts(redemption.pointsDebited)} />
            <SummaryRow label="Channel" value={redemption.channel.toUpperCase()} />
            <SummaryRow label="Created" value={formatDateTime(redemption.createdAt)} />
            {redemption.completedAt && (
              <SummaryRow label="Completed" value={formatDateTime(redemption.completedAt)} />
            )}
            {redemption.refundedAt && (
              <SummaryRow label="Refunded" value={formatDateTime(redemption.refundedAt)} />
            )}
          </div>
        </section>

        {/* Delivery telemetry — replaces the legacy "Your codes" block.
            Prezzee emails the gift directly to recipientEmail; UNICASH
            shows the delivery state instead of the gift code itself. */}
        {(isCompleted || isBounce) && (
          <section className="rounded-3xl border border-[#FFC85D]/55 bg-gradient-to-br from-[#FFF6DA] to-[#FFE2B0] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9C5410]">
              <Mail className="w-3.5 h-3.5" />
              Sent to
            </div>
            <p className="break-all text-[16px] sm:text-[18px] font-extrabold tracking-tight text-[#7C5A00]">
              {redemption.recipientEmail || redemption.memberEmail}
            </p>

            {/* Status pills — surfaces what we know from Prezzee polling. */}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
              <DeliveryPill
                active={
                  redemption.emailDeliveryStatus === 'sent' ||
                  redemption.emailDeliveryStatus === 'delivered' ||
                  !!redemption.recipientClickedAt
                }
                color="purple"
              >
                Email sent
              </DeliveryPill>
              <DeliveryPill
                active={redemption.emailDeliveryStatus === 'delivered' || !!redemption.recipientClickedAt}
                color="blue"
              >
                Delivered
              </DeliveryPill>
              <DeliveryPill
                active={!!redemption.recipientClickedAt || redemption.voucherUrlStatus === 'clicked'}
                color="green"
              >
                Opened
              </DeliveryPill>
              {(redemption.emailDeliveryStatus === 'bounced' ||
                redemption.emailDeliveryStatus === 'failed' ||
                isBounce) && (
                <DeliveryPill active color="amber">
                  Delivery issue
                </DeliveryPill>
              )}
            </div>

            <p className="text-[12px] leading-relaxed text-[#9C5410]/85">
              {isBounce
                ? "Prezzee couldn't deliver to this address. Update the email or try resending below."
                : redemption.recipientClickedAt
                  ? 'Recipient has opened the gift link.'
                  : redemption.emailDeliveryStatus === 'delivered'
                    ? 'Email delivered. Recipient hasn\'t opened it yet — check their inbox + spam folder.'
                    : `${redemption.brandName} gift email is being delivered by Prezzee. Status updates automatically as it arrives.`}
            </p>
          </section>
        )}

        {isOnHold && (
          <section className="rounded-3xl border border-[#FCD34D] bg-[#FFFBEB] p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#B45309]">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold tracking-tight text-[#0F1222]">
                  Points held
                </h3>
                <div className="mt-1 text-[20px] font-extrabold tabular-nums text-[#0F1222]">
                  {formatPts(redemption.pointsDebited)}
                </div>
                <p className="mt-2 text-[12px] text-[#B45309]">
                  We&apos;ll either complete this redemption or return these Points in full once the review finishes. You&apos;ll get an email the moment it&apos;s done.
                </p>
              </div>
            </div>
          </section>
        )}

        {isProcessing && (
          <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F4FF] text-[#6356E5]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </span>
            <div>
              <div className="text-[15px] font-extrabold tracking-tight text-[#0F1222]">
                Securing your code with the provider
              </div>
              <p className="text-[12px] text-[#667085]">
                Usually under 10 seconds. We&apos;ll email you the moment it&apos;s ready.
              </p>
            </div>
          </section>
        )}

        {isFailedOrRefunded && (
          <FailureSummary
            reason={redemption.failureReason}
            pointsReturned={
              redemption.status === 'refunded' ? redemption.pointsDebited : 0
            }
          />
        )}

        {/* Actions row */}
        <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5">
          <h2 className="text-[16px] font-extrabold tracking-tight text-[#0F1222]">Actions</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={emailSending}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {emailSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : emailSent ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              {emailSending
                ? 'Sending…'
                : emailSent
                ? 'Gift email sent'
                : 'Resend gift email'}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-4 py-2.5 text-[13px] font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <Link
              href={`/contact?redemption=${encodeURIComponent(redemption.id)}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-4 py-2.5 text-[13px] font-semibold"
            >
              <ReceiptText className="w-3.5 h-3.5" />
              Contact support
            </Link>
          </div>
        </section>

        {/* Support row — always present for trust */}
        <section className="rounded-3xl bg-[#1A1432] text-white p-5 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background:
                'radial-gradient(60% 50% at 80% 10%, rgba(139,123,255,0.32) 0%, rgba(26,20,50,0) 70%), radial-gradient(50% 40% at 10% 90%, rgba(255,200,93,0.18) 0%, rgba(26,20,50,0) 70%)',
            }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[15px] font-extrabold tracking-tight">Need help with this redemption?</div>
              <p className="mt-0.5 text-[13px] text-[#C9C2E8]">
                Quote redemption {redemption.id} and we&apos;ll have it sorted fast.
              </p>
            </div>
            <Link
              href={`/contact?redemption=${encodeURIComponent(redemption.id)}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-[#1A1432] hover:bg-[#FFE2B0] px-4 py-2 text-[13px] font-bold transition-colors"
            >
              Contact support
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Subcomponents
   ────────────────────────────────────────────────────────────────── */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#F1ECFB] pb-2 last:border-b-0 last:pb-0">
      <span className="text-[#667085]">{label}</span>
      <span className="font-semibold text-[#0F1222] text-right">{value}</span>
    </div>
  );
}

function FailureSummary({
  reason,
  pointsReturned,
}: {
  reason: RedemptionFailureReason | null;
  pointsReturned: number;
}) {
  const refunded = pointsReturned > 0;
  const config = reason ? FAILURE_LABELS[reason] : { label: 'Closed', icon: XCircle };
  const Icon = config.icon;
  return (
    <section className="rounded-3xl border border-[#FECACA] bg-[#FEF2F2] p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#B91C1C]">
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <h3 className="text-[15px] font-extrabold tracking-tight text-[#0F1222]">
            {config.label}
          </h3>
          <p className="mt-1 text-[12px] text-[#B91C1C]">
            {refunded
              ? `${formatPts(pointsReturned)} were refunded to your balance.`
              : 'Your Points were not debited.'}
          </p>
        </div>
      </div>
    </section>
  );
}

const FAILURE_LABELS: Record<RedemptionFailureReason, { label: string; icon: typeof XCircle }> = {
  out_of_stock: { label: 'Denomination sold out', icon: XCircle },
  provider_error: { label: 'Provider error', icon: RefreshCw },
  network_failure: { label: 'Network failure', icon: XCircle },
  fraud_rejected: { label: "Couldn't be completed", icon: ShieldAlert },
  cap_exceeded: { label: 'Monthly cap reached', icon: XCircle },
  invalid_request: { label: 'Request rejected', icon: XCircle },
};

/* Delivery telemetry pill — active = solid color, inactive = ghost.
   2026-05-20 — added for Prezzee-delivers status visualisation. */
function DeliveryPill({
  active,
  color,
  children,
}: {
  active: boolean;
  color: 'purple' | 'blue' | 'green' | 'amber';
  children: React.ReactNode;
}) {
  const palette = {
    purple: { active: 'bg-[#6356E5] text-white', ghost: 'bg-white text-[#9097A8] border border-[#E0DAFF]' },
    blue: { active: 'bg-[#2563EB] text-white', ghost: 'bg-white text-[#9097A8] border border-[#E0DAFF]' },
    green: { active: 'bg-[#10B981] text-white', ghost: 'bg-white text-[#9097A8] border border-[#E0DAFF]' },
    amber: { active: 'bg-[#F59E0B] text-[#1A1432]', ghost: 'bg-white text-[#9097A8] border border-[#E0DAFF]' },
  }[color];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${active ? palette.active : palette.ghost}`}
    >
      {children}
    </span>
  );
}

function ReceiptSkeleton() {
  return (
    <div className="bg-[#FBFAFF] min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-4">
        <div className="h-8 w-32 rounded-full bg-[#F4F1FB] animate-pulse" />
        <div className="h-40 rounded-3xl bg-[#F4F1FB] animate-pulse" />
        <div className="h-32 rounded-3xl bg-[#F4F1FB] animate-pulse" />
        <div className="h-48 rounded-3xl bg-[#F4F1FB] animate-pulse" />
      </div>
    </div>
  );
}
