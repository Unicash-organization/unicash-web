'use client';

/**
 * UNICASH Redeem Gift Cards — Checkout Flow
 *
 * 2026-05-26 — Unified post-confirm pane (replaces the legacy
 * processing/preparing/on_hold/success quartet). Modal is the
 * confirmation handshake; the receipt page (/dashboard/redemptions/:id)
 * is the source of truth for delivery status. This matches modern
 * commerce patterns (Stripe, Shopify) and stops the modal from
 * "holding" the member while async work runs.
 *
 * State machine:
 *
 *   review ──confirm──► submitting (inline spinner on button)
 *                         │
 *                         ├─non-failure status──► submitted
 *                         │                       (Track this redemption)
 *                         └─failure──► failure(reason)
 *
 * Ledger copy contract:
 *   - submitted       → Points debited  (refunded if anything fails)
 *   - out_of_stock    → Points NOT debited
 *   - provider_error  → Points refunded
 *   - network_failure → Points NOT debited
 *   - fraud_rejected  → Points refunded; never expose fraud reason
 *   - cap_exceeded    → Points NOT debited
 *
 * Dev toggle: a small `Force outcome` select sits in the Review pane
 * for QA — gate behind an env flag before launch.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ReceiptText,
  Send,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import api from '@/lib/api';
import type {
  Brand,
  Denomination,
  MemberBalance,
  RedemptionFailureReason,
} from '@/lib/gift-cards/types';
import { formatAud, formatPts } from '@/lib/gift-cards/format';

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

type FlowStep = 'review' | 'submitting' | 'submitted' | 'failure';

type ForcedOutcome =
  | 'auto'
  | 'submitted'
  | 'out_of_stock'
  | 'provider_error'
  | 'network_failure'
  | 'fraud_rejected'
  | 'cap_exceeded';

const FAILURE_REASONS: { value: ForcedOutcome; label: string }[] = [
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'provider_error', label: 'Provider error' },
  { value: 'network_failure', label: 'Network failure' },
  { value: 'fraud_rejected', label: 'Fraud rejected' },
  { value: 'cap_exceeded', label: 'Cap exceeded' },
];

const OUTCOME_OPTIONS: { value: ForcedOutcome; label: string }[] = [
  { value: 'auto', label: 'Auto (random)' },
  { value: 'submitted', label: 'Submitted' },
  ...FAILURE_REASONS,
];

interface Props {
  brand: Brand;
  denomination: Denomination;
  quantity: number;
  balance: MemberBalance;
  /** Closes the BottomSheet wrapping this flow. */
  onClose: () => void;
  /** Bubbles the assigned redemption id once minted (for navigation). */
  onIssued?: (redemptionId: string) => void;
}

/* ──────────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────────── */

