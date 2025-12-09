'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function ContactPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.firstName || user?.lastName || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      await api.contacts.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });
      
      setSuccess(true);
      setFormData({
        name: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user?.firstName || user?.lastName || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: '',
        message: '',
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Support</h1>
          <p className="text-gray-600 mb-8">
            Have a question or need help? Fill out the form below and we'll get back to you as soon as possible.
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">
                ✓ Thank you for contacting us! We've received your message and will get back to you soon.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+61 4xx xxx xxx"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.subject ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                }`}
                placeholder="What is this regarding?"
              />
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                }`}
                placeholder="Please provide details about your inquiry..."
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">{errors.message}</p>
              )}
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Other Ways to Reach Us</h2>
            <div className="space-y-2 text-gray-600">
              <p>Email: support@unicash.com.au</p>
              <p>Response Time: We typically respond within 24-48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

