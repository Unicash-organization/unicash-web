# UNICASH — Project Audit + Safety Setup

**Generated:** 2026-05-01
**Scope:** `unicash-web/` (customer-facing Next.js 14 frontend)
**Purpose:** Establish a redesign safety contract before any UI rework. Defines what can be touched, what must stay locked, and which terminology must be rewritten to match UNICASH master instructions.

---

## 1. Stack snapshot

| Item | Value |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Styling | TailwindCSS 3.4 |
| Auth | Custom JWT via `contexts/AuthContext.tsx` + localStorage |
| Payments | Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`) |
| Backend | Separate `unicash-api/` workspace (out of scope for redesign) |
| Notifications | sweetalert2 |

Dev port: `3002`. API base: `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000/api`).

---

## 2. Sitemap (current routes)

**Public**
- `/` — Homepage
- `/about`, `/contact`, `/faq`, `/privacy`, `/terms` — Static
- `/winners` — Recent winners list (rename target)
- `/giveaways`, `/giveaways/[id]` — Bonus Draw list + detail
- `/draws/[id]/entries` — User entries for a draw
- `/boost-packs` — Point Booster packs
- `/major-reward` — Major reward landing
- `/lp/[slug]` — CMS-driven landing pages
- `/thank-you` — Generic thank-you
- `/win/[slug]`, `/win/purchase-success` — Win flow

**Auth**
- `/login`, `/forgot-password`, `/reset-password`

**Checkout**
- `/checkout`, `/checkout/success`

**Dashboard (auth-gated)**
- `/dashboard` — Overview
- `/dashboard/membership`
- `/dashboard/entries`
- `/dashboard/purchases`
- `/dashboard/billing`
- `/dashboard/security-billing`
- `/dashboard/profile`
- `/dashboard/password`

---

## 3. Terminology audit — CRITICAL

The current codebase violates UNICASH master terminology in many places. This section is the **single source of truth** for what to rewrite, where, and how. Every rewrite must distinguish between **visible copy** (must change), **internal field names / API URLs / component file names** (Logic Lock — must stay) and **real-world payment terminology** like "credit card" (allowed, not a violation).

### 3.1 Severity overview

| Forbidden / legacy term | Occurrences | Severity | Action |
|---|---|---|---|
| `credit` / `credits` (as reward currency) | **515 across 38 files** | P0 | Rewrite display copy → **Points** |
| `Boost Pack` / `Boost Packs` (display copy) | ~40 across 8 files | P0 | Rewrite display copy → **Point Booster** / **Point Boosters** |
| `giveaway` / `Giveaway` (display copy) | ~25 across 8 files | P0 | Rewrite display copy → **Bonus Draw** |
| `prize` / `Prize` / `Grand Prize` (display copy) | ~30 across 12 files | P0 | Rewrite display copy → **Reward** / **Featured Reward** |
| `winner` / `Winners` (display copy) | ~30 across 9 files | P1 | Rewrite display copy → **Recent Members** / **Reward Recipients** |
| `Major Draw` / `Major Reward` (display copy) | ~10 across 4 files | P1 | Rewrite display copy → **Featured Bonus Draw** |
| `draw` / `Draw` (display copy) | bulk inside 650-occurrence pool | P1 | Rewrite to **Bonus Draw** when standalone |
| `Ticket #` (visible label) | 1 (`app/draws/[id]/entries/page.tsx:209`) | P0 | Rename label → **Entry #** |
| `entry` / `Entries` (display copy) | bulk | P2 | Mostly OK; prefix with **Bonus Draw** where standalone |
| `odds` / `chance` / `lucky` (display copy) | ~5 | P1 | Remove — gambling-coded |
| `lottery` / `raffle` / `jackpot` / `gambling` / `casino` / `bet` | 0 | — | Clean |
| `spin` | only `animate-spin` Tailwind utility | — | False positive — keep |

### 3.2 Three categories — what changes vs. what stays

**Category A — Visible copy (CHANGE).** All user-facing text in JSX, FAQ blocks, headings, button labels, alt text, modal copy, toast messages, error states. This is the bulk of the rewrite work. See §3.4 for line-level mapping.

**Category B — Internal symbols (KEEP).** Field names on entities, props, state variables, TypeScript types, hooks, function names, API URLs, server-side query params. Renaming these breaks the contract with `unicash-api/`. Touched only in a future refactor phase, never in this redesign.

