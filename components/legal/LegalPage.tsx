/**
 * Shared layout + renderer for UNICASH legal pages.
 *
 * Phase A — baseline + override pattern:
 *
 *   1. Fetch the published override from the API
 *      (`GET /api/legal/overrides/:slug`). If 200, render that content.
 *      Admin can edit/publish without a code deploy.
 *
 *   2. If the API returns 404 (no published override) or the fetch
 *      fails, fall back to the bundled `.md` baseline at
 *      `unicash-web/content/legal/{slug}.md` (lawyer-reviewed,
 *      Git-versioned).
 *
 * Styling matches the canonical UNICASH legal-page tokens (lavender bg,
 * eyebrow + H1, 14.5px prose, #6356E5 brand link colour, rounded-2xl
 * support card at the bottom).
 *
 * Both content sources (override + baseline) share the same Markdown
 * header-strip + cross-reference preprocessing logic and the same
 * ReactMarkdown component mappings. Admin authors and lawyer authors
 * write in the same dialect.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type LegalSlug = 'terms' | 'privacy' | 'refund';

const TITLE: Record<LegalSlug, string> = {
  terms: 'Terms and Conditions',
  privacy: 'Privacy Policy',
  refund: 'Refund Policy',
};

const EYEBROW: Record<LegalSlug, string> = {
  terms: 'Legal',
  privacy: 'Privacy',
  refund: 'Legal',
};

const LAST_UPDATED: Record<LegalSlug, string> = {
  terms: '2026-05-25',
  privacy: '2026-05-25',
  refund: '2026-05-25',
};

/** Map bare-bracket cross-references in the markdown to real routes/mailtos. */
function preprocess(content: string): string {
  return content
    .replace(/\[UNICASH Terms and Conditions\](?!\()/g, '[UNICASH Terms and Conditions](/terms)')
    .replace(/\[UNICASH Privacy Policy\](?!\()/g, '[UNICASH Privacy Policy](/privacy)')
    .replace(/\[UNICASH Refund Policy\](?!\()/g, '[UNICASH Refund Policy](/legal/refund-policy)')
    .replace(/\[Terms and Conditions\](?!\()/g, '[Terms and Conditions](/terms)')
    .replace(/\[Privacy Policy\](?!\()/g, '[Privacy Policy](/privacy)')
    .replace(/\[Refund Policy\](?!\()/g, '[Refund Policy](/legal/refund-policy)')
    .replace(/\[support@unicash\.com\.au\](?!\()/g, '[support@unicash.com.au](mailto:support@unicash.com.au)')
    .replace(/\[privacy@unicash\.com\.au\](?!\()/g, '[privacy@unicash.com.au](mailto:privacy@unicash.com.au)')
    .replace(/\[security@unicash\.com\.au\](?!\()/g, '[security@unicash.com.au](mailto:security@unicash.com.au)')
    .replace(/\[unicash\.com\.au\](?!\()/g, '[unicash.com.au](https://unicash.com.au)')
    .replace(/\[unicash\.com\.au\/privacy\](?!\()/g, '[unicash.com.au/privacy](/privacy)')
    .replace(/\[unicash\.com\.au\/legal\/refund-policy\](?!\()/g, '[unicash.com.au/legal/refund-policy](/legal/refund-policy)');
}

/**
 * Strip the metadata header (everything up to and including the first ---
 * separator) and apply cross-reference preprocessing.
 *
 * Used for both override content (from API) and baseline (from .md file)
 * so authors write in the same dialect either way.
 */
function normaliseMarkdown(raw: string): string {
  const headerMatch = raw.match(/^---\s*$/m);
  if (!headerMatch || headerMatch.index === undefined) {
    return preprocess(raw);
  }
  const body = raw.slice(headerMatch.index + headerMatch[0].length).trimStart();
  return preprocess(body);
}

function loadBaseline(slug: LegalSlug): string {
  const filePath = join(process.cwd(), 'content', 'legal', `${slug}.md`);
  const raw = readFileSync(filePath, 'utf-8');
  return normaliseMarkdown(raw);
}

/**
 * Fetch a published admin override from the API.
 *
 * - Returns the markdown body + published_at if a published row exists.
 * - Returns null on 404 (no override) or on any fetch/parse error
 *   (network blip, API down). The page then falls back to baseline.
 *
 * `next: { revalidate: 60 }` makes Next.js cache the response for up to
 * 60s between requests. Admin can also trigger an on-demand revalidate
 * via a webhook after publish if a faster propagation is needed.
 */
async function fetchOverride(
  slug: LegalSlug,
): Promise<{ content: string; publishedAt: string | null; version: number } | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
    'http://localhost:3000/api';
  const url = `${baseUrl}/legal/overrides/${slug}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      // 404 = no published override (expected); 5xx = transient (fall back).
      return null;
    }
    const json = (await res.json()) as {
      markdown_content?: string;
      published_at?: string | null;
      version?: number;
    };
    if (!json?.markdown_content) {
      return null;
    }
    return {
      content: normaliseMarkdown(json.markdown_content),
      publishedAt: json.published_at ?? null,
      version: json.version ?? 1,
    };
  } catch {
    return null;
  }
}

interface LegalPageProps {
  slug: LegalSlug;
}

export default async function LegalPage({ slug }: LegalPageProps) {
  const override = await fetchOverride(slug);
  const content = override ? override.content : loadBaseline(slug);

  const title = TITLE[slug];
  const eyebrow = EYEBROW[slug];
  // If an admin override is published, show its publishedAt; else the
  // baseline last-updated date.
  const lastUpdated = override?.publishedAt
    ? new Date(override.publishedAt).toISOString().slice(0, 10)
    : LAST_UPDATED[slug];

  return (
    <main className="bg-[#FBFAFF] py-16">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222] sm:text-[42px]">
          {title}
        </h1>
        <p className="mt-3 text-[14px] text-[#667085]">Last updated: {lastUpdated}</p>

        <article className="mt-10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mt-12 text-[26px] font-extrabold tracking-tight text-[#0F1222]">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-10 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-6 text-[16px] font-bold tracking-tight text-[#0F1222]">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#3F445C]">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mt-3 list-disc space-y-1.5 pl-6 text-[14.5px] leading-relaxed text-[#3F445C]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-[14.5px] leading-relaxed text-[#3F445C]">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="pl-1">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-bold text-[#0F1222]">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-[#0F1222]">{children}</em>
              ),
              a: ({ href, children }) => {
                if (!href) {
                  return <span>{children}</span>;
                }
                const isExternal = href.startsWith('http');
                const isMail = href.startsWith('mailto:');
                if (isExternal || isMail) {
                  return (
                    <a
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="font-semibold text-[#6356E5] underline-offset-2 hover:underline"
                    >
                      {children}
                    </a>
                  );
                }
                return (
                  <Link
                    href={href}
                    className="font-semibold text-[#6356E5] underline-offset-2 hover:underline"
                  >
                    {children}
                  </Link>
                );
              },
              hr: () => <hr className="my-10 border-t border-[#E0DAFF]" />,
              blockquote: ({ children }) => (
                <blockquote className="mt-6 rounded-2xl border border-[#E0DAFF] bg-white p-5 text-[14px] leading-relaxed text-[#3F445C]">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        <div className="mt-14 rounded-2xl border border-[#E0DAFF] bg-white p-5 sm:p-6">
          <p className="text-[13px] font-extrabold tracking-tight text-[#0F1222]">
            Questions about this document?
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[#4B5563]">
            UNICASH support is based in Australia. Email{' '}
            <a
              href="mailto:support@unicash.com.au"
              className="font-semibold text-[#6356E5] underline-offset-2 hover:underline"
            >
              support@unicash.com.au
            </a>{' '}
            or visit the{' '}
            <Link
              href="/contact"
              className="font-semibold text-[#6356E5] underline-offset-2 hover:underline"
            >
              Contact page
            </Link>
            .
          </p>
        </div>

        <p className="mt-10 text-[12px] text-[#667085]">
          UNICASH Pty Ltd · ABN 90 693 062 538 · 45 St Georges Terrace, Perth WA 6000.
        </p>
      </div>
    </main>
  );
}
