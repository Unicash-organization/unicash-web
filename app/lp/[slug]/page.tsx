'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import LandingHeroPicture from '@/components/LandingHeroPicture';
import PaymentTrustStrip from '@/components/PaymentTrustStrip';
import MembershipCard from '@/components/MembershipCard';
import MembershipLandingCheckoutModal, {
  type MembershipPlanPick,
} from '@/components/MembershipLandingCheckoutModal';
import ScrollReveal from '@/components/ScrollReveal';
import LandingPrizeSlider from '@/components/LandingPrizeSlider';
import GiveawayDetailCards from '@/components/GiveawayDetailCards';
import LandingInclusionsPanel from '@/components/LandingInclusionsPanel';

const RICH_HTML =
  'text-gray-700 text-sm sm:text-base leading-relaxed [&_a]:text-indigo-600 [&_a]:underline [&_p]:mb-3 last:[&_p]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2';

const RICH_HEADING =
  'text-transparent bg-clip-text bg-gradient-to-b from-[#9186FF] to-[#6356E5]';

const RICH_PURPLE_HEAD =
  '[&_h1]:text-transparent [&_h1]:bg-clip-text [&_h1]:bg-gradient-to-b [&_h1]:from-[#9186FF] [&_h1]:to-[#6356E5] [&_h1]:font-extrabold [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:mb-2 [&_h2]:text-transparent [&_h2]:bg-clip-text [&_h2]:bg-gradient-to-b [&_h2]:from-[#9186FF] [&_h2]:to-[#6356E5] [&_h2]:font-bold [&_h2]:text-lg sm:[&_h2]:text-xl [&_p]:text-gray-600';

type LandingConfig = {
  enabled?: boolean;
  urlSlug?: string;
  bannerImageUrl?: string;
  bannerImageUrlMobile?: string;
  landingPageTitle?: string;
  landingPageDescription?: string;
  landingCountdownLabel?: string;
  landingPackagesHeading?: string;
  landingSpotlightHeadingHtml?: string;
  landingSpotlightSliderImages?: string[] | null;
  landingSpotlightSpecsHtml?: string;
  landingSpotlightStoryHtml?: string;
  landingGiveawayFirstPrizeHtml?: string | null;
  landingGiveawayEntriesCloseAt?: string | null;
  landingGiveawayDrawAt?: string | null;
  landingGiveawayStreamFacebook?: boolean;
  landingFaqCategory?: string | null;
};

type FaqRow = { id: string; question: string; answer: string; order: number };

