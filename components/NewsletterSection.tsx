'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function NewsletterSection() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      checkSubscriptionStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    try {
      const res = await api.newsletter.checkSubscription();
      setIsSubscribed(res.data?.subscribed || false);
    } catch {
      setIsSubscribed(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaChecked) {
      setMessage({ type: 'error', text: 'Please confirm that you understand the reCAPTCHA protection.' });
      return;
    }

    const emailToSubscribe = user?.email || email;

    if (!emailToSubscribe || !emailToSubscribe.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await api.newsletter.subscribe(emailToSubscribe);
      setMessage({ type: 'success', text: "Thank you for subscribing! You'll receive updates on Bonus Draws and Winners." });
      if (!user) setEmail('');
      setRecaptchaChecked(false);
      setIsSubscribed(true);
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      if (error.response?.status === 409) {
        setMessage({ type: 'error', text: 'This email is already subscribed to our newsletter.' });
        setIsSubscribed(true);
      } else {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to subscribe. Please try again later.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="newsletter-heading" className="w-full bg-white">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6356e5]">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356e5]" />
          Stay updated
        </span>

        <h2 id="newsletter-heading" className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px]">
          Stay in the loop — never miss a <span className="uc-gold-gradient">Bonus Draw</span>
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-[14px] text-[#4b5563] sm:text-[15px]">
          Get updates on Bonus Draws, members-only Rewards, and Winner announcements. We&rsquo;ll only send the good stuff.
        </p>

        <form
          onSubmit={handleSubmit}
          aria-label="Subscribe to Bonus Draw Alerts"
          className="mx-auto mt-7 max-w-lg"
        >
          {user ? (
            <div className="space-y-4 text-left">
              <div className="rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] p-4">
                <p className="text-sm text-[#0f1222]">
                  <span className="font-semibold">Logged in as:</span> {user.email}
                </p>
                {isSubscribed && (
                  <p className="mt-1 text-xs text-[#6356E5]">✓ You&rsquo;re already subscribed to our newsletter</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting || !recaptchaChecked || isSubscribed}
                className="uc-lift-sm inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6356E5] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-colors hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Subscribing…' : isSubscribed ? 'Already Subscribed' : 'Get Bonus Draw Alerts'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage(null);
                }}
                placeholder="Email address"
                required
                disabled={submitting}
                autoComplete="email"
                className="h-12 w-full rounded-full border border-[#E0DAFF] bg-[#FBFAFF] px-5 text-[14px] text-[#0f1222] placeholder-[#a3a8be] shadow-[inset_0_1px_2px_rgba(15,18,34,0.04)] transition-all hover:border-[#c8c5ea] hover:bg-white focus:border-[#6356e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6356e5]/30 disabled:bg-gray-50 sm:flex-1"
              />
              <button
                type="submit"
                disabled={submitting || !recaptchaChecked}
                className="uc-lift-sm inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6356E5] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-colors hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {submitting ? 'Subscribing…' : 'Get Bonus Draw Alerts'}
              </button>
            </div>
          )}

          {message && (
            <div className={`mt-3 text-sm ${message.type === 'success' ? 'text-[#10B981]' : 'text-[#EF4444]'}`} role="status" aria-live="polite">
              {message.text}
            </div>
          )}

          <div className="mt-4 space-y-2 text-xs text-[#7a8195]">
            <div className="flex items-center justify-center gap-2">
              <input
                type="checkbox"
                id="recaptcha"
                checked={recaptchaChecked}
                onChange={(e) => setRecaptchaChecked(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[#e7e9f2] text-[#6356E5] focus:ring-[#6356e5]/40"
                required
              />
              <label htmlFor="recaptcha" className="cursor-pointer">
                Protected by reCAPTCHA. Submissions are rate-limited.
              </label>
            </div>
            <p>
              By subscribing, you agree to our{' '}
              <a href="/terms" className="rounded-md text-[#6356e5] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="rounded-md text-[#6356e5] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
