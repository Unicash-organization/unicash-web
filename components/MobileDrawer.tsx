'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/* -----------------------------------------------------------------------
   Inline icons
----------------------------------------------------------------------- */
const Icon = {
  Close: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
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
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Camera: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Bolt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m13 2-3 8h6l-3 12-2-8H4l9-12Z" />
    </svg>
  ),
  Receipt: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    </svg>
  ),
  Card: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
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
  Trophy2: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="9" r="6" />
      <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
    </svg>
  ),
  Help: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  ),
  Info: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Logout: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Sparkle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
  onLogout: () => void;
  availablePoints: number;
};

const ACCOUNT_NAV = [
  { label: 'Dashboard',          href: '/dashboard',                    icon: Icon.Home },
  { label: 'Membership',         href: '/dashboard/membership',         icon: Icon.Crown },
  { label: 'My Entries',         href: '/dashboard/entries',            icon: Icon.List },
  { label: 'My Receipts',        href: '/dashboard/receipts',           icon: Icon.Camera },
  { label: 'Purchase History',   href: '/dashboard/purchases',          icon: Icon.Receipt },
  { label: 'Security & Billing', href: '/dashboard/security-billing',   icon: Icon.Card },
];

/* Marketing/Explore — products + content. "Membership" is the marketing landing
   anchor (/#membership-plans), only shown to guests because logged-in members
   already have ACCOUNT > Membership pointing to /dashboard/membership.
   FAQ moved to SUPPORT (it's help, not exploration). */
const MARKETING_NAV_GUEST = [
  { label: 'Bonus Draws',    href: '/giveaways',         icon: Icon.Trophy },
  { label: 'Membership',     href: '/#membership-plans', icon: Icon.Crown },
  { label: 'Point Boosters', href: '/boost-packs',       icon: Icon.Bolt },
  { label: 'Fuel Rewards',   href: '/scan-receipts',     icon: Icon.Camera },
  { label: 'Winners',        href: '/winners',           icon: Icon.Trophy2 },
];

const MARKETING_NAV_MEMBER = [
  { label: 'Bonus Draws',    href: '/giveaways',     icon: Icon.Trophy },
  { label: 'Point Boosters', href: '/boost-packs',   icon: Icon.Bolt },
  { label: 'Fuel Rewards',   href: '/scan-receipts', icon: Icon.Camera },
  { label: 'Winners',        href: '/winners',       icon: Icon.Trophy2 },
];

const SUPPORT_NAV = [
  { label: 'FAQ',     href: '/faq',     icon: Icon.Help },
  { label: 'About',   href: '/about',   icon: Icon.Info },
  { label: 'Contact', href: '/contact', icon: Icon.Mail },
];

