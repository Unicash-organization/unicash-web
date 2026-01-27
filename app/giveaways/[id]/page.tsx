'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Countdown from '@/components/Countdown';
import DrawCard from '@/components/DrawCard';
import ImageSlider from '@/components/ImageSlider';
import api from '@/lib/api';
import ConfirmEntryModal from '@/components/ConfirmEntryModal';
import { useAuth } from '@/contexts/AuthContext';

export default function DrawDetailPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { id } = params;
  const [draw, setDraw] = useState<any>(null);
  const [relatedDraws, setRelatedDraws] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [rulesTerms, setRulesTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prize' | 'rules' | 'faq'>('overview');
  const [hasEntered, setHasEntered] = useState(false);
  const [checkingEntry, setCheckingEntry] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [checkingWaitlist, setCheckingWaitlist] = useState(false);
  const [addingToWaitlist, setAddingToWaitlist] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [membership, setMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);

  const loadDraw = async () => {
    if (!id) return;
    try {
      const drawRes = await api.draws.get(id as string);
      setDraw(drawRes.data);
    } catch (error) {
      console.error('Error fetching draw:', error);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    // Wait for auth to complete before fetching
    if (authLoading) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [drawRes, allDrawsRes, faqsRes, settingsRes] = await Promise.all([
          api.draws.get(id as string, user?.id), // Pass userId for early access validation
          api.draws.getAll(user?.id), // Pass userId for early access filtering
          api.faqs.getAll('draws').catch(() => ({ data: [] })), // Get draws category FAQs
          api.settings.getByKey('rules_and_terms').catch(() => ({ data: null })), // Get rules & terms
        ]);
        setDraw(drawRes.data);
        setRelatedDraws(allDrawsRes.data.filter((d: any) => d.id !== id).slice(0, 3));
        setFaqs(faqsRes.data || []);
        setRulesTerms(settingsRes.data?.value || '');
        setFetchError(null);
      } catch (error: any) {
        console.error('Error fetching draw:', error);
        setFetchError(error?.response?.data?.message || error?.message || 'Failed to load draw');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user?.id, authLoading]); // Re-fetch when user or auth state changes

  useEffect(() => {
    if (user && id) {
      checkUserEntry();
      checkWaitlistStatus();
      // Always check membership for logged-in users (needed for bonus draws)
      checkMembership();
    }
  }, [user, id]);

  const checkUserEntry = async () => {
    if (!user) return;
    setCheckingEntry(true);
    try {
      const entriesRes = await api.entries.getUserEntries().catch(() => ({ data: [] }));
      const userEntries = entriesRes.data || [];
      const hasEntry = userEntries.some((entry: any) => entry.drawId === id && !entry.isRefunded);
      setHasEntered(hasEntry);
    } catch (error) {
      console.error('Error checking user entry:', error);
    } finally {
      setCheckingEntry(false);
    }
  };

  const checkWaitlistStatus = async () => {
    if (!user) return;
    setCheckingWaitlist(true);
    try {
      const res = await api.waitlist.check(id as string).catch(() => ({ data: { isOnWaitlist: false } }));
      setIsOnWaitlist(res.data?.isOnWaitlist || false);
    } catch (error) {
      console.error('Error checking waitlist status:', error);
    } finally {
      setCheckingWaitlist(false);
    }
  };

  const checkMembership = async () => {
    if (!user) return;
    setCheckingMembership(true);
    try {
      const response = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(response.data);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setCheckingMembership(false);
    }
  };

  const handleAddToWaitlist = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setAddingToWaitlist(true);
    try {
      await api.waitlist.add(id as string);
      setIsOnWaitlist(true);
    } catch (error: any) {
      console.error('Error adding to waitlist:', error);
      alert(error.response?.data?.message || 'Failed to add to waitlist');
    } finally {
      setAddingToWaitlist(false);
    }
  };

  const handleRemoveFromWaitlist = async () => {
    if (!user) return;
    setAddingToWaitlist(true);
    try {
      await api.waitlist.remove(id as string);
      setIsOnWaitlist(false);
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    } finally {
      setAddingToWaitlist(false);
    }
  };

  // Show loading while auth is loading OR data is fetching
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Checking access...' : 'Loading draw...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error message if fetch failed
  if (fetchError) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-red-900 mb-3">Unable to Load Draw</h2>
          <p className="text-red-700 mb-4">{fetchError}</p>
          {fetchError.includes('not yet available') && (
            <p className="text-sm text-red-600 mb-4">
              💎 This draw may be available for early access to UniMax members.
            </p>
          )}
        </div>
        <Link href="/giveaways" className="btn-primary">
          View All Giveaways
        </Link>
      </div>
    );
  }

  // Show not found if no error but no draw
  if (!draw) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Draw Not Found</h1>
        <p className="text-gray-600 mb-6">This draw may have been removed or doesn't exist.</p>
        <Link href="/giveaways" className="btn-primary">
          View All Giveaways
        </Link>
      </div>
    );
  }

  // Prepare images array from draw.images (JSONB array)
  const drawImages = draw.images && Array.isArray(draw.images) && draw.images.length > 0
    ? draw.images
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((img: any) => ({
          id: img.id,
          url: img.url || img,
          order: img.order || 0,
          isPrimary: img.isPrimary || false,
        }))
    : draw.prizeImage
    ? [{ url: typeof draw.prizeImage === 'string' ? draw.prizeImage : draw.prizeImage.url || draw.prizeImage }]
    : [];

  return (
    <div>
      {/* Top Banner with Countdown */}
      <section className="gradient-purple text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg font-semibold">
              Closes in{' '}
              <Countdown
                targetDate={draw.closedAt as string}
                size="md"
                color="white"
              />
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left - Image & Details */}
            <div className="md:col-span-2">
              {/* Image Slider */}
              <div className="mb-6">
                <ImageSlider images={drawImages} autoPlayInterval={5000} />
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-200">
                  <div className="flex space-x-1 p-2">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                        activeTab === 'overview'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('prize')}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                        activeTab === 'prize'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Prize Details
                    </button>
                    <button
                      onClick={() => setActiveTab('rules')}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                        activeTab === 'rules'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Rules & Terms
                    </button>
                    <button
                      onClick={() => setActiveTab('faq')}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                        activeTab === 'faq'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      FAQs
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {activeTab === 'overview' && (
                    <div>
                      <div
                        className="text-gray-600 prose prose-sm max-w-none rich-text-content"
                        dangerouslySetInnerHTML={{
                          __html: draw.overview || draw.description || '<p>No overview available.</p>',
                        }}
                      />
                    </div>
                  )}

                  {activeTab === 'prize' && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Prize Details</h3>
                      <div
                        className="text-gray-600 mb-4 prose prose-sm max-w-none rich-text-content"
                        dangerouslySetInnerHTML={{
                          __html: draw.prizeDetails || draw.prizeDescription || '<p>No prize details available.</p>',
                        }}
                      />
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="font-semibold text-purple-900">Prize Value: ${draw.prizeValue || 'TBD'}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'rules' && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Rules & Terms</h3>
                      {rulesTerms ? (
                        <div
                          className="text-gray-600 prose prose-sm max-w-none rich-text-content"
                          dangerouslySetInnerHTML={{ __html: rulesTerms }}
                        />
                      ) : (
                        <ul className="space-y-2 text-gray-600">
                          <li>• Must be a UniCash member to enter</li>
                          <li>• One entry per member</li>
                          <li>• Winners will be contacted via email</li>
                          <li>• Prize cannot be exchanged for cash (unless specified)</li>
                          <li>• See full Terms & Conditions for details</li>
                        </ul>
                      )}
                    </div>
                  )}

                  {activeTab === 'faq' && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
                      {faqs.length > 0 ? (
                        <div className="space-y-4">
                          {faqs.map((faq) => (
                            <details key={faq.id} className="bg-gray-50 p-6 rounded-lg shadow-sm group">
                              <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                                <span>{faq.question}</span>
                                <svg
                                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </summary>
                              <div
                                className="mt-4 text-gray-600 prose prose-sm max-w-none rich-text-content"
                                dangerouslySetInnerHTML={{ __html: faq.answer }}
                              />
                            </details>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <details className="bg-gray-50 p-6 rounded-lg shadow-sm group">
                            <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                              <span>How do I enter?</span>
                              <svg
                                className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <p className="mt-4 text-gray-600">Click "Enter Now" and use your credits to submit an entry.</p>
                          </details>
                          <details className="bg-gray-50 p-6 rounded-lg shadow-sm group">
                            <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                              <span>When will the winner be announced?</span>
                              <svg
                                className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <p className="mt-4 text-gray-600">Within 24 hours after the draw closes.</p>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Entry Card */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h3 className="text-2xl font-bold mb-2">{draw.title}</h3>
                <p className="text-3xl font-bold text-purple-600 mb-6">
                  {draw.costPerEntry} credits = 1 entry
                </p>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>
                      {draw.entrants || 0}/{draw.cap === -1 ? '∞ Unlimited' : draw.cap} entrants
                    </span>
                  </div>
                  {draw.cap !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((draw.entrants || 0) / draw.cap) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                  {draw.cap === -1 && (
                    <p className="text-xs text-gray-500 italic">This draw has no entry limit</p>
                  )}
                </div>

                <Countdown
                  targetDate={draw.closedAt as string}
                  size="sm"
                  color="purple"
                />

                {(() => {
                  const isClosedByDate = draw.closedAt ? new Date(draw.closedAt) < new Date() : false;
                  // Skip sold out check if unlimited capacity (cap = -1)
                  const isSoldOut = draw.cap !== -1 && (draw.state === 'soldOut' || (draw.entrants || 0) >= (draw.cap || 0));
                  const isClosed = draw.state === 'closed' || isClosedByDate;
                  
                  // Check if user has active membership for bonus draws
                  // Block if canceled, paused, or inactive
                  const isCanceled = membership?.status === 'canceled';
                  const hasActiveMembership = !isCanceled && // ✅ Block canceled membership first
                    membership?.status === 'active' && 
                    !membership?.isPaused && 
                    membership?.currentPeriodEnd && 
                    new Date(membership.currentPeriodEnd) > new Date();
                  
                  const canEnterBonusDraw = !draw.requiresMembership || hasActiveMembership;
                  // ✅ Disable if canceled membership
                  const isDisabled = isClosed || isSoldOut || hasEntered || isCanceled || (draw.requiresMembership && !canEnterBonusDraw);

                  // Debug logging
                  if (draw.requiresMembership && user) {
                    console.log('Draw Detail Debug:', {
                      drawId: draw.id,
                      requiresMembership: draw.requiresMembership,
                      membership: membership,
                      isPaused: membership?.isPaused,
                      status: membership?.status,
                      hasActiveMembership,
                      canEnterBonusDraw,
                      isDisabled
                    });
                  }
                  
                  if (hasEntered) {
                    return (
                      <div className="mt-4 w-full bg-green-50 border border-green-200 rounded-lg py-4 px-4 mb-4 text-center">
                        <p className="text-green-800 font-semibold">✓ You've entered this draw</p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {draw.requiresMembership && !canEnterBonusDraw && user && (
                        <div className="mt-4 w-full mb-2 py-3 px-4 rounded-lg bg-orange-50 border border-orange-200 text-center">
                          <p className="text-sm text-orange-800 font-medium">
                            {isCanceled ? '🚫 Your membership is cancelled' : membership?.isPaused ? '⏸️ Your membership is paused' : '💎 Active membership required'}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            {isCanceled ? 'Your membership has been cancelled. You cannot enter bonus draws.' : membership?.isPaused ? 'Please resume your membership to enter this bonus draw' : 'Subscribe to a membership plan to unlock bonus draws'}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          // ✅ Block click if canceled, closed, sold out, already entered, or cannot enter
                          if (isCanceled || isClosed || isSoldOut || hasEntered || !canEnterBonusDraw) {
                            return;
                          }
                          setShowConfirmModal(true);
                        }}
                        disabled={isDisabled || checkingEntry || checkingMembership}
                        className="mt-4 w-full bg-purple-600 text-white font-bold py-4 rounded-lg hover:bg-purple-700 transition mb-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {checkingEntry || checkingMembership ? 'Checking...' : isCanceled ? 'Membership Cancelled' : isSoldOut ? 'Sold Out' : isClosed ? 'Closed' : 'Enter Now'}
                      </button>
                    </>
                  );
                })()}

                <p className="text-xs text-gray-500 text-center">
                  Keep your membership active — then use your credits to enter draws.
                </p>

                {/* View Entry List Link */}
                <Link
                  href={`/draws/${id}/entries`}
                  className="mt-4 block text-center text-purple-600 hover:text-purple-800 text-sm font-medium underline"
                >
                  View Entry List (Transparency)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* You Might Also Like */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-purple-600">You might also like</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedDraws.map((relatedDraw: any) => (
              <DrawCard
                key={relatedDraw.id}
                id={relatedDraw.id}
                title={relatedDraw.title}
                image={relatedDraw.prizeImage}
                creditsPerEntry={relatedDraw.costPerEntry}
                entrants={relatedDraw.entrants || 0}
                cap={relatedDraw.cap || 100}
                closedAt={relatedDraw.closedAt}
                state={relatedDraw.state}
                requiresMembership={relatedDraw.requiresMembership}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-purple-600">
            Got Questions? We've Got You Covered.
          </h2>
          <div className="space-y-4">
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <details key={faq.id} className="bg-white p-6 rounded-lg shadow-sm group">
                  <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                    <span>{faq.question}</span>
                    <svg
                      className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div
                    className="mt-4 text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </details>
              ))
            ) : (
              <>
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
                  {
                    q: '4. How are winners selected and verified?',
                    a: 'All winners are selected by RandomDraws, a government-approved electronic draw system. Once the draw closes, UniCash publishes the SHA256 verification hash and winner results publicly.',
                  },
                  {
                    q: '5. What happens if a draw sells out or closes?',
                    a: 'Once the entrant cap is reached, the draw is automatically closed and verified. Winners are announced on the Winners Page, and results stay visible permanently for public proof.',
                  },
                  {
                    q: '6. What makes UniCash different from other giveaways?',
                    a: 'Every draw is fair by design — capped entrants, one-entry-per-member, verified results, and no hidden odds. You\'re competing in a transparent system where every chance is real.',
                  },
                ].map((faq, index) => (
                  <details key={index} className="bg-white p-6 rounded-lg shadow-sm group">
                    <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                      <span>{faq.q}</span>
                      <svg
                        className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="mt-4 text-gray-600">{faq.a}</p>
                  </details>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Confirm Entry Modal */}
      {draw && (
        <ConfirmEntryModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          draw={{
            id: draw.id,
            title: draw.title,
            costPerEntry: draw.costPerEntry,
            state: draw.state,
            entrants: draw.entrants || 0,
            cap: draw.cap ?? 0, // Keep -1 for unlimited, default to 0 if null
            requiresMembership: draw.requiresMembership,
          }}
          onSuccess={() => {
            // Refresh draw data
            loadDraw();
          }}
        />
      )}
    </div>
  );
}
