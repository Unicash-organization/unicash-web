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
import ConfirmModal from '@/components/ConfirmModal';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, refreshUser } = useAuth();
  const [draws, setDraws] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightMembership, setHighlightMembership] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState<string | null>(null);
  const [selectedDowngradePlanId, setSelectedDowngradePlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [drawsRes, plansRes, bannersRes, membershipRes] = await Promise.all([
          api.draws.getAll(user?.id), // Pass userId for early access filtering
          api.membership.getPlans(),
          api.banners.getByPage('homepage').catch(() => ({ data: [] })),
          user ? api.membership.getUserMembership().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        setDraws(drawsRes.data.slice(0, 6)); // Get first 6 draws
        setPlans(plansRes.data);
        setBanners(bannersRes.data || []);
        setMembership(membershipRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

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

  const formatMembershipDate = (date: string | Date) => {
    const { formatUTCDateOnly } = require('@/lib/timezone');
    return formatUTCDateOnly(date);
  };

  const isPlanUpgrade = (oldPlan: any, newPlan: any): boolean => {
    const tierOrder: Record<string, number> = {
      'basic': 1,
      'premium': 2,
      'uni_one': 3,
      'uni_plus': 4,
      'uni_max': 5,
      'elite': 6,
    };

    const oldTierOrder = tierOrder[oldPlan?.tier] || 0;
    const newTierOrder = tierOrder[newPlan?.tier] || 0;

    if (newTierOrder > oldTierOrder) return true;
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly > oldPlan.priceMonthly) return true;
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly === oldPlan.priceMonthly && newPlan.freeCreditsPerPeriod > oldPlan.freeCreditsPerPeriod) return true;

    return false;
  };

  const handleUpgrade = (planId: string) => {
    if (actionLoading !== null) return;
    
    const newPlan = plans.find((p: any) => p.id === planId);
    if (!newPlan || !membership?.plan) return;
    
    if (membership.planId === planId) return;
    
    const isUpgrade = isPlanUpgrade(membership.plan, newPlan);
    
    if (isUpgrade && membership.pendingUpgradePlanId) {
      alert('You already have a pending upgrade scheduled.');
      return;
    }
    
    if (!isUpgrade && membership.pendingDowngradePlanId) {
      alert('You already have a pending downgrade scheduled.');
      return;
    }
    
    if (isUpgrade) {
      setSelectedUpgradePlanId(planId);
      setShowUpgradeConfirm(true);
    } else {
      setSelectedDowngradePlanId(planId);
      setShowDowngradeConfirm(true);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedUpgradePlanId) return;
    
    setShowUpgradeConfirm(false);
    const loadingKey = `upgrade-${selectedUpgradePlanId}`;
    setActionLoading(loadingKey);
    
    try {
      await api.membership.upgrade(selectedUpgradePlanId);
      
      // Reload membership data
      const membershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(membershipRes.data);
      await refreshUser();
      
      setActionLoading(null);
      setSelectedUpgradePlanId(null);
      alert('Upgrade scheduled successfully! Your plan will be upgraded on your next billing date.');
    } catch (error: any) {
      console.error('Error upgrading:', error);
      setActionLoading(null);
      setSelectedUpgradePlanId(null);
      alert(error.response?.data?.message || 'Failed to upgrade membership');
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedDowngradePlanId) return;
    
    setShowDowngradeConfirm(false);
    const loadingKey = `downgrade-${selectedDowngradePlanId}`;
    setActionLoading(loadingKey);
    
    try {
      await api.membership.upgrade(selectedDowngradePlanId);
      
      // Reload membership data
      const membershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(membershipRes.data);
      await refreshUser();
      
      setActionLoading(null);
      setSelectedDowngradePlanId(null);
      alert('Downgrade scheduled successfully. It will apply on your next billing date.');
    } catch (error: any) {
      console.error('Error downgrading:', error);
      setActionLoading(null);
      setSelectedDowngradePlanId(null);
      alert(error.response?.data?.message || 'Failed to downgrade membership');
    }
  };

  return (
    <div className="overflow-x-hidden w-full">
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
      <section className="py-16 bg-white w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
                <li className="flex items-start gap-[10px]">
                  <svg width="16" className="w-4 h-4 shrink-0"  height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_201_567"  maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
<path d="M16 0H0V16H16V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_201_567)">
<path d="M8 1.33325C4.32667 1.33325 1.33333 4.32659 1.33333 7.99992C1.33333 11.6733 4.32667 14.6666 8 14.6666C11.6733 14.6666 14.6667 11.6733 14.6667 7.99992C14.6667 4.32659 11.6733 1.33325 8 1.33325ZM11.1867 6.46658L7.40666 10.2466C7.31333 10.3399 7.18667 10.3933 7.05333 10.3933C6.92 10.3933 6.79333 10.3399 6.7 10.2466L4.81333 8.35992C4.62 8.16658 4.62 7.84658 4.81333 7.65325C5.00666 7.45992 5.32666 7.45992 5.52 7.65325L7.05333 9.18658L10.48 5.75992C10.6733 5.56659 10.9933 5.56659 11.1867 5.75992C11.38 5.95325 11.38 6.26658 11.1867 6.46658Z" fill="url(#paint0_radial_201_567)"/>
</g>
<defs>
<radialGradient id="paint0_radial_201_567" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.05697 4.4814) scale(22.308 13.3333)">
<stop stopColor="#6356E5"/>
<stop offset="1" stopColor="#B27AFF"/>
</radialGradient>
</defs>
</svg>
                  <span className="text-gray-700 text-sm">
                    Choose your membership plan — UniOne, UniPlus, or UniMax — and instantly unlock your monthly UniCash Credits.
                  </span>
                </li>
                <li className="flex items-start gap-[10px]">
                  <svg width="16" className="w-4 h-4 shrink-0"  height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_201_567"  maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
<path d="M16 0H0V16H16V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_201_567)">
<path d="M8 1.33325C4.32667 1.33325 1.33333 4.32659 1.33333 7.99992C1.33333 11.6733 4.32667 14.6666 8 14.6666C11.6733 14.6666 14.6667 11.6733 14.6667 7.99992C14.6667 4.32659 11.6733 1.33325 8 1.33325ZM11.1867 6.46658L7.40666 10.2466C7.31333 10.3399 7.18667 10.3933 7.05333 10.3933C6.92 10.3933 6.79333 10.3399 6.7 10.2466L4.81333 8.35992C4.62 8.16658 4.62 7.84658 4.81333 7.65325C5.00666 7.45992 5.32666 7.45992 5.52 7.65325L7.05333 9.18658L10.48 5.75992C10.6733 5.56659 10.9933 5.56659 11.1867 5.75992C11.38 5.95325 11.38 6.26658 11.1867 6.46658Z" fill="url(#paint0_radial_201_567)"/>
</g>
<defs>
<radialGradient id="paint0_radial_201_567" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.05697 4.4814) scale(22.308 13.3333)">
<stop stopColor="#6356E5"/>
<stop offset="1" stopColor="#B27AFF"/>
</radialGradient>
</defs>
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
                <li className="flex items-start gap-[10px]">
                  <svg width="16" className="w-4 h-4 shrink-0"  height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_201_567"  maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
<path d="M16 0H0V16H16V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_201_567)">
<path d="M8 1.33325C4.32667 1.33325 1.33333 4.32659 1.33333 7.99992C1.33333 11.6733 4.32667 14.6666 8 14.6666C11.6733 14.6666 14.6667 11.6733 14.6667 7.99992C14.6667 4.32659 11.6733 1.33325 8 1.33325ZM11.1867 6.46658L7.40666 10.2466C7.31333 10.3399 7.18667 10.3933 7.05333 10.3933C6.92 10.3933 6.79333 10.3399 6.7 10.2466L4.81333 8.35992C4.62 8.16658 4.62 7.84658 4.81333 7.65325C5.00666 7.45992 5.32666 7.45992 5.52 7.65325L7.05333 9.18658L10.48 5.75992C10.6733 5.56659 10.9933 5.56659 11.1867 5.75992C11.38 5.95325 11.38 6.26658 11.1867 6.46658Z" fill="url(#paint0_radial_201_567)"/>
</g>
<defs>
<radialGradient id="paint0_radial_201_567" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.05697 4.4814) scale(22.308 13.3333)">
<stop stopColor="#6356E5"/>
<stop offset="1" stopColor="#B27AFF"/>
</radialGradient>
</defs>
</svg>
                  <span className="text-gray-700 text-sm">
                    Spend your UniCash Credits to join limited-entry Bonus Draws.
                  </span>
                </li>
                <li className="flex items-start gap-[10px]">
                  <svg width="16" className="w-4 h-4 shrink-0"  height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_201_567"  maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
