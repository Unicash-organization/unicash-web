'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import MembershipRequiredModal from './MembershipRequiredModal';
import api from '@/lib/api';

interface PlanFeature {
  type: 'grand_draw_entries' | 'free_credits' | 'early_access' | 'support' | 'access' | 'text' | 'comparison';
  label: string;
  value?: number | string;
  unit?: string;
  description?: string;
  subFeatures?: PlanFeature[];
  icon?: string;
}

interface BoostPackCardProps {
  pack: {
    id: string;
    name: string;
    description?: string;
    price: number;
    credits: number;
    badgeText?: string;
    badgeType?: string;
    featuresConfig?: {
      features: PlanFeature[];
      badge?: {
        text: string;
        type: string;
      };
    };
    // Legacy support
    isPopular?: boolean;
  };
}

export default function BoostPackCard({ pack }: BoostPackCardProps) {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [userCredits, setUserCredits] = useState<{ boostCredits: number; membershipCredits: number } | null>(null);
  
  const badgeText = pack.badgeText || pack.featuresConfig?.badge?.text;
  const badgeType = pack.badgeType || pack.featuresConfig?.badge?.type || (pack.isPopular ? 'popular' : '');
  const features = pack.featuresConfig?.features || [];
  const isHighlighted = badgeType === 'popular';

  useEffect(() => {
    if (user) {
      checkMembership();
      // User already has credits from AuthContext
      setUserCredits({
        boostCredits: user.boostCredits || 0,
        membershipCredits: user.membershipCredits || 0,
      });
    }
  }, [user]);

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

  const handleGetBoostPack = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Don't proceed if checking membership
    if (checkingMembership) return;
    
    // Check if user has active membership (not paused, period valid)
    const hasActiveMembership = membership?.status === 'active' && 
      !membership?.isPaused && // Block if paused
      membership?.currentPeriodEnd && 
      new Date(membership.currentPeriodEnd) > new Date();
    
    const isPaused = membership?.isPaused;
    const isCancelled = membership?.status === 'canceled' || membership?.cancelAtPeriodEnd;
    
    if (!user || !hasActiveMembership || isPaused) {
      // Determine appropriate message based on membership status
      if (isPaused) {
        // Paused membership - special message
        setShowMembershipModal(true);
      } else if (isCancelled) {
        // Cancelled membership - redirect to reactivate
        setShowMembershipModal(true);
      } else {
        // No membership at all
        setShowMembershipModal(true);
      }
    } else {
      window.location.href = `/checkout?boostPackId=${pack.id}`;
    }
  };

  // Check if user can buy boost pack
  // Mirror backend logic used for draws:
  // - Block if status !== 'active'
  // - Block if isPaused === true
  // - Block if currentPeriodEnd exists AND is in the past
  const isCanceled = membership?.status === 'canceled';
  const periodEnded =
    membership?.currentPeriodEnd &&
    new Date(membership.currentPeriodEnd) < new Date();

  const hasActiveMembership =
    !!membership &&
    !isCanceled &&
    membership.status === 'active' &&
    !membership.isPaused &&
    !periodEnded;

  const canBuyBoostPack = !!(user && hasActiveMembership); // Ensure boolean, not null
  const isPaused = membership?.isPaused;

  // Get badge style
  const getBadgeStyle = () => {
    if (badgeType === 'popular') {
      return 'bg-yellow-400 text-gray-900';
    }
    if (badgeType === 'best_value') {
      return 'bg-yellow-400 text-gray-900';
    }
    return 'bg-gray-600 text-white';
  };

  // Get button style based on highlighted state
  const getButtonStyle = () => {
    if (isHighlighted) {
      return 'bg-yellow-400 text-gray-900 hover:bg-yellow-500';
    }
    return 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50';
  };

  // Render feature
  const renderFeature = (feature: PlanFeature, index: number) => {
    const displayText = feature.description || feature.label;

    return (
      <div key={index} className="flex items-start text-sm">
        <svg 
          className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
            isHighlighted ? 'text-white' : 'text-purple-600'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className={isHighlighted ? 'text-white/90' : 'text-gray-700'}>
          {displayText}
        </span>
      </div>
    );
  };

  return (
    <div className={`relative rounded-2xl p-6 transition-transform hover:scale-105 ${
      isHighlighted
        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-2xl'
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      {/* Badge - Top Right */}
      {badgeText && (
        <div className="absolute -top-2 -right-2">
          <span className={`${getBadgeStyle()} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
            {badgeText}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-2xl font-bold mb-3 ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
          {pack.name}
        </h3>
        
        <div className="mb-4">
          <span className={`text-4xl font-bold ${isHighlighted ? 'text-white' : 'text-purple-600'}`}>
            A${parseFloat(pack.price.toString()).toFixed(2)}
          </span>
        </div>
        
        <div className={`py-4 px-4 rounded-xl mb-4 ${
          isHighlighted ? 'bg-white/20' : 'bg-purple-50'
        }`}>
          <p className="text-center">
            <span className={`text-3xl font-bold ${isHighlighted ? 'text-white' : 'text-purple-600'}`}>
              {pack.credits}
            </span>
            <span className={isHighlighted ? 'text-white/90' : 'text-gray-600'}> Credits</span>
          </p>
        </div>
        
        {pack.description && (
          <p className={`text-sm text-center mb-4 ${isHighlighted ? 'text-white/90' : 'text-gray-600'}`}>
            {pack.description}
          </p>
        )}
        
        <p className={`text-sm text-center ${isHighlighted ? 'text-white/80' : 'text-gray-500'}`}>
          One-time purchase • Credits never expire
        </p>
      </div>

      {/* Show warning if membership paused, canceled, or inactive */}
      {user && !canBuyBoostPack && (
        <div className={`mb-4 p-3 rounded-lg text-center ${
          isHighlighted ? 'bg-white/20 border border-white/30' : 'bg-orange-50 border border-orange-200'
        }`}>
          <p className={`text-sm font-medium ${
            isHighlighted ? 'text-white' : 'text-orange-800'
          }`}>
            {isCanceled ? '🚫 Membership cancelled' : isPaused ? '⏸️ Membership paused' : '💎 Active membership required'}
          </p>
        </div>
      )}

      <button
        onClick={handleGetBoostPack}
        disabled={!!(checkingMembership || (user && !canBuyBoostPack))}
        className={`w-full py-3 px-4 rounded-full font-bold mb-6 transition ${
          checkingMembership || (user && !canBuyBoostPack)
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-50'
            : getButtonStyle()
        }`}
      >
        {checkingMembership ? 'Checking...' : `Get ${pack.name}`}
      </button>

      {/* Membership Required Modal */}
      <MembershipRequiredModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        boostPackId={pack.id}
        isPaused={membership?.isPaused}
        isCancelled={membership?.status === 'canceled' || membership?.cancelAtPeriodEnd}
      />

      {/* Features */}
      <div className={`space-y-3 text-sm ${
        isHighlighted ? 'text-white/90' : 'text-gray-700'
      }`}>
        {features.length > 0 ? (
          features.map((feature, index) => renderFeature(feature, index))
        ) : (
          // Fallback to default features
          <>
            <div className="flex items-start">
              <svg className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
                isHighlighted ? 'text-white' : 'text-purple-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Great for first-timers with limited entries</span>
            </div>
            <div className="flex items-start">
              <svg className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
                isHighlighted ? 'text-white' : 'text-purple-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Try UniCash fairness — every draw entry is verified</span>
            </div>
            <div className="flex items-start">
              <svg className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
                isHighlighted ? 'text-white' : 'text-purple-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No code-sharing. No bots.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
