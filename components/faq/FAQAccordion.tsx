'use client';

/**
 * Shared FAQAccordion — reusable accordion block for per-page FAQ sections.
 *
 * Visual + a11y mirrors the master /faq accordion in FAQClient.tsx:
 * - rounded-2xl card, brand border on open, hover-bg lavender, ChevronDown
 *   rotates 180° on open
 * - <h3><button> semantics, aria-expanded, aria-controls, focus-visible ring
 * - one-open-at-a-time (radio behaviour)
 *
 * Used by: scan-receipts, boost-packs, giveaways, winners, home.
 * For the master /faq page, the inline accordion in FAQClient.tsx is kept
 * (different presentation — grouped by category + search).
 */

import { useState } from 'react';

export interface FaqItem {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  items: FaqItem[];
  /** Prefix for DOM ids — set per-page so multiple accordions on the same page do not collide. */
  idPrefix?: string;
  /** Index of item that starts open (default: none). */
  defaultOpenIndex?: number;
}

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function FAQAccordion({
  items,
  idPrefix = 'faq',
  defaultOpenIndex,
}: FAQAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(
    defaultOpenIndex !== undefined ? defaultOpenIndex : null,
  );

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const open = openIdx === i;
        const panelId = `${idPrefix}-panel-${i}`;
        const triggerId = `${idPrefix}-trigger-${i}`;
        return (
          <div
            key={`${idPrefix}-${i}`}
            className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
              open
                ? 'border-[#d1cbf5] shadow-[0_10px_30px_-18px_rgba(99,86,229,.35)]'
                : 'border-[#e7e9f2] hover:border-[#d1cbf5]'
            }`}
          >
            <h3>
              <button
                id={triggerId}
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6356e5]"
              >
                <span className="text-[15px] font-semibold tracking-tight text-[#0f1222] sm:text-[15.5px]">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356e5] transition-transform duration-300 ${
                    open ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
              {open && (
                <div className="px-5 pb-5 text-[14px] leading-relaxed text-[#4b5563] sm:text-[14.5px]">
                  {item.a}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
