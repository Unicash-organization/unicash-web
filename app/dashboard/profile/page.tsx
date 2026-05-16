'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import LoadingRing from '@/components/LoadingRing';

/* -----------------------------------------------------------------------
   Inline icons
----------------------------------------------------------------------- */
const Icon = {
  User: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Pin: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   Phone formatting helpers — preserved from original
----------------------------------------------------------------------- */
const formatAustralianPhone = (value: string): string => {
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length > 0 && !cleaned.startsWith('04')) {
    if (cleaned === '0' || cleaned.startsWith('04')) {
      // allow
    } else {
      return '';
    }
  }
  if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);
  if (cleaned.length > 6) return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  if (cleaned.length > 4) return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  return cleaned;
};

const denormalizePhoneNumber = (phone: string): string => {
  if (!phone?.trim()) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('614') && cleaned.length === 11) {
    return formatAustralianPhone(`0${cleaned.substring(2)}`);
  }
  if (cleaned.startsWith('04') && cleaned.length === 10) {
    return formatAustralianPhone(cleaned);
  }
  return phone;
};

const normalizePhoneNumber = (phone: string): string => {
  if (!phone?.trim()) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('04') && cleaned.length === 10) {
    return `+61${cleaned.substring(1)}`;
  }
  return phone;
};

const australianStates = [
  'Australian Capital Territory',
  'New South Wales',
  'Northern Territory',
  'Queensland',
  'South Australia',
  'Tasmania',
  'Victoria',
  'Western Australia',
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    streetAddress: '',
    city: '',
    state: '',
    postcode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [checkingNewsletter, setCheckingNewsletter] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  /* ===== Initial load — preserved logic ===== */
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: denormalizePhoneNumber((user as any).phone || ''),
        address: user.metadata?.address || '',
        streetAddress: user.metadata?.streetAddress || '',
        city: user.metadata?.city || '',
        state: user.metadata?.state || '',
        postcode: user.metadata?.postcode || '',
      });
      checkNewsletterStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkNewsletterStatus = async () => {
    if (!user) return;
    try {
      setCheckingNewsletter(true);
      const res = await api.newsletter.checkSubscription();
      setNewsletterSubscribed(res.data?.subscribed || false);
    } catch (error: any) {
      console.error('Error checking newsletter status:', error);
      setNewsletterSubscribed(false);
    } finally {
      setCheckingNewsletter(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to unsubscribe from the newsletter? You will no longer receive updates on Bonus Draws and Winners.')) {
      return;
    }
    try {
      setUnsubscribing(true);
      await api.newsletter.unsubscribe();
      setNewsletterSubscribed(false);
      showToast('Successfully unsubscribed from newsletter', 'success');
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      showToast(error.response?.data?.message || 'Failed to unsubscribe. Please try again.', 'error');
    } finally {
      setUnsubscribing(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.email) return;
    try {
      setSubscribing(true);
      await api.newsletter.subscribe(user.email);
      setNewsletterSubscribed(true);
      showToast('Successfully subscribed to newsletter!', 'success');
    } catch (error: any) {
      console.error('Error subscribing:', error);
      showToast(error.response?.data?.message || 'Failed to subscribe. Please try again.', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const validatePhone = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.phone.trim()) {
      const cleaned = formData.phone.replace(/\D/g, '');
      if (cleaned.length !== 10 || !cleaned.startsWith('04')) {
        newErrors.phone = 'Please enter a valid Australian mobile number (04XX XXX XXX)';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    setSaving(true);
    try {
      await api.users.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.trim() ? normalizePhoneNumber(formData.phone) : '',
        metadata: {
          address: formData.address,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
        },
      });
      await refreshUser();
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================================
     JSX — v4 redesign
  ===================================================================== */
  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <header>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">My profile</h1>
      </header>

      {/* ============================================================
          PERSONAL INFO CARD
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.User className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Personal info</p>
            <h2 className="mt-0.5 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Your details</h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <Field label="First name">
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-11 w-full rounded-2xl border border-[#E0DAFF] bg-white px-4 text-[14px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
            />
          </Field>
          <Field label="Last name">
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-11 w-full rounded-2xl border border-[#E0DAFF] bg-white px-4 text-[14px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
            />
          </Field>

          <Field
            label="Email"
            hint={
              <>
                Used for magic-link login.{' '}
                <Link
                  href="/contact"
                  className="font-semibold text-[#6356E5] underline-offset-2 transition-colors hover:text-[#5346D6] hover:underline focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-[#6356E5]/40 rounded-sm"
                >
                  Contact support
                </Link>{' '}
                to change.
              </>
            }
            className="sm:col-span-2"
          >
            <input
              type="email"
              value={formData.email}
              disabled
              className="h-11 w-full rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] px-4 text-base sm:text-[14px] text-[#667085]"
            />
          </Field>

          <Field
            label="Phone"
            hint="Australian mobile (04XX XXX XXX)"
            error={errors.phone}
            className="sm:col-span-2"
          >
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: formatAustralianPhone(e.target.value) });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="04XX XXX XXX"
              className={`h-11 w-full rounded-2xl border bg-white px-4 text-[14px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:outline-none focus:ring-2 ${
                errors.phone
                  ? 'border-[#FCA5A5] focus:border-[#EF4444] focus:ring-[#EF4444]/20'
                  : 'border-[#E0DAFF] focus:border-[#6356E5] focus:ring-[#6356E5]/20'
              }`}
            />
          </Field>
        </div>
      </article>

      {/* ============================================================
          ADDRESS CARD
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Pin className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Address</p>
            <h2 className="mt-0.5 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Where you live</h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <Field label="Address line" className="sm:col-span-2">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Apartment, suite, etc. (optional)"
              className="h-11 w-full rounded-2xl border border-[#E0DAFF] bg-white px-4 text-[14px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
            />
          </Field>
          <Field label="Street address" className="sm:col-span-2">
            <input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              className="h-11 w-full rounded-2xl border border-[#E0DAFF] bg-white px-4 text-[14px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
            />
          </Field>
          <Field label="City">
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="h-11 w-full rounded-2xl border border-[#E0DAFF] bg-white px-4 text-[14px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
            />
          </Field>
          <Field label="State / Territory">
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="h-11 w-full rounded-2xl border border-[#E0DAFF] bg-white px-4 text-[14px] text-[#0F1222] transition-colors focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
            >
              <option value="">Select state</option>
              {australianStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </Field>
          <Field label="Postcode">
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              placeholder="0000"
              className="h-11 w-full rounded-2xl border border-[#E0DAFF] bg-white px-4 text-[14px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
            />
          </Field>
        </div>
      </article>

      {/* ============================================================
          ACTIONS — sticky-ish at bottom of form
      ============================================================ */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-6 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex h-11 items-center rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5]"
        >
          Cancel
        </button>
      </div>

      {/* ============================================================
          NEWSLETTER CARD
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Communications</p>
            <h2 className="mt-0.5 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Newsletter</h2>
          </div>
        </div>

        {checkingNewsletter ? (
          <div className="mt-4 flex justify-center py-6">
            <LoadingRing size="sm" label="" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-[#FBFAFF] p-3.5 ring-1 ring-[#E0DAFF]">
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  newsletterSubscribed
                    ? 'bg-[#10B981] text-white'
                    : 'bg-white text-[#667085] ring-1 ring-[#E0DAFF]'
                }`}
              >
                {newsletterSubscribed ? (
                  <Icon.Check className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#A3A8BE]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-all text-[13px] font-semibold text-[#0F1222]">{user?.email}</p>
                <p className="mt-0.5 text-[12px] text-[#667085]">
                  {newsletterSubscribed
                    ? 'Subscribed — getting Bonus Draws and Winners updates.'
                    : 'Get updates on Bonus Draws, Winners, and member-only rewards.'}
                </p>
              </div>
            </div>

            {newsletterSubscribed ? (
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={unsubscribing}
                className="inline-flex h-10 items-center rounded-full border border-[#FCA5A5] bg-white px-4 text-[12.5px] font-bold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
              >
                {unsubscribing ? 'Unsubscribing…' : 'Unsubscribe'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing || !user?.email}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 text-[12.5px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] disabled:opacity-50"
              >
                {subscribing ? 'Subscribing…' : 'Subscribe to newsletter'}
              </button>
            )}
          </div>
        )}
      </article>
    </form>
  );
}

/* -----------------------------------------------------------------------
   Reusable form field — label + hint + error
----------------------------------------------------------------------- */
function Field({
  label,
  hint,
  error,
  className = '',
  children,
}: {
  label: string;
  /**
   * QW-6 — accept ReactNode so individual fields can embed links
   * (e.g. "Contact support to change") without losing the styled hint.
   */
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[12px] font-bold text-[#0F1222]">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-[11.5px] font-semibold text-[#EF4444]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11.5px] text-[#667085]">{hint}</p>
      ) : null}
    </div>
  );
}
