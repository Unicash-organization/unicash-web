'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatAustralianPhone,
  displayAustralianPhoneFromStored,
} from '@/lib/australianPhone';

export type LandingPackageSnapshot = {
  id?: string;
  tierName?: string;
  entryCount?: number;
  oldEntryCount?: number;
  price?: number;
  cardTheme?: string;
  sortOrder?: number;
  ctaUrl?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  drawId: string;
  drawTitle: string;
  packageSnapshot: LandingPackageSnapshot | null;
};

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);
const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const SpinnerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" fill="none" />
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
const TrophyIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default function MajorDrawCheckoutModal({
  isOpen,
  onClose,
  drawId,
  drawTitle,
  packageSnapshot,
}: Props) {
  /* ===== Logic preserved exactly ===== */
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [intentCreated, setIntentCreated] = useState(false);
  const [intentPackageKey, setIntentPackageKey] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [amountAud, setAmountAud] = useState<number>(0);

  const [savedCards, setSavedCards] = useState<
    {
      id: string;
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
      isDefault: boolean;
    }[]
  >([]);
  const [payWithSavedId, setPayWithSavedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormError(null);
      setFieldErrors({});
      setLoadingIntent(false);
      setSavedCards([]);
      setPayWithSavedId(null);
      return;
    }
    if (user?.email) {
      setEmail(user.email);
    }
    const u = user as { firstName?: string; lastName?: string; phone?: string } | null;
    const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
    if (name) {
      const parts = name.split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    if (u?.phone) {
      setMobile(displayAustralianPhoneFromStored(u.phone));
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || !user?.id) {
      setSavedCards([]);
      setPayWithSavedId(null);
      return;
    }
    api.payments
      .listPaymentMethods()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setSavedCards(list);
        const defaultCard = list.find((c: { isDefault: boolean }) => c.isDefault) ?? list[0];
        setPayWithSavedId(defaultCard?.id ?? null);
      })
      .catch(() => {
        setSavedCards([]);
        setPayWithSavedId(null);
      });
  }, [isOpen, user?.id]);

  if (!isOpen || !packageSnapshot || !mounted) {
    return null;
  }

  const entries = Math.floor(Number(packageSnapshot.entryCount ?? 0));
  const price = Number(packageSnapshot.price ?? 0);
  const currentPackageKey = `${drawId}:${packageSnapshot.id || ''}:${entries}:${price}`;

  if (intentCreated && intentPackageKey && intentPackageKey !== currentPackageKey) {
    setIntentCreated(false);
    setIntentPackageKey(null);
    setClientSecret(null);
    setPaymentId(null);
    setAmountAud(0);
  }

  const validateInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!mobile.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleaned = mobile.replace(/\D/g, '');
      if (cleaned.length !== 10 || !cleaned.startsWith('04')) {
        newErrors.phone = 'Please enter a valid mobile number (04XX XXX XXX)';
      }
    }
    setFieldErrors(newErrors);
    const ok = Object.keys(newErrors).length === 0;
    if (!ok) setFormError(null);
    return ok;
  };

  const goToStep1 = () => {
    setStep(1);
    setFormError(null);
  };

  const goToStep2 = () => {
    if (clientSecret && paymentId) {
      setStep(2);
      setFormError(null);
    }
  };

  const handleContinueToPay = async () => {
    if (!validateInfo()) return;
    if (intentCreated && clientSecret && paymentId) {
      setStep(2);
      return;
    }
    if (loadingIntent || intentCreated) return;
    setLoadingIntent(true);
    setFormError(null);
    try {
      const cleanedPhone = mobile.replace(/\D/g, '');
      const snapshot = JSON.parse(JSON.stringify(packageSnapshot)) as Record<string, unknown>;
      const res = await api.payments.createMajorDrawLandingPaymentIntent({
        drawId,
        packageSnapshot: snapshot,
        customerEmail: email.trim().toLowerCase(),
        customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        customerPhone: cleanedPhone,
      });
      const data = res.data as { clientSecret: string; paymentId: string; amount: number };
      setClientSecret(data.clientSecret);
      setPaymentId(data.paymentId);
      setAmountAud(Number(data.amount));
      setIntentCreated(true);
      setIntentPackageKey(currentPackageKey);
      setStep(2);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Could not start payment. Please try again.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoadingIntent(false);
    }
  };

  /* ===== v4 input class helper ===== */
  const inputCls = (hasError: boolean, readOnly = false) =>
    `w-full rounded-2xl border px-4 py-3.5 text-[14.5px] text-[#0F1222] placeholder:text-[#A3A8BE] transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${
      hasError
        ? 'border-[#FCA5A5] bg-[#FEF2F2] focus:border-[#EF4444] focus:ring-[#EF4444]/30'
        : readOnly
          ? 'border-[#E7E9F2] bg-[#F4F1FB]/40 cursor-not-allowed'
          : 'border-[#E0DAFF] bg-[#FBFAFF] hover:bg-white focus:border-[#6356E5] focus:bg-white focus:ring-[#6356E5]/30'
    }`;

  return createPortal(
    <div
      className="uc-mdc-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mdc-title"
      onClick={onClose}
    >
      <div
        className="uc-mdc-modal relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:max-h-[90vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[#E0DAFF]" />
        </div>

        {/* Hero band — v4 purple gradient with trophy icon + entries pill */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#5346d6] via-[#6356e5] to-[#7b6cec] px-6 pb-5 pt-7 text-center sm:px-7 sm:pb-6 sm:pt-8">
          <div aria-hidden className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFE2B0]/15 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 right-[-10%] h-36 w-36 rounded-full bg-[#8B7BFF]/30 blur-2xl" />

          {/* Close (X) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/85 backdrop-blur transition-colors hover:bg-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
            <TrophyIcon className="h-7 w-7 text-[#FFE2B0]" />
          </span>

          <p className="relative mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFE2B0]">
            Major Draw
          </p>
          <h2 id="mdc-title" className="relative mt-1 text-[20px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[22px]">
            Lock in <span className="bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] bg-clip-text text-transparent">{entries.toLocaleString()}</span> {entries === 1 ? 'entry' : 'entries'}
          </h2>
          {drawTitle && (
            <p className="relative mt-1 text-[12px] text-white/75 line-clamp-2">{drawTitle}</p>
          )}
        </div>

        {/* Step indicator */}
        <div className="shrink-0 border-b border-[#E7E9F2] bg-white px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2" role="tablist" aria-label="Checkout steps">
            <button
              type="button"
              role="tab"
              aria-selected={step === 1}
              onClick={goToStep1}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                step === 1
                  ? 'bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]'
                  : step === 2
                    ? 'bg-[#ECFDF5] text-[#10B981] ring-1 ring-[#A7F3D0]'
                    : 'bg-white text-[#667085] ring-1 ring-[#E7E9F2]'
              }`}
            >
              {step === 2 ? <CheckIcon className="h-3 w-3" /> : <span>1</span>}
              Your details
            </button>
            <span aria-hidden className="h-px w-3 bg-[#E0DAFF]" />
            <button
              type="button"
              role="tab"
              aria-selected={step === 2}
              disabled={!clientSecret || !paymentId}
              onClick={goToStep2}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                !clientSecret || !paymentId
                  ? 'bg-white text-[#A3A8BE] ring-1 ring-[#E7E9F2] cursor-not-allowed'
                  : step === 2
                    ? 'bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]'
                    : 'bg-white text-[#667085] ring-1 ring-[#E7E9F2] hover:text-[#6356E5]'
              }`}
            >
              <span>2</span>
              Payment
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#FBFAFF] px-5 py-5 sm:px-6 sm:py-6">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="First name*"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (fieldErrors.firstName) {
                      setFieldErrors((prev) => ({ ...prev, firstName: '' }));
                    }
                  }}
                  className={inputCls(!!fieldErrors.firstName)}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#EF4444]">
                    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last name*"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (fieldErrors.lastName) {
                      setFieldErrors((prev) => ({ ...prev, lastName: '' }));
                    }
                  }}
                  className={inputCls(!!fieldErrors.lastName)}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#EF4444]">
                    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="Mobile number* (04XX XXX XXX)"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(formatAustralianPhone(e.target.value));
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }
                  }}
                  className={inputCls(!!fieldErrors.phone)}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#EF4444]">
                    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
              <div>
                {user?.email && (
                  <p className="mb-1.5 text-[11.5px] text-[#667085]">
                    Purchasing as your logged-in account. To use a different email, log out first.
                  </p>
                )}
                <input
                  type="email"
                  placeholder="Email address*"
                  value={email}
                  readOnly={!!user?.email}
                  aria-readonly={!!user?.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  className={inputCls(!!fieldErrors.email, !!user?.email)}
                />
                {fieldErrors.email && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#EF4444]">
                    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {formError && (
                <div className="rounded-2xl bg-[#FEF2F2] p-3.5 ring-1 ring-[#FCA5A5]/60">
                  <div className="flex items-start gap-2">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                    <p className="text-[13px] text-[#991B1B]">{formError}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={loadingIntent}
                onClick={handleContinueToPay}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingIntent ? (
                  <>
                    <SpinnerIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    Please wait…
                  </>
                ) : intentCreated ? (
                  <>
                    Continue to payment
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue to payment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && clientSecret && paymentId && (
            <div className="space-y-4">
              {/* Package summary */}
              <div className="flex items-center justify-between rounded-2xl border border-[#E0DAFF] bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
                    {packageSnapshot.tierName || 'Package'}
                  </p>
                  <p className="-mt-0.5 truncate text-[14px] font-extrabold tracking-tight text-[#0F1222]">
                    {entries.toLocaleString()} {entries === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <p className="shrink-0 text-[16px] font-extrabold tracking-tight text-[#6356E5]">
                  ${Number(amountAud).toFixed(2)}<span className="ml-1 text-[11px] font-semibold text-[#667085]">AUD</span>
                </p>
              </div>

              {savedCards.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[12.5px] font-extrabold tracking-tight text-[#0F1222]">Payment method</h3>
                  <div className="space-y-2">
                    {savedCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${
                          payWithSavedId === card.id
                            ? 'border-[#6356E5] bg-[#F4F1FB]'
                            : 'border-[#E7E9F2] bg-white hover:border-[#c8c5ea]'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            payWithSavedId === card.id ? 'border-[#6356E5] bg-[#6356E5]' : 'border-[#cfc8e8] bg-white'
                          }`}
                        >
                          {payWithSavedId === card.id && <CheckIcon className="h-3 w-3 text-white" />}
                        </span>
                        <input
                          type="radio"
                          name="majorDrawPayWithCard"
                          checked={payWithSavedId === card.id}
                          onChange={() => setPayWithSavedId(card.id)}
                          className="sr-only"
                        />
                        <span className="text-[13.5px] font-semibold text-[#0F1222]">
                          {card.brand.toUpperCase()} •••• {card.last4}
                          {card.isDefault && (
                            <span className="ml-2 text-[11px] font-medium text-[#6356E5]">Default</span>
                          )}
                        </span>
                      </label>
                    ))}
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${
                        payWithSavedId === null
                          ? 'border-[#6356E5] bg-[#F4F1FB]'
                          : 'border-[#E7E9F2] bg-white hover:border-[#c8c5ea]'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          payWithSavedId === null ? 'border-[#6356E5] bg-[#6356E5]' : 'border-[#cfc8e8] bg-white'
                        }`}
                      >
                        {payWithSavedId === null && <CheckIcon className="h-3 w-3 text-white" />}
                      </span>
                      <input
                        type="radio"
                        name="majorDrawPayWithCard"
                        checked={payWithSavedId === null}
                        onChange={() => setPayWithSavedId(null)}
                        className="sr-only"
                      />
                      <span className="text-[13.5px] font-semibold text-[#0F1222]">Use a new card</span>
                    </label>
                  </div>
                </div>
              )}

              <StripeCheckoutForm
                key={`${user?.id || 'guest'}-${paymentId}-${payWithSavedId ?? 'new'}`}
                clientSecret={clientSecret}
                paymentId={paymentId}
                amount={amountAud}
                currency="AUD"
                buttonText="Complete payment"
                guestLandingFlow={!user}
                onGuestLandingPurchaseComplete={onClose}
                savedPaymentMethod={
                  payWithSavedId
                    ? (() => {
                        const c = savedCards.find((x) => x.id === payWithSavedId);
                        return c ? { id: c.id, brand: c.brand, last4: c.last4 } : null;
                      })()
                    : null
                }
              />
            </div>
          )}
        </div>

        {/* Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes uc-mdc-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes uc-mdc-scale-in {
            from { transform: scale(0.96); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
          @keyframes uc-mdc-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .uc-mdc-modal    { animation: uc-mdc-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
          .uc-mdc-backdrop { animation: uc-mdc-fade-in 220ms ease-out; }
          @media (min-width: 640px) {
            .uc-mdc-modal  { animation: uc-mdc-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-mdc-modal,
            .uc-mdc-backdrop { animation: none !important; }
          }
        ` }} />
      </div>
    </div>,
    document.body,
  );
}
