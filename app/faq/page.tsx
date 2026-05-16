import type { Metadata } from 'next';
import FAQClient from './FAQClient';

/**
 * FE-03 — /faq server shell. FAQPage JSON-LD is intentionally lean here
 * (the client renders the full Q&A list); a follow-up TICK-XXX can hoist
 * the static FAQ array into a shared module and emit the questions
 * inside the JSON-LD for rich SERP results. For launch we ship a stub
 * schema so SERP recognises the page is FAQ-shaped.
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
  },
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  url: 'https://unicash.com.au/faq',
  name: 'UNICASH FAQs',
  // mainEntity array intentionally omitted at launch — see file comment above.
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
