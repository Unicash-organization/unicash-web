'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface MembershipRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  boostPackId?: string;
  message?: string;
  isPaused?: boolean;
  isCancelled?: boolean;
}

export default function MembershipRequiredModal({
  isOpen,
  onClose,
  boostPackId,
  message,
  isPaused = false,
  isCancelled = false,
}: MembershipRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // Determine message and button text based on membership status
  const getModalContent = () => {
    if (isPaused) {
      return {
        title: 'Your membership is paused',
        message: 'Boost Packs are only available for active members. Please resume your membership to continue.',
        primaryButton: 'Resume Membership',
        secondaryButton: 'Maybe later',
        primaryAction: () => {
          onClose();
          router.push('/dashboard/membership');
        },
      };
    } else if (isCancelled) {
      return {
        title: 'Membership Required',
        message: 'Your membership has been cancelled. Please reactivate your membership to purchase Boost Packs.',
        primaryButton: 'Reactivate Membership',
        secondaryButton: 'Cancel',
        primaryAction: () => {
          onClose();
          router.push('/checkout');
        },
      };
    } else {
      return {
        title: 'Membership Required',
        message: message || 'You need to be a UNICASH member to purchase Boost Packs. Please select a membership plan to continue.',
        primaryButton: 'Get Membership',
        secondaryButton: 'Cancel',
        primaryAction: () => {
          onClose();
          if (boostPackId) {
            router.push(`/checkout?boostPackId=${boostPackId}`);
          } else {
            router.push('/checkout');
          }
        },
      };
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
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
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {modalContent.title}
          </h2>
          <p className="text-gray-600 mb-6">{modalContent.message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              {modalContent.secondaryButton}
            </button>
            <button
              onClick={modalContent.primaryAction}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition"
            >
              {modalContent.primaryButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

