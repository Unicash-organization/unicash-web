'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import PaymentTrustStrip from '@/components/PaymentTrustStrip';
import LandingHeroPicture from '@/components/LandingHeroPicture';
import MajorDrawCheckoutModal from '@/components/MajorDrawCheckoutModal';
import NewsletterSection from '@/components/NewsletterSection';
import LandingPrizeSlider from '@/components/LandingPrizeSlider';
import GiveawayDetailCards from '@/components/GiveawayDetailCards';
import LandingInclusionsPanel from '@/components/LandingInclusionsPanel';
import LoadingRing from '@/components/LoadingRing';

/* ==========================================================================
   UNICASH Major Draw landing — /win/[slug]
   --------------------------------------------------------------------------
   - Visual + section structure mirrors the v4 design system
   - All API calls, checkout flow, packages logic, and Points logic are preserved
   - Pure visual / UX polish — no behavioural changes
   ========================================================================== */

type LandingPackage = {
  id?: string;
  tierName?: string;
  entryCount?: number;
  oldEntryCount?: number;
  price?: number;
  sortOrder?: number;
  cardTheme?: string;
  ctaUrl?: string;
};

const RICH_HTML =
  'text-[#4b5563] text-[14.5px] sm:text-[15.5px] leading-relaxed [&_a]:text-[#6356E5] [&_a]:underline [&_p]:mb-3 last:[&_p]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-[20px] [&_h1]:font-extrabold [&_h1]:text-[#0f1222] [&_h2]:text-[18px] [&_h2]:font-extrabold [&_h2]:text-[#0f1222] [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-[#0f1222] [&_strong]:text-[#0f1222] [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2';

const RICH_HEAD =
  '[&_h1]:text-[28px] sm:[&_h1]:text-[36px] md:[&_h1]:text-[44px] [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:leading-[1.1] [&_h1]:text-[#0f1222] [&_h1]:mb-3 [&_h2]:text-[22px] sm:[&_h2]:text-[26px] [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:leading-[1.15] [&_h2]:text-[#0f1222] [&_h2]:mb-3 [&_p]:text-[#4b5563]';

/* Card themes — keep data contract (entry/bronze/silver/gold/platinum). Only the
   gradient backgrounds were retained from the v2 polish; everything else is the
   simpler v1 layout. */
type ThemeStyle = {
  shell: string;
  label: string;
  bigNum: string;
  caption: string;
  wasText: string;
  divider: string;
  price: string;
  btn: string;
  highlight?: string;
};

const THEME_STYLES: Record<string, ThemeStyle> = {
  entry: {
    shell:
      'bg-gradient-to-b from-white to-[#F8F6FF] border border-[#E0DAFF] shadow-[0_10px_28px_-14px_rgba(99,86,229,0.22)]',
    label: 'text-[#6356E5]',
    bigNum: 'text-[#0f1222]',
    caption: 'text-[#667085]',
    wasText: 'text-[#7a8195]',
    divider: 'border-[#E7E9F2]',
    price: 'text-[#0f1222]',
    btn: 'bg-white text-[#0f1222] border border-[#E7E9F2] hover:border-[#6356E5] hover:text-[#5346D6]',
  },
  bronze: {
    shell:
      'bg-gradient-to-b from-[#FAB178] via-[#E08A3F] to-[#A85B22] text-white shadow-[0_18px_36px_-14px_rgba(168,91,34,0.55)] ring-1 ring-white/30',
    label: 'text-white/90',
    bigNum: 'text-white',
    caption: 'text-white/85',
    wasText: 'text-white/70',
    divider: 'border-white/30',
    price: 'text-white',
    btn: 'bg-white text-[#9a4f1c] hover:bg-[#FFF6EE]',
  },
  silver: {
    shell:
      'bg-gradient-to-b from-[#F8F9FC] via-[#DDE0EA] to-[#B8BECF] text-[#0f1222] shadow-[0_18px_36px_-14px_rgba(15,18,34,0.25)] ring-1 ring-white/70',
    label: 'text-[#4b5563]',
    bigNum: 'text-[#0f1222]',
    caption: 'text-[#4b5563]',
    wasText: 'text-[#667085]',
    divider: 'border-[#0f1222]/10',
    price: 'text-[#0f1222]',
    btn: 'bg-white text-[#0f1222] border border-[#E7E9F2] hover:border-[#0f1222]',
  },
  gold: {
    shell:
      'bg-gradient-to-b from-[#FFF4D5] via-[#FFC85D] to-[#D88E26] text-[#3A2A06] shadow-[0_22px_44px_-14px_rgba(196,154,44,0.7)] ring-1 ring-white/60',
    label: 'text-[#6b4d09]',
    bigNum: 'text-[#3A2A06]',
    caption: 'text-[#6b4d09]',
    wasText: 'text-[#8a6a05]',
    divider: 'border-[#3A2A06]/15',
    price: 'text-[#3A2A06]',
    btn: 'bg-[#3A2A06] text-[#FFE2B0] hover:bg-[#1a1305]',
    highlight: 'BEST VALUE',
  },
  platinum: {
    shell:
      'bg-gradient-to-b from-[#5C4FD8] via-[#3D30B8] to-[#1A1432] text-white shadow-[0_24px_44px_-14px_rgba(26,20,50,0.65)] ring-1 ring-[#A192FF]/45',
    label: 'text-[#A192FF]',
    bigNum: 'text-white',
    caption: 'text-[#cfc8e8]',
    wasText: 'text-[#A192FF]/80',
    divider: 'border-white/20',
    price: 'text-white',
    btn: 'bg-white text-[#5346D6] hover:bg-[#F4F1FB]',
    highlight: 'PREMIUM',
  },
};

