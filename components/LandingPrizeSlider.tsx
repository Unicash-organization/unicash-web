'use client';

import React, { useRef, useState } from 'react';
import { getImageUrl } from '@/lib/imageUrl';

const ChevronIcon = ({ dir, className = '' }: { dir: 'left' | 'right'; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {dir === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
  </svg>
);

const SWIPE_THRESHOLD = 50; // px — minimum horizontal travel to commit a swipe
const VERTICAL_TOLERANCE = 60; // px — if user moves more than this vertically, treat as scroll

export default function LandingPrizeSlider({ urls }: { urls: string[] }) {
  const [i, setI] = useState(0);
  const [dragX, setDragX] = useState(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lockedAxisRef = useRef<'h' | 'v' | null>(null);

  if (!urls.length) return null;
  const safe = ((i % urls.length) + urls.length) % urls.length;
  const src = getImageUrl(urls[safe]);

  const goPrev = () => setI((x) => x - 1);
  const goNext = () => setI((x) => x + 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (urls.length <= 1) return;
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    lockedAxisRef.current = null;
    setDragX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startRef.current || urls.length <= 1) return;
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;

    // Lock axis on first significant movement so we don't fight vertical scroll.
    if (!lockedAxisRef.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        lockedAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
    }

    if (lockedAxisRef.current === 'h') {
      // Swallow the gesture so the page doesn't scroll horizontally.
      if (Math.abs(dy) < VERTICAL_TOLERANCE) {
        setDragX(dx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!startRef.current) return;
    if (lockedAxisRef.current === 'h') {
      if (dragX <= -SWIPE_THRESHOLD) goNext();
      else if (dragX >= SWIPE_THRESHOLD) goPrev();
    }
    startRef.current = null;
    lockedAxisRef.current = null;
    setDragX(0);
  };

  // Slight visual nudge while dragging so the swipe feels alive.
  const dragTransform =
    dragX !== 0 ? `translate3d(${Math.max(-80, Math.min(80, dragX * 0.3))}px,0,0)` : undefined;

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-[#E0DAFF] shadow-[0_18px_40px_-20px_rgba(99,86,229,0.35)] bg-[#F4F1FB] touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="w-full aspect-[16/10] object-cover transition-transform duration-200 ease-out"
        style={{ transform: dragTransform }}
      />
      {urls.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 backdrop-blur text-[#5346D6] shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            onClick={goPrev}
          >
            <ChevronIcon dir="left" className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 backdrop-blur text-[#5346D6] shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
            onClick={goNext}
          >
            <ChevronIcon dir="right" className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {urls.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === safe ? 'w-7 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                }`}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
