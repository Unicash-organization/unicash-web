'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import MembershipRequiredModal from './MembershipRequiredModal';

interface ConfirmEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  draw: {
    id: string;
    title: string;
    costPerEntry: number;
    state: string;
    entrants: number;
    cap: number;
    closedAt?: string;
    requiresMembership?: boolean;
  };
  onSuccess?: () => void;
}

export default function ConfirmEntryModal({
  isOpen,
  onClose,
  draw,
  onSuccess,
}: ConfirmEntryModalProps) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [membership, setMembership] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setShowToast(false);
    } else if (draw.requiresMembership && user) {
      // Check user's membership status
      checkMembershipStatus();
    }
  }, [isOpen, draw.requiresMembership, user]);

  const checkMembershipStatus = async () => {
    if (!user) return;
    
    setCheckingMembership(true);
    try {
      const [membershipRes, plansRes] = await Promise.all([
        api.membership.getUserMembership().catch(() => ({ data: null })),
        api.membership.getPlans().catch(() => ({ data: [] })),
      ]);
      
      setMembership(membershipRes.data);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setCheckingMembership(false);
    }
  };

  const totalCredits = (user?.membershipCredits || 0) + (user?.boostCredits || 0);
  const hasEnoughCredits = totalCredits >= draw.costPerEntry;
  const isSoldOut = draw.state === 'soldOut' || draw.entrants >= draw.cap;
  // Check if draw is closed based on closedAt date, not just state
  const isClosedByDate = draw.closedAt ? new Date(draw.closedAt) < new Date() : false;
  const isClosed = draw.state === 'closed' || isClosedByDate;
  
  // Check if user has active membership
  const hasActiveMembership = membership?.status === 'active' && 
    membership?.currentPeriodEnd && 
    new Date(membership.currentPeriodEnd) > new Date();
  
  // Check if membership is required but user doesn't have it
  const needsMembership = draw.requiresMembership && (!user || !hasActiveMembership);

  const handleEnter = async () => {
    // If membership is required but user doesn't have it, redirect to checkout
    if (needsMembership) {
      handleGetMembership();
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate idempotency key to prevent double-click/duplicate entries
      const idempotencyKey = `entry-${draw.id}-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const response = await api.draws.enter(draw.id, idempotencyKey);
      
      // Refresh user data to get updated credits
      await refreshUser();
      
      // Show success toast
      setToastMessage('Entry confirmed!');
      setShowToast(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
        setShowToast(false);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to enter draw';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGetMembership = () => {
    onClose();
    // Get the first plan (or recommended plan) as default
    const defaultPlan = plans.find((p: any) => p.tier === 'uni_plus') || plans[0];
    const planId = defaultPlan?.id || '';
    
    // Store drawId in sessionStorage for redirect after checkout
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectDrawId', draw.id);
    }
    
    // Redirect to checkout with planId and drawId
    router.push(`/checkout?planId=${planId}&drawId=${draw.id}`);
  };

  const handleBuyBoostPack = () => {
    // Check if user has active membership
    const hasActiveMembership = membership?.status === 'active' && 
      membership?.currentPeriodEnd && 
      new Date(membership.currentPeriodEnd) > new Date();
    
    if (!user || !hasActiveMembership) {
      // Show membership required modal
      setShowMembershipModal(true);
    } else {
      onClose();
      router.push('/checkout');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-purple-600">Confirm Entry</h2>
          </div>

          {/* Body */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This draw requires <strong className="text-purple-600">{draw.costPerEntry} credits</strong>. Do you want to enter now?
            </p>

            {/* Membership Required Message */}
            {needsMembership && !checkingMembership && (
              <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-yellow-800 mb-1">Membership Required</h3>
                    <p className="text-sm text-yellow-700">
                      This draw is exclusive to UNICASH members. Join a membership plan to unlock access to this and other exclusive draws.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Not Enough Credits Warning */}
            {!error && !hasEnoughCredits && !isSoldOut && !isClosed && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700 text-sm">
                  Not enough credits. Buy a Boost Pack to continue.
                </span>
              </div>
            )}

            {/* Sold Out Warning */}
            {!error && isSoldOut && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700 text-sm">
                  This draw is sold out. Your credits were not used.
                </span>
              </div>
            )}

            {/* Closed Warning */}
            {!error && isClosed && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700 text-sm">
                  This draw has closed. Your credits were not used.
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading || checkingMembership}
              className="flex-1 px-4 py-3 bg-purple-100 text-purple-600 rounded-lg font-semibold hover:bg-purple-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            {checkingMembership ? (
              <button
                disabled
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
              >
                Checking...
              </button>
            ) : needsMembership ? (
              <button
                onClick={handleGetMembership}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition"
              >
                Get Membership
              </button>
            ) : !hasEnoughCredits && !isSoldOut && !isClosed ? (
              <button
                onClick={handleBuyBoostPack}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition"
              >
                Buy Boost Pack
              </button>
            ) : (
              <button
                onClick={handleEnter}
                disabled={loading || isSoldOut || isClosed}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Membership Required Modal */}
      <MembershipRequiredModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        isPaused={membership?.isPaused}
        isCancelled={membership?.status === 'canceled' || membership?.cancelAtPeriodEnd}
      />

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] transform transition-all duration-300 ease-in-out">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}