function parseConfigDate(raw: unknown): Date | null {
  if (raw == null || typeof raw !== 'string' || !raw.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
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

function scrollToMembershipPackages() {
  document.getElementById('membership-packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function MembershipLandingPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<MembershipPlanPick | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cfgRes, plansRes] = await Promise.all([
          api.settings.getPublicMembershipLanding(slug),
          api.membership.getPlans(),
        ]);
        if (!cancelled) {
          setConfig(cfgRes.data as LandingConfig);
          const list = Array.isArray(plansRes.data) ? plansRes.data : [];
          setPlans(list.filter((p: any) => p.isActive !== false));
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message || e?.message || 'Not found');
          setConfig(null);
          setPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const cat = config?.landingFaqCategory;
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
  }, [config?.landingFaqCategory]);

  const sortedPlans = useMemo(() => {
    return [...plans].sort(
      (a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0),
    );
  }, [plans]);

  const spotlightSliderUrls: string[] = useMemo(() => {
    const raw = config?.landingSpotlightSliderImages;
    if (!Array.isArray(raw)) return [];
    return raw.filter((u: unknown) => typeof u === 'string' && u.length > 0);
  }, [config]);

  const showSpotlightBlock = Boolean(
    config?.landingSpotlightHeadingHtml?.trim() ||
      spotlightSliderUrls.length > 0 ||
      config?.landingSpotlightSpecsHtml?.trim() ||
      config?.landingSpotlightStoryHtml?.trim(),
  );

  const heroTitle = config?.landingPageTitle || 'Choose your membership';
  const packagesHeading = (config?.landingPackagesHeading || 'SELECT YOUR PACKAGE').trim() || 'SELECT YOUR PACKAGE';

  const drawEventAt = useMemo(() => {
    if (!config) return null;
    return parseConfigDate(config.landingGiveawayDrawAt);
  }, [config]);

  const countdownTargetIso = useMemo(() => {
    if (!drawEventAt) return '';
    return drawEventAt.toISOString();
  }, [drawEventAt]);

  const cd = useCountdown(countdownTargetIso || new Date(Date.now() + 86400000).toISOString());
  const showCountdown = Boolean(countdownTargetIso);
  const countdownLabel = (config?.landingCountdownLabel || 'Draw in').trim() || 'Draw in';

  const entriesCloseAt = useMemo(() => {
    if (!config) return null;
    return parseConfigDate(config.landingGiveawayEntriesCloseAt);
  }, [config]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not available</h1>
        <p className="text-gray-600 mb-6">{error || 'This landing page is not available.'}</p>
        <Link href="/" className="text-purple-600 font-semibold hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f3ff] pb-12 sm:pb-16">
      {showCountdown && (
        <div className="bg-gradient-to-r from-[#9186FF] via-[#7c6ee8] to-[#6356E5] text-white py-2.5 sm:py-3 px-3 sm:px-4 text-center text-xs sm:text-sm md:text-base font-semibold tracking-wide leading-snug">
          {countdownLabel}{' '}
          <span className="font-mono tabular-nums">
            {cd.d}d : {String(cd.h).padStart(2, '0')}h : {String(cd.m).padStart(2, '0')}m : {String(cd.s).padStart(2, '0')}s
          </span>
        </div>
      )}

      <LandingHeroPicture
        desktopPath={config.bannerImageUrl}
        mobilePath={config.bannerImageUrlMobile}
        overlayClassName="bg-gradient-to-b from-purple-900/45 via-purple-900/35 to-slate-900/55"
        fallbackBgClassName="bg-gradient-to-b from-purple-100 via-fuchsia-50 to-white"
        sectionClassName="relative overflow-hidden px-4 sm:px-6 min-h-[400px] h-[400px] md:min-h-[800px] md:h-[800px]"
        anchorCtaToBottom
      >
        <button
          type="button"
          onClick={scrollToMembershipPackages}
          className="inline-block max-w-[min(100%,36rem)] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-extrabold text-base sm:text-xl md:text-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-xl leading-tight major-draw-cta-nudge cursor-pointer border-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/80"
        >
          {heroTitle}
        </button>
      </LandingHeroPicture>

      <section
        id="membership-packages"
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-20 bg-white pt-12 sm:pt-16 md:pt-20"
      >
        <div className="text-center mb-8 sm:mb-10">
          <h2
            className={`${RICH_HEADING} text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight mb-4 sm:mb-5 uppercase leading-tight`}
          >
            {packagesHeading}
          </h2>
          {config.landingPageDescription && (
            <div
              className={`max-w-3xl mx-auto text-center ${RICH_HTML}`}
              dangerouslySetInnerHTML={{ __html: config.landingPageDescription }}
            />
          )}
        </div>

        {authLoading ? (
          <div className="flex justify-center py-16 mb-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : user ? (
          <div className="max-w-2xl mx-auto mb-10 rounded-2xl border border-purple-200 bg-white/90 px-6 py-10 text-center shadow-md">
            <p className="text-lg sm:text-xl text-gray-900 font-semibold mb-3">
              You&apos;re already a UniCash member
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              You&apos;re signed in. Please continue using the website as usual — browse giveaways, manage your
              membership, and explore your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition"
              >
                Go to dashboard
              </Link>
              <Link
                href="/giveaways"
                className="inline-flex items-center justify-center rounded-full border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition"
              >
                Browse giveaways
              </Link>
            </div>
          </div>
        ) : sortedPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-6xl mx-auto mb-10 justify-items-stretch">
            {sortedPlans.map((plan, index) => (
              <ScrollReveal key={plan.id} delay={index * 120} className="h-full">
                <MembershipCard
                  plan={plan}
                  landingEnterMode
                  onLandingEnter={(p) => {
                    setCheckoutPlan({
                      id: p.id,
                      name: p.name,
                      priceMonthly: p.priceMonthly,
                    });
                    setCheckoutOpen(true);
                  }}
                />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-8">No membership plans available yet.</p>
        )}

        <LandingInclusionsPanel />

        <PaymentTrustStrip />
      </section>

      {showSpotlightBlock && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {config.landingSpotlightHeadingHtml?.trim() ? (
            <div
              className={`text-center max-w-4xl mx-auto mb-8 ${RICH_HTML} ${RICH_PURPLE_HEAD}`}
              dangerouslySetInnerHTML={{ __html: config.landingSpotlightHeadingHtml }}
            />
          ) : null}
          <div className="max-w-5xl mx-auto mb-10 sm:mb-12">
            {spotlightSliderUrls.length > 0 ? (
              <LandingPrizeSlider urls={spotlightSliderUrls} />
            ) : (
              <div className="rounded-2xl bg-violet-100/50 aspect-[16/10] border border-violet-100" />
            )}
          </div>
          <div
            className={`grid gap-8 lg:gap-10 items-start ${
              config.landingSpotlightSpecsHtml?.trim() && config.landingSpotlightStoryHtml?.trim()
                ? 'grid-cols-1 lg:grid-cols-3'
                : 'grid-cols-1 max-w-3xl mx-auto w-full'
            }`}
          >
            {config.landingSpotlightSpecsHtml?.trim() ? (
              <div
                className={
                  config.landingSpotlightStoryHtml?.trim() ? 'order-2 lg:order-1 lg:col-span-1' : ''
                }
              >
                <h3 className="text-violet-700 font-bold text-sm uppercase tracking-widest mb-4">FULL SPECS</h3>
                <div className={RICH_HTML} dangerouslySetInnerHTML={{ __html: config.landingSpotlightSpecsHtml }} />
              </div>
            ) : null}
            {config.landingSpotlightStoryHtml?.trim() ? (
              <div
                className={
                  config.landingSpotlightSpecsHtml?.trim() ? 'order-1 lg:order-2 lg:col-span-2' : ''
                }
              >
                <div className="card rounded-2xl border border-violet-100/90 p-6 sm:p-8 shadow-md bg-white">
                  <h3 className="text-violet-700 font-bold text-sm uppercase tracking-widest mb-4">
                    CHECK OUT THIS ABSOLUTE WEAPON
                  </h3>
                  <div
                    className={`${RICH_HTML} rich-text-content text-gray-600`}
                    dangerouslySetInnerHTML={{ __html: config.landingSpotlightStoryHtml }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="text-center mt-10 sm:mt-12">
            <button
              type="button"
              onClick={scrollToMembershipPackages}
              className="inline-block rounded-full px-10 py-3 font-bold text-white bg-gradient-to-b from-[#9186FF] to-[#6356E5] shadow-lg hover:opacity-95 transition uppercase text-sm tracking-wide border-0 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/80"
            >
              Choose your package
            </button>
          </div>
        </section>
      )}

      <GiveawayDetailCards
        firstPrizeHtml={config.landingGiveawayFirstPrizeHtml}
        entriesCloseAt={entriesCloseAt}
        drawEventAt={drawEventAt}
        showStreamFacebook={!!config.landingGiveawayStreamFacebook}
      />

      {faqs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-transparent bg-clip-text bg-gradient-to-b from-[#9186FF] to-[#6356E5] text-2xl sm:text-3xl font-extrabold mb-2">
              FAQ
            </h2>
            <p className="text-center text-gray-600 text-sm mb-8">
              Common questions about membership, draws, and your account.
            </p>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.id} className="card p-6 group rounded-xl">
                  <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center gap-3 list-none [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <svg
                      className="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div
                    className={`mt-4 rich-text-content text-gray-600 leading-relaxed ${RICH_HTML}`}
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {!user && (
        <MembershipLandingCheckoutModal
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setCheckoutPlan(null);
          }}
          plan={checkoutPlan}
          subtitle="UniCash membership"
        />
      )}
    </div>
  );
}
