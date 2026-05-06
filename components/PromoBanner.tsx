import React from 'react';
import Link from 'next/link';

/* PromoBanner — global thin bar at the very top of the site (v4 design system).
   Renders above the Header so it scrolls away while the Header sticks. */
export default function PromoBanner() {
  return (
    <div className="relative w-full bg-[#1A1432] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-5 py-2.5 text-[12.5px] sm:gap-x-3 sm:text-[13px] sm:px-6 lg:px-8">
        {/* NEW badge — desktop only (mobile keeps copy concise) */}
        <span className="hidden items-center gap-1.5 rounded-full bg-[#6356e5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white sm:inline-flex">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>
          New
        </span>

        {/* Mobile copy — concise */}
        <span className="text-white/85 sm:hidden">
          <span className="font-semibold text-white">200 bonus Points</span> on month one.
        </span>
        {/* Desktop copy — full sentence */}
        <span className="hidden text-white/85 sm:inline">
          New Members get <span className="font-semibold text-white">200 bonus Points</span> on their first month.
        </span>

        <Link
          href="/#membership-plans"
          className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 font-semibold text-white transition-colors hover:text-[#b7a8ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432]"
        >
          Join now
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
