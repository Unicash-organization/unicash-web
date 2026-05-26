'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MobileDrawer from '@/components/MobileDrawer';

const SCROLL_THRESHOLD = 24;

/* Desktop nav uses v4 terminology. Routes preserved as-is. */
const NAV_LINKS = [
  { label: 'Bonus Draws', href: '/giveaways' },
  { label: 'Membership', href: '/#membership-plans' },
  { label: 'Point Boosters', href: '/boost-packs' },
  { label: 'Redeem Gift Cards', href: '/rewards/gift-cards' },
  { label: 'Fuel Rewards', href: '/scan-receipts' },
  { label: 'Winners', href: '/winners' },
  { label: 'FAQ', href: '/faq' },
];

/* -----------------------------------------------------------------------
   Inline icons
----------------------------------------------------------------------- */
const Hamburger = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const SparkleIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);
const ChevronDown = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ChevronRight = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const LogoutIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const HomeIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
  </svg>
);
const CrownIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
    <path d="M5 21h14" />
  </svg>
);
const ListIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const ReceiptIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    <path d="M14 8H8M16 12H8M13 16H8" />
  </svg>
);
const CardIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
  </svg>
);

const ACCOUNT_MENU: { label: string; href: string; icon: React.FC<{ className?: string }>; matchPaths?: string[] }[] = [
  { label: 'Dashboard',          href: '/dashboard',                  icon: HomeIcon },
  { label: 'Membership',         href: '/dashboard/membership',       icon: CrownIcon },
  { label: 'My Entries',         href: '/dashboard/entries',          icon: ListIcon },
  { label: 'Purchase History',   href: '/dashboard/purchases',        icon: ReceiptIcon },
  {
    label: 'Security & Billing',
    href: '/dashboard/security-billing',
    icon: CardIcon,
    matchPaths: ['/dashboard/security-billing', '/dashboard/billing', '/dashboard/profile', '/dashboard/password'],
  },
];