**Category C — Real-world payment terms (KEEP).** "Credit card", "Credit/Debit Card" in `StripeCheckoutForm.tsx:357,371` and `IMPLEMENTATION_SUMMARY.md:44` refer to the payment method, not the reward currency. They are industry-standard and **not a violation**. Master instruction forbids "credits" as a rewards currency, not "credit card" as a payment instrument.

#### Category B — explicit Logic Lock list (do NOT rename in this redesign)

| Symbol | Location | Maps to |
|---|---|---|
| `membershipCredits`, `boostCredits` | `contexts/AuthContext.tsx:14-15`, `Header.tsx:18`, `BoostPackCard.tsx:45,57-58`, `ConfirmEntryModal.tsx:72` | User entity |
| `freeCreditsPerPeriod` | `MembershipCard.tsx:38,135,455,461` | Membership plan |
| `creditsPerEntry` | `DrawCard.tsx:31,44,268,373`, `GiveawaysClient.tsx:59`, `app/page.tsx:471` | DrawCard prop |
| `costPerEntry` | `ConfirmEntryModal.tsx:15,73,207`, `FeaturedBonusDraw.tsx:165`, `app/giveaways/[id]/page.tsx:414,541,637` | Bonus Draw entity |
| `pack.credits` | `BoostPackCard.tsx:25,202` | Point Booster entity |
| `prizeAmount`, `prizeType`, `prizeImage` | `winners/page.tsx:11-12`, `app/major-reward/page.tsx:12-13`, `FeaturedBonusDraw.tsx:20-22` | Winner / Draw entity |
| `landingPrizeHeadingHtml`, `landingPrizeSliderImages`, `landingGiveawayFirstPrizeHtml` | `app/win/[slug]/page.tsx:151,295,298,303,358` | Draw landing CMS |
| `entry.ticketNumber` | `app/draws/[id]/entries/page.tsx:230-231` | Entry entity (backend field) |
| `boostPackId` | `MembershipRequiredModal.tsx:9,18` | Modal prop |
| `excludeMajorDraws` | `lib/api.ts:94` | Query param |
| `getCredits`, `getCreditLedger` | `lib/api.ts:134-135` | API method names |
| `/users/credits`, `/users/me/credit-ledger` | `lib/api.ts:134-135` | API URLs |
| `/winners`, `/winners/recent`, `/winners/featured`, `/winners/paginated`, `/winners/:id` | `lib/api.ts:195-202` | API URLs |
| `/entries/me`, `/entries/me/counts-by-draw`, `/entries/me/grouped`, `/entries/:id`, `/entries/public/draw/:id` | `lib/api.ts:140-159` | API URLs |
| `/membership/boost-packs` | `lib/api.ts` (membership.getBoostPacks) | API URL |
| `createMajorDrawLandingPaymentIntent` | `lib/api.ts:287` | API method |
| `getDrawStatus`, `'soldOut'`, `'closed'`, `'open'`, `'canceled'`, `'entered'` | `lib/utils.ts:20`, `ConfirmEntryModal.tsx:74-76`, `DrawCard.tsx:158-159` | State machine values |
| `BoostPackCard.tsx`, `BoostPacksClient.tsx`, `GrandPrizeSection.tsx`, `RecentWinnersSection.tsx`, `LandingPrizeSlider.tsx`, `GiveawayDetailCards.tsx`, `GiveawaysClient.tsx`, `FeaturedBonusDraw.tsx`, `MajorDrawCheckoutModal.tsx`, `DrawCard.tsx` | filenames + import symbols | Component identifiers |

> Phase 2 (post-redesign) may consider renaming Category B symbols at the API and component level. That is a separate engineering project, not part of this redesign.

### 3.3 Canonical mapping table (legacy display copy → UNICASH)

