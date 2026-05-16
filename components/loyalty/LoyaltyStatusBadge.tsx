/**
 * LoyaltyStatusBadge — Bronze/Silver/Gold/Platinum chip.
 *
 * Palette decisions (premium, not gambling):
 *   - Bronze    → warm copper on cream
 *   - Silver    → cool grey on soft white
 *   - Gold      → UNICASH gold gradient
 *   - Platinum  → deep purple→gold + crown icon for the celebratory feel
 *
 * Used wherever we want to surface the member's tier status — dashboard
 * header, profile, /account/loyalty hero, AnniversaryModal celebration.
 */

'use client';

import { Award, Crown, Gem, Star } from 'lucide-react';
import type { LoyaltyStatus } from './types';

interface Props {
  status: LoyaltyStatus;
  /** "default" tweaked for inline · "lg" for hero header. */
  size?: 'default' | 'lg';
  /** Force-hide the status icon. */
  hideIcon?: boolean;
  className?: string;
}

const STYLE: Record<
  Exclude<LoyaltyStatus, 'none'>,
  { bg: string; text: string; ring: string; icon: any; label: string }
> = {
  bronze: {
    bg: 'bg-[#FBEEDD]',
    text: 'text-[#7A4B16]',
    ring: 'ring-1 ring-[#E9C99B]',
    icon: Award,
    label: 'Bronze',
  },
  silver: {
    bg: 'bg-[#EDF0F5]',
    text: 'text-[#4B5563]',
    ring: 'ring-1 ring-[#D1D5DB]',
    icon: Star,
    label: 'Silver',
  },
  gold: {
    bg: 'bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D]',
    text: 'text-[#1A1432]',
    ring: 'ring-1 ring-[#F0BD6A]',
    icon: Gem,
    label: 'Gold',
  },
  platinum: {
    bg: 'bg-gradient-to-r from-[#1A1432] via-[#6356E5] to-[#FFC85D]',
    text: 'text-white',
    ring: 'ring-1 ring-[#1A1432]/30',
    icon: Crown,
    label: 'Platinum',
  },
};

export function LoyaltyStatusBadge({
  status,
  size = 'default',
  hideIcon = false,
  className = '',
}: Props) {
  if (status === 'none') return null;
  const s = STYLE[status as keyof typeof STYLE];
  const IconCmp = s.icon;

  const sizing =
    size === 'lg'
      ? 'gap-1.5 px-3.5 py-1.5 text-[13px]'
      : 'gap-1 px-2.5 py-1 text-[11.5px]';

  return (
    <span
      className={`inline-flex items-center rounded-full font-extrabold tracking-tight shadow-[0_1px_2px_rgba(15,18,34,.06)] ${sizing} ${s.bg} ${s.text} ${s.ring} ${className}`}
      aria-label={`Loyalty status: ${s.label}`}
    >
      {!hideIcon && (
        <IconCmp
          className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'}
          aria-hidden
          strokeWidth={size === 'lg' ? 2.25 : 2.5}
        />
      )}
      <span>{s.label}</span>
    </span>
  );
}
