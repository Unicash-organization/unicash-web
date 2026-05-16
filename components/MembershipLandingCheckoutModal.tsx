'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import api from '@/lib/api';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatAustralianPhone,
  displayAustralianPhoneFromStored,
} from '@/lib/australianPhone';

export type MembershipPlanPick = {
  id: string;
  name: string;
  priceMonthly: number | string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  plan: MembershipPlanPick | null;
  /** Shown in header under title */
  subtitle?: string;
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

export default function MembershipLandingCheckoutModal({
  isOpen,
  onClose,
  plan,
  subtitle = 'Membership',
}: Props) {
  /* ===== Logic preserved exactly ===== */
  const { user, login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingIntent, setLoadingIntent] = useState(false);

  // RESUME-1 — when the typed email maps to a user that has NO active
  // membership (abandoned signup, cancelled member returning, etc.) the
  // modal flips into 'resume' mode: the name/phone fields hide, a single
  // password field appears, and the CTA becomes "Log in & continue".
  // Resetting to null on email change keeps the flow predictable.
  const [resumeMode, setResumeMode] = useState<null | 'login' | 'blocked'>(null);
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

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
      setClientSecret(null);
      setPaymentId(null);
      setAmountAud(0);
      setLoadingIntent(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setMobile('');
      setSavedCards([]);
      setPayWithSavedId(null);
      // RESUME-1 — also reset resume-mode state when modal closes.
      setResumeMode(null);
      setPassword('');
      setResetSent(false);
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

  if (!isOpen || !plan || !mounted) {
    return null;
  }

  const priceNum = parseFloat(String(plan.priceMonthly ?? 0)) || 0;

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
    setClientSecret(null);
    setPaymentId(null);
    setAmountAud(0);
    setFormError(null);
  };

  const goToStep2 = () => {
    if (clientSecret && paymentId) {
      setStep(2);
      setFormError(null);
    }
  };

  // RESUME-1 — kicks off the Stripe checkout intent. Shared between the
  // "new signup" and "resume after login" paths so the Stripe creation
  // logic lives in exactly one place.
  const createPaymentIntent = async () => {
    setLoadingIntent(true);
    setFormError(null);
    try {
      const cleanedPhone = mobile.replace(/\D/g, '');
      const res = await api.payments.createMembershipPaymentIntent({
        planId: plan.id,
        customerEmail: email.trim().toLowerCase(),
        customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        customerPhone: cleanedPhone,
      });
      const data = res.data as { clientSecret: string; paymentId: string };
      setClientSecret(data.clientSecret);
      setPaymentId(data.paymentId);
      setAmountAud(priceNum);
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

  const handleContinueToPay = async () => {
    if (!validateInfo()) return;

    // Already logged in → skip email lookup, straight to Stripe.
    if (user?.id) {
      await createPaymentIntent();
      return;
    }

    // RESUME-1 — branch on the rich /auth/check-email response. Three
    // outcomes:
    //   1. No account     → continue new-signup flow (handled by Stripe
    //                       create-intent + post-payment register hook)
    //   2. Can resume     → flip to login mode, gather password, then
    //                       re-enter the Stripe flow
    //   3. Already member → block with a clear "you're already a member"
    //                       message + login link
    try {
      const checkRes = await api.auth.checkEmail(email.trim());
      const data = checkRes.data ?? {
        exists: false,
        hasActiveMembership: false,
        canResumeCheckout: false,
      };

      if (data.exists && data.hasActiveMembership) {
        setResumeMode('blocked');
        setFormError(null);
        return;
      }

      if (data.exists && data.canResumeCheckout) {
        setResumeMode('login');
        setFormError(null);
        return;
      }
      // Falls through: new account → carry on with Stripe intent.
    } catch {
      // Throttled or network failure → optimistically proceed. The
      // backend has its own membership guard at /payments/checkout/membership
      // that re-checks status, so the worst case is a clean 400 later.
    }

    await createPaymentIntent();
  };

  // RESUME-1 — logs in with the existing password, then jumps straight to
  // the Stripe intent. We do NOT validate the name/phone fields here
  // because in login-mode they are intentionally hidden — the existing
  // account already has those.
  const handleLoginAndContinue = async () => {
    if (!password.trim()) {
      setFormError('Enter your password to continue.');
      return;
    }
    setLoadingIntent(true);
    setFormError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      // login() updates AuthContext.user → next render rehydrates the
      // form with firstName/lastName/phone from the user record (see the
      // existing useEffect on `user`). Push straight to payment intent.
      await createPaymentIntent();
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string'
          ? e.message
          : 'Incorrect password. Try again or reset your password below.';
      setFormError(msg);
    } finally {
      setLoadingIntent(false);
    }
  };

  // RESUME-1 — fires a password-reset email so the user can recover the
  // existing account without losing their place in the checkout flow.
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setFormError('Enter your email first.');
      return;
    }
    setFormError(null);
    try {
      await api.auth.requestPasswordReset(email.trim().toLowerCase());
      setResetSent(true);
    } catch {
      // Endpoint is intentionally vague — always shows "sent" to avoid
      // enumeration. We mirror that on the client.
      setResetSent(true);
    }
  };

  /* ===== v4 input class helper ===== */
  const inputCls = (hasError: boolean) =>
    `w-full rounded-2xl border px-4 py-3.5 text-[14.5px] text-[#0F1222] placeholder:text-[#A3A8BE] transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${
      hasError
        ? 'border-[#FCA5A5] bg-[#FEF2F2] focus:border-[#EF4444] focus:ring-[#EF4444]/30'
        : 'border-[#E0DAFF] bg-[#FBFAFF] hover:bg-white focus:border-[#6356E5] focus:bg-white focus:ring-[#6356E5]/30'
    }`;

  return createPortal(
    <div
      className="uc-mlc-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-[#0F1222]/55 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mlc-title"
      onClick={onClose}
    >
      <div
        className="uc-mlc-modal relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,18,34,0.55)] sm:max-h-[90vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[#E0DAFF]" />
        </div>

        {/* Hero band — purple gradient with plan name + price */}
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

          <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFE2B0]">
            UNICASH Membership
          </p>
          <h2 id="mlc-title" className="relative mt-1 text-[20px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[22px]">
            {plan.name}
          </h2>
          <p className="relative mt-1.5 text-[14px] font-bold text-white">
            ${priceNum.toFixed(2)}<span className="ml-1 text-[12px] font-medium text-white/75">AUD / month</span>
          </p>
          {subtitle && (
            <p className="relative mt-1 text-[11px] text-white/65 line-clamp-2">{subtitle}</p>
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
          {/* RESUME-1 — "already a member" terminal state. No form, just
              context + login link. Member can dismiss by editing the email. */}
          {step === 1 && resumeMode === 'blocked' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F4F1FB] p-4 ring-1 ring-[#E0DAFF]">
                <p className="text-[14px] font-bold text-[#0F1222]">
                  You&apos;re already a UNICASH member
                </p>
                <p className="mt-1 text-[13px] text-[#667085]">
                  The email <span className="font-semibold text-[#0F1222]">{email}</span>{' '}
                  has an active membership. Log in to manage your benefits, scan
                  receipts, or join Bonus Draws.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] hover:from-[#5346D6] hover:to-[#7867EC]"
              >
                Log in to your account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResumeMode(null);
                  setEmail('');
                  setFormError(null);
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-5 text-[13.5px] font-bold text-[#6356E5] ring-1 ring-[#E0DAFF] hover:bg-[#F4F1FB]"
              >
                Use a different email
              </button>
            </div>
          )}

          {/* RESUME-1 — inline login. Shown when the email maps to an
              existing user with no active membership. Hides the name/phone
              fields (we already have them from the account) and asks only
              for the password. */}
          {step === 1 && resumeMode === 'login' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#FFF8EC] p-3.5 ring-1 ring-[#FFE2B0]">
                <p className="text-[13px] font-semibold text-[#0F1222]">
                  Welcome back
                </p>
                <p className="mt-0.5 text-[12.5px] text-[#667085]">
                  We found your account. Enter your password to continue with{' '}
                  <span className="font-semibold text-[#0F1222]">{plan.name}</span>.
                </p>
              </div>

              <div>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className={`${inputCls(false)} cursor-not-allowed bg-[#F4F1FB] text-[#667085]`}
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password*"
                  value={password}
                  autoFocus
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loadingIntent) handleLoginAndContinue();
                  }}
                  className={inputCls(false)}
                />
              </div>

              {formError && (
                <div className="rounded-2xl bg-[#FEF2F2] p-3.5 ring-1 ring-[#FCA5A5]/60">
                  <div className="flex items-start gap-2">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                    <p className="text-[13px] text-[#991B1B]">{formError}</p>
                  </div>
                </div>
              )}

              {resetSent ? (
                <div className="rounded-2xl bg-[#ECFDF5] p-3 ring-1 ring-[#A7F3D0]">
                  <p className="text-[12.5px] text-[#065F46]">
                    If an account exists for <span className="font-semibold">{email}</span>,
                    we&apos;ve sent a password reset link. Check your inbox.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[12.5px] font-semibold text-[#6356E5] hover:underline"
                >
                  Forgot your password?
                </button>
              )}

              <button
                type="button"
                disabled={loadingIntent}
                onClick={handleLoginAndContinue}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingIntent ? (
                  <>
                    <SpinnerIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    Logging you in…
                  </>
                ) : (
                  <>
                    Log in &amp; continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResumeMode(null);
                  setPassword('');
                  setResetSent(false);
                  setFormError(null);
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-5 text-[13px] font-semibold text-[#667085] ring-1 ring-[#E7E9F2] hover:text-[#6356E5]"
              >
                Use a different email
              </button>
            </div>
          )}

          {step === 1 && resumeMode === null && (
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
                <input
                  type="email"
                  placeholder="Email address*"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  className={inputCls(!!fieldErrors.email)}
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
                    <div className="text-[13px] text-[#991B1B]">
                      <p>{formError}</p>
                      {formError.includes('already registered') && (
                        <Link href="/login" className="mt-1 inline-block font-bold text-[#6356E5] underline">
                          Go to login
                        </Link>
                      )}
                    </div>
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
              {/* Plan summary */}
              <div className="flex items-center justify-between rounded-2xl border border-[#E0DAFF] bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Plan</p>
                  <p className="-mt-0.5 truncate text-[14px] font-extrabold tracking-tight text-[#0F1222]">
                    {plan.name}
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
                          name="membershipLandingPayWithCard"
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
                        name="membershipLandingPayWithCard"
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
          @keyframes uc-mlc-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes uc-mlc-scale-in {
            from { transform: scale(0.96); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
          @keyframes uc-mlc-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .uc-mlc-modal    { animation: uc-mlc-slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1); }
          .uc-mlc-backdrop { animation: uc-mlc-fade-in 220ms ease-out; }
          @media (min-width: 640px) {
            .uc-mlc-modal  { animation: uc-mlc-scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-mlc-modal,
            .uc-mlc-backdrop { animation: none !important; }
          }
        ` }} />
      </div>
    </div>,
    document.body,
  );
}