| Legacy (display copy) | UNICASH replacement | Apply where |
|---|---|---|
| Credits / credit (as reward currency) | **Points** | All visible labels, balances, FAQ, CTA |
| Credit (singular as currency, e.g. "1 Credit") | **1 Point** | All counters and "X Credits = 1 entry" copy |
| Free credits / month | **Monthly Points** or **Points included monthly** | Membership cards |
| "Spend credits to enter" | "Use Points to enter Bonus Draws" | Homepage, FAQ |
| "Buy a Boost Pack" / "Buy Boost Pack" | **Buy Point Booster** / **Get Points** | CTA copy everywhere |
| Boost Pack / Boost Packs | **Point Booster** / **Point Boosters** | All visible copy, page headings, FAQ |
| Boost Pack credits / Boost credits | **Booster Points** | When distinguishing from Membership Points |
| Membership credits | **Membership Points** | Same |
| Draw / Draws (when standalone in copy) | **Bonus Draw** / **Bonus Draws** | All visible copy |
| Giveaway / Giveaways (display copy) | **Bonus Draw** / **Bonus Draws** | All visible copy |
| Open draw | **Open Bonus Draw** | All visible copy |
| Member draw | **Member Bonus Draw** | All visible copy |
| Entry / Entries (when standalone) | **Entry** / **Bonus Draw Entries** | Use plain "Entry" inside a draw context; "Bonus Draw Entries" when listing across draws |
| Ticket / Tickets | **Entry** / **Entries** | Hard rule — never "ticket" anywhere in copy |
| Ticket # | **Entry #** | Display label only; `entry.ticketNumber` field stays (Logic Lock) |
| Cost per entry | **Points required** | Display label only; `costPerEntry` field stays |
| Winner / Winners (page heading + sections) | **Recent Members** or **Reward Recipients** | Decide one and use consistently |
| "won {amount}" | **received {amount}** or **unlocked {amount}** | Avoid "won" framing |
| Real prizes. Real winners. | **Real Rewards. Real Members.** | Hero / section headings |
| Major Draw / Major Reward / Grand Prize | **Featured Bonus Draw** or **Featured Reward** | Pick one term and lock it |
| Major Reward Draw | **Featured Bonus Draw** | Dashboard tag |
| Prize (any context) | **Reward** | Always |
| Prize Details (tab) | **Reward Details** | Tab heading |
| `landingPrizeSliderImages` displayed as "Prize Slider" | **Reward Slider** | Display only |
| Odds / chance / lucky | (remove or rephrase) | "fair, transparent, capped participation" — never "odds" |
| Limited entries for better odds | **Limited Entries — fair for every Member** | Homepage, FAQ |

### 3.4 Concrete line-level rewrites (visible copy)

Every line below is a real string in the codebase today. Each row is a discrete commit candidate.

#### Header / global
| File:Line | Current | Rewrite |
|---|---|---|
| `components/Header.tsx:157` | `Credits: {credits}` | `Points: {points}` (or `{points} Points`) |

#### Homepage (`app/page.tsx`)
| Line | Current | Rewrite |
|---|---|---|
| 231 | `Choose your membership plan — UniOne, UniPlus, or UniMax — and instantly unlock your monthly UniCash Credits.` | `Choose your Membership plan — UniOne, UniPlus, or UniMax — and instantly unlock your monthly Points.` |
| 250 | `Your membership gives you free entries to the Grand Prize every month.` | `Your Membership includes free Bonus Draw Entries every month.` |
| 261 | `Use Credits to Enter Bonus Draws` | `Use Points to Enter Bonus Draws` |
| 279 | `Spend your UniCash Credits to join limited-entry Bonus Draws.` | `Use your Points to join limited-Entry Bonus Draws.` |
| 298 | `Each draw has a fixed entrant cap and a one-entry-per-member rule to keep the odds fair and transparent.` | `Each Bonus Draw has a fixed entrant cap and a one-Entry-per-Member rule to keep participation fair and transparent.` |
| 309 | `Verified Draw & Public Winners` | `Verified Bonus Draws & Public Reward Recipients` |
| 376 | `Choose a plan, get monthly credits, and unlock every member draw.` | `Choose a plan, get monthly Points, and unlock every Member Bonus Draw.` |
| 442 | `Bonus Draws are members-only with strictly limited entries/entrants for better odds. Credits are used to enter Bonus Draws; the required credits per entry vary by draw and are clearly shown before you enter. Boost Packs are one-time purchases (no auto-renew) and credits never expire.` | `Bonus Draws are Members-only with strictly limited Entries for fair participation. Points are used to enter Bonus Draws; the Points required per Entry vary by Bonus Draw and are clearly shown before you enter. Point Boosters are one-time purchases (no auto-renew) and Points never expire.` |
| 454 | `Enjoy weekly giveaways with odds and verified results. Limited entries — one per member, fair for everyone.` | `Enjoy weekly Bonus Draws with verified results. Limited Entries — one per Member, fair for everyone.` |
| 467 (dashboard ref) | `Major Draw` | `Featured Bonus Draw` |
| 516 | `{draw.title \|\| 'Major Reward Draw'}` | `{draw.title \|\| 'Featured Bonus Draw'}` |

