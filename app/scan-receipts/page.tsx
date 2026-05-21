'use client';

/**
 * /scan-receipts
 * UNICASH receipt scanning explainer page.
 * Reuses Header + Footer mounted globally in app/layout.tsx.
 * UNICASH terminology only — Points / Bonus Draws / Fuel Rewards / Point Boosters / Membership.
 */

import { useCallback, useEffect, useReducer, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  Copy,
  Fuel,
  Gift,
  Lock,
  Receipt,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Unlock,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import ScanReceiptModal from '@/components/ScanReceiptModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import MembershipRequiredModal from '@/components/MembershipRequiredModal';

/* ------------------------------------------------------------------
   Brand tokens (kept inline to avoid touching globals.css)
------------------------------------------------------------------ */
const BRAND = {
  primary: '#6356E5',
  primaryHover: '#5346D6',
  gradEnd: '#8B7BFF',
  soft: '#F6F4FF',
  lavender: '#FBFAFF',
  border: '#E7E9F2',
  ink: '#0F1222',
  muted: '#667085',
  ok: '#10B981',
  warn: '#F59E0B',
  err: '#EF4444',
};

/* ------------------------------------------------------------------
   Data
------------------------------------------------------------------ */

type Step = { n: string; icon: LucideIcon; title: string; body: string };
const STEPS: Step[] = [
  {
    n: '01',
    icon: ScanLine,
    title: 'Scan Receipt',
    body: 'Upload an eligible fuel or shopping receipt.',
  },
  {
    n: '02',
    icon: ShieldCheck,
    title: 'Receipt Checked',
    body: 'We verify the receipt and check for duplicates.',
  },
  {
    n: '03',
    icon: Coins,
    title: 'Earn Points',
    body: 'Approved receipts add Points to your UNICASH account.',
  },
];

type Use = { icon: LucideIcon; title: string; body: string };
const USES: Use[] = [
  {
    icon: Gift,
    title: 'Selected gift cards',
    body: 'Coles, Woolworths, JB Hi-Fi and more.',
  },
  {
    icon: Fuel,
    title: 'Fuel Rewards',
    body: 'Top up your UNICASH wallet for fuel.',
  },
  {
    icon: Sparkles,
    title: 'Selected Bonus Draws',
    body: 'Use Points to enter Member Bonus Draws.',
  },
  {
    icon: BadgeCheck,
    title: 'Partner perks',
    body: 'Member-only offers from Aussie partners.',
  },
];

type Eligibility = { ok: boolean; text: string };
const ELIGIBLE: Eligibility[] = [
  { ok: true, text: 'Fuel receipts' },
  { ok: true, text: 'Selected shopping receipts' },
  { ok: true, text: 'Receipts with visible merchant, date and amount' },
  { ok: true, text: 'Receipts uploaded within the allowed time window' },
];
const NOT_ELIGIBLE: Eligibility[] = [
  { ok: false, text: 'Duplicate receipts' },
  { ok: false, text: 'Edited or unclear receipts' },
  { ok: false, text: 'Receipts missing key details' },
  { ok: false, text: 'Receipts outside the allowed period' },
];

/* 2026-05-20 — extended to the 10 canonical receipt states per
   feedback_unicash_state_coverage memory. The original 6-state model
   left idle / uploading / invalid / network_failure unrepresented. */
type StatusKey =
  | 'idle'
  | 'uploading'
  | 'scanning'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'duplicate'
  | 'invalid'
  | 'network_failure'
  | 'member'
  | 'redeemable';

type StatusToken = {
  key: StatusKey;
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  ring: string;
};

const STATUSES: Record<StatusKey, StatusToken> = {
  idle: {
    key: 'idle',
    label: 'Ready',
    icon: ScanLine,
    bg: 'bg-[#F4F1FB]',
    text: 'text-[#5648D8]',
    ring: 'ring-[#E0DAFF]',
  },
  uploading: {
    key: 'uploading',
    label: 'Uploading',
    icon: ScanLine,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  invalid: {
    key: 'invalid',
    label: 'Invalid Receipt',
    icon: AlertCircle,
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
  },
  network_failure: {
    key: 'network_failure',
    label: 'Connection Issue',
    icon: AlertCircle,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  scanning: {
    key: 'scanning',
    label: 'Scanning',
    icon: ScanLine,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  pending: {
    key: 'pending',
    label: 'Pending Review',
    icon: Clock,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  approved: {
    key: 'approved',
    label: 'Approved',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
  },
  rejected: {
    key: 'rejected',
    label: 'Rejected',
    icon: AlertCircle,
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
  },
  duplicate: {
    key: 'duplicate',
    label: 'Duplicate Receipt',
    icon: Copy,
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
  },
  member: {
    key: 'member',
    label: 'Membership Required',
    icon: Lock,
    bg: 'bg-[#F0EDFB]',
    text: 'text-[#6356E5]',
    ring: 'ring-[#DDD7FF]',
  },
  redeemable: {
    key: 'redeemable',
    label: 'Redeemable',
    icon: Gift,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
  },
};

const ACTIVITY: { merchant: string; subline: string; status: StatusKey; pts?: number }[] = [
  { merchant: 'Shell · Bondi Junction', subline: 'Today · Unleaded 95', status: 'approved', pts: 200 },
  { merchant: 'Coles · Newtown', subline: 'Today · Groceries', status: 'pending' },
  { merchant: 'Woolworths · Surry Hills', subline: '3h ago · Already submitted 12 Apr', status: 'duplicate' },
  { merchant: 'BP · Marrickville', subline: 'Yesterday · Receipt unclear', status: 'rejected' },
  { merchant: 'Bunnings · Alexandria', subline: '2d ago · 1,400 Points to redeem', status: 'redeemable' },
];

const FAQS = [
  {
    q: 'When do I receive Points?',
    a: 'Once your receipt is approved, Points are added to your wallet — usually within minutes for clean uploads. Some receipts may stay Pending while we validate them.',
  },
  {
    q: 'Can free users scan receipts?',
    a: 'Yes. Free users can scan eligible receipts and build a confirmed Points balance. Redemption requires an active UNICASH Membership.',
  },
  {
    q: 'What can I redeem Points for?',
    a: 'Selected gift cards, Fuel Rewards, selected Bonus Draws, and partner perks. The full menu is in your Member dashboard. 2,000 Points = $20 selected reward value.',
  },
  {
    q: 'Why was my receipt rejected?',
    a: 'Common reasons: duplicate upload, missing merchant or amount, edited image, or outside the allowed time window. The exact reason is shown in your receipt history.',
  },
];

/* ------------------------------------------------------------------
   Animation helpers
------------------------------------------------------------------ */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ------------------------------------------------------------------
   Reusable building blocks
------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={{ borderColor: BRAND.border, color: BRAND.primary }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: BRAND.primary }} />
      {children}
    </span>
  );
}

function StatusPill({ status, size = 'md' }: { status: StatusKey; size?: 'sm' | 'md' }) {
  const t = STATUSES[status];
  const Icon = t.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11px]';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${t.bg} ${t.text} ${t.ring} ${padding}`}
    >
      <Icon className={iconSize} aria-hidden />
      {t.label}
    </span>
  );
}

