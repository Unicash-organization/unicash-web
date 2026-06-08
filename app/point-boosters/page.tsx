import type { Metadata } from 'next';
import BoostPacksPageClient from './BoostPacksClient';

/**
 * FE-03 — /point-boosters server shell. Lists 3 Point Booster packs;
 * detailed pricing schema lives in the page body (rendered by client).
 */
export const metadata: Metadata = {
  title: 'Point Boosters — UNICASH',
  description:
    'Top up your Points with Booster Spark (A$4.99), Booster Pulse (A$19.99), or Booster Surge (A$29.99). One-time purchase. Use Points for Bonus Draws and gift card redemptions.',
  alternates: { canonical: 'https://unicash.com.au/point-boosters' },
  openGraph: {
    title: 'Point Boosters — UNICASH',
    description:
      'Top up your Points. Spark A$4.99 · Pulse A$19.99 · Surge A$29.99. One-time, never expire.',
    url: 'https://unicash.com.au/point-boosters',
    siteName: 'UNICASH',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function BoostPacksPage() {
  return <BoostPacksPageClient />;
}