export default function CheckoutFlow({
  brand,
  denomination,
  quantity,
  balance,
  onClose,
  onIssued,
}: Props) {
  const totalPoints = denomination.pointsRequired * quantity;

  // Forced outcome — drives mock resolution. "auto" lets the mock
  // resolver pick a weighted outcome (85% submitted, 15% fail).
  const [forced, setForced] = useState<ForcedOutcome>('auto');

  // Flow state.
  const [step, setStep] = useState<FlowStep>('review');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [failureReason, setFailureReason] = useState<RedemptionFailureReason | null>(null);

  /* 2026-05-20 — Prezzee-delivers mode: capture where the gift goes.
     Blank = send to member's own email (server defaults from JWT). */
  const [recipientEmail, setRecipientEmail] = useState('');
  /* 2026-05-27 — Optional recipient name shown in the Prezzee greeting
     ("Hi <name>, you've received a gift..."). When blank, the backend
     falls back to the member's profile name for gift-to-self, else the
     email local-part. Always optional — Prezzee accepts any non-empty
     string here. */
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [confirmedRecipient, setConfirmedRecipient] = useState<string>('');

  /* Client-minted idempotency key (NOT shown in UI). Backend returns its
     own UUID as the canonical redemption id — we capture that into
     `mintedId` and use it for all deep-links. The local key only exists
     to make the POST safely retryable. */
  const idempotencyKey = useMemo(
    () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `RDM-${Date.now()}-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`),
    [],
  );
  /* The backend-assigned redemption id. Falls back to the idempotency
     key only for dev-forced flows that never hit the API. */
  const [mintedId, setMintedId] = useState<string>(idempotencyKey);

  /* Single timer used only by the dev-forced mock path. */
  const timerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  /* ────────────────────────────────────────────────────────────────
     Resolver — pick outcome from `forced` setting; auto = weighted.
     ──────────────────────────────────────────────────────────────── */
  const resolveOutcome = (): {
    next: FlowStep;
    reason?: RedemptionFailureReason;
  } => {
    let pick: ForcedOutcome = forced;
    if (pick === 'auto') {
      const r = Math.random();
      if (r < 0.85) pick = 'submitted';
      else {
        const reasons = FAILURE_REASONS.map((f) => f.value);
        pick = reasons[Math.floor(Math.random() * reasons.length)];
      }
    }
    if (pick === 'submitted') return { next: 'submitted' };
    return { next: 'failure', reason: pick as RedemptionFailureReason };
  };

  /* ────────────────────────────────────────────────────────────────
     Confirm — POST /redemptions, then either go to `submitted`
     (any non-failure response) or `failure`. No more inline polling
     in the modal; the receipt page polls until terminal.
     ──────────────────────────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!termsAgreed || step === 'submitting') return;
    setStep('submitting');

    // Dev forced outcome — bypass backend entirely so QA can demo
    // every state without a server roundtrip.
    if (forced !== 'auto') {
      timerRef.current = window.setTimeout(() => {
        const { next, reason } = resolveOutcome();
        if (next === 'failure' && reason) setFailureReason(reason);
        setStep(next);
        if (next === 'submitted') onIssued?.(mintedId);
      }, 1200);
      return;
    }

    // Real call — POST /redemptions
    try {
      const trimmedRecipient = recipientEmail.trim();
      const res = await api.redemptions.create({
        brandId: brand.id,
        brandName: brand.name,
        denominationId: denomination.id,
        providerSku: denomination.providerSku ?? '',
        valueAud: denomination.valueAud,
        pointsRequired: denomination.pointsRequired,
        providerCostAud: 0, // Backend ignores; server-side has the real cost
        quantity,
        idempotencyKey,
        channel: 'web',
        recipientEmail: trimmedRecipient || undefined,
        recipientName: recipientName.trim() || undefined,
        giftMessage: giftMessage.trim() || undefined,
      });
      const status = res.data?.status;
      const resolvedRecipient: string = res.data?.recipientEmail ?? trimmedRecipient ?? '';
      setConfirmedRecipient(resolvedRecipient);
      const persistedId: string = res.data?.id ?? idempotencyKey;
      /* Canonical id for all deep-links — use whatever the backend
         stored. Falls back to our idempotency key only when the API
         response omits an id field. */
      setMintedId(persistedId);

      /* 2026-05-26 — Unified submitted pane.
         - Terminal failures resolve immediately.
         - Everything else (completed OR any pending status) lands on
           SubmittedPane. The receipt page polls until terminal. */
      if (status === 'failed' || status === 'refunded' || status === 'cancelled') {
        setFailureReason((res.data?.failureReason as RedemptionFailureReason) ?? 'provider_error');
        setStep('failure');
      } else {
        onIssued?.(persistedId);
        setStep('submitted');
      }
    } catch (err: any) {
      /* Map (status, code) tuple to a member-friendly failure reason.
         Backend uses BadRequestException({ code, message }) for most
         validation failures, ForbiddenException for cohort gate, and
         UnauthorizedException for auth. Network/abort errors have no
         response at all. */
      const status: number | undefined = err?.response?.status;
      const code: string | undefined = err?.response?.data?.code;
      const msg: string =
        err?.response?.data?.message ?? err?.message ?? '';

      let reason: RedemptionFailureReason = 'network_failure';

      if (!err?.response) {
        // No response received — true network failure or abort.
        reason = 'network_failure';
      } else if (status === 401) {
        reason = 'auth_required';
      } else if (status === 403) {
        // Cohort gate or other server-side permission denial.
        reason = code === 'feature_not_enabled' ? 'feature_not_enabled' : 'auth_required';
      } else if (status === 404) {
        // Member lookup failure or denomination not found.
        reason = 'member_invalid';
      } else if (status === 400) {
        // Backend validation error. Map by code, fall back to message text.
        if (code === 'insufficient_points' || /not enough points/i.test(msg)) {
          reason = 'insufficient_points';
        } else if (code === 'cap_exceeded' || /cap|monthly limit/i.test(msg)) {
          reason = 'cap_exceeded';
        } else if (code === 'out_of_stock' || /out of stock|sold out/i.test(msg)) {
          reason = 'out_of_stock';
        } else if (code === 'invalid_denomination' || /denomination/i.test(msg)) {
          reason = 'invalid_request';
        } else {
          reason = 'invalid_request';
        }
      } else if (status && status >= 500) {
        // Prezzee or our backend exploded — Points refunded by service.
        reason = 'provider_error';
      } else {
        reason = 'network_failure';
      }

      setFailureReason(reason);
      setStep('failure');
    }
  };

  /* ────────────────────────────────────────────────────────────────
     Render — one block per step. Modal frame supplied by parent.
     ──────────────────────────────────────────────────────────────── */
  if (step === 'review' || step === 'submitting') {
    return (
      <ReviewPane
        brand={brand}
        denomination={denomination}
        quantity={quantity}
        totalPoints={totalPoints}
        termsAgreed={termsAgreed}
        onTermsToggle={setTermsAgreed}
        recipientEmail={recipientEmail}
        onRecipientEmailChange={setRecipientEmail}
        recipientName={recipientName}
        onRecipientNameChange={setRecipientName}
        giftMessage={giftMessage}
        onGiftMessageChange={setGiftMessage}
        forced={forced}
        onForcedChange={setForced}
        isSubmitting={step === 'submitting'}
        onConfirm={handleConfirm}
        onCancel={onClose}
      />
    );
  }

  if (step === 'submitted') {
    return (
      <SubmittedPane
        brand={brand}
        denomination={denomination}
        totalPoints={totalPoints}
        recipientEmail={confirmedRecipient}
        redemptionId={mintedId}
      />
    );
  }

  return (
    <FailurePane
      brand={brand}
      denomination={denomination}
      totalPoints={totalPoints}
      reason={failureReason ?? 'provider_error'}
      onRetry={() => {
        setStep('review');
        setFailureReason(null);
        setTermsAgreed(false);
      }}
      onClose={onClose}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   Panes — one self-contained block per step.
   ══════════════════════════════════════════════════════════════════ */

function ReviewPane({
  brand,
  denomination,
  quantity,
  totalPoints,
  termsAgreed,
  onTermsToggle,
  recipientEmail,
  onRecipientEmailChange,
  recipientName,
  onRecipientNameChange,
  giftMessage,
  onGiftMessageChange,
  forced,
  onForcedChange,
  isSubmitting,
  onConfirm,
  onCancel,
}: {
  brand: Brand;
  denomination: Denomination;
  quantity: number;
  totalPoints: number;
  termsAgreed: boolean;
  onTermsToggle: (v: boolean) => void;
  recipientEmail: string;
  onRecipientEmailChange: (v: string) => void;
  recipientName: string;
  onRecipientNameChange: (v: string) => void;
  giftMessage: string;
  onGiftMessageChange: (v: string) => void;
  forced: ForcedOutcome;
  onForcedChange: (v: ForcedOutcome) => void;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  /* Simple HTML5-ish validity: if filled, must look like an email. */
  const recipientFilled = recipientEmail.trim().length > 0;
  const recipientLooksValid =
    !recipientFilled || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());
  /* "Gifting to someone else" = user typed a recipientEmail. In that mode
     the Prezzee email greets the recipient by name, so we surface the
     name field. For self-redemptions we hide it to keep the form short —
     backend will fall back to the member's profile name automatically. */
  const isGiftToOther = recipientFilled && recipientLooksValid;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-[#FBFAFF] border border-[#F1ECFB] p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-[12px] font-extrabold shrink-0"
            style={{ background: `${brand.heroColor}22`, color: brand.heroColor }}
          >
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] text-[#667085]">{brand.name}</div>
            <div className="text-[15px] font-extrabold tabular-nums truncate">
              {formatAud(denomination.valueAud)}
              {quantity > 1 ? ` × ${quantity}` : ''}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] text-[#667085]">Points required</div>
          <div className="text-[15px] font-extrabold tabular-nums">{formatPts(totalPoints)}</div>
        </div>
      </div>

      <div className="space-y-1 text-[13px]">
        {quantity > 1 && (
          <Row
            label="Each"
            value={`${formatAud(denomination.valueAud)} · ${formatPts(denomination.pointsRequired)}`}
          />
        )}
        <Row
          label="Delivery"
          value={
            brand.deliveryType === 'instant'
              ? 'Emailed to recipient · usually under 10 minutes'
              : brand.deliveryType === 'review'
              ? 'Emailed to recipient · short review may apply'
              : 'Emailed to recipient · scheduled'
          }
        />
      </div>

      {/* ─── Recipient capture — Prezzee-delivers mode ───
          User can leave blank to send to their own email, or
          enter someone else's email to gift. */}
      <div className="rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5 text-[#6356E5]" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-[#5648D8]">
            Send gift to
          </span>
        </div>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Your own email (leave blank)"
          value={recipientEmail}
          onChange={(e) => onRecipientEmailChange(e.target.value)}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-[13px] text-[#0F1222] placeholder:text-[#9097A8] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20 ${
            recipientLooksValid ? 'border-[#E7E9F2] focus:border-[#6356E5]' : 'border-[#EF4444]'
          }`}
        />
        {!recipientLooksValid && (
          <p className="text-[11px] text-[#EF4444]">Enter a valid email address.</p>
        )}
        {/* Recipient name — only shown when gifting to someone else.
            For gift-to-self, backend uses the member's profile name. */}
        {isGiftToOther && (
          <input
            type="text"
            autoComplete="name"
            placeholder="Recipient name (optional)"
            value={recipientName}
            onChange={(e) => onRecipientNameChange(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl border border-[#E7E9F2] bg-white px-3 py-2 text-[13px] text-[#0F1222] placeholder:text-[#9097A8] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20 focus:border-[#6356E5]"
          />
        )}
        <textarea
          placeholder="Optional gift message"
          value={giftMessage}
          onChange={(e) => onGiftMessageChange(e.target.value)}
          rows={2}
          maxLength={240}
          className="w-full rounded-xl border border-[#E7E9F2] bg-white px-3 py-2 text-[13px] text-[#0F1222] placeholder:text-[#9097A8] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20 focus:border-[#6356E5] resize-none"
        />
        <p className="text-[11px] text-[#667085] leading-relaxed">
          Prezzee will email the gift card directly to this address. Leave the
          email blank to send to your own UNICASH email.
        </p>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAgreed}
          onChange={(e) => onTermsToggle(e.target.checked)}
          className="mt-0.5 accent-[#6356E5]"
        />
        <span className="text-[12px] text-[#667085]">
          I agree to the gift card terms and acknowledge gift cards are{' '}
          <strong className="text-[#0F1222]">non-refundable once sent</strong>.
        </span>
      </label>

      {/* Mock-phase dev toggle — remove once the API resolves outcomes server-side. */}
      <div className="rounded-2xl border border-dashed border-[#E7E9F2] bg-white p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#9097A8] mb-2">
          Dev — force outcome
        </div>
        <div className="flex flex-wrap gap-1.5">
          {OUTCOME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onForcedChange(opt.value)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                forced === opt.value
                  ? 'bg-[#6356E5] text-white'
                  : 'bg-[#F4F1FB] text-[#5648D8] hover:bg-[#E7DFFF]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          disabled={!termsAgreed || !recipientLooksValid || isSubmitting}
          onClick={onConfirm}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold transition-colors ${
            termsAgreed && recipientLooksValid && !isSubmitting
              ? 'bg-[#6356E5] text-white hover:bg-[#5648D8]'
              : 'bg-[#6356E5]/80 text-white cursor-not-allowed'
          }`}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Confirming…' : 'Confirm and redeem'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-5 py-3 text-[14px] font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* 2026-05-26 — SubmittedPane is the single confirmation handshake shown
   after a successful POST /redemptions. It covers BOTH the instant-
   completed and the pending paths (Prezzee usually settles in seconds
   either way). The receipt page is the source of truth for status —
   we just confirm the order was accepted and offer a single CTA to
   track delivery. */
function SubmittedPane({
  brand,
  denomination,
  totalPoints,
  recipientEmail,
  redemptionId,
}: {
  brand: Brand;
  denomination: Denomination;
  totalPoints: number;
  /** Where Prezzee is sending the gift. Empty string = member's own email. */
  recipientEmail: string;
  redemptionId: string;
}) {
  const sentLabel = recipientEmail.trim() || 'your registered email';
  return (
    <div className="space-y-4">
      <div className="text-center pt-1">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE2B0] to-[#FFC85D] text-[#1A1432] shadow-[0_10px_30px_-12px_rgba(255,200,93,0.6)]">
          <CheckCircle2 className="w-7 h-7" strokeWidth={2.4} />
        </div>
        <h3 className="mt-3 text-[18px] font-extrabold tracking-tight text-[#0F1222]">
          Your{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]">
            {formatAud(denomination.valueAud)} {brand.name}
          </span>{' '}
          gift card is on the way
        </h3>
        <p className="mt-2 text-[13px] text-[#667085] leading-relaxed">
          We&apos;ll email it to <strong className="text-[#0F1222] break-all">{sentLabel}</strong> — usually within 10 minutes.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E0DAFF] bg-[#F4F1FB] p-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#6356E5]">
          Points debited
        </div>
        <div className="mt-1 text-[20px] font-extrabold tabular-nums text-[#0F1222]">
          {formatPts(totalPoints)}
        </div>
        <p className="mt-1 text-[12px] text-[#5346D6]">
          Fully refunded if anything goes wrong with this redemption.
        </p>
      </div>

      <p className="text-[12px] text-[#667085] leading-relaxed text-center">
        Sometimes takes longer if our provider runs an extra check. You can close this window — we&apos;ll email you the moment it&apos;s delivered.
      </p>

      <div className="pt-1">
        <Link
          href={`/dashboard/redemptions/${redemptionId}`}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
        >
          <ReceiptText className="w-4 h-4" />
          Track this redemption
        </Link>
      </div>

      <p className="text-center text-[10px] text-[#9097A8]">Redemption {redemptionId}</p>
    </div>
  );
}

function FailurePane({
  brand,
  denomination,
  totalPoints,
  reason,
  onRetry,
  onClose,
}: {
  brand: Brand;
  denomination: Denomination;
  totalPoints: number;
  reason: RedemptionFailureReason;
  onRetry: () => void;
  onClose: () => void;
}) {
  const config = FAILURE_COPY[reason];
  const IconEl = config.icon;

  return (
    <div className="space-y-4">
      <div className="text-center pt-1">
        <div
          className="inline-flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: config.iconBg, color: config.iconColor }}
        >
          <IconEl className="w-7 h-7" />
        </div>
        <h3 className="mt-3 text-[18px] font-extrabold tracking-tight text-[#0F1222]">
          {config.title}
        </h3>
        <p className="mt-1 text-[13px] text-[#667085]">{config.body(brand.name)}</p>
      </div>

      {/* Ledger-truth ribbon — always state whether Points were debited or refunded. */}
      <div
        className="rounded-2xl border p-3 text-[12px]"
        style={{
          borderColor: config.ledgerRibbon === 'refunded' ? '#F1ECFB' : '#D1FAE5',
          background: config.ledgerRibbon === 'refunded' ? '#F4F1FB' : '#ECFDF5',
          color: config.ledgerRibbon === 'refunded' ? '#5648D8' : '#047857',
        }}
      >
        <div className="font-bold">
          {config.ledgerRibbon === 'refunded'
            ? `${formatPts(totalPoints)} refunded`
            : 'Points were not debited'}
        </div>
        <div className="mt-0.5 opacity-90">
          {config.ledgerRibbon === 'refunded'
            ? 'Your full balance is restored. Allow up to 1 minute for the ledger to update.'
            : 'Your balance is unchanged — try again or pick a different brand.'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {config.primaryCta === 'retry' && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
          >
            Try again
          </button>
        )}
        {config.primaryCta === 'pick_denom' && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
          >
            Try a smaller amount
          </button>
        )}
        {config.primaryCta === 'different_brand' && (
          <Link
            href="/rewards/gift-cards"
            className="inline-flex items-center justify-center rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
          >
            Try a different brand
          </Link>
        )}
        {config.primaryCta === 'contact' && (
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
          >
            Contact support
          </Link>
        )}
        {config.primaryCta === 'login' && (
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
          >
            Sign in
          </Link>
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-5 py-3 text-[14px] font-bold"
        >
          Back to gift cards
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Failure copy map — spec §7.7
   ────────────────────────────────────────────────────────────────── */

type FailureConfig = {
  title: string;
  body: (brand: string) => string;
  icon: typeof XCircle;
  iconBg: string;
  iconColor: string;
  ledgerRibbon: 'refunded' | 'untouched';
  primaryCta: 'retry' | 'pick_denom' | 'different_brand' | 'contact' | 'login';
};

const FAILURE_COPY: Record<RedemptionFailureReason, FailureConfig> = {
  out_of_stock: {
    title: 'Just sold out',
    body: (brand) =>
      `This ${brand} denomination just sold out. Your Points were not debited.`,
    icon: AlertCircle,
    iconBg: '#FFFBEB',
    iconColor: '#B45309',
    ledgerRibbon: 'untouched',
    primaryCta: 'pick_denom',
  },
  provider_error: {
    title: 'Provider issue',
    body: () => 'Our provider had a problem completing this redemption. Your Points were refunded.',
    icon: XCircle,
    iconBg: '#FEF2F2',
    iconColor: '#B91C1C',
    ledgerRibbon: 'refunded',
    primaryCta: 'retry',
  },
  network_failure: {
    title: 'Connection lost',
    body: () =>
      'We lost connection before this redemption finished. Your Points were not debited.',
    icon: XCircle,
    iconBg: '#FEF2F2',
    iconColor: '#B91C1C',
    ledgerRibbon: 'untouched',
    primaryCta: 'retry',
  },
  fraud_rejected: {
    title: "Couldn't complete this redemption",
    body: () =>
      "We couldn't complete this redemption. Your Points were refunded.",
    icon: ShieldAlert,
    iconBg: '#FEF2F2',
    iconColor: '#B91C1C',
    ledgerRibbon: 'refunded',
    primaryCta: 'contact',
  },
  cap_exceeded: {
    title: 'Monthly cap reached',
    body: (brand) =>
      `You've reached this ${brand} brand's monthly redemption cap. Your Points were not debited.`,
    icon: AlertCircle,
    iconBg: '#FFFBEB',
    iconColor: '#B45309',
    ledgerRibbon: 'untouched',
    primaryCta: 'different_brand',
  },
  invalid_request: {
    title: 'Request rejected',
    body: () =>
      'The redemption request had invalid parameters. Your Points were not debited. Please try again or contact support.',
    icon: AlertCircle,
    iconBg: '#FEF2F2',
    iconColor: '#B91C1C',
    ledgerRibbon: 'untouched',
    primaryCta: 'retry',
  },
  /* Not enough Points — most common member-side error.
     CTA encourages earning more Points instead of retrying same flow. */
  insufficient_points: {
    title: 'Not enough Points',
    body: (brand) =>
      `You don't have enough Points yet for this ${brand} gift card. Scan more receipts, top up with a Point Booster, or pick a smaller denomination.`,
    icon: AlertCircle,
    iconBg: '#FFFBEB',
    iconColor: '#B45309',
    ledgerRibbon: 'untouched',
    primaryCta: 'pick_denom',
  },
  /* Cohort gate — gift card redemption not yet rolled out to this Member. */
  feature_not_enabled: {
    title: 'Coming soon',
    body: () =>
      'Gift card redemption is not yet available for your account. Your Points are safe and you can still redeem once we enable this for you.',
    icon: AlertCircle,
    iconBg: '#F4F1FB',
    iconColor: '#6356E5',
    ledgerRibbon: 'untouched',
    primaryCta: 'different_brand',
  },
  /* Session expired or token invalid — push to login. */
  auth_required: {
    title: 'Please sign in again',
    body: () =>
      'Your session has expired. Sign in again to complete this redemption. Your Points are safe.',
    icon: AlertCircle,
    iconBg: '#FEF2F2',
    iconColor: '#B91C1C',
    ledgerRibbon: 'untouched',
    primaryCta: 'login',
  },
  /* Member account lookup failed (very rare; usually data-integrity issue). */
  member_invalid: {
    title: 'Account issue',
    body: () =>
      'We could not verify your account for this redemption. Your Points are safe. Please contact support so we can help.',
    icon: ShieldAlert,
    iconBg: '#FEF2F2',
    iconColor: '#B91C1C',
    ledgerRibbon: 'untouched',
    primaryCta: 'contact',
  },
};

/* ──────────────────────────────────────────────────────────────────
   Tiny helpers
   ────────────────────────────────────────────────────────────────── */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[#667085]">{label}</span>
      <span className="font-semibold text-[#0F1222] text-right">{value}</span>
    </div>
  );
}