function PrimaryCTA({
  href,
  children,
  icon: Icon = ArrowRight,
}: {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-7 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
    >
      {children}
      <Icon className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function SecondaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#E0DAFF] bg-white/90 px-6 text-[14.5px] font-bold text-[#0F1222] backdrop-blur transition-colors hover:border-[#6356E5] hover:text-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------
   Hero — explainer animation
   Stages cycle: 0 idle → 1 scanning → 2 pending → 3 approved + flying points → 4 redeemable
------------------------------------------------------------------ */

type ExplainerStage = 0 | 1 | 2 | 3 | 4;

const SEQUENCE: { stage: ExplainerStage; hold: number }[] = [
  { stage: 1, hold: 1600 }, // scanning
  { stage: 2, hold: 1600 }, // pending review
  { stage: 3, hold: 2200 }, // approved + points fly
  { stage: 4, hold: 2400 }, // gift unlocked
  { stage: 0, hold: 1200 }, // reset
];

function useExplainerStage() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<ExplainerStage>(0);

  useEffect(() => {
    if (reduced) {
      setStage(4); // settle on final state for reduced motion users
      return;
    }
    let i = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      const step = SEQUENCE[i];
      setStage(step.stage);
      i = (i + 1) % SEQUENCE.length;
      timer = setTimeout(tick, step.hold);
    };
    timer = setTimeout(tick, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduced]);

  return stage;
}

function FlyingPoints({ active }: { active: boolean }) {
  // 3 small particles fly from receipt area to balance card
  if (!active) return null;
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute left-1/2 top-[34%] h-6 w-12 -translate-x-1/2 rounded-full px-2 text-[11px] font-bold text-white"
          style={{
            background: `linear-gradient(180deg, ${BRAND.primary} 0%, ${BRAND.gradEnd} 100%)`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 18px -6px rgba(99,86,229,.5)',
          }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, 80, 160, 200],
            x: [0, -20 + i * 20, -10 + i * 12, 0],
            scale: [0.6, 1, 0.95, 0.7],
          }}
          transition={{
            duration: 1.6,
            delay: i * 0.18,
            ease: 'easeOut',
          }}
        >
          +{i === 1 ? 100 : 50}
        </motion.span>
      ))}
    </>
  );
}

