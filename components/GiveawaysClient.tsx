'use client';

import React, { useEffect, useState } from 'react';
import DrawCard from '@/components/DrawCard';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function GiveawaysClient() {
  const { user } = useAuth();
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bonus' | 'open'>('all');

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const response = await api.draws.getAll(user?.id); // Pass userId for early access filtering
        setDraws(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, [user?.id]); // Re-fetch when user changes

  const filteredDraws = draws.filter((draw: any) => {
    if (filter === 'bonus') return draw.requiresMembership;
    if (filter === 'open') return draw.state === 'open';
    return true;
  });

  return (
    <>
      {/* Draws Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Bonus Draw</h2>
            <div className="flex space-x-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Draws</button>
              <button onClick={() => setFilter('bonus')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'bonus' ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>💎 Bonus Only</button>
              <button onClick={() => setFilter('open')} className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'open' ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Open</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filteredDraws.map((draw: any) => (
                <DrawCard
                  key={draw.id}
                  id={draw.id}
                  title={draw.title}
                  image={draw.prizeImage}
                  creditsPerEntry={draw.costPerEntry}
                  entrants={draw.entrants || 0}
                  cap={draw.cap || 100}
                  closedAt={draw.closedAt}
                  state={draw.state}
                  requiresMembership={draw.requiresMembership}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Major Reward Section */}
      <section className="py-16 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-sm font-bold mb-2 text-yellow-300 uppercase tracking-wide">Major Reward Section</h2>
              <h3 className="text-5xl font-bold mb-4">$50,000 Major Reward</h3>
              <p className="text-xl mb-6">Capped at 5,000 entrants</p>
              <button className="bg-white text-accent-500 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
                View Details
              </button>
            </div>
            <div className="text-9xl text-center">💰</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How it Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Become a Member</h3>
              <p className="text-gray-600">
                Choose your UniCash plan — UniOne, UniGo, or UniMax — and instantly receive your monthly credits!
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Credits Credited Instantly</h3>
              <p className="text-gray-600">
                Your balance updates in seconds. You'll see it in the header and dashboard — no delays, no holds, no waiting for draws.
              </p>
            </div>

            <div className="text-center">
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Got Questions? We've Got You Covered.
          </h2>
          <div className="space-y-4">
            {[
              {
                q: '1. Do I need to be a member to enter Bonus Draws?',
                a: 'Yes. Bonus Draws are exclusive to UniCash members. Choose a plan — UniOne, UniGo, or UniMax — and you\'ll instantly receive monthly credits to join draws.',
              },
              {
                q: '2. What happens when I use my credits to enter a draw?',
                a: 'Each entry uses the listed amount of credits (e.g. 10 Credits = 1 Entry). Once confirmed, your entry is locked in and verified — no repeats, no bots, no unlimited entries.',
              },
              {
                q: '3. What if I don\'t have enough credits?',
                a: 'You can buy a Boost Pack anytime to top up. Purchased Boost Credits never expire and can be used for any future Bonus Draw.',
              },
            ].map((faq, index) => (
              <details key={index} className="bg-white p-6 rounded-lg shadow-sm group">
                <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                  <span>{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}


