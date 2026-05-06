'use client';

/* ==========================================================================
   UNICASH /faq — v4 redesign
   --------------------------------------------------------------------------
   - Visual + section structure mirrors `previews/homepage-v4.html` & app/page.tsx
   - Static FAQ content (approved UNICASH copy) — no API call, no auth changes
   - Pure UI/content task; no backend / payment / Stripe / business logic touched
   ========================================================================== */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

/* -------------------------------------------------------------------------- */
/*  Inline icon helpers (no extra deps — match homepage v4 conventions)       */
/* -------------------------------------------------------------------------- */

const Icon = {
  Search: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  ChevronDown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
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
  HelpCircle: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  Mail: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  ),
  /* ── Category icons ── */
  Rocket: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294Z" />
      <path d="M5 21h14" />
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
  Zap: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z" />
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
  CreditCard: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
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
/*  FAQ catalog — approved UNICASH content (UI/content task, fully static)    */
/* -------------------------------------------------------------------------- */

type CategoryKey =
  | 'getting-started'
  | 'membership'
  | 'points'
  | 'bonus-draws'
  | 'major-draws'
  | 'point-boosters'
  | 'fuel-rewards'
  | 'gift-cards'
  | 'billing'
  | 'winners';

type FaqItem = { q: string; a: string };

type CategoryDef = {
  key: CategoryKey;
  label: string;
  chip: string;
  icon: (p: { className?: string }) => React.JSX.Element;
};

const CATEGORIES: CategoryDef[] = [
  { key: 'getting-started', label: 'Getting Started', chip: 'Getting Started', icon: Icon.Rocket },
  { key: 'membership', label: 'Membership', chip: 'Membership', icon: Icon.Crown },
  { key: 'points', label: 'Points', chip: 'Points', icon: Icon.Coins },
  { key: 'bonus-draws', label: 'Bonus Draws', chip: 'Bonus Draws', icon: Icon.Gift },
  { key: 'major-draws', label: 'Major Draws', chip: 'Major Draws', icon: Icon.Trophy },
  { key: 'point-boosters', label: 'Point Boosters', chip: 'Point Boosters', icon: Icon.Zap },
  { key: 'fuel-rewards', label: 'Fuel Rewards & Scan Receipts', chip: 'Fuel Rewards', icon: Icon.Fuel },
  { key: 'gift-cards', label: 'Redeem Gift Cards', chip: 'Gift Cards', icon: Icon.Gift },
  { key: 'billing', label: 'Billing & Account', chip: 'Billing', icon: Icon.CreditCard },
  { key: 'winners', label: 'Winners & Transparency', chip: 'Winners & Trust', icon: Icon.ShieldCheck },
];

