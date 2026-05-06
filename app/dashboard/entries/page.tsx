'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import LoadingRing from '@/components/LoadingRing';

const PAGE_SIZE = 30;

type GroupedRow = {
  key: string;
  drawId: string;
  draw: { id: string; title: string; drawType: string };
  drawType: string;
  source: string;
  creditsSpent: number;
  date: string;
  count: number;
  orderNoSample: string | null;
};

/* -----------------------------------------------------------------------
   Source label mapping — UNICASH v4 terminology.
   Internal field names ('boost_credit', 'membership_credit') stay as-is;
   only the display label is mapped.
----------------------------------------------------------------------- */
const SOURCE_LABEL: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  membership_credit: { label: 'Membership',       bg: 'bg-[#F4F1FB]', text: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]' },
  boost_credit:      { label: 'Point Booster',    bg: 'bg-[#FFF6DA]', text: 'text-[#9C5410]', ring: 'ring-[#FFC85D]/40' },
  external_payment:  { label: 'One-time package', bg: 'bg-[#ECFDF5]', text: 'text-[#10B981]', ring: 'ring-[#A7F3D0]' },
};

const Icon = {
  ArrowRight: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Search: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Trophy: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Crown: ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 9H5L3 6l4.094 3.163a1 1 0 0 0 1.516-.293Z" />
      <path d="M5 21h14" />
    </svg>
  ),
};

