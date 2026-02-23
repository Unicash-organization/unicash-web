'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// Format as 04XX XXX XXX while typing
const formatAustralianPhone = (value: string): string => {
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length > 0 && !cleaned.startsWith('04')) {
    if (cleaned === '0' || cleaned.startsWith('04')) {
      // allow
    } else {
      return '';
    }
  }
  if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);
  if (cleaned.length > 6) return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  if (cleaned.length > 4) return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  return cleaned;
};

// Convert DB format (+614XXXXXXXX) → display format (04XX XXX XXX)
const denormalizePhoneNumber = (phone: string): string => {
  if (!phone?.trim()) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('614') && cleaned.length === 11) {
    return formatAustralianPhone(`0${cleaned.substring(2)}`);
  }
  if (cleaned.startsWith('04') && cleaned.length === 10) {
    return formatAustralianPhone(cleaned);
  }
  return phone;
};

// Convert display format (04XX XXX XXX) → DB format (+614XXXXXXXX)
const normalizePhoneNumber = (phone: string): string => {
  if (!phone?.trim()) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('04') && cleaned.length === 10) {
    return `+61${cleaned.substring(1)}`;
  }
  return phone;
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    streetAddress: '',
    city: '',
    state: '',
    postcode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [checkingNewsletter, setCheckingNewsletter] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: denormalizePhoneNumber((user as any).phone || ''),
        address: user.metadata?.address || '',
        streetAddress: user.metadata?.streetAddress || '',
        city: user.metadata?.city || '',
        state: user.metadata?.state || '',
        postcode: user.metadata?.postcode || '',
      });
      checkNewsletterStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkNewsletterStatus = async () => {
    if (!user) return;
    
    try {
      setCheckingNewsletter(true);
      const res = await api.newsletter.checkSubscription();
      console.log('Newsletter check response:', res.data);
      setNewsletterSubscribed(res.data?.subscribed || false);
    } catch (error: any) {
      console.error('Error checking newsletter status:', error);
      console.error('Error response:', error.response?.data);
      setNewsletterSubscribed(false);
    } finally {
      setCheckingNewsletter(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to unsubscribe from the newsletter? You will no longer receive updates on bonus draws and winners.')) {
      return;
    }

    try {
      setUnsubscribing(true);
      await api.newsletter.unsubscribe();
      setNewsletterSubscribed(false);
      alert('Successfully unsubscribed from newsletter');
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      alert(error.response?.data?.message || 'Failed to unsubscribe. Please try again.');
    } finally {
      setUnsubscribing(false);
    }
  };

  const validatePhone = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.phone.trim()) {
      const cleaned = formData.phone.replace(/\D/g, '');
      if (cleaned.length !== 10 || !cleaned.startsWith('04')) {
        newErrors.phone = 'Please enter a valid Australian mobile number (04XX XXX XXX)';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    setSaving(true);
    try {
      await api.users.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.trim() ? normalizePhoneNumber(formData.phone) : '',
        metadata: {
          address: formData.address,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
        },
      });
      await refreshUser();
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const australianStates = [
    'Australian Capital Territory',
    'New South Wales',
    'Northern Territory',
    'Queensland',
    'South Australia',
    'Tasmania',
    'Victoria',
    'Western Australia',
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My profile</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: formatAustralianPhone(e.target.value) });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="04XX XXX XXX"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">Enter your Australian mobile number (04XX XXX XXX)</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            <input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State/Territory</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select State</option>
              {australianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
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

      {/* Newsletter Subscription Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Newsletter Subscription</h2>
        {checkingNewsletter ? (
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span>Checking subscription status...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 font-medium">Email: {user?.email}</p>
                <p className={`text-sm mt-1 ${
                  newsletterSubscribed ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {newsletterSubscribed 
                    ? '✓ Subscribed to newsletter' 
                    : 'Not subscribed to newsletter'}
                </p>
              </div>
              {newsletterSubscribed && (
                <button
                  onClick={handleUnsubscribe}
                  disabled={unsubscribing}
                  className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
                </button>
              )}
            </div>
            {!newsletterSubscribed && (
              <p className="text-sm text-gray-500">
                You can subscribe to our newsletter from the homepage to receive updates on bonus draws and winners.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

