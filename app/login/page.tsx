'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

/* ==========================================================================
   UNICASH /login — v4 redesigned UI
   --------------------------------------------------------------------------
   - Visual + layout matches UNICASH Design System v4 (painted purple stage,
     white glass card, gold-gradient accent, v4 inputs, pill CTAs).
   - All auth logic, handlers, useAuth, useEffect callbacks, formData fields,
     API calls, and routing are preserved 1:1 from the original implementation.
   - OTP tab removed per user request. OTP handlers retained as dead code so
     they can be restored later without touching auth/API plumbing.
   ========================================================================== */

type LoginMethod = 'password' | 'magic-link';

/* -------------------------------------------------------------------------- */
/*  Inline icons (no extra deps)                                              */
/* -------------------------------------------------------------------------- */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Eye: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  ArrowLeft: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 19-7-7 7-7M19 12H5" />
    </svg>
  ),
  AlertCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
  CheckCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
};

/* UNICASH brand mark — extracted from /images/green-logo.svg */
const UnicashMark = ({ className = 'h-9 w-9' }: { className?: string }) => (
  <svg viewBox="0 0 515 515" xmlns="http://www.w3.org/2000/svg" aria-label="UNICASH" role="img" className={className}>
    <path fill="#6356E5" d="M257.507 0C115.286 0 0 115.291 0 257.507C0 399.718 115.286 515.014 257.507 515.014H515.014V257.507C515.014 115.291 399.718 0 257.507 0ZM406.511 406.511C324.217 488.81 190.797 488.81 108.503 406.516C26.2091 324.222 26.2091 190.797 108.503 108.503C190.797 26.2091 324.217 26.2091 406.511 108.503C488.81 190.792 488.805 324.217 406.511 406.511Z" />
    <path fill="#6356E5" d="M277.464 224.485C247.444 213.185 235.084 205.769 235.084 194.114C235.084 184.226 242.5 174.338 265.454 174.338C290.885 174.338 307.129 182.459 316.312 186.348L326.55 146.439C314.901 140.79 299.007 135.84 275.342 134.784V103.703H240.733V137.251C202.942 144.668 181.048 169.038 181.048 200.119C181.048 234.378 206.83 252.038 244.622 264.754C270.759 273.586 282.058 282.053 282.058 295.479C282.058 309.606 268.281 317.378 248.155 317.378C225.201 317.378 204.363 309.961 189.531 301.835L178.932 343.154C192.353 350.926 215.307 357.281 238.972 358.337V391.895H273.586V355.87C314.2 348.804 336.449 321.966 336.449 290.53C336.444 258.743 319.489 239.322 277.464 224.485Z" />
  </svg>
);

/* Painted purple stage — same recipe as Hero on the homepage */
function PaintedBackground() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(700px 480px at 96% 4%, rgba(15,18,34,.32), transparent 55%)',
            'radial-gradient(900px 600px at 24% 36%, rgba(170,150,255,.42), transparent 60%)',
            'radial-gradient(540px 420px at 70% 28%, rgba(255,226,176,.10), transparent 70%)',
            'radial-gradient(900px 600px at 95% 96%, rgba(58,46,168,.42), transparent 62%)',
            'linear-gradient(170deg, #4538B8 0%, #5C4FD8 36%, #6E60E8 70%, #7867EC 100%)',
          ].join(', '),
        }}
      />
      <div aria-hidden className="uc-dot-stage absolute inset-0 opacity-30" />
      <div aria-hidden className="uc-blob-a absolute -left-24 top-6 h-[480px] w-[480px] rounded-full bg-[#A192FF]/40 blur-[140px]" />
      <div aria-hidden className="uc-blob-b absolute right-[-12%] bottom-[-14%] hidden h-[560px] w-[560px] rounded-full bg-[#3D30B8]/50 blur-[150px] sm:block" />
      <div aria-hidden className="uc-blob-c absolute left-[-2%] top-[26%] hidden h-[340px] w-[340px] rounded-full bg-[#FFE2B0]/16 blur-[120px] sm:block" />
    </>
  );
}

/* Eyebrow chip — same component pattern as homepage v4 */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6356e5]">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356e5]" />
      {children}
    </span>
  );
}

