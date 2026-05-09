'use client';

/**
 * /dashboard/receipts — My Receipts
 *
 * Full receipt history for active members. Reached from the dashboard
 * sidebar (My Receipts). Non-members see a membership upsell card.
 *
 * Layout follows the dashboard rhythm used by Entries / Purchases pages:
 *   <header> + cards inside `space-y-5 sm:space-y-6`.
 *
 * Data flow:
 *   - api.receipts.getMyReceipts({ status, page, limit }) — paginated
 *   - status filter: All | Approved | Pending | Rejected
 *   - "Scan a receipt" CTA opens ScanReceiptModal (reused from Phase 6)
 *   - On scan complete, list reloads from page 1
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import ScanReceiptModal from '@/components/ScanReceiptModal';
import MembershipRequiredModal from '@/components/MembershipRequiredModal';

/* -----------------------------------------------------------------------
   Inline icons — match dashboard pattern
----------------------------------------------------------------------- */
const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Camera: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Fuel: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 22V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v18" />
      <path d="M3 12h11" />
      <path d="M14 8h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2v0a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v-7" />
      <path d="M18 7l1.5-1.5" />
    </svg>
  ),
  Shopping: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Coins: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
  Check: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clock: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Alert: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  Copy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Scan: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  ),
};

/* -----------------------------------------------------------------------
   Types — mirror backend Receipt schema
----------------------------------------------------------------------- */
type ReceiptStatus =
  | 'uploaded'
  | 'processing'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'duplicate';

interface Receipt {
  id: string;
  status: ReceiptStatus;
  merchantName?: string | null;
  receiptDate?: string | null;
  receiptTotal?: string | number | null;
  category?: string | null;
  fuelLitres?: string | number | null;
  fuelType?: string | null;
  pointsAwarded?: number;
  pointsCalculated?: number;
  rejectReason?: string | null;
  imageUrl?: string;
  createdAt?: string;
  approvedAt?: string;
}

/* -----------------------------------------------------------------------
   Status badge config — covers all 6 backend statuses
----------------------------------------------------------------------- */
type StatusConfig = {
  label: string;
  pillBg: string;
  pillText: string;
  ring: string;
  Icon: React.FC<{ className?: string }>;
};

const STATUS_DISPLAY: Record<ReceiptStatus, StatusConfig> = {
  uploaded:     { label: 'Uploaded',    pillBg: 'bg-[#FEF3C7]', pillText: 'text-[#9C5410]', ring: 'ring-[#FFC85D]/40', Icon: Icon.Clock },
  processing:   { label: 'Processing',  pillBg: 'bg-[#FEF3C7]', pillText: 'text-[#9C5410]', ring: 'ring-[#FFC85D]/40', Icon: Icon.Clock },
  needs_review: { label: 'Pending review', pillBg: 'bg-[#FEF3C7]', pillText: 'text-[#9C5410]', ring: 'ring-[#FFC85D]/40', Icon: Icon.Clock },
  approved:     { label: 'Approved',    pillBg: 'bg-[#ECFDF5]', pillText: 'text-[#10B981]', ring: 'ring-[#A7F3D0]', Icon: Icon.Check },
  rejected:     { label: 'Rejected',    pillBg: 'bg-[#FEE2E2]', pillText: 'text-[#B91C1C]', ring: 'ring-[#FCA5A5]', Icon: Icon.Alert },
  duplicate:    { label: 'Duplicate',   pillBg: 'bg-[#FEE2E2]', pillText: 'text-[#B91C1C]', ring: 'ring-[#FCA5A5]', Icon: Icon.Copy },
};

/* -----------------------------------------------------------------------
   Filter pills — backend `status` param maps to single string
----------------------------------------------------------------------- */
type FilterKey = 'all' | 'approved' | 'pending' | 'rejected';

