'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import PaymentTrustStrip from '@/components/PaymentTrustStrip';
import LandingHeroPicture from '@/components/LandingHeroPicture';
import MajorDrawCheckoutModal from '@/components/MajorDrawCheckoutModal';
import NewsletterSection from '@/components/NewsletterSection';
import LandingPrizeSlider from '@/components/LandingPrizeSlider';
import GiveawayDetailCards from '@/components/GiveawayDetailCards';
import LandingInclusionsPanel from '@/components/LandingInclusionsPanel';

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
  'text-gray-700 text-sm sm:text-base leading-relaxed [&_a]:text-indigo-600 [&_a]:underline [&_p]:mb-3 last:[&_p]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2';

const RICH_PURPLE_HEAD =
  '[&_h1]:text-transparent [&_h1]:bg-clip-text [&_h1]:bg-gradient-to-b [&_h1]:from-[#9186FF] [&_h1]:to-[#6356E5] [&_h1]:font-extrabold [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:mb-2 [&_h2]:text-transparent [&_h2]:bg-clip-text [&_h2]:bg-gradient-to-b [&_h2]:from-[#9186FF] [&_h2]:to-[#6356E5] [&_h2]:font-bold [&_h2]:text-lg sm:[&_h2]:text-xl [&_p]:text-gray-600';

const THEME_STYLES: Record<string, string> = {
  entry: 'bg-white border-2 border-slate-200 shadow-lg text-slate-900',
  bronze: 'bg-gradient-to-b from-orange-400 to-orange-600 shadow-lg text-white',
  silver: 'bg-gradient-to-b from-slate-100 via-slate-100 to-slate-300 shadow-lg text-slate-900',
  gold: 'bg-gradient-to-b from-amber-300 to-amber-500 shadow-lg text-slate-900',
  platinum: 'bg-gradient-to-b from-indigo-600 to-purple-800 shadow-lg text-white',
};

