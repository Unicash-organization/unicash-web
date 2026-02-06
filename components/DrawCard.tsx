'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatTimeRemaining } from '@/lib/utils';
import ConfirmEntryModal from './ConfirmEntryModal';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface DrawCardProps {
  id: string;
  title: string;
  image?: string;
  creditsPerEntry: number;
  entrants: number;
  cap: number;
  closedAt: string;
  state: string;
  requiresMembership?: boolean;
}

export default function DrawCard({
  id,
  title,
  image,
  creditsPerEntry,
  entrants,
  cap,
  closedAt,
  state,
  requiresMembership = false,
}: DrawCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [checkingEntry, setCheckingEntry] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [checkingWaitlist, setCheckingWaitlist] = useState(false);
  const [addingToWaitlist, setAddingToWaitlist] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);

  useEffect(() => {
    setTimeRemaining(formatTimeRemaining(closedAt));
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(closedAt));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [closedAt]);

  useEffect(() => {
    if (user && id) {
      checkUserEntry();
      checkWaitlistStatus();
      if (requiresMembership) {
        checkMembership();
      }
    }
  }, [user, id, requiresMembership]);

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
      const res = await api.waitlist.check(id).catch(() => ({ data: { isOnWaitlist: false } }));
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
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    setAddingToWaitlist(true);
    try {
      await api.waitlist.add(id);
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
      await api.waitlist.remove(id);
      setIsOnWaitlist(false);
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    } finally {
      setAddingToWaitlist(false);
    }
  };

  // Check if draw is closed based on closedAt date, not just state
  const isClosedByDate = new Date(closedAt) < new Date();
  // Skip sold out check if unlimited capacity (cap = -1)
  const status: 'open' | 'soldOut' | 'closed' | 'canceled' = 
    state === 'canceled' ? 'canceled'
    : cap !== -1 && (state === 'soldOut' || entrants >= cap) ? 'soldOut' 
    : state === 'closed' || isClosedByDate ? 'closed' 
    : 'open';

  const getButtonText = () => {
    switch (status) {
      case 'canceled':
        return 'Canceled';
      case 'soldOut':
        return 'Sold Out';
      case 'closed':
        return 'Closed';
      default:
        return 'Enter Now';
    }
  };

  const getButtonClass = () => {
    switch (status) {
      case 'canceled':
      case 'soldOut':
      case 'closed':
        return 'bg-gray-300 text-gray-600 cursor-not-allowed';
      default:
        return 'btn-primary';
    }
  };

  // Check if user has active membership for bonus draws
  // Mirror backend DrawsService.enterDraw logic:
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

  const canEnterBonusDraw = !requiresMembership || hasActiveMembership;

  // Debug logging
  if (requiresMembership && user) {
    console.log('DrawCard Debug:', {
      drawId: id,
      requiresMembership,
      membership: membership,
      isPaused: membership?.isPaused,
      status: membership?.status,
      hasActiveMembership,
      canEnterBonusDraw
    });
  }

  return (
    <div
      className="card overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <Link href={`/giveaways/${id}`}>
        <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-500 overflow-hidden">
          {requiresMembership && (
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-accent-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                💎 Bonus Draw
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              🎁 State
            </span>
          </div>
          {/* Placeholder image - replace with actual image */}
          <div className="w-full h-full flex items-center justify-center text-white text-6xl">
            🎁
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/giveaways/${id}`}>
          <h3 className="font-bold text-lg mb-2 hover:text-accent-500 transition line-clamp-2">
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="font-semibold text-accent-500">{creditsPerEntry} Credit = 1 entry</span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{entrants}/{cap === -1 ? '∞' : cap} entrants</span>
            <span>time left: {timeRemaining}</span>
          </div>
          {cap !== -1 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-accent-500 h-2 rounded-full transition-all"
                style={{ width: `${(entrants / cap) * 100}%` }}
              />
            </div>
          )}
          {cap === -1 && (
            <p className="text-xs text-gray-400 italic">Unlimited entries</p>
          )}
        </div>

        {hasEntered ? (
          <div className="w-full py-2 px-4 rounded-lg bg-green-50 border border-green-200 text-center">
            <p className="text-sm text-green-800 font-semibold">✓ You've entered this draw</p>
          </div>
        ) : status === 'open' ? (
          <>
            {requiresMembership && !canEnterBonusDraw && user && (
              <div className="w-full mb-2 py-2 px-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
                <p className="text-xs text-orange-800">
                  {isCanceled ? '🚫 Membership cancelled' : membership?.isPaused ? '⏸️ Membership paused' : '💎 Active membership required'}
                </p>
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                // ✅ Block click if canceled membership or cannot enter
                if (requiresMembership && !canEnterBonusDraw) {
                  return;
                }
                setShowConfirmModal(true);
              }}
              className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                requiresMembership && !canEnterBonusDraw ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : getButtonClass()
              }`}
              disabled={checkingEntry || checkingMembership || (requiresMembership && !canEnterBonusDraw)}
            >
              {checkingEntry || checkingMembership ? 'Checking...' : getButtonText()}
            </button>
          </>
        ) : (status === 'soldOut' || status === 'closed') && user ? (
          <div className="space-y-2">
            <div className="w-full py-2 px-4 rounded-lg bg-gray-100 text-gray-600 text-center text-sm">
              {getButtonText()}
            </div>
            {isOnWaitlist ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveFromWaitlist();
                }}
                className="w-full py-2 px-4 rounded-lg font-semibold transition bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                disabled={addingToWaitlist || checkingWaitlist}
              >
                {addingToWaitlist ? 'Removing...' : '✓ On Waitlist - Click to Remove'}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToWaitlist();
                }}
                className="w-full py-2 px-4 rounded-lg font-semibold transition bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
                disabled={addingToWaitlist || checkingWaitlist}
              >
                {addingToWaitlist ? 'Adding...' : checkingWaitlist ? 'Checking...' : '🔔 Get Notified'}
              </button>
            )}
          </div>
        ) : (status === 'soldOut' || status === 'closed') && !user ? (
          <div className="space-y-2">
            <div className="w-full py-2 px-4 rounded-lg bg-gray-100 text-gray-600 text-center text-sm">
              {getButtonText()}
            </div>
            <Link href="/login" className="block">
              <button className="w-full py-2 px-4 rounded-lg font-semibold transition bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200">
                🔔 Get Notified
              </button>
            </Link>
          </div>
        ) : (
          <div className="w-full py-2 px-4 rounded-lg bg-gray-100 text-gray-600 text-center text-sm">
            {getButtonText()}
          </div>
        )}
      </div>

      {/* Confirm Entry Modal */}
      <ConfirmEntryModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        draw={{
          id,
          title,
          costPerEntry: creditsPerEntry,
          state,
          entrants,
          cap,
          closedAt,
          requiresMembership,
        }}
        onSuccess={() => {
          // Optionally refresh data or update UI
          window.location.reload();
        }}
      />
    </div>
  );
}

