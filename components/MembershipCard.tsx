'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
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

interface MembershipCardProps {
  plan: {
    id: string;
    name: string;
    description?: string;
    priceMonthly: number;
    tier: string;
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
    freeCreditsPerPeriod?: number;
    grandPrizeEntriesPerPeriod?: number;
  };
}

export default function MembershipCard({ plan }: MembershipCardProps) {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkMembership();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkMembership = async () => {
    if (!user) return;
    try {
      const response = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(response.data);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const badgeText = plan.badgeText || plan.featuresConfig?.badge?.text;
  const badgeType = plan.badgeType || plan.featuresConfig?.badge?.type;
  const features = plan.featuresConfig?.features || [];
  
  // Check if user has this plan
  const hasThisPlan = membership?.planId === plan.id;
  const hasActiveMembership = membership?.status === 'active' && 
    membership?.currentPeriodEnd && 
    new Date(membership.currentPeriodEnd) > new Date();
  const isCancelled = membership?.status === 'canceled' || membership?.cancelAtPeriodEnd;
  const isPaused = membership?.isPaused;

  // Check if moving from current plan to this plan is an upgrade
  const isPlanUpgrade = (oldPlan: any, newPlan: any): boolean => {
    // Define tier hierarchy
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

    // If tier is higher, it's an upgrade
    if (newTierOrder > oldTierOrder) {
      return true;
    }

    // If same tier but higher price, it's an upgrade
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly > oldPlan.priceMonthly) {
      return true;
    }

    // If same tier and price but more credits, it's an upgrade
    if (
      newTierOrder === oldTierOrder &&
      newPlan.priceMonthly === oldPlan.priceMonthly &&
      newPlan.freeCreditsPerPeriod > oldPlan.freeCreditsPerPeriod
    ) {
      return true;
    }

    return false;
  };

  // Determine if this plan is upgrade or downgrade from current plan
  const isUpgrade = hasActiveMembership && membership?.plan 
    ? isPlanUpgrade(membership.plan, plan) 
    : false;
  const isDowngrade = hasActiveMembership && membership?.plan 
    ? !isPlanUpgrade(membership.plan, plan) && !hasThisPlan
    : false;

  // Get tier color
  const getTierColor = () => {
    if (plan.tier === 'uni_one') return 'text-gray-600'; // Silver
    if (plan.tier === 'uni_plus') return 'text-purple-600'; // Gold
    if (plan.tier === 'uni_max') return 'text-gray-600'; // Platinum
    return 'text-gray-600';
  };

  // Get badge style
  const getBadgeStyle = () => {
    if (badgeType === 'popular') {
      return 'bg-purple-600 text-white';
    }
    if (badgeType === 'best_value') {
      return 'bg-yellow-400 text-white';
    }
    return 'bg-gray-600 text-white';
  };

  // Render feature
  const renderFeature = (feature: PlanFeature, index: number) => {
    let displayText = feature.label;
    
    if (feature.type === 'grand_draw_entries' && feature.value) {
      displayText = `${feature.value} ${feature.unit || 'entry'} to Grand Draw every month`;
    } else if (feature.type === 'free_credits' && feature.value) {
      displayText = `+${feature.value} free ${feature.unit || 'credits'} / month`;
    } else if (feature.type === 'early_access' && feature.value) {
      displayText = `${feature.value}${feature.unit || 'h'} early access to new Bonus Draws`;
    } else if (feature.description) {
      displayText = feature.description;
    } else if (feature.type === 'comparison') {
      displayText = feature.label;
    } else if (feature.type === 'text') {
      displayText = feature.label;
    } else if (feature.type === 'access') {
      displayText = feature.description || feature.label;
    } else if (feature.type === 'support') {
      displayText = feature.label;
    }

    return (
      <div key={index} className="flex items-start text-sm">
        <svg 
          className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div className="flex-1">
          <span className="text-gray-700">{displayText}</span>
          {feature.subFeatures && feature.subFeatures.length > 0 && (
            <div className="mt-1 ml-7 space-y-1">
              {feature.subFeatures.map((subFeature, subIndex) => (
                <div key={subIndex} className="text-gray-600 text-xs">
                  {subFeature.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 relative transition-all hover:shadow-xl h-full flex flex-col ${
      badgeType === 'popular' ? 'border-2 border-purple-500' : 'border border-gray-200'
    }`}>

      {/* Header */}
      <div className="text-left mb-6 flex-shrink-0">
        <div className="flex gap-2 mb-2">
          <h3 className={`text-2xl font-bold ${getTierColor()}`}>
            {plan.name}
          </h3>
          {plan.tier === 'uni_one' && (
            <span className="text-gray-500">(Silver)</span>
          )}
          {plan.tier === 'uni_plus' && (
            <span className="text-purple-600">(Gold)</span>
          )}
          {plan.tier === 'uni_max' && (
            <span className="text-gray-500">(Platinum)</span>
          )}

          {/* Badge */}
          {badgeText && (
            <div className="bag">
              <span className={`${getBadgeStyle()} text-xs font-bold px-4 py-1 rounded-full`}>
                {badgeText}
              </span>
            </div>
          )}
        </div>
        {plan.description && (
          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
        )}
        <div className="mb-6">
          <span className={`text-4xl font-bold ${getTierColor()}`}>${parseFloat(plan.priceMonthly.toString()).toFixed(2)}</span>
          <span className="text-gray-500">/month</span>
        </div>
        
        {/* Show current plan badge */}
        {/* {hasThisPlan && hasActiveMembership && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-semibold text-center">
              ✓ Your Current Plan
            </p>
            {membership.currentPeriodEnd && (
              <p className="text-xs text-green-600 text-center mt-1">
                Next billing: {new Date(membership.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        )} */}

        {/* Paused Membership */}
        {isPaused ? (
          <Link href="/dashboard/membership">
            <button 
              disabled={loading}
              className="w-full py-3 px-6 rounded-full font-bold transition-all btn-primary"
            >
              {loading ? 'Loading...' : 'Resume Membership'}
            </button>
          </Link>
        ) : 
        /* Cancelled Membership */
        isCancelled ? (
          <Link href={`/checkout?planId=${plan.id}&reactivate=true`}>
            <button 
              disabled={loading}
              className={`w-full py-3 px-6 rounded-full font-bold transition-all ${
                hasThisPlan
                  ? 'btn-primary'
                  : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
              }`}
            >
              {loading ? 'Loading...' : 
                hasThisPlan 
                  ? 'Reactivate' 
                  : `Reactive on ${plan.name}${plan.tier === 'uni_plus' ? ' (Gold)' : plan.tier === 'uni_max' ? ' (Platinum)' : plan.tier === 'uni_one' ? ' (Silver)' : ''}`
              }
            </button>
          </Link>
        ) : 
        /* Active Membership */
        hasThisPlan ? (
          <Link href="#">
            <button 
              disabled={true}
              className="w-full py-3 px-6 rounded-full font-bold transition-all bg-gray-300 text-gray-600 cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Current Plan'}
            </button>
          </Link>
        ) : isUpgrade ? (
          <Link href={`/checkout?planId=${plan.id}&upgrade=true`}>
            <button 
              disabled={loading}
              className={`w-full py-3 px-6 rounded-full font-bold transition-all ${
                badgeType === 'popular' 
                  ? 'btn-primary' 
                  : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
              }`}
            >
              {loading ? 'Loading...' : 'Upgrade'}
            </button>
          </Link>
        ) : isDowngrade ? (
          <Link href={`/dashboard/membership?downgrade=${plan.id}`}>
            <button 
              disabled={loading}
              className={`w-full py-3 px-6 rounded-full font-bold transition-all ${
                badgeType === 'popular' 
                  ? 'btn-primary' 
                  : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
              }`}
            >
              {loading ? 'Loading...' : 'Downgrade'}
            </button>
          </Link>
        ) : (
          <Link href={`/checkout?planId=${plan.id}`}>
            <button 
              disabled={loading}
              className={`w-full py-3 px-6 rounded-full font-bold transition-all ${
                badgeType === 'popular' 
                  ? 'btn-primary' 
                  : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
              }`}
            >
              {loading ? 'Loading...' : 'Join Now'}
            </button>
          </Link>
        )}
      </div>

      {/* Features */}
      <div className="space-y-3 mb-6 flex-1">
        {features.length > 0 ? (
          features.map((feature, index) => renderFeature(feature, index))
        ) : (
          // Fallback to legacy features
          <>
            {plan.grandPrizeEntriesPerPeriod && (
              <div className="flex items-start text-sm">
                <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">
                  {plan.grandPrizeEntriesPerPeriod} {plan.grandPrizeEntriesPerPeriod > 1 ? 'entries' : 'entry'} to Grand Draw every month
                </span>
              </div>
            )}
            {plan.freeCreditsPerPeriod && plan.freeCreditsPerPeriod > 0 && (
              <div className="flex items-start text-sm">
                <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">
                  +{plan.freeCreditsPerPeriod} free credits / month
                </span>
              </div>
            )}
            <div className="flex items-start text-sm">
              <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">Cancel anytime</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
