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

const RICH_HTML =
  'text-gray-700 text-sm sm:text-base leading-relaxed [&_a]:text-indigo-600 [&_a]:underline [&_p]:mb-3 last:[&_p]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2';

type LandingConfig = {
  enabled?: boolean;
  urlSlug?: string;
  bannerImageUrl?: string;
  bannerImageUrlMobile?: string;
  landingPageTitle?: string;
  landingPageDescription?: string;
  landingFullDescription?: string;
  landingAdditionalContent?: string;
};

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

  const sortedPlans = useMemo(() => {
    return [...plans].sort(
      (a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0),
    );
  }, [plans]);

  const heroTitle = config?.landingPageTitle || 'Choose your membership';

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
    <div className="bg-slate-50 pb-12 sm:pb-16">
      <LandingHeroPicture
        desktopPath={config.bannerImageUrl}
        mobilePath={config.bannerImageUrlMobile}
        overlayClassName="bg-gradient-to-b from-purple-900/45 via-purple-900/35 to-slate-900/55"
        fallbackBgClassName="bg-gradient-to-b from-purple-100 via-fuchsia-50 to-white"
      >
        <div className="inline-block max-w-[min(100%,36rem)] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-extrabold text-base sm:text-xl md:text-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-xl leading-tight">
          {heroTitle}
        </div>
      </LandingHeroPicture>

      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="text-center mb-6 sm:mb-8 pt-3 sm:pt-4">
          <h2 className="text-slate-500 text-xs sm:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-2 sm:mb-3">
            {!authLoading && user ? 'Your membership' : 'Membership plans'}
          </h2>
          {config.landingPageDescription && (
            <div
              className={`max-w-3xl mx-auto text-left ${RICH_HTML}`}
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
              You&apos;re signed in. Please continue using the website as usual — browse giveaways, manage
              your membership, and explore your dashboard.
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

        {config.landingFullDescription && (
          <div
            className={`max-w-4xl mx-auto mb-8 px-1 ${RICH_HTML}`}
            dangerouslySetInnerHTML={{ __html: config.landingFullDescription }}
          />
        )}

        <PaymentTrustStrip />

        {!user && (
          <p className="text-[11px] text-gray-500 text-center max-w-3xl mx-auto leading-relaxed">
            Recurring membership billed monthly. Same checkout and account rules as the main site. Cancel
            anytime subject to your plan terms.
          </p>
        )}
      </section>

      {config.landingAdditionalContent && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
          <div
            className={`max-w-none bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 ${RICH_HTML}`}
            dangerouslySetInnerHTML={{ __html: config.landingAdditionalContent }}
          />
        </section>
      )}

      <div className="max-w-xl mx-auto text-center mt-10">
        <Link href="/" className="text-purple-600 text-sm font-medium hover:underline">
          ← Back to home
        </Link>
      </div>

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
