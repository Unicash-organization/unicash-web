'use client';

import React, { useEffect, useState } from 'react';
import BoostPacksClient from '@/components/BoostPacksClient';

/* -----------------------------------------------------------------------
   AnimatedBalanceCount — counts from FROM → TO with easeOutCubic, holds,
   then loops. Pure visual decoration. Honors prefers-reduced-motion.
----------------------------------------------------------------------- */
function AnimatedBalanceCount({
  from = 3450,
  to = 4650,
  countMs = 2200,
  holdMs = 2400,
}: {
  from?: number;
  to?: number;
  countMs?: number;
  holdMs?: number;
}) {
  const [value, setValue] = useState(to); // SSR-safe: render final value first

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setValue(to);
      return;
    }

    const total = countMs + holdMs;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = (now - start) % total;
      if (t < countMs) {
        const p = t / countMs;
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setValue(Math.round(from + (to - from) * eased));
      } else {
        setValue(to);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [from, to, countMs, holdMs]);

  return <>{value.toLocaleString()}</>;
}

/* -----------------------------------------------------------------------
   Inline v4 icons used in the hero
----------------------------------------------------------------------- */
const PillDot = () => (
  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356E5]" />
);
const ArrowDown = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);
const SparkBoltIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);
const WalletIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    <path d="M3 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3" />
    <circle cx="17" cy="12" r="1" fill="currentColor" />
  </svg>
);
const GiftIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);
const ChevronDoubleDown = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="m7 6 5 5 5-5" />
    <path d="m7 13 5 5 5-5" />
  </svg>
);
const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function BoostPacksPageClient() {
  return (
    <div>
      {/* ====================================================================
         v4 hero — premium product stage (NOT a banner).

         NOTE: Backend-managed BannerSlider has been bypassed for /boost-packs
         because legacy banner copy ("Boost Packs", "Credits", "entries")
         conflicts with UNICASH terminology + design system v4. The banner CMS
         system itself is untouched and still renders globally on other pages.

         - 2-column layout on desktop: content left, animated flow right
         - Animated bg: drifting aurora blobs + dot grid
         - Right visual: 3 glassmorphism cards (Booster → Balance → Bonus Draw)
           with floating "+Points" chips drifting down + pulsing balance
         - Mobile-first compact copy (sm:hidden / hidden sm:block split)
         - Section bleeds into next section (no hard banner edges)
         - prefers-reduced-motion fully disables animation
      ==================================================================== */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#F4F1FB] via-[#FBFAFF] to-[#F4F1FB]">
          {/* ============================================================
              ANIMATED BACKGROUND — purely decorative
          ============================================================ */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="uc-aurora-1 absolute -top-40 left-[15%] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/22 blur-[140px]" />
            <div className="uc-aurora-2 absolute right-[-10%] top-1/3 h-[460px] w-[460px] rounded-full bg-[#FFE2B0]/22 blur-[120px]" />
            <div className="uc-aurora-3 absolute left-[-12%] bottom-[-12%] h-[420px] w-[420px] rounded-full bg-[#6356E5]/14 blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.28]"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(99,86,229,0.18) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
          </div>

          {/* ============================================================
              CONTENT GRID
          ============================================================ */}
          <div className="relative mx-auto max-w-7xl px-5 pt-12 pb-14 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8 lg:pt-24 lg:pb-28">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
              {/* ============== LEFT — content ============== */}
              <div className="text-center lg:col-span-7 lg:text-left">
                {/* Eyebrow pill */}
                <div className="flex justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] shadow-[0_2px_8px_-3px_rgba(99,86,229,0.2)] ring-1 ring-[#E0DAFF] backdrop-blur">
                    <PillDot />
                    Point Boosters
                  </span>
                </div>

                {/* Headline — distinct mobile vs desktop copy */}
                <h1 className="mt-5 text-[34px] font-extrabold leading-[1.05] tracking-tight text-[#0F1222] sm:text-[48px] md:text-[58px] lg:mt-6">
                  <span className="sm:hidden">
                    Need more <span className="uc-gold-gradient">Points?</span>
                  </span>
                  <span className="hidden sm:inline">
                    Top up Points <span className="uc-gold-gradient">anytime.</span>
                  </span>
                </h1>

                {/* Subheadline — distinct mobile vs desktop copy */}
                <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[#4B5563] sm:text-[17px] lg:mx-0">
                  <span className="sm:hidden">
                    Top up your UNICASH balance with optional one-time Point Boosters for member-only Bonus Draws.
                  </span>
                  <span className="hidden sm:inline">
                    Point Boosters are optional one-time purchases that add extra Points to your UNICASH balance. Use them when you want more flexibility for member-only Bonus Draws.
                  </span>
                </p>

                {/* CTAs — different button set on mobile vs desktop */}
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row lg:justify-start">
                  {/* Mobile primary only */}
                  <a
                    href="#choose-boost-pack"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-7 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 sm:hidden"
                  >
                    Choose a Booster
                    <ArrowDown className="h-4 w-4" />
                  </a>
                  {/* Desktop primary + secondary */}
                  <a
                    href="#choose-boost-pack"
                    className="hidden h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-7 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 sm:inline-flex"
                  >
                    Choose a Point Booster
                    <ArrowDown className="h-4 w-4" />
                  </a>
                  <a
                    href="#how-point-boosters-work"
                    className="hidden h-12 items-center justify-center rounded-full border border-[#E0DAFF] bg-white/90 px-6 text-[14.5px] font-bold text-[#0F1222] backdrop-blur transition-colors hover:border-[#6356E5] hover:text-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 sm:inline-flex"
                  >
                    How Point Boosters Work
                  </a>
                </div>

                {/* Trust line — distinct mobile vs desktop copy */}
                <p className="mt-6 text-[12.5px] leading-relaxed text-[#667085] sm:mt-7">
                  <span className="sm:hidden">One-time purchase · No auto-renew</span>
                  <span className="hidden sm:inline">One-time purchase · No auto-renew · Added to your Points balance</span>
                </p>

                {/* Mobile-only compact "Points balance" mini chip — fills the void
                    left by the hidden right-column visual. Animated count + flow icon
                    keeps mobile hero feeling alive without crowding. */}
                <div className="mt-7 sm:hidden" aria-hidden>
                  <div className="mx-auto inline-flex max-w-full items-center gap-3 rounded-full border border-[#E0DAFF] bg-white/85 px-4 py-2.5 shadow-[0_8px_20px_-10px_rgba(99,86,229,0.30)] backdrop-blur">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_4px_10px_-2px_rgba(99,86,229,0.45)]">
                      <SparkBoltIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#667085]">Balance</span>
                    <span className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-[18px] font-extrabold leading-none tracking-tight text-transparent tabular-nums">
                      <AnimatedBalanceCount from={3450} to={4650} countMs={2200} holdMs={2400} />
                    </span>
                    <span className="text-[12px] font-semibold text-[#667085]">Points</span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-[#10B981] ring-1 ring-[#A7F3D0]">
                      <CheckIcon className="h-2.5 w-2.5" /> Updated
                    </span>
                  </div>
                </div>
              </div>

              {/* ============== RIGHT — animated product flow visual ==============
                  Hidden on mobile (decorative, would crowd small viewports).
                  Card 1: Point Booster → Card 2: Points Balance → Card 3: Bonus Draw.
                  Floating "+Points" chips drift from Card 1 to Card 2.
                  Balance number subtly pulses. */}
              <div className="hidden lg:col-span-5 lg:block" aria-hidden>
                <div className="relative mx-auto max-w-[420px]">
                  {/* Soft halo behind the stack */}
                  <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-br from-[#8B7BFF]/12 via-transparent to-[#FFE2B0]/12 blur-2xl" />

                  {/* ----- Card 1 — Point Booster ----- */}
                  <div className="uc-card-rise-1 relative rounded-3xl border border-[#E0DAFF] bg-white/85 p-5 shadow-[0_20px_50px_-30px_rgba(99,86,229,0.30)] backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_8px_20px_-6px_rgba(99,86,229,0.5)]">
                        <SparkBoltIcon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Step 01</p>
                        <p className="-mt-0.5 text-[16px] font-extrabold tracking-tight text-[#0F1222]">Point Booster</p>
                      </div>
                      <span className="rounded-full bg-[#F4F1FB] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                        One-time
                      </span>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[#4B5563]">
                      Buy a one-time top-up. No subscription, no auto-renew.
                    </p>
                  </div>

                  {/* ----- Connector — flow line + floating "+P" coins ----- */}
                  <div className="relative mx-auto my-2 h-[88px] w-full">
                    {/* Vertical dashed flow line */}
                    <svg
                      className="absolute left-1/2 top-0 h-full -translate-x-1/2"
                      width="2"
                      height="88"
                      viewBox="0 0 2 88"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        x1="1"
                        y1="0"
                        x2="1"
                        y2="88"
                        stroke="#C8C0EE"
                        strokeWidth="2"
                        strokeDasharray="4 5"
                        className="uc-flow-dash"
                      />
                    </svg>

                    {/* Floating "+Points" chips — drift from top to bottom */}
                    <span className="uc-coin-flow uc-coin-1 absolute left-1/2 top-0 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(99,86,229,0.55)]">
                      <span className="text-[#FFE2B0]">+</span> Points
                    </span>
                    <span className="uc-coin-flow uc-coin-2 absolute left-1/2 top-0 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#FFE2B0] to-[#FFC85D] px-2.5 py-1 text-[11px] font-bold text-[#3A2A06] shadow-[0_6px_16px_-4px_rgba(255,200,93,0.55)]">
                      <span>+</span> Points
                    </span>
                    <span className="uc-coin-flow uc-coin-3 absolute left-1/2 top-0 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(99,86,229,0.55)]">
                      <span className="text-[#FFE2B0]">+</span> Points
                    </span>

                    {/* Soft caption */}
                    <p className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6356E5]">
                      Points added
                    </p>
                  </div>

                  {/* ----- Card 2 — Points Balance (highlighted) ----- */}
                  <div className="uc-card-rise-2 relative rounded-3xl border-2 border-[#6356E5]/25 bg-gradient-to-br from-white to-[#FBFAFF] p-5 shadow-[0_30px_70px_-30px_rgba(99,86,229,0.45)]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                        <WalletIcon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Step 02</p>
                        <p className="-mt-0.5 text-[16px] font-extrabold tracking-tight text-[#0F1222]">Points Balance</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.10em] text-[#10B981] ring-1 ring-[#A7F3D0]">
                        <CheckIcon className="h-3 w-3" /> Updated
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span
                        className="bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] bg-clip-text text-[34px] font-extrabold leading-none tracking-tight text-transparent tabular-nums"
                        aria-live="off"
                      >
                        <AnimatedBalanceCount from={3450} to={4650} countMs={2200} holdMs={2400} />
                      </span>
                      <span className="text-[14px] font-semibold text-[#667085]">Points</span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#4B5563]">
                      Booster Points are added to your balance and never expire.
                    </p>
                  </div>

                  {/* ----- Connector — bottom flow ----- */}
                  <div className="relative mx-auto my-2 h-[68px] w-full">
                    <svg
                      className="absolute left-1/2 top-0 h-full -translate-x-1/2"
                      width="2"
                      height="68"
                      viewBox="0 0 2 68"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        x1="1"
                        y1="0"
                        x2="1"
                        y2="68"
                        stroke="#C8C0EE"
                        strokeWidth="2"
                        strokeDasharray="4 5"
                        className="uc-flow-dash-slow"
                      />
                    </svg>
                    <span className="uc-chevron-tap absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#6356E5] shadow-[0_4px_12px_-2px_rgba(99,86,229,0.30)] ring-1 ring-[#E0DAFF]">
                      <ChevronDoubleDown className="h-3.5 w-3.5" />
                    </span>
                    <p className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#667085]">
                      Use Points
                    </p>
                  </div>

                  {/* ----- Card 3 — Bonus Draw Access ----- */}
                  <div className="uc-card-rise-3 relative rounded-3xl border border-[#E0DAFF] bg-white/85 p-5 shadow-[0_20px_50px_-30px_rgba(99,86,229,0.30)] backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE2B0] to-[#FFC85D] text-[#3A2A06] shadow-[0_8px_20px_-6px_rgba(255,200,93,0.45)]">
                        <GiftIcon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">Step 03</p>
                        <p className="-mt-0.5 text-[16px] font-extrabold tracking-tight text-[#0F1222]">Bonus Draw Access</p>
                      </div>
                      <span className="rounded-full bg-[#FFF6DA] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#9C5410] ring-1 ring-[#FFC85D]/50">
                        Members
                      </span>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[#4B5563]">
                      Use your Points to access eligible member-only Bonus Draws.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              Animations — keyframes scoped to this hero.
              prefers-reduced-motion fully disables animation.
          ============================================================ */}
          <style dangerouslySetInnerHTML={{ __html: `
            /* Aurora drift — slow, premium */
            @keyframes uc-aurora-a {
              0%   { transform: translate3d(-50%, 0, 0) scale(1);     opacity: .9; }
              50%  { transform: translate3d(-46%, 16px, 0) scale(1.06); opacity: 1; }
              100% { transform: translate3d(-52%, -8px, 0) scale(0.96); opacity: .85; }
            }
            @keyframes uc-aurora-b {
              0%   { transform: translate3d(0, 0, 0) scale(1);       opacity: .85; }
              50%  { transform: translate3d(-20px, 24px, 0) scale(1.08); opacity: 1; }
              100% { transform: translate3d(12px, -14px, 0) scale(0.95); opacity: .8; }
            }
            @keyframes uc-aurora-c {
              0%   { transform: translate3d(0, 0, 0) scale(1);       opacity: .8; }
              50%  { transform: translate3d(22px, -18px, 0) scale(1.05); opacity: .95; }
              100% { transform: translate3d(-10px, 14px, 0) scale(0.97); opacity: .82; }
            }
            .uc-aurora-1 { animation: uc-aurora-a 18s ease-in-out infinite alternate; will-change: transform, opacity; }
            .uc-aurora-2 { animation: uc-aurora-b 22s ease-in-out infinite alternate; will-change: transform, opacity; }
            .uc-aurora-3 { animation: uc-aurora-c 26s ease-in-out infinite alternate; will-change: transform, opacity; }

            /* Card breathe — very subtle vertical float, staggered */
            @keyframes uc-card-breathe {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-6px); }
            }
            .uc-card-rise-1 { animation: uc-card-breathe 7s ease-in-out infinite; animation-delay: 0s;   will-change: transform; }
            .uc-card-rise-2 { animation: uc-card-breathe 7s ease-in-out infinite; animation-delay: 1.2s; will-change: transform; }
            .uc-card-rise-3 { animation: uc-card-breathe 7s ease-in-out infinite; animation-delay: 2.4s; will-change: transform; }

            /* "+Points" coin drift — emerges at top, drifts down, fades */
            @keyframes uc-coin-drift {
              0%   { transform: translate(-50%, 0) scale(0.85);  opacity: 0; }
              15%  { opacity: 1; transform: translate(-50%, 14px) scale(1); }
              85%  { opacity: 1; transform: translate(-50%, 64px) scale(1); }
              100% { transform: translate(-50%, 84px) scale(0.85); opacity: 0; }
            }
            .uc-coin-flow {
              animation-name: uc-coin-drift;
              animation-iteration-count: infinite;
              animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
              animation-duration: 4.8s;
              will-change: transform, opacity;
            }
            .uc-coin-1 { animation-delay: 0s; }
            .uc-coin-2 { animation-delay: 1.6s; }
            .uc-coin-3 { animation-delay: 3.2s; }

            /* Dashed flow line — moves dashes downward */
            @keyframes uc-flow-dash-anim {
              from { stroke-dashoffset: 18; }
              to   { stroke-dashoffset: 0; }
            }
            .uc-flow-dash      { animation: uc-flow-dash-anim 1.6s linear infinite; }
            .uc-flow-dash-slow { animation: uc-flow-dash-anim 2.4s linear infinite; }

            /* Balance number — gentle pulse */
            @keyframes uc-balance-pulse-anim {
              0%, 100% { transform: scale(1);    filter: brightness(1); }
              50%      { transform: scale(1.04); filter: brightness(1.06); }
            }
            .uc-balance-pulse {
              display: inline-block;
              animation: uc-balance-pulse-anim 2.6s ease-in-out infinite;
              will-change: transform, filter;
            }

            /* "Use Points" chevron tap — soft bob */
            @keyframes uc-chevron-tap-anim {
              0%, 100% { transform: translate(-50%, -50%) translateY(0); opacity: 0.85; }
              50%      { transform: translate(-50%, -50%) translateY(3px); opacity: 1; }
            }
            .uc-chevron-tap { animation: uc-chevron-tap-anim 2.2s ease-in-out infinite; }

            /* Reduced motion — all decorative animations off */
            @media (prefers-reduced-motion: reduce) {
              .uc-aurora-1,
              .uc-aurora-2,
              .uc-aurora-3,
              .uc-card-rise-1,
              .uc-card-rise-2,
              .uc-card-rise-3,
              .uc-coin-flow,
              .uc-flow-dash,
              .uc-flow-dash-slow,
              .uc-balance-pulse,
              .uc-chevron-tap { animation: none !important; }
            }
          ` }} />
      </section>

      <BoostPacksClient />
    </div>
  );
}
