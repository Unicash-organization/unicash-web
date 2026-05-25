import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

/**
 * /privacy — UNICASH Privacy Policy
 *
 * Source-of-truth markdown is at `unicash-web/content/legal/privacy.md`,
 * mirrored from the canonical `/legal/UNICASH-Privacy-Policy.md` at the
 * repo root. The page renders via the shared <LegalPage> Server
 * Component.
 *
 * Previously this route fetched HTML from `settings.privacy_policy`.
 * The API path was removed at v1.4 — markdown is now code-managed and
 * version-controlled.
 */

export const metadata: Metadata = {
  title: 'Privacy Policy — UNICASH',
  description:
    'How UNICASH collects, uses, stores, and discloses Personal Information under the Privacy Act 1988 (Cth) and the Australian Privacy Principles.',
};

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