/* Premium loading screen — shown during OAuth/magic-link verification */
function VerifyingScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-white">
      <PaintedBackground />
      <div className="relative max-w-md text-center">
        <svg className="mx-auto h-14 w-14 animate-spin motion-reduce:animate-none" viewBox="0 0 50 50" aria-hidden>
          <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
          <circle cx="25" cy="25" r="20" fill="none" stroke="#FFE2B0" strokeWidth="4" strokeLinecap="round" strokeDasharray="78 48" />
        </svg>
        <h2 className="mt-6 text-[24px] font-extrabold tracking-tight text-white sm:text-[28px]">{title}</h2>
        <p className="mt-2 text-[14px] text-white/80 sm:text-[15px]">{subtitle}</p>
        <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[60%] animate-pulse rounded-full bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] motion-reduce:animate-none" />
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  LoginPageContent — UI redesign only. ALL auth logic preserved verbatim.   */
/* -------------------------------------------------------------------------- */

function LoginPageContent() {
  /* --- Auth + page state — preserved from original implementation ------- */
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingAuth, setVerifyingAuth] = useState<{
    isVerifying: boolean;
    method: 'magic-link' | 'oauth' | 'otp' | 'password-reset' | null;
    provider?: 'google' | 'facebook' | 'github' | 'apple';
  }>({
    isVerifying: false,
    method: null,
  });

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (!emailParam?.trim()) return;
    try {
      const decoded = decodeURIComponent(emailParam.trim());
      if (decoded) {
        setFormData((prev) => (prev.email === decoded ? prev : { ...prev, email: decoded }));
      }
    } catch {
      setFormData((prev) =>
        prev.email === emailParam ? prev : { ...prev, email: emailParam.trim() },
      );
    }
  }, [searchParams]);

  // Handle OAuth callback and magic link callback
  useEffect(() => {
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') || 'email';

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');

    if (code) {
      const provider = searchParams.get('provider') as 'google' | 'facebook' | 'github' | 'apple' | undefined;
      setVerifyingAuth({ isVerifying: true, method: 'oauth', provider });
      handleOAuthCallback(code);
    } else if (accessToken) {
      console.log('🔗 Detected Supabase magic link with access_token in hash');
      setVerifyingAuth({ isVerifying: true, method: 'magic-link' });
      handleSupabaseMagicLinkCallback(accessToken);
    } else if (token || tokenHash) {
      setVerifyingAuth({ isVerifying: true, method: 'magic-link' });
      const magicToken = tokenHash || token;
      handleMagicLinkCallback(magicToken!, type as 'email' | 'recovery');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleSupabaseMagicLinkCallback = async (accessToken: string) => {
    try {
      setLoading(true);
      setVerifyingAuth({ isVerifying: true, method: 'magic-link' });
      setError('');
      console.log('🔗 Processing Supabase magic link with access_token');

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

      const response = await api.auth.verifyMagicLink(accessToken, 'email');
      const { user: userData, token: jwtToken } = response.data;
      console.log('✅ Magic link verified successfully, user:', userData.email);

      localStorage.setItem('token', jwtToken);
      setAuth(jwtToken, userData);

      window.history.replaceState({}, '', '/login');
      await new Promise((resolve) => setTimeout(resolve, 200));

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
        type,
      });

      const response = await api.auth.verifyMagicLink(token, type);
      const { user: userData, token: jwtToken } = response.data;
      console.log('✅ Magic link verified successfully, user:', userData.email);

      localStorage.setItem('token', jwtToken);
      setAuth(jwtToken, userData);

      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('token_hash');
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.pathname);

      await new Promise((resolve) => setTimeout(resolve, 200));

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
      window.location.href = response.data.url;
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to initiate ${provider} login`);
      setLoading(false);
      setVerifyingAuth({ isVerifying: false, method: null });
    }
  };

  /* Lightweight client-side validators — surface errors via the styled error card
     instead of the browser's native validation tooltip. The actual auth validation
     still happens server-side; these just guard the round-trip with friendlier UX. */
  const validateEmail = (value: string): string | null => {
    const v = value.trim();
    if (!v) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address.';
    return null;
  };
  const validatePassword = (value: string): string | null => {
    if (!value) return 'Please enter your password.';
    return null;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/login`;
      await api.auth.sendMagicLink(formData.email.trim(), redirectTo);
      setSuccess("Login link sent. Please check your email and click the link to log in.");
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send login link');
    } finally {
      setLoading(false);
    }
  };

  /* OTP handlers — retained for backend safety even though OTP UI is removed.
     If OTP is re-enabled later, the auth plumbing is already in place. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  /* -----------------------------------------------------------------------
     Map backend auth error messages to user-friendly copy.
     Keeps backend message generic ("Invalid credentials") for security
     (don't leak which field is wrong) but surfaces friendlier UI text.
  ----------------------------------------------------------------------- */
  const mapAuthError = (rawMessage: string): string => {
    const msg = (rawMessage || '').toLowerCase();
    if (msg.includes('invalid credentials') || msg.includes('user not found') || msg.includes('wrong password')) {
      return "The email or password you entered is incorrect. Please check your details and try again.";
    }
    if (msg.includes('locked') || msg.includes('lock')) {
      return "Your account has been locked. Please contact UNICASH Support to resolve.";
    }
    if (msg.includes('too many') || msg.includes('rate limit') || msg.includes('throttle')) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    if (msg.includes('network') || msg.includes('timeout') || msg.includes('fetch')) {
      return "Couldn't reach UNICASH. Check your connection and try again.";
    }
    return rawMessage || 'Login failed. Please check your details and try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await login(formData.email.trim(), formData.password);
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(mapAuthError(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const getLoadingMessage = () => {
    if (!verifyingAuth.isVerifying) {
      return { title: 'Loading…', subtitle: 'Please wait' };
    }
    switch (verifyingAuth.method) {
      case 'magic-link':
        return { title: 'Verifying your login…', subtitle: "We're logging you in automatically" };
      case 'oauth': {
        const providerName = verifyingAuth.provider
          ? verifyingAuth.provider.charAt(0).toUpperCase() + verifyingAuth.provider.slice(1)
          : 'Social';
        return { title: `Completing ${providerName} login…`, subtitle: 'Setting up your account' };
      }
      case 'otp':
        return { title: 'Verifying OTP code…', subtitle: 'Checking your code' };
      case 'password-reset':
        return { title: 'Resetting your password…', subtitle: 'Updating your details' };
      default:
        return { title: 'Authenticating…', subtitle: 'Please wait' };
    }
  };

  /* ---- Premium loading screen ---- */
  if (authLoading || verifyingAuth.isVerifying) {
    const { title, subtitle } = getLoadingMessage();
    return <VerifyingScreen title={title} subtitle={subtitle} />;
  }

  /* ---- Login UI ---- */
  const inputCls =
    'h-12 w-full rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] px-4 text-[14px] text-[#0f1222] placeholder-[#a3a8be] shadow-[inset_0_1px_2px_rgba(15,18,34,0.04)] transition-all hover:border-[#c8c5ea] hover:bg-white focus:border-[#6356e5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6356e5]/30 disabled:opacity-60';

  const primaryBtnCls =
    'uc-lift-sm relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8] disabled:cursor-not-allowed disabled:opacity-60';

  const tabCls = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 ${
      active
        ? 'bg-white text-[#6356E5] shadow-[0_2px_8px_rgba(15,18,34,0.08)]'
        : 'text-[#667085] hover:text-[#0f1222]'
    }`;

  return (
    <main className="relative min-h-screen overflow-hidden text-[#0f1222]">
      <PaintedBackground />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_30px_80px_-30px_rgba(15,18,34,0.45)] backdrop-blur-xl sm:p-9">
            {/* Brand + heading */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EDFB] ring-1 ring-[#E0DAFF]">
                <UnicashMark className="h-6 w-6" />
              </div>
              <Eyebrow>Member access</Eyebrow>
              <h1 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px]">
                Welcome <span className="uc-gold-gradient">back.</span>
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#4b5563] sm:text-[14px]">
                <span className="sm:hidden">Log in to manage your Membership, Points, and rewards.</span>
                <span className="hidden sm:inline">Log in to manage your Membership, Points, Bonus Draws, Fuel Rewards, and Gift Card redemptions.</span>
              </p>
            </div>

            {/* Error — show actionable Reset password link inline when error
                is credential-related (helps user recover instead of dead-end). */}
            {error && (
              <div id="login-error" role="alert" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#FCA5A5]/50 bg-[#FEF2F2] p-3.5">
                <Icon.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#991B1B]">
                  <p>{error}</p>
                  {/* Inline recovery CTA — only for credential errors, not validation errors */}
                  {error.toLowerCase().includes('email or password you entered is incorrect') && (
                    <Link
                      href="/forgot-password"
                      className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#B91C1C] underline-offset-2 hover:underline"
                    >
                      Reset your password
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Success */}
            {success && (
              <div role="status" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#86EFAC]/50 bg-[#F0FDF4] p-3.5">
                <Icon.CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                <div className="text-[13px] leading-relaxed text-[#166534]">{success}</div>
              </div>
            )}

            {/* Social login */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="uc-lift-sm inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white text-[13.5px] font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Continue with Google"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="uc-lift-sm inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white text-[13.5px] font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Continue with Facebook"
              >
                <svg className="h-4 w-4" fill="#1877F2" viewBox="0 0 24 24" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div aria-hidden className="absolute inset-0 flex items-center">
                <div className="h-px w-full bg-[#e7e9f2]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#a3a8be]">Or continue with email</span>
              </div>
            </div>

            {/* Method tabs — Password / Magic Link (OTP removed) */}
            <div role="tablist" aria-label="Login method" className="flex gap-1 rounded-full bg-[#F4F1FB] p-1">
              <button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'password'}
                onClick={() => { setLoginMethod('password'); setError(''); setSuccess(''); }}
                className={tabCls(loginMethod === 'password')}
              >
                Password
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'magic-link'}
                onClick={() => { setLoginMethod('magic-link'); setError(''); setSuccess(''); }}
                className={tabCls(loginMethod === 'magic-link')}
              >
                Magic link
              </button>
            </div>

            {/* Password form — noValidate suppresses native browser tooltips; we surface
                validation errors in the styled error card above for a calm v4 look. */}
            {loginMethod === 'password' && (
              <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-[12.5px] font-semibold text-[#0f1222]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@email.com"
                    disabled={loading}
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? 'login-error' : undefined}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-[12.5px] font-semibold text-[#0f1222]">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="rounded-md text-[12px] font-semibold text-[#6356E5] transition-colors hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Your password"
                      disabled={loading}
                      aria-invalid={!!error || undefined}
                      aria-describedby={error ? 'login-error' : undefined}
                      className={`${inputCls} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#F4F1FB] hover:text-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-1"
                    >
                      {showPassword ? <Icon.EyeOff className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={primaryBtnCls}>
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden />
                      Logging in…
                    </>
                  ) : (
                    <>
                      Log in
                      <Icon.ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Magic link form — noValidate, custom validation surfaced in error card */}
            {loginMethod === 'magic-link' && (
              <form onSubmit={handleMagicLink} noValidate className="mt-5 space-y-4">
                <div>
                  <label htmlFor="magic-email" className="block text-[12.5px] font-semibold text-[#0f1222]">
                    Email
                  </label>
                  <input
                    id="magic-email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@email.com"
                    disabled={loading}
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? 'login-error' : undefined}
                    className={`mt-1.5 ${inputCls}`}
                  />
                  <p className="mt-2 text-[12px] leading-relaxed text-[#667085]">
                    Enter your email and we&rsquo;ll send you a secure login link — no password needed.
                  </p>
                </div>

                <button type="submit" disabled={loading} className={primaryBtnCls}>
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden />
                      Sending login link…
                    </>
                  ) : (
                    <>
                      Send login link
                      <Icon.ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer link — Join now */}
            <p className="mt-6 text-center text-[13px] text-[#667085]">
              New to UNICASH?{' '}
              <Link
                href="/#membership-plans"
                className="rounded-md font-semibold text-[#6356E5] transition-colors hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
              >
                Join now
              </Link>
            </p>
          </div>

          {/* Trust line — under card on the painted bg */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <Icon.ShieldCheck className="h-3.5 w-3.5 text-[#FFE2B0]" />
              Secure access
            </span>
            <span aria-hidden className="text-white/35">·</span>
            <span>Member rewards</span>
            <span aria-hidden className="text-white/35">·</span>
            <span>Published Winners</span>
          </div>

          {/* Back to homepage */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md text-[12.5px] text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8]"
            >
              <Icon.ArrowLeft className="h-3.5 w-3.5" />
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-white">
          <PaintedBackground />
          <div className="relative text-center">
            <svg className="mx-auto h-12 w-12 animate-spin motion-reduce:animate-none" viewBox="0 0 50 50" aria-hidden>
              <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="#FFE2B0" strokeWidth="4" strokeLinecap="round" strokeDasharray="78 48" />
            </svg>
            <p className="mt-4 text-[14px] text-white/80">Loading…</p>
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
