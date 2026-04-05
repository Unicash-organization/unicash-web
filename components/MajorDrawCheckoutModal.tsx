'use client';

import React, { useEffect, useState } from 'react';
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

export default function MajorDrawCheckoutModal({
  isOpen,
  onClose,
  drawId,
  drawTitle,
  packageSnapshot,
}: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingIntent, setLoadingIntent] = useState(false);

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

  if (!isOpen || !packageSnapshot) {
    return null;
  }

  const entries = Math.floor(Number(packageSnapshot.entryCount ?? 0));
  const price = Number(packageSnapshot.price ?? 0);

  /** Same rules as checkout `validateInfo` (phone: digits only, 10 chars, starts with 04). */
  const validateInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
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
    if (!ok) {
      setFormError(null);
    }
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

  const handleContinueToPay = async () => {
    if (!validateInfo()) return;
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl bg-[#faf8f5] border border-stone-200">
        {/* Header — maroon band inspired by reference */}
        <div className="relative bg-[#7A3036] text-white px-4 pt-10 pb-4 rounded-t-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white text-lg"
            aria-label="Close"
          >
            ×
          </button>
          <p className="text-center text-xs uppercase tracking-widest opacity-90 mb-1">UniCash</p>
          <h2 className="text-center text-lg sm:text-xl font-bold leading-tight px-2">
            LOCK IN{' '}
            <span className="inline-flex items-center justify-center mx-1 w-10 h-10 rounded-full bg-orange-500 text-white text-base">
              {entries}
            </span>{' '}
            ENTRIES
          </h2>
          <p className="text-center text-xs text-white/80 mt-2">Your purchase supports</p>
          <p className="text-center text-[11px] text-white/70 mt-1 line-clamp-2">{drawTitle}</p>

          <div className="flex gap-2 mt-4" role="tablist" aria-label="Checkout steps">
            <button
              type="button"
              role="tab"
              aria-selected={step === 1}
              onClick={goToStep1}
              className={`flex-1 text-center text-[10px] font-bold py-2 rounded-lg border transition cursor-pointer ${
                step === 1 ? 'bg-white text-[#7A3036] border-white' : 'border-white/40 text-white/90 hover:bg-white/10'
              }`}
            >
              1 ENTER DETAILS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={step === 2}
              disabled={!clientSecret || !paymentId}
              onClick={goToStep2}
              className={`flex-1 text-center text-[10px] font-bold py-2 rounded-lg border transition ${
                !clientSecret || !paymentId
                  ? 'border-white/25 text-white/50 cursor-not-allowed'
                  : step === 2
                    ? 'bg-white text-[#7A3036] border-white cursor-pointer'
                    : 'border-white/40 text-white/90 hover:bg-white/10 cursor-pointer'
              }`}
            >
              2 BILLING INFO
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-[#faf8f5]">
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
                  className={`w-full rounded-xl border px-4 py-3 text-gray-900 placeholder:text-gray-400 ${
                    fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-stone-300'
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>
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
                  className={`w-full rounded-xl border px-4 py-3 text-gray-900 placeholder:text-gray-400 ${
                    fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-stone-300'
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>
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
                  className={`w-full rounded-xl border px-4 py-3 text-gray-900 placeholder:text-gray-400 ${
                    fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-stone-300'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.phone}</p>
                )}
              </div>
              <div>
                {user?.email && (
                  <p className="text-xs text-stone-600 mb-1">
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
                  className={`w-full rounded-xl border px-4 py-3 text-gray-900 placeholder:text-gray-400 ${
                    fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-stone-300'
                  } ${user?.email ? 'bg-stone-100 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.email && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <button
                type="button"
                disabled={loadingIntent}
                onClick={handleContinueToPay}
                className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 uppercase tracking-wide disabled:opacity-50"
              >
                {loadingIntent ? 'Please wait…' : 'Click to enter now'}
              </button>
            </div>
          )}

          {step === 2 && clientSecret && paymentId && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-stone-700 border-b border-stone-200 pb-3">
                <span className="font-semibold uppercase">{packageSnapshot.tierName || 'Package'}</span>
                <span className="font-bold">${Number(amountAud).toFixed(2)} AUD</span>
              </div>
              {savedCards.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-stone-800 mb-2">Payment method</h3>
                  <div className="space-y-2">
                    {savedCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${
                          payWithSavedId === card.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="majorDrawPayWithCard"
                          checked={payWithSavedId === card.id}
                          onChange={() => setPayWithSavedId(card.id)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-medium text-gray-900 text-sm">
                          {card.brand.toUpperCase()} •••• {card.last4}
                          {card.isDefault && (
                            <span className="ml-2 text-xs text-orange-700 font-normal">(Default)</span>
                          )}
                        </span>
                      </label>
                    ))}
                    <label
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${
                        payWithSavedId === null
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="majorDrawPayWithCard"
                        checked={payWithSavedId === null}
                        onChange={() => setPayWithSavedId(null)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="font-medium text-gray-900 text-sm">Use a new card</span>
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
      </div>
    </div>
  );
}
