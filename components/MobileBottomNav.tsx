'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredModal from './LoginRequiredModal';
import MembershipRequiredModal from './MembershipRequiredModal';
import ScanReceiptModal from './ScanReceiptModal';

/* -----------------------------------------------------------------------
   Global mobile bottom navigation — task-focused 5-slot bar.
   Visible only when user is logged in AND not on focused-flow routes.

   Active state pattern (iOS-style):
   - Inactive icons → outlined, gray
   - Active icons   → FILLED, brand purple, scale-105, gradient pill bg
   - Tap state     → active:scale-95 for haptic feel
----------------------------------------------------------------------- */

const HIDE_BOTTOM_NAV_PREFIXES = [
  '/checkout',
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/thank-you',
];

/* -----------------------------------------------------------------------
   Icons — single outlined SVG per item, kept identical between active and
   inactive states for shape consistency. Active state is signalled by
   color + pill bg + scale + slightly thicker stroke (handled in render).
----------------------------------------------------------------------- */
type IconProps = { active: boolean; className?: string };

/** Returns the stroke-width to use; active state uses a slightly thicker line
    so the same path reads heavier without changing its silhouette. */
const stroke = (active: boolean) => (active ? 2.25 : 1.85);

const HomeIcon = ({ active, className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke(active)} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
  </svg>
);

const TrophyIcon = ({ active, className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke(active)} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const CameraIcon = ({ active, className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke(active)} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const TicketIcon = ({ active, className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke(active)} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M2 9V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z" />
    <path d="M15 7v1.5M15 11v2M15 15.5V17" />
  </svg>
);

const BoltIcon = ({ active, className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke(active)} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="m13 2-3 8h6l-3 12-2-8H4l9-12Z" />
  </svg>
);

/* -----------------------------------------------------------------------
   Nav items — single source of truth
----------------------------------------------------------------------- */
type NavItem = {
  label: string;
  href: string;
  Icon: React.FC<IconProps>;
  matcher: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',    href: '/dashboard',         Icon: HomeIcon,   matcher: (p) => p === '/dashboard' },
  { label: 'Win',     href: '/giveaways',         Icon: TrophyIcon, matcher: (p) => p === '/giveaways' || p.startsWith('/giveaways/') },
  { label: 'Scan',    href: '/scan-receipts',     Icon: CameraIcon, matcher: (p) => p.startsWith('/scan-receipts') },
  { label: 'Entries', href: '/dashboard/entries', Icon: TicketIcon, matcher: (p) => p.startsWith('/dashboard/entries') },
  { label: 'Booster', href: '/boost-packs',       Icon: BoltIcon,   matcher: (p) => p.startsWith('/boost-packs') },
];

function shouldHide(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDE_BOTTOM_NAV_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Phase 2 — Scan Receipts entry-point gating modals
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [showMembershipRequired, setShowMembershipRequired] = useState(false);
  // Phase 6 — Scan flow modal (active members)
  const [showScanModal, setShowScanModal] = useState(false);

  /* Render bottom nav only for logged-in users on non-focused-flow routes.
     Modals don't need to be reachable when nav is hidden. */
  if (loading || !user) return null;
  if (shouldHide(pathname)) return null;

  /* Scan icon click handler — gate by auth state, then membership state.
     Phase 6: active members open the scan modal directly (no navigation). */
  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      setShowLoginRequired(true);
      return;
    }

    if (user.state !== 'memberActive') {
      setShowMembershipRequired(true);
      return;
    }

    setShowScanModal(true);
  };

  return (
    <>
      <nav
        aria-label="Quick actions"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EFEDF5] bg-white/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <ul className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = item.matcher(pathname || '');
            const Icon = item.Icon;
            const isScan = item.label === 'Scan';
            const linkClass = `flex h-16 flex-col items-center justify-center gap-0.5 px-1 transition-colors active:scale-95 ${
              active ? 'text-[#6356E5]' : 'text-[#667085] hover:text-[#0F1222]'
            }`;
            const inner = (
              <>
                <span
                  className={`relative inline-flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-br from-[#F4F1FB] to-[#EDE8F8] scale-105'
                      : 'bg-transparent scale-100'
                  }`}
                >
                  <Icon active={active} className="h-[19px] w-[19px]" />
                </span>
                <span className={`text-[10px] tracking-tight transition-colors ${active ? 'font-extrabold text-[#6356E5]' : 'font-bold text-[#667085]'}`}>
                  {item.label}
                </span>
              </>
            );
            return (
              <li key={item.href}>
                {isScan ? (
                  /* Scan slot — intercept click for entry-point gating.
                     Render as <a> (not Link) since we always preventDefault
                     and route through handleScanClick. */
                  <a
                    href={item.href}
                    onClick={handleScanClick}
                    aria-current={active ? 'page' : undefined}
                    className={linkClass}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={linkClass}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Phase 2 entry-point modals — both portal to document.body */}
      <LoginRequiredModal
        isOpen={showLoginRequired}
        onClose={() => setShowLoginRequired(false)}
        redirectAfterLogin="/scan-receipts"
      />
      <MembershipRequiredModal
        isOpen={showMembershipRequired}
        onClose={() => setShowMembershipRequired(false)}
        context="scan-receipts"
        userState={user?.state}
      />

      {/* Phase 6 scan flow — active members only (gated above). */}
      <ScanReceiptModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
      />
    </>
  );
}

/** Helper hook for callers that need to add bottom-padding when bottom nav is visible. */
export function useBottomNavVisible(): boolean {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (loading || !user) return false;
  return !shouldHide(pathname);
}
