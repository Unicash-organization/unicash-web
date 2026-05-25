import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

/**
 * /terms — UNICASH Terms and Conditions
 *
 * Source-of-truth markdown is at `unicash-web/content/legal/terms.md`,
 * mirrored from the canonical `/legal/UNICASH-Terms-and-Conditions.md`
 * at the repo root. The page renders the markdown via the shared
 * <LegalPage> component (Server Component, fs-based, no admin API).
 *
 * Previously this route fetched HTML from `settings.terms_and_conditions`.
 * The API path was removed at v1.4 — markdown is now code-managed and
 * version-controlled with the rest of the app.
 */

export const metadata: Metadata = {
  title: 'Terms and Conditions — UNICASH',
  description:
    'The terms governing UNICASH Membership, Bonus Draws, Major Draws, Point Boosters, Scan Receipts, and Gift Card redemption.',
};

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