#### Bonus Draw cards & detail
| File:Line | Current | Rewrite |
|---|---|---|
| `components/DrawCard.tsx:268` | `{creditsPerEntry} Credit = 1 entry` | `{creditsPerEntry} Points = 1 Entry` |
| `components/FeaturedBonusDraw.tsx:165` | `{featuredDraw.costPerEntry} Credits = 1 entry` | `{featuredDraw.costPerEntry} Points = 1 Entry` |
| `components/FeaturedBonusDraw.tsx:182` | `Entries Progress` | `Bonus Draw Entries` (or keep "Entries Progress" in a clear bonus-draw context) |
| `app/giveaways/[id]/page.tsx:414` | `{draw.costPerEntry} credits = 1 entry` | `{draw.costPerEntry} Points = 1 Entry` |

#### Confirm Entry Modal (`components/ConfirmEntryModal.tsx`)
| Line | Current | Rewrite |
|---|---|---|
| 207 | `This draw requires <strong>{draw.costPerEntry} credits</strong>. Do you want to enter now?` | `This Bonus Draw requires <strong>{draw.costPerEntry} Points</strong>. Do you want to enter now?` |
| 280 (comment) | `{/* Not Enough Credits Warning */}` | `{/* Not Enough Points Warning */}` |
| 297 | `Not enough credits. Buy a Boost Pack to continue.` | `Not enough Points. Buy a Point Booster to continue.` |
| 319 | `This draw is sold out. Your credits were not used.` | `This Bonus Draw is sold out. Your Points were not used.` |
| 341 | `This draw has closed. Your credits were not used.` | `This Bonus Draw has closed. Your Points were not used.` |

#### Point Boosters page (`components/BoostPackCard.tsx`, `components/BoostPacksClient.tsx`)
| File:Line | Current | Rewrite |
|---|---|---|
| `BoostPackCard.tsx:204` | `<span> Credits</span>` | `<span> Points</span>` |
| `BoostPackCard.tsx:215` | `One-time purchase • Credits never expire` | `One-time purchase • Points never expire` |
| `BoostPacksClient.tsx:44` | `Choose your Boost Pack` | `Choose your Point Booster` |
| `BoostPacksClient.tsx:45` | `One-time purchases. No auto-renew. Credits never expire.` | `One-time purchases. No auto-renew. Points never expire.` |
| `BoostPacksClient.tsx:74-76` | `Boost Packs are members-only … Credits can be used … Credits are user-specific … audit trails of entry transactions and credit balances.` | `Point Boosters are Members-only … Points can be used … Points are user-specific … audit trails of Entry transactions and Point balances.` |
| `BoostPacksClient.tsx:105` | `Credits credited instantly` | `Points added instantly` |
| `BoostPacksClient.tsx:117` | `Open draw shows "2 Credits = 1 entry"` | `Open Bonus Draw shows "2 Points = 1 Entry"` |
| `BoostPacksClient.tsx:130` | `Choose a plan, get monthly credits, and unlock every member draw.` | `Choose a plan, get monthly Points, and unlock every Member Bonus Draw.` |
| `BoostPacksClient.tsx:136-165` (FAQ) | "Boost Packs are one-time credit bundles…" / "Do Boost credits expire?" / "How are Boost credits different from Membership credits?" / etc. | Replace **every** occurrence of "Boost Pack" → "Point Booster", "Boost credits" → "Booster Points", "Membership credits" → "Membership Points", "credits" → "Points", "draw" → "Bonus Draw" |

