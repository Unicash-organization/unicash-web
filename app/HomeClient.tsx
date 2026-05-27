'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DrawCard from '@/components/DrawCard';
import LoadingRing from '@/components/LoadingRing';
import MembershipCard from '@/components/MembershipCard';
import ScrollReveal from '@/components/ScrollReveal';
import NewsletterSection from '@/components/NewsletterSection';
import ConfirmModal from '@/components/ConfirmModal';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';
import { homeFaqs } from '@/content/faqs';

/* ==========================================================================
   UNICASH Homepage — v4 redesign
   --------------------------------------------------------------------------
   - Visual + section structure mirrors `previews/homepage-v4.html`
   - All API calls, plan upgrade/downgrade logic, and modal flows are preserved
   - Bonus Draw entry, payment, Stripe, auth, and Points calculation are NOT touched
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/*  Inline icon helpers (no extra deps)                                       */
/* -------------------------------------------------------------------------- */

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Coins: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Gift: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M12 7v15M22 11H2M16 7l-4-4-4 4M8 22h8" />
    </svg>
  ),
  Fuel: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="3" x2="15" y1="22" y2="22" />
      <line x1="4" x2="14" y1="9" y2="9" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </svg>
  ),
  ScanLine: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" x2="17" y1="12" y2="12" />
    </svg>
  ),
  UserPlus: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  ),
  BadgeCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  ShieldCheck: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Repeat: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  Ban: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  ),
  Zap: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z" />
    </svg>
  ),
  Plus: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M12 5v14" />
    </svg>
  ),
  ChevronDown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Layers: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  ),
  Flame: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Rocket: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Hero illustration components — render-style SVG props                     */
/* -------------------------------------------------------------------------- */

const GiftBox = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <defs>
      <linearGradient id="boxBody" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FCFAFF" /><stop offset="100%" stopColor="#D9D2F7" /></linearGradient>
      <linearGradient id="boxLid" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#E7E1FB" /></linearGradient>
      <linearGradient id="ribbon" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8B7BFF" /><stop offset="100%" stopColor="#6356E5" /></linearGradient>
    </defs>
    <rect x="38" y="98" width="144" height="92" rx="10" fill="url(#boxBody)" />
    <rect x="100" y="98" width="20" height="92" fill="url(#ribbon)" />
    <rect x="28" y="84" width="164" height="28" rx="8" fill="url(#boxLid)" />
    <rect x="100" y="84" width="20" height="28" fill="url(#ribbon)" />
    <path d="M 92 82 Q 70 50 84 38 Q 102 30 110 80 Q 118 30 136 38 Q 150 50 128 82 Z" fill="url(#ribbon)" />
    <ellipse cx="74" cy="138" rx="8" ry="3" fill="rgba(255,255,255,.7)" />
  </svg>
);

const CashStack = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <defs>
      <linearGradient id="bill" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#15A268" /><stop offset="100%" stopColor="#0A6740" /></linearGradient>
    </defs>
    <g transform="rotate(-10 120 90)">
      <rect x="20" y="22" width="200" height="100" rx="10" fill="url(#bill)" opacity=".55" />
      <rect x="36" y="40" width="200" height="100" rx="10" fill="url(#bill)" opacity=".75" />
      <rect x="52" y="58" width="200" height="100" rx="10" fill="url(#bill)" />
      <circle cx="152" cy="108" r="22" fill="rgba(255,255,255,.16)" />
      <text x="152" y="116" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="28" fill="rgba(255,255,255,.85)">$</text>
      <rect x="60" y="74" width="60" height="6" rx="3" fill="rgba(255,255,255,.18)" />
    </g>
  </svg>
);

const UCoin = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <defs>
      <radialGradient id="coinFace" cx="40%" cy="36%" r="70%">
        <stop offset="0%" stopColor="#FFEFC2" />
        <stop offset="55%" stopColor="#F4B14B" />
        <stop offset="100%" stopColor="#A35D17" />
      </radialGradient>
      <linearGradient id="coinEdge" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#F4B14B" />
        <stop offset="100%" stopColor="#7A4007" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="106" rx="78" ry="78" fill="url(#coinEdge)" />
    <ellipse cx="100" cy="100" rx="78" ry="78" fill="url(#coinFace)" />
    <text x="100" y="124" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="76" fontWeight="800" fill="#6E3804">U</text>
    <ellipse cx="74" cy="68" rx="28" ry="10" fill="rgba(255,255,255,.45)" />
  </svg>
);

const HeartFloat = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <path d="M12 21s-7-4.35-9.5-9C1 8.5 3 5 7 5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6 3.5 4.5 7-2.5 4.65-9.5 9-9.5 9Z" fill="#D6CCFF" />
  </svg>
);

const CarRender = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <defs>
      <linearGradient id="bodyDark" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1A0F40" /><stop offset="100%" stopColor="#070319" /></linearGradient>
      <linearGradient id="bodyLight" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3A2170" stopOpacity=".9" /><stop offset="100%" stopColor="#0B0420" stopOpacity=".6" /></linearGradient>
      <radialGradient id="hl" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFE9C4" /><stop offset="60%" stopColor="#F5B266" stopOpacity=".75" /><stop offset="100%" stopColor="#6356e5" stopOpacity="0" /></radialGradient>
      <linearGradient id="rim" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#5A4DD0" /><stop offset="100%" stopColor="#1B1042" /></linearGradient>
    </defs>
    <ellipse cx="360" cy="380" rx="240" ry="14" fill="rgba(99,86,229,.45)" filter="blur(10px)" />
    <path d="M 80 320 Q 80 230 200 200 L 320 178 Q 410 170 510 184 L 600 210 Q 660 232 660 308 L 660 348 L 80 348 Z" fill="url(#bodyDark)" />
    <path d="M 220 200 Q 360 130 510 192 L 510 200 Q 360 154 230 210 Z" fill="url(#bodyLight)" />
    <path d="M 240 196 Q 360 158 490 196" stroke="rgba(255,255,255,.16)" strokeWidth="1.5" fill="none" />
    <path d="M 200 240 Q 360 220 600 240" stroke="rgba(255,255,255,.10)" strokeWidth="1.5" fill="none" />
    <g opacity=".88">
      <rect x="298" y="232" width="46" height="62" rx="10" fill="#0A0418" stroke="#6356e5" strokeWidth="1.5" />
      <rect x="354" y="232" width="46" height="62" rx="10" fill="#0A0418" stroke="#6356e5" strokeWidth="1.5" />
    </g>
    <g>
      <ellipse cx="200" cy="244" rx="62" ry="12" fill="url(#hl)" />
      <rect x="146" y="240" width="100" height="6" rx="3" fill="#FFE2B0" />
    </g>
    <g>
      <ellipse cx="500" cy="244" rx="62" ry="12" fill="url(#hl)" />
      <rect x="450" y="240" width="100" height="6" rx="3" fill="#FFE2B0" />
    </g>
    <g>
      <circle cx="180" cy="328" r="42" fill="#0A0418" />
      <circle cx="180" cy="328" r="28" fill="url(#rim)" />
      <g stroke="#1B1042" strokeWidth="3" fill="none" opacity=".85">
        <line x1="180" y1="304" x2="180" y2="352" />
        <line x1="156" y1="328" x2="204" y2="328" />
        <line x1="161" y1="311" x2="199" y2="345" />
        <line x1="161" y1="345" x2="199" y2="311" />
      </g>
      <circle cx="180" cy="328" r="6" fill="#5A4DD0" />
    </g>
    <g>
      <circle cx="540" cy="328" r="42" fill="#0A0418" />
      <circle cx="540" cy="328" r="28" fill="url(#rim)" />
      <g stroke="#1B1042" strokeWidth="3" fill="none" opacity=".85">
        <line x1="540" y1="304" x2="540" y2="352" />
        <line x1="516" y1="328" x2="564" y2="328" />
        <line x1="521" y1="311" x2="559" y2="345" />
        <line x1="521" y1="345" x2="559" y2="311" />
      </g>
      <circle cx="540" cy="328" r="6" fill="#5A4DD0" />
    </g>
    <rect x="160" y="324" width="400" height="20" rx="6" fill="#040112" />
    <rect x="180" y="332" width="80" height="6" rx="2" fill="rgba(99,86,229,.55)" />
    <rect x="460" y="332" width="80" height="6" rx="2" fill="rgba(99,86,229,.55)" />
  </svg>
);

