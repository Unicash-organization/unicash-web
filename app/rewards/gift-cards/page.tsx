import type { Metadata } from 'next';
import GiftCardsClient from './GiftCardsClient';

/**
 * FE-03 — /rewards/gift-cards server shell. CollectionPage JSON-LD for the
 * gift-card catalog; per-card detail pages can layer Product schema later.
 */
export const metadata: Metadata = {
  title: 'Gift Cards — Redeem Points on UNICASH',
  description:
    'Redeem your UNICASH Points for gift cards from leading Australian retailers. Coles, Woolworths, JB Hi-Fi, Westfield, and more.',
  alternates: { canonical: 'https://unicash.com.au/rewards/gift-cards' },
  openGraph: {
    title: 'Redeem Points for Gift Cards — UNICASH',
    description:
      'Trade your UNICASH Points for gift cards from leading Australian retailers.',
    url: 'https://unicash.com.au/rewards/gift-cards',
    siteName: 'UNICASH',
    locale: 'en_AU',
    type: 'website',
  },
};

const COLLECTION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'UNICASH Gift Card Catalog',
  url: 'https://unicash.com.au/rewards/gift-cards',
  description:
    'Gift cards from leading Australian retailers, redeemable with UNICASH Points.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'UNICASH',
    url: 'https://unicash.com.au',
  },
};

export default function GiftCardsCatalogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_SCHEMA) }}
      />
      <GiftCardsClient />
    </>
  );
}
