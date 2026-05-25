/**
 * Per-page FAQ content for UNICASH.
 *
 * Source-of-truth markdown is at `/legal/UNICASH-FAQs.md`. These
 * arrays mirror that document and are imported by the matching page
 * client (HomeClient, GiveawaysClient, BoostPacksClient, ScanReceipts,
 * Winners). The master /faq page maintains its own categorised data
 * in `app/faq/FAQClient.tsx` (different presentation — grouped by
 * category + search).
 */

import type { FaqItem } from '@/components/faq/FAQAccordion';

/* -------------------------------------------------------------------------- */
/*  Home (/) — six high-level questions, conversion-aware                     */
/* -------------------------------------------------------------------------- */

export const homeFaqs: FaqItem[] = [
  {
    q: 'What is UNICASH?',
    a: 'UNICASH is an Australian Membership rewards platform. Members earn and use Points for member-only Bonus Draws, Major Draws, gift card redemptions, and other rewards. Membership is a monthly subscription. Point Boosters are optional one-off top-ups.',
  },
  {
    q: 'Who can join UNICASH?',
    a: 'Adults aged 18 or over who are residents of Australia. You will need a valid email, a payment method, and accurate details for identity verification when claiming a Prize. Some Bonus Draws and Major Draws have additional eligibility requirements set out in their Promotion-Specific Terms.',
  },
  {
    q: 'How do I get started?',
    a: 'Create a free Account, choose a Membership tier (UniOne, UniPlus, or UniMax), and receive monthly Membership Benefits — including promotional Points and Major Draw entries — at the start of each billing cycle.',
  },
  {
    q: 'How do I earn Points?',
    a: 'Three ways: as a monthly Membership Benefit, by purchasing a Point Booster, and by submitting eligible Receipts through the Scan Receipts feature.',
  },
  {
    q: 'What can I use Points for?',
    a: 'Points can be used to enter eligible Bonus Draws and to redeem digital Gift Cards from participating retailer brands. Eligible uses are shown on each feature page.',
  },
  {
    q: 'Is my information safe?',
    a: 'Yes. UNICASH uses encryption in transit and at rest, does not store full card details (payment is processed by Stripe), and handles Personal Information in accordance with the Privacy Policy and the Privacy Act 1988 (Cth).',
  },
];

/* -------------------------------------------------------------------------- */
/*  Bonus Draws (/giveaways)                                                   */
/* -------------------------------------------------------------------------- */

