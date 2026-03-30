'use client';

import React from 'react';
import { getImageUrl } from '@/lib/imageUrl';

type Props = {
  /** Stored path or URL — desktop / wide hero */
  desktopPath?: string | null;
  /** Stored path or URL — shown below 768px when set (falls back to desktop) */
  mobilePath?: string | null;
  /** Tailwind classes for the gradient overlay on top of the image */
  overlayClassName: string;
  /** Background when no image is configured */
  fallbackBgClassName?: string;
  children: React.ReactNode;
};

/**
 * Responsive landing hero: optional desktop + mobile assets with a shared overlay.
 */
export default function LandingHeroPicture({
  desktopPath,
  mobilePath,
  overlayClassName,
  fallbackBgClassName = 'bg-gradient-to-b from-slate-200 to-slate-100',
  children,
}: Props) {
  const d = desktopPath ? getImageUrl(desktopPath) : '';
  const m = mobilePath ? getImageUrl(mobilePath) : '';
  const hasImage = !!(d || m);

  return (
    <section className="relative overflow-hidden flex items-center justify-center px-4 sm:px-6 min-h-[200px] sm:min-h-[260px] md:min-h-[300px]">
      {hasImage ? (
        <>
          {d && m ? (
            <picture className="absolute inset-0 z-0 block">
              <source media="(max-width: 767px)" srcSet={m} />
              <img
                src={d}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="eager"
                decoding="async"
              />
            </picture>
          ) : (
            <img
              src={d || m}
              alt=""
              className="absolute inset-0 z-0 h-full w-full object-cover object-center"
              loading="eager"
              decoding="async"
            />
          )}
          <div className={`absolute inset-0 z-[1] ${overlayClassName}`} aria-hidden />
        </>
      ) : (
        <div className={`absolute inset-0 z-0 ${fallbackBgClassName}`} aria-hidden />
      )}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center py-6 sm:py-8 md:py-10">
        {children}
      </div>
    </section>
  );
}
