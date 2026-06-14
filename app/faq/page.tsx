import type { Metadata } from 'next';
import FAQClient from './FAQClient';
import { FAQ_SCHEMA_ENTRIES } from './faq-data';

/**
 * FE-03 — /faq server shell. FAQPage JSON-LD is emitted server-side with the
 * full Q&A (from FAQ_SCHEMA_ENTRIES) so Google/AI ingest it for rich results.
 */
export const metadata: Metadata = {
  title: 'FAQs — UNICASH',
  description:
    'Common questions about UNICASH Membership, Points, Point Boosters, Bonus Draws, Fuel Rewards, Scan Receipts, and Redeem Gift Cards.',
  alternates: { canonical: 'https://unicash.com.au/faq' },
  openGraph: {
    title: 'UNICASH FAQs',
    description:
      'Common questions about UNICASH Membership and rewards.',
    url: 'https://unicash.com.au/faq',
    siteName: 'UNICASH',
    locale: 'en_AU',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'UNICASH' }],
  },
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  url: 'https://unicash.com.au/faq',
  name: 'UNICASH FAQs',
  mainEntity: FAQ_SCHEMA_ENTRIES.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <FAQClient />
    </>
  );
}
