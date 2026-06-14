import type { Metadata } from 'next';
import AboutClient from './AboutClient';

/**
 * FE-03 — /about server shell. Metadata + Organization JSON-LD;
 * interactive content lives in <AboutClient />.
 */
export const metadata: Metadata = {
  title: 'About UNICASH — Australian Membership rewards platform',
  description:
    'UNICASH is a premium Australian Membership rewards platform — earn Points from eligible receipts, top up with Point Boosters, and access member-only Bonus Draws. Built in Perth.',
  alternates: { canonical: 'https://unicash.com.au/about' },
  openGraph: {
    title: 'About UNICASH',
    description:
      'Premium Australian Membership rewards platform built in Perth. Earn Points, redeem rewards, enter Bonus Draws.',
    url: 'https://unicash.com.au/about',
    siteName: 'UNICASH',
    locale: 'en_AU',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'UNICASH' }],
  },
};

const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About UNICASH',
  url: 'https://unicash.com.au/about',
  mainEntity: {
    '@type': 'Organization',
    name: 'UNICASH',
    legalName: 'UNICASH Pty Ltd',
    taxID: 'ABN 90 693 062 538',
    url: 'https://unicash.com.au',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '45 St Georges Terrace',
      addressLocality: 'Perth',
      addressRegion: 'WA',
      postalCode: '6000',
      addressCountry: 'AU',
    },
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_SCHEMA) }}
      />
      <AboutClient />
    </>
  );
}