<path d="M16 0H0V16H16V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_201_567)">
<path d="M8 1.33325C4.32667 1.33325 1.33333 4.32659 1.33333 7.99992C1.33333 11.6733 4.32667 14.6666 8 14.6666C11.6733 14.6666 14.6667 11.6733 14.6667 7.99992C14.6667 4.32659 11.6733 1.33325 8 1.33325ZM11.1867 6.46658L7.40666 10.2466C7.31333 10.3399 7.18667 10.3933 7.05333 10.3933C6.92 10.3933 6.79333 10.3399 6.7 10.2466L4.81333 8.35992C4.62 8.16658 4.62 7.84658 4.81333 7.65325C5.00666 7.45992 5.32666 7.45992 5.52 7.65325L7.05333 9.18658L10.48 5.75992C10.6733 5.56659 10.9933 5.56659 11.1867 5.75992C11.38 5.95325 11.38 6.26658 11.1867 6.46658Z" fill="url(#paint0_radial_201_567)"/>
</g>
<defs>
<radialGradient id="paint0_radial_201_567" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.05697 4.4814) scale(22.308 13.3333)">
<stop stopColor="#6356E5"/>
<stop offset="1" stopColor="#B27AFF"/>
</radialGradient>
</defs>
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
                <li className="flex items-start gap-[10px]">
                  <svg width="16" className="w-4 h-4 shrink-0"  height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_201_567"  maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
