import type { Metadata } from 'next';
import GiveawaysPageClient from './GiveawaysClient';

/**
 * FE-03 — /giveaways list server shell. CollectionPage JSON-LD signals to
 * SERPs that this is a directory of items, which is correct for the
 * Bonus Draws index. Per-draw schema lives on each detail page.
 */
export const metadata: Metadata = {
  title: 'Bonus Draws — UNICASH Membership rewards',
  description:
    'Browse current and upcoming Bonus Draws on UNICASH. Use your Points to enter member-only draws across Australia.',
  alternates: { canonical: 'https://unicash.com.au/giveaways' },
  openGraph: {
    title: 'Bonus Draws — UNICASH',
    description:
      'Current and upcoming Bonus Draws for UNICASH members. Use your Points to enter.',
    url: 'https://unicash.com.au/giveaways',
    siteName: 'UNICASH',
    locale: 'en_AU',
    type: 'website',
  },
};

const COLLECTION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'UNICASH Bonus Draws',
  url: 'https://unicash.com.au/giveaways',
  description:
    'Member-only Bonus Draws on UNICASH. Use Points earned through Membership and Point Boosters.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'UNICASH',
    url: 'https://unicash.com.au',
  },
};

export default function GiveawaysPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_SCHEMA) }}
      />
      <GiveawaysPageClient />
    </>
  );
}
