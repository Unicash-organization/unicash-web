'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import BoostPackCard from '@/components/BoostPackCard';
import api from '@/lib/api';

/* -----------------------------------------------------------------------
   BoostPacksClient — v4 redesign.
   Logic preserved exactly:
   - api.membership.getBoostPacks() fetch
   - boostPacks state + sort by displayOrder
   - hash scroll to #choose-boost-pack
   - BoostPackCard rendering with pack prop + key=pack.id
----------------------------------------------------------------------- */

/* Inline v4 icons */
const PillDotIcon = () => (
  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356E5]" />
);
const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
const RefreshIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
const PlusCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8M12 8v8" />
  </svg>
);
const ChevronDownIcon = ({ className = '' }: { className?: string }) => (
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
const InfoIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
const ShieldIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/* -----------------------------------------------------------------------
   Trust pill row + How It Works steps + FAQ — locked v4 copy
----------------------------------------------------------------------- */

const TRUST_PILLS: { icon: React.FC<{ className?: string }>; label: string }[] = [
  { icon: PlusCircleIcon, label: 'One-time purchase' },
  { icon: RefreshIcon, label: 'No auto-renew' },
  { icon: CheckCircleIcon, label: 'Added to your Points balance' },
];

const HOW_STEPS = [
  {
    n: '01',
    title: 'Choose a Point Booster',
    body: 'Pick the one-time Points top-up that fits what you need.',
  },
  {
    n: '02',
    title: 'Points are added to your balance',
    body: 'After purchase, your Points are added to your UNICASH account.',
  },
  {
    n: '03',
    title: 'Use Points for Bonus Draws',
    body: 'Use your Points to access eligible member-only Bonus Draws.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Are Point Boosters subscriptions?',
    a: 'No. Point Boosters are optional one-time purchases. They are completely separate from your Membership.',
  },
  {
    q: 'Do Point Boosters auto-renew?',
    a: 'No. Point Boosters never auto-renew. You only pay when you choose to top up.',
  },
  {
    q: 'How do I use Points?',
    a: 'Points are used to access eligible member-only Bonus Draws and to redeem selected Gift Cards from 2,000 Points.',
  },
  {
    q: 'Can I use Points for Bonus Draws?',
    a: 'Yes. Points from Boosters are added to your UNICASH balance and can be used on eligible member-only Bonus Draws.',
  },
  {
    q: 'Does my Membership already include Points?',
    a: 'Yes. Every active Membership plan includes Monthly Points each renewal. Point Boosters are optional extras for when you want more flexibility.',
  },
  {
    q: 'Do I need a Membership to buy a Point Booster?',
    a: 'Yes. Point Boosters are a Member-only top-up. An active Membership is required at the time of purchase.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'Major cards via Stripe, plus Apple Pay, Google Pay, and PayPal where available. All payments are SSL-encrypted bank-grade checkout.',
  },
];

/* Painted radial-mesh background — matches v4 section pattern. */
function PaintedBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/15 blur-[140px]" />
      <div className="absolute right-[-12%] top-1/3 h-[360px] w-[360px] rounded-full bg-[#FFE2B0]/14 blur-[120px]" />
      <div className="absolute left-[-8%] bottom-0 h-[320px] w-[320px] rounded-full bg-[#6356E5]/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.30]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(99,86,229,0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
    </div>
  );
}