#### Bonus Draws list (`components/GiveawaysClient.tsx`)
| Line | Current | Rewrite |
|---|---|---|
| 100 | `Choose your UniCash plan — UniOne, UniGo, or UniMax — and instantly receive your monthly credits!` | `Choose your UniCash Membership plan — UniOne, UniGo, or UniMax — and instantly receive your monthly Points.` |
| 108 | `Credits Credited Instantly` | `Points Added Instantly` |
| 120 | `Open draw shows "2 Credits = 1 entry"` | `Open Bonus Draw shows "2 Points = 1 Entry"` |
| 138 | `… instantly receive monthly credits to join draws.` | `… instantly receive monthly Points to enter Bonus Draws.` |
| 141 | `What happens when I use my credits to enter a draw?` | `What happens when I use my Points to enter a Bonus Draw?` |
| 142 | `Each entry uses the listed amount of credits (e.g. 10 Credits = 1 Entry)…` | `Each Entry uses the listed amount of Points (e.g. 10 Points = 1 Entry)…` |
| 145 | `What if I don't have enough credits?` | `What if I don't have enough Points?` |
| 146 | `You can buy a Boost Pack anytime to top up. Purchased Boost Credits never expire…` | `You can buy a Point Booster anytime to top up. Purchased Booster Points never expire…` |

#### Membership cards (`components/MembershipCard.tsx`)
| Line | Current | Rewrite |
|---|---|---|
| 177 | `+{value} free {unit \|\| 'credits'} / month` | `+{value} {unit \|\| 'Points'} / month` |
| 461 | `+{plan.freeCreditsPerPeriod} free credits / month` | `+{plan.freeCreditsPerPeriod} Points / month` |
| 131 (comment) | `// If same tier and price but more credits, it's an upgrade` | `// If same tier and price but more Points, it's an upgrade` (cosmetic — comments optional) |

#### Recent Members / Major Reward
| File:Line | Current | Rewrite |
|---|---|---|
| `app/winners/page.tsx:89` | `Real people winning real prizes — see the proof!` | `Real people earning real Rewards — see the proof.` |
| `app/winners/page.tsx:154` | `won <span>{winner.prizeAmount} {winner.prizeType}</span>` | `received <span>{winner.prizeAmount} {winner.prizeType}</span>` |
| `app/major-reward/page.tsx:53` | `Real prizes. Real Winners` | `Real Rewards. Real Members.` |
| `app/major-reward/page.tsx:144` | `Prize` (table heading) | `Reward` |
| `components/GrandPrizeSection.tsx:106` | `Real prizes. Real odds. Real winners.` | `Real Rewards. Real Members. Real outcomes.` |
| `components/RecentWinnersSection.tsx` (section heading copy) | "Recent Winners" | `Recent Members` or `Reward Recipients` (pick one) |

#### Bonus Draw Entries page (`app/draws/[id]/entries/page.tsx`)
| Line | Current | Rewrite |
|---|---|---|
| 209 | `Ticket #` | `Entry #` |
| 230-231 | renders `entry.ticketNumber` | **Keep field reference**; only the visible label changes |

#### Inclusions tiers data (`lib/landingInclusionsTiers.ts`)
| Line | Current | Rewrite |
|---|---|---|
| 17, 28, 39, 50, 61 | `' into the giveaway'` | `' into the Bonus Draw'` |

#### Dashboard
| File:Line | Current | Rewrite |
|---|---|---|
| `app/dashboard/page.tsx:467` | `Major Draw` | `Featured Bonus Draw` |
| `app/dashboard/page.tsx:516` | `'Major Reward Draw'` (fallback) | `'Featured Bonus Draw'` |
| `app/dashboard/profile/page.tsx:103` | `… updates on bonus draws and winners.` | `… updates on Bonus Draws and Reward Recipients.` |
| `app/dashboard/profile/page.tsx:324` | same as above | same as above |

#### Strings allowed to stay (Category C — not violations)
| File:Line | String | Why allowed |
|---|---|---|
| `components/StripeCheckoutForm.tsx:357` | `{/* Credit/Debit Card Option */}` | Real payment-method name |
| `components/StripeCheckoutForm.tsx:371` | `Credit/ Debit Card` | Real payment-method name |
| `IMPLEMENTATION_SUMMARY.md:44` | `Apple Pay, Google Pay, and Credit Card payment options` | Doc text — payment instrument |
| `*.tsx` (any) | `animate-spin`, `rounded-full`, `border-spin` etc. | Tailwind utility — not the gambling word |

### 3.5 URL routes — keep or rename?

| Route | Recommendation | Display label |
|---|---|---|
| `/giveaways` | **Keep** for SEO | "Bonus Draws" |
| `/giveaways/[id]` | **Keep** | "Bonus Draw — {title}" |
| `/draws/[id]/entries` | **Keep** | "My Bonus Draw Entries" |
| `/boost-packs` | **Keep** | "Point Boosters" |
| `/winners` | **Keep** | "Recent Members" or "Reward Recipients" |
| `/major-reward` | **Keep** | "Featured Reward" |
| `/win/[slug]` | **Keep** | reframe copy — no lottery language |
| `/win/purchase-success` | **Keep** | "Purchase Successful" |

