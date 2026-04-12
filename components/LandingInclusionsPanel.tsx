'use client';

import React, { useState } from 'react';
import { LANDING_INCLUSIONS_TIERS } from '@/lib/landingInclusionsTiers';

export default function LandingInclusionsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 text-violet-700 font-semibold text-sm uppercase tracking-wide hover:text-violet-900"
      >
        SEE ALL INCLUSIONS
        <span className="text-lg leading-none" aria-hidden>
          {open ? '\u25B2' : '\u25BC'}
        </span>
      </button>
      {open && (
        <div className="mt-2 rounded-3xl border-2 border-violet-200/80 bg-white/80 p-6 sm:p-8 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {LANDING_INCLUSIONS_TIERS.slice(0, 3).map((tier) => (
              <div key={tier.name}>
                <h3 className={`font-extrabold text-sm tracking-wide mb-4 ${tier.headClass}`}>{tier.name}</h3>
                <ul className="space-y-3">
                  {tier.lines.map((line, li) => (
                    <li key={li} className="flex gap-2 text-sm text-gray-700 leading-snug">
                      <span className={`shrink-0 mt-0.5 ${tier.checkClass}`}>{'\u2713'}</span>
                      <span>
                        <strong>{line.bold}</strong>
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
                <h3 className={`font-extrabold text-sm tracking-wide mb-4 ${tier.headClass}`}>{tier.name}</h3>
                <ul className="space-y-3">
                  {tier.lines.map((line, li) => (
                    <li key={li} className="flex gap-2 text-sm text-gray-700 leading-snug">
                      <span className={`shrink-0 mt-0.5 ${tier.checkClass}`}>{'\u2713'}</span>
                      <span>
                        <strong>{line.bold}</strong>
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