const FILTER_TO_BACKEND: Record<FilterKey, string | undefined> = {
  all:      undefined,
  approved: 'approved',
  pending:  'needs_review',
  rejected: 'rejected',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending',  label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 20;

/* -----------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------- */
function formatAUD(amount: number | string | null | undefined): string {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return `A$${n.toFixed(2)}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatRejectReason(reason: string): string {
  return reason.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/* =======================================================================
   PAGE
======================================================================= */
export default function MyReceiptsPage() {
  const { user } = useAuth();
  const isActiveMember = user?.state === 'memberActive';

  /* -------- modal state -------- */
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  /* -------- list state -------- */
  const [filter, setFilter] = useState<FilterKey>('all');
  const [items, setItems] = useState<Receipt[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0); // race-condition guard for filter changes

  /* -------- fetch helper -------- */
  const fetchReceipts = useCallback(
    async (opts: { filterKey: FilterKey; page: number; append: boolean }) => {
      if (!isActiveMember) return;
      const myReqId = ++reqIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const status = FILTER_TO_BACKEND[opts.filterKey];
        const res = await api.receipts.getMyReceipts({
          status,
          page: opts.page,
          limit: PAGE_SIZE,
        });
        // Ignore stale responses (filter switched mid-flight)
        if (myReqId !== reqIdRef.current) return;
        const payload = res.data as { items?: Receipt[]; total?: number };
        const newItems = payload.items || [];
        setItems((prev) => (opts.append ? [...prev, ...newItems] : newItems));
        setTotal(payload.total ?? newItems.length);
      } catch (err: any) {
        if (myReqId !== reqIdRef.current) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load receipts.');
      } finally {
        if (myReqId === reqIdRef.current) setLoading(false);
      }
    },
    [isActiveMember],
  );

  /* -------- initial + filter change -------- */
  useEffect(() => {
    setPage(1);
    fetchReceipts({ filterKey: filter, page: 1, append: false });
  }, [filter, fetchReceipts]);

  /* -------- "Load more" -------- */
  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReceipts({ filterKey: filter, page: next, append: true });
  };

  /* -------- "Scan a receipt" CTA -------- */
  const handleOpenScan = () => {
    if (!isActiveMember) {
      setMemberModalOpen(true);
      return;
    }
    setScanModalOpen(true);
  };

  /* -------- after scan complete: refresh page 1 -------- */
  const handleScanComplete = useCallback(() => {
    setPage(1);
    fetchReceipts({ filterKey: filter, page: 1, append: false });
  }, [filter, fetchReceipts]);

  /* -------- derived stats — only computed on currently loaded items.
            For simplicity (avoids extra endpoint). Stats reset when filter
            changes; user can switch to "All" to see global totals. -------- */
  const stats = useMemo(() => {
    let approvedCount = 0;
    let totalPoints = 0;
    let pendingCount = 0;
    items.forEach((r) => {
      if (r.status === 'approved') {
        approvedCount += 1;
        totalPoints += Number(r.pointsAwarded) || 0;
      } else if (r.status === 'needs_review' || r.status === 'uploaded' || r.status === 'processing') {
        pendingCount += 1;
      }
    });
    return { approvedCount, totalPoints, pendingCount };
  }, [items]);

  const hasMore = items.length < total;

  /* =====================================================================
     RENDER
  ===================================================================== */
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============== HEADER ============== */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6356E5] sm:hidden">My Receipts</p>
          <h1 className="mt-1 text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:mt-0 sm:text-[28px]">
            <span className="sm:hidden">Receipts</span>
            <span className="hidden sm:inline">My Receipts</span>
          </h1>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563] sm:text-[13px]">
            Track scanned receipts and Points earned.
          </p>
        </div>
        {isActiveMember && (
          <button
            type="button"
            onClick={handleOpenScan}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6356E5] focus-visible:ring-offset-2"
          >
            <Icon.Scan className="h-4 w-4 shrink-0" />
            Scan a receipt
          </button>
        )}
      </header>

      {/* ============== NON-MEMBER GATE ============== */}
      {!isActiveMember && (
        <article className="overflow-hidden rounded-3xl border border-[#E0DAFF] bg-white shadow-[0_18px_50px_-30px_rgba(99,86,229,0.20)]">
          <div className="px-5 py-6 sm:px-7 sm:py-7">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
              <Icon.Crown className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-[20px] font-extrabold tracking-tight text-[#0F1222] sm:text-[22px]">
              Members earn Points from receipts
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#4B5563]">
              Become an active UNICASH Member to scan eligible receipts and earn Points for Bonus Draws or selected gift cards.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#membership-plans"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
              >
                View Memberships
                <Icon.ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/scan-receipts"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#E0DAFF] bg-white px-5 text-[13.5px] font-bold text-[#6356E5] transition-colors hover:border-[#6356E5]"
              >
                Learn how it works
              </Link>
            </div>
          </div>
        </article>
      )}

      {/* ============== STATS SUMMARY ============== */}
      {isActiveMember && (
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
            Receipts overview
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-2xl bg-[#ECFDF5] p-3 ring-1 ring-[#A7F3D0]/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#10B981]">Approved</p>
              <p className="mt-0.5 text-[22px] font-extrabold leading-none tracking-tight tabular-nums text-[#0F1222] sm:text-[24px]">
                {stats.approvedCount}
              </p>
            </div>
            <div className="rounded-2xl bg-[#FEF3C7] p-3 ring-1 ring-[#FFC85D]/40">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9C5410]">Pending</p>
              <p className="mt-0.5 text-[22px] font-extrabold leading-none tracking-tight tabular-nums text-[#0F1222] sm:text-[24px]">
                {stats.pendingCount}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F4F1FB] p-3 ring-1 ring-[#E0DAFF]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6356E5]">
                <span className="sm:hidden">Earned</span>
                <span className="hidden sm:inline">Points earned</span>
              </p>
              <p className="mt-0.5 text-[22px] font-extrabold leading-none tracking-tight tabular-nums text-[#0F1222] sm:text-[24px]">
                {stats.totalPoints.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-[#667085]">
            {filter === 'all'
              ? `Across all ${items.length} loaded receipt${items.length === 1 ? '' : 's'}`
              : `Across loaded ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} receipts`}
          </p>
        </article>
      )}

      {/* ============== FILTER PILLS + LIST ============== */}
      {isActiveMember && (
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-6">
          {/* Filter pills */}
          <div className="overflow-x-auto">
            <div className="inline-flex rounded-full bg-[#F4F1FB] p-0.5 ring-1 ring-[#E0DAFF]">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={active}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
                      active
                        ? 'bg-white text-[#0F1222] shadow-[0_1px_2px_rgba(15,18,34,.06)]'
                        : 'text-[#667085] hover:text-[#0F1222]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl bg-[#FEF2F2] p-4 ring-1 ring-[#FCA5A5]/60">
              <div className="flex items-start gap-2.5">
                <Icon.Alert className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
                <p className="text-[13px] leading-relaxed text-[#991B1B]">{error}</p>
              </div>
            </div>
          )}

          {/* List body */}
          {loading && items.length === 0 ? (
            <ul className="mt-4 space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border border-[#E7E9F2] p-3">
                  <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-[#F4F1FB]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-[#F4F1FB]" />
                    <div className="h-3 w-28 animate-pulse rounded bg-[#F4F1FB]" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-[#F4F1FB]" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="mt-4 rounded-2xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-4 py-10 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
                <Icon.Camera className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[14.5px] font-extrabold tracking-tight text-[#0F1222]">
                {filter === 'all' ? 'No receipts scanned yet' : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} receipts`}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563]">
                {filter === 'all'
                  ? 'Scan a fuel receipt to start earning Points.'
                  : 'Try a different filter or scan a new receipt.'}
              </p>
              {filter === 'all' && (
                <button
                  type="button"
                  onClick={handleOpenScan}
                  className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-4 text-[12.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
                >
                  <Icon.Scan className="h-3.5 w-3.5" />
                  Scan your first receipt
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="mt-4 space-y-2.5">
                {items.map((r) => (
                  <ReceiptRow key={r.id} receipt={r} />
                ))}
              </ul>

              {/* Load more */}
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E0DAFF] bg-white px-5 text-[12.5px] font-bold text-[#6356E5] transition-colors hover:border-[#6356E5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Loading…' : 'Load more'}
                    {!loading && <Icon.ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}

              <p className="mt-3 text-center text-[11px] text-[#667085]">
                Showing {items.length} of {total.toLocaleString()} receipt{total === 1 ? '' : 's'}
              </p>
            </>
          )}
        </article>
      )}

      {/* ============== MODALS ============== */}
      <ScanReceiptModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onComplete={handleScanComplete}
      />
      <MembershipRequiredModal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        context="scan-receipts"
        userState={user?.state}
      />
    </div>
  );
}

