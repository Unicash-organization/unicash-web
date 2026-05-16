'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LoadingRing from '@/components/LoadingRing';
import { AnniversaryModal } from '@/components/loyalty/AnniversaryModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/* -----------------------------------------------------------------------
   Inline icons — desktop sidebar only.
   Mobile navigation now lives in the global Header (drawer) +
   global MobileBottomNav (rendered by SiteChrome).
----------------------------------------------------------------------- */
const Icon = {
  Home: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  List: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Receipt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M14 8H8M16 12H8M13 16H8" />
    </svg>
  ),
  Card: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  ),
  Logout: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Camera: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
};

const ACCOUNT_NAV: { label: string; href: string; icon: React.FC<{ className?: string }>; matchPaths?: string[] }[] = [
  { label: 'Dashboard',          href: '/dashboard',                  icon: Icon.Home },
  { label: 'Membership',         href: '/dashboard/membership',       icon: Icon.Crown },
  { label: 'My Entries',         href: '/dashboard/entries',          icon: Icon.List },
  { label: 'My Receipts',        href: '/dashboard/receipts',         icon: Icon.Camera },
  { label: 'Purchase History',   href: '/dashboard/purchases',        icon: Icon.Receipt },
  {
    label: 'Security & Billing',
    href: '/dashboard/security-billing',
    icon: Icon.Card,
    matchPaths: ['/dashboard/security-billing', '/dashboard/billing', '/dashboard/profile', '/dashboard/password'],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  // Auth redirect — preserved logic
  useEffect(() => {
    if (!loading && !user) {
      const currentPath = pathname || '/dashboard';
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      router.replace('/login');
    }
  }, [user, loading, router, pathname]);

  // First-time password change redirect — preserved logic
  useEffect(() => {
    if (user && pathname !== '/dashboard/security-billing') {
      if (user.hasChangedPassword === false) {
        router.replace('/dashboard/security-billing');
      }
    }
  }, [user, pathname, router]);

  if (loading) return <LoadingRing fullscreen label="Loading dashboard" />;
  if (!user) return <LoadingRing fullscreen label="Redirecting" />;

  const isAccountNavActive = (item: typeof ACCOUNT_NAV[number]) => {
    if (!pathname) return false;
    if (item.matchPaths && item.matchPaths.some((p) => pathname.startsWith(p))) return true;
    if (item.href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(item.href);
  };

  const displayName = (() => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Member';
  })();

  const initials = displayName
    .split(' ')
    .map((s) => s.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'M';

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-white">
      {/* Painted mesh background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-32 left-[10%] h-[420px] w-[420px] rounded-full bg-[#8B7BFF]/10 blur-[140px]" />
        <div className="absolute right-[-12%] top-1/3 h-[360px] w-[360px] rounded-full bg-[#FFE2B0]/10 blur-[120px]" />
        <div className="absolute left-[-12%] bottom-[-10%] h-[360px] w-[360px] rounded-full bg-[#6356E5]/8 blur-[120px]" />
      </div>

      {/* MAIN GRID — desktop sidebar + content. Mobile uses global Header drawer + bottom nav. */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl gap-6 px-0 pb-6 pt-0 sm:gap-6 sm:px-5 sm:pb-12 sm:pt-6 lg:gap-8 lg:px-8 lg:pt-8">
        {/* Desktop sidebar — pushed down so its TOP visually aligns with the
            first card's TOP on the right (each page has an H1 then space-y gap
            then first card). sm:mt-16 ≈ 64px ≈ H1 line-height (~34px) + gap (~24px) + small visual buffer. */}
        <aside className="sticky top-24 hidden w-64 shrink-0 flex-col self-start rounded-3xl border border-[#E7E9F2] bg-white/95 p-5 shadow-[0_2px_8px_rgba(15,18,34,0.04)] sm:mt-16 sm:flex">
          {/* Member identity — Points snapshot removed; redundant with header pill +
              Points balance card in main content. Identity card alone is the greeting. */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] p-3 ring-1 ring-[#E0DAFF]">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-[12.5px] font-extrabold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-extrabold tracking-tight text-[#0F1222]">{displayName}</p>
              <p className="truncate text-[11px] text-[#667085]">{user.email}</p>
            </div>
          </div>

          {/* Account nav */}
          <nav className="space-y-1" aria-label="Account navigation">
            {ACCOUNT_NAV.map((item) => {
              const active = isAccountNavActive(item);
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                    active
                      ? 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_8px_18px_-10px_rgba(99,86,229,0.55)]'
                      : 'text-[#4B5563] hover:bg-[#F4F1FB] hover:text-[#0F1222]'
                  }`}
                >
                  <ItemIcon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-[#6356E5]'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout — separated with thin top border, destructive red hover (matches drawer) */}
          <div className="mt-3 border-t border-[#EFEDF5] pt-3">
            <button
              type="button"
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-[#4B5563] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
            >
              <Icon.Logout className="h-[18px] w-[18px] shrink-0 text-[#667085] transition-colors group-hover:text-[#B91C1C]" />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-6 pt-4 sm:px-0 sm:pb-0 sm:pt-0">
          {children}
        </main>
      </div>

      {/* Sprint 3 wave 1 — celebration modal. Self-fetches pending notifications. */}
      <AnniversaryModal />
    </div>
  );
}