<path d="M16 0H0V16H16V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_201_567)">
<path d="M8 1.33325C4.32667 1.33325 1.33333 4.32659 1.33333 7.99992C1.33333 11.6733 4.32667 14.6666 8 14.6666C11.6733 14.6666 14.6667 11.6733 14.6667 7.99992C14.6667 4.32659 11.6733 1.33325 8 1.33325ZM11.1867 6.46658L7.40666 10.2466C7.31333 10.3399 7.18667 10.3933 7.05333 10.3933C6.92 10.3933 6.79333 10.3399 6.7 10.2466L4.81333 8.35992C4.62 8.16658 4.62 7.84658 4.81333 7.65325C5.00666 7.45992 5.32666 7.45992 5.52 7.65325L7.05333 9.18658L10.48 5.75992C10.6733 5.56659 10.9933 5.56659 11.1867 5.75992C11.38 5.95325 11.38 6.26658 11.1867 6.46658Z" fill="url(#paint0_radial_201_567)"/>
</g>
<defs>
<radialGradient id="paint0_radial_201_567" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.05697 4.4814) scale(22.308 13.3333)">
<stop stopColor="#6356E5"/>
<stop offset="1" stopColor="#B27AFF"/>
</radialGradient>
</defs>
</svg>
                  <span className="text-gray-700 text-sm">
                    When a draw fills, UniCash runs a verified random selection.
                  </span>
                </li>
                <li className="flex items-start gap-[10px]">
                  <svg width="16" className="w-4 h-4 shrink-0"  height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_201_567"  maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
