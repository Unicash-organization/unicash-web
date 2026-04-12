'use client';

import React, { useState } from 'react';
import { getImageUrl } from '@/lib/imageUrl';

export default function LandingPrizeSlider({ urls }: { urls: string[] }) {
  const [i, setI] = useState(0);
  if (!urls.length) return null;
  const safe = ((i % urls.length) + urls.length) % urls.length;
  const src = getImageUrl(urls[safe]);
  return (
    <div className="relative rounded-2xl overflow-hidden border border-violet-200/60 shadow-lg bg-slate-100">
      <img src={src} alt="" className="w-full aspect-[16/10] object-cover" />
      {urls.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-violet-800 shadow hover:bg-white"
            onClick={() => setI((x) => x - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-violet-800 shadow hover:bg-white"
            onClick={() => setI((x) => x + 1)}
          >
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {urls.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === safe ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
