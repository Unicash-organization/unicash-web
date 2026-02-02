'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

type LoginMethod = 'password' | 'magic-link' | 'otp';

function LoginPageContent() {
  const { login, user, loading: authLoading, setAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingAuth, setVerifyingAuth] = useState<{
    isVerifying: boolean;
    method: 'magic-link' | 'oauth' | 'otp' | 'password-reset' | null;
    provider?: 'google' | 'facebook' | 'github' | 'apple';
  }>({
    isVerifying: false,
    method: null,
  });

  // Handle OAuth callback and magic link callback
  useEffect(() => {
    // Check query parameters first (for OAuth and some magic link formats)
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') || 'email';

    // Check hash fragment for Supabase magic link (access_token format)
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashParams = new URLSearchParams(hash.substring(1)); // Remove #
    const accessToken = hashParams.get('access_token');
    const hashType = hashParams.get('type');

    if (code) {
      // OAuth callback - try to detect provider from URL or state
      const provider = searchParams.get('provider') as 'google' | 'facebook' | 'github' | 'apple' | undefined;
      setVerifyingAuth({ isVerifying: true, method: 'oauth', provider });
      handleOAuthCallback(code);
    } else if (accessToken) {
      // Supabase magic link with access_token in hash fragment
      console.log('🔗 Detected Supabase magic link with access_token in hash');
      setVerifyingAuth({ isVerifying: true, method: 'magic-link' });
      handleSupabaseMagicLinkCallback(accessToken);
    } else if (token || tokenHash) {
      // Magic link callback - Other formats with token_hash or token in query
      setVerifyingAuth({ isVerifying: true, method: 'magic-link' });
      const magicToken = tokenHash || token;
      handleMagicLinkCallback(magicToken!, type as 'email' | 'recovery');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      // Check if there's a redirect destination stored
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  /**
   * Handle Supabase magic link callback with access_token in hash fragment
   */
  const handleSupabaseMagicLinkCallback = async (accessToken: string) => {
    try {
      setLoading(true);
      setVerifyingAuth({ isVerifying: true, method: 'magic-link' });
      setError('');
      console.log('🔗 Processing Supabase magic link with access_token');
      
      // Decode JWT to get user info
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      console.log('📋 Decoded token payload:', { email: payload.email, sub: payload.sub });
      
      // Verify token with backend and get our custom JWT
      const response = await api.auth.verifyMagicLink(accessToken, 'email');
      const { user: userData, token: jwtToken } = response.data;
      
      console.log('✅ Magic link verified successfully, user:', userData.email);
      
      localStorage.setItem('token', jwtToken);
      setAuth(jwtToken, userData);
      
      // Clear hash fragment
      window.history.replaceState({}, '', '/login');
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Supabase magic link callback error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Magic link verification failed';
      setError(errorMessage);
      
      // Clear hash fragment on error
      window.history.replaceState({}, '', '/login');
    } finally {
      setLoading(false);
      setVerifyingAuth({ isVerifying: false, method: null });
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setVerifyingAuth({ isVerifying: true, method: 'oauth' });
      const response = await api.auth.handleOAuthCallback(code);
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      setAuth(token, userData);
      
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OAuth login failed');
    } finally {
      setLoading(false);
      setVerifyingAuth({ isVerifying: false, method: null });
    }
  };

  const handleMagicLinkCallback = async (token: string, type: 'email' | 'recovery') => {
    try {
      setLoading(true);
      setVerifyingAuth({ isVerifying: true, method: 'magic-link' });
      setError('');
      console.log('🔗 Verifying magic link token:', { 
        tokenLength: token.length, 
        tokenPreview: token.substring(0, 20) + '...', 
        type 
      });
      
      const response = await api.auth.verifyMagicLink(token, type);
      const { user: userData, token: jwtToken } = response.data;
      
      console.log('✅ Magic link verified successfully, user:', userData.email);
      
      localStorage.setItem('token', jwtToken);
      setAuth(jwtToken, userData);
      
      // Clear URL parameters to prevent re-processing
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('token_hash');
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.pathname);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Magic link verification error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Magic link verification failed';
      setError(errorMessage);
      
      // Clear URL parameters on error
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('token_hash');
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.pathname);
    } finally {
      setLoading(false);
      setVerifyingAuth({ isVerifying: false, method: null });
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github' | 'apple') => {
    try {
      setLoading(true);
      setError('');
      setVerifyingAuth({ isVerifying: true, method: 'oauth', provider });
      const redirectTo = `${window.location.origin}/login`;
      const response = await api.auth.getSocialLoginUrl(provider, redirectTo);
      // Note: We don't clear verifyingAuth here because we're redirecting
      // It will be set again when the callback is handled
      window.location.href = response.data.url;
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to initiate ${provider} login`);
      setLoading(false);
      setVerifyingAuth({ isVerifying: false, method: null });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/login`;
      await api.auth.sendMagicLink(formData.email, redirectTo);
      setSuccess('Magic link sent! Check your email and click the link to login.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.auth.sendOTP(formData.phone);
      setOtpSent(true);
      setSuccess('OTP sent! Check your phone for the code.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setVerifyingAuth({ isVerifying: true, method: 'otp' });

    try {
      const response = await api.auth.verifyOTP(formData.phone, formData.otp);
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      setAuth(token, userData);
      
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
      setVerifyingAuth({ isVerifying: false, method: null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Check if there's a redirect destination stored
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Get loading message based on auth method
  const getLoadingMessage = () => {
    if (!verifyingAuth.isVerifying) {
      return { title: 'Loading...', subtitle: 'Please wait' };
    }

    switch (verifyingAuth.method) {
      case 'magic-link':
        return {
          title: 'Verifying your login...',
          subtitle: 'Please wait while we log you in automatically',
        };
      case 'oauth':
        const providerName = verifyingAuth.provider 
          ? verifyingAuth.provider.charAt(0).toUpperCase() + verifyingAuth.provider.slice(1)
          : 'Social';
        return {
          title: `Completing ${providerName} login...`,
          subtitle: 'Please wait while we finish setting up your account',
        };
      case 'otp':
        return {
          title: 'Verifying OTP code...',
          subtitle: 'Please wait while we verify your code',
        };
      case 'password-reset':
        return {
          title: 'Resetting your password...',
          subtitle: 'Please wait while we update your password',
        };
      default:
        return {
          title: 'Authenticating...',
          subtitle: 'Please wait',
        };
    }
  };

  // Show loading screen when verifying auth
  if (authLoading || verifyingAuth.isVerifying) {
    const { title, subtitle } = getLoadingMessage();
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 text-lg mb-4">
            {subtitle}
          </p>
          {verifyingAuth.isVerifying && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Log in</h2>
          <p className="text-gray-600 text-center mb-8">Welcome back! Please log in to your account.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>
              <button
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Login Method Tabs */}
          <div className="flex mb-4 border-b border-gray-200">
            <button
              onClick={() => { setLoginMethod('password'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                loginMethod === 'password'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setLoginMethod('magic-link'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                loginMethod === 'magic-link'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Magic Link
            </button>
            <button
              onClick={() => { setLoginMethod('otp'); setError(''); setSuccess(''); setOtpSent(false); }}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                loginMethod === 'otp'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              OTP
            </button>
          </div>

          {/* Password Login */}
          {loginMethod === 'password' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          )}

          {/* Magic Link Login */}
          {loginMethod === 'magic-link' && (
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <p className="text-sm text-gray-500">
                We'll send you a magic link to login without a password.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          {/* OTP Login */}
          {loginMethod === 'otp' && (
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-6">
              {!otpSent ? (
                <>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    We'll send you a one-time password via SMS.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      required
                      maxLength={6}
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setFormData({ ...formData, otp: '' }); }}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Change phone number
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </>
              )}
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/#membership-plans" className="text-purple-600 hover:text-purple-700 font-semibold">
                Join Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

