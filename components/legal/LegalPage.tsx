/**
 * Shared layout + renderer for UNICASH legal pages.
 *
 * Reads markdown source from `unicash-web/content/legal/{slug}.md` at
 * render time (Server Component, Node fs) and pipes the body through
 * ReactMarkdown with custom component mappings that match the canonical
 * UNICASH legal-page styling (lavender bg, eyebrow + H1, 14.5px prose,
 * #6356E5 brand link colour, rounded-2xl support card at the bottom).
 *
 * Source of truth for the markdown lives in the canonical `/legal/`
 * directory at the repo root; copies are mirrored into
 * `unicash-web/content/legal/` so Next.js can read them at build time.
 *
 * The .md files contain a metadata header (version, effective date,
 * legal review note) terminated by the first `---` separator. The
 * loader strips that header — the public page renders body content
 * only and supplies its own title + last-updated via component props.
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

function loadContent(slug: LegalSlug): string {
  const filePath = join(process.cwd(), 'content', 'legal', `${slug}.md`);
  const raw = readFileSync(filePath, 'utf-8');
  // Strip the metadata header (everything up to and including the first --- separator).
  const headerMatch = raw.match(/^---\s*$/m);
  if (!headerMatch || headerMatch.index === undefined) {
    return preprocess(raw);
  }
  const body = raw.slice(headerMatch.index + headerMatch[0].length).trimStart();
  return preprocess(body);
}

interface LegalPageProps {
  slug: LegalSlug;
}

export default function LegalPage({ slug }: LegalPageProps) {
  const content = loadContent(slug);
  const title = TITLE[slug];
  const eyebrow = EYEBROW[slug];
  const lastUpdated = LAST_UPDATED[slug];

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
