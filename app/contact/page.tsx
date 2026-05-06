'use client';

/* ==========================================================================
   UNICASH /contact — v4 redesign
   --------------------------------------------------------------------------
   - Visual + section structure mirrors `previews/homepage-v4.html` & app/page.tsx
   - All form state, validation, and `api.contacts.create` payload are PRESERVED
   - Pure UI/UX redesign — no backend / API / auth / business logic touched
   ========================================================================== */

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Inline icon helpers                                                       */
/* -------------------------------------------------------------------------- */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  ),
  Clock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  HelpCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  CheckCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  AlertCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  MessageSquare: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  ),
  Heart: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  Send: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  ),
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6356e5]">{children}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Subject suggestions — quick-fill chips                                    */
/* -------------------------------------------------------------------------- */

const SUBJECT_CHIPS = [
  'Membership question',
  'Points balance',
  'Bonus Draw entry',
  'Receipt review',
  'Billing & payments',
  'Gift Card redemption',
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ContactPage() {
  const { user } = useAuth();

  const initialName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.firstName || user?.lastName || user?.email?.split('@')[0] || '';

  const [formData, setFormData] = useState({
    name: initialName,
    email: user?.email || '',
    phone: user?.phone || '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubjectChip = (subject: string) => {
    setFormData((prev) => ({ ...prev, subject }));
    if (errors.subject) {
      setErrors((prev) => ({ ...prev, subject: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Please enter your name.';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'That doesn’t look like a valid email.';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Please add a subject.';
    if (!formData.message.trim()) {
      newErrors.message = 'Please include a short message.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Add a few more details (10+ characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSuccess(false);

    try {
      // ───── PRESERVED: original payload contract ─────
      await api.contacts.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      setSuccess(true);
      setFormData({
        name: initialName,
        email: user?.email || '',
        phone: user?.phone || '',
        subject: '',
        message: '',
      });

      setTimeout(() => setSuccess(false), 6000);
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      setErrors({ submit: error?.response?.data?.message || 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const messageLen = formData.message.trim().length;

  return (
    <main className="bg-white">
      {/* ====================================================================
          HERO — painted lavender mesh + intro
      ==================================================================== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(720px 480px at 14% 16%, rgba(139,123,255,.16), transparent 62%)',
              'radial-gradient(620px 420px at 88% 12%, rgba(201,192,242,.22), transparent 60%)',
              'radial-gradient(560px 380px at 50% 100%, rgba(99,86,229,.10), transparent 62%)',
              'radial-gradient(420px 320px at 92% 78%, rgba(255,226,176,.10), transparent 60%)',
              'linear-gradient(180deg, #FBFAFF 0%, #FFFFFF 100%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 sm:h-48"
          style={{
            background: [
              'radial-gradient(1100px 220px at 50% -30%, rgba(99,86,229,.18), transparent 72%)',
              'radial-gradient(700px 180px at 20% -22%, rgba(139,123,255,.14), transparent 70%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-5 pt-16 pb-8 text-center sm:px-6 sm:pt-24 sm:pb-12 lg:px-8">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="mt-3 text-[32px] font-extrabold leading-[1.08] tracking-tight text-[#0f1222] sm:text-[44px] md:text-[52px]">
            We&apos;re here to <span className="uc-gold-gradient">help.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
            Questions about Membership, Points, Bonus Draws, or your account? Send us a message and we&apos;ll get back
            within one business day.
          </p>

          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] font-semibold text-[#4b5563] sm:text-[13px]">
            {['Real humans', 'Reply within 1 business day', 'Secure & private'].map((c, i) => (
              <li key={c} className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#6356E5]/70" aria-hidden />
                <span>{c}</span>
                {i < 2 ? <span className="text-[#cfc8e8]" aria-hidden>·</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ====================================================================
          FORM + SUPPORT SIDEBAR
      ==================================================================== */}
      <section className="relative bg-[#FBFAFF]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-6 md:grid-cols-12 md:gap-8">
            {/* ───────── Form column ───────── */}
            <div className="md:col-span-8">
              <div className="rounded-3xl border border-[#e7e9f2] bg-white p-6 shadow-[0_18px_40px_-22px_rgba(15,18,34,.16)] sm:p-8">
                <div className="mb-6 flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                    <Icon.MessageSquare className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2 className="text-[20px] font-extrabold tracking-tight text-[#0f1222] sm:text-[22px]">
                      Send us a message
                    </h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#4b5563] sm:text-[13.5px]">
                      Tell us what&apos;s up — a few details go a long way.
                    </p>
                  </div>
                </div>

                {/* Success banner */}
                {success && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mb-5 flex items-start gap-3 rounded-2xl border border-[#A7E5C4] bg-[#ECFDF5] p-4"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                      <Icon.CheckCircle className="h-4 w-4" />
                    </span>
                    <div className="text-[13.5px] leading-relaxed text-[#065F46]">
                      <p className="font-semibold">Message sent — thank you.</p>
                      <p className="text-[12.5px] text-[#0f7150]">
                        We&apos;ll reply by email within one business day.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit error banner */}
                {errors.submit && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-3 rounded-2xl border border-[#FBC0C0] bg-[#FEF2F2] p-4"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-white">
                      <Icon.AlertCircle className="h-4 w-4" />
                    </span>
                    <div className="text-[13.5px] leading-relaxed text-[#7F1D1D]">
                      <p className="font-semibold">Couldn&apos;t send your message.</p>
                      <p className="text-[12.5px] text-[#a83333]">{errors.submit}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      id="name"
                      name="name"
                      label="Name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      error={errors.name}
                    />
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      error={errors.email}
                    />
                  </div>

                  <Field
                    id="phone"
                    name="phone"
                    type="tel"
                    label="Phone"
                    optional
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+61 4xx xxx xxx"
                  />

                  <div>
                    <Field
                      id="subject"
                      name="subject"
                      label="Subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What can we help with?"
                      error={errors.subject}
                    />
                    {/* Subject chips */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SUBJECT_CHIPS.map((s) => {
                        const active = formData.subject === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSubjectChip(s)}
                            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 ${
                              active
                                ? 'bg-[#6356E5] text-white shadow-[0_8px_20px_-10px_rgba(99,86,229,.55)]'
                                : 'border border-[#e7e9f2] bg-white text-[#0f1222] hover:border-[#c8c5ea] hover:text-[#5346D6]'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message textarea */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="message" className="text-[13px] font-semibold text-[#0f1222]">
                        Message <span className="text-[#6356E5]">*</span>
                      </label>
                      <span
                        className={`text-[11.5px] font-semibold transition-colors ${
                          messageLen >= 10 ? 'text-[#10B981]' : messageLen > 0 ? 'text-[#6356E5]' : 'text-[#9aa2b8]'
                        }`}
                        aria-live="polite"
                      >
                        {messageLen >= 10
                          ? 'Looks good'
                          : messageLen > 0
                            ? `${10 - messageLen} more characters`
                            : 'Min. 10 characters'}
                      </span>
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Share a few details so we can help quickly…"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                      className={`block w-full rounded-2xl border bg-white px-4 py-3 text-[14px] text-[#0f1222] placeholder:text-[#9aa2b8] focus:outline-none focus:ring-2 focus:ring-[#6356E5] focus:ring-offset-0 ${
                        errors.message ? 'border-[#EF4444] focus:ring-[#EF4444]/40' : 'border-[#e7e9f2]'
                      }`}
                    />
                    {errors.message && (
                      <p id="message-error" className="mt-1.5 text-[12.5px] font-medium text-[#EF4444]">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit + privacy line */}
                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-[12px] text-[#7a8195]">
                      <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#6356E5]" />
                      Your details are encrypted in transit and only used to reply to you.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-7 text-[14px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(99,86,229,.55)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ background: 'linear-gradient(180deg, #8B7BFF 0%, #6356E5 100%)' }}
                    >
                      <span aria-hidden className="absolute inset-0 bg-[#5346D6] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      <span className="relative inline-flex items-center gap-2">
                        {loading ? (
                          <>
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Icon.Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            Send message
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ───────── Sidebar ───────── */}
            <aside className="md:col-span-4">
              <div className="space-y-4 md:sticky md:top-24">
                {/* Email card */}
                <div className="rounded-3xl border border-[#e7e9f2] bg-white p-5 shadow-[0_10px_28px_-22px_rgba(15,18,34,.18)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                    <Icon.Mail className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-4 text-[15.5px] font-extrabold tracking-tight text-[#0f1222]">Email support</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#4b5563]">
                    Prefer email? We&apos;ll reply from the same address.
                  </p>
                  <a
                    href="mailto:support@unicash.com.au"
                    className="mt-3 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#6356E5] hover:text-[#5346D6]"
                  >
                    support@unicash.com.au
                    <Icon.ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Response time */}
                <div className="rounded-3xl border border-[#e7e9f2] bg-white p-5 shadow-[0_10px_28px_-22px_rgba(15,18,34,.18)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF6DA] text-[#C49A2C] ring-1 ring-[#FFE2B0]">
                    <Icon.Clock className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-4 text-[15.5px] font-extrabold tracking-tight text-[#0f1222]">Response time</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#4b5563]">
                    Usually within <span className="font-semibold text-[#0f1222]">one business day</span> — Mon–Fri,
                    AEST.
                  </p>
                </div>

                {/* FAQ shortcut */}
                <div className="rounded-3xl border border-[#E0DAFF] bg-gradient-to-br from-[#F4F1FB] to-white p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
                    <Icon.HelpCircle className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-4 text-[15.5px] font-extrabold tracking-tight text-[#0f1222]">
                    Got a quick question?
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#4b5563]">
                    Most Membership, Points, and Bonus Draw questions are answered in our FAQ — usually faster than
                    email.
                  </p>
                  <Link
                    href="/faq"
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-4 py-2 text-[12.5px] font-semibold text-[#0f1222] transition hover:border-[#c8c5ea] hover:text-[#5346D6]"
                  >
                    Browse FAQ
                    <Icon.ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ====================================================================
          OFFICE HOURS + AFTER-HOURS NOTE
      ==================================================================== */}
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              'radial-gradient(700px 360px at 18% 100%, rgba(139,123,255,.10), transparent 60%)',
              'radial-gradient(640px 320px at 88% 0%, rgba(99,86,229,.08), transparent 65%)',
            ].join(', '),
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-12 md:items-stretch">
            {/* Office hours card */}
            <div className="md:col-span-7">
              <div className="h-full rounded-3xl border border-[#e7e9f2] bg-[#FBFAFF] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                    <Icon.Clock className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="text-[15.5px] font-extrabold tracking-tight text-[#0f1222] sm:text-[16px]">
                    When we&apos;re online
                  </h3>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { day: 'Mon — Fri', time: '9:00 — 18:00 AEST' },
                    { day: 'Sat', time: '10:00 — 14:00 AEST' },
                    { day: 'Sun', time: 'Closed' },
                    { day: 'Public holidays', time: 'Limited cover' },
                  ].map((row) => (
                    <li
                      key={row.day}
                      className="flex flex-col gap-0.5 rounded-2xl border border-[#e7e9f2] bg-white px-3.5 py-2.5"
                    >
                      <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#7a8195]">
                        {row.day}
                      </span>
                      <span className="text-[13px] font-semibold text-[#0f1222]">{row.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* After-hours / quote card */}
            <div className="md:col-span-5">
              <div className="relative h-full overflow-hidden rounded-3xl border border-[#E0DAFF] bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] p-5 text-white sm:p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-[#FFE2B0]/20 blur-2xl"
                />
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
                  <Icon.Heart className="h-[18px] w-[18px]" />
                </span>
                <p className="relative mt-4 text-[15px] font-semibold leading-snug sm:text-[16px]">
                  After hours? Send anyway.
                </p>
                <p className="relative mt-1.5 text-[12.5px] leading-relaxed text-white/85 sm:text-[13px]">
                  We pick up the queue first thing in the morning. Account-critical issues are prioritised.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reusable Field component                                                  */
/* -------------------------------------------------------------------------- */

function Field({
  id,
  name,
  label,
  type = 'text',
  required = false,
  optional = false,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#0f1222]">
        {label}
        {required ? <span className="text-[#6356E5]">*</span> : null}
        {optional ? <span className="text-[11.5px] font-medium text-[#7a8195]">Optional</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`block w-full rounded-2xl border bg-white px-4 py-3 text-[14px] text-[#0f1222] placeholder:text-[#9aa2b8] focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-[#EF4444] focus:ring-[#EF4444]/40'
            : 'border-[#e7e9f2] focus:ring-[#6356E5]'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[12.5px] font-medium text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}
