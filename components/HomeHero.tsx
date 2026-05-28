'use client';

/* ==========================================================================
   UNICASH — HomeHero (v5: drifting wall of rewards)
   --------------------------------------------------------------------------
   Single-file client component. Used by app/HomeClient.tsx as the top
   section of the homepage.

   Design intent:
     - Brand-tinted dark stage (#1A1432) with painted radial mesh + dot
       texture, matching the locked homepage v4 background recipe.
     - 4 horizontally-drifting rows of "real reward" tiles: gift cards,
       receipts, Bonus Draw entry passes, and floating "+Points" pills.
     - Foreground headline with a 3-word rotator
       (gift cards. → Points. → Real rewards.) on a gold gradient.
     - Local backdrop-blur "pool" behind the text for legibility without
       blurring the rest of the wall.

   Compliance notes:
     - Uses ONLY UNICASH terminology (Points, Bonus Draws, Major Draw,
       Fuel Rewards, Membership). No ticket/lottery/raffle/jackpot/spin.
     - Bonus Draws shown as compliant Entry passes — no scratch-card or
       casino visual cues.
     - prefers-reduced-motion stops both the wall and the word rotator.

   Asset swap:
     - <GiftTile imageSrc="/img/gc-apple.png" /> replaces the placeholder
       artwork once licensed partner artwork is available.
   ========================================================================== */

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Sparkles,
  Clock,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Brand tokens — pulled from UNICASH design system                          */
/* -------------------------------------------------------------------------- */

const BRAND = {
  base: '#1A1432',
  accent: '#6356E5',
  accentEnd: '#8B7BFF',
  gold1: '#FFE2B0',
  gold2: '#F5B266',
  gold3: '#E78848',
  gold4: '#C8623E',
} as const;

const GOLD_GRADIENT = `linear-gradient(180deg, ${BRAND.gold1} 0%, ${BRAND.gold2} 38%, ${BRAND.gold3} 78%, ${BRAND.gold4} 100%)`;
const GOLD_GRADIENT_H = `linear-gradient(90deg, ${BRAND.gold1} 0%, ${BRAND.gold2} 50%, ${BRAND.gold3} 100%)`;

const MESH_BG: React.CSSProperties = {
  backgroundColor: BRAND.base,
  backgroundImage: [
    'radial-gradient(60% 50% at 20% 15%, rgba(139,123,255,0.40) 0%, rgba(26,20,50,0) 70%)',
    'radial-gradient(50% 40% at 85% 85%, rgba(99,86,229,0.30) 0%, rgba(26,20,50,0) 70%)',
    'radial-gradient(30% 25% at 75% 20%, rgba(255,200,93,0.15) 0%, rgba(26,20,50,0) 75%)',
  ].join(', '),
};

const DOT_TEXTURE: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
  backgroundSize: '24px 24px',
  opacity: 0.06,
};

/* -------------------------------------------------------------------------- */
/*  Component-scoped CSS — kept inline so the component is self-contained.    */
/*  Move into globals.css if you prefer a single stylesheet.                  */
/* -------------------------------------------------------------------------- */

