'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import BannerSlider from '@/components/BannerSlider';
import api from '@/lib/api';

interface Winner {
  id: string;
  winnerName: string;
  profileImageUrl: string | null;
  prizeAmount: string;
  prizeType: string;
  drawReference: string;
  verificationCertificate: string | null;
}

export default function MajorRewardPage() {
  const [banners, setBanners] = useState([]);
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersRes, winnersRes] = await Promise.all([
          api.banners.getByPage('major-reward'),
          api.winners.getAll().catch(() => ({ data: [] })),
        ]);
        setBanners(bannersRes.data || []);
        // Filter winners with $100,000 prizes (Major Reward winners)
        const majorRewardWinners = (winnersRes.data || []).filter(
          (w: Winner) => w.prizeAmount === '$100,000' || w.drawReference?.startsWith('MR-')
        );
        setWinners(majorRewardWinners.slice(0, 10)); // Show top 10
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Banner Slider */}
      {banners.length > 0 ? (
        <BannerSlider banners={banners} />
      ) : (
        /* Fallback: Default Hero Section */
        <section className="gradient-purple text-white py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4 text-yellow-300">Win $50,000</h1>
              <p className="text-3xl font-bold mb-8">Real prizes. Real Winners</p>
              <p className="text-lg mb-8 max-w-2xl mx-auto">
                Only 5,000 verified members can enter this Major Reward. 
                Every draw is independently verified by RandomDraws to guarantee fairness.
              </p>
              <button className="bg-yellow-400 text-gray-900 font-bold py-4 px-8 rounded-lg hover:bg-yellow-300 transition">
                Join UniCash to Enter
              </button>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-8xl opacity-50">
              💵
            </div>
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-8xl opacity-50">
              ✅
            </div>
          </div>
        </section>
      )}

      {/* Rest of the page content remains the same */}
      {/* Fair by Design Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-6xl">🔀</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-4">
                <span className="text-purple-600">Fair by Design.</span><br />
                <span className="text-indigo-600">Verified by RandomDraws.</span>
              </h2>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">⚡</span>
                </div>
                <div>
                  <p className="font-semibold">SHA256 Hash Published</p>
                  <p className="text-sm text-gray-600">Every draw is cryptographically verified</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
                <div>
                  <p className="font-semibold">Government-Approved System</p>
                  <p className="text-sm text-gray-600">RandomDraws is independently audited</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🔍</span>
                </div>
                <div>
                  <p className="font-semibold">Publicly Verifiable</p>
                  <p className="text-sm text-gray-600">Anyone can check the results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Winners Section */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-purple-600 mb-4">
              Verified Winners. Proven Fairness.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Each winner is verified publicly — every result backed by a RandomDraws certificate and SHA256 proof.
            </p>
          </div>

          {winners.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-5xl mx-auto mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-purple-600">
                          Winner
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-purple-600">
                          Prize
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-purple-600">
                          Verification
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {winners.map((winner) => (
                        <tr key={winner.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
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
                              <span className="text-sm font-medium text-gray-900">
                                {winner.winnerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {winner.prizeAmount} ({winner.drawReference})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {winner.verificationCertificate || 'Certificate pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="text-center">
                <Link href="/winners">
                  <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition shadow-lg">
                    View All Verified Winners
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-5xl mx-auto">
              <p className="text-gray-500 text-lg">No verified winners yet. Check back soon!</p>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 mt-8 max-w-3xl mx-auto">
            Draws conducted and verified by <strong>RandomDraws (government-approved system)</strong>. Results are final.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Join UniCash</h3>
              <p className="text-gray-600">Choose a membership plan and get started</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Enter the Draw</h3>
              <p className="text-gray-600">Use your credits to enter the Major Reward</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">3️⃣</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Win Verified</h3>
              <p className="text-gray-600">Winner is selected and verified publicly</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
