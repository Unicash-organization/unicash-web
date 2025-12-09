'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function PasswordPage() {
  const { user, refreshUser } = useAuth();
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

  useEffect(() => {
    // Check if this is the first time changing password
    if (user && user.hasChangedPassword === false) {
      setIsFirstTimeChange(true);
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isFirstTimeChange && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Verify user exists - if user is in dashboard, they are logged in
    // Token will be automatically added by apiClient interceptor from localStorage
    if (!user) {
      alert('You are not logged in. Please log in again.');
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
      alert('Password updated successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsFirstTimeChange(false); // Reset flag after successful change
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      } else {
        alert(error.response?.data?.message || 'Failed to update password');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Password</h1>
      
      {isFirstTimeChange && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl">
          <p className="text-sm text-yellow-800">
            <strong>First time changing password?</strong> You don't need to enter your current password since your account was created automatically. Just set a new password below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl">
        <div className="space-y-6">
          {!isFirstTimeChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current password <span className="text-red-500">*</span>
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
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
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
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
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
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
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
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-800 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