const HERO_CSS = `
  .uc-hero-wall {
    position: absolute; inset: 0;
    filter: blur(1px) saturate(1.05) brightness(0.95);
    opacity: 0.85;
    pointer-events: none;
    will-change: transform;
    contain: layout paint;
  }
  .uc-hero-row {
    display: flex;
    gap: 28px;
    width: max-content;
    align-items: center;
  }
  .uc-hero-row + .uc-hero-row { margin-top: 28px; }
  @keyframes uc-hero-drift-left  { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
  @keyframes uc-hero-drift-right { from { transform: translateX(-50%); } to { transform: translateX(0);    } }
  .uc-hero-row.left  { animation: uc-hero-drift-left  90s linear infinite; }
  .uc-hero-row.right { animation: uc-hero-drift-right 90s linear infinite; }
  .uc-hero-row.slow    { animation-duration: 110s; }
  .uc-hero-row.medium  { animation-duration: 85s;  }
  .uc-hero-row.fast    { animation-duration: 70s;  }

  /* Local backdrop blur behind text/buttons for legibility without blurring
     the rest of the wall. */
  .uc-hero-text-pool {
    -webkit-backdrop-filter: blur(10px) saturate(1.05);
            backdrop-filter: blur(10px) saturate(1.05);
    -webkit-mask-image: radial-gradient(58% 55% at 50% 50%, #000 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%);
            mask-image: radial-gradient(58% 55% at 50% 50%, #000 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0) 100%);
  }

  /* Reduce-motion — park the wall + rotating word. */
  @media (prefers-reduced-motion: reduce) {
    .uc-hero-row { animation: none !important; transform: none !important; }
    .uc-hero-roll-track { animation: none !important; }
  }
  /* Mobile: soften the wall slightly. */
  @media (max-width: 640px) {
    .uc-hero-wall { opacity: 0.6; filter: blur(2px) saturate(1.05); }
  }

  /* Rotating word — "gift cards." → "Points." → "Real rewards."
     Track holds 4 children (3 words + duplicate of first) at 1.25em each.
     translateY % is relative to the track's own height, so 1 word = 25%. */
  @keyframes uc-hero-roll {
    0%, 22%   { transform: translateY(0);     }
    30%, 55%  { transform: translateY(-25%);  }
    63%, 88%  { transform: translateY(-50%);  }
    96%, 100% { transform: translateY(-75%);  }
  }
  .uc-hero-roll-mask {
    display: inline-block;
    overflow: hidden;
    height: 1.25em;
    line-height: 1.1;
    vertical-align: top;
    padding-bottom: 0.05em;
  }
  .uc-hero-roll-track {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: max-content;
    animation: uc-hero-roll 9s cubic-bezier(0.7, 0, 0.3, 1) 2.2s infinite;
    will-change: transform;
  }
  .uc-hero-roll-word {
    height: 1.25em;
    line-height: 1.1;
    white-space: nowrap;
    flex-shrink: 0;
    padding-bottom: 0.05em;
  }
`;

/* -------------------------------------------------------------------------- */
/*  Partner gift cards — 9 AU brands.                                         */
/*  Swap to licensed artwork by passing `imageSrc` on <GiftTile>.             */
/* -------------------------------------------------------------------------- */

type GiftBrandKey =
  | 'apple'
  | 'coles'
  | 'jbhifi'
  | 'woolworths'
  | 'bp'
  | 'bunnings'
  | 'netflix'
  | 'uber'
  | 'myer';

type GiftBrand = {
  key: GiftBrandKey;
  name: string;
  amount: number;
  bg: string;
  text: string;
  accent: string;
  wordmarkFont: string;
  wordmarkWeight: number;
  label: string;
};

const GIFT_BRANDS: GiftBrand[] = [
  { key: 'apple',      name: 'Apple',      amount: 50,  bg: 'linear-gradient(135deg, #1a1a1c 0%, #38383d 50%, #1a1a1c 100%)', text: '#f5f5f7', accent: '#aeaeb2', wordmarkFont: 'ui-rounded, system-ui, sans-serif', wordmarkWeight: 600, label: 'Gift Card' },
  { key: 'coles',      name: 'Coles',      amount: 30,  bg: 'linear-gradient(135deg, #6a0d18 0%, #c41229 60%, #8c0a18 100%)', text: '#ffffff', accent: '#ffd1a8', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 800, label: 'Gift Card' },
  { key: 'jbhifi',     name: 'JB Hi-Fi',   amount: 75,  bg: 'linear-gradient(135deg, #0d0d0d 0%, #2a2a2a 100%)',              text: '#ffdb1a', accent: '#ffe680', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 900, label: 'Gift Card' },
  { key: 'woolworths', name: 'Woolworths', amount: 50,  bg: 'linear-gradient(135deg, #064a20 0%, #138a3b 55%, #0a5a26 100%)', text: '#ffffff', accent: '#a8e6b8', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 700, label: 'Gift Card' },
  { key: 'bp',         name: 'BP',         amount: 40,  bg: 'linear-gradient(135deg, #064f2a 0%, #0c8a3a 55%, #f8d318 100%)', text: '#ffffff', accent: '#fff7c2', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 800, label: 'Fuel Gift Card' },
  { key: 'bunnings',   name: 'Bunnings',   amount: 50,  bg: 'linear-gradient(135deg, #0a3d18 0%, #11591f 100%)',              text: '#ffffff', accent: '#c7e8ce', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 800, label: 'Gift Card' },
  { key: 'netflix',    name: 'Netflix',    amount: 30,  bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)', text: '#e50914', accent: '#ff4d57', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 900, label: 'Gift Card' },
  { key: 'uber',       name: 'Uber',       amount: 25,  bg: 'linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 100%)',              text: '#ffffff', accent: '#bdbdbd', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 800, label: 'Gift Card' },
  { key: 'myer',       name: 'Myer',       amount: 50,  bg: 'linear-gradient(135deg, #5a0d12 0%, #a4151c 60%, #6e0e14 100%)', text: '#ffffff', accent: '#ffe6a8', wordmarkFont: 'Inter, sans-serif', wordmarkWeight: 800, label: 'Gift Card' },
];