export default function MobileDrawer({ isOpen, onClose, user, onLogout, availablePoints }: DrawerProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ESC + body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const displayName = (() => {
    if (!user) return '';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Member';
  })();
  const initials = displayName
    .split(' ')
    .map((s: string) => s.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'M';

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href.startsWith('/#')) return false;
    return pathname.startsWith(href);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] sm:hidden ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-[#0F1222]/45 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className={`absolute left-0 top-0 flex h-full w-[85%] max-w-[340px] flex-col bg-white shadow-[0_0_60px_-10px_rgba(15,18,34,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ============================================================
            HEADER — brand + close
        ============================================================ */}
        <div className="flex items-center justify-between border-b border-[#EFEDF5] px-4 py-3.5">
          <Link href="/" onClick={onClose} className="inline-flex items-center" aria-label="UNICASH home">
            <Image
              src="/images/green-logo.svg"
              alt="UniCash"
              width={150}
              height={40}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#F4F1FB] hover:text-[#0F1222]"
          >
            <Icon.Close className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
          {user ? (
            <>
              {/* ============================================================
                  MEMBER IDENTITY + Points — clean: avatar + name + email, no greeting
              ============================================================ */}
              <div className="border-b border-[#EFEDF5] bg-gradient-to-br from-[#F4F1FB] to-[#FBFAFF] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-[14px] font-extrabold text-white shadow-[0_6px_14px_-4px_rgba(99,86,229,0.4)]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-extrabold tracking-tight text-[#0F1222]">{displayName}</p>
                    <p className="truncate text-[11.5px] text-[#667085]">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="mt-3 flex items-center justify-between rounded-2xl border border-[#E0DAFF] bg-white px-3.5 py-2.5"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon.Sparkle className="h-4 w-4 text-[#6356E5]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#667085]">Available</span>
                  </span>
                  <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-[16px] font-extrabold tabular-nums text-transparent">
                    {availablePoints.toLocaleString()} <span className="text-[11.5px] font-semibold not-italic text-[#667085]">Points</span>
                  </span>
                </Link>
              </div>

              {/* ============================================================
                  ACCOUNT NAV
              ============================================================ */}
              <DrawerSection label="Account">
                {ACCOUNT_NAV.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <DrawerLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={ItemIcon}
                      active={active}
                      onClose={onClose}
                    />
                  );
                })}
              </DrawerSection>

              {/* ============================================================
                  EXPLORE — member variant (no duplicate Membership link)
              ============================================================ */}
              <DrawerSection label="Explore">
                {MARKETING_NAV_MEMBER.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <DrawerLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={ItemIcon}
                      active={active}
                      onClose={onClose}
                    />
                  );
                })}
              </DrawerSection>

              {/* ============================================================
                  SUPPORT
              ============================================================ */}
              <DrawerSection label="Support">
                {SUPPORT_NAV.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <DrawerLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={ItemIcon}
                      active={isActive(item.href)}
                      onClose={onClose}
                    />
                  );
                })}
              </DrawerSection>

              {/* ============================================================
                  LOGOUT — sits below SUPPORT, single border-b from SUPPORT
                  separates them so we don't double up dividers.
              ============================================================ */}
              <div className="px-2 py-3">
                <button
                  type="button"
                  onClick={() => { onClose(); onLogout(); }}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#0F1222] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                >
                  <Icon.Logout className="h-[18px] w-[18px] shrink-0 text-[#667085] transition-colors group-hover:text-[#B91C1C]" />
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ============================================================
                  GUEST — Marketing nav (incl. Membership) + auth CTAs
              ============================================================ */}
              <DrawerSection label="Explore">
                {MARKETING_NAV_GUEST.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <DrawerLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={ItemIcon}
                      active={isActive(item.href)}
                      onClose={onClose}
                    />
                  );
                })}
              </DrawerSection>

              <DrawerSection label="Support">
                {SUPPORT_NAV.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <DrawerLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={ItemIcon}
                      active={isActive(item.href)}
                      onClose={onClose}
                    />
                  );
                })}
              </DrawerSection>

              {/* Guest CTAs */}
              <div className="mt-2 space-y-2 border-t border-[#EFEDF5] px-4 py-4">
                <Link
                  href="/#membership-plans"
                  onClick={onClose}
                  className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)]"
                >
                  Join UNICASH
                  <Icon.ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5]"
                >
                  Log in
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

/* -----------------------------------------------------------------------
   Reusable section + link
----------------------------------------------------------------------- */
function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#EFEDF5] px-2 py-3">
      <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">{label}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function DrawerLink({
  href, label, Icon, active, onClose,
}: { href: string; label: string; Icon: React.FC<{ className?: string }>; active: boolean; onClose: () => void }) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        /* Active state matches sidebar + desktop dropdown:
           solid brand gradient bg + white text + drop shadow.
           Single visual language across sidebar, desktop dropdown, mobile drawer. */
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors ${
          active
            ? 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_8px_18px_-10px_rgba(99,86,229,0.55)]'
            : 'text-[#4B5563] hover:bg-[#F4F1FB] hover:text-[#0F1222]'
        }`}
      >
        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-[#6356E5]'}`} />
        <span className="flex-1">{label}</span>
      </Link>
    </li>
  );
}
