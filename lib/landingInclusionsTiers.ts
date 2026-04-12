/** Fixed copy for “SEE ALL INCLUSIONS” on major + membership landings. */

export type LandingInclusionTier = {
  name: string;
  headClass: string;
  checkClass: string;
  lines: { bold: string; rest: string }[];
};

export const LANDING_INCLUSIONS_TIERS: LandingInclusionTier[] = [
  {
    name: 'STARTER',
    headClass: 'text-gray-900',
    checkClass: 'text-gray-500',
    lines: [
      { bold: '1 day', rest: ' Access to 50+ partner discounts' },
      { bold: '3 Free Entries', rest: ' into the giveaway' },
      { bold: 'Get 5% Off', rest: ' Every Horsey Shop Order' },
      { bold: 'Supports', rest: ' Farm Angels' },
    ],
  },
  {
    name: 'BASIC',
    headClass: 'text-gray-900',
    checkClass: 'text-gray-500',
    lines: [
      { bold: '3 days', rest: ' Access to 50+ partner discounts' },
      { bold: '15 Free Entries', rest: ' into the giveaway' },
      { bold: 'Get 5% Off', rest: ' Every Horsey Shop Order' },
      { bold: 'Supports', rest: ' Farm Angels' },
    ],
  },
  {
    name: 'DELUXE',
    headClass: 'text-emerald-700',
    checkClass: 'text-emerald-600',
    lines: [
      { bold: '7 days', rest: ' Access to 50+ partner discounts' },
      { bold: '75 Free Entries', rest: ' into the giveaway' },
      { bold: 'Get 5% Off', rest: ' Every Horsey Shop Order' },
      { bold: 'Supports', rest: ' Farm Angels' },
    ],
  },
  {
    name: 'PREMIUM',
    headClass: 'text-amber-700',
    checkClass: 'text-amber-600',
    lines: [
      { bold: '14 days', rest: ' Access to 50+ partner discounts' },
      { bold: '300 Free Entries', rest: ' into the giveaway' },
      { bold: 'Get 5% Off', rest: ' Every Horsey Shop Order' },
      { bold: 'Supports', rest: ' Farm Angels' },
    ],
  },
  {
    name: 'ELITE',
    headClass: 'text-violet-800',
    checkClass: 'text-violet-600',
    lines: [
      { bold: '30 days', rest: ' Access to 50+ partner discounts' },
      { bold: '1500 Free Entries', rest: ' into the giveaway' },
      { bold: 'Get 5% Off', rest: ' Every Horsey Shop Order' },
      { bold: 'Supports', rest: ' Farm Angels' },
    ],
  },
];