**Rule:** URLs do not change in this redesign. Only visible copy and display labels change. URL renames + redirect rules are a separate Phase 2 task that must be coordinated with SEO and any external links.

### 3.6 Forbidden in copy (zero tolerance)

`credit` / `credits` (as reward currency), `ticket` / `tickets`, `lottery`, `raffle`, `gamble` / `gambling`, `jackpot`, `casino`, `bet` / `betting`, `lucky`, `odds`, `chance to win`, "spin to win". Pre-commit grep on changed files:

```bash
grep -niE "\b(credit|credits|ticket|tickets|lottery|raffle|gamble|gambling|jackpot|casino|bet|betting|lucky|odds)\b" <changed-files>
```

Allowed exceptions (must be visually verified):
- `credit card` / `Credit/Debit Card` — real payment method
- `animate-spin` — Tailwind utility class
- `creditsPerEntry`, `costPerEntry`, `membershipCredits`, `boostCredits`, `freeCreditsPerPeriod`, `ticketNumber`, `prizeAmount`, `prizeType`, `prizeImage`, `landingPrize*`, `getCredits`, `getCreditLedger`, `BoostPack*`, `GrandPrize*`, `RecentWinners*`, `Major*`, `/winners*`, `/entries*`, `/users/credits`, `/users/me/credit-ledger`, `/membership/boost-packs` — Logic Lock symbols / API URLs

### 3.7 Rewrite workflow (per redesigned page)

1. Make UI changes on `redesign/<page>` branch.
2. Run the grep above against your diff.
3. For each hit, classify as **Category A** (rewrite per §3.4) or **Category B/C** (keep — leave a code comment if non-obvious).
4. Verify `npm run build` passes.
5. Verify mobile (≤ 380px), loading, empty, success, error states.
6. Commit with message: `redesign(<page>): <summary> — terminology pass`.

### 3.8 Capitalization conventions

| Term | Capitalized? | When |
|---|---|---|
| Membership | Title-case | Always when referring to the product feature |
| Points | Title-case | Always when referring to the reward currency |
| Bonus Draw / Bonus Draws | Title-case | Always when referring to the product |
| Point Booster / Point Boosters | Title-case | Always |
| Fuel Rewards | Title-case | Always |
| Scan Receipts | Title-case (when used as a feature name) | When labelling the action/feature; lowercase in mid-sentence verbs ("scan a receipt") |
| Redeem Gift Cards | Title-case (feature) | Same |
| Entry / Entries | Title-case when standalone, lowercase inside a sentence ("one entry per member") | Either is acceptable; default Title-case for headings/CTA |
| Member / Members | Title-case when referring to the user role | Always in copy that distinguishes Members from non-Members |
| Reward / Rewards | Title-case | Always replacing "prize" |
| Reward Recipients | Title-case | Replaces "Winners" as a section heading |

---

## 4. Design token audit

### 4.1 Current state — `tailwind.config.ts`
The `primary` palette is **wrong** — it points to Tailwind's default purple (`#8b5cf6` at 500), not UNICASH brand purple `#6356E5`.

```ts
primary: { 500: '#8b5cf6', 600: '#7c3aed', ... }   // ← Tailwind default
accent:  { 500: '#6366f1' }                         // ← Indigo, not brand
```

### 4.2 Current state — `globals.css`
Brand color `#6356E5` is leaked in via overrides on `bg-purple-600` / `text-purple-600` and on `.btn-primary` / `.btn-secondary`. This is fragile — the codebase uses Tailwind's `purple-*` and `indigo-*` interchangeably, which means brand consistency depends on CSS overrides rather than the token system.

### 4.3 UNICASH canonical palette (per master instructions)

| Token | Hex |
|---|---|
| Primary | `#6356E5` |
| Primary hover | `#5648D8` |
| Gradient end | `#8B7BFF` |
| Soft purple bg | `#F6F4FF` |
| Soft lavender section bg | `#FBFAFF` |
| Border / stroke | `#E7E9F2` |
| Main text | `#0F1222` |
| Secondary text | `#667085` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |

### 4.4 Existing button system
`globals.css` already defines a 10-button pill system (`.btn-primary`, `.btn-secondary`, `.btn-orange`, `.btn-purple-dark`, `.btn-white`, `.btn-outline-purple`, `.btn-outline-black`, `.btn-purple-light`, `.btn-gray-light`, `.btn-green-light`, `.btn-red-light`) plus card and gradient utilities. **Reuse `.btn-primary` and `.btn-secondary` (rounded-full pills)** as the canonical buttons. Do not introduce new button styles.

Reference: `BUTTON_DESIGN_SYSTEM.md` exists in repo — read before changing button visuals.

---

## 5. Logic Lock — DO NOT TOUCH

These files contain auth, payments, API plumbing, or business logic. **Read-only.** No refactor, no rename, no "while I'm here" cleanup.

### 5.1 Backend
- `unicash-api/` — entire folder. Out of scope.

### 5.2 Frontend infrastructure
- `unicash-web/contexts/AuthContext.tsx` — JWT, localStorage, refreshUser. **Field names like `membershipCredits` / `boostCredits` stay** (they map to API). Only the *displayed label* becomes "Points".
- `unicash-web/lib/api.ts` — All Axios endpoints, including `/users/credits` and `/users/me/credit-ledger`. URLs stay.
- `unicash-web/lib/deviceFingerprint.ts`
- `unicash-web/lib/membershipPaymentRetry.ts`
- `unicash-web/lib/australianPhone.ts`
- `unicash-web/lib/timezone.ts`
- `unicash-web/components/StripeCheckoutForm.tsx`
- `unicash-web/next.config.js`, `tsconfig.json`, `vercel.json`, `package.json`, `.eslintrc.json`, `postcss.config.js`

### 5.3 Critical state machines (do not redesign the logic — only the visuals)
- **Auth flow:** login → token → fetchUser → refresh → 401 handling
- **Stripe payment:** intent creation → confirmation → success/failure
- **Membership lifecycle:** active / paused / canceled / payment-failed states (see `ConfirmEntryModal.tsx` lines 100–110 — payment-failed blocks entry even if Points exist)
- **Bonus Draw entry:** insufficient Points / sold out / closed / membership required
- **Membership vs Point Booster split:** Membership = recurring subscription, Point Booster = one-time purchase. Never blur.

---

## 6. File classification

### 6.1 SAFE — Redesign freely (visual + copy only)

**Pages**
- `app/page.tsx` (homepage)
- `app/about/page.tsx`
- `app/contact/page.tsx`
- `app/faq/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/thank-you/page.tsx`
- `app/winners/page.tsx`
- `app/major-reward/page.tsx`
- `app/giveaways/page.tsx` (list page only)
- `app/boost-packs/page.tsx`

**Components**
- `Footer.tsx`
- `BannerSlider.tsx`, `ImageSlider.tsx`
- `LandingHeroPicture.tsx`, `LandingInclusionsPanel.tsx`, `LandingPrizeSlider.tsx`
- `NewsletterSection.tsx`
- `PaymentTrustStrip.tsx`
- `RecentWinnersSection.tsx`
- `GrandPrizeSection.tsx`
- `FeaturedBonusDraw.tsx`
- `GiveawayDetailCards.tsx`, `GiveawaysClient.tsx`, `BoostPacksClient.tsx`
- `ScrollReveal.tsx`, `ScrollToTop.tsx`