export default function Header() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);

  const availablePoints =
    (Number(user?.membershipCredits) || 0) + (Number(user?.boostCredits) || 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close desktop menu on outside click + ESC + route change
  useEffect(() => {
    if (!desktopMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDesktopMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [desktopMenuOpen]);

  useEffect(() => {
    setDesktopMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setDesktopMenuOpen(false);
    setDrawerOpen(false);
    logout();
  };

  const displayName = (() => {
    if (!user) return '';
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
    <>
      {/*
       * QW-8 — skip-to-content link. First focusable in the document; hidden
       * by default, visible only when keyboard focus lands on it. Jumps the
       * user past the header + mobile drawer chrome straight to the page's
       * <main id="main"> (set in app/layout.tsx).
       */}
      <a
        href="#main"
        className="sr-only fixed left-3 top-3 z-[100] -translate-y-16 rounded-full bg-[#6356E5] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-transform focus:not-sr-only focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6356E5]"
      >
        Skip to content
      </a>

      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ease-out ${
          scrolled
            ? 'border-[#e7e9f2]/80 bg-white/85 shadow-[0_2px_18px_-12px_rgba(15,18,34,0.18)] backdrop-blur-xl'
            : 'border-transparent bg-white/95 backdrop-blur-md'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Primary">
          {/* ============================================================
              MOBILE BAR — hamburger LEFT + wordmark center + Points + avatar RIGHT
          ============================================================ */}
          <div className="relative flex h-14 items-center justify-between md:hidden">
            {/* Hamburger LEFT */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7e9f2] bg-white text-[#0f1222] transition-colors hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
            >
              <Hamburger className="h-[18px] w-[18px]" />
            </button>

            {/* Logo center — SVG, compact size for mobile */}
            <Link
              href="/"
              aria-label="UNICASH home"
              className="absolute left-1/2 -translate-x-1/2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
            >
              <Image
                src="/images/green-logo.svg"
                alt="UniCash"
                width={150}
                height={40}
                className="h-7 w-auto max-sm:h-6"
                priority
              />
            </Link>

            {/* Right side — auth-aware. Compacts only on iPhone-SE-class viewports (≤380px) to avoid logo overlap. */}
            <div className="flex items-center gap-2 max-sm:gap-1.5">
              {!authLoading && user ? (
                <>
                  {/* Points chip */}
                  <Link
                    href="/dashboard"
                    aria-label={`${availablePoints.toLocaleString()} Points available`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F4F1FB] to-[#FBFAFF] px-2.5 py-1 ring-1 ring-[#E0DAFF] transition-colors hover:from-[#EDE8F8] hover:to-[#F4F1FB] max-sm:gap-1 max-sm:px-2 max-sm:py-0.5"
                  >
                    <SparkleIcon className="h-3.5 w-3.5 text-[#6356E5] max-sm:h-3 max-sm:w-3" />
                    <span className="text-[12px] font-bold tabular-nums text-[#0F1222] max-sm:text-[11.5px]">
                      {availablePoints.toLocaleString()}
                    </span>
                  </Link>
                  {/* Avatar — opens drawer */}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Account menu"
                    aria-haspopup="dialog"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-[12px] font-extrabold tracking-wide text-white shadow-[0_4px_10px_-4px_rgba(99,86,229,0.4)] ring-2 ring-white max-sm:h-8 max-sm:w-8 max-sm:text-[11.5px]"
                  >
                    {initials}
                  </button>
                </>
              ) : !authLoading ? (
                <Link
                  href="/login"
                  className="inline-flex h-9 shrink-0 items-center rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 text-[12.5px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          </div>

          {/* ============================================================
              DESKTOP BAR — logo + nav links + Points/avatar dropdown
          ============================================================ */}
          <div className="hidden h-16 items-center justify-between md:flex">
            <div className="flex items-center gap-5 lg:gap-10">
              <Link
                href="/"
                aria-label="UNICASH home"
                className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
              >
                <Image
                  src="/images/green-logo.svg"
                  alt="UniCash"
                  width={150}
                  height={40}
                  className="h-8 w-auto lg:h-9"
                  priority
                />
              </Link>
              <ul className="flex items-center gap-4 lg:gap-7">
                {NAV_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="rounded-md whitespace-nowrap text-[13px] font-medium text-[#4b5563] transition-colors hover:text-[#0f1222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 lg:text-[14px]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2">
              {!authLoading && user ? (
                <div className="relative" ref={desktopMenuRef}>
                  <button
                    type="button"
                    onClick={() => setDesktopMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={desktopMenuOpen}
                    className="uc-lift-sm inline-flex items-center gap-3 rounded-full bg-[#6356E5] px-3 py-1.5 font-semibold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-colors hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white">
                      <span className="text-xs font-bold text-[#6356E5]">{initials}</span>
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {availablePoints.toLocaleString()} Points
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${desktopMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {desktopMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Account menu"
                      className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-[#E7E9F2] bg-white shadow-[0_24px_60px_-20px_rgba(15,18,34,0.30)]"
                    >
                      {/* Member identity — clean: avatar + name + email, no greeting */}
                      <div className="flex items-center gap-3 bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] px-4 py-3.5">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-[13px] font-extrabold text-white shadow-[0_4px_10px_-4px_rgba(99,86,229,0.4)]">
                          {initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">{displayName}</p>
                          <p className="truncate text-[11.5px] text-[#667085]">{user.email}</p>
                        </div>
                      </div>

                      {/* Account nav — matches sidebar visual language:
                          rounded-xl chip items, solid gradient bg + white text on active. */}
                      <ul className="space-y-1 p-1.5">
                        {ACCOUNT_MENU.map((item) => {
                          const ItemIcon = item.icon;
                          const active = item.matchPaths
                            ? item.matchPaths.some((p) => pathname?.startsWith(p))
                            : item.href === '/dashboard'
                              ? pathname === '/dashboard'
                              : pathname?.startsWith(item.href);
                          return (
                            <li key={item.href} role="none">
                              <Link
                                href={item.href}
                                role="menuitem"
                                aria-current={active ? 'page' : undefined}
                                onClick={() => setDesktopMenuOpen(false)}
                                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                                  active
                                    ? 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_8px_18px_-10px_rgba(99,86,229,0.55)]'
                                    : 'text-[#4B5563] hover:bg-[#F4F1FB] hover:text-[#0F1222]'
                                }`}
                              >
                                <ItemIcon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-[#6356E5]'}`} />
                                <span className="truncate">{item.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Log Out */}
                      <div className="border-t border-[#EFEDF5] p-1.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-[#4B5563] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                        >
                          <LogoutIcon className="h-[18px] w-[18px] shrink-0 text-[#667085] transition-colors group-hover:text-[#B91C1C]" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !authLoading ? (
                <>
                  <Link
                    href="/login"
                    className="uc-lift-sm inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-5 text-sm font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/#membership-plans"
                    className="uc-lift-sm inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6356E5] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-colors hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    Join Now
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer — single source of mobile nav */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
        availablePoints={availablePoints}
      />
    </>
  );
}
