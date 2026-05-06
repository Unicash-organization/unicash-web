import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* Social icon set — Lucide-style stroke icons that fill viewBox 0 0 24 24 properly. */
const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

/* v4 link arrays — terminology aligned to UNICASH Design System v4. Routes preserved. */
const PRODUCT_LINKS = [
  { label: 'Bonus Draws', href: '/giveaways' },
  { label: 'Fuel Rewards', href: '/scan-receipts' },
  { label: 'Point Boosters', href: '/boost-packs' },
  { label: 'Membership', href: '/#membership-plans' },
];

const COMPANY_LINKS = [
  { label: 'Winners', href: '/winners' },
  { label: 'FAQs', href: '/faq' },
  { label: 'Contact Support', href: '/contact' },
  { label: 'About us', href: '/about' },
];

const LEGAL_LINKS = [
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Bonus Draw rules', href: '/terms#bonus-draws' },
  { label: 'Responsible participation', href: '/terms#responsible' },
];

const linkCls =
  'rounded-md text-[14px] text-white/85 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432]';

const socialCls =
  'inline-flex h-10 w-10 items-center justify-center rounded-full text-white/75 ring-1 ring-white/15 transition-colors hover:bg-white/8 hover:text-white hover:ring-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432]';

const colHeading =
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45';

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#1A1432] text-white">
      {/* Top haze — soft purple bloom + thin gradient line so the white-section→dark transition feels intentional */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6356e5]/40 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[1100px] -translate-x-1/2 rounded-full bg-[#6356e5]/20 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute -top-20 right-[-10%] h-56 w-[420px] rounded-full bg-[#8B7BFF]/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 pt-14 pb-8 sm:px-6 lg:px-8">
        {/* Brand block — own row, generous spacing */}
        <div className="max-w-sm">
          <Link href="/" aria-label="UNICASH home" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432]">
            <Image
              src="/images/white-logo.svg"
              alt="UniCash"
              width={150}
              height={26}
              className="h-8 w-auto"
            />
          </Link>
          <p className="mt-4 text-[13px] leading-relaxed text-white/60">
            A premium Australian Membership rewards platform.
          </p>
        </div>

        {/* Link columns — 2-col on mobile (Product+Company), Legal full-width below; 3-col on sm+ */}
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:gap-x-12">
          <div>
            <p className={colHeading}>Product</p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={colHeading}>Company</p>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className={colHeading}>Legal</p>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 h-px bg-white/10" aria-hidden />

        {/* Bottom strip — social on top of copyright on mobile, side-by-side on sm+ */}
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={socialCls}>
              <FacebookIcon />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={socialCls}>
              <InstagramIcon />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={socialCls}>
              <YouTubeIcon />
            </a>
          </div>
          <p className="text-[12px] text-white/45">
            © {new Date().getFullYear()} UNICASH. All rights reserved. Made in Australia.
          </p>
        </div>
      </div>
    </footer>
  );
}