const SparkleStar = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Eyebrow — small labelled chip used above section H2s                      */
/* -------------------------------------------------------------------------- */

const Eyebrow = ({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) => {
  const cls = tone === 'dark'
    ? 'border border-white/15 bg-white/[0.06] text-[#FFE2B0]'
    : 'border border-[#e7e9f2] bg-white text-[#6356e5]';
  const dot = tone === 'dark' ? 'bg-[#FFE2B0]' : 'bg-[#6356e5]';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${cls}`}>
      <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*  Section: Hero — painted purple stage                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  const featurePillsDesktop = [
    { Icon: Icon.Coins, label: 'Points' },
    { Icon: Icon.Gift, label: 'Bonus Draws' },
    { Icon: Icon.Fuel, label: 'Fuel Rewards' },
  ];
  const trustClaimsDesktop = ['Published Winners', 'Clear Limits', 'Secure Checkout', 'Cancel Anytime'];
  const trustClaimsMobile = ['Published Winners', 'Secure Checkout', 'Cancel Anytime'];

  return (
    <section className="relative overflow-hidden text-white">
      {/* Painted purple stage — multi-layer radial blooms over a soft brand-purple linear */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(700px 480px at 96% 4%, rgba(15,18,34,.32), transparent 55%)',
            'radial-gradient(900px 600px at 24% 36%, rgba(170,150,255,.42), transparent 60%)',
            'radial-gradient(540px 420px at 70% 28%, rgba(255,226,176,.10), transparent 70%)',
            'radial-gradient(900px 600px at 95% 96%, rgba(58,46,168,.42), transparent 62%)',
            'linear-gradient(170deg, #4538B8 0%, #5C4FD8 36%, #6E60E8 70%, #7867EC 100%)',
          ].join(', '),
        }}
      />
      {/* Dot pattern overlay */}
      <div aria-hidden className="uc-dot-stage absolute inset-0 opacity-30" />
      {/* Animated blobs — disabled by prefers-reduced-motion */}
      <div aria-hidden className="uc-blob-a absolute -left-24 top-6 h-[480px] w-[480px] rounded-full bg-[#A192FF]/40 blur-[140px]" />
      <div aria-hidden className="uc-blob-b absolute right-[-12%] bottom-[-14%] hidden h-[560px] w-[560px] rounded-full bg-[#3D30B8]/50 blur-[150px] sm:block" />
      <div aria-hidden className="uc-blob-c absolute left-[-2%] top-[26%] hidden h-[340px] w-[340px] rounded-full bg-[#FFE2B0]/16 blur-[120px] sm:block" />

      {/* Drifting particles — md+ only (subtle white dots that gently float) */}
      {[
        { l: '36%', t: '14%', sz: 'h-1 w-1', d: '0s' },
        { l: '52%', t: '28%', sz: 'h-1.5 w-1.5', d: '-2.5s' },
        { l: '20%', t: '54%', sz: 'h-1 w-1', d: '-5s' },
        { l: '60%', t: '62%', sz: 'h-1.5 w-1.5', d: '-1.5s' },
      ].map((p, i) => (
        <span
          key={i}
          aria-hidden
          className={`uc-particle absolute hidden ${p.sz} rounded-full bg-white/45 md:block`}
          style={{ left: p.l, top: p.t, animationDelay: p.d }}
        />
      ))}

      {/* Renders cluster — desktop (lg+) only. Mobile + tablet keep a clean focused hero. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <HeartFloat className="uc-float absolute right-[28%] top-[12%] h-5 w-5" />
        <HeartFloat className="uc-float2 absolute right-[10%] top-[10%] h-4 w-4" />
        <HeartFloat className="uc-float3 absolute right-[36%] top-[24%] h-3 w-3" />
        <GiftBox className="uc-float2 absolute right-[6%] top-[14%] h-[140px] w-[140px]" />
        <CashStack className="uc-float absolute right-[32%] top-[34%] h-[150px] w-[190px]" />
        <UCoin className="uc-float3 absolute right-[16%] top-[30%] h-[130px] w-[130px]" />
        <CarRender className="absolute right-[1%] bottom-[8%] w-[620px] xl:w-[700px]" />
        <SparkleStar className="uc-float2 absolute right-[40%] top-[60%] h-6 w-6 text-[#FFE2B0]" />
        <SparkleStar className="uc-float absolute right-[18%] top-[66%] h-4 w-4 text-[#FFE2B0]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-14 pb-16 sm:pt-20 sm:pb-28 lg:px-8 lg:pt-28 lg:pb-36">
        <div className="max-w-3xl">
          <ScrollReveal>
            <Eyebrow tone="dark">Built for everyday Australians</Eyebrow>
          </ScrollReveal>

          <h1 className="uc-glow-text mt-6 font-extrabold leading-[1.04] tracking-tight text-[40px] sm:text-[56px] md:text-[64px] lg:text-[68px] xl:text-[80px]">
            {/* Three guaranteed lines: each phrase wraps on its own block-level span,
                with cascading fade-up delays for a calm staggered reveal. */}
            <ScrollReveal delay={80} as="span" className="block">
              Every receipt.
            </ScrollReveal>
            <ScrollReveal delay={170} as="span" className="block">
              More value.
            </ScrollReveal>
            <ScrollReveal delay={260} as="span" className="relative block isolate">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-[95%] max-w-[88%] -translate-y-1/2 rounded-[42%] bg-[#8B7BFF]/45 blur-[72px]" />
              <span className="uc-gold-gradient">Real rewards.</span>
            </ScrollReveal>
          </h1>

          <ScrollReveal delay={300}>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-[17px]">
              <span className="sm:hidden">Scan receipts to earn Points, Fuel Rewards, and access Bonus Draws.</span>
              <span className="hidden sm:inline">Scan eligible receipts to earn Points, unlock Fuel Rewards, and access member-only Bonus Draws.</span>
            </p>
          </ScrollReveal>

          {/* Feature pills — desktop only (mobile hides for compact hero) */}
          <ScrollReveal delay={360}>
            <div className="mt-7 hidden flex-wrap gap-2 sm:flex">
              {featurePillsDesktop.map(({ Icon: I, label }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[13px] font-medium text-white/85 backdrop-blur">
                  <I className="h-3.5 w-3.5 text-[#FFE2B0]" />
                  {label}
                </span>
              ))}
            </div>
          </ScrollReveal>

          {/* CTAs */}
          <ScrollReveal delay={420}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/#membership-plans"
                className="uc-lift-sm uc-pulse inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-[#6356e5] transition-colors hover:bg-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8] sm:w-auto"
              >
                Join UNICASH
                <Icon.ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/giveaways"
                className="uc-lift-sm inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.06] px-6 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#4538B8] sm:w-auto"
              >
                Explore Bonus Draws
              </Link>
            </div>
          </ScrollReveal>

          {/* Trust line — mobile drops 'Clear Limits' */}
          <ScrollReveal delay={480}>
            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-white/75 sm:hidden">
              {trustClaimsMobile.map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <span aria-hidden className="text-white/35">·</span>}
                  <span>{t}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="mt-7 hidden flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-white/70 sm:flex">
              {trustClaimsDesktop.map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <span aria-hidden className="text-white/35">·</span>}
                  <span>{t}</span>
                </React.Fragment>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: HowItWorks                                                       */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  const steps = [
    {
      n: '01',
      Icon: Icon.UserPlus,
      title: 'Join UNICASH',
      body: 'Choose your Membership and unlock everyday rewards, Fuel Rewards, Gift Card redemption, and Bonus Draw access.',
    },
    {
      n: '02',
      Icon: Icon.ScanLine,
      title: 'Scan Receipts',
      body: 'Upload eligible receipts to earn Points or Fuel Rewards. Track every reward from pending to approved.',
    },
    {
      n: '03',
      Icon: Icon.Coins,
      title: 'Use Points',
      body: 'Use Points to access capped Bonus Draws. Every result is recorded and Winners are published for transparency.',
    },
  ];

  return (
    <section id="how" className="relative w-full overflow-hidden bg-[#FBFAFF]">
      {/* Top purple spill — Hero light bleeds down */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 sm:h-64"
        style={{
          background: [
            'radial-gradient(1100px 260px at 50% -30%, rgba(99,86,229,.22), transparent 72%)',
            'radial-gradient(700px 200px at 18% -22%, rgba(139,123,255,.16), transparent 70%)',
            'radial-gradient(700px 200px at 82% -22%, rgba(139,123,255,.16), transparent 70%)',
          ].join(', '),
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6356e5]/35 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal><Eyebrow>How it works</Eyebrow></ScrollReveal>
          <ScrollReveal delay={60} as="h2" className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
            Simple. Clear. <span className="uc-gold-gradient">Rewarding.</span>
          </ScrollReveal>
          <ScrollReveal delay={120} as="p" className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
            Turn eligible receipts into Points, Fuel Rewards, Gift Cards, and access to member-only Bonus Draws.
          </ScrollReveal>
        </div>

        <div className="relative mt-10 sm:mt-14">
          {/* Mobile: horizontal swipe carousel — cards become snap-start, peek of next card visible.
              md+: standard 3-column grid (no swipe). The negative-mx + matching px lets cards swipe edge-to-edge
              while keeping consistent left padding for the first card. */}
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-2 pb-8 scroll-px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:p-0">
            {steps.map((s, i) => (
              <ScrollReveal
                key={s.n}
                delay={i * 90}
                className="relative flex w-[82%] shrink-0 snap-start flex-col rounded-3xl bg-white p-6 ring-1 ring-[#E7E2F4]/60 shadow-[0_10px_28px_-12px_rgba(99,86,229,.20)] transition-shadow duration-300 sm:w-[60%] md:w-auto md:shrink md:snap-none md:hover:ring-[#D8D0F7] md:hover:shadow-[0_24px_50px_-30px_rgba(15,18,34,.25)] sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F0EDFB] text-[#6356e5] ring-1 ring-[#E0DAFF] ring-offset-2 ring-offset-white sm:h-11 sm:w-11">
                    <s.Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="text-[28px] font-black leading-none text-[#D8D0F7] sm:text-[44px]">{s.n}</span>
                </div>
                <h3 className="mt-4 text-[16.5px] font-extrabold tracking-tight text-[#0f1222] sm:mt-5 sm:text-[18px]">
                  {s.title}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[#4b5563] sm:mt-3.5 sm:text-[14px]">
                  {s.body}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <ScrollReveal delay={300} className="hidden sm:block">
          <p className="mx-auto mt-8 max-w-xl text-center text-[12.5px] leading-relaxed text-[#667085] sm:mt-12 sm:text-[14px]">
            Built for everyday value, clear limits, and published Winners.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: FuelRewards                                                      */
/* -------------------------------------------------------------------------- */

function FuelRewards() {
  const fuelSteps = [
    { n: '01', Icon: Icon.Fuel, title: 'Fill up', body: 'Fuel up at eligible Australian service stations.' },
    { n: '02', Icon: Icon.ScanLine, title: 'Scan receipt', body: 'Upload your receipt in the UNICASH app and track its review status.' },
    { n: '03', Icon: Icon.Coins, title: 'Use your Points', body: 'Use approved Points for Bonus Draws or redeem selected Gift Cards from 2,000 Points.' },
  ];
  const fuelTierRates = [
    { plan: 'UniOne', rate: '1 Pt / $1' },
    { plan: 'UniPlus', rate: '2 Pts / $1' },
    { plan: 'UniMax', rate: '3 Pts / $1' },
  ];
  const fuelTrustChips = ['Eligible fuel receipts', 'Tier-based Points', 'Wallet tracking', 'Gift Card redemption'];

  return (
    <section id="fuel" className="relative w-full overflow-hidden bg-white">
      {/* Warm-tinted painted bg */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(700px 480px at 92% 8%, rgba(255,226,176,.16), transparent 62%)',
            'radial-gradient(620px 420px at 8% 92%, rgba(255,200,150,.10), transparent 60%)',
            'radial-gradient(560px 380px at 14% 18%, rgba(139,123,255,.09), transparent 60%)',
            'linear-gradient(180deg, #FFFFFF 0%, #FFFCF6 100%)',
          ].join(', '),
        }}
      />
      <div aria-hidden className="uc-dot-light absolute inset-0 opacity-[0.03]" />

      <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FBFAFF] via-white to-[#FFF8E8] p-6 ring-1 ring-[#E0DAFF]/50 shadow-[0_30px_80px_-50px_rgba(99,86,229,.18)] sm:p-10 lg:p-14">
          {/* Inner warm glows */}
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#FFE2B0]/35 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-[#FFC85D]/15 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <ScrollReveal><Eyebrow>Fuel Rewards</Eyebrow></ScrollReveal>
              <ScrollReveal delay={60} as="h2" className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[44px] lg:text-[52px]">
                Fuel up. Scan. <span className="uc-gold-gradient">Earn Points.</span>
              </ScrollReveal>
              <ScrollReveal delay={120} as="p" className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#4b5563]">
                Scan eligible fuel receipts and earn Fuel Rewards as Points in your UNICASH wallet. The higher your Membership tier, the more Points you earn from eligible fuel spending.
              </ScrollReveal>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {fuelSteps.map((s, i) => (
                  <ScrollReveal key={s.n} delay={180 + i * 70} className="rounded-2xl bg-white p-5 ring-1 ring-[#e7e9f2]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EDFB] text-[#6356e5]">
                        <s.Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[12px] font-semibold tracking-[0.18em] text-[#6356e5]">{s.n}</span>
                    </div>
                    <p className="mt-4 text-[15px] font-semibold tracking-tight text-[#0f1222]">{s.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#4b5563]">{s.body}</p>
                  </ScrollReveal>
                ))}
              </div>

              {/* Tier earn-rate chips */}
              <ScrollReveal delay={380}>
                <div className="mt-6 flex flex-wrap items-center gap-1.5">
                  {fuelTierRates.map((t) => (
                    <span key={t.plan} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0f1222] ring-1 ring-[#E0DAFF]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#6356e5]">{t.plan}</span>
                      <span className="text-[#a3a8be]">·</span>
                      <span>{t.rate}</span>
                    </span>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal delay={440}>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href="/#membership-plans"
                    className="uc-lift-sm inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6356E5] px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-colors hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 sm:w-auto"
                  >
                    Start Earning Fuel Rewards
                    <Icon.ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/scan-receipts"
                    className="uc-lift-sm inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[15px] font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2 sm:w-auto"
                  >
                    How Fuel Rewards Work
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={500}>
                <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#667085]">
                  {fuelTrustChips.map((t, i) => (
                    <React.Fragment key={t}>
                      {i > 0 && <span aria-hidden className="text-[#cfc8e8]">·</span>}
                      <span>{t}</span>
                    </React.Fragment>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Phone mockup — v4 fidelity: UNICASH mark, scan-line animation, in-card CTA, recent rewards */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={120}>
                <div className="relative mx-auto h-[520px] w-[280px] overflow-hidden rounded-[34px] border-[8px] border-[#0F1222] bg-[#FBFAFF] shadow-[0_30px_80px_-20px_rgba(15,18,34,0.35)] sm:h-[600px] sm:w-[300px] sm:rounded-[36px] sm:border-[9px] lg:h-[640px] lg:w-[320px] lg:rounded-[38px] lg:border-[10px]">
                  {/* notch */}
                  <div className="absolute left-1/2 top-2 z-10 h-6 w-32 -translate-x-1/2 rounded-full bg-[#0F1222]" />

                  <div className="relative h-full w-full p-4">
                    {/* Top bar — UNICASH mark + Points pill */}
                    <div className="mt-6 flex items-center justify-between">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F0EDFB]">
                        {/* Official UNICASH mark — U-shape + $ extracted from /images/green-logo.svg */}
                        <svg viewBox="0 0 515 515" xmlns="http://www.w3.org/2000/svg" aria-label="UNICASH" role="img" className="h-5 w-5">
                          <path fill="#6356E5" d="M257.507 0C115.286 0 0 115.291 0 257.507C0 399.718 115.286 515.014 257.507 515.014H515.014V257.507C515.014 115.291 399.718 0 257.507 0ZM406.511 406.511C324.217 488.81 190.797 488.81 108.503 406.516C26.2091 324.222 26.2091 190.797 108.503 108.503C190.797 26.2091 324.217 26.2091 406.511 108.503C488.81 190.792 488.805 324.217 406.511 406.511Z" />
                          <path fill="#6356E5" d="M277.464 224.485C247.444 213.185 235.084 205.769 235.084 194.114C235.084 184.226 242.5 174.338 265.454 174.338C290.885 174.338 307.129 182.459 316.312 186.348L326.55 146.439C314.901 140.79 299.007 135.84 275.342 134.784V103.703H240.733V137.251C202.942 144.668 181.048 169.038 181.048 200.119C181.048 234.378 206.83 252.038 244.622 264.754C270.759 273.586 282.058 282.053 282.058 295.479C282.058 309.606 268.281 317.378 248.155 317.378C225.201 317.378 204.363 309.961 189.531 301.835L178.932 343.154C192.353 350.926 215.307 357.281 238.972 358.337V391.895H273.586V355.87C314.2 348.804 336.449 321.966 336.449 290.53C336.444 258.743 319.489 239.322 277.464 224.485Z" />
                        </svg>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0f1222] ring-1 ring-[#e7e9f2]">
                        <Icon.Coins className="h-3 w-3 text-[#6356e5]" /> 1,250
                      </div>
                    </div>

                    {/* Hero scan card */}
                    <div className="mt-4 rounded-2xl bg-[#0F1222] p-4 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A99CFF]">Fuel Rewards</p>
                      <p className="mt-1 text-[18px] font-semibold tracking-tight">Scan your receipt</p>
                      <p className="text-[11px] text-white/65">4 seconds · on-device OCR</p>

                      {/* Receipt mock with animated scan line */}
                      <div className="relative mt-4 overflow-hidden rounded-xl bg-white p-3 text-[#0f1222]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold tracking-tight">SHELL CITY</span>
                          <span className="text-[#667085]">18/04/2026</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[12px]">
                          <span className="text-[#4b5563]">Unleaded 95</span>
                          <span className="font-semibold">42.18L</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[12px]">
                          <span className="text-[#4b5563]">Total</span>
                          <span className="font-semibold">$72.40</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#e7e9f2] pt-2 text-[10px] text-[#7a8195]">
                          <span>REF</span>
                          <span>#8842-09</span>
                        </div>
                        {/* Animated scan line */}
                        <div aria-hidden className="uc-scan absolute inset-x-3 top-1 h-1 rounded-full bg-gradient-to-r from-transparent via-[#6356e5] to-transparent" />
                      </div>

                      {/* In-card CTA — white pill, purple text */}
                      <button
                        type="button"
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-bold text-[#6356E5] transition-colors hover:bg-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1222]"
                      >
                        <Icon.ScanLine className="h-3.5 w-3.5" />
                        Scan receipt
                      </button>
                    </div>

                    {/* Recent rewards list */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-3 rounded-xl border border-[#e7e9f2] bg-white p-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F7EE] text-[#1F7A37]">
                          <Icon.Fuel className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[12px] font-semibold text-[#0f1222]">Shell · Fuel Rewards</p>
                          <p className="text-[10px] text-[#667085]">Just now</p>
                        </div>
                        <span className="rounded-full bg-[#E5F7EE] px-2 py-0.5 text-[12px] font-bold text-[#1F7A37]">+145 Points</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-[#e7e9f2] bg-white p-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF6E2] text-[#9C5410]">
                          <Icon.ScanLine className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[12px] font-semibold text-[#0f1222]">BP · Fuel Rewards</p>
                          <p className="text-[10px] text-[#667085]">Yesterday</p>
                        </div>
                        <span className="rounded-full bg-[#FFF6E2] px-2 py-0.5 text-[12px] font-bold text-[#9C5410]">+122 Points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Boosters — explain concept, do NOT show prices                   */
/* -------------------------------------------------------------------------- */

/* Booster pack data — display-only values matching the v4 design preview.
   Actual Booster checkout/pricing logic lives on /boost-packs (backend-driven). */
const BOOSTER_PACKS = [
  {
    id: 'spark',
    name: 'Booster Spark',
    price: 4.99,
    points: 250,
    tagline: 'Quick top-up. Just enough for one Bonus Draw.',
    Icon: Icon.Zap,
    iconColor: 'text-[#6356E5]',
    iconBg: 'bg-[#F0EDFB] ring-[#E0DAFF]',
    badge: null,
  },
  {
    id: 'pulse',
    name: 'Booster Pulse',
    price: 19.99,
    points: 1200,
    tagline: "Balanced top-up. Members' most-loved Booster.",
    Icon: Icon.Flame,
    iconColor: 'text-[#E27932]',
    iconBg: 'bg-[#FFF1E0] ring-[#FFD4BA]',
    badge: 'MOST POPULAR' as const,
  },
  {
    id: 'surge',
    name: 'Booster Surge',
    price: 29.99,
    points: 2000,
    tagline: 'Maximum Points. Lowest cost per Point.',
    Icon: Icon.Rocket,
    iconColor: 'text-[#C49A2C]',
    iconBg: 'bg-[#FFF6E2] ring-[#FFC85D]/50',
    badge: 'BEST VALUE' as const,
  },
];

function BoosterCard({ pack }: { pack: typeof BOOSTER_PACKS[number] }) {
  const isPopular = pack.badge === 'MOST POPULAR';
  const isBest = pack.badge === 'BEST VALUE';
  const accent = isPopular ? 'border-2 border-[#6356e5]' : 'border border-[#e7e9f2]';
  const badgeCls = isPopular
    ? 'bg-[#6356e5] text-white'
    : isBest
      ? 'bg-[#FFC85D] text-[#3A2A06]'
      : 'bg-[#f5f3ff] text-[#6356e5]';

  return (
    <div className={`relative flex h-full flex-col rounded-3xl bg-white p-7 ${accent}`}>
      {pack.badge && (
        <span className={`absolute right-6 top-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${badgeCls}`}>
          {pack.badge}
        </span>
      )}

      <div className="flex items-center gap-3">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${pack.iconBg}`}>
          <pack.Icon className={`h-5 w-5 ${pack.iconColor}`} />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF6DA] px-2 py-0.5 text-[10px] font-medium text-[#8a6a05]">
          <Icon.Zap className="h-3 w-3" /> One-time
        </span>
      </div>

      <h3 className="mt-5 text-[20px] font-extrabold tracking-tight text-[#0f1222]">{pack.name}</h3>
      <p className="mt-1 text-[13px] text-[#667085]">{pack.tagline}</p>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-[36px] font-bold leading-none tracking-tight text-[#0f1222]">${pack.price.toFixed(2)}</span>
      </div>

      <div className="mt-4 rounded-2xl bg-[#F4F1FB] p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#667085]">You receive</p>
        <p className="mt-0.5 text-[24px] font-bold tracking-tight text-[#6356e5]">{pack.points.toLocaleString()} Points</p>
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-2 text-[13px] text-[#0f1222]">
        {[
          'One-time purchase, no auto-renew',
          'Booster Points never expire',
          'Stack with Membership Points',
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <Icon.Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6356e5]" />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isPopular ? (
          <Link
            href="/boost-packs"
            className="uc-lift-sm inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6356E5] px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(99,86,229,0.6)] transition-colors hover:bg-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
          >
            Buy Point Booster
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/boost-packs"
            className="uc-lift-sm inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[15px] font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
          >
            Buy Point Booster
          </Link>
        )}
      </div>
    </div>
  );
}