<path d="M16 0H0V16H16V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_201_567)">
<path d="M8 1.33325C4.32667 1.33325 1.33333 4.32659 1.33333 7.99992C1.33333 11.6733 4.32667 14.6666 8 14.6666C11.6733 14.6666 14.6667 11.6733 14.6667 7.99992C14.6667 4.32659 11.6733 1.33325 8 1.33325ZM11.1867 6.46658L7.40666 10.2466C7.31333 10.3399 7.18667 10.3933 7.05333 10.3933C6.92 10.3933 6.79333 10.3399 6.7 10.2466L4.81333 8.35992C4.62 8.16658 4.62 7.84658 4.81333 7.65325C5.00666 7.45992 5.32666 7.45992 5.52 7.65325L7.05333 9.18658L10.48 5.75992C10.6733 5.56659 10.9933 5.56659 11.1867 5.75992C11.38 5.95325 11.38 6.26658 11.1867 6.46658Z" fill="url(#paint0_radial_201_567)"/>
</g>
<defs>
<radialGradient id="paint0_radial_201_567" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.05697 4.4814) scale(22.308 13.3333)">
<stop stopColor="#6356E5"/>
<stop offset="1" stopColor="#B27AFF"/>
</radialGradient>
</defs>
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
        className={`py-16 bg-gradient-to-b from-purple-50 to-white scroll-mt-20 transition-all duration-1000 w-full overflow-x-hidden ${
          highlightMembership 
            ? 'ring-4 ring-purple-500 ring-offset-4 rounded-2xl bg-gradient-to-b from-purple-100 to-white shadow-2xl' 
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-4 text-purple-600 transition-all duration-500 ${
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
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {plans
                .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((plan: any, index: number) => (
                <ScrollReveal key={plan.id} delay={index * 150} className="h-full">
                  <MembershipCard 
                    plan={plan} 
                    membership={membership}
                    actionLoading={actionLoading}
                    onUpgradeDowngrade={handleUpgrade}
                    showUpgradeConfirm={showUpgradeConfirm && selectedUpgradePlanId === plan.id}
                    showDowngradeConfirm={showDowngradeConfirm && selectedDowngradePlanId === plan.id}
                  />
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
      <section className="py-16 bg-white w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-purple-600 mb-4">Exclusive Bonus Draws</h2>
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
        </div>
      </section>

      {/* Recent Winners */}
      <RecentWinnersSection />

      {/* Newsletter */}
      <NewsletterSection />

      {/* Upgrade Confirmation Modal */}
      {selectedUpgradePlanId && (
        <ConfirmModal
          isOpen={showUpgradeConfirm}
          onClose={() => {
            setShowUpgradeConfirm(false);
            setSelectedUpgradePlanId(null);
            if (actionLoading === `upgrade-${selectedUpgradePlanId}`) setActionLoading(null);
          }}
          onConfirm={handleConfirmUpgrade}
          title={`You're upgrading to ${plans.find((p: any) => p.id === selectedUpgradePlanId)?.name || 'this plan'}${plans.find((p: any) => p.id === selectedUpgradePlanId)?.tier === 'uni_plus' ? ' (Gold)' : plans.find((p: any) => p.id === selectedUpgradePlanId)?.tier === 'uni_max' ? ' (Platinum)' : plans.find((p: any) => p.id === selectedUpgradePlanId)?.tier === 'uni_one' ? ' (Silver)' : ''}.`}
          message={
            membership?.currentPeriodEnd
              ? `This change will take effect on your next billing date (${formatMembershipDate(membership.currentPeriodEnd)}). No payment will be charged today.`
              : 'This change will take effect on your next billing date. No payment will be charged today.'
          }
          confirmText="Confirm Upgrade"
          cancelText="Cancel"
          type="info"
        />
      )}

      {/* Downgrade Confirmation Modal */}
      <ConfirmModal
        isOpen={showDowngradeConfirm}
        onClose={() => {
          setShowDowngradeConfirm(false);
          setSelectedDowngradePlanId(null);
          if (selectedDowngradePlanId && actionLoading === `downgrade-${selectedDowngradePlanId}`) setActionLoading(null);
        }}
        onConfirm={handleConfirmDowngrade}
        title={`You're downgrading to ${plans.find((p: any) => p.id === selectedDowngradePlanId)?.name || 'this plan'}${plans.find((p: any) => p.id === selectedDowngradePlanId)?.tier === 'uni_plus' ? ' (Gold)' : plans.find((p: any) => p.id === selectedDowngradePlanId)?.tier === 'uni_max' ? ' (Platinum)' : plans.find((p: any) => p.id === selectedDowngradePlanId)?.tier === 'uni_one' ? ' (Silver)' : ''}.`}
        message={
          membership?.currentPeriodEnd
            ? `This change will take effect on your next billing date (${formatMembershipDate(membership.currentPeriodEnd)}). No payment will be charged today.`
            : 'This change will take effect on your next billing date. No payment will be charged today.'
        }
        confirmText="Confirm Downgrade"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}

