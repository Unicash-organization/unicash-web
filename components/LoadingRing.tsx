'use client';

import React from 'react';

/* -----------------------------------------------------------------------
   LoadingRing — canonical UNICASH v4 loading indicator.
   Crisp SVG spinner with brand-purple arc on lavender track.

   Usage:
     <LoadingRing />                          → "Loading…"
     <LoadingRing label="Checking access" />  → "Checking access…"
     <LoadingRing size="sm" />                → smaller variant for inline use
     <LoadingRing fullscreen />               → centered full-page wrapper

   Honors prefers-reduced-motion.
----------------------------------------------------------------------- */

interface LoadingRingProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { svg: 'h-6 w-6', text: 'text-[12px]' },
  md: { svg: 'h-12 w-12', text: 'text-[13px]' },
  lg: { svg: 'h-16 w-16', text: 'text-[14px]' },
};

export default function LoadingRing({
  label = 'Loading',
  size = 'md',
  fullscreen = false,
  className = '',
}: LoadingRingProps) {
  const sizeCls = SIZE_MAP[size];

  const ring = (
    <div role="status" aria-live="polite" className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <svg
        className={`${sizeCls.svg} animate-spin motion-reduce:animate-none`}
        viewBox="0 0 50 50"
        aria-hidden
      >
        {/* Track — full lavender ring */}
        <circle cx="25" cy="25" r="20" fill="none" stroke="#E0DAFF" strokeWidth="4" />
        {/* Arc — brand-purple sweep with rounded caps */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#6356e5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="78 48"
          strokeDashoffset="0"
        />
      </svg>
      {label && (
        <span className={`${sizeCls.text} font-medium text-[#667085]`}>{label}…</span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        {ring}
      </div>
    );
  }

  return ring;
}