const FAQ_DATA: Record<CategoryKey, FaqItem[]> = {
  'getting-started': [
    {
      q: 'What is UNICASH?',
      a: 'UNICASH is a premium Australian Membership rewards platform. Members earn Points, access Bonus Draws, receive Major Draw entries, earn Fuel Rewards from eligible receipts, and Redeem Gift Cards.',
    },
    {
      q: 'Is UNICASH gambling?',
      a: 'No. UNICASH is a Membership rewards platform. Bonus Draws use Points, show clear member limits, and publish Winners for transparency. UNICASH is not framed as gambling, betting, lottery, raffle, or casino.',
    },
    {
      q: 'Who can join UNICASH?',
      a: 'UNICASH is designed for eligible Australian Members. Full eligibility requirements are shown in the Terms and during signup.',
    },
  ],
  membership: [
    {
      q: 'What does a Membership include?',
      a: 'Membership includes Monthly Points, Major Draw entries, access to member-only Bonus Draws, Fuel Rewards, Scan Receipts, and Gift Card redemption.',
    },
    {
      q: 'Which Membership plans are available?',
      a: 'UniOne (A$19.99 / month), UniPlus (A$49.99 / month), and UniMax (A$99.99 / month). Each plan includes a different amount of Monthly Points and Major Draw entries.',
    },
    {
      q: 'How many Monthly Points do I get?',
      a: 'UniOne includes 300 Monthly Points, UniPlus includes 1,000 Monthly Points, and UniMax includes 2,500 Monthly Points.',
    },
    {
      q: 'How many Major Draw entries do I get?',
      a: 'UniOne includes 1 Major Draw entry monthly, UniPlus includes 4 Major Draw entries monthly, and UniMax includes 10 Major Draw entries monthly.',
    },
    {
      q: 'Do Membership plans include free Bonus Draw entries?',
      a: 'No. Membership plans include Major Draw entries. Bonus Draws require Points to participate.',
    },
    {
      q: 'Can I cancel my Membership?',
      a: 'Yes. Memberships renew monthly until cancelled. You can manage your Membership from your account billing area.',
    },
  ],
  points: [
    {
      q: 'What are Points?',
      a: 'Points are the core UNICASH reward unit. Members can use Points for Bonus Draws or Redeem Gift Cards when eligible.',
    },
    {
      q: 'How do I earn Points?',
      a: 'Points come from Monthly Points, eligible receipt scanning, Fuel Rewards, and optional Point Boosters.',
    },
    {
      q: 'Do Monthly Points reset?',
      a: 'Monthly Points renew each billing cycle. Booster Points purchased separately stack with your Monthly Points and follow the rules shown at purchase.',
    },
    {
      q: 'What can I use Points for?',
      a: 'Points can be used for eligible Bonus Draws and selected Gift Card redemption.',
    },
    {
      q: 'How many Points do I need to redeem a Gift Card?',
      a: 'Selected Gift Cards can be redeemed from 2,000 Points, equal to a A$20 selected Gift Card.',
    },
  ],
  'bonus-draws': [
    {
      q: 'What is a Bonus Draw?',
      a: 'A Bonus Draw is a member-only reward event where Members use Points to enter. Each Bonus Draw shows the Points required, member limit, closing time, and outcome details.',
    },
    {
      q: 'How do I enter a Bonus Draw?',
      a: 'Choose a Bonus Draw, check the Points required, and confirm your entry using Points from your UNICASH balance.',
    },
    {
      q: 'How many Points do Bonus Draws require?',
      a: 'Each Bonus Draw shows the Points needed before you enter. For example, a A$2,000 Bonus Draw may require 200 Points for 1 entry.',
    },
    {
      q: 'Can I enter more than once?',
      a: 'Some Bonus Draws have limits, such as max 1 entry per Member. The entry rule is shown clearly before you enter.',
    },
    {
      q: 'What if I don’t have enough Points?',
      a: 'You can earn more Points by scanning eligible receipts, claiming Fuel Rewards, or topping up with an optional Point Booster.',
    },
    {
      q: 'What happens when a Bonus Draw closes?',
      a: 'After a Bonus Draw closes, the outcome is recorded and Winners are published for transparency.',
    },
  ],
  'major-draws': [
    {
      q: 'What is a Major Draw?',
      a: 'Major Draws are included with active Membership plans. Higher Membership tiers include more Major Draw entries each month.',
    },
    {
      q: 'How are Major Draws different from Bonus Draws?',
      a: 'Major Draw entries are included with Membership plans. Bonus Draws require Points to participate.',
    },
    {
      q: 'Do I use Points for Major Draw entries?',
      a: 'No. Major Draw entries are included with active Membership plans based on your tier.',
    },
  ],
  'point-boosters': [
    {
      q: 'What are Point Boosters?',
      a: 'Point Boosters are optional one-time purchases that add extra Points to your UNICASH balance.',
    },
    {
      q: 'Are Point Boosters subscriptions?',
      a: 'No. Point Boosters are one-time purchases and do not auto-renew.',
    },
    {
      q: 'Which Point Boosters are available?',
      a: 'Booster Spark gives 250 Points for A$4.99, Booster Pulse gives 1,200 Points for A$19.99, and Booster Surge gives 2,000 Points for A$29.99.',
    },
    {
      q: 'Do I need to buy Point Boosters?',
      a: 'No. Your Membership already includes Monthly Points. Point Boosters are optional top-ups when you want extra Points.',
    },
    {
      q: 'What can I use Point Booster Points for?',
      a: 'Points from Point Boosters can be used for eligible Bonus Draws or other eligible Points-based rewards.',
    },
  ],
  'fuel-rewards': [
    {
      q: 'How do Fuel Rewards work?',
      a: 'Scan eligible fuel receipts to earn Fuel Rewards as Points in your UNICASH wallet. Higher Membership tiers earn more Points from eligible fuel spending.',
    },
    {
      q: 'How many Points do I earn from fuel receipts?',
      a: 'Free Members earn 0.5 Point per A$1, UniOne earns 1 Point per A$1, UniPlus earns 2 Points per A$1, and UniMax earns 3 Points per A$1 from eligible fuel receipts.',
    },
    {
      q: 'How many Points do I earn from general receipts?',
      a: 'Free Members earn 0.25 Point per A$1, UniOne earns 0.5 Point per A$1, UniPlus earns 1 Point per A$1, and UniMax earns 1.5 Points per A$1 from eligible general receipts.',
    },
    {
      q: 'Are receipts approved instantly?',
      a: 'Receipt uploads may need review. Your account shows whether a receipt is pending, approved, rejected, or requires attention.',
    },
    {
      q: 'What receipts are eligible?',
      a: 'Eligible receipt rules are shown in the Scan Receipts flow and Terms. Receipts must be clear, valid, and not previously submitted.',
    },
  ],
  'gift-cards': [
    {
      q: 'Can I Redeem Gift Cards with Points?',
      a: 'Yes. Selected Gift Cards can be redeemed with Points when you meet the redemption requirement.',
    },
    {
      q: 'What is the redemption benchmark?',
      a: '2,000 Points can be redeemed for a A$20 selected Gift Card.',
    },
    {
      q: 'Are all Gift Cards always available?',
      a: 'Gift Card availability may vary. Available redemption options are shown in the redemption area.',
    },
  ],
  billing: [
    {
      q: 'When am I charged for Membership?',
      a: 'Membership is billed monthly on the same date you joined or last changed your plan.',
    },
    {
      q: 'Are Point Boosters charged monthly?',
      a: 'No. Point Boosters are one-time purchases and don’t auto-renew.',
    },
    {
      q: 'Where can I manage billing?',
      a: 'Once logged in, head to your account billing area to view receipts, update your card, or change your plan.',
    },
    {
      q: 'What happens if payment fails?',
      a: 'Your account may show a payment issue. You may need to update your payment method to keep Membership benefits active.',
    },
    {
      q: 'How do I log in?',
      a: 'Use your registered email and password to sign in. If you forget your password, use the Reset password option on the login screen.',
    },
  ],
  winners: [
    {
      q: 'Are Winners published?',
      a: 'Yes. Winners are published after Bonus Draw outcomes are completed and verified.',
    },
    {
      q: 'Why does UNICASH publish Winners?',
      a: 'Published Winners help Members see that outcomes are recorded and transparent.',
    },
    {
      q: 'Are Bonus Draw limits shown upfront?',
      a: 'Yes. Each Bonus Draw shows the Points required, member limit, Members joined, and closing time before you enter.',
    },
    {
      q: 'How does UNICASH keep Bonus Draws clear?',
      a: 'UNICASH uses clear Points requirements, member limits, closing times, and published Winners to reduce confusion and improve transparency.',
    },
  ],
};

