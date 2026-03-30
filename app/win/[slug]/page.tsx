'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import PaymentTrustStrip from '@/components/PaymentTrustStrip';
import LandingHeroPicture from '@/components/LandingHeroPicture';
import MajorDrawCheckoutModal from '@/components/MajorDrawCheckoutModal';

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

/** Rich HTML from admin (no @tailwindcss/typography — basic element styles) */
const RICH_HTML =
  'text-gray-700 text-sm sm:text-base leading-relaxed [&_a]:text-indigo-600 [&_a]:underline [&_p]:mb-3 last:[&_p]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2';

const THEME_STYLES: Record<string, string> = {
  entry: 'bg-white border-2 border-slate-200 shadow-lg text-slate-900',
  bronze: 'bg-gradient-to-b from-orange-400 to-orange-600 shadow-lg text-white',
  silver: 'bg-gradient-to-b from-slate-100 via-slate-100 to-slate-300 shadow-lg text-slate-900',
  gold: 'bg-gradient-to-b from-amber-300 to-amber-500 shadow-lg text-slate-900',
  platinum: 'bg-gradient-to-b from-indigo-600 to-purple-800 shadow-lg text-white',
};

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

export default function MajorDrawWinPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [draw, setDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPkg, setCheckoutPkg] = useState<LandingPackage | null>(null);

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

  const packages: LandingPackage[] = useMemo(() => {
    const raw = draw?.landingPackages;
    if (!raw || !Array.isArray(raw)) return [];
    return [...raw].sort(
      (a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0),
    );
  }, [draw]);

  const countdownTarget =
    draw?.closedAt != null
      ? new Date(draw.closedAt).toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString();
  const cd = useCountdown(countdownTarget);

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
    <div className="bg-slate-50 pb-12 sm:pb-16">
      {/* Countdown strip */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 text-center text-xs sm:text-sm md:text-base font-semibold tracking-wide leading-snug">
        Closes In{' '}
        <span className="font-mono tabular-nums">
          {cd.d}d : {String(cd.h).padStart(2, '0')}h : {String(cd.m).padStart(2, '0')}m :{' '}
          {String(cd.s).padStart(2, '0')}s
        </span>
      </div>

      <LandingHeroPicture
        desktopPath={draw.landingBannerImage}
        mobilePath={draw.landingBannerMobileImage}
        overlayClassName="bg-gradient-to-b from-sky-400/35 via-sky-900/25 to-slate-900/55"
        fallbackBgClassName="bg-gradient-to-b from-sky-100 to-sky-50"
      >
        <div className="inline-block max-w-[min(100%,28rem)] rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-base sm:text-xl md:text-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-xl leading-tight">
          {draw.title}
        </div>
      </LandingHeroPicture>

      {/* Packages */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="text-center mb-6 sm:mb-8 pt-3 sm:pt-4">
          <h2 className="text-slate-500 text-xs sm:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-2 sm:mb-3">
            Select a package
          </h2>
          {draw.landingPageDescription && (
            <div
              className={`max-w-3xl mx-auto text-left ${RICH_HTML}`}
              dangerouslySetInnerHTML={{ __html: draw.landingPageDescription }}
            />
          )}
        </div>

        {packages.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto mb-6 sm:mb-8">
            {packages.map((pkg) => {
              const theme = (pkg.cardTheme || 'entry').toLowerCase();
              const shell = THEME_STYLES[theme] || THEME_STYLES.entry;
              const externalUrl = pkg.ctaUrl?.trim();
              const isExternal = externalUrl?.startsWith('http');
              const btnClass = `mt-auto text-center rounded-full py-2.5 text-sm font-bold transition ${
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

        {draw.landingFullDescription && (
          <div
            className={`max-w-4xl mx-auto mb-8 px-1 ${RICH_HTML}`}
            dangerouslySetInnerHTML={{ __html: draw.landingFullDescription }}
          />
        )}

        <PaymentTrustStrip />

        <p className="text-[11px] text-gray-500 text-center max-w-3xl mx-auto leading-relaxed">
          One-time purchase. Entry credits are applied according to the package you select. See full
          terms on the main site. Major draw administered in line with published rules.
        </p>
      </section>

      {draw.landingAdditionalContent && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
          <div
            className={`max-w-none bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 ${RICH_HTML}`}
            dangerouslySetInnerHTML={{ __html: draw.landingAdditionalContent }}
          />
        </section>
      )}

      <div className="max-w-xl mx-auto text-center mt-10">
        <Link href={`/giveaways/${draw.id}`} className="text-indigo-600 text-sm font-medium hover:underline">
          View full giveaway details →
        </Link>
      </div>

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
