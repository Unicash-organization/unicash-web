'use client';

import React from 'react';
import Link from 'next/link';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h3>
          <p className="text-gray-600">
            For security reasons, please change your password to something you'll remember.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Since your account was created automatically, you don't need to enter your current password for your first password change.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Later
          </button>
          <Link href="/dashboard/password">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
            >
              Change Password Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

