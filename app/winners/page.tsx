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

interface PaginationResult {
  data: Winner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadWinners(1, true);
  }, []);

  const loadWinners = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.winners.getPaginated(pageNum, limit);
      const result: PaginationResult = response.data;
      
      if (reset) {
        setWinners(result.data || []);
      } else {
        setWinners(prev => [...prev, ...(result.data || [])]);
      }
      
      setTotal(result.total || 0);
      setHasMore(pageNum < (result.totalPages || 0));
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadWinners(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="gradient-purple text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Recent Winners</h1>
          <p className="text-2xl mb-4">
            Real people winning real prizes — see the proof!
          </p>
          <p className="text-lg text-white/90 max-w-3xl mx-auto">
            Every winner is verified and publicly announced. We believe in transparency — so you can trust every result is real, fair, and audited.
          </p>
        </div>
      </section>

      {/* Winners List */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <h2 className="text-2xl font-bold">Verified Winners</h2>
              <p className="text-purple-100">
                Showing {winners.length} of {total} winners
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">Loading winners...</p>
              </div>
            ) : winners.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No winners found yet. Check back soon!</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {winners.map((winner, index) => (
                    <div key={winner.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-2xl font-bold text-gray-400 w-12 text-center">
                            #{index + 1}
                          </div>
                          {winner.profileImageUrl ? (
                            <img
                              src={`http://localhost:3000${winner.profileImageUrl}`}
                              alt={winner.winnerName}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {winner.winnerName[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-bold text-gray-900">{winner.winnerName}</p>
                              {winner.isFeatured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⭐ Featured
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              won <span className="font-semibold text-purple-600">{winner.prizeAmount} {winner.prizeType}</span> · {formatDate(winner.wonDate)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Draw ID: {winner.drawReference} · {winner.verificationCertificate || 'Certificate pending'}
                            </p>
                          </div>
                        </div>
                        {winner.proofLink && (
                          <Link href={winner.proofLink}>
                            <button className="text-purple-600 text-sm font-semibold hover:underline">
                              view proof
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center p-6 border-t border-gray-100">
                    {loadingMore ? (
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    ) : (
                      <button
                        onClick={handleLoadMore}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Load More Winners ({total - winners.length} remaining)
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Verification Info */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8">
            <h2 className="text-3xl font-bold mb-6 text-center">How We Verify Winners</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎲</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Random Draw System</h3>
                  <p className="text-gray-600">
                    All draws use a cryptographically secure random number generator, independently audited and verified.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Public Verification</h3>
                  <p className="text-gray-600">
                    Every winner's entry number, draw hash, and verification code is publicly visible on our Winners page.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Third-Party Audit</h3>
                  <p className="text-gray-600">
                    Results are audited by an independent third party to ensure complete fairness and transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