function PointsCounter({ stage }: { stage: ExplainerStage }) {
  const [val, setVal] = useState(1250);
  useEffect(() => {
    if (stage < 3) {
      setVal(1250);
      return;
    }
    // animate from 1250 → 1450 over ~1s
    const start = performance.now();
    const from = 1250;
    const to = 1450;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage]);
  return <span>{val.toLocaleString()}</span>;
}

function ExplainerVisual() {
  const stage = useExplainerStage();
  const heroStatus: StatusKey =
    stage === 1 ? 'scanning'
    : stage === 2 ? 'pending'
    : stage === 3 ? 'approved'
    : stage === 4 ? 'redeemable'
    : 'pending';

  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[480px] md:aspect-auto md:h-[600px] md:max-w-none">
      {/* Halo backdrop */}
      <div
        aria-hidden
        className="absolute inset-4 rounded-[36px]"
        style={{
          background: `linear-gradient(180deg, #ffffff 0%, ${BRAND.soft} 100%)`,
          boxShadow: '0 30px 80px -30px rgba(99,86,229,0.28), 0 8px 24px -12px rgba(15,18,34,0.08)',
        }}
      />

      {/* Receipt card */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="absolute left-6 right-6 top-8 mx-auto max-w-[280px] rounded-2xl border bg-white p-4 shadow-[0_24px_60px_-20px_rgba(15,18,34,0.18)]"
        style={{ borderColor: BRAND.border }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: '#FFF6DA', color: '#8a6a05' }}
            >
              <Receipt className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="text-[11px]">
              <p className="font-semibold" style={{ color: BRAND.ink }}>SHELL CITY</p>
              <p style={{ color: BRAND.muted }}>18/04/2026 · #8842-09</p>
            </div>
          </div>
          <StatusPill status={heroStatus} size="sm" />
        </div>

        <div className="mt-3 rounded-lg border border-dashed p-3 text-[12px]" style={{ borderColor: BRAND.border }}>
          <div className="flex justify-between"><span style={{ color: BRAND.muted }}>Unleaded 95</span><span className="font-semibold">42.18L</span></div>
          <div className="mt-1 flex justify-between"><span style={{ color: BRAND.muted }}>Total</span><span className="font-bold">$72.40</span></div>
        </div>

        {/* Scan line over receipt — only during scanning */}
        <AnimatePresence>
          {stage === 1 && (
            <motion.div
              key="scanline"
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-1 rounded-full"
              style={{
                width: '85%',
                background: `linear-gradient(90deg, transparent, ${BRAND.primary}, transparent)`,
                boxShadow: `0 0 24px ${BRAND.primary}`,
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: [0, 1, 1, 0], y: [6, 88, 110, 116] }}
              transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.1 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Flying points */}
      <FlyingPoints active={stage === 3} />

      {/* Points balance card */}
      <motion.div
        className="absolute bottom-44 left-6 w-[58%] rounded-2xl border bg-white p-4 shadow-[0_24px_60px_-24px_rgba(15,18,34,0.2)]"
        style={{ borderColor: BRAND.border, transform: 'rotate(-2deg)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: BRAND.muted }}>
          <Coins className="h-3.5 w-3.5" style={{ color: BRAND.primary }} aria-hidden />
          Your Points
        </div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <motion.span
            className="text-[28px] font-extrabold leading-none tracking-tight"
            style={{ color: BRAND.ink }}
            animate={{ scale: stage === 3 ? [1, 1.06, 1] : 1 }}
            transition={{ duration: 0.6 }}
          >
            <PointsCounter stage={stage} />
          </motion.span>
          <span className="text-[11px]" style={{ color: BRAND.muted }}>Pts</span>
        </div>
        <AnimatePresence>
          {stage >= 3 && (
            <motion.p
              key="added"
              className="mt-1 text-[11px] font-semibold"
              style={{ color: BRAND.primary }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              +200 Points · just now
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Gift card — locked → unlocked */}
      <motion.div
        className="absolute bottom-6 right-6 w-[52%] overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_24px_60px_-24px_rgba(15,18,34,0.2)]"
        style={{ borderColor: BRAND.border, transform: 'rotate(2.5deg)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div
          className="relative h-20 overflow-hidden rounded-xl"
          style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.gradEnd} 100%)` }}
        >
          <Gift className="absolute right-2 top-2 h-5 w-5 text-white/90" aria-hidden />
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold uppercase tracking-wider text-white/85">
            $20 Gift Card
          </span>
          <AnimatePresence>
            {stage < 4 && (
              <motion.div
                key="lock"
                aria-hidden
                className="absolute inset-0 flex items-center justify-center bg-[#0F1222]/55 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Lock className="h-6 w-6 text-white/90" aria-hidden />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {stage === 4 && (
              <motion.div
                key="unlock-glow"
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0, 0.85, 0], scale: [0.7, 1.4, 1.7] }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                style={{ background: `radial-gradient(circle, ${BRAND.gradEnd}, transparent 60%)` }}
              />
            )}
          </AnimatePresence>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold" style={{ color: BRAND.ink }}>
            Coles Gift Card
          </p>
          {stage === 4 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              <Unlock className="h-3 w-3" aria-hidden /> Unlocked
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: BRAND.muted }}>2,000 Pts</span>
          )}
        </div>
      </motion.div>

      {/* Trust chip pinned bottom */}
      <div
        className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 text-[11px] font-medium shadow-[0_8px_24px_-12px_rgba(15,18,34,0.2)] backdrop-blur"
        style={{ borderColor: BRAND.border, color: BRAND.ink }}
      >
        <ShieldCheck className="h-3.5 w-3.5" style={{ color: BRAND.primary }} aria-hidden />
        Receipt validated · UNICASH Member
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   FAQ accordion
------------------------------------------------------------------ */

function Faq() {
  const [open, dispatch] = useReducer(
    (state: number, idx: number) => (state === idx ? -1 : idx),
    0,
  );
  return (
    <div className="space-y-3">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            className="overflow-hidden rounded-2xl border bg-white"
            style={{ borderColor: BRAND.border }}
          >
            <button
              onClick={() => dispatch(i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-[15px] font-semibold tracking-tight" style={{ color: BRAND.ink }}>
                {f.q}
              </span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4" style={{ color: BRAND.primary }} aria-hidden />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <p className="px-5 pb-5 text-[14px] leading-relaxed" style={{ color: BRAND.muted }}>
                    {f.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------
   PAGE
------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Real receipts hook — fetches the signed-in member's receipt history
   and surfaces it in the activity preview. Guests / non-members
   continue to see the marketing ACTIVITY mock unchanged.
------------------------------------------------------------------ */
type RealReceipt = {
  id: string;
  status: 'uploaded' | 'processing' | 'needs_review' | 'approved' | 'rejected' | 'duplicate';
  merchantName?: string | null;
  receiptDate?: string | null;
  receiptTotal?: string | number | null;
  category?: string | null;
  pointsAwarded?: number;
  rejectReason?: string | null;
  createdAt?: string;
};

function mapBackendStatusToUiKey(s: RealReceipt['status']): StatusKey {
  if (s === 'uploaded' || s === 'processing') return 'scanning';
  if (s === 'needs_review') return 'pending';
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'duplicate') return 'duplicate';
  return 'pending';
}

function formatRelativeOrDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 60) return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function ScanReceiptsPage() {
  const { user } = useAuth();
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [myReceipts, setMyReceipts] = useState<RealReceipt[] | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  /* 2026-05-20 — surface API errors with a retry CTA instead of
     silently falling through to the empty state. */
  const [receiptsError, setReceiptsError] = useState<string | null>(null);

  const isActiveMember = user?.state === 'memberActive';

  /* Open scan flow with auth + membership gate. */
  const handleScanClick = useCallback(() => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (!isActiveMember) {
      setMemberModalOpen(true);
      return;
    }
    setScanModalOpen(true);
  }, [user, isActiveMember]);

  /* Fetch real receipts for active members (replaces mock activity preview). */
  const loadReceipts = useCallback(async () => {
    if (!isActiveMember) return;
    setReceiptsLoading(true);
    setReceiptsError(null);
    try {
      const res = await api.receipts.getMyReceipts({ limit: 5 });
      setMyReceipts((res.data as { items?: RealReceipt[] })?.items || []);
    } catch (err) {
      console.warn('[ScanReceipts] Failed to load receipts:', err);
      /* Distinct error state — don't silently fall into empty state. */
      setReceiptsError("We couldn't load your receipts. Check your connection and retry.");
      setMyReceipts(null);
    } finally {
      setReceiptsLoading(false);
    }
  }, [isActiveMember]);

  useEffect(() => {
    if (isActiveMember) loadReceipts();
  }, [isActiveMember, loadReceipts]);

  /* Reload receipts after a scan completes. */
  const handleScanComplete = useCallback(() => {
    loadReceipts();
  }, [loadReceipts]);

  return (
    <div className="bg-white" style={{ color: BRAND.ink }}>
      {/* ============== HERO ============== */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${BRAND.lavender} 0%, #ffffff 90%)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 460px at 88% -10%, #efecff 0%, rgba(247,245,255,0) 60%), radial-gradient(700px 380px at 6% 14%, #f7f5ff 0%, rgba(255,255,255,0) 60%)',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 md:grid-cols-12 md:gap-8 lg:px-8 lg:pt-20">
          <div className="flex flex-col md:col-span-6 lg:col-span-6">
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
              <Eyebrow>
                <ScanLine className="h-3 w-3" aria-hidden /> Scan Receipts
              </Eyebrow>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.05 }}
              className="mt-5 text-[40px] font-extrabold leading-[1.04] tracking-tight sm:text-[52px] lg:text-[60px]"
              style={{ color: BRAND.ink }}
            >
              Scan receipts.{' '}
              <span
                style={{
                  background: `linear-gradient(180deg, ${BRAND.primary} 0%, ${BRAND.gradEnd} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Earn Points.
              </span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="mt-6 max-w-xl text-[16px] leading-relaxed sm:text-[17px]"
              style={{ color: BRAND.muted }}
            >
              Upload eligible fuel and shopping receipts to collect UNICASH Points. Active Members can redeem
              confirmed Points for selected gift cards, Fuel Rewards, Bonus Draws, and partner perks.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.15 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <button
                type="button"
                onClick={handleScanClick}
                disabled={scanModalOpen}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-7 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Scan Receipt
                <ScanLine className="h-4 w-4" aria-hidden />
              </button>
              {/* Mobile/desktop split — shorter label on small viewports */}
              <SecondaryCTA href="#how-points-work">
                <span className="sm:hidden">How it works</span>
                <span className="hidden sm:inline">View How Points Work</span>
              </SecondaryCTA>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.2 }}
              className="mt-6 inline-flex items-center gap-2 text-[12.5px]"
              style={{ color: BRAND.muted }}
            >
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: BRAND.primary }} aria-hidden />
              Receipt validation, monthly caps and Membership terms apply.
            </motion.p>
          </div>

          <div className="md:col-span-6 lg:col-span-6">
            <ExplainerVisual />
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS — 3 STEPS ============== */}
      {/* 2026-05-20 — lavender bg (was bg-white) so white step cards
          stand out from section, matching /boost-packs how-it-works. */}
      <section id="how-points-work" className="bg-[#FBFAFF]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight sm:text-[36px] md:text-[40px]" style={{ color: BRAND.ink }}>
              Three simple{' '}
              <span className="bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] bg-clip-text text-transparent">
                steps.
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed sm:text-[15.5px]" style={{ color: BRAND.muted }}>
              From upload to confirmed Points — every step is shown in your dashboard.
            </p>
          </div>

          <div className="relative mt-10 sm:mt-12">
            {/* Mobile vertical connector */}
            <div
              aria-hidden
              className="absolute left-9 bottom-6 top-6 w-px md:hidden"
              style={{ background: `linear-gradient(180deg, ${BRAND.primary}40, transparent)` }}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.article
                    key={s.n}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:rounded-3xl sm:p-7"
                    style={{ borderColor: BRAND.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 sm:h-11 sm:w-11"
                        style={{ background: BRAND.soft, color: BRAND.primary, '--tw-ring-color': '#E0DAFF' } as React.CSSProperties}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                      </span>
                      <span
                        className="text-[32px] font-extrabold leading-none tracking-tight sm:text-[40px]"
                        style={{ color: '#D8D0F7' }}
                      >
                        {s.n}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[16.5px] font-extrabold tracking-tight sm:text-[18px]" style={{ color: BRAND.ink }}>
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed sm:text-[14px]" style={{ color: BRAND.muted }}>
                      {s.body}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============== POINTS VALUE ============== */}
      <section className="relative overflow-hidden" style={{ background: BRAND.lavender }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(700px 340px at 90% 100%, #efecff 0%, rgba(247,245,255,0) 60%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <Eyebrow>Points value</Eyebrow>
              <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight sm:text-[36px] md:text-[40px]" style={{ color: BRAND.ink }}>
                What are Points{' '}
                <span className="bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] bg-clip-text text-transparent">
                  worth?
                </span>
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed sm:text-[15px]" style={{ color: BRAND.muted }}>
                Points sit in your wallet as soon as a receipt is approved. Active Members redeem them for selected
                rewards across the UNICASH catalogue.
              </p>

              {/* Conversion card */}
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                variants={fadeUp}
                className="mt-6 overflow-hidden rounded-3xl border bg-white p-6 shadow-[0_24px_50px_-30px_rgba(15,18,34,.2)] sm:p-8"
                style={{ borderColor: BRAND.border }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRAND.muted }}>
                      Conversion
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-[36px] font-extrabold leading-none tracking-tight sm:text-[44px]" style={{ color: BRAND.ink }}>
                        2,000
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: BRAND.muted }}>Points</span>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6" style={{ color: BRAND.primary }} aria-hidden />
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRAND.muted }}>
                      Reward value
                    </p>
                    <div className="mt-2 flex items-baseline justify-end gap-1.5">
                      <span
                        className="text-[36px] font-extrabold leading-none tracking-tight sm:text-[44px]"
                        style={{
                          background: `linear-gradient(180deg, ${BRAND.primary} 0%, ${BRAND.gradEnd} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        $20
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: BRAND.muted }}>AUD</span>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-[12px]" style={{ color: BRAND.muted }}>
                  Active Membership required to redeem. Reward options may vary.
                </p>
              </motion.div>

              <p className="mt-6 rounded-2xl border bg-white/70 p-4 text-[12.5px] leading-relaxed" style={{ borderColor: BRAND.border, color: BRAND.muted }}>
                Points from receipts may appear as <span className="font-semibold" style={{ color: BRAND.ink }}>Pending</span> while we validate your upload. Confirmed Points can be redeemed by active Members, subject to monthly caps and reward availability.
              </p>
            </div>

            <div className="md:col-span-7">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRAND.muted }}>
                Use Points for
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {USES.map((u, i) => {
                  const Icon = u.icon;
                  return (
                    <motion.div
                      key={u.title}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: '-80px' }}
                      variants={fadeUp}
                      transition={{ delay: i * 0.06 }}
                      className="flex gap-3 rounded-2xl border bg-white p-5"
                      style={{ borderColor: BRAND.border }}
                    >
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1"
                        style={{ background: BRAND.soft, color: BRAND.primary, '--tw-ring-color': '#E0DAFF' } as React.CSSProperties}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-[14.5px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>{u.title}</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: BRAND.muted }}>{u.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== ELIGIBILITY ============== */}
      {/* 2026-05-20 — lavender bg so white eligible/not-eligible cards
          stand out, matching boost-packs section visual pattern. */}
      <section className="bg-[#FBFAFF]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Receipt eligibility</Eyebrow>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight sm:text-[36px] md:text-[40px]" style={{ color: BRAND.ink }}>
              What receipts are{' '}
              <span className="bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] bg-clip-text text-transparent">
                eligible?
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed sm:text-[15px]" style={{ color: BRAND.muted }}>
              Two simple lists. If your receipt fits the eligible list, Points usually arrive within minutes.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {[
              { title: 'Eligible', items: ELIGIBLE, accent: BRAND.ok, accentBg: 'bg-emerald-50', tone: 'emerald' as const },
              { title: 'Not eligible', items: NOT_ELIGIBLE, accent: BRAND.err, accentBg: 'bg-red-50', tone: 'red' as const },
            ].map((col) => (
              <motion.div
                key={col.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                variants={fadeUp}
                className="rounded-3xl border bg-white p-6 sm:p-7"
                style={{ borderColor: BRAND.border }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${col.accentBg}`}
                    style={{ color: col.accent }}
                  >
                    {col.tone === 'emerald' ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                    ) : (
                      <AlertCircle className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <h3 className="text-[18px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>
                    {col.title}
                  </h3>
                </div>
                <ul className="mt-5 flex flex-col gap-3">
                  {col.items.map((it) => (
                    <li key={it.text} className="flex items-start gap-2 text-[14px] leading-relaxed" style={{ color: BRAND.ink }}>
                      {it.ok ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                      ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                      )}
                      <span>{it.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Activity preview — surfaces the rest of the UI states */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="mt-10 overflow-hidden rounded-3xl border bg-white"
            style={{ borderColor: BRAND.border }}
          >
            <div
              className="flex items-center justify-between px-5 py-3 sm:px-6"
              style={{ background: BRAND.lavender, borderBottom: `1px solid ${BRAND.border}` }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRAND.primary }}>
                {isActiveMember ? 'Your recent receipts' : 'Receipt activity'}
              </p>
              <p className="text-[11px]" style={{ color: BRAND.muted }}>
                {isActiveMember
                  ? (myReceipts && myReceipts.length > 0 ? 'Last 5 receipts from your history' : 'No receipts scanned yet')
                  : 'Each receipt shows a clear status in your dashboard'}
              </p>
            </div>

            {isActiveMember ? (
              /* === REAL receipts list (active members) === */
              receiptsLoading && !myReceipts ? (
                <ul className="divide-y" style={{ borderColor: BRAND.border }}>
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                      <span className="h-9 w-9 shrink-0 animate-pulse rounded-xl" style={{ background: BRAND.soft }} />
                      <div className="flex-1 space-y-1.5">
                        <span className="block h-3.5 w-40 animate-pulse rounded" style={{ background: BRAND.soft }} />
                        <span className="block h-3 w-24 animate-pulse rounded" style={{ background: BRAND.soft }} />
                      </div>
                      <span className="h-5 w-20 animate-pulse rounded-full" style={{ background: BRAND.soft }} />
                    </li>
                  ))}
                </ul>
              ) : receiptsError ? (
                /* Error state with retry CTA (2026-05-20 — was silently
                   falling through to empty state on API failure). */
                <div className="px-5 py-10 text-center sm:px-6">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1"
                    style={{ background: '#FEF2F2', color: BRAND.err, '--tw-ring-color': '#FECACA' } as React.CSSProperties}
                  >
                    <AlertCircle className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-[15px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>
                    Couldn&apos;t load your receipts
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: BRAND.muted }}>{receiptsError}</p>
                  <button
                    type="button"
                    onClick={loadReceipts}
                    disabled={receiptsLoading}
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E0DAFF] bg-white px-6 text-[13.5px] font-bold text-[#0F1222] transition-colors hover:border-[#6356E5] hover:text-[#6356E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {receiptsLoading ? 'Retrying…' : 'Try again'}
                  </button>
                </div>
              ) : myReceipts && myReceipts.length > 0 ? (
                <ul className="divide-y" style={{ borderColor: BRAND.border }}>
                  {myReceipts.map((row) => {
                    const uiStatus = mapBackendStatusToUiKey(row.status);
                    const isFuel = row.category === 'fuel';
                    const merchantLabel = row.merchantName || 'Receipt';
                    const totalNum = row.receiptTotal != null ? Number(row.receiptTotal) : null;
                    const subParts: string[] = [];
                    subParts.push(formatRelativeOrDate(row.createdAt));
                    if (totalNum != null && Number.isFinite(totalNum)) subParts.push(`A$${totalNum.toFixed(2)}`);
                    if (row.status === 'rejected' && row.rejectReason) subParts.push(row.rejectReason.replace(/_/g, ' '));
                    const subline = subParts.filter(Boolean).join(' · ');
                    return (
                      <li
                        key={row.id}
                        className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
                        style={{ borderColor: BRAND.border }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: BRAND.soft, color: BRAND.primary }}
                          >
                            {isFuel ? <Fuel className="h-4 w-4" aria-hidden /> : <ShoppingBag className="h-4 w-4" aria-hidden />}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold" style={{ color: BRAND.ink }}>{merchantLabel}</p>
                            <p className="truncate text-[12px]" style={{ color: BRAND.muted }}>{subline}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {row.status === 'approved' && row.pointsAwarded != null && row.pointsAwarded > 0 && (
                            <span className="text-[13px] font-bold" style={{ color: BRAND.primary }}>+{row.pointsAwarded.toLocaleString()} Pts</span>
                          )}
                          <StatusPill status={uiStatus} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                /* Empty state for active members — encourage first scan */
                <div className="px-5 py-10 text-center sm:px-6">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1"
                    style={{ background: BRAND.soft, color: BRAND.primary, '--tw-ring-color': '#E0DAFF' } as React.CSSProperties}
                  >
                    <ScanLine className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-[15px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>No receipts scanned yet</p>
                  <p className="mt-1 text-[13px]" style={{ color: BRAND.muted }}>
                    Scan eligible fuel or shopping receipts to start earning Points.
                  </p>
                  <button
                    type="button"
                    onClick={handleScanClick}
                    disabled={scanModalOpen}
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-6 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.65)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ScanLine className="h-4 w-4" aria-hidden />
                    {/* Mobile/desktop split — shorter on small viewports */}
                    <span className="sm:hidden">Scan Receipt</span>
                    <span className="hidden sm:inline">Scan your first receipt</span>
                  </button>
                </div>
              )
            ) : (
              /* === Marketing mock list (guests + non-members) === */
              <ul className="divide-y" style={{ borderColor: BRAND.border }}>
                {ACTIVITY.map((row) => (
                  <li
                    key={row.merchant}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
                    style={{ borderColor: BRAND.border }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: BRAND.soft, color: BRAND.primary }}
                      >
                        {row.merchant.startsWith('Shell') || row.merchant.startsWith('BP') ? (
                          <Fuel className="h-4 w-4" aria-hidden />
                        ) : (
                          <ShoppingBag className="h-4 w-4" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold" style={{ color: BRAND.ink }}>{row.merchant}</p>
                        <p className="truncate text-[12px]" style={{ color: BRAND.muted }}>{row.subline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {row.pts && row.status === 'approved' && (
                        <span className="text-[13px] font-bold" style={{ color: BRAND.primary }}>+{row.pts.toLocaleString()} Pts</span>
                      )}
                      <StatusPill status={row.status} />
                    </div>
                  </li>
                ))}
                {/* Membership Required state */}
                <li
                  className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
                  style={{ background: BRAND.soft }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'white', color: BRAND.primary }}
                    >
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: BRAND.ink }}>Redeem 2,000 Points → $20 gift card</p>
                      <p className="text-[12px]" style={{ color: BRAND.muted }}>Active UNICASH Membership required to redeem</p>
                    </div>
                  </div>
                  <StatusPill status="member" />
                </li>
              </ul>
            )}
          </motion.div>
        </div>
      </section>

      {/* ============== MEMBERSHIP UNLOCK ============== */}
      <section style={{ background: BRAND.soft }}>
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="mx-auto max-w-3xl rounded-3xl border bg-white p-7 text-center sm:p-10"
            style={{ borderColor: BRAND.border, boxShadow: '0 24px 60px -30px rgba(99,86,229,.30)' }}
          >
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1"
              style={{ background: BRAND.lavender, color: BRAND.primary, '--tw-ring-color': '#E0DAFF' } as React.CSSProperties}
            >
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-[26px] font-extrabold tracking-tight sm:text-[34px]" style={{ color: BRAND.ink }}>
              Start earning for free.{' '}
              <span
                style={{
                  background: `linear-gradient(180deg, ${BRAND.primary} 0%, ${BRAND.gradEnd} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Redeem as a Member.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed sm:text-[15px]" style={{ color: BRAND.muted }}>
              Free users can scan eligible receipts and build confirmed Points. Active UNICASH Members can redeem
              confirmed Points for selected rewards.
            </p>
            <div className="mt-7">
              <PrimaryCTA href="/dashboard/membership">View Membership Plans</PrimaryCTA>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight sm:text-[36px]" style={{ color: BRAND.ink }}>
              Common{' '}
              <span className="bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] bg-clip-text text-transparent">
                questions.
              </span>
            </h2>
          </div>
          <div className="mt-8">
            <Faq />
          </div>
        </div>
      </section>

      {/* ============== MODALS — Phase 6 ==============
           - ScanReceiptModal: actual upload flow (active members only)
           - LoginRequiredModal: gate for guests
           - MembershipRequiredModal: gate for non-members + paused/canceled
           All three portal to document.body via createPortal. */}
      <ScanReceiptModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onComplete={handleScanComplete}
      />
      <LoginRequiredModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        redirectAfterLogin="/scan-receipts"
      />
      <MembershipRequiredModal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        context="scan-receipts"
        userState={user?.state}
      />

      {/* ============== FINAL CTA ============== */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div
            className="overflow-hidden rounded-3xl p-7 sm:p-10 lg:p-14"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.gradEnd} 100%)`,
              boxShadow: '0 30px 80px -30px rgba(99,86,229,0.55)',
            }}
          >
            <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2">
              <div>
                <h2 className="text-[28px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[36px]">
                  Ready to turn receipts into{' '}
                  <span className="bg-gradient-to-r from-[#FFE2B0] to-[#FFC85D] bg-clip-text text-transparent">
                    Points?
                  </span>
                </h2>
                <p className="mt-3 max-w-md text-[15px] text-white/85">
                  Scan eligible receipts. Earn Points. Redeem real value as an active UNICASH Member.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleScanClick}
                  disabled={scanModalOpen}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-[#6356E5] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#F4F1FB] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ScanLine className="h-4 w-4" aria-hidden />
                  Scan Receipt
                </button>
                <Link
                  href="/dashboard/membership"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-transparent px-6 text-[14.5px] font-bold text-white backdrop-blur transition-colors hover:border-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1432]"
                >
                  View Membership
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