type GiftTileProps = {
  brand: GiftBrandKey;
  amount?: number;
  imageSrc?: string;
  size?: number;
};

function GiftTile({ brand, amount, imageSrc, size = 200 }: GiftTileProps) {
  const b = GIFT_BRANDS.find((x) => x.key === brand) ?? GIFT_BRANDS[0];
  const actualAmount = amount ?? b.amount;
  const w = size;
  const h = Math.round(size / 1.6);

  if (imageSrc) {
    return (
      // Decorative drifting tile, not LCP — next/image's wrapper + sizing
      // breaks the fixed-width carousel layout, so plain <img> is correct here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={`${b.name} gift card`}
        width={w}
        height={h}
        className="rounded-[12px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/15"
        style={{ width: w, height: h, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[12px] ring-1 ring-white/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
      style={{ width: w, height: h, background: b.bg, color: b.text }}
    >
      <div
        aria-hidden
        className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, ${b.accent} 0%, transparent 70%)`,
          opacity: 0.45,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent, ${b.accent}, transparent)`,
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between">
          <div
            className="text-[7.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: b.accent, opacity: 0.85 }}
          >
            {b.label}
          </div>
          <div className="text-[8px] font-semibold uppercase tracking-[0.22em] opacity-50">
            UNICASH
          </div>
        </div>
        <div>
          <div
            className="leading-[1] truncate"
            style={{
              fontFamily: b.wordmarkFont,
              fontWeight: b.wordmarkWeight,
              fontSize: Math.round(w * 0.105) + 'px',
              color: b.text,
            }}
          >
            {b.name}
          </div>
          <div className="mt-1 flex items-end justify-between">
            <div className="text-[8.5px] font-medium opacity-65">
              Redeem via Points
            </div>
            <div
              className="leading-none font-extrabold"
              style={{
                fontSize: Math.round(w * 0.13) + 'px',
                color: b.accent,
              }}
            >
              ${actualAmount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Receipt tile — evokes a scanned receipt with a Points footer              */
/* -------------------------------------------------------------------------- */

type ReceiptSample = {
  store: string;
  date: string;
  items: ReadonlyArray<readonly [string, string]>;
  total: string;
  points: number;
};

const RECEIPT_SAMPLES: ReceiptSample[] = [
  { store: 'Woolworths', date: '27 MAY', items: [['Groceries', '$52.40'], ['Household', '$14.60'], ['Produce', '$8.00']], total: '$75.00', points: 150 },
  { store: 'Coles',      date: '25 MAY', items: [['Groceries', '$36.20'], ['Bakery', '$6.80']], total: '$43.00', points: 86 },
  { store: 'Bunnings',   date: '22 MAY', items: [['Hardware', '$28.50'], ['Garden', '$11.40']], total: '$39.90', points: 80 },
  { store: 'BP',         date: '24 MAY', items: [['Unleaded 95', '$62.40'], ['Snack', '$4.50']], total: '$66.90', points: 200 },
  { store: 'IGA',        date: '20 MAY', items: [['Groceries', '$22.10']], total: '$22.10', points: 44 },
];

function ReceiptTile({ index = 0, w = 132 }: { index?: number; w?: number }) {
  const r = RECEIPT_SAMPLES[index % RECEIPT_SAMPLES.length];
  return (
    <div
      className="relative shrink-0 bg-white text-[#0F1222] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
      style={{
        width: w,
        clipPath:
          'polygon(0 0, 100% 0, 100% calc(100% - 6px), 94% 100%, 87% calc(100% - 6px), 80% 100%, 73% calc(100% - 6px), 66% 100%, 59% calc(100% - 6px), 52% 100%, 45% calc(100% - 6px), 38% 100%, 31% calc(100% - 6px), 24% 100%, 17% calc(100% - 6px), 10% 100%, 3% calc(100% - 6px), 0 100%)',
      }}
    >
      <div className="px-3 pt-3 pb-5 font-mono text-[8.5px] leading-snug">
        <div className="flex items-center justify-between">
          <div className="font-bold tracking-[0.16em]">{r.store.toUpperCase()}</div>
          <div className="text-[7px] text-[#667085]">{r.date}</div>
        </div>
        <div className="my-1.5 border-t border-dashed border-[#0F1222]/20" />
        <div className="space-y-1">
          {r.items.map(([l, a]) => (
            <div key={l} className="flex justify-between text-[#0F1222]/85">
              <span className="truncate pr-2">{l}</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 border-t border-dashed border-[#0F1222]/20" />
        <div className="mt-1.5 flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{r.total}</span>
        </div>
        <div
          className="mt-2 flex items-center justify-center gap-1 rounded-md py-1"
          style={{ background: GOLD_GRADIENT_H, color: BRAND.base }}
        >
          <Sparkles className="h-[9px] w-[9px]" />
          <span className="text-[8px] font-bold tracking-wide">+{r.points} Points</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bonus Draw entry pass — compliant: no ticket/raffle/lottery visual cues   */
/* -------------------------------------------------------------------------- */

type EntrySample = { ref: string; draw: string; closes: string };

const ENTRY_SAMPLES: EntrySample[] = [
  { ref: 'UC-204 837', draw: 'Major Draw · June',    closes: '30 Jun' },
  { ref: 'UC-198 412', draw: 'Bonus Draw · Weekly',  closes: '02 Jun' },
  { ref: 'UC-211 902', draw: 'Bonus Draw · Monthly', closes: '30 Jun' },
];

function EntryTile({ index = 0, size = 200 }: { index?: number; size?: number }) {
  const e = ENTRY_SAMPLES[index % ENTRY_SAMPLES.length];
  const w = size;
  const h = Math.round(size / 1.6);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[12px] ring-1 ring-white/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
      style={{
        width: w,
        height: h,
        background: `linear-gradient(135deg, #1F1840 0%, ${BRAND.accent} 60%, ${BRAND.accentEnd} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-2xl opacity-40"
        style={{ background: `radial-gradient(circle, ${BRAND.gold2} 0%, transparent 70%)` }}
      />
      <div className="relative flex h-full flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <BadgeCheck className="h-[10px] w-[10px] text-white" />
            <div className="text-[7.5px] font-bold uppercase tracking-[0.18em] text-white">
              Bonus Draws · Entry
            </div>
          </div>
          <div
            className="text-[7px] font-bold uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}
          >
            Confirmed
          </div>
        </div>
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/55">
            Entry ref
          </div>
          <div className="mt-0.5 font-mono text-[11px] font-bold tracking-wider text-white">
            {e.ref}
          </div>
        </div>
        <div className="flex items-end justify-between border-t border-white/15 pt-1.5">
          <div className="text-[9.5px] font-bold text-white leading-tight">{e.draw}</div>
          <div className="flex items-center gap-1 text-[8px] text-white/75">
            <Clock className="h-[9px] w-[9px]" />
            <span>Closes {e.closes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  "+Points" pill — used sparingly for rhythm in the wall                    */
/* -------------------------------------------------------------------------- */

function PointsTile({ amount = 150 }: { amount?: number }) {
  return (
    <div
      className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ring-white/40 shadow-[0_18px_40px_-12px_rgba(255,200,93,0.5)]"
      style={{ background: GOLD_GRADIENT_H, color: BRAND.base }}
    >
      <Sparkles className="h-[11px] w-[11px]" />
      <span className="text-[11px] font-bold">+{amount} Points</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row builders — each row is duplicated to allow seamless translateX loop.  */
/*  Items are returned as render-functions so the wrapping <Row> is the       */
/*  single keying site (avoids react/jsx-key on array literals and prevents   */
/*  key collisions when the row is doubled).                                  */
/* -------------------------------------------------------------------------- */

type RowItem = () => React.ReactElement;

function buildRow1(): RowItem[] {
  return [
    () => <GiftTile brand="apple" amount={50} size={200} />,
    () => <ReceiptTile index={0} w={132} />,
    () => <GiftTile brand="coles" amount={30} size={200} />,
    () => <GiftTile brand="jbhifi" amount={75} size={200} />,
    () => <EntryTile index={0} size={200} />,
    () => <GiftTile brand="woolworths" amount={50} size={200} />,
    () => <PointsTile amount={200} />,
    () => <GiftTile brand="netflix" amount={30} size={200} />,
    () => <ReceiptTile index={3} w={132} />,
    () => <GiftTile brand="bunnings" amount={50} size={200} />,
  ];
}
function buildRow2(): RowItem[] {
  return [
    () => <GiftTile brand="bp" amount={40} size={220} />,
    () => <EntryTile index={1} size={220} />,
    () => <GiftTile brand="myer" amount={100} size={220} />,
    () => <ReceiptTile index={1} w={146} />,
    () => <GiftTile brand="uber" amount={25} size={220} />,
    () => <GiftTile brand="apple" amount={100} size={220} />,
    () => <PointsTile amount={86} />,
    () => <GiftTile brand="coles" amount={50} size={220} />,
    () => <GiftTile brand="jbhifi" amount={100} size={220} />,
    () => <ReceiptTile index={2} w={146} />,
  ];
}
function buildRow3(): RowItem[] {
  return [
    () => <ReceiptTile index={4} w={120} />,
    () => <GiftTile brand="woolworths" amount={100} size={180} />,
    () => <GiftTile brand="netflix" amount={50} size={180} />,
    () => <EntryTile index={2} size={180} />,
    () => <GiftTile brand="bunnings" amount={25} size={180} />,
    () => <PointsTile amount={150} />,
    () => <GiftTile brand="bp" amount={20} size={180} />,
    () => <GiftTile brand="myer" amount={50} size={180} />,
    () => <ReceiptTile index={0} w={120} />,
    () => <GiftTile brand="uber" amount={50} size={180} />,
  ];
}
function buildRow4(): RowItem[] {
  return [
    () => <GiftTile brand="coles" amount={20} size={210} />,
    () => <GiftTile brand="apple" amount={25} size={210} />,
    () => <ReceiptTile index={3} w={138} />,
    () => <GiftTile brand="jbhifi" amount={50} size={210} />,
    () => <EntryTile index={0} size={210} />,
    () => <GiftTile brand="woolworths" amount={25} size={210} />,
    () => <PointsTile amount={44} />,
    () => <GiftTile brand="bunnings" amount={100} size={210} />,
    () => <GiftTile brand="netflix" amount={30} size={210} />,
    () => <ReceiptTile index={1} w={138} />,
  ];
}

type RowProps = {
  items: RowItem[];
  direction?: 'left' | 'right';
  speed?: '' | 'slow' | 'medium' | 'fast';
};

function Row({ items, direction = 'left', speed = '' }: RowProps) {
  const doubled = [...items, ...items];
  return (
    <div className={`uc-hero-row ${direction} ${speed}`.trim()}>
      {doubled.map((Render, i) => (
        <div key={i}>
          <Render />
        </div>
      ))}
    </div>
  );
}

function Wall() {
  return (
    <div className="uc-hero-wall flex flex-col justify-center">
      <Row items={buildRow1()} direction="left" speed="slow" />
      <Row items={buildRow2()} direction="right" speed="medium" />
      <Row items={buildRow3()} direction="left" speed="fast" />
      <Row items={buildRow4()} direction="right" speed="medium" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rotating word — "gift cards." → "Points." → "Real rewards."               */
/*  2.2s delay so the first phrase reads in full before any motion starts.    */
/* -------------------------------------------------------------------------- */

const ROTATING_WORDS = ['gift cards.', 'Points.', 'Real rewards.'] as const;

function RotatingWord() {
  return (
    <span
      className="uc-hero-roll-mask"
      role="text"
      aria-label={ROTATING_WORDS.join(' ').replace(/\.$/, '')}
    >
      <span className="uc-hero-roll-track" aria-hidden>
        {[...ROTATING_WORDS, ROTATING_WORDS[0]].map((w, i) => (
          <span
            key={i}
            className="uc-hero-roll-word bg-clip-text text-transparent"
            style={{
              backgroundImage: GOLD_GRADIENT,
              WebkitBackgroundClip: 'text',
            }}
          >
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Trust strip                                                               */
/* -------------------------------------------------------------------------- */

const TRUST_DESKTOP = ['Published Winners', 'Clear Limits', 'Secure Checkout', 'Cancel Anytime'];
const TRUST_MOBILE = ['Published Winners', 'Secure Checkout', 'Cancel Anytime'];

/* -------------------------------------------------------------------------- */
/*  HomeHero — default export                                                 */
/* -------------------------------------------------------------------------- */

export default function HomeHero() {
  return (
    <section
      className="relative isolate overflow-hidden text-white"
      style={MESH_BG}
    >
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />

      {/* Drifting wall of rewards */}
      <Wall />

      {/* Unifying purple tint over the wall */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'rgba(99, 86, 229, 0.15)' }}
      />

      {/* Dot texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={DOT_TEXTURE}
      />

      {/* Local backdrop blur behind text + buttons */}
      <div
        aria-hidden
        className="uc-hero-text-pool pointer-events-none absolute inset-0"
      />

      {/* Dark wash for text contrast */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(54% 50% at 50% 50%, rgba(26,20,50,0.78) 0%, rgba(26,20,50,0.45) 55%, rgba(26,20,50,0) 100%)',
        }}
      />

      {/* Bottom vignette — keeps the next section's purple-spill handoff clean */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
        style={{
          background: `linear-gradient(180deg, rgba(26,20,50,0) 0%, ${BRAND.base} 100%)`,
        }}
      />

      {/* FOREGROUND */}
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32 lg:px-8 lg:pt-36 lg:pb-40">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 ring-1 ring-white/15 backdrop-blur-md">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: BRAND.gold2, boxShadow: `0 0 10px ${BRAND.gold2}` }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
            Built for everyday Australians
          </span>
        </div>

        {/* H1 — first phrase static, second phrase rotates.
            Mobile size bumped to 52px (from 40px) for stronger on-device impact;
            still wraps cleanly to 3 lines at iPhone ~375–414px widths. */}
        <h1 className="mt-6 text-balance text-[52px] font-extrabold leading-[1.04] tracking-tight text-white sm:text-[60px] md:text-[68px] lg:text-[80px] lg:leading-[1.05]">
          <span className="block">Turn your receipts into</span>
          <RotatingWord />
        </h1>

        {/* Subhead — mobile gets a shorter copy per UNICASH mobile split rule */}
        <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-white/80 sm:text-[17px]">
          <span className="sm:hidden">
            Scan receipts to earn Points, Fuel Rewards, and member-only Bonus Draws.
          </span>
          <span className="hidden sm:inline">
            Scan eligible receipts to earn Points, unlock Fuel Rewards, and access member-only Bonus Draws.
          </span>
        </p>

        {/* CTAs */}
        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/#membership-plans"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-[#6356E5] shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)] transition hover:bg-white/95 hover:text-[#5648D8] hover:shadow-[0_14px_40px_-10px_rgba(255,255,255,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432] sm:w-auto"
          >
            Join UNICASH
            <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/giveaways"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] px-7 text-[15px] font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition hover:bg-white/[0.10] hover:ring-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432] sm:w-auto"
          >
            Explore Bonus Draws
            <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Trust strip — mobile drops 'Clear Limits' */}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] font-medium text-white/65 sm:hidden">
          {TRUST_MOBILE.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span>{label}</span>
              {i < TRUST_MOBILE.length - 1 && (
                <span aria-hidden className="text-white/30">·</span>
              )}
            </li>
          ))}
        </ul>
        <ul className="mt-8 hidden flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] font-medium text-white/65 sm:flex">
          {TRUST_DESKTOP.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span>{label}</span>
              {i < TRUST_DESKTOP.length - 1 && (
                <span aria-hidden className="text-white/30">·</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
