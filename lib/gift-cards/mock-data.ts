/**
 * UNICASH Redeem Gift Cards — shared mock data.
 *
 * Realistic AU brands, denominations priced at A$1 = 100 Points by
 * default (with periodic margin shifts on premium tiers). Used by
 * every gift card route during the mock phase. Replace with API
 * calls once the backend lands.
 */

import type {
  Brand,
  LedgerEntry,
  MemberBalance,
  ProviderHealth,
  Redemption,
  ActivityLogEntry,
} from './types';

const today = new Date('2026-05-11T09:00:00Z');
const isoMinus = (mins: number) =>
  new Date(today.getTime() - mins * 60_000).toISOString();
const isoPlus = (days: number) =>
  new Date(today.getTime() + days * 86_400_000).toISOString();

/* ──────────────────────────────────────────────────────────────────
   Member balance — current logged-in user's stats.
   ────────────────────────────────────────────────────────────────── */
export const MOCK_MEMBER_BALANCE: MemberBalance = {
  pointsAvailable: 84200,
  pointsHeld: 0,
  fuelRewardsAud: 412,
  isMember: true,
};

/* ──────────────────────────────────────────────────────────────────
   Brand catalog
   ────────────────────────────────────────────────────────────────── */
export const MOCK_BRANDS: Brand[] = [
  {
    id: 'GC-COLES',
    name: 'Coles',
    category: 'Groceries',
    logoUrl: '/gift-cards/coles.svg',
    heroColor: '#E01E22',
    description:
      'Use your Coles gift card at any Coles, Coles Express, Liquorland, First Choice, Vintage Cellars, and Coles Online checkout.',
    terms:
      'Codes are valid for 3 years from issue date. Non-refundable once revealed. Cannot be exchanged for cash. Lost or stolen codes are not replaceable.',
    faq: [
      { q: 'How quickly do I receive my code?', a: 'Instantly — usually within 10 seconds of confirming.' },
      { q: 'Can I use the code in-store?', a: 'Yes — show the barcode in the Coles app or at the register.' },
      { q: 'What if I lose my code?', a: 'View it any time in Redemption history. Treat the code like cash.' },
    ],
    deliveryType: 'instant',
    memberOnly: false,
    featured: true,
    status: 'live',
    providerId: 'prezzee',
    popularity30d: 412,
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-05-04T03:12:00Z',
    denominations: [
      { id: 'DEN-COLES-10', valueAud: 10, pointsRequired: 1000, providerCostAud: 9.4, stockLevel: 'in_stock', capPerMemberPerMonth: 10, active: true, providerSku: 'PRZ-COLES-010' },
      { id: 'DEN-COLES-25', valueAud: 25, pointsRequired: 2500, providerCostAud: 23.5, stockLevel: 'in_stock', capPerMemberPerMonth: 6, active: true, providerSku: 'PRZ-COLES-025' },
      { id: 'DEN-COLES-50', valueAud: 50, pointsRequired: 5000, providerCostAud: 47, stockLevel: 'in_stock', capPerMemberPerMonth: 4, active: true, providerSku: 'PRZ-COLES-050' },
      { id: 'DEN-COLES-100', valueAud: 100, pointsRequired: 10000, providerCostAud: 94, stockLevel: 'low', capPerMemberPerMonth: 2, active: true, providerSku: 'PRZ-COLES-100' },
    ],
  },
  {
    id: 'GC-WOOLIES',
    name: 'Woolworths',
    category: 'Groceries',
    logoUrl: '/gift-cards/woolworths.svg',
    heroColor: '#178841',
    description:
      'Spend at Woolworths Supermarkets, Big W, BWS, Caltex Woolworths, and Woolworths Online.',
    terms: 'Valid for 3 years. Treat like cash. Non-refundable once revealed.',
    faq: [
      { q: 'Where can I use it?', a: 'Any Woolworths, Big W, BWS, or Caltex Woolworths location across Australia.' },
      { q: 'Can I split across multiple visits?', a: 'Yes — the balance is stored on the digital card.' },
    ],
    deliveryType: 'instant',
    memberOnly: false,
    featured: true,
    status: 'live',
    providerId: 'prezzee',
    popularity30d: 389,
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-05-04T03:12:00Z',
    denominations: [
      { id: 'DEN-WOOL-10', valueAud: 10, pointsRequired: 1000, providerCostAud: 9.4, stockLevel: 'in_stock', capPerMemberPerMonth: 10, active: true, providerSku: 'PRZ-WOOL-010' },
      { id: 'DEN-WOOL-25', valueAud: 25, pointsRequired: 2500, providerCostAud: 23.5, stockLevel: 'in_stock', capPerMemberPerMonth: 6, active: true, providerSku: 'PRZ-WOOL-025' },
      { id: 'DEN-WOOL-50', valueAud: 50, pointsRequired: 5000, providerCostAud: 47, stockLevel: 'in_stock', capPerMemberPerMonth: 4, active: true, providerSku: 'PRZ-WOOL-050' },
      { id: 'DEN-WOOL-100', valueAud: 100, pointsRequired: 10000, providerCostAud: 94, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true, providerSku: 'PRZ-WOOL-100' },
    ],
  },
  {
    id: 'GC-BP',
    name: 'BP',
    category: 'Fuel',
    logoUrl: '/gift-cards/bp.svg',
    heroColor: '#006F51',
    description: 'Fuel up at any BP service station in Australia, including BPme purchases.',
    terms: 'Valid for 2 years. Non-refundable. Treat like cash.',
    faq: [
      { q: 'Can I use it for fuel and shop?', a: 'Yes — at any BP outlet on fuel, snacks, or car care.' },
    ],
    deliveryType: 'instant',
    memberOnly: false,
    featured: true,
    status: 'live',
    providerId: 'prezzee',
    popularity30d: 271,
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2026-05-04T03:12:00Z',
    denominations: [
      { id: 'DEN-BP-25', valueAud: 25, pointsRequired: 2500, providerCostAud: 23.8, stockLevel: 'in_stock', capPerMemberPerMonth: 4, active: true, providerSku: 'PRZ-BP-025' },
      { id: 'DEN-BP-50', valueAud: 50, pointsRequired: 5000, providerCostAud: 47.5, stockLevel: 'in_stock', capPerMemberPerMonth: 4, active: true, providerSku: 'PRZ-BP-050' },
      { id: 'DEN-BP-100', valueAud: 100, pointsRequired: 10000, providerCostAud: 95, stockLevel: 'low', capPerMemberPerMonth: 2, active: true, providerSku: 'PRZ-BP-100' },
    ],
  },
  {
    id: 'GC-JBHIFI',
    name: 'JB Hi-Fi',
    category: 'Tech',
    logoUrl: '/gift-cards/jbhifi.svg',
    heroColor: '#FFE600',
    description: 'Tech, entertainment, and home appliances at JB Hi-Fi stores and JBhifi.com.au.',
    terms: 'Valid for 3 years. Treat like cash.',
    faq: [
      { q: 'Can I use it online?', a: 'Yes — apply the code at checkout on JBhifi.com.au.' },
    ],
    deliveryType: 'instant',
    memberOnly: false,
    featured: false,
    status: 'live',
    providerId: 'prezzee',
    popularity30d: 142,
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-05-04T03:12:00Z',
    denominations: [
      { id: 'DEN-JB-50', valueAud: 50, pointsRequired: 5000, providerCostAud: 47, stockLevel: 'in_stock', capPerMemberPerMonth: 4, active: true, providerSku: 'PRZ-JB-050' },
      { id: 'DEN-JB-100', valueAud: 100, pointsRequired: 10000, providerCostAud: 94, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true, providerSku: 'PRZ-JB-100' },
      { id: 'DEN-JB-250', valueAud: 250, pointsRequired: 25000, providerCostAud: 235, stockLevel: 'in_stock', capPerMemberPerMonth: 1, active: true, providerSku: 'PRZ-JB-250' },
    ],
  },
  {
    id: 'GC-BUNNINGS',
    name: 'Bunnings',
    category: 'Lifestyle',
    logoUrl: '/gift-cards/bunnings.svg',
    heroColor: '#0F7B3B',
    description: 'Tools, hardware, garden and home improvement at Bunnings stores Australia-wide.',
    terms: 'Valid for 3 years. Treat like cash.',
    faq: [],
    deliveryType: 'instant',
    memberOnly: false,
    featured: false,
    status: 'live',
    providerId: 'prezzee',
    popularity30d: 118,
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-04-30T03:12:00Z',
    denominations: [
      { id: 'DEN-BUN-50', valueAud: 50, pointsRequired: 5000, providerCostAud: 47, stockLevel: 'in_stock', capPerMemberPerMonth: 3, active: true },
      { id: 'DEN-BUN-100', valueAud: 100, pointsRequired: 10000, providerCostAud: 94, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true },
    ],
  },
  {
    id: 'GC-WESTFIELD',
    name: 'Westfield',
    category: 'Lifestyle',
    logoUrl: '/gift-cards/westfield.svg',
    heroColor: '#000000',
    description:
      'Spend at hundreds of retailers in any Westfield centre across Australia. Fashion, dining, beauty, electronics.',
    terms: 'Valid for 2 years. Activation fee waived. Treat like cash.',
    faq: [],
    deliveryType: 'instant',
    memberOnly: false,
    featured: false,
    status: 'live',
    providerId: 'prezzee',
    popularity30d: 96,
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2026-04-30T03:12:00Z',
    denominations: [
      { id: 'DEN-WES-50', valueAud: 50, pointsRequired: 5200, providerCostAud: 48, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true },
      { id: 'DEN-WES-100', valueAud: 100, pointsRequired: 10400, providerCostAud: 96, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true },
    ],
  },
  {
    id: 'GC-MYER',
    name: 'Myer',
    category: 'Lifestyle',
    logoUrl: '/gift-cards/myer.svg',
    heroColor: '#86256E',
    description: 'Department store essentials across fashion, beauty, home, and toys at Myer.',
    terms: 'Valid for 3 years. Treat like cash.',
    faq: [],
    deliveryType: 'instant',
    memberOnly: false,
    featured: false,
    status: 'live',
    providerId: 'prezzee',
    popularity30d: 44,
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2026-04-30T03:12:00Z',
    denominations: [
      { id: 'DEN-MYER-100', valueAud: 100, pointsRequired: 10300, providerCostAud: 96, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true },
    ],
  },
  {
    id: 'GC-UBER',
    name: 'Uber',
    category: 'Travel',
    logoUrl: '/gift-cards/uber.svg',
    heroColor: '#000000',
    description: 'Use across Uber rides and Uber Eats orders in Australia.',
    terms: 'Valid for 2 years. Non-refundable.',
    faq: [],
    deliveryType: 'instant',
    memberOnly: true,
    featured: false,
    status: 'live',
    providerId: 'direct',
    popularity30d: 38,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-04-30T03:12:00Z',
    denominations: [
      { id: 'DEN-UBER-25', valueAud: 25, pointsRequired: 2700, providerCostAud: 24, stockLevel: 'in_stock', capPerMemberPerMonth: 4, active: true },
      { id: 'DEN-UBER-50', valueAud: 50, pointsRequired: 5400, providerCostAud: 48, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true },
    ],
  },
  {
    id: 'GC-NETFLIX',
    name: 'Netflix',
    category: 'Entertainment',
    logoUrl: '/gift-cards/netflix.svg',
    heroColor: '#E50914',
    description: 'Apply credit to any Australian Netflix account.',
    terms: 'Valid for 2 years. Non-refundable.',
    faq: [],
    deliveryType: 'review',
    memberOnly: false,
    featured: false,
    status: 'live',
    providerId: 'direct',
    popularity30d: 22,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-04-30T03:12:00Z',
    denominations: [
      { id: 'DEN-NFX-30', valueAud: 30, pointsRequired: 3200, providerCostAud: 29, stockLevel: 'in_stock', capPerMemberPerMonth: 2, active: true },
      { id: 'DEN-NFX-50', valueAud: 50, pointsRequired: 5400, providerCostAud: 48, stockLevel: 'out_of_stock', capPerMemberPerMonth: 1, active: true },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────
   Redemptions — covers every status + failure reason for QA.
   ────────────────────────────────────────────────────────────────── */
export const MOCK_REDEMPTIONS: Redemption[] = [
  {
    id: 'RDM-218041',
    memberId: 'M-10421',
    memberName: 'Charlotte Nguyen',
    memberEmail: 'charlotte.n@example.com',
    brandId: 'GC-COLES',
    brandName: 'Coles',
    brandLogoUrl: '/gift-cards/coles.svg',
    denominationId: 'DEN-COLES-50',
    valueAud: 50,
    pointsDebited: 5000,
    quantity: 1,
    status: 'completed',
    fraudSignals: { velocity: 0.12, geo: 'AU', deviceTrust: 'trusted', score: 18, ipCountry: 'AU', deviceCountry: 'AU', accountAgeDays: 412, recentFailures1h: 0, recentRedemptions24h: 1 },
    prezzeeOrderUuid: 'mock-uuid-r8x912', prezzeeOrderNumber: 'PRZ-2026-R8x912', recipientEmail: 'james.a@example.com', emailDeliveryStatus: 'delivered', voucherUrlStatus: 'clicked',
    createdAt: isoMinus(12),
    completedAt: isoMinus(11),
    refundedAt: null,
    failureReason: null,
    channel: 'web',
    providerLatencyMs: 842,
    providerHttpStatus: 200,
  },
  {
    id: 'RDM-218038',
    memberId: 'M-10398',
    memberName: 'James Anderson',
    memberEmail: 'james.a@example.com',
    brandId: 'GC-WOOLIES',
    brandName: 'Woolworths',
    brandLogoUrl: '/gift-cards/woolworths.svg',
    denominationId: 'DEN-WOOL-100',
    valueAud: 100,
    pointsDebited: 10000,
    quantity: 1,
    status: 'prezzee_pending',
    fraudSignals: { velocity: 0.62, geo: 'foreign', deviceTrust: 'new', score: 74, ipCountry: 'VN', deviceCountry: 'AU', accountAgeDays: 8, recentFailures1h: 1, recentRedemptions24h: 3 },
    recipientEmail: 'james.a@example.com',
    createdAt: isoMinus(34),
    completedAt: null,
    refundedAt: null,
    failureReason: null,
    channel: 'ios',
  },
  {
    id: 'RDM-218033',
    memberId: 'M-10412',
    memberName: 'Isla Martin',
    memberEmail: 'isla.m@example.com',
    brandId: 'GC-BP',
    brandName: 'BP',
    brandLogoUrl: '/gift-cards/bp.svg',
    denominationId: 'DEN-BP-50',
    valueAud: 50,
    pointsDebited: 5000,
    quantity: 2,
    status: 'completed',
    fraudSignals: { velocity: 0.18, geo: 'AU', deviceTrust: 'trusted', score: 22, ipCountry: 'AU', deviceCountry: 'AU', accountAgeDays: 280, recentFailures1h: 0, recentRedemptions24h: 2 },
    prezzeeOrderUuid: 'mock-uuid-bp44192', prezzeeOrderNumber: 'PRZ-2026-BP44192', recipientEmail: 'isla.m@example.com', emailDeliveryStatus: 'delivered', voucherUrlStatus: 'pending',
    createdAt: isoMinus(95),
    completedAt: isoMinus(94),
    refundedAt: null,
    failureReason: null,
    channel: 'android',
    providerLatencyMs: 1240,
    providerHttpStatus: 200,
  },
  {
    id: 'RDM-218022',
    memberId: 'M-10367',
    memberName: 'William Clark',
    memberEmail: 'william.c@example.com',
    brandId: 'GC-JBHIFI',
    brandName: 'JB Hi-Fi',
    brandLogoUrl: '/gift-cards/jbhifi.svg',
    denominationId: 'DEN-JB-100',
    valueAud: 100,
    pointsDebited: 10000,
    quantity: 1,
    status: 'failed',
    fraudSignals: { velocity: 0.34, geo: 'AU', deviceTrust: 'trusted', score: 28, ipCountry: 'AU', deviceCountry: 'AU', accountAgeDays: 612, recentFailures1h: 0, recentRedemptions24h: 0 },
    recipientEmail: 'james.a@example.com',
    createdAt: isoMinus(180),
    completedAt: null,
    refundedAt: isoMinus(178),
    failureReason: 'provider_error',
    channel: 'web',
    providerLatencyMs: 12_400,
    providerHttpStatus: 504,
  },
  {
    id: 'RDM-218011',
    memberId: 'M-10401',
    memberName: 'Ava Robinson',
    memberEmail: 'ava.r@example.com',
    brandId: 'GC-NETFLIX',
    brandName: 'Netflix',
    brandLogoUrl: '/gift-cards/netflix.svg',
    denominationId: 'DEN-NFX-50',
    valueAud: 50,
    pointsDebited: 5400,
    quantity: 1,
    status: 'refunded',
    fraudSignals: { velocity: 0.21, geo: 'AU', deviceTrust: 'trusted', score: 25, ipCountry: 'AU', deviceCountry: 'AU', accountAgeDays: 198, recentFailures1h: 0, recentRedemptions24h: 1 },
    recipientEmail: 'james.a@example.com',
    createdAt: isoMinus(420),
    completedAt: null,
    refundedAt: isoMinus(419),
    failureReason: 'out_of_stock',
    channel: 'web',
  },
  {
    id: 'RDM-218004',
    memberId: 'M-10384',
    memberName: 'Henry Wilson',
    memberEmail: 'henry.w@example.com',
    brandId: 'GC-BUNNINGS',
    brandName: 'Bunnings',
    brandLogoUrl: '/gift-cards/bunnings.svg',
    denominationId: 'DEN-BUN-100',
    valueAud: 100,
    pointsDebited: 10000,
    quantity: 1,
    status: 'prezzee_pending',
    fraudSignals: { velocity: 0.14, geo: 'AU', deviceTrust: 'trusted', score: 16, ipCountry: 'AU', deviceCountry: 'AU', accountAgeDays: 540, recentFailures1h: 0, recentRedemptions24h: 0 },
    prezzeeOrderUuid: 'mock-uuid-88412', prezzeeOrderNumber: 'PRZ-2026-88412', recipientEmail: 'henry.w@example.com', emailDeliveryStatus: 'pending',
    createdAt: isoMinus(2),
    completedAt: null,
    refundedAt: null,
    failureReason: null,
    channel: 'web',
  },
];

/* ──────────────────────────────────────────────────────────────────
   Ledger entries — debit + refund pairs for refunded redemptions.
   ────────────────────────────────────────────────────────────────── */
export const MOCK_LEDGER: LedgerEntry[] = [
  { id: 'L-001', redemptionId: 'RDM-218041', memberId: 'M-10421', type: 'debit', points: 5000, audCostEx: 47, marginAud: 3, at: isoMinus(12), reversedBy: null },
  { id: 'L-002', redemptionId: 'RDM-218033', memberId: 'M-10412', type: 'debit', points: 5000, audCostEx: 47.5, marginAud: 2.5, at: isoMinus(95), reversedBy: null },
  { id: 'L-003', redemptionId: 'RDM-218033', memberId: 'M-10412', type: 'debit', points: 5000, audCostEx: 47.5, marginAud: 2.5, at: isoMinus(95), reversedBy: null },
  { id: 'L-004', redemptionId: 'RDM-218022', memberId: 'M-10367', type: 'debit', points: 10000, audCostEx: 94, marginAud: 6, at: isoMinus(180), reversedBy: 'L-005' },
  { id: 'L-005', redemptionId: 'RDM-218022', memberId: 'M-10367', type: 'refund', points: 10000, audCostEx: 0, marginAud: 0, at: isoMinus(178), reversedBy: null },
  { id: 'L-006', redemptionId: 'RDM-218011', memberId: 'M-10401', type: 'debit', points: 5400, audCostEx: 48, marginAud: 2, at: isoMinus(420), reversedBy: 'L-007' },
  { id: 'L-007', redemptionId: 'RDM-218011', memberId: 'M-10401', type: 'refund', points: 5400, audCostEx: 0, marginAud: 0, at: isoMinus(419), reversedBy: null },
];

/* ──────────────────────────────────────────────────────────────────
   Providers
   ──────────────────────────────────────────────────────────────────
   PRIMARY: Prezzee. Covers every AU top-tier brand UNICASH ships
   today. The remaining entries (InComm, Blackhawk, GiVV, Direct)
   sit warm as failovers — they're kept in the catalog so admins
   can fail brands over manually if Prezzee degrades.
   ────────────────────────────────────────────────────────────────── */
export const MOCK_PROVIDERS: ProviderHealth[] = [
  {
    id: 'prezzee',
    name: 'Prezzee',
    status: 'healthy',
    successRate24h: 99.6,
    avgLatencyMs: 780,
    lastWebhookAt: isoMinus(2),
    failoverPriority: 1,
    brands: ['GC-COLES', 'GC-WOOLIES', 'GC-BP', 'GC-JBHIFI', 'GC-BUNNINGS', 'GC-WESTFIELD', 'GC-MYER'],
    webhookUrl: 'https://api.unicash.com.au/webhooks/prezzee',
    retryPolicy: { maxAttempts: 3, backoffMs: 1500 },
    successSeries24h: Array.from({ length: 24 }, (_, i) => 99.6 - Math.sin(i / 5) * 0.3),
  },
  {
    id: 'incomm',
    name: 'InComm (failover)',
    status: 'healthy',
    successRate24h: 99.1,
    avgLatencyMs: 1180,
    lastWebhookAt: isoMinus(85),
    failoverPriority: 2,
    brands: [],
    webhookUrl: 'https://api.unicash.com.au/webhooks/incomm',
    retryPolicy: { maxAttempts: 3, backoffMs: 1500 },
    successSeries24h: Array.from({ length: 24 }, (_, i) => 99.1 - Math.sin(i / 5) * 0.4),
  },
  {
    id: 'blackhawk',
    name: 'Blackhawk Network (failover)',
    status: 'degraded',
    successRate24h: 94.2,
    avgLatencyMs: 1840,
    lastWebhookAt: isoMinus(220),
    failoverPriority: 3,
    brands: [],
    webhookUrl: 'https://api.unicash.com.au/webhooks/blackhawk',
    retryPolicy: { maxAttempts: 3, backoffMs: 2000 },
    successSeries24h: Array.from({ length: 24 }, (_, i) => i < 18 ? 99 - Math.sin(i / 4) * 0.5 : 88 + (i - 18) * 1.2),
  },
  {
    id: 'givv',
    name: 'GiVV (failover)',
    status: 'healthy',
    successRate24h: 98.7,
    avgLatencyMs: 1120,
    lastWebhookAt: isoMinus(140),
    failoverPriority: 4,
    brands: [],
    webhookUrl: 'https://api.unicash.com.au/webhooks/givv',
    retryPolicy: { maxAttempts: 3, backoffMs: 1500 },
    successSeries24h: Array.from({ length: 24 }, (_, i) => 98.7 + Math.cos(i / 6) * 0.4),
  },
  {
    id: 'direct',
    name: 'Direct brand integrations',
    status: 'healthy',
    successRate24h: 99.8,
    avgLatencyMs: 620,
    lastWebhookAt: isoMinus(1),
    failoverPriority: 5,
    brands: ['GC-UBER', 'GC-NETFLIX'],
    webhookUrl: 'https://api.unicash.com.au/webhooks/direct',
    retryPolicy: { maxAttempts: 2, backoffMs: 1000 },
    successSeries24h: Array.from({ length: 24 }, () => 99.6 + Math.random() * 0.3),
  },
];

/* ──────────────────────────────────────────────────────────────────
   Activity log — used by admin redemption detail Activity tab.
   ────────────────────────────────────────────────────────────────── */
export const MOCK_ACTIVITY: ActivityLogEntry[] = [
  { id: 'A-1', at: isoMinus(11), adminId: 'A-001', adminName: 'Mai Tran', action: 'Approved redemption', reason: 'Trusted member, normal velocity', targetId: 'RDM-218041' },
  { id: 'A-2', at: isoMinus(34), adminId: 'A-002', adminName: 'Vinh Pham', action: 'Held for review', reason: 'Foreign IP, new device, account age 8d', targetId: 'RDM-218038' },
  { id: 'A-3', at: isoMinus(178), adminId: 'A-001', adminName: 'Mai Tran', action: 'Refunded redemption', reason: 'Provider 504 timeout, codes never issued', targetId: 'RDM-218022' },
  { id: 'A-4', at: isoMinus(419), adminId: 'A-002', adminName: 'Vinh Pham', action: 'Refunded redemption', reason: 'Provider returned out_of_stock after debit', targetId: 'RDM-218011' },
];

/* ──────────────────────────────────────────────────────────────────
   Helpers — small lookups used across pages.
   ────────────────────────────────────────────────────────────────── */
export function getBrand(id: string): Brand | undefined {
  return MOCK_BRANDS.find((b) => b.id === id);
}
export function getRedemption(id: string): Redemption | undefined {
  return MOCK_REDEMPTIONS.find((r) => r.id === id);
}
export function getLedgerForRedemption(id: string): LedgerEntry[] {
  return MOCK_LEDGER.filter((l) => l.redemptionId === id);
}
export function getActivityForRedemption(id: string): ActivityLogEntry[] {
  return MOCK_ACTIVITY.filter((a) => a.targetId === id);
}
