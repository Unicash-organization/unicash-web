'use client';

import React, { useEffect, useState } from 'react';
import DrawCard from '@/components/DrawCard';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/* -----------------------------------------------------------------------
   Inline v4 icons
----------------------------------------------------------------------- */
const PillDot = () => (
  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356E5]" />
);
const ChevronDown = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const SpinnerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" fill="none" />
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

/* How It Works steps — locked v4 copy */
const HOW_STEPS = [
  {
    n: '01',
    title: 'Choose a Bonus Draw',
    body: 'Browse member-only Bonus Draws and pick the reward you want to access.',
  },
  {
    n: '02',
    title: 'Use Points',
    body: 'Use your available Points to enter. If you need more, you can earn Points or use a Point Booster.',
  },
  {
    n: '03',
    title: 'Winners are published',
    body: 'After the draw closes, outcomes are recorded and Winners are published for transparency.',
  },
];

/* FAQ — 8 questions per spec */
const FAQ_ITEMS = [
  {
    q: 'What is a Bonus Draw?',
    a: 'A member-only reward event where Members use Points to enter. Each Bonus Draw shows the Points required and member limit upfront.',
  },
  {
    q: 'Do Membership plans include free Bonus Draw entries?',
    a: 'No. Membership plans include Major Draw entries. Bonus Draws require Points.',
  },
  {
    q: 'How do I get Points?',
    a: 'You can receive Monthly Points from your Membership, earn Points from eligible receipts and Fuel Rewards, or use optional Point Boosters.',
  },
  {
    q: 'Can I enter more than once?',
    a: 'Some Bonus Draws may limit entries per Member. The rule is shown clearly on each Bonus Draw before you enter.',
  },
  {
    q: 'What happens when a Bonus Draw closes?',
    a: 'The outcome is recorded and Winners are published for transparency.',
  },
  {
    q: 'What if I do not have enough Points?',
    a: 'You can earn more Points through eligible receipts or use an optional Point Booster.',
  },
  {
    q: 'Are Point Boosters subscriptions?',
    a: 'No. Point Boosters are one-time purchases and do not auto-renew.',
  },
  {
    q: 'Are Winners published?',
    a: 'Yes. Winners are published with draw details for transparency.',
  },
];