function scrollToMajorDrawPackages() {
  document
    .getElementById('major-draw-packages')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function useCountdown(targetIso: string) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) {
        setT({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return t;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function pricePart(p: number) {
  return Number(p ?? 0).toFixed(Number(p) % 1 ? 2 : 0);
}

type FaqRow = { id: string; question: string; answer: string; order: number };

/* -------------------------------------------------------------------------- */
/*  Light section background — painted-mesh recipe                            */
/* -------------------------------------------------------------------------- */

function PaintedMeshBg({
  variant = 'lavender',
}: {
  variant?: 'lavender' | 'soft' | 'warm';
}) {
  const presets: Record<string, string> = {
    lavender: [
      'radial-gradient(720px 480px at 14% 16%, rgba(139,123,255,.13), transparent 62%)',
      'radial-gradient(620px 420px at 88% 12%, rgba(201,192,242,.18), transparent 60%)',
      'radial-gradient(560px 380px at 50% 100%, rgba(99,86,229,.07), transparent 62%)',
      'radial-gradient(420px 320px at 92% 78%, rgba(255,226,176,.08), transparent 60%)',
      'linear-gradient(180deg, #FBFAFF 0%, #FFFFFF 100%)',
    ].join(', '),
    soft: [
      'radial-gradient(720px 460px at 18% 18%, rgba(139,123,255,.10), transparent 62%)',
      'radial-gradient(560px 400px at 82% 8%, rgba(201,192,242,.14), transparent 62%)',
      'radial-gradient(540px 380px at 50% 100%, rgba(99,86,229,.06), transparent 62%)',
      'linear-gradient(180deg, #FFFFFF 0%, #FBFAFF 100%)',
    ].join(', '),
    warm: [
      'radial-gradient(720px 460px at 18% 18%, rgba(139,123,255,.09), transparent 62%)',
      'radial-gradient(560px 400px at 82% 8%, rgba(255,226,176,.16), transparent 62%)',
      'radial-gradient(540px 380px at 50% 100%, rgba(255,200,93,.08), transparent 62%)',
      'linear-gradient(180deg, #FFFCF6 0%, #FBFAFF 100%)',
    ].join(', '),
  };
  return (
    <>
      <div aria-hidden className="absolute inset-0" style={{ background: presets[variant] }} />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </>
  );
}

function HeroSpillTop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 sm:h-64 z-[1]"
        style={{
          background: [
            'radial-gradient(1100px 260px at 50% -30%, rgba(99,86,229,.22), transparent 72%)',
            'radial-gradient(700px 200px at 18% -22%, rgba(139,123,255,.16), transparent 70%)',
            'radial-gradient(700px 200px at 82% -22%, rgba(139,123,255,.16), transparent 70%)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px z-[2] bg-gradient-to-r from-transparent via-[#6356e5]/35 to-transparent"
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline icons                                                              */
/* -------------------------------------------------------------------------- */

const Icon = {
  ChevronDown: ({ className = '' }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Spark: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M17 4h3v2a3 3 0 0 1-3 3M7 4H4v2a3 3 0 0 0 3 3" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Eyebrow chip                                                              */
/* -------------------------------------------------------------------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#E0DAFF] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6356E5]">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356E5]" />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function MajorDrawWinPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [draw, setDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPkg, setCheckoutPkg] = useState<LandingPackage | null>(null);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  // Phase PB1 — admin iframe preview mode. When the URL carries
  // ?preview=admin&token=<jwt> we forward both to the API so the
  // backend bypasses DRAFT / disabled filters. Any other caller hits
  // the public path unchanged.
  const searchParams = useSearchParams();
  const isPreview = searchParams?.get('preview') === 'admin';
  const previewToken = searchParams?.get('token') ?? '';

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.draws.getByWinSlug(
          slug,
          isPreview && previewToken
            ? { preview: 'admin', token: previewToken }
            : undefined,
        );
        if (!cancelled) setDraw(res.data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message || e?.message || 'Not found');
          setDraw(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, isPreview, previewToken]);

  // Phase PB2 — live preview via postMessage. When the page is iframed by
  // admin (?preview=admin) we accept patches from the parent and shallow-merge
  // them into the rendered draw so admins see edits as they type, without
  // having to hit Save. Auth is already enforced upstream by the JWT in the
  // URL — postMessage only mutates client-side render state, so the risk
  // surface is limited to "what does this iframe display to the admin who
  // opened it"; even so we only accept messages when isPreview is true.
  const [livePulse, setLivePulse] = useState(false);
  useEffect(() => {
    if (!isPreview) return;
    if (typeof window === 'undefined') return;

    const onMessage = (event: MessageEvent) => {
      const data = event?.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'unicash:preview-patch') return;
      const patch = data.draw;
      if (!patch || typeof patch !== 'object') return;
      setDraw((prev: any) => (prev ? { ...prev, ...patch } : prev));
      setLivePulse(true);
      window.setTimeout(() => setLivePulse(false), 400);
    };
    window.addEventListener('message', onMessage);

    // Tell the parent we're ready to receive the first snapshot.
    try {
      window.parent?.postMessage(
        { type: 'unicash:preview-ready', slug },
        '*',
      );
    } catch {
      /* parent may be cross-origin sandboxed — that's fine */
    }
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [isPreview, slug]);

  useEffect(() => {
    const cat = draw?.landingFaqCategory;
    if (!cat || typeof cat !== 'string') {
      setFaqs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.faqs.getAll(cat);
        if (!cancelled && Array.isArray(res.data)) {
          const sorted = [...res.data].sort(
            (a: FaqRow, b: FaqRow) => (a.order ?? 0) - (b.order ?? 0),
          );
          setFaqs(sorted);
        }
      } catch {
        if (!cancelled) setFaqs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draw?.landingFaqCategory]);

  const packages: LandingPackage[] = useMemo(() => {
    const raw = draw?.landingPackages;
    if (!raw || !Array.isArray(raw)) return [];
    return [...raw].sort(
      (a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0),
    );
  }, [draw]);

  const entriesCloseAt =
    draw?.landingGiveawayEntriesCloseAt != null
      ? new Date(draw.landingGiveawayEntriesCloseAt)
      : draw?.closedAt != null
        ? new Date(draw.closedAt)
        : null;

  const countdownTarget =
    entriesCloseAt != null && !Number.isNaN(entriesCloseAt.getTime())
      ? entriesCloseAt.toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString();
  const cd = useCountdown(countdownTarget);

  const countdownLabel =
    (draw?.landingCountdownLabel || 'Closes in').trim() || 'Closes in';

  const sliderUrls: string[] = useMemo(() => {
    const raw = draw?.landingPrizeSliderImages;
    if (!Array.isArray(raw)) return [];
    return raw.filter((u: unknown) => typeof u === 'string' && u.length > 0);
  }, [draw]);

  const drawEventAt =
    draw?.landingGiveawayDrawAt != null
      ? new Date(draw.landingGiveawayDrawAt)
      : null;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingRing label="" />
      </div>
    );
  }

  if (error || !draw) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f1222] mb-2">
          Draw not found
        </h1>
        <p className="text-[#4b5563] mb-6">
          {error || 'This landing page is not available.'}
        </p>
        <Link
          href="/giveaways"
          className="inline-flex items-center justify-center rounded-full h-11 px-5 text-[15px] font-medium bg-[#6356E5] text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] hover:bg-[#5346D6] transition-all"
        >
          Back to Bonus Draws
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Phase PB1 — admin preview banner. Only renders when ?preview=admin
           is in the URL AND the backend accepted the token (we got here =
           token was valid, the page returned data). Members never see this. */}
      {isPreview && (
        <div className="border-y border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900 sm:px-6">
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] uppercase tracking-widest">
              Admin preview
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={
                  livePulse
                    ? 'inline-block h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500'
                    : 'inline-block h-1.5 w-1.5 rounded-full bg-emerald-500'
                }
              />
              Live
            </span>
            <span>
              Not visible to members · state:{' '}
              <strong className="font-mono">{draw.state}</strong> · enabled:{' '}
              <strong className="font-mono">
                {String(draw.landingPageEnabled)}
              </strong>
            </span>
          </span>
        </div>
      )}

      {/* ========================================================================
           Top countdown bar — purple stage + gold accent (UNICASH canonical)
         ======================================================================== */}
      <div
        className="relative overflow-hidden text-white py-2.5 sm:py-3 px-3 sm:px-6 text-center"
        style={{
          background:
            'linear-gradient(90deg, #4538B8 0%, #5C4FD8 36%, #6E60E8 70%, #7867EC 100%)',
        }}
      >
        {/* Soft gold center bloom — adds warmth without urgency */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 w-3/4 mx-auto blur-3xl bg-[#FFC85D]/15"
        />
        {/* Bottom hairline glow for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#FFC85D]/30 to-transparent"
        />

        <div className="relative inline-flex items-center gap-2.5 sm:gap-3.5 text-[12.5px] sm:text-[14px] md:text-[15px] leading-none">
          {/* Live pulse dot */}
          <span
            aria-hidden
            className="inline-flex h-1.5 w-1.5 rounded-full bg-[#FFC85D] shadow-[0_0_10px_rgba(255,200,93,0.7)] animate-pulse"
          />

          {/* Label — full on desktop, compact on mobile. Bumped to extrabold
              tracked so it sits with the same visual weight as the digits
              and doesn't recede into the gradient background. */}
          <span className="hidden sm:inline font-extrabold uppercase tracking-[0.18em] text-white">
            {countdownLabel}
          </span>
          <span className="sm:hidden font-extrabold uppercase tracking-[0.14em] text-white">
            Ends in
          </span>

          {/* Time — gold digits inline, no pill. Dropped font-mono because
              the system mono fallback rendered visibly thinner than the
              sans extrabold; default sans + tabular-nums gives heavier
              glyphs and still keeps columns aligned. */}
          <span className="inline-flex items-baseline gap-2 sm:gap-3 tabular-nums text-[16px] sm:text-[18px] md:text-[20px]">
            <span className="inline-flex items-baseline">
              <span className="text-[#FFE2B0] font-extrabold tracking-tight">{cd.d}</span>
              <span className="text-[#FFE2B0] ml-0.5 text-[11px] sm:text-[12px] font-extrabold">D</span>
            </span>
            <span aria-hidden className="text-white/40 text-[13px] font-bold">·</span>
            <span className="inline-flex items-baseline">
              <span className="text-[#FFE2B0] font-extrabold tracking-tight">{pad2(cd.h)}</span>
              <span className="text-[#FFE2B0] ml-0.5 text-[11px] sm:text-[12px] font-extrabold">H</span>
            </span>
            <span aria-hidden className="text-white/40 text-[13px] font-bold">·</span>
            <span className="inline-flex items-baseline">
              <span className="text-[#FFE2B0] font-extrabold tracking-tight">{pad2(cd.m)}</span>
              <span className="text-[#FFE2B0] ml-0.5 text-[11px] sm:text-[12px] font-extrabold">M</span>
            </span>
            <span aria-hidden className="text-white/40 text-[13px] font-bold">·</span>
            <span className="inline-flex items-baseline">
              <span className="text-[#FFE2B0] font-extrabold tracking-tight">{pad2(cd.s)}</span>
              <span className="text-[#FFE2B0] ml-0.5 text-[11px] sm:text-[12px] font-extrabold">S</span>
            </span>
          </span>
        </div>
      </div>

      {/* ========================================================================
           Hero — image with brand-aligned floating CTA
         ======================================================================== */}
      <LandingHeroPicture
        desktopPath={draw.landingBannerImage}
        mobilePath={draw.landingBannerMobileImage}
        overlayClassName="bg-gradient-to-b from-[#1A1432]/30 via-[#1A1432]/15 to-[#1A1432]/55"
        fallbackBgClassName="bg-gradient-to-b from-[#5C4FD8] via-[#4538B8] to-[#1A1432]"
        sectionClassName="relative overflow-hidden px-4 sm:px-6 min-h-[440px] h-[440px] sm:min-h-[560px] sm:h-[560px] md:min-h-[760px] md:h-[760px]"
        anchorCtaToBottom
        ctaBottomClassName="pb-[28px] sm:pb-[44px] md:pb-[64px]"
      >
        <button
          type="button"
          onClick={scrollToMajorDrawPackages}
          className="major-draw-cta-nudge flex items-center justify-center gap-2.5 rounded-full px-6 sm:px-12 py-3.5 sm:py-4 w-[calc(100%-1rem)] max-w-[18rem] sm:max-w-[34rem] md:max-w-[40rem] text-[#3A2A06] font-extrabold text-base sm:text-lg md:text-xl tracking-tight leading-tight shadow-[0_18px_36px_-14px_rgba(196,154,44,0.6),0_0_0_4px_rgba(255,255,255,0.18)] cursor-pointer border-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFC85D]/70"
          style={{
            background:
              'linear-gradient(180deg, #FFE2B0 0%, #FFC85D 55%, #E0992E 100%)',
          }}
        >
          <Icon.Trophy className="w-5 h-5 sm:w-6 sm:h-6 -ml-1" />
          <span>
            {(typeof draw.landingHeroButtonLabel === 'string' &&
            draw.landingHeroButtonLabel.trim()
              ? draw.landingHeroButtonLabel.trim()
              : draw.title) || 'Enter Bonus Draw'}
          </span>
        </button>
      </LandingHeroPicture>

      {/* ========================================================================
           Package selector
         ======================================================================== */}
      <section
        id="major-draw-packages"
        className="relative overflow-hidden pt-14 sm:pt-20 md:pt-24 pb-10 sm:pb-14"
      >
        <PaintedMeshBg variant="soft" />
        <HeroSpillTop />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Eyebrow>Choose your entry pack</Eyebrow>
            <h2 className="mt-3 text-[28px] sm:text-[40px] md:text-[48px] font-extrabold tracking-tight leading-[1.05] text-[#0f1222]">
              Select a <span className="uc-gold-gradient">Package</span>
            </h2>
            {draw.landingPageDescription && (
              <div
                className={`mt-4 max-w-2xl mx-auto ${RICH_HTML}`}
                dangerouslySetInnerHTML={{ __html: draw.landingPageDescription }}
              />
            )}
          </div>

          {packages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 max-w-6xl mx-auto [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
              {packages.map((pkg) => {
                const theme = (pkg.cardTheme || 'entry').toLowerCase();
                const t = THEME_STYLES[theme] || THEME_STYLES.entry;
                const externalUrl = pkg.ctaUrl?.trim();
                const isExternal = externalUrl?.startsWith('http');
                const ctaClass = `uc-lift-sm mt-auto inline-flex items-center justify-center rounded-full h-11 px-5 text-[13.5px] font-bold uppercase tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 ${t.btn}`;
                return (
                  <div
                    key={pkg.id || pkg.tierName}
                    className={`uc-lift group relative rounded-2xl p-4 sm:p-5 min-h-[280px] sm:min-h-[300px] flex flex-col items-stretch ${t.shell}`}
                  >
                    {t.highlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 rounded-full bg-[#3A2A06] text-[#FFE2B0] text-[10px] font-extrabold tracking-[0.18em] uppercase px-2.5 py-1 shadow-md whitespace-nowrap">
                        {t.highlight}
                      </span>
                    )}

                    <p
                      className={`text-[10.5px] font-bold uppercase tracking-[0.16em] text-center mb-2 ${t.label}`}
                    >
                      {pkg.tierName}
                    </p>
                    <p
                      className={`text-[40px] sm:text-[44px] font-black text-center leading-none mb-1.5 tracking-[-0.02em] transition-transform duration-300 group-hover:scale-[1.04] ${t.bigNum}`}
                    >
                      {pkg.entryCount ?? 0}
                    </p>
                    <p
                      className={`text-[10.5px] font-semibold uppercase tracking-wide text-center mb-1 ${t.caption}`}
                    >
                      Free entries
                    </p>
                    <p
                      className={`text-[11px] text-center font-medium mb-3 min-h-[1.25rem] line-through ${t.wasText}`}
                    >
                      {pkg.oldEntryCount != null && pkg.oldEntryCount > 0
                        ? `Was ${pkg.oldEntryCount} ${
                            pkg.oldEntryCount === 1 ? 'entry' : 'entries'
                          }`
                        : ' '}
                    </p>
                    <div className={`border-t my-2 ${t.divider}`} />
                    <p
                      className={`text-[26px] font-extrabold text-center mb-4 tracking-tight tabular-nums ${t.price}`}
                    >
                      ${pricePart(pkg.price ?? 0)}
                    </p>
                    {isExternal && externalUrl ? (
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={ctaClass}
                      >
                        Enter now
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={ctaClass}
                        onClick={() => {
                          setCheckoutPkg(
                            JSON.parse(JSON.stringify(pkg)) as LandingPackage,
                          );
                          setCheckoutOpen(true);
                        }}
                      >
                        Enter now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-lg mx-auto rounded-2xl border border-[#E0DAFF] bg-[#FBFAFF] p-8 text-center">
              <p className="text-[#0f1222] font-semibold mb-1">
                Packages coming soon
              </p>
              <p className="text-sm text-[#667085]">
                Entry packs for this Bonus Draw will be announced shortly.
              </p>
            </div>
          )}

          <div className="mt-8 sm:mt-10">
            <LandingInclusionsPanel />
          </div>

          <div className="mt-6 sm:mt-8">
            <PaymentTrustStrip />
          </div>
        </div>
      </section>

      {/* ========================================================================
           Prize / specs / additional content
         ======================================================================== */}
      {(draw.landingPrizeHeadingHtml ||
        sliderUrls.length > 0 ||
        draw.landingFullDescription ||
        draw.landingAdditionalContent) && (
        <section className="relative overflow-hidden py-14 sm:py-20">
          <PaintedMeshBg variant="lavender" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
              {draw.landingPrizeHeadingHtml ? (
                <div
                  className={`max-w-3xl mx-auto ${RICH_HTML} ${RICH_HEAD}`}
                  dangerouslySetInnerHTML={{
                    __html: draw.landingPrizeHeadingHtml,
                  }}
                />
              ) : (
                <>
                  <Eyebrow>Prize Showcase</Eyebrow>
                  <h2 className="mt-3 text-[28px] sm:text-[36px] md:text-[44px] font-extrabold tracking-tight leading-[1.1] text-[#0f1222]">
                    The full <span className="uc-gold-gradient">prize</span>
                  </h2>
                </>
              )}
            </div>

            <div className="max-w-5xl mx-auto mb-10 sm:mb-14">
              {sliderUrls.length > 0 ? (
                <LandingPrizeSlider urls={sliderUrls} />
              ) : (
                <div className="rounded-3xl bg-[#F4F1FB] aspect-[16/10] border border-[#E0DAFF]" />
              )}
            </div>

            <div
              className={`grid gap-6 lg:gap-8 items-start ${
                draw.landingFullDescription && draw.landingAdditionalContent
                  ? 'grid-cols-1 lg:grid-cols-3'
                  : 'grid-cols-1 max-w-3xl mx-auto w-full'
              }`}
            >
              {draw.landingFullDescription ? (
                <div
                  className={
                    draw.landingAdditionalContent
                      ? 'order-2 lg:order-1 lg:col-span-1'
                      : ''
                  }
                >
                  <div className="rounded-3xl border border-[#E0DAFF] bg-white/90 backdrop-blur-[2px] p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(99,86,229,0.25)]">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6356E5] mb-4">
                      Full specs
                    </h3>
                    <div
                      className={RICH_HTML}
                      dangerouslySetInnerHTML={{
                        __html: draw.landingFullDescription,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {draw.landingAdditionalContent ? (
                <div
                  className={
                    draw.landingFullDescription
                      ? 'order-1 lg:order-2 lg:col-span-2'
                      : ''
                  }
                >
                  <div className="rounded-3xl border border-[#E0DAFF] bg-white p-6 sm:p-8 shadow-[0_14px_36px_-18px_rgba(99,86,229,0.3)]">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6356E5] mb-4">
                      Why you&rsquo;ll love it
                    </h3>
                    <div
                      className={`${RICH_HTML} ${RICH_HEAD}`}
                      dangerouslySetInnerHTML={{
                        __html: draw.landingAdditionalContent,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="text-center mt-12 sm:mt-14">
              <button
                type="button"
                onClick={scrollToMajorDrawPackages}
                className="uc-lift-sm inline-flex items-center justify-center gap-2 rounded-full h-12 px-7 text-[15px] font-semibold text-white bg-[#6356E5] hover:bg-[#5346D6] shadow-[0_14px_28px_-12px_rgba(99,86,229,0.6)] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6356E5]/40"
              >
                Enter Bonus Draw
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================
           Giveaway detail cards
         ======================================================================== */}
      <GiveawayDetailCards
        firstPrizeHtml={draw.landingGiveawayFirstPrizeHtml}
        entriesCloseAt={entriesCloseAt}
        drawEventAt={drawEventAt}
        showStreamFacebook={!!draw.landingGiveawayStreamFacebook}
      />

      {/* ========================================================================
           FAQ
         ======================================================================== */}
      {faqs.length > 0 && (
        <section className="relative overflow-hidden py-16 sm:py-20">
          <PaintedMeshBg variant="lavender" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <Eyebrow>Frequently asked</Eyebrow>
              <h2 className="mt-3 text-[28px] sm:text-[36px] md:text-[44px] font-extrabold tracking-tight leading-[1.1] text-[#0f1222]">
                Bonus Draw <span className="uc-gold-gradient">FAQ</span>
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15px] text-[#4b5563]">
                How entries, Membership, and Bonus Draws work — answered.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="group rounded-2xl border border-[#E0DAFF] bg-white p-5 sm:p-6 shadow-[0_6px_18px_-12px_rgba(99,86,229,0.18)] open:shadow-[0_10px_28px_-14px_rgba(99,86,229,0.28)] transition-shadow"
                >
                  <summary className="cursor-pointer flex justify-between items-center gap-3 list-none [&::-webkit-details-marker]:hidden">
                    <span className="font-extrabold tracking-tight text-[16px] sm:text-[17px] text-[#0f1222]">
                      {faq.question}
                    </span>
                    <span className="shrink-0 inline-flex w-8 h-8 items-center justify-center rounded-full border border-[#E0DAFF] bg-[#FBFAFF] text-[#6356E5] group-open:bg-[#6356E5] group-open:text-white group-open:border-transparent transition-colors">
                      <Icon.ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </span>
                  </summary>
                  <div
                    className={`mt-4 ${RICH_HTML}`}
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterSection />

      <MajorDrawCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setCheckoutPkg(null);
        }}
        drawId={draw.id}
        drawTitle={draw.title}
        packageSnapshot={checkoutPkg}
      />
    </div>
  );
}