**Tokens / styles**
- `app/globals.css` — palette + button system (extend, don't break existing classes)
- `tailwind.config.ts` — fix `primary` to `#6356E5`

### 6.2 CAUTION — Redesign UI but preserve props, state, API calls

These components mix UI with business logic. Restyle freely; do not rename props, change state shape, or remove conditional branches.

**Components**
- `Header.tsx` — reads `credits` from auth → label becomes "Points"
- `MembershipCard.tsx` — upgrade detection logic
- `BoostPackCard.tsx` — purchase + auth checks
- `DrawCard.tsx` — status states (available/sold out/closed)
- `ConfirmEntryModal.tsx` — payment-failed gating (lines 100–110), insufficient Points, sold out, closed
- `MembershipRequiredModal.tsx`
- `MajorDrawCheckoutModal.tsx`
- `MembershipLandingCheckoutModal.tsx`
- `UpdateCardModal.tsx`
- `PaymentMethodsPanel.tsx`
- `ChangePasswordModal.tsx`
- `Countdown.tsx`

**Pages**
- `app/login/page.tsx` (380+ lines, multiple flows)
- `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
- `app/checkout/page.tsx`, `app/checkout/success/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/membership/page.tsx`
- `app/dashboard/entries/page.tsx`
- `app/dashboard/purchases/page.tsx`
- `app/dashboard/billing/page.tsx`, `app/dashboard/security-billing/page.tsx`
- `app/dashboard/profile/page.tsx`, `app/dashboard/password/page.tsx`
- `app/draws/[id]/entries/page.tsx` (contains `Ticket #` — rewrite copy)
- `app/giveaways/[id]/page.tsx`
- `app/win/[slug]/page.tsx`, `app/win/purchase-success/page.tsx`
- `app/lp/[slug]/page.tsx` (CMS-driven, careful)

### 6.3 NO TOUCH — Read-only
See §5 above.

---

## 7. Missing UNICASH product surfaces

Master instructions specify product features that **do not yet exist in this repo**:

| Feature | Status | Action |
|---|---|---|
| **Fuel Rewards** | Not present | Will need new UI when built. Out of redesign scope until backend supports it. |
| **Scan Receipts / Receipt Scanning** | Not present | Same as above. New feature, not redesign. |
| **Redeem Gift Cards** | Not present | Same as above. New feature. |

The redesign focuses on what exists today: Membership, Points (currently "credits"), Bonus Draws (currently "draws/giveaways"), Point Boosters (currently "boost packs"). Fuel Rewards / Scan Receipts / Gift Cards are noted for a future phase.

---

## 8. Redesign priority order

1. **Foundation pass** — Fix `tailwind.config.ts` primary palette + audit `globals.css` overrides. Confirm `.btn-primary` / `.btn-secondary` are canonical.
2. **Homepage** (`app/page.tsx`) — Highest-traffic, most terminology violations, sets tone for everything else.
3. **Header + Footer** — Visible everywhere. Header has the `credits` → Points rename.
4. **Bonus Draws list + detail** (`app/giveaways/page.tsx`, `app/giveaways/[id]/page.tsx`, `DrawCard.tsx`) — Core product surface.
5. **Point Boosters page** (`app/boost-packs/page.tsx`, `BoostPackCard.tsx`) — Core monetization.
6. **Membership page** (`app/dashboard/membership/page.tsx`, `MembershipCard.tsx`) — Subscription clarity.
7. **Dashboard overview + entries** — Logged-in core.
8. **Auth flows** (login / forgot / reset) — Trust + conversion.
9. **Checkout + success** — Payment trust.
10. **Static** (about, faq, terms, privacy, contact, thank-you, winners, major-reward).

Each step ends with: grep for forbidden terms → confirm `npm run build` still compiles → commit on a `redesign/<page>` branch.

---

## 9. Safety checklist (before any redesign commit)

- [ ] Working on a branch named `redesign/<page-name>` — never `main`
- [ ] No file in §5.2 has been modified
- [ ] No prop names, state shapes, or API URLs renamed
- [ ] `grep -i -E "credit|ticket|lottery|raffle|jackpot|gamble"` on changed files returns zero hits in **visible copy** (excluding `animate-spin`, internal field names, API URLs)
- [ ] Buttons reuse `.btn-primary` / `.btn-secondary` from `globals.css`
- [ ] All four states accounted for: default, loading, empty, error (and where relevant: success, disabled, sold out, closed, insufficient points, membership required)
- [ ] Mobile layout verified at ≤ 380px width
- [ ] `npm run build` passes
- [ ] Brand purple `#6356E5` used; no neon, no casino effects, no loud red urgency

---

## 10. Open questions for product owner

Before starting page-by-page redesign:

1. Do we keep URL paths `/giveaways`, `/boost-packs`, `/winners`, `/draws/...` for SEO, or migrate to `/bonus-draws`, `/point-boosters`, etc. (with redirects)?
2. Are Fuel Rewards, Scan Receipts, Gift Card Redemption coming in this phase, or strictly future?
3. Is `RecentWinnersSection.tsx` staying (rebranded), or being deprecated in favor of a less lottery-coded "Recent Members" surface?
4. Can `lib/api.ts` endpoint URLs be renamed server-side later (`/users/credits` → `/users/points`), or is the contract frozen?