export default function GiveawaysClient() {
  /* ===== Logic preserved exactly ===== */
  const { user } = useAuth();
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bonus' | 'open'>('all');

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const response = await api.draws.getAll(user?.id);
        setDraws(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, [user?.id]);

  const filteredDraws = draws.filter((draw: any) => {
    if (filter === 'bonus') return draw.requiresMembership;
    if (filter === 'open') return draw.state === 'open';
    return true;
  });

  /* Filter pill helper */
  const filterPillCls = (active: boolean) =>
    `inline-flex h-10 items-center justify-center rounded-full px-4 text-[13px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 ${
      active
        ? 'bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] text-white shadow-[0_8px_20px_-8px_rgba(99,86,229,0.55)]'
        : 'border border-[#E7E9F2] bg-white text-[#0F1222] hover:border-[#6356E5] hover:text-[#6356E5]'
    }`;

  return (
    <>
      {/* ============================================================
          SECTION — Bonus Draws grid
      ============================================================ */}
      <section
        id="bonus-draws-grid"
        className="relative w-full overflow-hidden bg-[#F4F1FB] scroll-mt-20"
      >
        {/* Painted mesh — slightly stronger than before so cards pop on lavender backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/15 blur-[120px]" />
          <div className="absolute right-[-12%] top-1/3 h-[360px] w-[360px] rounded-full bg-[#FFE2B0]/12 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          {/* Section header */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] shadow-sm ring-1 ring-[#E0DAFF]">
              <PillDot />
              Active Bonus Draws
            </span>
            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[36px] md:text-[44px]">
              Pick your <span className="uc-gold-gradient">Bonus Draw.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#4B5563] sm:text-[16px]">
              Each Bonus Draw shows Points needed, member limit, and closing time upfront — fully transparent.
            </p>
          </div>

          {/* Filter bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <button onClick={() => setFilter('all')} aria-pressed={filter === 'all'} className={filterPillCls(filter === 'all')}>
              All Draws
            </button>
            <button onClick={() => setFilter('bonus')} aria-pressed={filter === 'bonus'} className={filterPillCls(filter === 'bonus')}>
              Member-only
            </button>
            <button onClick={() => setFilter('open')} aria-pressed={filter === 'open'} className={filterPillCls(filter === 'open')}>
              Open now
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            /* Skeleton — 6-card grid mirroring DrawCard layout */
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <article key={i} className="overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white">
                  <div className="aspect-[4/3] w-full animate-pulse bg-[#F4F1FB]" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[#F4F1FB]" />
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-[#F4F1FB]" />
                      <div className="h-4 w-16 animate-pulse rounded bg-[#F4F1FB]" />
                    </div>
                    <div className="h-2 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
                    <div className="h-11 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
                  </div>
                </article>
              ))}
            </div>
          ) : filteredDraws.length === 0 ? (
            <div className="mx-auto mt-12 max-w-md rounded-3xl border border-[#E7E9F2] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,18,34,.04)]">
              <p className="text-[15px] font-extrabold tracking-tight text-[#0F1222]">No Bonus Draws right now</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4B5563]">
                Check back soon — new member-only Bonus Draws are added regularly.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {filteredDraws.map((draw: any) => (
                <DrawCard
                  key={draw.id}
                  id={draw.id}
                  title={draw.title}
                  image={typeof draw.prizeImage === 'string' ? draw.prizeImage : draw.prizeImage?.url}
                  images={draw.images}
                  creditsPerEntry={draw.costPerEntry}
                  entrants={draw.entrants || 0}
                  cap={draw.cap ?? 100}
                  closedAt={draw.closedAt}
                  state={draw.state}
                  requiresMembership={draw.requiresMembership}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          SECTION — How It Works (Major Reward Section REMOVED)
      ============================================================ */}
      <section className="relative w-full overflow-hidden bg-[#FBFAFF]">
        {/* Quieter decoration — single subtle blob to differentiate from the louder
            Choose section above. Lets How feel like supporting educational content. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[280px] w-[680px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/8 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] shadow-sm ring-1 ring-[#E0DAFF]">
              <PillDot />
              How it works
            </span>
            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[36px] md:text-[44px]">
              Simple. Clear. <span className="uc-gold-gradient">Points-based.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#4B5563] sm:text-[16px]">
              Every Bonus Draw shows the Points needed, member limit, and closing time before you enter.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
            {HOW_STEPS.map((step) => (
              <div
                key={step.n}
                className="relative overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white p-6 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F1FB] ring-1 ring-[#E0DAFF]">
                  <span className="text-[14px] font-extrabold tracking-tight text-[#6356E5]">{step.n}</span>
                </span>
                <h3 className="mt-4 text-[18px] font-extrabold tracking-tight text-[#0F1222]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#4B5563]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[12.5px] text-[#4B5563]">
            {['Clear limits', 'Capped participation', 'Published Winners'].map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <span aria-hidden className="text-[#cfc8e8]">·</span>}
                <span>{t}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION — FAQ
      ============================================================ */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F1FB] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] ring-1 ring-[#E0DAFF]">
              <PillDot />
              FAQ
            </span>
            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[36px] md:text-[44px]">
              Common <span className="uc-gold-gradient">questions.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#4B5563] sm:text-[16px]">
              Quick answers about Bonus Draws, Points, and Membership.
            </p>
          </div>

          <div className="mx-auto mt-10 space-y-3 sm:mt-12">
            {FAQ_ITEMS.map((faq, index) => (
              <details
                key={index}
                open={index === 0}
                className="group rounded-2xl border border-[#E7E9F2] bg-white px-5 py-4 transition-shadow open:shadow-[0_8px_24px_-12px_rgba(15,18,34,0.12)] open:ring-1 open:ring-[#E0DAFF] sm:px-6 sm:py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                  <span className="text-[14.5px] font-extrabold tracking-tight text-[#0F1222] sm:text-[15.5px]">
                    {faq.q}
                  </span>
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF] transition-transform group-open:rotate-180">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </summary>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[#4B5563]">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
