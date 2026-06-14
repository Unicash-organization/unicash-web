import type { Metadata } from 'next';
import DrawDetailClient from './DrawDetailClient';

/**
 * FE-03 — /giveaways/[id] server shell.
 *
 * Per-draw metadata would ideally be `generateMetadata({ params })` that
 * fetches the draw title + image + prize → SERP. For launch we ship a
 * generic title; follow-up TICK-XXX wires the draws.findOne SSR fetch.
 */
export const metadata: Metadata = {
  title: 'Bonus Draw — UNICASH',
  description:
    'Bonus Draw details and entry on UNICASH. Use your Points to enter this member-only draw.',
  openGraph: {
    title: 'Bonus Draw — UNICASH',
    description:
      'Bonus Draw details and entry. Use your Points to enter.',
    siteName: 'UNICASH',
    locale: 'en_AU',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'UNICASH' }],
  },
};

export default function DrawDetailPage() {
  return <DrawDetailClient />;
}