/* =======================================================================
   RECEIPT ROW
======================================================================= */
function ReceiptRow({ receipt }: { receipt: Receipt }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_DISPLAY[receipt.status];
  const StatusIcon = cfg.Icon;

  const isFuel = receipt.category === 'fuel';
  const merchant = receipt.merchantName || (receipt.status === 'uploaded' || receipt.status === 'processing' ? 'Receipt processing…' : 'Receipt');
  const totalNum = receipt.receiptTotal != null ? Number(receipt.receiptTotal) : null;
  const points = receipt.status === 'approved' ? (Number(receipt.pointsAwarded) || 0) : 0;
  const litresNum = receipt.fuelLitres != null ? Number(receipt.fuelLitres) : null;

  /* Subline composition. Approved → date · amount. Rejected → reason. Pending → uploaded relative time. */
  const subline = (() => {
    const parts: string[] = [];
    if (receipt.status === 'approved' || receipt.status === 'duplicate') {
      if (receipt.receiptDate) parts.push(formatDate(receipt.receiptDate));
      if (totalNum != null && Number.isFinite(totalNum)) parts.push(formatAUD(totalNum));
    } else if (receipt.status === 'rejected' && receipt.rejectReason) {
      parts.push(formatRejectReason(receipt.rejectReason));
      if (totalNum != null && Number.isFinite(totalNum)) parts.push(formatAUD(totalNum));
    } else {
      parts.push(formatRelative(receipt.createdAt));
    }
    return parts.filter(Boolean).join(' · ');
  })();

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="group flex w-full items-center gap-3 rounded-2xl border border-[#E7E9F2] bg-white p-3 text-left transition-all hover:border-[#C9C0F2] hover:shadow-[0_8px_24px_-12px_rgba(99,86,229,0.20)]"
      >
        {/* Thumbnail / icon */}
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
          {isFuel ? <Icon.Fuel className="h-5 w-5" /> : <Icon.Shopping className="h-5 w-5" />}
        </span>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-extrabold tracking-tight text-[#0F1222]">{merchant}</p>
          <p className="mt-0.5 truncate text-[12px] text-[#667085]">{subline}</p>
        </div>

        {/* Right side: points + status */}
        <div className="flex flex-col items-end gap-1.5">
          {points > 0 && (
            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold tracking-tight tabular-nums text-[#6356E5]">
              <Icon.Coins className="h-3.5 w-3.5" />
              +{points.toLocaleString()}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${cfg.pillBg} ${cfg.pillText} ${cfg.ring}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-2 rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-4 text-[12.5px]">
          <dl className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-[#667085]">Merchant</dt>
              <dd className="truncate text-right font-extrabold tracking-tight text-[#0F1222]">{merchant}</dd>
            </div>
            {receipt.receiptDate && (
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-[#667085]">Receipt date</dt>
                <dd className="text-right text-[#0F1222]">{formatDate(receipt.receiptDate)}</dd>
              </div>
            )}
            {totalNum !== null && Number.isFinite(totalNum) && (
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-[#667085]">Total</dt>
                <dd className="text-right font-extrabold tracking-tight tabular-nums text-[#0F1222]">{formatAUD(totalNum)}</dd>
              </div>
            )}
            {isFuel && (litresNum !== null || receipt.fuelType) && (
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-[#667085]">Fuel</dt>
                <dd className="text-right text-[#0F1222]">
                  {litresNum !== null && Number.isFinite(litresNum) ? `${litresNum.toFixed(2)}L` : ''}
                  {litresNum !== null && Number.isFinite(litresNum) && receipt.fuelType ? ' · ' : ''}
                  {receipt.fuelType || ''}
                </dd>
              </div>
            )}
            {receipt.status === 'approved' && (
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-[#667085]">Points awarded</dt>
                <dd className="text-right font-extrabold tracking-tight tabular-nums text-[#10B981]">+{points.toLocaleString()} Pts</dd>
              </div>
            )}
            {receipt.status === 'approved' && receipt.pointsCalculated != null && receipt.pointsCalculated > points && (
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-[#667085]">Calculated</dt>
                <dd className="text-right text-[12px] text-[#667085]">
                  {receipt.pointsCalculated.toLocaleString()} Pts (capped to monthly limit)
                </dd>
              </div>
            )}
            {receipt.status === 'rejected' && receipt.rejectReason && (
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-[#667085]">Reason</dt>
                <dd className="text-right text-[#B91C1C]">{formatRejectReason(receipt.rejectReason)}</dd>
              </div>
            )}
            {receipt.createdAt && (
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-[#667085]">Submitted</dt>
                <dd className="text-right text-[#667085]">{formatRelative(receipt.createdAt)}</dd>
              </div>
            )}
          </dl>

          {/* Receipt image preview if available */}
          {receipt.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#E0DAFF] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.imageUrl}
                alt="Receipt"
                className="h-auto max-h-[300px] w-full object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