/* Build a flat searchable index for the "All" view + search */
type FlatItem = FaqItem & { categoryKey: CategoryKey; categoryLabel: string };

const FLAT_FAQS: FlatItem[] = (Object.keys(FAQ_DATA) as CategoryKey[]).flatMap((k) => {
  const cat = CATEGORIES.find((c) => c.key === k)!;
  return FAQ_DATA[k].map((item) => ({ ...item, categoryKey: k, categoryLabel: cat.label }));
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryKey>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string>('getting-started-0'); // first item open by default
  const sectionRef = useRef<HTMLDivElement | null>(null);

  /* ------------- filter logic (purely local) ------------- */
  const normalisedQuery = query.trim().toLowerCase();

  const filteredByCategory = useMemo<FlatItem[]>(() => {
    if (activeCategory === 'all') return FLAT_FAQS;
    return FLAT_FAQS.filter((f) => f.categoryKey === activeCategory);
  }, [activeCategory]);

  const filteredItems = useMemo<FlatItem[]>(() => {
    if (!normalisedQuery) return filteredByCategory;
    return filteredByCategory.filter(
      (f) =>
        f.q.toLowerCase().includes(normalisedQuery) ||
        f.a.toLowerCase().includes(normalisedQuery) ||
        f.categoryLabel.toLowerCase().includes(normalisedQuery),
    );
  }, [filteredByCategory, normalisedQuery]);

  /* group filtered items back by category for grouped accordion view */
  const grouped = useMemo(() => {
    const map = new Map<CategoryKey, FlatItem[]>();
    filteredItems.forEach((f) => {
      const arr = map.get(f.categoryKey) ?? [];
      arr.push(f);
      map.set(f.categoryKey, arr);
    });
    return CATEGORIES.filter((c) => map.has(c.key)).map((c) => ({
      ...c,
      items: map.get(c.key)!,
    }));
  }, [filteredItems]);

  /* When user toggles a chip, scroll grouped section into view */
  useEffect(() => {
    if (activeCategory === 'all') return;
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeCategory]);

  const totalCount = filteredItems.length;

  return (
    <main className="bg-white">
      {/* ====================================================================
          HERO — painted lavender mesh, search card, dual CTA
      ==================================================================== */}
      <section className="relative overflow-hidden">
        {/* Painted mesh */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(720px 480px at 14% 16%, rgba(139,123,255,.16), transparent 62%)',
              'radial-gradient(620px 420px at 88% 12%, rgba(201,192,242,.22), transparent 60%)',
              'radial-gradient(560px 380px at 50% 100%, rgba(99,86,229,.10), transparent 62%)',
              'radial-gradient(420px 320px at 92% 78%, rgba(255,226,176,.10), transparent 60%)',
              'linear-gradient(180deg, #FBFAFF 0%, #FBFAFF 100%)',
            ].join(', '),
          }}
        />
        {/* Top purple spill — Header handoff */}
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
        {/* Faint dot texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-5 pt-16 pb-10 sm:px-6 sm:pt-24 sm:pb-14 lg:px-8">
          <div className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h1 className="mt-3 text-[32px] font-extrabold leading-[1.08] tracking-tight text-[#0f1222] sm:text-[44px] md:text-[52px]">
              Questions about <span className="uc-gold-gradient">UNICASH?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
              Clear, short answers — Membership, Points, Bonus Draws, Fuel Rewards, and more.
            </p>

            {/* Trust strip */}
            <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] font-semibold text-[#4b5563] sm:text-[13px]">
              {[`${FLAT_FAQS.length}+ answers`, 'Clear limits', 'Published Winners', 'Updated regularly'].map((c, i) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#6356E5]/70" aria-hidden />
                  <span>{c}</span>
                  {i < 3 ? <span className="text-[#cfc8e8]" aria-hidden>·</span> : null}
                </li>
              ))}
            </ul>

            {/* Hero CTAs */}
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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

          {/* Search card */}
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="rounded-3xl border border-[#e7e9f2] bg-white/80 p-3 shadow-[0_18px_40px_-22px_rgba(15,18,34,.18)] backdrop-blur-sm sm:p-3.5">
              <label htmlFor="faq-search" className="sr-only">
                Search FAQ
              </label>
              <div className="flex items-center gap-2">
                <span className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                  <Icon.Search className="h-4 w-4" />
                </span>
                <input
                  id="faq-search"
                  type="search"
                  placeholder="Search Membership, Points, Bonus Draws…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 w-full bg-transparent text-[14px] text-[#0f1222] placeholder:text-[#9aa2b8] focus:outline-none"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="mr-1 inline-flex h-8 items-center justify-center rounded-full px-3 text-[12px] font-semibold text-[#6356E5] hover:bg-[#F4F1FB]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-center text-[12px] text-[#7a8195]">
              {normalisedQuery ? (
                totalCount > 0 ? (
                  <>
                    <span className="font-semibold text-[#0f1222]">{totalCount}</span>{' '}
                    {totalCount === 1 ? 'answer' : 'answers'} for “{query}”
                  </>
                ) : (
                  <>No matches yet — try a simpler keyword.</>
                )
              ) : (
                <>Try “Bonus Draws”, “Fuel Rewards”, or “Gift Cards”.</>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CATEGORY CHIPS — premium pill row with subtle top hairline
      ==================================================================== */}
      <section className="relative bg-[#FBFAFF]" aria-label="FAQ categories">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6356e5]/15 to-transparent"
        />
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-6 lg:px-8">
          <div
            role="tablist"
            aria-label="FAQ categories"
            className="-mx-1 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <CategoryChip
              active={activeCategory === 'all'}
              label="All"
              onClick={() => setActiveCategory('all')}
            />
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.key}
                active={activeCategory === c.key}
                label={c.chip}
                onClick={() => setActiveCategory(c.key)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          FAQ ACCORDION — grouped by category
      ==================================================================== */}
      <section ref={sectionRef} className="relative bg-[#FBFAFF]">
        {/* Subtle dot texture — fades out as user scrolls into the long content */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[400px] opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'linear-gradient(180deg, #000 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 100%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          {grouped.length === 0 ? (
            <EmptyState query={query} onClear={() => { setQuery(''); setActiveCategory('all'); }} />
          ) : (
            <div className="space-y-12">
              {grouped.map((group) => {
                const Ic = group.icon;
                return (
                <div key={group.key} id={`cat-${group.key}`} className="scroll-mt-24">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                        <Ic className="h-[18px] w-[18px]" />
                      </span>
                      <h2 className="text-[22px] font-extrabold tracking-tight text-[#0f1222] sm:text-[26px]">
                        {group.label}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#6356E5] ring-1 ring-[#E0DAFF]">
                      {group.items.length} {group.items.length === 1 ? 'Q' : 'Qs'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item, i) => {
                      const id = `${group.key}-${i}`;
                      const open = openId === id;
                      const panelId = `faq-panel-${id}`;
                      const triggerId = `faq-trigger-${id}`;
                      return (
                        <div
                          key={id}
                          className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                            open ? 'border-[#d1cbf5] shadow-[0_10px_30px_-18px_rgba(99,86,229,.35)]' : 'border-[#e7e9f2] hover:border-[#d1cbf5]'
                          }`}
                        >
                          <h3>
                            <button
                              id={triggerId}
                              type="button"
                              onClick={() => setOpenId(open ? '' : id)}
                              aria-expanded={open}
                              aria-controls={panelId}
                              className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6356e5]"
                            >
                              <span className="text-[15px] font-semibold tracking-tight text-[#0f1222] sm:text-[15.5px]">
                                {item.q}
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
                              <div className="px-5 pb-5 text-[14px] leading-relaxed text-[#4b5563] sm:text-[14.5px]">
                                {item.a}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          SUPPORT / CTA BLOCK
      ==================================================================== */}
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              'radial-gradient(700px 360px at 18% 100%, rgba(139,123,255,.12), transparent 60%)',
              'radial-gradient(640px 320px at 88% 0%, rgba(99,86,229,.08), transparent 65%)',
            ].join(', '),
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="rounded-3xl border border-[#e7e9f2] bg-white p-6 shadow-[0_18px_40px_-22px_rgba(15,18,34,.16)] sm:p-10">
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7">
                <Eyebrow>Need a hand?</Eyebrow>
                <h2 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[32px]">
                  Still have <span className="uc-gold-gradient">questions?</span>
                </h2>
                <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15px]">
                  Reach our team about Membership, Points, Bonus Draws, or your account — usually a reply within one
                  business day.
                </p>

                <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/contact"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6356E5] px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(99,86,229,.45)] transition hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                  >
                    <Icon.Mail className="h-4 w-4" />
                    Contact Support
                  </Link>
                  <Link
                    href="/#plans"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[14px] font-semibold text-[#0f1222] transition hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
                  >
                    Join UNICASH
                    <Icon.ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="md:col-span-5">
                <ul className="grid grid-cols-1 gap-3">
                  {[
                    {
                      icon: Icon.ShieldCheck,
                      title: 'Trust & transparency',
                      body: 'Bonus Draw limits, Members joined, and Winners are published clearly.',
                    },
                    {
                      icon: Icon.Sparkles,
                      title: 'Premium rewards',
                      body: 'Use Points for Bonus Draws or Redeem Gift Cards from 2,000 Points.',
                    },
                    {
                      icon: Icon.HelpCircle,
                      title: 'Friendly support',
                      body: 'Real humans answering — replies usually within one business day.',
                    },
                  ].map((row) => {
                    const Ic = row.icon;
                    return (
                      <li
                        key={row.title}
                        className="flex items-start gap-3 rounded-2xl border border-[#e7e9f2] bg-[#FBFAFF] p-4"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                          <Ic className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[13.5px] font-semibold tracking-tight text-[#0f1222]">{row.title}</p>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#4b5563]">{row.body}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 snap-start rounded-full px-4 py-2 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 ${
        active
          ? 'bg-[#6356E5] text-white shadow-[0_8px_20px_-10px_rgba(99,86,229,.65)]'
          : 'border border-[#e7e9f2] bg-white text-[#0f1222] hover:border-[#c8c5ea] hover:text-[#5346D6]'
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#e7e9f2] bg-white p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F0EDFB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
        <Icon.Search className="h-5 w-5" />
      </div>
      <h3 className="text-[18px] font-extrabold tracking-tight text-[#0f1222]">No matching questions found.</h3>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#4b5563]">
        {query ? (
          <>We couldn’t find anything for “{query}”. Try searching for Membership, Points, Bonus Draws, or Fuel Rewards.</>
        ) : (
          <>Try searching for Membership, Points, Bonus Draws, or Fuel Rewards.</>
        )}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#6356E5] px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(99,86,229,.55)] transition hover:bg-[#5346D6]"
      >
        Reset filters
      </button>
    </div>
  );
}
