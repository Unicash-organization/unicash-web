import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

/**
 * /legal/refund-policy — UNICASH Refund Policy
 *
 * AU-04 (PRE_GOLIVE_REPORT_2026-05-15) — required by AU Consumer Law
 * disclosure + linked from Footer.tsx LEGAL_LINKS.
 *
 * Source-of-truth markdown is at `unicash-web/content/legal/refund.md`,
 * mirrored from the canonical `/legal/UNICASH-Refund-Policy.md` at the
 * repo root. The previous hardcoded SECTIONS array was replaced at v1.1
 * — markdown is now code-managed and version-controlled, rendered via
 * the shared <LegalPage> Server Component.
 */

export const metadata: Metadata = {
  title: 'Refund Policy — UNICASH',
  description:
    'How UNICASH handles refunds for Memberships, Point Boosters, Gift Card redemptions, and Draw entries under Australian Consumer Law.',
};

export default function RefundPolicyPage() {
  return <LegalPage slug="refund" />;
}