function scrollToMajorDrawPackages() {
  document.getElementById('major-draw-packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

type FaqRow = { id: string; question: string; answer: string; order: number };

export default function MajorDrawWinPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [draw, setDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPkg, setCheckoutPkg] = useState<LandingPackage | null>(null);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.draws.getByWinSlug(slug);
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
  }, [slug]);

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

  const countdownLabel = (draw?.landingCountdownLabel || 'Closes in').trim() || 'Closes in';

  const sliderUrls: string[] = useMemo(() => {
    const raw = draw?.landingPrizeSliderImages;
    if (!Array.isArray(raw)) return [];
    return raw.filter((u: unknown) => typeof u === 'string' && u.length > 0);
  }, [draw]);

  const drawEventAt =
    draw?.landingGiveawayDrawAt != null ? new Date(draw.landingGiveawayDrawAt) : null;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !draw) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Draw not found</h1>
        <p className="text-gray-600 mb-6">{error || 'This landing page is not available.'}</p>
        <Link href="/giveaways" className="text-indigo-600 font-semibold hover:underline">
          Back to giveaways
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f3ff] pb-0">
      <div className="bg-gradient-to-r from-[#9186FF] via-[#7c6ee8] to-[#6356E5] text-white py-2.5 sm:py-3 px-3 sm:px-4 text-center text-xs sm:text-sm md:text-base font-semibold tracking-wide leading-snug">
        {countdownLabel}{' '}
        <span className="font-mono tabular-nums">
          {cd.d}d : {String(cd.h).padStart(2, '0')}h : {String(cd.m).padStart(2, '0')}m :{' '}
          {String(cd.s).padStart(2, '0')}s
        </span>
      </div>

      <LandingHeroPicture
        desktopPath={draw.landingBannerImage}
        mobilePath={draw.landingBannerMobileImage}
        overlayClassName="bg-gradient-to-b from-violet-400/25 via-violet-900/20 to-slate-900/50"
        fallbackBgClassName="bg-gradient-to-b from-violet-100 to-violet-50"
        sectionClassName="relative overflow-hidden px-4 sm:px-6 min-h-[400px] h-[400px] md:min-h-[800px] md:h-[800px]"
        anchorCtaToBottom
      >
        <button
          type="button"
          onClick={scrollToMajorDrawPackages}
          className="inline-block max-w-[min(100%,28rem)] rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-base sm:text-xl md:text-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-xl leading-tight major-draw-cta-nudge cursor-pointer border-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
        >
          {(typeof draw.landingHeroButtonLabel === 'string' && draw.landingHeroButtonLabel.trim()
            ? draw.landingHeroButtonLabel.trim()
            : draw.title) || 'Enter now'}
        </button>
      </LandingHeroPicture>

      <section
        id="major-draw-packages"
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-20 bg-white pt-12 sm:pt-16 md:pt-20 pb-2"
      >
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-transparent bg-clip-text bg-gradient-to-b from-[#9186FF] to-[#6356E5] text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight mb-4 sm:mb-5 uppercase leading-tight">
            SELECT A PACKAGE
          </h2>
          {draw.landingPageDescription && (
            <div
              className={`max-w-3xl mx-auto text-center ${RICH_HTML}`}
              dangerouslySetInnerHTML={{ __html: draw.landingPageDescription }}
            />
          )}
        </div>

        {packages.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto mb-4 sm:mb-6">
            {packages.map((pkg) => {
              const theme = (pkg.cardTheme || 'entry').toLowerCase();
              const shell = THEME_STYLES[theme] || THEME_STYLES.entry;
              const externalUrl = pkg.ctaUrl?.trim();
              const isExternal = externalUrl?.startsWith('http');
              const btnClass = `mt-auto text-center rounded-full py-2.5 text-sm font-bold transition uppercase tracking-wide ${
                theme === 'entry'
                  ? 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                  : 'bg-white text-blue-700 hover:bg-blue-50'
              }`;
              return (
                <div
                  key={pkg.id || pkg.tierName}
                  className={`group relative w-full max-w-[min(100%,220px)] sm:max-w-[200px] rounded-2xl p-4 sm:p-5 min-h-[260px] sm:min-h-[280px] flex flex-col items-stretch transition-all duration-300 ease-out hover:scale-[1.02] sm:hover:scale-105 hover:shadow-2xl hover:-translate-y-1 ${shell}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90 text-center mb-2">
                    {pkg.tierName}
                  </p>
                  <p className="text-4xl font-black text-center leading-none mb-1 transition-transform duration-300 group-hover:scale-110">
                    {pkg.entryCount ?? 0}
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase text-center opacity-90 mb-1">
                    Free entries
                  </p>
                  <p className="text-[11px] text-center text-blue-700 font-medium mb-3 min-h-[1.25rem]">
                    {pkg.oldEntryCount != null && pkg.oldEntryCount > 0
                      ? `Was ${pkg.oldEntryCount} entry${pkg.oldEntryCount === 1 ? '' : 'ies'}`
                      : '\u00a0'}
                  </p>
                  <div className="border-t border-white/30 border-slate-300/50 my-2" />
                  <p className="text-2xl font-bold text-center mb-4">
                    ${Number(pkg.price ?? 0).toFixed(Number(pkg.price) % 1 ? 2 : 0)}
                  </p>
                  {isExternal && externalUrl ? (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={btnClass}
                    >
                      Enter now
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={btnClass}
                      onClick={() => {
                        setCheckoutPkg(JSON.parse(JSON.stringify(pkg)) as LandingPackage);
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
          <p className="text-center text-gray-500 mb-8">Packages will be announced soon.</p>
        )}

        <LandingInclusionsPanel />

        <PaymentTrustStrip />
      </section>

      {(draw.landingPrizeHeadingHtml || sliderUrls.length > 0 || draw.landingFullDescription || draw.landingAdditionalContent) && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {draw.landingPrizeHeadingHtml && (
            <div
              className={`text-center max-w-4xl mx-auto mb-8 ${RICH_HTML} ${RICH_PURPLE_HEAD}`}
              dangerouslySetInnerHTML={{ __html: draw.landingPrizeHeadingHtml }}
            />
          )}
          <div className="max-w-5xl mx-auto mb-10 sm:mb-12">
            {sliderUrls.length > 0 ? (
              <LandingPrizeSlider urls={sliderUrls} />
            ) : (
              <div className="rounded-2xl bg-violet-100/50 aspect-[16/10] border border-violet-100" />
            )}
          </div>
          <div
            className={`grid gap-8 lg:gap-10 items-start ${
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
                <h3 className="text-violet-700 font-bold text-sm uppercase tracking-widest mb-4">FULL SPECS</h3>
                <div className={`${RICH_HTML}`} dangerouslySetInnerHTML={{ __html: draw.landingFullDescription }} />
              </div>
            ) : null}
            {draw.landingAdditionalContent ? (
              <div
                className={
                  draw.landingFullDescription ? 'order-1 lg:order-2 lg:col-span-2' : ''
                }
              >
                <div className="card rounded-2xl border border-violet-100/90 p-6 sm:p-8 shadow-md bg-white">
                  <h3 className="text-violet-700 font-bold text-sm uppercase tracking-widest mb-4">
                    CHECK OUT THIS ABSOLUTE WEAPON
                  </h3>
                  <div
                    className={`${RICH_HTML} rich-text-content text-gray-600`}
                    dangerouslySetInnerHTML={{ __html: draw.landingAdditionalContent }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="text-center mt-10 sm:mt-12">
            <button
              type="button"
              onClick={scrollToMajorDrawPackages}
              className="inline-block rounded-full px-10 py-3 font-bold text-white bg-gradient-to-b from-[#9186FF] to-[#6356E5] shadow-lg hover:opacity-95 transition uppercase text-sm tracking-wide border-0 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/80"
            >
              Enter now
            </button>
          </div>
        </section>
      )}

      <GiveawayDetailCards
        firstPrizeHtml={draw.landingGiveawayFirstPrizeHtml}
        entriesCloseAt={entriesCloseAt}
        drawEventAt={drawEventAt}
        showStreamFacebook={!!draw.landingGiveawayStreamFacebook}
      />

      {faqs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-transparent bg-clip-text bg-gradient-to-b from-[#9186FF] to-[#6356E5] text-2xl sm:text-3xl font-extrabold mb-2">
              FAQ
            </h2>
            <p className="text-center text-gray-600 text-sm mb-8">
              Choose a plan, get monthly credits, and unlock every member draw.
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
