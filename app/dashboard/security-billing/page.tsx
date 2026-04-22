'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import PaymentMethodsPanel from '@/components/PaymentMethodsPanel';
import { notifyAndRetryMembershipAfterPaymentUpdate } from '@/lib/membershipPaymentRetry';

export default function SecurityBillingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const passwordSectionRef = useRef<HTMLDivElement>(null);
  
  // Password state
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isFirstTimeChange, setIsFirstTimeChange] = useState(false);
  const [paymentPanelRefresh, setPaymentPanelRefresh] = useState(0);

  useEffect(() => {
    if (user && user.hasChangedPassword === false) {
      setIsFirstTimeChange(true);
      setTimeout(() => {
        passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const paymentUpdated = urlParams.get('paymentUpdated');

    if (paymentUpdated === 'true' && window.opener) {
      window.opener.postMessage({ type: 'STRIPE_PORTAL_DONE' }, window.location.origin);
      window.history.replaceState({}, '', window.location.pathname);
      window.close();
      return;
    }

    if (paymentUpdated === 'true') {
      window.history.replaceState({}, '', window.location.pathname);

      setTimeout(async () => {
        try {
          await refreshUser();
          await notifyAndRetryMembershipAfterPaymentUpdate({ quietIfMembershipHealthy: false });
          setPaymentPanelRefresh((n) => n + 1);
        } catch (error: unknown) {
          console.error('Error processing payment update:', error);
        }
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isFirstTimeChange && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (formData.newPassword.length < 9) {
      newErrors.newPassword = 'Password must be at least 9 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Verify user exists - if user is in dashboard, they are logged in
    // Token will be automatically added by apiClient interceptor from localStorage
    if (!user) {
      showToast('You are not logged in. Please log in again.', 'error');
      router.push('/login');
      return;
    }
    
    setSaving(true);
    try {
      await api.users.updatePassword({
        currentPassword: isFirstTimeChange ? undefined : formData.currentPassword,
        newPassword: formData.newPassword,
        skipCurrentPasswordCheck: isFirstTimeChange,
      });
      await refreshUser(); // Refresh user to update hasChangedPassword flag
      showToast('Password updated successfully!', 'success');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsFirstTimeChange(false); // Reset flag after successful change
    } catch (error: any) {
      if (error.response?.status === 401) {
        showToast('Your session has expired. Please log in again.', 'error');
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        router.push('/login');
      } else {
        showToast(error.response?.data?.message || 'Failed to update password', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Security & Billing</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`bg-white rounded-2xl shadow-lg p-6 ${isFirstTimeChange ? 'opacity-75' : ''}`}>
          <PaymentMethodsPanel
            refreshSignal={paymentPanelRefresh}
            wrapperClassName="space-y-4"
            onCardsChanged={() =>
              notifyAndRetryMembershipAfterPaymentUpdate({ quietIfMembershipHealthy: true })
            }
          />
        </div>

        {/* Password Panel */}
        <div 
          ref={passwordSectionRef}
          className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
            isFirstTimeChange ? 'ring-4 ring-purple-500 ring-opacity-50' : ''
          }`}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Password</h2>
          
          {isFirstTimeChange && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>First time changing password?</strong> You don't need to enter your current password since your account was created automatically. Just set a new password below.
              </p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-4">
              {!isFirstTimeChange && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, newPassword: e.target.value });
                      if (errors.newPassword) validate();
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 pr-10 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    minLength={9}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) validate();
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 pr-10 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setErrors({});
                }}
                className="text-gray-600 hover:text-gray-800 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
