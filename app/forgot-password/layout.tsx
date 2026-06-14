import type { Metadata } from 'next';

// SEO (Group 1) — keep this private/utility route out of search indexes.
// Belt-and-suspenders with the robots.txt disallow. Passthrough layout: no
// DOM/chrome change, metadata-only.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function NoindexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
