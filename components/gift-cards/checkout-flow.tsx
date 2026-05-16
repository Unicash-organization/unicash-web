'use client';

/**
 * UNICASH Redeem Gift Cards — Checkout Flow
 *
 * Multi-state flow rendered inside the Review BottomSheet from
 * brand-detail. The flow never navigates away mid-redemption — every
 * state replaces the modal contents in-place so the member always
 * sees an explicit outcome (success / hold / failure with cause).
 *
 * State machine:
 *
 *   review ──confirm──► processing ──ok (≤10s)──► success
 *                                  ├─slow (>30s)─► on_hold
 *                                  └─fail──────► failure(reason)
 *
 * Ledger copy contract (per spec §9 + §11):
 *   - success         → Points debited
 *   - on_hold         → Points held (reservation; reversible)
 *   - out_of_stock    → Points NOT debited
 *   - provider_error  → Points refunded
 *   - network_failure → Points NOT debited
 *   - fraud_rejected  → Points refunded; never expose fraud reason
 *   - cap_exceeded    → Points NOT debited
 *
 * Dev toggle: a small `Force outcome` select sits in the Review pane
 * during the mock phase. Remove before the API wires up — spec §14
 * acceptance criteria asks for it commented; we surface it as a
 * radio-style chip group instead so QA can drive every branch.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  ReceiptText,
  ShieldAlert,
  Wallet,
  XCircle,
} from 'lucide-react';
import { BalanceRow, CodeCard } from '@/components/gift-cards';
import api from '@/lib/api';
import type {
  Brand,
  Denomination,
  MemberBalance,
  RedemptionFailureReason,
} from '@/lib/gift-cards/types';
import { formatAud, formatDateTime, formatPts } from '@/lib/gift-cards/format';

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

type FlowStep = 'review' | 'processing' | 'success' | 'on_hold' | 'failure';

type ForcedOutcome =
  | 'auto'
  | 'success'
  | 'on_hold'
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
  { value: 'success', label: 'Success' },
  { value: 'on_hold', label: 'On hold' },
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
  const totalAud = denomination.valueAud * quantity;

  // Forced outcome — drives mock resolution. "auto" lets the mock
  // resolver pick a weighted outcome (70% success, 15% hold, 15% fail).
  const [forced, setForced] = useState<ForcedOutcome>('auto');

  // Flow state.
  const [step, setStep] = useState<FlowStep>('review');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [failureReason, setFailureReason] = useState<RedemptionFailureReason | null>(null);

  // Minted redemption id (assigned at confirm so the member can deep-link
  // even if the modal is dismissed). 8-digit random suffix for the mock.
  const redemptionId = useMemo(
    () => `RDM-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Mock code generated only when success branch resolves.
  const mockCode = useMemo(() => {
    const seg = () =>
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `${brand.id.split('-')[1]}-${seg()}-${seg()}-${seg()}`;
  }, [brand.id]);

  const timerRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      if (holdTimerRef.current != null) window.clearTimeout(holdTimerRef.current);
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
      if (r < 0.7) pick = 'success';
      else if (r < 0.85) pick = 'on_hold';
      else {
        const reasons = FAILURE_REASONS.map((f) => f.value);
        pick = reasons[Math.floor(Math.random() * reasons.length)];
      }
    }
    if (pick === 'success') return { next: 'success' };
    if (pick === 'on_hold') return { next: 'on_hold' };
    return { next: 'failure', reason: pick as RedemptionFailureReason };
  };

  /* ────────────────────────────────────────────────────────────────
     Confirm — calls the real backend (Phase GP4). The backend
     handles the reserve-then-Prezzee flow; we only react to the
     final status (completed | on_hold | failed). Dev "Force outcome"
     toggle remains as a local override so QA can still drive each
     branch without hitting Prezzee.
     ──────────────────────────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!termsAgreed) return;
    setStep('processing');

    // Hard timeout — flip to on_hold if backend hasn't replied in 30s
    holdTimerRef.current = window.setTimeout(() => {
      setStep((prev) => (prev === 'processing' ? 'on_hold' : prev));
    }, 30_000);

    // Dev forced outcome — bypass backend entirely so QA can demo
    // every state without a server roundtrip.
    if (forced !== 'auto') {
      timerRef.current = window.setTimeout(() => {
        const { next, reason } = resolveOutcome();
        if (next === 'failure' && reason) setFailureReason(reason);
        setStep(next);
        if (next === 'success') onIssued?.(redemptionId);
      }, 1800);
      return;
    }

    // Real call — POST /redemptions
    try {
      const res = await api.redemptions.create({
        brandId: brand.id,
        brandName: brand.name,
        denominationId: denomination.id,
        providerSku: denomination.providerSku ?? '',
        valueAud: denomination.valueAud,
        pointsRequired: denomination.pointsRequired,
        providerCostAud: 0, // Backend ignores; server-side has the real cost
        quantity,
        idempotencyKey: redemptionId,
        channel: 'web',
      });
      if (holdTimerRef.current != null) window.clearTimeout(holdTimerRef.current);
      const status = res.data?.status;
      if (status === 'completed') {
        onIssued?.(res.data.id ?? redemptionId);
        setStep('success');
      } else if (status === 'on_hold' || status === 'processing') {
        setStep('on_hold');
      } else {
        setFailureReason((res.data?.failureReason as RedemptionFailureReason) ?? 'provider_error');
        setStep('failure');
      }
    } catch (err: any) {
      if (holdTimerRef.current != null) window.clearTimeout(holdTimerRef.current);
      const code = err?.response?.data?.code;
      if (code === 'insufficient_points') {
        // Insufficient — close with native error; brand page already
        // shows the recovery CTAs (Get Points / Booster / Receipts).
        setFailureReason('provider_error');
        setStep('failure');
      } else {
        setFailureReason('network_failure');
        setStep('failure');
      }
    }
  };

  /* ────────────────────────────────────────────────────────────────
     Render — one block per step. Modal frame supplied by parent.
     ──────────────────────────────────────────────────────────────── */
  if (step === 'review') {
    return (
      <ReviewPane
        brand={brand}
        denomination={denomination}
        quantity={quantity}
        totalPoints={totalPoints}
        totalAud={totalAud}
        balance={balance}
        termsAgreed={termsAgreed}
        onTermsToggle={setTermsAgreed}
        forced={forced}
        onForcedChange={setForced}
        onConfirm={handleConfirm}
        onCancel={onClose}
      />
    );
  }

  if (step === 'processing') {
    return <ProcessingPane />;
  }

  if (step === 'success') {
    return (
      <SuccessPane
        brand={brand}
        denomination={denomination}
        quantity={quantity}
        totalPoints={totalPoints}
        code={mockCode}
        redemptionId={redemptionId}
        onClose={onClose}
      />
    );
  }

  if (step === 'on_hold') {
    return (
      <OnHoldPane
        brand={brand}
        totalPoints={totalPoints}
        redemptionId={redemptionId}
        onClose={onClose}
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
  totalAud,
  balance,
  termsAgreed,
  onTermsToggle,
  forced,
  onForcedChange,
  onConfirm,
  onCancel,
}: {
  brand: Brand;
  denomination: Denomination;
  quantity: number;
  totalPoints: number;
  totalAud: number;
  balance: MemberBalance;
  termsAgreed: boolean;
  onTermsToggle: (v: boolean) => void;
  forced: ForcedOutcome;
  onForcedChange: (v: ForcedOutcome) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
              {formatAud(denomination.valueAud)} × {quantity}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] text-[#667085]">Points required</div>
          <div className="text-[15px] font-extrabold tabular-nums">{formatPts(totalPoints)}</div>
        </div>
      </div>

      <div className="space-y-1 text-[13px]">
        <Row label="Unit Points" value={formatPts(denomination.pointsRequired)} />
        <Row label="Quantity" value={String(quantity)} />
        <Row label="Total face value" value={formatAud(totalAud)} />
        <Row
          label="Delivery"
          value={
            brand.deliveryType === 'instant'
              ? 'Digital code via email + in-app · usually under 10 seconds'
              : brand.deliveryType === 'review'
              ? 'Digital code via email + in-app · short review may apply'
              : 'Digital code via email + in-app · scheduled'
          }
        />
      </div>

      <BalanceRow currentPoints={balance.pointsAvailable} pointsRequired={totalPoints} />

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAgreed}
          onChange={(e) => onTermsToggle(e.target.checked)}
          className="mt-0.5 accent-[#6356E5]"
        />
        <span className="text-[12px] text-[#667085]">
          I agree to the gift card terms and acknowledge codes are{' '}
          <strong className="text-[#0F1222]">non-refundable once revealed</strong>.
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
          disabled={!termsAgreed}
          onClick={onConfirm}
          className={`w-full rounded-full px-5 py-3 text-[14px] font-bold transition-colors ${
            termsAgreed
              ? 'bg-[#6356E5] text-white hover:bg-[#5648D8]'
              : 'bg-[#F4F1FB] text-[#94A3B8] cursor-not-allowed'
          }`}
        >
          Confirm and redeem
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-5 py-3 text-[14px] font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProcessingPane() {
  return (
    <div className="py-10 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F6F4FF] text-[#6356E5]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <div className="mt-5 text-[18px] font-extrabold tracking-tight text-[#0F1222]">
        Securing your code…
      </div>
      <p className="mt-1 text-[13px] text-[#667085]">This usually takes under 10 seconds.</p>
      <p className="mt-4 text-[11px] uppercase tracking-widest font-bold text-[#9097A8]">
        Do not close this window
      </p>
    </div>
  );
}

function SuccessPane({
  brand,
  denomination,
  quantity,
  totalPoints,
  code,
  redemptionId,
  onClose,
}: {
  brand: Brand;
  denomination: Denomination;
  quantity: number;
  totalPoints: number;
  code: string;
  redemptionId: string;
  onClose: () => void;
}) {
  const expires = new Date(Date.now() + 365 * 2 * 86_400_000).toISOString();
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
          gift card is ready
        </h3>
        <p className="mt-1 text-[12px] text-[#667085]">{formatPts(totalPoints)} debited · {quantity} code{quantity > 1 ? 's' : ''}</p>
      </div>

      <CodeCard
        brandName={brand.name}
        code={{
          id: 'mock-1',
          code,
          expiresAt: expires,
          status: 'delivered',
        }}
      />

      {/* Wallet placeholders — keep enabled so member sees the option;
          real impl will deep-link to Apple/Google Pay passes. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E7E9F2] bg-white px-3 py-2 text-[12px] font-semibold text-[#0F1222] hover:bg-[#F6F4FF]"
        >
          <Wallet className="w-3.5 h-3.5" />
          Add to Apple Wallet
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E7E9F2] bg-white px-3 py-2 text-[12px] font-semibold text-[#0F1222] hover:bg-[#F6F4FF]"
        >
          <Wallet className="w-3.5 h-3.5" />
          Add to Google Wallet
        </button>
      </div>

      <div className="rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-3 text-[12px] text-[#667085] flex items-start gap-2">
        <Mail className="w-3.5 h-3.5 mt-0.5 text-[#5648D8] shrink-0" />
        <span>
          A receipt with your code has been sent to your registered email. View any time in
          Redemption history.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <Link
          href={`/account/redemptions/${redemptionId}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
        >
          <ReceiptText className="w-4 h-4" />
          View receipt
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-5 py-3 text-[14px] font-bold"
        >
          Back to gift cards
        </button>
      </div>

      <p className="text-center text-[10px] text-[#9097A8]">
        Redemption {redemptionId} · Code expires {formatDateTime(expires)}
      </p>
    </div>
  );
}

function OnHoldPane({
  brand,
  totalPoints,
  redemptionId,
  onClose,
}: {
  brand: Brand;
  totalPoints: number;
  redemptionId: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center pt-1">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FFFBEB] text-[#B45309]">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="mt-3 text-[18px] font-extrabold tracking-tight text-[#0F1222]">
          Your redemption is on hold
        </h3>
        {/* Member-safe copy — never reveal fraud rules per §10. */}
        <p className="mt-1 text-[13px] text-[#667085]">
          We&apos;re confirming a few details on your {brand.name} redemption. This usually takes under 30 minutes.
        </p>
      </div>

      <div className="rounded-2xl border border-[#FCD34D] bg-[#FFFBEB] p-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#B45309]">
          Points held
        </div>
        <div className="mt-1 text-[20px] font-extrabold tabular-nums text-[#0F1222]">
          {formatPts(totalPoints)}
        </div>
        <p className="mt-1 text-[12px] text-[#B45309]">
          We&apos;ve held these Points — they&apos;ll either complete this redemption or be returned in full if it&apos;s declined.
        </p>
      </div>

      <p className="text-[12px] text-[#667085]">
        You&apos;ll get an email the moment the review finishes. No action needed from you right now.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <Link
          href="/account/redemptions"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold"
        >
          <ReceiptText className="w-4 h-4" />
          Track in Redemption history
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-5 py-3 text-[14px] font-bold"
        >
          Back to gift cards
        </button>
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
            Pick another denomination
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
  primaryCta: 'retry' | 'pick_denom' | 'different_brand' | 'contact';
};

const FAILURE_COPY: Record<RedemptionFailureReason, FailureConfig> = {
  out_of_stock: {
    title: 'Sold out — just',
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
