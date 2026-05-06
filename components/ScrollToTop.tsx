'use client';

import { useState, useEffect } from 'react';
import { useBottomNavVisible } from '@/components/MobileBottomNav';

const SHOW_AFTER = 400;

/* -----------------------------------------------------------------------
   ScrollToTop button.

   Hidden on mobile when MobileBottomNav is visible — otherwise the floating
   button overlaps the right-most bottom-nav tab ("Booster"). Stays visible
   on desktop and on mobile screens without a bottom nav (auth pages, etc.).
----------------------------------------------------------------------- */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const bottomNavVisible = useBottomNavVisible();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-30 h-11 w-11 items-center justify-center rounded-full bg-white/95 backdrop-blur-md ring-1 ring-[#E0DAFF] shadow-[0_12px_28px_-10px_rgba(99,86,229,0.30)] transition-all duration-200 ease-out hover:ring-[#6356E5] hover:shadow-[0_16px_36px_-12px_rgba(99,86,229,0.45)] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 ${
        bottomNavVisible ? 'hidden sm:inline-flex' : 'inline-flex'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px] text-[#6356E5] transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
        aria-hidden
      >
        <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}
