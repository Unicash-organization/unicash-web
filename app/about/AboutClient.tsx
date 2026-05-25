'use client';

/* ==========================================================================
   UNICASH /about — v4 redesign
   --------------------------------------------------------------------------
   - Visual + section structure mirrors `previews/homepage-v4.html` & app/page.tsx
   - Static content (approved UNICASH copy) — no API/auth/business logic touched
   - Pure UI/content task; all backend, payment, Stripe, business rules untouched
   ========================================================================== */

import React, { useState } from 'react';
import Link from 'next/link';

/* -------------------------------------------------------------------------- */
/*  Inline icons                                                              */
/* -------------------------------------------------------------------------- */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  ChevronDown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Coins: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Gift: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M12 7v15M22 11H2M16 7l-4-4-4 4M8 22h8" />
    </svg>
  ),
  Fuel: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="3" x2="15" y1="22" y2="22" />
      <line x1="4" x2="14" y1="9" y2="9" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </svg>
  ),
  Sparkles: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z" />
      <path d="M19 14v4M21 16h-4M5 18v3M6.5 19.5h-3" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Lock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  Zap: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z" />
    </svg>
  ),
  Heart: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  HelpCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Reusable building blocks                                                  */
/* -------------------------------------------------------------------------- */

function Eyebrow({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) {
  const cls =
    tone === 'dark'
      ? 'text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFE2B0]'
      : 'text-[10px] font-bold uppercase tracking-[0.18em] text-[#6356e5]';
  return <span className={cls}>{children}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Section data                                                              */
/* -------------------------------------------------------------------------- */

type IconCmp = (p: { className?: string }) => React.JSX.Element;

const WHAT_UNICASH_DOES: { icon: IconCmp; title: string; body: string }[] = [
  {
    icon: Icon.Coins,
    title: 'Earn Points',
    body: 'Members receive Monthly Points and can earn more from eligible receipts.',
  },
  {
    icon: Icon.Gift,
    title: 'Use Points',
    body: 'Points can be used for member-only Bonus Draws or selected Gift Card redemption.',
  },
  {
    icon: Icon.Fuel,
    title: 'Get Fuel Rewards',
    body: 'Eligible fuel receipts can earn tier-based Points in your UNICASH wallet.',
  },
  {
    icon: Icon.Sparkles,
    title: 'Access rewards',
    body: 'Members can access Bonus Draws, Major Draws, Point Boosters, and everyday reward features.',
  },
];

const TRUST_PILLARS: { icon: IconCmp; title: string; body: string }[] = [
  {
    icon: Icon.ShieldCheck,
    title: 'Clear limits',
    body: 'Bonus Draws show member limits and entry rules upfront.',
  },
  {
    icon: Icon.Trophy,
    title: 'Published Winners',
    body: 'Completed Bonus Draw outcomes are published for transparency.',
  },
  {
    icon: Icon.Lock,
    title: 'Secure payments',
    body: 'Membership and purchases are handled through secure checkout flows.',
  },
  {
    icon: Icon.Heart,
    title: 'Member-first design',
    body: 'Rewards, Points, and account activity are shown clearly inside your account.',
  },
];

const PRODUCT_PILLARS: { icon: IconCmp; tone: 'purple' | 'gold' | 'warm'; title: string; body: string }[] = [
  {
    icon: Icon.Crown,
    tone: 'purple',
    title: 'Membership',
    body: 'Monthly Points, Major Draw entries, and member benefits.',
  },
  {
    icon: Icon.Coins,
    tone: 'purple',
    title: 'Points',
    body: 'The core reward unit used for Bonus Draws and selected Gift Card redemption.',
  },
  {
    icon: Icon.Fuel,
    tone: 'warm',
    title: 'Fuel Rewards',
    body: 'Eligible fuel receipts earn tier-based Points.',
  },
  {
    icon: Icon.Zap,
    tone: 'gold',
    title: 'Point Boosters',
    body: 'Optional one-time purchases for extra Points.',
  },
  {
    icon: Icon.Gift,
    tone: 'purple',
    title: 'Bonus Draws',
    body: 'Member-only Points-based rewards with clear limits.',
  },
  {
    icon: Icon.Trophy,
    tone: 'gold',
    title: 'Redeem Gift Cards',
    body: 'Convert eligible Points into selected Gift Cards from 2,000 Points.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How are Draws conducted on UNICASH?',
    a: 'Draws conducted on the Platform are promotional in nature. Where a Draw constitutes a regulated trade promotion under state or territory law, UNICASH conducts it in accordance with applicable law and any required permit. Details are in each Draw’s Promotion-Specific Terms.',
  },
  {
    q: 'What do Members receive?',
    a: 'Members receive Monthly Points, Major Draw entries, access to Bonus Draws, Fuel Rewards, and Gift Card redemption features.',
  },
  {
    q: 'Can I cancel my Membership?',
    a: 'Memberships renew monthly until cancelled. You can manage billing from your account billing area.',
  },
];

/* Tone → ring/icon-bg mapping for product pillars (visual rhythm) */
const PILLAR_TONE: Record<'purple' | 'gold' | 'warm', { iconBg: string; iconText: string; ring: string }> = {
  purple: { iconBg: 'bg-[#F0EDFB]', iconText: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]' },
  gold: { iconBg: 'bg-[#FFF6DA]', iconText: 'text-[#C49A2C]', ring: 'ring-[#FFE2B0]' },
  warm: { iconBg: 'bg-[#FFF4E6]', iconText: 'text-[#D97A2C]', ring: 'ring-[#FFD9B5]' },
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AboutClient() {
  return (
    <main className="bg-white">
      {/* ====================================================================
          HERO
      ==================================================================== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(720px 480px at 14% 16%, rgba(139,123,255,.16), transparent 62%)',
              'radial-gradient(620px 420px at 88% 12%, rgba(201,192,242,.22), transparent 60%)',
              'radial-gradient(560px 380px at 50% 100%, rgba(99,86,229,.10), transparent 62%)',
              'radial-gradient(420px 320px at 92% 78%, rgba(255,226,176,.12), transparent 60%)',
              'linear-gradient(180deg, #FBFAFF 0%, #FBFAFF 100%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 sm:h-48"
          style={{
            background: [
              'radial-gradient(1100px 220px at 50% -30%, rgba(99,86,229,.18), transparent 72%)',
              'radial-gradient(700px 180px at 20% -22%, rgba(139,123,255,.14), transparent 70%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-5 pt-14 pb-10 text-center sm:px-6 sm:pt-24 sm:pb-16 lg:px-8">
          <Eyebrow>About UNICASH</Eyebrow>
          <h1 className="mt-3 text-[32px] font-extrabold leading-[1.08] tracking-tight text-[#0f1222] sm:text-[44px] md:text-[52px]">
            Everyday value, <span className="uc-gold-gradient">made more rewarding.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
            Built for everyday Australians — earn Points, unlock Fuel Rewards, access Bonus Draws, receive Major Draw
            entries, and Redeem Gift Cards from one premium Membership.
          </p>

          <ul className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] font-semibold text-[#4b5563] sm:mt-6 sm:text-[13px]">
            {['Premium rewards', 'Clear limits', 'Published Winners', 'Secure payments'].map((c, i) => (
              <li key={c} className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#6356E5]/70" aria-hidden />
                <span>{c}</span>
                {i < 3 ? <span className="text-[#cfc8e8]" aria-hidden>·</span> : null}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:mt-7 sm:flex-row sm:items-center">
            <Link
              href="/#plans"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6356E5] px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(99,86,229,.45)] transition hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              Join UNICASH
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#draws"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[14px] font-semibold text-[#0f1222] transition hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            >
              View Bonus Draws
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          WHAT UNICASH DOES — 4 cards (purple icon pills)
      ==================================================================== */}
      <section className="relative bg-white">
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <Eyebrow>What we do</Eyebrow>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
              What UNICASH <span className="uc-gold-gradient">does.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15px]">
              UNICASH brings everyday rewards into one Membership — Points, Fuel Rewards, Bonus Draws, Major Draw
              entries, and Gift Card redemption.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-5">
            {WHAT_UNICASH_DOES.map((item) => {
              const Ic = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-3xl border border-[#e7e9f2] bg-white p-6 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition hover:-translate-y-0.5 hover:border-[#d1cbf5] hover:shadow-[0_18px_40px_-22px_rgba(99,86,229,.30)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                    <Ic className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[16px] font-extrabold tracking-tight text-[#0f1222]">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#4b5563]">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          TRUST AND TRANSPARENCY — 4 cards on lavender
      ==================================================================== */}
      <section className="relative overflow-hidden bg-[#F4F1FB]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[900px] -translate-x-1/2 rounded-full bg-[#6356E5]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6356e5]/15 to-transparent"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <Eyebrow>Trust and transparency</Eyebrow>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
              Built around trust and <span className="uc-gold-gradient">transparency.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15px]">
              UNICASH is designed to make rewards clear. Bonus Draws show the Points required, member limit, closing
              time, and published Winners so Members can understand how each draw works before entering.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {TRUST_PILLARS.map((item) => {
              const Ic = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-3xl border border-[#e7e9f2] bg-white p-6 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition hover:-translate-y-0.5 hover:border-[#d1cbf5] hover:shadow-[0_18px_40px_-22px_rgba(99,86,229,.30)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                    <Ic className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15.5px] font-extrabold tracking-tight text-[#0f1222]">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#4b5563]">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          PRODUCT PILLARS — 6 cards (rotating tones)
      ==================================================================== */}
      <section className="relative bg-white">
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <Eyebrow>The ecosystem</Eyebrow>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
              The UNICASH <span className="uc-gold-gradient">ecosystem.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15px]">
              Everything UNICASH offers — Membership at the centre, with Points flowing across every reward.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {PRODUCT_PILLARS.map((item) => {
              const Ic = item.icon;
              const tone = PILLAR_TONE[item.tone];
              return (
                <article
                  key={item.title}
                  className="rounded-3xl border border-[#e7e9f2] bg-white p-6 shadow-[0_1px_2px_rgba(15,18,34,.04)] transition hover:-translate-y-0.5 hover:border-[#d1cbf5] hover:shadow-[0_18px_40px_-22px_rgba(99,86,229,.30)]"
                >
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tone.iconBg} ${tone.iconText} ring-1 ${tone.ring}`}
                  >
                    <Ic className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[16px] font-extrabold tracking-tight text-[#0f1222]">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#4b5563]">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          CTA — premium gradient card
      ==================================================================== */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div
            className="relative overflow-hidden rounded-3xl border border-[#E0DAFF] p-8 text-center shadow-[0_30px_60px_-30px_rgba(99,86,229,.55)] sm:p-12"
            style={{
              background: 'linear-gradient(135deg, #4538B8 0%, #6356E5 50%, #8B7BFF 100%)',
            }}
          >
            {/* Decorative blooms */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#FFE2B0]/25 blur-3xl"
            />
            {/* Subtle dot texture overlay */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Inner soft ring for premium edge */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-1 rounded-[22px] ring-1 ring-inset ring-white/10"
            />

            <div className="relative mx-auto max-w-2xl">
              <Eyebrow tone="dark">Get started</Eyebrow>
              <h2 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[34px] md:text-[40px]">
                Ready to get more from <span className="uc-gold-gradient">everyday rewards?</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/85 sm:text-[15px]">
                Join UNICASH to start earning Points, access Fuel Rewards, and explore member-only Bonus Draws.
              </p>

              <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/#plans"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[14px] font-semibold text-[#5346D6] shadow-[0_12px_28px_-8px_rgba(15,18,34,.35)] transition hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6356E5]"
                >
                  Join UNICASH
                  <Icon.ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/#plans"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.06] px-7 text-[14px] font-semibold text-white backdrop-blur transition hover:border-white/50 hover:bg-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6356E5]"
                >
                  View Membership Plans
                </Link>
              </div>

              <ul className="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] font-semibold text-white/85">
                {['Cancel anytime', 'Secure checkout', 'Published Winners'].map((c, i) => (
                  <li key={c} className="flex items-center gap-2">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#FFE2B0]" aria-hidden />
                    <span>{c}</span>
                    {i < 2 ? <span className="text-white/30" aria-hidden>·</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          FAQ (compact, 3 questions)
      ==================================================================== */}
      <FaqSection />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ section                                                               */
/* -------------------------------------------------------------------------- */

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <section className="relative bg-[#FBFAFF]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6356e5]/15 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl grid grid-cols-1 gap-10 px-5 py-14 sm:px-6 sm:py-20 md:grid-cols-12 md:gap-12 lg:px-8">
        <div className="md:col-span-5">
          <Eyebrow>Got questions?</Eyebrow>
          <h2 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px] md:text-[36px]">
            Quick <span className="uc-gold-gradient">answers.</span>
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#4b5563] sm:text-[14.5px]">
            The essentials in plain English. Need more detail? The full FAQ has 45+ answers.
          </p>
          <Link
            href="/faq"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0f1222] transition hover:border-[#c8c5ea] hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
          >
            <Icon.HelpCircle className="h-4 w-4 text-[#6356E5]" />
            Read FAQ
            <Icon.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="md:col-span-7">
          <div className="space-y-3">
            {FAQ_ITEMS.map((f, i) => {
              const open = openIdx === i;
              const panelId = `about-faq-panel-${i}`;
              const triggerId = `about-faq-trigger-${i}`;
              return (
                <div
                  key={f.q}
                  className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                    open
                      ? 'border-[#d1cbf5] shadow-[0_10px_30px_-18px_rgba(99,86,229,.35)]'
                      : 'border-[#e7e9f2] hover:border-[#d1cbf5]'
                  }`}
                >
                  <h3>
                    <button
                      id={triggerId}
                      type="button"
                      onClick={() => setOpenIdx(open ? -1 : i)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6356e5]"
                    >
                      <span className="text-[14.5px] font-semibold tracking-tight text-[#0f1222] sm:text-[15px]">
                        {f.q}
                      </span>
                      <span
                        aria-hidden
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356e5] transition-transform duration-300 ${
                          open ? 'rotate-180' : ''
                        }`}
                      >
                        <Icon.ChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </h3>
                  <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
                    {open && (
                      <div className="px-5 pb-5 text-[13.5px] leading-relaxed text-[#4b5563] sm:text-[14px]">
                        {f.a}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
