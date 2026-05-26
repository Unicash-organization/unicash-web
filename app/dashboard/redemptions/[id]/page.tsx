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
  Clock,
  Loader2,
  Mail,
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
} from '@/lib/gift-cards/format';
import type { Redemption, RedemptionFailureReason } from '@/lib/gift-cards/types';

type ViewState = 'ready' | 'loading' | 'not_found';

export default function RedemptionReceiptPage() {
  const params = useParams();
  const id = decodeURIComponent((params?.id as string) || '');
  const [viewState, setViewState] = useState<ViewState>('loading');

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

  /* 2026-05-26 — Source-of-truth polling. The modal no longer holds
     the member while async work runs; this page is where they watch
     state evolve from `prezzee_pending` → `completed` → email
     `sent` → `delivered`. Poll every 5 s until fully done.
       - Terminal statuses (failed / refunded / cancelled) stop polling.
       - For `completed`, keep polling until emailDeliveryStatus is
         a terminal delivery state (delivered / bounced / failed).
     Cancelled cleanly on unmount or when id changes. */
  useEffect(() => {
    const status = redemption?.status;
    if (!status) return;
    const deliveryDone =
      redemption?.emailDeliveryStatus === 'delivered' ||
      redemption?.emailDeliveryStatus === 'bounced' ||
      redemption?.emailDeliveryStatus === 'failed';
    const fullyDone =
      status === 'failed' ||
      status === 'refunded' ||
      status === 'cancelled' ||
      (status === 'completed' && deliveryDone);
    if (fullyDone) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await api.redemptions.getById(id);
        if (!cancelled && res.data) {
          setRedemption(res.data as Redemption);
        }
      } catch {
        /* Network blip — swallow, next tick will retry. */
      }
    };
    /* 3s cadence pairs with backend hot-poll (every 15s) so members
       see status flips within 0-3s of the DB write. We stop polling
       entirely once status is terminal — see fullyDone above. */
    const intervalId = window.setInterval(tick, 3_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id, redemption?.status, redemption?.emailDeliveryStatus]);

  if (viewState === 'loading') {
    return <ReceiptSkeleton />;
  }

  if (!redemption || viewState === 'not_found') {
    return (
      <div className="space-y-5 sm:space-y-6">
        <article className="rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-14 text-center">
          <h1 className="text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[24px]">
            Receipt not found
          </h1>
          <p className="mt-2 max-w-md mx-auto text-[13.5px] text-[#667085]">
            We couldn&apos;t find a redemption with that id. It may have been removed or you might be on the wrong account.
          </p>
          <Link
            href="/dashboard/redemptions"
            className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[13.5px] font-bold"
          >
            Back to Gift cards
          </Link>
        </article>
      </div>
    );
  }

  const isCompleted = redemption.status === 'completed';
  /* 2026-05-26 — Re-bucketed.
     • Processing = normal in-flight (Prezzee just returned PROCESSING,
       points have been held, or we're submitting). Member-friendly,
       not scary.
     • On hold = pending_payment / pending_fulfillment — Prezzee
       flagged something upstream and we (or admin) need to act.
     • Bounce = pending_delivery — gift email could not be delivered. */
  const isProcessing =
    redemption.status === 'points_held' ||
    redemption.status === 'submitting' ||
    redemption.status === 'prezzee_pending';
  const isOnHold =
    redemption.status === 'pending_payment' ||
    redemption.status === 'pending_fulfillment';
  const isBounce = redemption.status === 'pending_delivery';
  const isFailedOrRefunded =
    redemption.status === 'failed' || redemption.status === 'refunded';
  const isCancelled = redemption.status === 'cancelled';

  /* Member-friendly brand label — Prezzee's catalog often includes a
     " - digital" suffix that adds noise (e.g. "Apple Gift Card - digital"). */
  const brandLabel = redemption.brandName.replace(/\s*[-–]\s*digital\s*$/i, '');

  /* 2026-05-26 — Smart delivery copy keyed on Prezzee email telemetry.
     Static "is being delivered" copy felt wrong once status flipped to
     completed but emailDeliveryStatus was already 'delivered'. */
  const deliveryCopy = (() => {
    if (isBounce) {
      return "Email couldn't be delivered. Update the recipient address or ask support to resend.";
    }
    const s = redemption.emailDeliveryStatus;
    if (s === 'bounced' || s === 'failed') {
      return "Email couldn't be delivered. Contact support to resend.";
    }
    if (redemption.recipientClickedAt || redemption.voucherUrlStatus === 'clicked') {
      return 'Recipient has opened the gift link.';
    }
    if (s === 'delivered') {
      return 'Email delivered. Waiting for the recipient to open it.';
    }
    if (s === 'sent') {
      return 'Email sent. Ask the recipient to check inbox and spam.';
    }
    return `Prezzee is delivering ${brandLabel} to the address above. Status updates here automatically.`;
  })();

  /* Headline title + subtitle — keyed off the bucket flags above so we
     don't have to repeat the chain twice in JSX. */
  const titleA = isCompleted
    ? 'Your gift card '
    : isOnHold
    ? 'Redemption on '
    : isBounce
    ? 'Delivery '
    : 'Redemption ';
  const titleB = isCompleted
    ? 'receipt'
    : isOnHold
    ? 'hold'
    : isBounce
    ? 'issue'
    : isProcessing
    ? 'in progress'
    : isCancelled
    ? 'cancelled'
    : redemption.status === 'failed'
    ? 'failed'
    : 'refunded';
  const subtitle = isCompleted
    ? `Completed ${formatDateTime(redemption.completedAt || redemption.createdAt)}.`
    : isOnHold
    ? "We're confirming a few details — usually under 30 minutes."
    : isBounce
    ? "We couldn't deliver the gift email — contact support to update the recipient or resend."
    : isProcessing
    ? "Hang tight — we're securing your gift card with the provider."
    : isCancelled
    ? `Cancelled ${formatDateTime(redemption.refundedAt || redemption.createdAt)}.`
    : `Closed ${formatDateTime(redemption.refundedAt || redemption.createdAt)}.`;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Back link — sits above the header inside the dashboard column. */}
      <Link
        href="/dashboard/redemptions"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#5648D8] hover:text-[#6356E5]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Gift cards
      </Link>

      {/* Header — simple H1 + subtitle, status chip on top, no decorative
          stripe (dashboard pages stay flat for visual consistency). */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={redemption.status} />
          {redemption.prezzeeOrderNumber && (
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9097A8]">
              {redemption.prezzeeOrderNumber}
            </span>
          )}
        </div>
        <h1 className="text-[24px] font-extrabold tracking-tight leading-[1.15] text-[#0F1222] sm:text-[28px]">
          {titleA}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
            {titleB}
          </span>
        </h1>
        <p className="text-[14px] text-[#667085]">{subtitle}</p>
      </header>

        {/* Delivery — primary content card for completed + bounce flows.
            Folds the legacy "order summary" + "sent to" + delivery telemetry
            into one continuous section so the page reads as a single story
            instead of four detached blocks. */}
        {(isCompleted || isBounce) && (
          <section className="rounded-3xl border border-[#FFC85D]/55 bg-gradient-to-br from-[#FFF6DA] to-[#FFE2B0] p-5 sm:p-6 space-y-4">
            {/* Headline values — the gift card amount and the Points
                debited are the two numbers a member reads first. Promote
                them to display weight so the receipt feels like a real
                receipt, not a meta strip. Timestamp drops to a muted
                helper line below. */}
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[24px] sm:text-[28px] font-extrabold tracking-tight tabular-nums text-[#7C5A00]">
                <span>
                  {formatAud(redemption.valueAud)}
                  {redemption.quantity > 1 ? ` × ${redemption.quantity}` : ''}
                </span>
                <span aria-hidden className="text-[#9C5410]/60">·</span>
                <span>{formatPts(redemption.pointsDebited)} debited</span>
              </div>
              <p className="mt-1 text-[12px] text-[#9C5410]/75">
                {formatDateTime(redemption.createdAt)}
              </p>
            </div>

            <div className="border-t border-[#9C5410]/15" />

            {/* Sent to */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9C5410]">
                <Mail className="w-3.5 h-3.5" />
                Sent to
              </div>
              <p className="mt-1 break-all text-[16px] sm:text-[18px] font-extrabold tracking-tight text-[#7C5A00]">
                {redemption.recipientEmail || redemption.memberEmail}
              </p>
            </div>

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
              {deliveryCopy}
            </p>
          </section>
        )}

        {/* For non-completed / non-bounce flows (processing, on_hold,
            failed, refunded, cancelled), keep the compact meta strip
            so members can verify amount + timestamp on a stand-alone card. */}
        {!isCompleted && !isBounce && (
          <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[14px]">
              <div className="font-extrabold tracking-tight text-[#0F1222]">
                {formatAud(redemption.valueAud)}
                {redemption.quantity > 1 ? ` × ${redemption.quantity}` : ''}
              </div>
              <div className="text-[#667085]">·</div>
              <div className="font-semibold tabular-nums text-[#0F1222]">
                {formatPts(redemption.pointsDebited)} debited
              </div>
              <div className="ml-auto text-[12px] text-[#9097A8]">
                {formatDateTime(redemption.createdAt)}
              </div>
            </div>
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
                Securing your gift card with the provider
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

        {isCancelled && (
          <section className="rounded-3xl border border-[#E7E9F2] bg-[#F4F1FB] p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#5648D8]">
                <XCircle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold tracking-tight text-[#0F1222]">
                  Redemption cancelled
                </h3>
                <div className="mt-1 text-[20px] font-extrabold tabular-nums text-[#0F1222]">
                  {formatPts(redemption.pointsDebited)} refunded
                </div>
                <p className="mt-2 text-[12px] text-[#5648D6]">
                  This redemption was cancelled and your Points have been returned in full. If you didn&apos;t request this, contact support so we can take a look.
                </p>
              </div>
            </div>
          </section>
        )}

{/* Actions row removed 2026-05-26 — Resend gift email is now
            admin-only (Prezzee Regenerate Gift PIN has cost + rate-limit
            implications). Members who need a resend should Contact
            support — that CTA already lives in the dark footer below. */}

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
                Quote {redemption.prezzeeOrderNumber || `redemption ${redemption.id}`} and we&apos;ll have it sorted fast.
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
  );
}

/* ──────────────────────────────────────────────────────────────────
   Subcomponents
   ────────────────────────────────────────────────────────────────── */

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
  insufficient_points: { label: 'Not enough Points', icon: XCircle },
  feature_not_enabled: { label: 'Coming soon', icon: RefreshCw },
  auth_required: { label: 'Sign in required', icon: ShieldAlert },
  member_invalid: { label: 'Account issue', icon: ShieldAlert },
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
    <div className="space-y-5 sm:space-y-6">
      <div className="h-5 w-40 rounded-full bg-[#F4F1FB] animate-pulse" />
      <div className="space-y-2">
        <div className="h-6 w-24 rounded-full bg-[#F4F1FB] animate-pulse" />
        <div className="h-8 w-3/4 rounded-lg bg-[#F4F1FB] animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-[#F4F1FB] animate-pulse" />
      </div>
      <div className="h-56 rounded-3xl bg-[#F4F1FB] animate-pulse" />
      <div className="h-24 rounded-3xl bg-[#F4F1FB] animate-pulse" />
    </div>
  );
}
