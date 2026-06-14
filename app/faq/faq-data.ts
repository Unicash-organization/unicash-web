/* SEO/FAQ — shared source of truth. Hoisted out of FAQClient (a client
   component) so the server FAQPage JSON-LD in app/faq/page.tsx reads the real
   data (a client-module export would be a client reference on the server). */

export type CategoryKey =
  | 'getting-started'
  | 'membership'
  | 'points'
  | 'bonus-draws'
  | 'major-draws'
  | 'point-boosters'
  | 'fuel-rewards'
  | 'gift-cards'
  | 'billing'
  | 'winners';

export type FaqItem = { q: string; a: string };

export const FAQ_DATA: Record<CategoryKey, FaqItem[]> = {
  'getting-started': [
    {
      q: 'What is UNICASH?',
      a: 'UNICASH is an Australian Membership rewards platform. Members earn Points, access Bonus Draws, receive Major Draw entries, earn Fuel Rewards from eligible receipts, and Redeem Gift Cards.',
    },
    {
      q: 'Who can join UNICASH?',
      a: 'Adults aged 18 or over who are residents of Australia. A valid email, a payment method, and accurate identity details (used to verify Prize winners) are required. Some Bonus Draws and Major Draws have additional eligibility shown in their Promotion-Specific Terms.',
    },
    {
      q: 'How are Draws conducted on UNICASH?',
      a: 'Draws conducted on the Platform are promotional in nature. Where a Draw constitutes a regulated trade promotion under state or territory law, UNICASH conducts the Draw in accordance with applicable law and any required permit. Details are in each Draw’s Promotion-Specific Terms.',
    },
  ],
  membership: [
    {
      q: 'What does a Membership include?',
      a: 'Membership includes Monthly Points, Major Draw entries, access to member-only Bonus Draws, Fuel Rewards, Scan Receipts, and Gift Card redemption.',
    },
    {
      q: 'Which Membership plans are available?',
      a: 'UniOne (A$19.99 / month), UniPlus (A$49.99 / month), and UniMax (A$99.99 / month). Each plan includes a different amount of Monthly Points and Major Draw entries.',
    },
    {
      q: 'How many Monthly Points do I get?',
      a: 'UniOne includes 3,000 Monthly Points, UniPlus includes 10,000 Monthly Points, and UniMax includes 25,000 Monthly Points.',
    },
    {
      q: 'How many Major Draw entries do I get?',
      a: 'UniOne includes 1 Major Draw entry monthly, UniPlus includes 4 Major Draw entries monthly, and UniMax includes 10 Major Draw entries monthly.',
    },
    {
      q: 'Do Membership plans include free Bonus Draw entries?',
      a: 'No. Membership plans include Major Draw entries. Bonus Draws require Points to participate.',
    },
    {
      q: 'Can I cancel my Membership?',
      a: 'Yes. Memberships renew monthly until cancelled. You can manage your Membership from your account billing area.',
    },
  ],
  points: [
    {
      q: 'What are Points?',
      a: 'Points are the core UNICASH reward unit. Members can use Points for Bonus Draws or Redeem Gift Cards when eligible.',
    },
    {
      q: 'How do I earn Points?',
      a: 'Points come from Monthly Points, eligible receipt scanning, Fuel Rewards, and optional Point Boosters.',
    },
    {
      q: 'Do Monthly Points reset?',
      a: 'Monthly Points renew each billing cycle. Booster Points purchased separately stack with your Monthly Points and follow the rules shown at purchase.',
    },
    {
      q: 'What can I use Points for?',
      a: 'Points can be used for eligible Bonus Draws and selected Gift Card redemption.',
    },
    {
      q: 'How many Points do I need to redeem a Gift Card?',
      a: 'Selected Gift Cards can be redeemed from 20,000 Points, equal to a A$20 selected Gift Card.',
    },
  ],
  'bonus-draws': [
    {
      q: 'What is a Bonus Draw?',
      a: 'A Bonus Draw is a member-only reward event where Members use Points to enter. Each Bonus Draw shows the Points required, member limit, closing time, and outcome details.',
    },
    {
      q: 'How do I enter a Bonus Draw?',
      a: 'Choose a Bonus Draw, check the Points required, and confirm your entry using Points from your UNICASH balance.',
    },
    {
      q: 'How many Points do Bonus Draws require?',
      a: 'Each Bonus Draw shows the Points needed before you enter. For example, a A$2,000 Bonus Draw may require 200 Points for 1 entry.',
    },
    {
      q: 'Can I enter more than once?',
      a: 'Some Bonus Draws have limits, such as max 1 entry per Member. The entry rule is shown clearly before you enter.',
    },
    {
      q: 'What if I don’t have enough Points?',
      a: 'You can earn more Points by scanning eligible receipts, claiming Fuel Rewards, or topping up with an optional Point Booster.',
    },
    {
      q: 'What happens when a Bonus Draw closes?',
      a: 'After a Bonus Draw closes, the outcome is recorded and Winners are published for transparency.',
    },
  ],
  'major-draws': [
    {
      q: 'What is a Major Draw?',
      a: 'Major Draws are included with active Membership plans. Higher Membership tiers include more Major Draw entries each month.',
    },
    {
      q: 'How are Major Draws different from Bonus Draws?',
      a: 'Major Draw entries are included with Membership plans. Bonus Draws require Points to participate.',
    },
    {
      q: 'Do I use Points for Major Draw entries?',
      a: 'No. Major Draw entries are included with active Membership plans based on your tier.',
    },
  ],
  'point-boosters': [
    {
      q: 'What are Point Boosters?',
      a: 'Point Boosters are optional one-time purchases that add extra Points to your UNICASH balance.',
    },
    {
      q: 'Are Point Boosters subscriptions?',
      a: 'No. Point Boosters are one-time purchases and do not auto-renew.',
    },
    {
      q: 'Which Point Boosters are available?',
      a: 'Booster Spark gives 2,500 Points for A$4.99, Booster Pulse gives 12,000 Points for A$19.99, and Booster Surge gives 20,000 Points for A$29.99.',
    },
    {
      q: 'Do I need to buy Point Boosters?',
      a: 'No. Your Membership already includes Monthly Points. Point Boosters are optional top-ups when you want extra Points.',
    },
    {
      q: 'What can I use Point Booster Points for?',
      a: 'Points from Point Boosters can be used for eligible Bonus Draws or other eligible Points-based rewards.',
    },
  ],
  'fuel-rewards': [
    {
      q: 'How do Fuel Rewards work?',
      a: 'Scan eligible fuel receipts to earn Fuel Rewards as Points in your UNICASH wallet. Higher Membership tiers earn more Points from eligible fuel spending.',
    },
    {
      q: 'How many Points do I earn from fuel receipts?',
      a: 'Free Members earn 0.5 Point per A$1, UniOne earns 1 Point per A$1, UniPlus earns 2 Points per A$1, and UniMax earns 3 Points per A$1 from eligible fuel receipts.',
    },
    {
      q: 'How many Points do I earn from general receipts?',
      a: 'Free Members earn 0.25 Point per A$1, UniOne earns 0.5 Point per A$1, UniPlus earns 1 Point per A$1, and UniMax earns 1.5 Points per A$1 from eligible general receipts.',
    },
    {
      q: 'Are receipts approved instantly?',
      a: 'Receipt uploads may need review. Your account shows whether a receipt is pending, approved, rejected, or requires attention.',
    },
    {
      q: 'What receipts are eligible?',
      a: 'Eligible receipt rules are shown in the Scan Receipts flow and Terms. Receipts must be clear, valid, and not previously submitted.',
    },
  ],
  'gift-cards': [
    {
      q: 'Can I Redeem Gift Cards with Points?',
      a: 'Yes. Selected Gift Cards can be redeemed with Points when you meet the redemption requirement.',
    },
    {
      q: 'What is the redemption benchmark?',
      a: '20,000 Points can be redeemed for a A$20 selected Gift Card.',
    },
    {
      q: 'Are all Gift Cards always available?',
      a: 'Gift Card availability may vary. Available redemption options are shown in the redemption area.',
    },
  ],
  billing: [
    {
      q: 'When am I charged for Membership?',
      a: 'Membership is billed monthly on the same date you joined or last changed your plan.',
    },
    {
      q: 'Are Point Boosters charged monthly?',
      a: 'No. Point Boosters are one-time purchases and don’t auto-renew.',
    },
    {
      q: 'Where can I manage billing?',
      a: 'Once logged in, head to your account billing area to view receipts, update your card, or change your plan.',
    },
    {
      q: 'What happens if payment fails?',
      a: 'Your account may show a payment issue. You may need to update your payment method to keep Membership benefits active.',
    },
    {
      q: 'How do I log in?',
      a: 'Use your registered email and password to sign in. If you forget your password, use the Reset password option on the login screen.',
    },
  ],
  winners: [
    {
      q: 'Are Winners published?',
      a: 'Yes. Winners are published after Bonus Draw outcomes are completed and verified.',
    },
    {
      q: 'Why does UNICASH publish Winners?',
      a: 'Published Winners help Members see that outcomes are recorded and transparent.',
    },
    {
      q: 'Are Bonus Draw limits shown upfront?',
      a: 'Yes. Each Bonus Draw shows the Points required, entry limit, total entries, and closing time before you enter.',
    },
    {
      q: 'How does UNICASH keep Bonus Draws clear?',
      a: 'UNICASH uses clear Points requirements, member limits, closing times, and published Winners to reduce confusion and improve transparency.',
    },
  ],
};

/** Flat {q,a} list for the server FAQPage JSON-LD. */
export const FAQ_SCHEMA_ENTRIES: FaqItem[] = Object.values(FAQ_DATA).flat();
