'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Countdown from './Countdown';
import ScrollReveal from './ScrollReveal';
import api from '@/lib/api';

export default function FeaturedBonusDraw() {
  const [featuredDraw, setFeaturedDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedDraw = async () => {
      try {
        const response = await api.draws.getAll();
        // Get the first open draw or the first draw
        const featured = response.data.find((d: any) => d.state === 'open') || response.data[0];
        setFeaturedDraw(featured);
      } catch (error) {
        console.error('Error fetching featured draw:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedDraw();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredDraw) return null;

  const entrantsProgress = ((featuredDraw.entrants || 0) / (featuredDraw.cap || 100)) * 100;

  return (
    <section className="py-12 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-3xl font-bold mb-8 text-purple-600">Featured Bonus Draw</h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left - Image */}
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-80 md:h-auto">
              {featuredDraw.requiresMembership && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    💎 Bonus Draw
                  </span>
                </div>
              )}
              <div className="w-full h-full flex items-center justify-center text-9xl">
                📱
              </div>
            </div>

            {/* Right - Details */}
            <div className="p-8 md:p-10">
              <h3 className="text-3xl font-bold mb-2 text-gray-900">
                {featuredDraw.title}
              </h3>
              <p className="text-lg text-purple-600 font-semibold mb-6">
                {featuredDraw.costPerEntry} Credits = 1 entry
              </p>

              {/* Countdown */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Closes in
                </p>
                <Countdown 
                  targetDate={featuredDraw.closedAt} 
                  size="md"
                  color="purple"
                />
              </div>

              {/* Entries Progress */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-2">Entries Progress</p>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${entrantsProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {featuredDraw.entrants || 0} of {featuredDraw.cap || 100} entries · 
                    {featuredDraw.cap - (featuredDraw.entrants || 0)} spots left
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Link href={`/giveaways/${featuredDraw.id}`} className="flex-1">
                  <button className="w-full bg-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-purple-700 transition">
                    Enter Now
                  </button>
                </Link>
                <Link href={`/giveaways/${featuredDraw.id}`}>
                  <button className="border-2 border-purple-600 text-purple-600 font-bold py-4 px-6 rounded-lg hover:bg-purple-50 transition">
                    Details
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

