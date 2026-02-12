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
    // Auto-fill email if user is logged in
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
    } catch (error) {
      // Silently fail - user might not be subscribed
      setIsSubscribed(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recaptchaChecked) {
      setMessage({ type: 'error', text: 'Please confirm that you understand the reCAPTCHA protection.' });
      return;
    }
    
    // If user is logged in, use their email
    const emailToSubscribe = user?.email || email;
    
    if (!emailToSubscribe || !emailToSubscribe.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    
    setSubmitting(true);
    setMessage(null);
    
    try {
      await api.newsletter.subscribe(emailToSubscribe);
      setMessage({ type: 'success', text: 'Thank you for subscribing! You\'ll receive updates on bonus draws and winners.' });
      if (!user) {
        setEmail('');
      }
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
    <section className="py-16 bg-white w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        <h2 className="text-4xl font-bold text-purple-600 mb-4">
          Stay in the loop – never miss a draw
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Get updates on bonus draws, members-only prizes & winners. We'll only send the good stuff.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col max-w-lg mx-auto mb-6">
          {user ? (
            // Logged in user - show email and checkbox only
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Logged in as:</strong> {user.email}
                </p>
                {isSubscribed && (
                  <p className="text-xs text-purple-600">✓ You're already subscribed to our newsletter</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting || !recaptchaChecked || isSubscribed}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Subscribing...' : isSubscribed ? 'Already Subscribed' : 'Get Draw Alerts'}
              </button>
            </div>
          ) : (
            // Not logged in - show email input
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage(null);
                }}
                placeholder="Email address"
                required
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={submitting || !recaptchaChecked}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-r-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Subscribing...' : 'Get Draw Alerts'}
              </button>
            </div>
          )}
          {message && (
            <div className={`mt-3 text-sm text-center ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {message.text}
            </div>
          )}
        </form>
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <input
              type="checkbox"
              id="recaptcha"
              checked={recaptchaChecked}
              onChange={(e) => setRecaptchaChecked(e.target.checked)}
              className="mr-1 cursor-pointer"
              required
            />
            <label htmlFor="recaptcha" className="cursor-pointer">
              Protected by reCAPTCHA. Submissions are rate-limited.
            </label>
          </div>
          <p>
            By subscribing, you agree to our{' '}
            <a href="/terms" className="text-purple-600 hover:underline">Terms</a> and{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </section>
  );
}

