import type { Metadata } from 'next';
import HomeClient from './HomeClient';

/**
 * FE-03 — homepage is now a server component so Next.js can:
 *   1. Export metadata for SERP listings (title + description + OG + canonical)
 *   2. Inject JSON-LD Organization + WebSite schemas for rich results
 *   3. Stream the static HTML before JS hydrates
 *
 * All interactive logic stays inside <HomeClient /> (a client component).
 * The split is mechanical — content unchanged — and lets us layer
 * per-route metadata without rewriting the page UI.
 */
export const metadata: Metadata = {
  title: 'UNICASH — Premium Australian Membership rewards',
  description:
    'Earn Points from eligible receipts, top up with Point Boosters, and access member-only Bonus Draws. A premium Australian Membership rewards platform.',
  alternates: { canonical: 'https://unicash.com.au/' },
  openGraph: {
    title: 'UNICASH — Premium Australian Membership rewards',
    description:
      'Earn Points from eligible receipts, top up with Point Boosters, and access member-only Bonus Draws.',
    url: 'https://unicash.com.au/',
    siteName: 'UNICASH',
    locale: 'en_AU',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'UNICASH' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNICASH — Premium Australian Membership rewards',
    description:
      'Earn Points from eligible receipts, top up with Point Boosters, and access member-only Bonus Draws.',
    images: ['/og-default.png'],
  },
};

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'UNICASH',
  legalName: 'UNICASH Pty Ltd',
  url: 'https://unicash.com.au',
  logo: 'https://unicash.com.au/email-assets/logo.png',
  email: 'support@unicash.com.au',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '45 St Georges Terrace',
    addressLocality: 'Perth',
    addressRegion: 'WA',
    postalCode: '6000',
    addressCountry: 'AU',
  },
  taxID: 'ABN 90 693 062 538',
  sameAs: ['https://www.facebook.com/Unicash.au'],
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'UNICASH',
  url: 'https://unicash.com.au',
  inLanguage: 'en-AU',
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
      />
      <HomeClient />
    </>
  );
}