export default function BoostPacksClient() {
  const [boostPacks, setBoostPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ----- DATA FETCH (preserved) -----
  useEffect(() => {
    const fetchBoostPacks = async () => {
      try {
        const response = await api.membership.getBoostPacks();
        setBoostPacks(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchBoostPacks();
  }, []);

  // ----- HASH SCROLL (preserved) -----
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const hash = window.location.hash;
      if (hash === '#choose-boost-pack') {
        setTimeout(() => {
          const element = document.getElementById('choose-boost-pack');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [loading]);

  return (
    <>
      {/* ============================================================
          SECTION 0 — Trust band (Idea A: centered, bigger logos, soft gradient)
          Slim band between hero and Choose section.
          - Soft gradient bg blends naturally with lavender on both sides
          - 2 rows centered: payment logos (top) + trust caption (below)
          - Logos bumped to h-6 for confident "you can pay with these" signal
          - Subtle shield pulse syncs with hero motion (no longer dead-static)
      ============================================================ */}
      <section className="relative w-full border-y border-[#E7E9F2] bg-gradient-to-r from-[#FBFAFF] via-white to-[#FBFAFF]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:gap-3.5">
            {/* Row 1 — Payment logos (centered, larger, confident) */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 opacity-90 sm:gap-x-7">
              <Image src="/images/icons/payment/stripe.svg" alt="Stripe" width={80} height={48} className="h-[18px] w-auto sm:h-6" />
              <Image src="/images/icons/payment/apple-pay.svg" alt="Apple Pay" width={78} height={32} className="h-[18px] w-auto sm:h-6" />
              <Image src="/images/icons/payment/paypal.svg" alt="PayPal" width={143} height={48} className="h-[18px] w-auto sm:h-6" />
              <Image src="/images/icons/payment/master-card.svg" alt="Mastercard" width={68} height={48} className="h-[20px] w-auto sm:h-7" />
              <Image src="/images/icons/payment/visa.svg" alt="Visa" width={119} height={48} className="h-[15px] w-auto sm:h-5" />
            </div>

            {/* Row 2 — Trust caption with subtle shield pulse */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[12px] sm:text-[12.5px]">
              {['Bank-grade Stripe checkout', 'SSL-encrypted', 'No hidden fees'].map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <span aria-hidden className="text-[#cfc8e8]">·</span>}
                  <span className="inline-flex items-center gap-1.5 text-[#4B5563]">
                    {i === 0 && (
                      <span className="uc-shield-pulse inline-flex items-center justify-center">
                        <ShieldIcon className="h-3.5 w-3.5 text-[#10B981]" />
                      </span>
                    )}
                    {t}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Subtle shield breathe animation — syncs with hero motion */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes uc-shield-pulse-anim {
            0%, 100% { transform: scale(1);   opacity: 1; }
            50%      { transform: scale(1.12); opacity: 0.85; }
          }
          .uc-shield-pulse {
            animation: uc-shield-pulse-anim 3.4s ease-in-out infinite;
            will-change: transform, opacity;
          }
          @media (prefers-reduced-motion: reduce) {
            .uc-shield-pulse { animation: none !important; }
          }
        ` }} />
      </section>

      {/* ============================================================
          SECTION 1 — Choose Your Point Booster
      ============================================================ */}
      <section
        id="choose-boost-pack"
        className="relative w-full overflow-hidden bg-[#F4F1FB] scroll-mt-20"
      >
        <PaintedBackground />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          {/* Section eyebrow + heading */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] shadow-[0_2px_8px_-3px_rgba(99,86,229,0.2)] ring-1 ring-[#E0DAFF]">
              <PillDotIcon />
              Choose your top-up
            </span>
            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[36px] md:text-[44px]">
              Pick a <span className="uc-gold-gradient">Point Booster.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#4B5563] sm:text-[16px]">
              All three Boosters are one-time purchases. Pick the size that fits, and Points are added to your balance after checkout.
            </p>
          </div>

          {/* Cards grid */}
          {loading ? (
            /* Skeleton — 3-card grid mirroring final BoostPackCard layout */
            <div className="mt-12 grid grid-cols-1 items-stretch gap-6 pt-2 md:mt-14 md:grid-cols-3 md:gap-5 md:pt-6 lg:gap-6">
              {[0, 1, 2].map((i) => (
                <article key={i} className="rounded-3xl border border-[#E7E9F2] bg-white p-6 sm:p-7">
                  <div className="space-y-3">
                    <div className="h-5 w-24 animate-pulse rounded-full bg-[#F4F1FB]" />
                    <div className="h-7 w-32 animate-pulse rounded-lg bg-[#F4F1FB]" />
                    <div className="h-12 w-40 animate-pulse rounded-lg bg-[#F4F1FB]" />
                    <div className="h-4 w-44 animate-pulse rounded bg-[#F4F1FB]" />
                  </div>
                  <div className="mt-6 space-y-2.5">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-[#F4F1FB]" />
                        <div className="h-3.5 w-full animate-pulse rounded bg-[#F4F1FB]" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 items-stretch gap-6 pt-2 md:mt-14 md:grid-cols-3 md:gap-5 md:pt-6 lg:gap-6">
              {boostPacks
                .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((pack: any, index: number) => (
                  <BoostPackCard key={pack.id} pack={pack} v4Index={index} />
                ))}
            </div>
          )}

          {/* Membership reminder — only shown when packs exist */}
          {!loading && boostPacks.length > 0 && (
            <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-[#E0DAFF] bg-white/80 p-5 backdrop-blur sm:p-6 lg:mt-14">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                  <InfoIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[14.5px] font-extrabold tracking-tight text-[#0F1222]">
                    Your Membership already includes Monthly Points.
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#4B5563]">
                    Point Boosters are optional top-ups when you want extra Points for Bonus Draws — they don&rsquo;t replace your Membership benefits.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ============================================================
          SECTION 2 — How Point Boosters Work
      ============================================================ */}
      <section id="how-point-boosters-work" className="relative w-full overflow-hidden bg-[#FBFAFF] scroll-mt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[280px] w-[680px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] shadow-sm ring-1 ring-[#E0DAFF]">
              <PillDotIcon />
              How it works
            </span>
            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[36px] md:text-[44px]">
              Top up Points in <span className="uc-gold-gradient">three steps.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#4B5563] sm:text-[16px]">
              Simple, transparent, and never required. You stay in control.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
            {HOW_STEPS.map((step) => (
              <div
                key={step.n}
                className="relative overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white p-6 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F1FB] ring-1 ring-[#E0DAFF]">
                    <span className="text-[14px] font-extrabold tracking-tight text-[#6356E5]">{step.n}</span>
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-extrabold tracking-tight text-[#0F1222]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#4B5563]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3 — FAQ
      ============================================================ */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F1FB] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6356E5] ring-1 ring-[#E0DAFF]">
              <PillDotIcon />
              FAQ
            </span>
            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0F1222] sm:text-[36px] md:text-[44px]">
              Common <span className="uc-gold-gradient">questions.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#4B5563] sm:text-[16px]">
              Quick answers about Point Boosters, Points, and Membership.
            </p>
          </div>

          <div className="mx-auto mt-10 space-y-3 sm:mt-12">
            {FAQ_ITEMS.map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-[#E7E9F2] bg-white px-5 py-4 transition-shadow open:shadow-[0_8px_24px_-12px_rgba(15,18,34,0.12)] open:ring-1 open:ring-[#E0DAFF] sm:px-6 sm:py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                  <span className="text-[14.5px] font-extrabold tracking-tight text-[#0F1222] sm:text-[15.5px]">
                    {faq.q}
                  </span>
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF] transition-transform group-open:rotate-180">
                    <ChevronDownIcon className="h-3.5 w-3.5" />
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
