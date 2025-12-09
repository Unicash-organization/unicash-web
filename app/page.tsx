'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DrawCard from '@/components/DrawCard';
import MembershipCard from '@/components/MembershipCard';
import GrandPrizeSection from '@/components/GrandPrizeSection';
import BannerSlider from '@/components/BannerSlider';
import ScrollReveal from '@/components/ScrollReveal';
import RecentWinnersSection from '@/components/RecentWinnersSection';
import NewsletterSection from '@/components/NewsletterSection';
import api from '@/lib/api';

export default function Home() {
  const [draws, setDraws] = useState([]);
  const [plans, setPlans] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightMembership, setHighlightMembership] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [drawsRes, plansRes, bannersRes] = await Promise.all([
          api.draws.getAll(),
          api.membership.getPlans(),
          api.banners.getByPage('homepage').catch(() => ({ data: [] })),
        ]);
        setDraws(drawsRes.data.slice(0, 6)); // Get first 6 draws
        setPlans(plansRes.data);
        setBanners(bannersRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle scroll to membership section and highlight
  useEffect(() => {
    // Check if URL has hash for membership plans
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#membership-plans') {
        // Wait for content to load
        setTimeout(() => {
          const element = document.getElementById('membership-plans');
          if (element) {
            // Smooth scroll to section
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight effect
            setHighlightMembership(true);
            
            // Remove highlight after animation
            setTimeout(() => {
              setHighlightMembership(false);
            }, 3000);
          }
        }, 500);
      }
    }
  }, [loading]);

  return (
    <div>
      {/* Banner Slider */}
      {banners.length > 0 ? (
        <BannerSlider banners={banners} loading={loading} />
      ) : loading ? (
        <BannerSlider banners={[]} loading={true} />
      ) : (
        /* Fallback: Grand Prize Section if no banners */
        <GrandPrizeSection />
      )}

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-purple-600 mb-4">How It Works</h2>
            <p className="text-xl text-gray-900 font-medium">Fair. Verified. Rewarding.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="mb-4">
                <span className="text-purple-600 font-bold text-lg">Step 1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Join as a UniCash Member</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Choose your membership plan — UniOne, UniPlus, or UniMax — and instantly unlock your monthly UniCash Credits.
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Your membership gives you free entries to the Grand Prize every month.
                  </span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="mb-4">
                <span className="text-purple-600 font-bold text-lg">Step 2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Use Credits to Enter Bonus Draws</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Spend your UniCash Credits to join limited-entry Bonus Draws.
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Each draw has a fixed entrant cap and a one-entry-per-member rule to keep the odds fair and transparent.
                  </span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="mb-4">
                <span className="text-purple-600 font-bold text-lg">Step 3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Draw & Public Winners</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    When a draw fills, UniCash runs a verified random selection.
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    All results are published publicly with draw ID and SHA256 hash.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-gray-700 mt-8 max-w-3xl mx-auto">
            UniCash is built on fairness. Every draw is limited, verifiable, and open to all members.
          </p>
        </div>
      </section>

      {/* Membership Plans */}
      <section 
        id="membership-plans" 
        className={`py-16 bg-gradient-to-b from-purple-50 to-white scroll-mt-20 transition-all duration-1000 ${
          highlightMembership 
            ? 'ring-4 ring-purple-500 ring-offset-4 rounded-2xl bg-gradient-to-b from-purple-100 to-white shadow-2xl' 
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold text-gray-900 mb-4 transition-all duration-500 ${
              highlightMembership ? 'text-purple-600 scale-105' : ''
            }`}>
              Membership Plans
            </h2>
            <p className="text-xl text-gray-600">
              Choose a plan, get monthly credits, and unlock every member draw.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans
                .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((plan: any, index: number) => (
                <ScrollReveal key={plan.id} delay={index * 150}>
                  <MembershipCard plan={plan} />
                </ScrollReveal>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <div className="flex justify-center items-center space-x-6 flex-wrap mb-6 gap-4">
              <Image 
                src="/images/icons/payment/stripe.svg" 
                alt="Stripe" 
                height={48}
                width={80}
                className=""
              />
              <Image 
                src="/images/icons/payment/apple-pay.svg" 
                alt="Apple Pay" 
                height={32}
                width={78}
                className=""
              />
              <Image 
                src="/images/icons/payment/paypal.svg" 
                alt="PayPal" 
                height={48}
                width={143}
                className=""
              />
              <Image 
                src="/images/icons/payment/master-card.svg" 
                alt="Mastercard" 
                height={48}
                width={64}
                className=""
              />
              <Image 
                src="/images/icons/payment/visa.svg" 
                alt="Visa" 
                height={48}
                width={119}
                className=""
              />
            </div>
            <p className="text-sm text-gray-600 max-w-4xl mx-auto">
              Bonus Draws are members-only with strictly limited entries/entrants for better odds. Credits are used to enter Bonus Draws; the required credits per entry vary by draw and are clearly shown before you enter. Boost Packs are one-time purchases (no auto-renew) and credits never expire.
            </p>
          </div>
        </div>
      </section>

      {/* Exclusive Bonus Draws */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Exclusive Bonus Draws</h2>
            <p className="text-xl text-gray-600">
              Enjoy weekly giveaways with odds and verified results. Limited entries — one per member, fair for everyone.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {draws.map((draw: any, index: number) => (
                <ScrollReveal key={draw.id} delay={index * 100}>
                  <DrawCard
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
                </ScrollReveal>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/giveaways">
              <button className="btn-primary">
                View All Draws →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Winners */}
      <RecentWinnersSection />

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}

