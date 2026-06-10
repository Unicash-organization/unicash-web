'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import PaymentMethodsPanel from '@/components/PaymentMethodsPanel';
import { notifyAndRetryMembershipAfterPaymentUpdate } from '@/lib/membershipPaymentRetry';

/* -----------------------------------------------------------------------
   Inline icons
----------------------------------------------------------------------- */
const Icon = {
  Eye: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.47 0 8.27 2.94 9.54 7a10.6 10.6 0 0 1-1.65 2.83" />
      <path d="M6.61 6.61A10.6 10.6 0 0 0 2.46 12c1.27 4.06 5.07 7 9.54 7a10.43 10.43 0 0 0 5.39-1.51" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  Lock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Card: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  ),
  User: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Alert: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export default function SecurityBillingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  // Password state — preserved
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [isFirstTimeChange, setIsFirstTimeChange] = useState(false);
  const [paymentPanelRefresh, setPaymentPanelRefresh] = useState(0);

  /* Email verification — resend flow with explicit states */
  const [resendVerifyState, setResendVerifyState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const handleResendVerifyEmail = async () => {
    setResendVerifyState('sending');
    try {
      await api.auth.resendEmailVerification();
      setResendVerifyState('sent');
      // Allow another resend after 60s (rate-limit friendly)
      setTimeout(() => setResendVerifyState('idle'), 60_000);
    } catch {
      setResendVerifyState('error');
      setTimeout(() => setResendVerifyState('idle'), 4_000);
    }
  };

  // First-time password change focus — preserved
  useEffect(() => {
    if (user && user.hasChangedPassword === false) {
      setIsFirstTimeChange(true);
      setTimeout(() => {
        passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // paymentUpdated URL flow — preserved
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    const urlParams = new URLSearchParams(window.location.search);
    const paymentUpdated = urlParams.get('paymentUpdated');
    if (paymentUpdated === 'true' && window.opener) {
      window.opener.postMessage({ type: 'STRIPE_PORTAL_DONE' }, window.location.origin);
      window.history.replaceState({}, '', window.location.pathname);
      window.close();
      return;
    }
    if (paymentUpdated === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(async () => {
        try {
          await refreshUser();
          await notifyAndRetryMembershipAfterPaymentUpdate({ quietIfMembershipHealthy: false });
          setPaymentPanelRefresh((n) => n + 1);
        } catch (error: unknown) {
          console.error('Error processing payment update:', error);
        }
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ===== Password validation + submit — preserved ===== */
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isFirstTimeChange && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (formData.newPassword.length < 9) {
      newErrors.newPassword = 'Password must be at least 9 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) {
      showToast('You are not logged in. Please log in again.', 'error');
      router.push('/login');
      return;
    }
    setSaving(true);
    // Capture the first-time flag BEFORE we await — we use it post-success
    // to redirect new members to the dashboard so the U1 onboarding wizard
    // fires. Without this, brand-new accounts get stuck on this page after
    // their forced password set and never see the welcome flow.
    const wasFirstTime = isFirstTimeChange;
    try {
      await api.users.updatePassword({
        currentPassword: isFirstTimeChange ? undefined : formData.currentPassword,
        newPassword: formData.newPassword,
        skipCurrentPasswordCheck: isFirstTimeChange,
      });
      await refreshUser();
      showToast('Password updated successfully!', 'success');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsFirstTimeChange(false);
      if (wasFirstTime) {
        // Send the new member straight to /dashboard — the layout effect
        // no longer redirects them here (hasChangedPassword is now true)
        // and the OnboardingWizard mounts on /dashboard.
        router.push('/dashboard');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        showToast('Your session has expired. Please log in again.', 'error');
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        router.push('/login');
      } else {
        showToast(error.response?.data?.message || 'Failed to update password', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================================
     JSX — v4 mobile-first
  ===================================================================== */
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header — simple H1, no eyebrow (sidebar active state is breadcrumb) */}
      <header>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">
          Security &amp; Billing
        </h1>
      </header>

      {/* First-time change warning — preserved */}
      {isFirstTimeChange && (
        <article className="overflow-hidden rounded-2xl border border-[#FFC85D]/40 bg-[#FFF6DA] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#9C5410] ring-1 ring-[#FFC85D]/40">
              <Icon.Alert className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-extrabold tracking-tight text-[#7C2D12] sm:text-[14px]">
                Set your password
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#9C5410]">
                Your account was created automatically. Set a password below — you don't need to enter a current password.
              </p>
            </div>
          </div>
        </article>
      )}

      {/* ============================================================
          Account identity card (login email, magic-link friendly note)
      ============================================================ */}
      <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Account access</p>
        <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Your login</h2>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#FBFAFF] p-3.5 ring-1 ring-[#E0DAFF] sm:p-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Login email</p>
              {(user as any)?.emailVerifiedAt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E5F7EE] px-2.5 py-0.5 text-[10.5px] font-bold text-[#1F7A37]">
                  ✓ Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#9C5410]">
                  Not verified
                </span>
              )}
            </div>
            <p className="mt-0.5 break-all text-[13.5px] font-semibold text-[#0F1222]">{user?.email || '—'}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#667085]">
              You can log in with this email and your password.
            </p>

            {/* Unverified — explain why it matters + resend with full states */}
            {user && !(user as any)?.emailVerifiedAt && (
              <div className="mt-3 rounded-xl bg-[#FFF7E6] p-3 ring-1 ring-[#F8DDA8]">
                <p className="text-[12px] leading-relaxed text-[#7C3F00]">
                  Verify your email to secure your account and unlock free Bonus Draw entries.
                </p>
                <button
                  type="button"
                  disabled={resendVerifyState === 'sending' || resendVerifyState === 'sent'}
                  onClick={handleResendVerifyEmail}
                  className="mt-2 inline-flex h-9 items-center justify-center rounded-full bg-[#6356E5] px-4 text-[12.5px] font-bold text-white transition hover:bg-[#5346D6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendVerifyState === 'sending'
                    ? 'Sending…'
                    : resendVerifyState === 'sent'
                      ? 'Sent — check your inbox'
                      : resendVerifyState === 'error'
                        ? 'Failed — try again'
                        : 'Resend verification email'}
                </button>
                {resendVerifyState === 'sent' && (
                  <p className="mt-1.5 text-[11px] text-[#7C3F00]">
                    Use the newest email — older links stop working. Link expires in 24 hours.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          className="mt-3 flex items-center gap-3 rounded-2xl border border-[#E7E9F2] bg-white p-3 transition-colors hover:border-[#C9C0F2] hover:bg-[#FBFAFF]"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.User className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-extrabold tracking-tight text-[#0F1222]">Edit profile</p>
            <p className="mt-0.5 text-[11.5px] text-[#667085]">Name, phone, address</p>
          </div>
          <Icon.ArrowRight className="h-4 w-4 shrink-0 text-[#6356E5]" />
        </Link>
      </article>

      {/* ============================================================
          Billing card — Stripe payment methods panel (preserved)
      ============================================================ */}
      <article className={`rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-opacity sm:p-7 ${isFirstTimeChange ? 'opacity-75' : ''}`}>
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Card className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Billing</p>
            <h2 className="mt-0.5 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">Payment methods</h2>
          </div>
        </div>
        <p className="mb-4 text-[12.5px] leading-relaxed text-[#4B5563]">
          Manage cards used for your Membership and Point Booster purchases. All payments are secured via Stripe.
        </p>

        <PaymentMethodsPanel
          refreshSignal={paymentPanelRefresh}
          wrapperClassName="space-y-4"
          onCardsChanged={() => notifyAndRetryMembershipAfterPaymentUpdate({ quietIfMembershipHealthy: true })}
        />
      </article>

      {/* ============================================================
          Password card — preserved logic
      ============================================================ */}
      <article
        ref={passwordSectionRef}
        className={`rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition-all sm:p-7 ${
          isFirstTimeChange ? 'border-[#6356E5] ring-2 ring-[#6356E5]/20' : ''
        }`}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Lock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Security</p>
            <h2 className="mt-0.5 text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">
              {isFirstTimeChange ? 'Set password' : 'Change password'}
            </h2>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
          {!isFirstTimeChange && (
            <PasswordField
              label="Current password"
              value={formData.currentPassword}
              onChange={(v) => setFormData({ ...formData, currentPassword: v })}
              show={showPasswords.current}
              onToggleShow={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              error={errors.currentPassword}
              required
            />
          )}
          <PasswordField
            label="New password"
            hint="At least 9 characters"
            value={formData.newPassword}
            onChange={(v) => {
              setFormData({ ...formData, newPassword: v });
              if (errors.newPassword) validate();
            }}
            show={showPasswords.new}
            onToggleShow={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
            error={errors.newPassword}
            required
            minLength={9}
          />
          <PasswordField
            label="Confirm new password"
            value={formData.confirmPassword}
            onChange={(v) => {
              setFormData({ ...formData, confirmPassword: v });
              if (errors.confirmPassword) validate();
            }}
            show={showPasswords.confirm}
            onToggleShow={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            error={errors.confirmPassword}
            required
          />

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] disabled:opacity-50"
            >
              {saving ? 'Saving…' : isFirstTimeChange ? 'Set password' : 'Update password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setErrors({});
              }}
              className="inline-flex h-11 items-center rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5]"
            >
              Cancel
            </button>
          </div>
        </form>
      </article>

      {/* Logout removed from this page — already accessible via:
          - Mobile: drawer (tap hamburger or avatar in header)
          - Desktop: sidebar bottom + avatar dropdown
          Pattern: keep Log Out in account-menu surfaces only, not page bodies. */}
    </div>
  );
}

/* -----------------------------------------------------------------------
   Reusable password input
----------------------------------------------------------------------- */
function PasswordField({
  label, hint, value, onChange, show, onToggleShow, error, required, minLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-[12px] font-bold text-[#0F1222]">
        <span>{label}</span>
        {hint && <span className="text-[11px] font-semibold text-[#667085]">{hint}</span>}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          className={`h-11 w-full rounded-2xl border bg-white pl-4 pr-11 text-[13.5px] text-[#0F1222] placeholder:text-[#667085] transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-[#FCA5A5] focus:border-[#EF4444] focus:ring-[#EF4444]/20'
              : 'border-[#E0DAFF] focus:border-[#6356E5] focus:ring-[#6356E5]/20'
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#F4F1FB] hover:text-[#0F1222]"
        >
          {show ? <Icon.EyeOff className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-[11.5px] font-semibold text-[#EF4444]">{error}</p>}
    </div>
  );
}
