'use client';

/**
 * UNICASH — Redeem Gift Cards · Brand Detail
 *
 * Single brand selection surface. Order:
 *   1. Brand hero (logo block, name, category, delivery type, terms)
 *   2. Denomination chips
 *   3. Quantity stepper (capped per member per month)
 *   4. Live cost calculator + Balance row
 *   5. Primary CTA (state-aware)
 *   6. Description, How it works, Terms accordion, FAQ accordion
 *   7. Trust strip
 *
 * State coverage (per spec §11):
 *   - Loading (skeleton)
 *   - Not found
 *   - Insufficient Points → CTA swaps to "Get Points"
 *   - Out of stock at selected denomination
 *   - Member-only while not Member → locked overlay + Join CTA
 *   - Login required → "Log in to redeem"
 *   - Cap reached for this brand this month → inline notice
 *
 * Mobile: sticky bottom CTA reappears once a denomination is picked.
 * The Review modal lives in Phase G3 — for now the CTA opens a
 * placeholder BottomSheet that lists the order summary. G3 will
 * wire Processing → Success → On-hold → Failure inline.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  BalanceRow,
  BottomSheet,
  DenominationChip,
  GiftCardArt,
} from '@/components/gift-cards';
import CheckoutFlow from '@/components/gift-cards/checkout-flow';
import { getBrand, MOCK_REDEMPTIONS } from '@/lib/gift-cards/mock-data';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Brand, MemberBalance } from '@/lib/gift-cards/types';
import { formatAud, formatPts } from '@/lib/gift-cards/format';
import type { Denomination } from '@/lib/gift-cards/types';

type ViewState = 'ready' | 'loading' | 'not_found';
type AuthState = 'guest' | 'member' | 'free_member';

/**
 * Count how many of this brand the member redeemed this month —
 * drives the per-brand monthly cap UI. With mock data we sum the
 * 6 mock redemptions for this brand; real impl will query the
 * ledger filtered by Sydney month start.
 */
function redeemedThisMonth(brandId: string, memberId: string, denomId: string): number {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return MOCK_REDEMPTIONS.filter(
    (r) =>
      r.brandId === brandId &&
      r.denominationId === denomId &&
      r.memberId === memberId &&
      ['completed', 'on_hold', 'processing'].includes(r.status) &&
      new Date(r.createdAt) >= monthStart,
  ).reduce((sum, r) => sum + r.quantity, 0);
}

