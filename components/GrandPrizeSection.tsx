'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function GrandPrizeSection() {
  const [grandPrize, setGrandPrize] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const fetchGrandPrize = async () => {
      try {
        const response = await api.draws.getAll();
        const draws = response.data || [];
        // Find the active grand prize draw
        const activeGrandPrize = draws.find(
          (draw: any) => draw.isGrandPrize && draw.isActive && draw.state === 'open'
        );
        setGrandPrize(activeGrandPrize || null);
      } catch (error) {
        console.error('Error fetching grand prize:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrandPrize();
  }, []);

  useEffect(() => {
    if (!grandPrize) return;

    const updateCountdown = () => {
      const targetDate = new Date(grandPrize.closedAt);
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
        setTimeLeft({ days, hours, minutes });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [grandPrize]);

  // Default demo data if no grand prize found
  const defaultTargetDate = new Date();
  defaultTargetDate.setDate(defaultTargetDate.getDate() + 29);
  defaultTargetDate.setHours(defaultTargetDate.getHours() + 23);
  defaultTargetDate.setMinutes(defaultTargetDate.getMinutes() + 22);

  const displayData = grandPrize || {
    title: '$50,000',
    cap: 5000,
    entrants: 62,
    closedAt: defaultTargetDate,
  };

  const targetDate = new Date(displayData.closedAt);
  const entrants = displayData.entrants || 62;
  const cap = displayData.cap || 5000;
  const progressPercent = Math.min((entrants / cap) * 100, 100);

  // Extract prize amount from title or use default
  const prizeAmount = displayData.title?.includes('$') 
    ? displayData.title.match(/\$[\d,]+/)?.[0] || '$50,000'
    : '$50,000';

  // Calculate countdown for display
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  const displayCountdown = diff > 0 ? countdown : { days: 29, hours: 23, minutes: 22, seconds: 54 };
  const displayTimeLeft = diff > 0 ? timeLeft : { days: 2, hours: 5, minutes: 34 };

  return (
    <section 
      className="relative w-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden"
      style={{ height: '600px', minHeight: '600px' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 border border-white rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 border border-white rounded-full -ml-48 -mb-48"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-center w-full">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center w-full">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Win {prizeAmount} this month.
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-6">
              Real prizes. Real odds. Real winners.
            </h2>
            <p className="text-lg mb-4 text-white/90">
              Every draw is limited, verified, and open to UniCash members only.
            </p>
            <p className="text-lg mb-8 text-white/90">
              This month's Grand Prize is capped at <span className="font-bold text-yellow-300">{cap.toLocaleString()} entrants</span>.
            </p>

            {/* Grand Prize ends in - Single Line */}
            <div className="flex items-center space-x-3 mb-6">
              <svg
                className="w-6 h-6 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-lg font-semibold">
                Grand Prize ends in{' '}
                <span className="text-yellow-400 font-bold">
                  {displayCountdown.days}d {displayCountdown.hours}h {displayCountdown.minutes}m {displayCountdown.seconds}s
                </span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{entrants}/{cap} entrants</span>
                <span className="text-sm">
                  Time left: {displayTimeLeft.days}d {displayTimeLeft.hours}h {displayTimeLeft.minutes}m
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-yellow-400 h-4 transition-all duration-500 flex items-center justify-end px-2"
                  style={{ width: `${progressPercent}%` }}
                >
                  <span className="text-xs font-bold text-gray-900"></span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Link href="/membership">
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition">
                  Join UniCash
                </button>
              </Link>
              <Link href="/giveaways">
                <button className="bg-purple-500/80 hover:bg-purple-600/80 text-white font-bold py-3 px-8 rounded-lg transition">
                  Explore Bonus Draws
                </button>
              </Link>
            </div>

            {/* Footer Text */}
            <p className="text-sm text-white/80">
              Every entrant verified. Every draw publicly audited (SHA256 hash).
            </p>
          </div>

          {/* Right Graphics */}
          <div className="relative hidden md:block">
            <div className="relative z-10">
              {/* Money Stack */}
              <div className="absolute top-0 right-20 text-8xl animate-pulse">
                💵
              </div>
              {/* Car */}
              <div className="absolute bottom-0 right-0 text-8xl animate-pulse delay-75">
                🚗
              </div>
              {/* Stars */}
              <div className="absolute top-1/2 left-0 text-4xl text-yellow-400 animate-pulse">
                ⭐
              </div>
              <div className="absolute top-1/4 right-10 text-3xl text-yellow-400 animate-pulse delay-150">
                ⭐
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
