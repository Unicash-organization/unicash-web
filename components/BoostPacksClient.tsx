'use client';

import React, { useEffect, useState } from 'react';
import BoostPackCard from '@/components/BoostPackCard';
import api from '@/lib/api';

export default function BoostPacksClient() {
  const [boostPacks, setBoostPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoostPacks = async () => {
      try {
        const response = await api.membership.getBoostPacks();
        setBoostPacks(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchBoostPacks();
  }, []);

  // Handle scroll to section when URL has hash
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const hash = window.location.hash;
      if (hash === '#choose-boost-pack') {
        setTimeout(() => {
          const element = document.getElementById('choose-boost-pack');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [loading]);

  return (
    <>
      {/* Choose Your Boost Pack */}
      <section id="choose-boost-pack" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose your Boost Pack</h2>
            <p className="text-xl text-gray-600">One-time purchases. No auto-renew. Credits never expire.</p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {boostPacks
                .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((pack: any) => (
                <BoostPackCard
                  key={pack.id}
                  pack={pack}
                />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4 font-semibold">Secure Payments Powered By:</p>
            <div className="flex justify-center items-center space-x-6 flex-wrap mb-4">
              <span className="text-2xl font-bold text-purple-600">stripe</span>
              <span className="text-2xl font-bold">Apple Pay</span>
              <span className="text-2xl font-bold text-blue-600">PayPal</span>
              <span className="text-2xl font-bold">Visa</span>
              <span className="text-2xl font-bold text-orange-600">Mastercard</span>
            </div>
            <p className="text-xs text-gray-500 max-w-4xl mx-auto">
              Boost Packs are members-only with strictly verified fairness. Credits can be used for any same-store. 
              Credits are user-specific to your UniCash account. No code-sharing. All entry transactions are logged transparently. 
              We maintain full audit trails of entry transactions and credit balances.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">How it Works</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Understand how UniCash keeps every draw fair, verified, and transparent — from membership to winner announcement.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-6 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Pick a pack</h3>
              <p className="text-gray-600">
                Choose Small, Value, or Mega. One-time purchase — no recurring, one-time payment.
              </p>
            </div>

            <div className="text-center bg-white p-6 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Credits credited instantly</h3>
              <p className="text-gray-600">
                Your balance updates in seconds. You'll see it in the header and dashboard — no delays, no holds, no waiting for draws.
              </p>
            </div>

            <div className="text-center bg-white p-6 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Enter Bonus Draws</h3>
              <p className="text-gray-600">
                Open draw shows "2 Credits = 1 entry"<br />
                Entries are submitted, no bots, no bugs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">FAQ</h2>
          <p className="text-center text-gray-600 mb-12">
            Choose a plan, get monthly credits, and unlock every member draw.
          </p>

          <div className="space-y-4">
            {[
              {
                q: '1. What are Boost Packs?',
                a: 'Boost Packs are one-time credit bundles. You purchase them separately from your membership to get extra entries into Bonus Draws.',
              },
              {
                q: '2. Do Boost credits expire?',
                a: 'No. Credits from Boost Packs never expire. You can hold them in your balance as long as you like and use them whenever you\'re ready to enter a draw.',
              },
              {
                q: '3. How are Boost credits different from Membership credits?',
                a: 'Membership credits: Issued monthly, expire at month\'s end if unused. Boost credits: Purchased one-time, never expire, stack on top of membership credits.',
              },
              {
                q: '4. Do I need a membership to buy Boost Packs?',
                a: 'Yes. Boost Packs are members-only — a plan is required to unlock extra-time credit bundles.',
              },
              {
                q: '5. How do I know how many credits I need?',
                a: 'Each draw shows the required entry cost. For example:\n• "75 credits = 1 entry"\n• If you have enough credits, you\'ll see an "Enter Boost Pack" button which takes you here.',
              },
              {
                q: '6. Which payment methods do you accept?',
                a: 'We accept major cards via Stripe and Apple Pay and PayPal. All transactions are SSL encrypted and secure.',
              },
              {
                q: '7. Is this a subscription?',
                a: 'No. Boost Packs are one-time purchases. They do not renew.',
              },
              {
                q: '8. Can I get a refund?',
                a: 'No. All Boost Pack purchases are final. Credits never expire, so you can use them anytime.',
              },
              {
                q: '9. Can I transfer my credits to someone else?',
                a: 'No. Credits are tied to your UniCash account and cannot be transferred or gifted.',
              },
              {
                q: '10. Do Boost credits roll over each month?',
                a: 'Yes — because they never expire. They always remain in your account until you use them.',
              },
            ].map((faq, index) => (
              <details key={index} className="bg-gray-50 p-6 rounded-lg group">
                <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                  <span>{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-gray-600 whitespace-pre-line">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}