function nextMonthResetLabel(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toLocaleDateString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: 'short',
  });
}

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = decodeURIComponent((params?.brandId as string) || '');

  /* 2026-05-26 — read live Points balance + membership status from
     AuthContext (same source the Header pill uses) instead of the
     hardcoded MOCK_MEMBER_BALANCE that the page was shipped with.
     `membershipCredits` and `boostCredits` on the User row are kept
     in sync by every ledger mutation, so they reflect any pending
     debits (the redemption modal reserves Points before this page
     refetches). */
  const { user } = useAuth();
  const balance: MemberBalance = useMemo(() => {
    const total =
      (Number(user?.membershipCredits) || 0) +
      (Number(user?.boostCredits) || 0);
    return {
      pointsAvailable: total,
      pointsHeld: 0, // not surfaced on User row; admin-only telemetry
      fuelRewardsAud: Number((user as any)?.fuelRewardsAud) || 0,
      isMember: !!(user as any)?.membership || !!(user as any)?.membershipId,
    };
  }, [user]);

  // GP4 — fetch brand from backend; fall back to local mock so dev
  // without API still works.
  const [brand, setBrand] = useState<Brand | null>(getBrand(brandId) ?? null);
  const [viewState, setViewState] = useState<ViewState>(getBrand(brandId) ? 'ready' : 'loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.giftCards.getById(brandId);
        if (!cancelled && res.data) {
          setBrand(res.data as Brand);
          setViewState('ready');
        }
      } catch {
        if (!cancelled && !getBrand(brandId)) {
          setViewState('not_found');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId]);
  const [authState] = useState<AuthState>(balance.isMember ? 'member' : 'free_member');

  const [selectedDenomId, setSelectedDenomId] = useState<string | null>(null);
  /* 2026-05-26 — Quantity locked to 1 per redemption.
     Backend createOrder currently only sends a single item to Prezzee
     regardless of `quantity`, so qty>1 silently lost gift cards while
     debiting all the Points. Disabled at the UI until multi-item
     fulfillment ships (see Option A roadmap in the redemption flow audit).
     The `quantity` DB column stays so the historical schema is
     unchanged; members who want N gift cards redeem N times. */
  const quantity = 1;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<'terms' | 'faq' | null>(null);
  /* When the persistent Redeem CTA is clicked without a denomination
     selected, briefly flash the chip row to guide the eye there. */
  const denomsRef = useRef<HTMLDivElement | null>(null);
  const [chipsFlash, setChipsFlash] = useState(false);

  const selected: Denomination | null = useMemo(() => {
    if (!brand || !selectedDenomId) return null;
    return brand.denominations.find((d) => d.id === selectedDenomId) ?? null;
  }, [brand, selectedDenomId]);

  const handleStartRedeem = () => {
    if (!selected) {
      denomsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setChipsFlash(true);
      window.setTimeout(() => setChipsFlash(false), 1600);
      return;
    }
    setReviewOpen(true);
  };

  const totalPoints = selected ? selected.pointsRequired * quantity : 0;
  const totalAud = selected ? selected.valueAud * quantity : 0;
  const insufficient = selected ? balance.pointsAvailable < totalPoints : false;
  const outOfStock = selected ? selected.stockLevel === 'out_of_stock' || !selected.active : false;

  const redeemedCount = selected
    ? redeemedThisMonth(brand?.id ?? '', 'M-10421', selected.id)
    : 0;
  const monthlyCap = selected?.capPerMemberPerMonth ?? 0;
  const remainingCap = Math.max(0, monthlyCap - redeemedCount);
  const capReached = selected ? remainingCap <= 0 : false;

  const memberLocked = brand?.memberOnly && authState !== 'member';
  const loginRequired = authState === 'guest';

  /* Clean the Prezzee description for display — strips raw exchange/retailer
     URLs (and the "See available retailers …" lead-in) that leak sandbox links. */
  const cleanDescription = (brand?.description ?? '')
    .replace(/See available retailers[^.]*\.?/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  /* ──────────────────────────────────────────────────────────────
     Render guards
     ────────────────────────────────────────────────────────────── */
  if (viewState === 'loading') {
    return (
      <div className="bg-[#FBFAFF] min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
          <div className="h-8 w-32 rounded-full bg-[#F4F1FB] animate-pulse" />
          <div className="h-40 rounded-2xl bg-[#F4F1FB] animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-[#F4F1FB] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!brand || viewState === 'not_found') {
    return (
      <div className="bg-[#FBFAFF] min-h-screen">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F1222]">
            Gift card not found
          </h1>
          <p className="mt-2 text-[#667085]">
            This brand may have been paused or archived.
          </p>
          <Link
            href="/rewards/gift-cards"
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-[#6356E5] hover:bg-[#5648D8] text-white px-5 py-3 text-[14px] font-bold transition-colors"
          >
            Back to gift cards
          </Link>
        </div>
      </div>
    );
  }

  const canRedeem =
    !!selected && !outOfStock && !insufficient && !capReached && !memberLocked && !loginRequired;

  /* ──────────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-[#FBFAFF] min-h-screen pb-24 sm:pb-10">
      {/* Back link */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-6">
        <Link
          href="/rewards/gift-cards"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#5648D8] hover:text-[#6356E5]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to gift cards
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        {/* Brand hero — card art + details (2-col on desktop, stacked on mobile) */}
        <section className="relative overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,0.04)] sm:p-6">
          <div className="grid items-center gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_1.15fr]">
            {/* Card art */}
            <GiftCardArt brand={brand} className="shadow-[0_18px_44px_-18px_rgba(15,18,34,0.35)]" />
            {/* Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F6F4FF] text-[#5648D8] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest">
                  {brand.category}
                </span>
                {brand.deliveryType === 'instant' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] text-[#047857] px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Instant delivery
                  </span>
                )}
                {brand.deliveryType === 'review' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] text-[#B45309] px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> Review required
                  </span>
                )}
                {brand.memberOnly && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F1FB] text-[#5648D8] px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest">
                    <Lock className="w-3 h-3" /> Member-only
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-[24px] sm:text-[28px] font-extrabold tracking-tight leading-[1.15] text-[#0F1222]">
                {brand.name} gift card
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#667085] line-clamp-5">{cleanDescription}</p>
            </div>
          </div>

          {/* Member-only locked overlay */}
          {memberLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1A1432]/65 backdrop-blur-sm text-white">
              <Lock className="w-7 h-7" />
              <div className="text-[16px] font-bold">Members only</div>
              <p className="text-[13px] text-[#C9C2E8] max-w-xs text-center">
                Become a UNICASH Member to redeem this brand.
              </p>
              <Link
                href="/dashboard/membership"
                className="rounded-full bg-white text-[#5648D8] px-5 py-2.5 text-[13px] font-bold hover:bg-[#F4F1FB]"
              >
                Join UNICASH
              </Link>
            </div>
          )}
        </section>

        {/* Denomination chips */}
        <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5">
          <h2 className="text-[16px] font-extrabold tracking-tight text-[#0F1222]">
            Choose a denomination
          </h2>
          <div
            ref={denomsRef}
            className={`mt-3 flex flex-wrap gap-2.5 rounded-2xl p-1 -m-1 transition-all duration-300 ${
              chipsFlash ? 'ring-2 ring-[#6356E5]/40 bg-[#F4F1FB]' : 'ring-0'
            }`}
          >
            {brand.denominations
              .filter((d) => d.active)
              .map((d) => (
                <DenominationChip
                  key={d.id}
                  denom={d}
                  selected={selectedDenomId === d.id}
                  onClick={() => {
                    setSelectedDenomId(d.id);
                  }}
                />
              ))}
          </div>

          {/* Out-of-stock notify */}
          {selected && outOfStock && (
            <div className="mt-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-[13px] text-[#B91C1C] flex items-center justify-between gap-2">
              <span>This denomination is out of stock.</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-white border border-[#FCA5A5] text-[#B91C1C] px-3 py-1 text-[12px] font-semibold"
              >
                <Bell className="w-3 h-3" />
                Notify when available
              </button>
            </div>
          )}

          {/* Cap reached */}
          {selected && capReached && !outOfStock && (
            <div className="mt-4 rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-3 text-[13px] text-[#B45309]">
              You&apos;ve reached this denomination&apos;s monthly cap of {monthlyCap}. Resets on{' '}
              <strong>{nextMonthResetLabel()}</strong>.
            </div>
          )}

          {/* Monthly cap hint — quantity is fixed at 1 per redemption
              (2026-05-26 UX decision); members redeem the same brand
              multiple times to get more gift cards. */}
          {selected && !outOfStock && !capReached && monthlyCap > 1 && (
            <p className="mt-4 text-[12px] text-[#667085]">
              Up to {monthlyCap} per month for this denomination · {remainingCap} left.
            </p>
          )}
        </section>

        {/* Cost calc + Balance + CTA */}
        {selected && (
          <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#667085]">Points required</span>
              <span className="text-[20px] font-extrabold tabular-nums text-[#0F1222]">
                {formatPts(totalPoints)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#9097A8]">Total face value</span>
              <span className="text-[13px] font-semibold tabular-nums text-[#667085]">
                {formatAud(totalAud)}
              </span>
            </div>
            <BalanceRow
              currentPoints={balance.pointsAvailable}
              pointsRequired={totalPoints}
            />

            <PrimaryCta
              canRedeem={canRedeem}
              loginRequired={loginRequired}
              memberLocked={!!memberLocked}
              insufficient={insufficient}
              outOfStock={outOfStock}
              capReached={capReached}
              onRedeem={() => setReviewOpen(true)}
            />
          </section>
        )}

        {!selected && (
          <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5 space-y-3">
            <p className="text-[13px] text-[#667085] text-center">
              Pick a denomination above to lock in your gift card.
            </p>
            <button
              type="button"
              onClick={handleStartRedeem}
              className="w-full inline-flex items-center justify-center rounded-full bg-[#F4F1FB] text-[#5648D8] hover:bg-[#E7DFFF] px-5 py-3 text-[14px] font-bold transition-colors"
            >
              Redeem Gift Card
            </button>
          </section>
        )}

        {/* How it works */}
        <section className="rounded-3xl border border-[#E7E9F2] bg-white p-5">
          <h2 className="text-[16px] font-extrabold tracking-tight text-[#0F1222]">How it works</h2>
          <ol className="mt-3 space-y-3">
            {[
              { t: 'Pick a denomination', b: 'Your Points balance covers the redemption — no AUD payment.' },
              { t: 'Confirm and redeem', b: 'Points are debited only after the code is secured.' },
              { t: 'Use your code', b: 'Apply at checkout in-store or online. Valid for 2+ years.' },
            ].map((step, i) => (
              <li key={step.t} className="flex gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F6F4FF] text-[#5648D8] text-[12px] font-extrabold">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[14px] font-bold text-[#0F1222]">{step.t}</div>
                  <p className="text-[13px] text-[#667085]">{step.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Accordions */}
        <section className="rounded-3xl border border-[#E7E9F2] bg-white divide-y divide-[#F1ECFB]">
          <Accordion
            label="Terms"
            open={openAccordion === 'terms'}
            onToggle={() => setOpenAccordion((v) => (v === 'terms' ? null : 'terms'))}
          >
            <p className="text-[13px] text-[#667085] whitespace-pre-line">{brand.terms}</p>
          </Accordion>
          <Accordion
            label="FAQ"
            open={openAccordion === 'faq'}
            onToggle={() => setOpenAccordion((v) => (v === 'faq' ? null : 'faq'))}
          >
            {brand.faq.length === 0 ? (
              <p className="text-[13px] text-[#667085]">No FAQs yet for this brand.</p>
            ) : (
              <ul className="space-y-3">
                {brand.faq.map((f) => (
                  <li key={f.q}>
                    <div className="text-[13px] font-bold text-[#0F1222]">{f.q}</div>
                    <p className="text-[13px] text-[#667085]">{f.a}</p>
                  </li>
                ))}
              </ul>
            )}
          </Accordion>
        </section>

        {/* Trust row */}
        <section className="rounded-3xl border border-[#E7E9F2] bg-[#FBFAFF] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TrustChip icon={<ShieldCheck className="w-4 h-4" />} title="Powered by Prezzee" body="Australia's leading digital gift card platform — UNICASH never sees your gift code." />
            <TrustChip icon={<Clock className="w-4 h-4" />} title="2-year validity" body="Plenty of time to spend." />
            <TrustChip icon={<Sparkles className="w-4 h-4" />} title="No hidden fees" body="Face value at checkout." />
          </div>
        </section>
      </div>

      {/* Sticky bottom CTA — mobile only, when a denomination is picked */}
      {selected && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-10 border-t border-[#E7E9F2] p-3">
          <div aria-hidden className="absolute inset-0 -z-10 bg-white/80 backdrop-blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-[#667085]">Points required</div>
              <div className="text-[18px] font-extrabold tabular-nums text-[#0F1222]">
                {formatPts(totalPoints)}
              </div>
            </div>
            <PrimaryCta
              compact
              canRedeem={canRedeem}
              loginRequired={loginRequired}
              memberLocked={!!memberLocked}
              insufficient={insufficient}
              outOfStock={outOfStock}
              capReached={capReached}
              onRedeem={() => setReviewOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Review modal — Phase G3 CheckoutFlow drives review → processing →
          success / on hold / failure inline. Modal frame supplied here so
          the BottomSheet primary/secondary actions slot stays empty; the
          flow renders its own per-step CTAs. */}
      <BottomSheet
        open={reviewOpen && !!selected}
        onClose={() => setReviewOpen(false)}
        title="Review redemption"
      >
        {selected && (
          <CheckoutFlow
            brand={brand}
            denomination={selected}
            quantity={quantity}
            balance={balance}
            onClose={() => setReviewOpen(false)}
          />
        )}
      </BottomSheet>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Local subcomponents
   ────────────────────────────────────────────────────────────── */

function PrimaryCta({
  canRedeem,
  loginRequired,
  memberLocked,
  insufficient,
  outOfStock,
  capReached,
  onRedeem,
  compact,
}: {
  canRedeem: boolean;
  loginRequired: boolean;
  memberLocked: boolean;
  insufficient: boolean;
  outOfStock: boolean;
  capReached: boolean;
  onRedeem: () => void;
  compact?: boolean;
}) {
  const base = compact
    ? 'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[13px] font-bold transition-colors'
    : 'w-full inline-flex items-center justify-center rounded-full px-5 py-3 text-[14px] font-bold transition-colors';

  if (loginRequired) {
    return (
      <Link href="/login" className={`${base} bg-[#6356E5] text-white hover:bg-[#5648D8]`}>
        Log in to redeem
      </Link>
    );
  }
  if (memberLocked) {
    return (
      <Link href="/dashboard/membership" className={`${base} bg-[#6356E5] text-white hover:bg-[#5648D8]`}>
        Join UNICASH
      </Link>
    );
  }
  if (outOfStock) {
    return (
      <button type="button" disabled className={`${base} bg-[#F4F1FB] text-[#94A3B8] cursor-not-allowed`}>
        Out of stock
      </button>
    );
  }
  if (capReached) {
    return (
      <button type="button" disabled className={`${base} bg-[#F4F1FB] text-[#94A3B8] cursor-not-allowed`}>
        Monthly cap reached
      </button>
    );
  }
  if (insufficient) {
    return compact ? (
      <Link href="/boost-packs" className={`${base} bg-[#6356E5] text-white hover:bg-[#5648D8]`}>
        Buy Point Booster
      </Link>
    ) : (
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <Link
          href="/boost-packs"
          className="flex-1 inline-flex items-center justify-center rounded-full bg-[#6356E5] text-white hover:bg-[#5648D8] px-5 py-3 text-[14px] font-bold transition-colors"
        >
          Buy Point Booster
        </Link>
        <Link
          href="/scan-receipts"
          className="flex-1 inline-flex items-center justify-center rounded-full border border-[#E7E9F2] bg-white text-[#0F1222] hover:bg-[#F6F4FF] px-5 py-3 text-[14px] font-bold transition-colors"
        >
          Scan Receipts
        </Link>
      </div>
    );
  }
  if (!canRedeem) {
    return (
      <button type="button" disabled className={`${base} bg-[#F4F1FB] text-[#94A3B8] cursor-not-allowed`}>
        Select a denomination
      </button>
    );
  }
  return (
    <button type="button" onClick={onRedeem} className={`${base} bg-[#6356E5] text-white hover:bg-[#5648D8]`}>
      Redeem Gift Cards
    </button>
  );
}

function Accordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-[14px] font-bold text-[#0F1222]">{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#667085] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function TrustChip({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F6F4FF] text-[#6356E5]">
        {icon}
      </span>
      <div>
        <div className="text-[13px] font-bold text-[#0F1222]">{title}</div>
        <p className="text-[12px] text-[#667085]">{body}</p>
      </div>
    </div>
  );
}