export default function EntriesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAnyEntries, setHasAnyEntries] = useState(false);
  const [rows, setRows] = useState<GroupedRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'mini' | 'major'>('mini');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const formatDate = useCallback((date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  }, []);

  const loadPage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setHasAnyEntries(false);
      setRows([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const countsRes = await api.entries.getMyEntryCountsByDraw().catch(() => ({ data: [] }));
      const countsList = (countsRes.data || []) as { drawId: string; count: number }[];
      const any = countsList.reduce((acc, x) => acc + (Number(x.count) || 0), 0) > 0;
      setHasAnyEntries(any);
      if (!any) {
        setRows([]);
        setTotal(0);
        return;
      }
      const res = await api.entries
        .getMyEntriesGrouped({
          page,
          limit: PAGE_SIZE,
          drawType: activeTab,
          search: search.trim() || undefined,
          sort: sortOrder,
        })
        .catch(() => ({ data: { data: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 } }));
      const payload = res.data as {
        data: Array<{
          drawId: string;
          source: string;
          dayUtc: string;
          count: number;
          latestCreatedAt: string;
          sampleOrderNo: string | null;
          creditsSpent: number;
          draw: { id: string; title: string; drawType: string };
        }>;
        total: number;
      };
      const list = payload?.data || [];
      const mapped: GroupedRow[] = list.map((r) => {
        const count = Number(r.count) || 0;
        const rawOrder = r.sampleOrderNo != null ? String(r.sampleOrderNo).trim() : '';
        return {
          key: `${r.drawId}-${r.source}-${r.dayUtc}`,
          drawId: r.drawId,
          draw: r.draw,
          drawType: r.draw?.drawType || 'mini',
          source: r.source,
          creditsSpent: Number(r.creditsSpent) || 0,
          date: formatDate(r.latestCreatedAt),
          count,
          orderNoSample: rawOrder.length > 0 ? rawOrder : null,
        };
      });
      setRows(mapped);
      setTotal(typeof payload?.total === 'number' ? payload.total : 0);
    } finally {
      setLoading(false);
    }
  }, [user, page, activeTab, search, sortOrder, formatDate]);

  useEffect(() => { loadPage(); }, [loadPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = useMemo(
    () => (total <= 0 ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE))),
    [total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header — simple H1, no eyebrow (sidebar active state is breadcrumb) */}
      <header>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F1222] sm:text-[28px]">My Entries</h1>
      </header>

      {!user ? (
        <article className="rounded-3xl border border-[#E7E9F2] bg-white p-8 text-center">
          <p className="text-[13.5px] text-[#4B5563]">Sign in to view your entries.</p>
        </article>
      ) : loading ? (
        <>
          {/* Controls skeleton */}
          <article className="rounded-3xl border border-[#E7E9F2] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="h-9 w-48 animate-pulse rounded-full bg-[#F4F1FB]" />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-full animate-pulse rounded-full bg-[#F4F1FB] sm:w-60" />
                <div className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-[#F4F1FB]" />
              </div>
            </div>
          </article>
          {/* Data list skeleton */}
          <article className="rounded-3xl border border-[#E7E9F2] bg-white p-5 sm:p-6">
            <ul className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#F4F1FB]" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-4 w-48 max-w-full animate-pulse rounded bg-[#F4F1FB]" />
                    <div className="h-3 w-32 animate-pulse rounded bg-[#F4F1FB]" />
                  </div>
                  <div className="h-5 w-20 shrink-0 animate-pulse rounded bg-[#F4F1FB]" />
                </li>
              ))}
            </ul>
          </article>
        </>
      ) : !hasAnyEntries ? (
        <article className="overflow-hidden rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-10 text-center sm:py-12">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6356E5] ring-1 ring-[#E0DAFF]">
            <Icon.Trophy className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[15px] font-extrabold tracking-tight text-[#0F1222] sm:text-[16px]">No entries yet</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563]">
            Use your Points to access member-only Bonus Draws or join the Major Draw with your Membership.
          </p>
          <Link
            href="/giveaways"
            className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(99,86,229,0.55)] transition-all hover:from-[#5346D6] hover:to-[#7867EC]"
          >
            View Bonus Draws
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      ) : (
        <>
          {/* Tabs + Controls */}
          <article className="rounded-3xl border border-[#E7E9F2] bg-white p-4 shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Tabs */}
              <div className="inline-flex rounded-full bg-[#F4F1FB] p-0.5 ring-1 ring-[#E0DAFF]">
                {(['mini', 'major'] as const).map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setActiveTab(tab); setPage(1); }}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
                        active ? 'bg-white text-[#0F1222] shadow-[0_1px_2px_rgba(15,18,34,.06)]' : 'text-[#667085] hover:text-[#0F1222]'
                      }`}
                    >
                      {tab === 'mini' ? 'Bonus Draws' : 'Major Draws'}
                    </button>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search draw or order no…"
                    className="h-10 w-full rounded-full border border-[#E0DAFF] bg-white pl-9 pr-3 text-[12.5px] text-[#0F1222] placeholder:text-[#667085] focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20 sm:w-60"
                  />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value as 'newest' | 'oldest'); setPage(1); }}
                  className="h-10 shrink-0 rounded-full border border-[#E0DAFF] bg-white px-3 text-[12.5px] font-semibold text-[#0F1222] focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>
          </article>

          {/* Mobile cards / Desktop table */}
          {rows.length === 0 ? (
            <article className="rounded-3xl border border-dashed border-[#E0DAFF] bg-[#FBFAFF] px-5 py-10 text-center">
              <p className="text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">No entries found</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
                Try adjusting your search or switching tabs.
              </p>
            </article>
          ) : (
            <>
              {/* Mobile: card list */}
              <ul className="space-y-2.5 sm:hidden">
                {rows.map((row) => {
                  const sourceCfg = SOURCE_LABEL[row.source] || { label: row.source, bg: 'bg-[#F4F1FB]', text: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]' };
                  return (
                    <li key={row.key}>
                      <article className="rounded-2xl border border-[#E7E9F2] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,18,34,.04)]">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5] ring-1 ring-[#E0DAFF]">
                            {row.drawType === 'major' ? <Icon.Crown className="h-4 w-4" /> : <Icon.Trophy className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-extrabold tracking-tight text-[#0F1222]">{row.draw?.title || 'Draw'}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${sourceCfg.bg} ${sourceCfg.text} ${sourceCfg.ring}`}>
                                {sourceCfg.label}
                              </span>
                              <span className="text-[11px] text-[#667085]">{row.date}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[15px] font-extrabold tracking-tight text-[#0F1222] tabular-nums">×{row.count}</p>
                            <p className="text-[10.5px] font-semibold text-[#667085]">{row.creditsSpent} Pts</p>
                          </div>
                        </div>

                        {(row.orderNoSample || activeTab === 'mini') && (
                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EFEDF5] pt-2.5">
                            {row.orderNoSample ? (
                              <p className="truncate text-[10.5px] text-[#667085]">
                                Order: <span className="font-mono text-[#0F1222]">{row.orderNoSample}</span>
                              </p>
                            ) : <span />}
                            {activeTab === 'mini' && (
                              <Link
                                href={`/giveaways/${row.drawId}`}
                                className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-bold text-[#6356E5] hover:text-[#5346D6]"
                              >
                                View Draw
                                <Icon.ArrowRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop: table */}
              <article className="hidden overflow-hidden rounded-3xl border border-[#E7E9F2] bg-white shadow-[0_1px_2px_rgba(15,18,34,.04)] sm:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#EFEDF5]">
                    <thead className="bg-[#FBFAFF]">
                      <tr>
                        <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Order No</th>
                        <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Draw</th>
                        <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Points</th>
                        <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Source</th>
                        <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Date</th>
                        <th className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085]">Count</th>
                        {activeTab === 'mini' && <th className="px-5 py-3" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEDF5] bg-white">
                      {rows.map((row) => {
                        const sourceCfg = SOURCE_LABEL[row.source] || { label: row.source, bg: 'bg-[#F4F1FB]', text: 'text-[#6356E5]', ring: 'ring-[#E0DAFF]' };
                        return (
                          <tr key={row.key} className="transition-colors hover:bg-[#FBFAFF]">
                            <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] text-[#0F1222]">{row.orderNoSample ?? '—'}</td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-[13px] font-semibold text-[#0F1222]">{row.draw?.title || '—'}</td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-[13px] font-extrabold text-[#0F1222] tabular-nums">{row.creditsSpent}</td>
                            <td className="whitespace-nowrap px-5 py-3.5">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ring-1 ${sourceCfg.bg} ${sourceCfg.text} ${sourceCfg.ring}`}>
                                {sourceCfg.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-[12.5px] text-[#667085]">{row.date}</td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-[13px] font-extrabold text-[#0F1222] tabular-nums">{row.count}</td>
                            {activeTab === 'mini' && (
                              <td className="whitespace-nowrap px-5 py-3.5 text-right">
                                <Link
                                  href={`/giveaways/${row.drawId}`}
                                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#6356E5] hover:text-[#5346D6]"
                                >
                                  View Draw
                                  <Icon.ArrowRight className="h-3 w-3" />
                                </Link>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-[#E7E9F2] bg-white px-4 py-3 sm:px-5">
              <span className="text-[12px] text-[#667085]">
                Page {page} of {totalPages}{' '}
                <span className="hidden sm:inline">({total} groups)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-9 items-center rounded-full border border-[#E0DAFF] bg-white px-3.5 text-[12px] font-bold text-[#0F1222] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-9 items-center rounded-full border border-[#E0DAFF] bg-white px-3.5 text-[12px] font-bold text-[#0F1222] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
