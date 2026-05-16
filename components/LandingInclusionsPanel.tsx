'use client';

import React, { useState } from 'react';
import { LANDING_INCLUSIONS_TIERS } from '@/lib/landingInclusionsTiers';

export default function LandingInclusionsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center justify-center gap-2 rounded-full h-11 px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#6356E5] border border-[#E0DAFF] bg-white hover:border-[#6356E5] hover:bg-[#FBFAFF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
        >
          {open ? 'Hide all inclusions' : 'See all inclusions'}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="mt-4 rounded-3xl border border-[#E0DAFF] bg-white/80 backdrop-blur-[2px] p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(99,86,229,0.25)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {LANDING_INCLUSIONS_TIERS.slice(0, 3).map((tier) => (
              <div key={tier.name}>
                <h3
                  className={`font-extrabold tracking-[0.14em] uppercase text-[12px] mb-4 ${tier.headClass}`}
                >
                  {tier.name}
                </h3>
                <ul className="space-y-2.5">
                  {tier.lines.map((line, li) => (
                    <li
                      key={li}
                      className="flex gap-2 text-[13.5px] sm:text-[14px] text-[#4b5563] leading-snug"
                    >
                      <span
                        className={`shrink-0 mt-0.5 ${tier.checkClass}`}
                        aria-hidden
                      >
                        {'✓'}
                      </span>
                      <span>
                        <strong className="text-[#0f1222] font-semibold">
                          {line.bold}
                        </strong>
                        {line.rest}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10 mt-10 max-w-3xl mx-auto">
            {LANDING_INCLUSIONS_TIERS.slice(3).map((tier) => (
              <div key={tier.name}>
                <h3
                  className={`font-extrabold tracking-[0.14em] uppercase text-[12px] mb-4 ${tier.headClass}`}
                >
                  {tier.name}
                </h3>
                <ul className="space-y-2.5">
                  {tier.lines.map((line, li) => (
                    <li
                      key={li}
                      className="flex gap-2 text-[13.5px] sm:text-[14px] text-[#4b5563] leading-snug"
                    >
                      <span
                        className={`shrink-0 mt-0.5 ${tier.checkClass}`}
                        aria-hidden
                      >
                        {'✓'}
                      </span>
                      <span>
                        <strong className="text-[#0f1222] font-semibold">
                          {line.bold}
                        </strong>
                        {line.rest}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