export const giveawaysFaqs: FaqItem[] = [
  {
    q: 'What is a Bonus Draw?',
    a: 'A Bonus Draw is a promotional draw offered to eligible Members from time to time. It may be a flash, themed, seasonal, or member-only Draw, each with its own prize, dates, entry rules, Points requirement, and any applicable trade-promotion permit. UNICASH also runs Major Draws — flagship weekly, monthly, or milestone Draws that may include guaranteed entries as a Membership Benefit.',
  },
  {
    q: 'Do I need a Membership to enter?',
    a: 'Some Draws are open to all Members; others require a specific Membership tier or are only available as a Membership Benefit. Eligibility for each Draw is shown on its detail page under the Promotion-Specific Terms.',
  },
  {
    q: 'How many entries do I get?',
    a: 'It depends on the Draw. Some Draws allow only one entry per Member; others allow multiple entries up to a cap. The Points required per entry and any caps are shown on each Draw’s detail page.',
  },
  {
    q: 'How are winners chosen?',
    a: 'Winners are determined in the manner described in each Draw’s Promotion-Specific Terms — usually a random electronic draw conducted at the time and place stated, and where required, in accordance with a trade-promotion permit.',
  },
  {
    q: 'Where will winners be announced?',
    a: 'On the Winners page, and where required by an applicable permit, in the manner the permit specifies (which may include publication in a national newspaper). Winners may also be contacted directly by email.',
  },
  {
    q: 'Are Bonus Draws available in every state?',
    a: 'Some Draws may be unavailable or restricted in certain states or territories, depending on local law and the conditions of any applicable trade-promotion permit. Each Draw’s Promotion-Specific Terms list any Restricted Jurisdictions.',
  },
  {
    q: 'What happens to my Points if a Draw is cancelled?',
    a: 'If a Draw is cancelled before entries are accepted, deducted Points are re-credited. If cancelled after entries are accepted, UNICASH will determine an equitable remedy consistent with applicable law and the trade-promotion permit — for example, re-crediting Points, substituting a Prize of equal or greater value, or running a replacement Draw.',
  },
  {
    q: 'Can I get a refund of Points after I enter?',
    a: 'No. Once entry is confirmed and Points are deducted, the entry is final, except where required by law or where UNICASH determines the entry was invalid. Full details are in clauses 10 and 14 of the Terms and Conditions and in section 6 of the Refund Policy.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Point Boosters (/boost-packs)                                              */
/* -------------------------------------------------------------------------- */

export const boostPacksFaqs: FaqItem[] = [
  {
    q: 'What is a Point Booster?',
    a: 'A Point Booster is a one-off purchase of a fixed quantity of Points. Three packs are available: Booster Spark (A$4.99 for 250 Points), Booster Pulse (A$19.99 for 1,200 Points — Most Popular), and Booster Surge (A$29.99 for 2,000 Points — Best Value).',
  },
  {
    q: 'Will a Point Booster auto-renew?',
    a: 'No. Point Boosters are one-off purchases. They do not auto-renew, do not bill again, and are independent of your Membership.',
  },
  {
    q: 'How is this different from Membership?',
    a: 'Membership is a monthly recurring subscription that includes Membership Benefits (such as monthly promotional Points and Major Draw entries) each billing cycle. A Point Booster is a one-time top-up — you pay once, the Points are credited, and that is it.',
  },
  {
    q: 'Do Point Booster Points expire?',
    a: 'Points purchased through a Point Booster generally do not expire and are not subject to the monthly reset that applies to promotional Points from your Membership. If UNICASH ever changes this, reasonable notice will be given and the change will only apply to future purchases.',
  },
  {
    q: 'What can I use Point Booster Points for?',
    a: 'The same things as any other Points — entering eligible Bonus Draws and redeeming Gift Cards from participating brands.',
  },
  {
    q: 'How are Points deducted if I have both kinds?',
    a: 'Where your Account holds both Membership promotional Points and Point Booster Points, promotional Points are generally used first. This keeps your non-expiring purchased balance available for longer.',
  },
  {
    q: 'Can I get a refund on a Point Booster?',
    a: 'Point Boosters are digital products supplied immediately, so they are non-refundable once Points are credited, except where required by law or where one of the goodwill scenarios in the Refund Policy applies (for example, a duplicate charge or unauthorised purchase).',
  },
  {
    q: 'Are Points transferable?',
    a: 'No. Points are non-transferable between Accounts and cannot be sold, gifted, or assigned. They are an in-Platform promotional unit and have no cash value.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Scan Receipts (/scan-receipts)                                             */
/* -------------------------------------------------------------------------- */

export const scanReceiptsFaqs: FaqItem[] = [
  {
    q: 'Which receipts are eligible?',
    a: 'A Receipt is eligible if it relates to a genuine retail purchase made by you, at a participating Australian retailer, dated within the 30-day window shown on the Platform, and is legible (showing retailer name, date and time, line items, and total).',
  },
  {
    q: 'Which receipts are not eligible?',
    a: 'Receipts that are altered, edited, photocopied off a screen, screenshotted from another submission, AI-generated, duplicate submissions, refunded transactions, receipts from non-participating retailers, and certain excluded categories (for example, alcohol, tobacco, lottery products, or gift cards purchased at retail). The full exclusion list is shown on the Platform.',
  },
  {
    q: 'How long does review take?',
    a: 'Most submissions are reviewed automatically within minutes. Some may need a manual check, which can take up to 7 business days. The current status of your submission is shown in your Account.',
  },
  {
    q: 'What status will my submission go through?',
    a: 'Submissions can move through: uploading, scanning, success, pending review, approved, rejected, duplicate, invalid Receipt, and processing failure. Each status is displayed in your Account, with a clear next step where one is available.',
  },
  {
    q: 'Why was my Receipt rejected?',
    a: 'Common reasons: the Receipt is illegible, the retailer is not on the participating list, the transaction date is outside the eligibility window, the Receipt has already been submitted, or the image appears altered. The rejection reason is shown in your Account.',
  },
  {
    q: 'Can I submit the same Receipt twice?',
    a: 'No. UNICASH uses cryptographic hashing, perceptual hashing, and transaction fingerprinting to detect duplicates — even if the photo is different. Submitting the same Receipt more than once may result in suspension under the Terms and Conditions.',
  },
  {
    q: 'What if my Receipt is partly cut off or blurry?',
    a: 'Re-take the photo with the full Receipt in frame and good lighting, then resubmit. If a Receipt has been rejected for legibility, it can be resubmitted with a clearer photo within the eligibility window.',
  },
  {
    q: 'How much do I earn per Receipt?',
    a: 'The reward varies by retailer, basket size, and any active campaign. The estimated reward range is shown before submission, and the actual reward is confirmed on approval.',
  },
  {
    q: 'What happens to my Receipt photo after submission?',
    a: 'The image, OCR-extracted text, and hashes/fingerprints generated are stored for up to 12 months for review, dispute, and anti-fraud purposes, then purged. Full detail is in the Privacy Policy.',
  },
  {
    q: 'Can I dispute a rejection?',
    a: 'Yes. Email support@unicash.com.au within 30 days of the decision and UNICASH will review. The outcome will be communicated in writing.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Winners (/winners)                                                         */
/* -------------------------------------------------------------------------- */

export const winnersFaqs: FaqItem[] = [
  {
    q: 'How are winners chosen?',
    a: 'Winners are determined in the manner described in each Draw’s Promotion-Specific Terms — typically a random electronic draw conducted at the time and place stated, and (where the law requires) in accordance with the trade-promotion permit issued for that Draw.',
  },
  {
    q: 'How are winners verified?',
    a: 'Before a Prize is awarded, UNICASH may ask the winner to verify identity, age, and residency (including providing government-issued ID), confirm that the entry complies with the Terms, and execute any documentation required under the relevant trade-promotion permit (such as a winner declaration). Verification protects the integrity of the Draw and other Members.',
  },
  {
    q: 'Will my full name be published?',
    a: 'No. By default UNICASH publishes a winner’s first name, surname initial, suburb, state or territory, the Prize won, the Draw identifier, and the Draw date. Some trade-promotion permits require additional disclosure (for example, publication in a national newspaper) — in those cases UNICASH publishes in the manner the permit requires.',
  },
  {
    q: 'Can I refuse publicity?',
    a: 'Yes — contact support@unicash.com.au before the relevant Draw closes. UNICASH will accommodate the request where it does not breach a trade-promotion permit condition or other legal requirement.',
  },
  {
    q: 'How will I be notified if I win?',
    a: 'By email to the address on the Account, and through an in-Platform notification. UNICASH may also attempt to phone you on the number registered to the Account. Please keep contact details current.',
  },
  {
    q: 'What if I miss the claim deadline?',
    a: 'Where a winner cannot be contacted, does not respond to reasonable contact attempts, does not complete verification, or does not claim within the period specified in the Promotion-Specific Terms (and in any event within the period the trade-promotion permit requires), the Prize may be forfeited and a redraw conducted. UNICASH makes reasonable efforts to reach the winner first.',
  },
  {
    q: 'Are Prizes taxable? Can I take cash instead?',
    a: 'Cash Prizes (where applicable) are paid by electronic funds transfer. For non-cash Prizes, the winner is responsible for any tax, duty, or personal reporting obligation. UNICASH does not provide tax advice and recommends speaking with an accountant. Prizes are generally not redeemable for cash unless expressly stated in the Promotion-Specific Terms.',
  },
  {
    q: 'What records do you keep of each Draw?',
    a: 'UNICASH retains entry logs, draw conduct records, winner verification records, and Prize fulfilment records for the period required by the relevant trade-promotion permit and (in any event) for as long as is reasonably necessary to address any dispute. Records are available to the relevant regulator on request.',
  },
];
