'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Winner {
  id: string;
  winnerName: string;
  profileImageUrl: string | null;
  prizeAmount: string;
  prizeType: string;
  drawReference: string;
  wonDate: string;
  verificationCertificate: string | null;
  proofLink: string | null;
  isFeatured: boolean;
}

export default function RecentWinnersSection() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [featuredWinner, setFeaturedWinner] = useState<Winner | null>(null);
  const [nextAnnouncement, setNextAnnouncement] = useState({ days: 14, hours: 16, minutes: 22 });

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          api.winners.getFeatured().catch(() => ({ data: null })),
          api.winners.getRecent(5).catch(() => ({ data: [] })),
        ]);
        setFeaturedWinner(featuredRes.data);
        setWinners(recentRes.data || []);
      } catch (error) {
        console.error('Error fetching winners:', error);
      }
    };
    fetchWinners();

    // Countdown timer for next announcement
    const updateCountdown = () => {
      // This is a placeholder - in real app, calculate from next draw date
      const now = new Date();
      const nextAnnouncementDate = new Date(now);
      nextAnnouncementDate.setDate(nextAnnouncementDate.getDate() + 14);
      nextAnnouncementDate.setHours(16, 22, 0, 0);

      const diff = nextAnnouncementDate.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setNextAnnouncement({ days, hours, minutes });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Filter out featured winner from list
  const otherWinners = winners.filter(w => !w.isFeatured || w.id !== featuredWinner?.id);

  return (
    <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-purple-600 mb-4">Recent Winners</h2>
          <p className="text-lg text-gray-600 mb-2">
            We publish every winner for full transparency. First winners are coming soon.
          </p>
          <p className="text-sm text-gray-500">
            Next announcement in{' '}
            <span className="font-semibold text-purple-600">
              {nextAnnouncement.days}d {nextAnnouncement.hours}h {nextAnnouncement.minutes}m
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Link href="/giveaways">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
              Enter Bonus Draws
            </button>
          </Link>
          <Link href="/membership">
            <button className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition">
              Join UNICASH Now
            </button>
          </Link>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Featured Winner Card */}
          {featuredWinner && (
            <div className="bg-purple-100 rounded-2xl p-6 mb-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {featuredWinner.profileImageUrl ? (
                    <img
                      src={`http://localhost:3000${featuredWinner.profileImageUrl}`}
                      alt={featuredWinner.winnerName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl border-2 border-white shadow-md">
                      {featuredWinner.winnerName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{featuredWinner.winnerName}</h3>
                    <p className="text-gray-700 mb-1">
                      Won <strong>{featuredWinner.prizeAmount} {featuredWinner.prizeType}</strong> on{' '}
                      <strong>{formatDate(featuredWinner.wonDate)}</strong>.
                    </p>
                    <p className="text-sm text-gray-600">
                      Draw ID: {featuredWinner.drawReference} · Randomized & recorded.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  {featuredWinner.proofLink && (
                    <Link href={featuredWinner.proofLink}>
                      <span className="text-purple-600 text-sm font-semibold hover:underline">
                        View proof
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other Winners List */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {otherWinners.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {otherWinners.map((winner, index) => (
                  <div key={winner.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-gray-400 font-bold text-lg">#{index + 2}</span>
                      {winner.profileImageUrl ? (
                        <img
                          src={`http://localhost:3000${winner.profileImageUrl}`}
                          alt={winner.winnerName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          {winner.winnerName[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{winner.winnerName}</p>
                        <p className="text-sm text-gray-600">
                          won <strong>{winner.prizeAmount} {winner.prizeType}</strong> on{' '}
                          <strong>{formatDate(winner.wonDate)}</strong>.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Draw ID: {winner.drawReference} · Randomized & recorded.
                        </p>
                      </div>
                    </div>
                    {winner.proofLink && (
                      <Link href={winner.proofLink}>
                        <span className="text-purple-600 text-sm font-semibold hover:underline">
                          View proof
                        </span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No winners to display yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

