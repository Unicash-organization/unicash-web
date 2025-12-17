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
    <section className="py-16 bg-gradient-to-b from-[#f9f6ff] via-[#f4f0ff] to-white w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 w-full">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-bold text-purple-600">Recent Winners</h2>
          <p className="text-lg text-gray-600">
            We publish every winner for full transparency. First winners are coming soon.
          </p>
          <p className="text-base text-gray-500">
            Next announcement in{' '}
            <span className="font-semibold text-purple-600">
              {nextAnnouncement.days}d {nextAnnouncement.hours}h {nextAnnouncement.minutes}m
            </span>
          </p>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/giveaways">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-full font-semibold shadow-2xl shadow-purple-200 transition hover:translate-y-0.5">
              Enter Bonus Draws
            </button>
          </Link>
          <Link href="/membership">
            <button className="px-8 py-3 border-2 border-purple-500 text-purple-600 rounded-full font-semibold bg-white backdrop-blur-sm shadow-lg hover:bg-purple-50 transition">
              Join UNICASH Now
            </button>
          </Link>
        </div>

        <div className="space-y-6 max-w-5xl mx-auto">
          {featuredWinner && (
            <div className="bg-gradient-to-br from-purple-100 via-purple-50 to-white rounded-[32px] p-6 md:p-8 shadow-2xl shadow-purple-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-5 flex-1">
                  {featuredWinner.profileImageUrl ? (
                    <img
                      src={`http://localhost:3000${featuredWinner.profileImageUrl}`}
                      alt={featuredWinner.winnerName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
                      {featuredWinner.winnerName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-wider text-purple-600 font-semibold mb-1">
                      Winner Spotlight
                    </p>
                    <h3 className="text-3xl font-semibold text-gray-900 mb-2">{featuredWinner.winnerName}</h3>
                    <p className="text-lg text-gray-700 mb-1">
                      Won <strong>{featuredWinner.prizeAmount} {featuredWinner.prizeType}</strong> on{' '}
                      <strong>{formatDate(featuredWinner.wonDate)}</strong>.
                    </p>
                    <p className="text-sm text-gray-500">
                      Draw ID: {featuredWinner.drawReference} · Randomized & recorded.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="bg-white/90 rounded-3xl px-5 py-3 flex items-center gap-1 shadow-lg">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <svg
                        key={index}
                        className="w-7 h-7 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
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

          <div className="bg-white rounded-[30px] shadow-xl overflow-hidden border border-purple-100">
            {otherWinners.length > 0 ? (
              <div className="divide-y divide-purple-100">
                {otherWinners.map((winner, index) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between gap-4 p-5 hover:bg-purple-50 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-purple-500 font-bold text-xl">#{index + 2}</span>
                      {winner.profileImageUrl ? (
                        <img
                          src={`http://localhost:3000${winner.profileImageUrl}`}
                          alt={winner.winnerName}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl border-2 border-white shadow-sm">
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