function Boosters() {
  return (
    <section id="boosters" className="relative w-full overflow-hidden">
      {/* Painted lavender mesh */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(720px 480px at 12% 18%, rgba(139,123,255,.16), transparent 62%)',
            'radial-gradient(640px 440px at 90% 14%, rgba(201,192,242,.20), transparent 60%)',
            'radial-gradient(520px 360px at 50% 100%, rgba(99,86,229,.09), transparent 62%)',
            'radial-gradient(420px 320px at 88% 82%, rgba(255,226,176,.08), transparent 60%)',
            'linear-gradient(180deg, #F4F1FB 0%, #EDE8F8 60%, #F4F1FB 100%)',
          ].join(', '),
        }}
      />
      <div aria-hidden className="uc-dot-light absolute inset-0 opacity-[0.04]" />

      <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal><Eyebrow>Point Boosters</Eyebrow></ScrollReveal>
          <ScrollReveal delay={60} as="h2" className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
            Top up Points anytime — <span className="uc-gold-gradient">never auto-renew.</span>
          </ScrollReveal>
          <ScrollReveal delay={120} as="p" className="mx-auto mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
            Point Boosters are one-time purchases that sit alongside your Membership. Booster Points never expire.
          </ScrollReveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5 lg:gap-6">
          {BOOSTER_PACKS.map((pack, i) => (
            <ScrollReveal key={pack.id} delay={i * 90} className="h-full">
              <BoosterCard pack={pack} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: FAQ — accessible disclosure pattern                              */
/* -------------------------------------------------------------------------- */

function Faq() {
  // Source of truth: /legal/UNICASH-FAQs.md → unicash-web/content/faqs.ts
  const faqs = homeFaqs;

  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <section id="faq" className="w-full bg-[#FBFAFF]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-10 sm:py-24 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-4">
          <ScrollReveal><Eyebrow>FAQ</Eyebrow></ScrollReveal>
          <ScrollReveal delay={60} as="h2" className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
            A few common <span className="uc-gold-gradient">questions.</span>
          </ScrollReveal>
          <ScrollReveal delay={120} as="p" className="mt-3 text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
            Everything is shown up-front. If something is unclear, the answer is here — short and direct.
          </ScrollReveal>
        </div>

        <div className="md:col-span-8">
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const open = openIdx === i;
              const panelId = `faq-panel-${i}`;
              const triggerId = `faq-trigger-${i}`;
              /* Mobile shows top 4 only — items 5+ render md+ to keep the section
                 compact on phones. A "View all FAQs" link appears below on mobile. */
              const mobileHidden = i >= 4 ? 'hidden md:block' : '';
              return (
                <ScrollReveal
                  key={f.q}
                  delay={i * 40}
                  className={`overflow-hidden rounded-2xl border border-[#e7e9f2] bg-white transition-colors hover:border-[#d1cbf5] ${mobileHidden}`}
                >
                  <h3>
                    <button
                      id={triggerId}
                      type="button"
                      onClick={() => setOpenIdx(open ? -1 : i)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[#FBFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6356e5]"
                    >
                      <span className="text-[15px] font-semibold tracking-tight text-[#0f1222]">{f.q}</span>
                      <span aria-hidden className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1FB] text-[#6356e5] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                        <Icon.ChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </h3>
                  <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
                    {open && <div className="px-5 pb-5 text-[14px] leading-relaxed text-[#4b5563]">{f.a}</div>}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Mobile-only: View all FAQs link (md+ shows full list above) */}
          <div className="mt-5 flex justify-center md:hidden">
            <Link
              href="/faq"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[13.5px] font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:text-[#5346D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
            >
              View all FAQs
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Member Loyalty projection                                                 */
/* --------------------------------------------------------------------------
   Indicative projection of how Loyalty entries accumulate across tenure.
   Math mirrors Loyalty V2 Option D (memory: project_loyalty_v2_option_d).
   Canonical values come from migration 20260514_loyalty_01_plan_config.sql:
     • tenure         = monthlyAccrual × months active
     • anniversary    = milestone bonuses at 3/6/12/18/24mo + yearly recur
     • streak         = milestone bonuses at 12/24/36mo (one-time each)
   -------------------------------------------------------------------------- */
type LoyaltyTier = 'UniOne' | 'UniPlus' | 'UniMax';

type LoyaltyTierConfig = {
  id: LoyaltyTier;
  label: string;
  monthlyAccrual: number;
  anniversaryBonuses: {
    '3': number;
    '6': number;
    '12': number;
    '18': number;
    '24': number;
    yearlyRecurringAfter24: number;
  };
  streakBonuses: {
    '12': number;
    '24': number;
    '36': number;
  };
};

const LOYALTY_TIERS: LoyaltyTierConfig[] = [
  {
    id: 'UniOne',
    label: 'UniOne',
    monthlyAccrual: 1,
    anniversaryBonuses: { '3': 3, '6': 6, '12': 10, '18': 15, '24': 15, yearlyRecurringAfter24: 10 },
    streakBonuses: { '12': 5, '24': 10, '36': 15 },
  },
  {
    id: 'UniPlus',
    label: 'UniPlus',
    monthlyAccrual: 4,
    anniversaryBonuses: { '3': 6, '6': 12, '12': 30, '18': 25, '24': 50, yearlyRecurringAfter24: 25 },
    streakBonuses: { '12': 15, '24': 30, '36': 50 },
  },
  {
    id: 'UniMax',
    label: 'UniMax',
    monthlyAccrual: 10,
    anniversaryBonuses: { '3': 10, '6': 20, '12': 75, '18': 35, '24': 120, yearlyRecurringAfter24: 60 },
    streakBonuses: { '12': 35, '24': 75, '36': 150 },
  },
];

/* Cumulative anniversary up to `months`: each milestone fires once when
   reached, then yearlyRecurringAfter24 fires every 12 months after 24
   (so month 36 adds yearly, 48 adds another, etc.) */
function calcAnniversary(t: LoyaltyTierConfig, months: number): number {
  let total = 0;
  if (months >= 3) total += t.anniversaryBonuses['3'];
  if (months >= 6) total += t.anniversaryBonuses['6'];
  if (months >= 12) total += t.anniversaryBonuses['12'];
  if (months >= 18) total += t.anniversaryBonuses['18'];
  if (months >= 24) total += t.anniversaryBonuses['24'];
  if (months >= 36) {
    const yearsAfter24 = Math.floor((months - 24) / 12);
    total += yearsAfter24 * t.anniversaryBonuses.yearlyRecurringAfter24;
  }
  return total;
}

/* Cumulative streak: one-time bonus at each milestone hit. */
function calcStreak(t: LoyaltyTierConfig, months: number): number {
  let total = 0;
  if (months >= 12) total += t.streakBonuses['12'];
  if (months >= 24) total += t.streakBonuses['24'];
  if (months >= 36) total += t.streakBonuses['36'];
  return total;
}

function LoyaltyProjection() {
  const [tierId, setTierId] = useState<LoyaltyTier>('UniPlus');
  const [month, setMonth] = useState<number>(12);

  const tier = LOYALTY_TIERS.find((t) => t.id === tierId)!;
  const tenure = tier.monthlyAccrual * month;
  const anniversary = calcAnniversary(tier, month);
  const streak = calcStreak(tier, month);
  const total = tenure + anniversary + streak;
  const formattedMonth = month === 1 ? 'MONTH 1' : `MONTH ${month}`;

  return (
    <div className="mt-10 sm:mt-14 rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-7 shadow-[0_10px_30px_-18px_rgba(99,86,229,0.18)]">
      {/* Tier picker — segmented control */}
      <div className="flex items-center gap-2 mb-6 sm:mb-7">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#5648D8] hidden sm:inline mr-2">
          Tier
        </span>
        <div role="tablist" aria-label="Choose membership tier" className="inline-flex rounded-full bg-[#F4F1FB] p-1">
          {LOYALTY_TIERS.map((t) => {
            const active = t.id === tierId;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setTierId(t.id)}
                className={
                  'px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold tracking-tight transition-all ' +
                  (active
                    ? 'bg-white text-[#0F1222] shadow-[0_4px_10px_-4px_rgba(99,86,229,0.30)]'
                    : 'text-[#667085] hover:text-[#0F1222]')
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column horizontal layout — slider+breakdown left, big number right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-7">
        {/* LEFT — slider + breakdown cards */}
        <div className="lg:col-span-3 space-y-5">
          {/* Slider */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085]">
                Month
              </span>
              <span className="text-[20px] font-extrabold tabular-nums text-[#6356E5]">
                {month}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              aria-label="Months of membership"
              className="uc-loyalty-slider w-full"
              style={{ ['--uc-loyalty-progress' as any]: `${((month - 1) / 59) * 100}%` }}
            />
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#9097A8]">
              <span>Start</span>
              <span className="hidden sm:inline">Year 1</span>
              <span className="hidden sm:inline">Year 2</span>
              <span className="hidden sm:inline">Year 3</span>
              <span className="hidden sm:inline">Year 4</span>
              <span>Year 5</span>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl bg-[#FBFAFF] border border-[#F1ECFB] p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#5648D8]">
                Tenure
              </p>
              <p className="mt-1 text-[18px] sm:text-[20px] font-extrabold tabular-nums text-[#0F1222]">
                +{tenure}
              </p>
            </div>
            <div className="rounded-2xl bg-[#FFF6DA] border border-[#FFE2B0] p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#9C5410]">
                Anniversary
              </p>
              <p className="mt-1 text-[18px] sm:text-[20px] font-extrabold tabular-nums text-[#0F1222]">
                +{anniversary}
              </p>
            </div>
            <div className="rounded-2xl bg-[#FBFAFF] border border-[#F1ECFB] p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#5648D8]">
                Streak
              </p>
              <p className="mt-1 text-[18px] sm:text-[20px] font-extrabold tabular-nums text-[#0F1222]">
                +{streak}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — big "Entries at month N" panel */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] p-5 sm:p-6 text-white flex flex-col justify-center min-h-[160px]">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/75">
            Entries at {formattedMonth.toLowerCase()}
          </p>
          <p className="mt-2 text-[44px] sm:text-[56px] font-extrabold leading-none tabular-nums">
            {total.toLocaleString('en-AU')}
          </p>
          <p className="mt-1.5 text-[12px] text-white/85">
            entries · {tier.label}
          </p>
        </div>
      </div>

      <p className="mt-5 text-[11.5px] sm:text-[12px] leading-relaxed text-[#667085]">
        Entries accrue while your membership is active.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function HomeClient() {
  /* ---- Auth + page state — preserved from original ---- */
  const { user, refreshUser } = useAuth();
  const [draws, setDraws] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightMembership, setHighlightMembership] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState<string | null>(null);
  const [selectedDowngradePlanId, setSelectedDowngradePlanId] = useState<string | null>(null);

  /* ---- Data fetching — unchanged. Banners endpoint dropped from render only ---- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [drawsRes, plansRes, membershipRes] = await Promise.all([
          api.draws.getAll(user?.id),
          api.membership.getPlans(),
          user ? api.membership.getUserMembership().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        setDraws(drawsRes.data.slice(0, 6));
        setPlans(plansRes.data);
        setMembership(membershipRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  /* ---- Hash-scroll highlight — preserved ---- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#membership-plans') {
        setTimeout(() => {
          const element = document.getElementById('membership-plans');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setHighlightMembership(true);
            setTimeout(() => setHighlightMembership(false), 3000);
          }
        }, 500);
      }
    }
  }, [loading]);

  const formatMembershipDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };

  const isPlanUpgrade = (oldPlan: any, newPlan: any): boolean => {
    const tierOrder: Record<string, number> = {
      basic: 1, premium: 2, uni_one: 3, uni_plus: 4, uni_max: 5, elite: 6,
    };
    const oldTierOrder = tierOrder[oldPlan?.tier] || 0;
    const newTierOrder = tierOrder[newPlan?.tier] || 0;
    if (newTierOrder > oldTierOrder) return true;
    if (newTierOrder === oldTierOrder && newPlan.priceMonthly > oldPlan.priceMonthly) return true;
    if (
      newTierOrder === oldTierOrder &&
      newPlan.priceMonthly === oldPlan.priceMonthly &&
      newPlan.freeCreditsPerPeriod > oldPlan.freeCreditsPerPeriod
    ) return true;
    return false;
  };

  const handleUpgrade = (planId: string) => {
    if (actionLoading !== null) return;
    const newPlan = plans.find((p: any) => p.id === planId);
    if (!newPlan || !membership?.plan) return;
    if (membership.planId === planId) return;
    const isUpgrade = isPlanUpgrade(membership.plan, newPlan);
    if (isUpgrade && membership.pendingUpgradePlanId) {
      showToast('You already have a pending upgrade scheduled.', 'info');
      return;
    }
    if (!isUpgrade && membership.pendingDowngradePlanId) {
      showToast('You already have a pending downgrade scheduled.', 'info');
      return;
    }
    if (isUpgrade) {
      setSelectedUpgradePlanId(planId);
      setShowUpgradeConfirm(true);
    } else {
      setSelectedDowngradePlanId(planId);
      setShowDowngradeConfirm(true);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedUpgradePlanId) return;
    setShowUpgradeConfirm(false);
    const loadingKey = `upgrade-${selectedUpgradePlanId}`;
    setActionLoading(loadingKey);
    try {
      await api.membership.upgrade(selectedUpgradePlanId);
      const membershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(membershipRes.data);
      await refreshUser();
      setActionLoading(null);
      setSelectedUpgradePlanId(null);
      showToast('Upgrade scheduled successfully! Your plan will be upgraded on your next billing date.', 'success');
    } catch (error: any) {
      console.error('Error upgrading:', error);
      setActionLoading(null);
      setSelectedUpgradePlanId(null);
      showToast(error.response?.data?.message || 'Failed to upgrade membership', 'error');
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedDowngradePlanId) return;
    setShowDowngradeConfirm(false);
    const loadingKey = `downgrade-${selectedDowngradePlanId}`;
    setActionLoading(loadingKey);
    try {
      await api.membership.upgrade(selectedDowngradePlanId);
      const membershipRes = await api.membership.getUserMembership().catch(() => ({ data: null }));
      setMembership(membershipRes.data);
      await refreshUser();
      setActionLoading(null);
      setSelectedDowngradePlanId(null);
      showToast('Downgrade scheduled successfully. It will apply on your next billing date.', 'success');
    } catch (error: any) {
      console.error('Error downgrading:', error);
      setActionLoading(null);
      setSelectedDowngradePlanId(null);
      showToast(error.response?.data?.message || 'Failed to downgrade membership', 'error');
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Render                                                              */
  /* -------------------------------------------------------------------- */
  return (
    <div className="w-full overflow-x-hidden">
      <Hero />

      <HowItWorks />

      {/* Plans */}
      <section
        id="membership-plans"
        className={`relative w-full overflow-hidden bg-[#F4F1FB] scroll-mt-20 transition-all duration-1000 ${
          highlightMembership ? 'ring-4 ring-[#6356e5] ring-offset-4' : ''
        }`}
      >
        {/* Decorative blur orbs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-[#8B7BFF]/15 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute right-[-12%] top-1/3 h-[360px] w-[360px] rounded-full bg-[#FFE2B0]/14 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute left-[-8%] bottom-0 h-[320px] w-[320px] rounded-full bg-[#6356e5]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <ScrollReveal><Eyebrow>Membership Plans</Eyebrow></ScrollReveal>
            <ScrollReveal delay={60} as="h2" className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[44px] md:text-[52px]">
              Pick your <span className="uc-gold-gradient">premium tier.</span>
            </ScrollReveal>
            <ScrollReveal delay={120} as="p" className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#4b5563] sm:text-[16px]">
              Free Major Draw entries every month, Monthly Points for Bonus Draws, and <span className="font-semibold text-[#0f1222]">faster earn rates</span> as you scale up.
            </ScrollReveal>
          </div>

          {loading ? (
            /* Plans skeleton — 3-card grid mirroring final MembershipCard layout */
            <div className="mt-10 grid grid-cols-1 items-stretch gap-5 pt-2 sm:mt-14 md:mt-16 md:grid-cols-3 md:gap-5 md:pt-6 lg:gap-6">
              {[0, 1, 2].map((i) => (
                <article key={i} className="rounded-3xl border border-[#E7E9F2] bg-white p-6 sm:p-7">
                  <div className="space-y-3">
                    <div className="h-5 w-24 animate-pulse rounded-full bg-[#F4F1FB]" />
                    <div className="h-9 w-32 animate-pulse rounded-lg bg-[#F4F1FB]" />
                    <div className="h-12 w-44 animate-pulse rounded-lg bg-[#F4F1FB]" />
                    <div className="h-4 w-40 animate-pulse rounded bg-[#F4F1FB]" />
                  </div>
                  <div className="mt-6 space-y-2.5">
                    {[0, 1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-[#F4F1FB]" />
                        <div className="h-3.5 w-full animate-pulse rounded bg-[#F4F1FB]" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 items-stretch gap-5 pt-2 sm:mt-14 md:mt-16 md:grid-cols-3 md:gap-5 md:pt-6 lg:gap-6">
              {plans
                .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((plan: any, index: number) => (
                  <ScrollReveal key={plan.id} delay={index * 150} className="h-full">
                    <MembershipCard
                      plan={plan}
                      membership={membership}
                      actionLoading={actionLoading}
                      onUpgradeDowngrade={handleUpgrade}
                      showUpgradeConfirm={showUpgradeConfirm && selectedUpgradePlanId === plan.id}
                      showDowngradeConfirm={showDowngradeConfirm && selectedDowngradePlanId === plan.id}
                    />
                  </ScrollReveal>
                ))}
            </div>
          )}

          {/* MOBILE — compact: text-only middot trust line + smaller payment row + shorter footer copy */}
          <div className="md:hidden">
            <ScrollReveal delay={300}>
              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[12px]">
                  {['Renews monthly', 'Cancel anytime', 'Bank-grade Stripe checkout'].map((t, i) => (
                    <React.Fragment key={t}>
                      {i > 0 && <span aria-hidden className="text-[#cfc8e8]">·</span>}
                      <span className="text-[#4b5563]">{t}</span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2.5">
                  <Image src="/images/icons/payment/stripe.svg" alt="Stripe" width={80} height={48} className="h-[18px] w-auto opacity-80" />
                  <Image src="/images/icons/payment/apple-pay.svg" alt="Apple Pay" width={78} height={32} className="h-[18px] w-auto opacity-80" />
                  <Image src="/images/icons/payment/paypal.svg" alt="PayPal" width={143} height={48} className="h-[18px] w-auto opacity-80" />
                  <Image src="/images/icons/payment/master-card.svg" alt="Mastercard" width={68} height={48} className="h-[20px] w-auto opacity-80" />
                  <Image src="/images/icons/payment/visa.svg" alt="Visa" width={119} height={48} className="h-[16px] w-auto opacity-80" />
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* DESKTOP — full chips with icons + larger payments + full footer copy */}
          <div className="hidden md:block">
            <ScrollReveal delay={300}>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[13px]">
                {[
                  { Icon: Icon.Repeat, text: 'Renews monthly' },
                  { Icon: Icon.Ban, text: 'Cancel anytime · no contract' },
                  { Icon: Icon.BadgeCheck, text: 'Winners published every Bonus Draw' },
                  { Icon: Icon.ShieldCheck, text: 'Bank-grade Stripe checkout' },
                ].map(({ Icon: I, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 text-[#4b5563]">
                    <I className="h-3.5 w-3.5 text-[#6356e5]" />
                    <span className="font-medium">{text}</span>
                  </span>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={380}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
                {/* Lock visible heights, let widths derive from native SVG aspect ratios.
                    Mastercard + Visa get slight height adjustments because their wordmarks vs
                    pure-shape logos read at different optical weights. */}
                <Image src="/images/icons/payment/stripe.svg" alt="Stripe" width={80} height={48} className="h-7 w-auto opacity-80 transition-opacity hover:opacity-100" />
                <Image src="/images/icons/payment/apple-pay.svg" alt="Apple Pay" width={78} height={32} className="h-7 w-auto opacity-80 transition-opacity hover:opacity-100" />
                <Image src="/images/icons/payment/paypal.svg" alt="PayPal" width={143} height={48} className="h-7 w-auto opacity-80 transition-opacity hover:opacity-100" />
                <Image src="/images/icons/payment/master-card.svg" alt="Mastercard" width={68} height={48} className="h-8 w-auto opacity-80 transition-opacity hover:opacity-100" />
                <Image src="/images/icons/payment/visa.svg" alt="Visa" width={119} height={48} className="h-6 w-auto opacity-80 transition-opacity hover:opacity-100" />
              </div>
            </ScrollReveal>

            <p className="mx-auto mt-6 max-w-3xl text-center text-[12px] leading-relaxed text-[#667085]">
              Membership renews monthly. Membership Points refresh on your renewal date. Point Boosters are separate one-time purchases (no auto-renew) and Booster Points stack with your Monthly Points.
            </p>
          </div>
        </div>
      </section>

      {/* Member Loyalty — entries projection over tenure */}
      <section id="loyalty" className="relative w-full overflow-hidden bg-white">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(420px 320px at 8% 14%, rgba(139,123,255,.10), transparent 60%)',
              'radial-gradient(420px 320px at 92% 86%, rgba(255,226,176,.08), transparent 60%)',
              'linear-gradient(180deg, #FFFFFF 0%, #FBFAFF 100%)',
            ].join(', '),
          }}
        />
        <div aria-hidden className="uc-dot-light absolute inset-0 opacity-[0.04]" />

        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <ScrollReveal><Eyebrow>Member Loyalty</Eyebrow></ScrollReveal>
            <ScrollReveal delay={60} as="h2" className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
              See how entries <span className="uc-gold-gradient">grow.</span>
            </ScrollReveal>
            <ScrollReveal delay={120} as="p" className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
              Drag the slider to project tenure, anniversary, and streak bonuses over time.
            </ScrollReveal>
          </div>

          <ScrollReveal delay={180}>
            <LoyaltyProjection />
          </ScrollReveal>
        </div>
      </section>

      {/* Bonus Draws */}
      <section id="draws" className="relative w-full overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(720px 480px at 14% 16%, rgba(139,123,255,.13), transparent 62%)',
              'radial-gradient(620px 420px at 88% 12%, rgba(201,192,242,.18), transparent 60%)',
              'radial-gradient(560px 380px at 50% 100%, rgba(99,86,229,.07), transparent 62%)',
              'radial-gradient(420px 320px at 92% 78%, rgba(255,226,176,.08), transparent 60%)',
              'linear-gradient(180deg, #FBFAFF 0%, #FFFFFF 100%)',
            ].join(', '),
          }}
        />
        <div aria-hidden className="uc-dot-light absolute inset-0 opacity-[0.04]" />

        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <ScrollReveal><Eyebrow>Bonus Draws</Eyebrow></ScrollReveal>
            <ScrollReveal delay={60} as="h2" className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#0f1222] sm:text-[36px] md:text-[44px]">
              Use Points. Join <span className="uc-gold-gradient">member-only rewards.</span>
            </ScrollReveal>
            <ScrollReveal delay={120} as="p" className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#4b5563] sm:text-[15.5px]">
              Transparent by design. Points, limits, and Winners — shown for every Bonus Draw.
            </ScrollReveal>
          </div>

          {loading ? (
            /* Draws skeleton — 3-card grid mirroring final DrawCard layout */
            <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <article key={i} className="overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white">
                  <div className="aspect-[4/3] w-full animate-pulse bg-[#F4F1FB]" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[#F4F1FB]" />
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-[#F4F1FB]" />
                      <div className="h-4 w-16 animate-pulse rounded bg-[#F4F1FB]" />
                    </div>
                    <div className="h-2 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
                    <div className="h-11 w-full animate-pulse rounded-full bg-[#F4F1FB]" />
                  </div>
                </article>
              ))}
            </div>
          ) : draws.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-[#e7e9f2] bg-white p-10 text-center">
              <p className="text-[14px] text-[#4b5563]">No Bonus Draws are open right now. Check back soon for new member-only rewards.</p>
            </div>
          ) : (
            <>
              <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {draws.map((draw: any, i: number) => (
                  <ScrollReveal
                    key={draw.id}
                    delay={(i % 3) * 80}
                    className={i >= 3 ? 'hidden sm:block' : ''}
                  >
                    <DrawCard
                      id={draw.id}
                      title={draw.title}
                      image={typeof draw.prizeImage === 'string' ? draw.prizeImage : draw.prizeImage?.url}
                      images={draw.images}
                      creditsPerEntry={draw.costPerEntry}
                      entrants={draw.entrants || 0}
                      cap={draw.cap ?? 100}
                      closedAt={draw.closedAt}
                      state={draw.state}
                      requiresMembership={draw.requiresMembership}
                    />
                  </ScrollReveal>
                ))}
              </div>

              {/* Mobile-only: View all Bonus Draws CTA when more than 3 draws exist */}
              {draws.length > 3 && (
                <div className="mt-8 flex justify-center sm:hidden">
                  <Link
                    href="/giveaways"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-6 text-[14px] font-semibold text-[#0f1222] transition-colors hover:border-[#c8c5ea] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356e5] focus-visible:ring-offset-2"
                  >
                    View all Bonus Draws
                    <Icon.ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <FuelRewards />

      <Boosters />

      <Faq />

      <NewsletterSection />

      {/* ----- Modals — preserved from original ----- */}
      {selectedUpgradePlanId && (
        <ConfirmModal
          isOpen={showUpgradeConfirm}
          onClose={() => {
            setShowUpgradeConfirm(false);
            setSelectedUpgradePlanId(null);
            if (actionLoading === `upgrade-${selectedUpgradePlanId}`) setActionLoading(null);
          }}
          onConfirm={handleConfirmUpgrade}
          title={`You're upgrading to ${plans.find((p: any) => p.id === selectedUpgradePlanId)?.name || 'this plan'}${plans.find((p: any) => p.id === selectedUpgradePlanId)?.tier === 'uni_plus' ? ' (Gold)' : plans.find((p: any) => p.id === selectedUpgradePlanId)?.tier === 'uni_max' ? ' (Platinum)' : plans.find((p: any) => p.id === selectedUpgradePlanId)?.tier === 'uni_one' ? ' (Silver)' : ''}.`}
          message={
            membership?.currentPeriodEnd
              ? `This change will take effect on your next billing date (${formatMembershipDate(membership.currentPeriodEnd)}). No payment will be charged today.`
              : 'This change will take effect on your next billing date. No payment will be charged today.'
          }
          confirmText="Confirm Upgrade"
          cancelText="Cancel"
          type="info"
        />
      )}

      <ConfirmModal
        isOpen={showDowngradeConfirm}
        onClose={() => {
          setShowDowngradeConfirm(false);
          setSelectedDowngradePlanId(null);
          if (selectedDowngradePlanId && actionLoading === `downgrade-${selectedDowngradePlanId}`) setActionLoading(null);
        }}
        onConfirm={handleConfirmDowngrade}
        title={`You're downgrading to ${plans.find((p: any) => p.id === selectedDowngradePlanId)?.name || 'this plan'}${plans.find((p: any) => p.id === selectedDowngradePlanId)?.tier === 'uni_plus' ? ' (Gold)' : plans.find((p: any) => p.id === selectedDowngradePlanId)?.tier === 'uni_max' ? ' (Platinum)' : plans.find((p: any) => p.id === selectedDowngradePlanId)?.tier === 'uni_one' ? ' (Silver)' : ''}.`}
        message={
          membership?.currentPeriodEnd
            ? `This change will take effect on your next billing date (${formatMembershipDate(membership.currentPeriodEnd)}). No payment will be charged today.`
            : 'This change will take effect on your next billing date. No payment will be charged today.'
        }
        confirmText="Confirm Downgrade"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
