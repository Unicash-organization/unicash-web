'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import LoadingRing from '@/components/LoadingRing';

interface PublicEntryRow {
  id: string;
  orderNo: string;
  ticketNumber: number | null;
  source: string;
  creditsSpent: number;
  createdAt: string;
  maskedName?: string;
  position?: number;
}

interface EntryStats {
  soldEntries: number;
  cap: number;
  remaining: number | null;
  entryLimitMode: 'single' | 'multi';
  maxEntriesPerMember: number | null;
}

const PAGE_SIZE = 50;

function formatEntryNumber(ticketNumber: number | null): string {
  if (ticketNumber == null) return '—';
  return String(ticketNumber).padStart(6, '0');
}

function getSourceLabel(source: string): string {
  if (source === 'membership_credit') return 'Membership Points';
  if (source === 'boost_credit') return 'Booster Points';
  if (source === 'external_payment') return 'One-time package';
  if (source === 'loyalty') return 'Loyalty';
  return source;
}

export default function DrawEntriesPage() {
  const params = useParams();
  const drawId = params?.id as string;

  const [draw, setDraw] = useState<any>(null);
  const [stats, setStats] = useState<EntryStats | null>(null);
  const [entries, setEntries] = useState<PublicEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // "Go to Draw Position" — jumps to the page holding that position + highlights it.
  const [posInput, setPosInput] = useState('');
  const [highlightPos, setHighlightPos] = useState<number | null>(null);
  // Free page-number jump.
  const [pageInput, setPageInput] = useState('');

  const loadDraw = useCallback(async () => {
    try {
      const [drawRes, statsRes] = await Promise.all([
        api.draws.get(drawId),
        api.draws.getEntryStats(drawId).catch(() => null),
      ]);
      setDraw(drawRes.data);
      if (statsRes?.data) setStats(statsRes.data as EntryStats);
    } catch (err) {
      console.error('Error loading draw:', err);
    }
  }, [drawId]);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.entries.getPublicDrawEntries(
        drawId,
        search || undefined,
        currentPage,
        PAGE_SIZE,
      );
      const payload: any = res.data;
      if (payload && typeof payload === 'object' && 'data' in payload) {
        setEntries(payload.data);
        setTotal(payload.total);
        setTotalPages(payload.totalPages);
      } else {
        setEntries(payload || []);
        setTotal(payload?.length || 0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Error loading entries:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [drawId, search, currentPage]);

  useEffect(() => {
    if (drawId) loadDraw();
  }, [drawId, loadDraw]);

  useEffect(() => {
    if (drawId) loadEntries();
  }, [drawId, loadEntries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(1);
  };

  const goToPage = (p: number) => {
    const target = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(target);
  };

  const handleJumpToPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const pos = parseInt(posInput.trim(), 10);
    if (!Number.isFinite(pos) || pos < 1) return;
    if (search) handleClearSearch(); // position numbering only applies to the full list
    setHighlightPos(pos);
    setCurrentPage(Math.ceil(pos / PAGE_SIZE));
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput.trim(), 10);
    if (!Number.isFinite(p)) return;
    goToPage(p);
    setPageInput('');
  };

  if (loading && !draw) {
    return <LoadingRing fullscreen label="Loading draw" />;
  }

  const cap = stats?.cap ?? draw?.cap ?? 0;
  const sold = stats?.soldEntries ?? total;
  const unlimited = cap === -1;
  const pct = unlimited || cap <= 0 ? 0 : Math.min(100, Math.round((sold / cap) * 100));

  return (
    <div className="min-h-screen bg-[#FBFAFF] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/giveaways/${drawId}`}
            className="text-[#6356E5] hover:text-[#5648D8] mb-3 inline-flex items-center gap-1 text-sm font-semibold"
          >
            ← Back to Draw
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Entry List{draw?.title ? ` — ${draw.title}` : ''}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Every entry in this Bonus Draw, shown for full transparency. Names are partially
            hidden for privacy.
          </p>
        </div>

        {/* Entry counter + progress */}
        <div className="bg-white rounded-2xl border border-[#E7E9F2] shadow-sm p-5 sm:p-6 mb-5">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm text-gray-500">Entries in this draw</p>
              <p className="text-3xl font-extrabold tracking-tight text-gray-900 mt-0.5">
                {sold.toLocaleString()}
                {!unlimited && (
                  <span className="text-gray-400 font-bold"> / {cap.toLocaleString()}</span>
                )}
              </p>
            </div>
            {!unlimited && (
              <div className="text-right">
                <p className="text-sm font-semibold text-[#6356E5]">{pct}% filled</p>
                {stats?.remaining != null && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {stats.remaining.toLocaleString()} remaining
                  </p>
                )}
              </div>
            )}
          </div>
          {!unlimited && (
            <div className="mt-3 h-2.5 w-full rounded-full bg-[#F0EEFB] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6356E5] to-[#8B7BFF] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          {stats?.entryLimitMode === 'single' && (
            <p className="mt-3 text-xs text-gray-500">
              This draw allows <span className="font-semibold text-gray-700">one entry per member</span>.
            </p>
          )}
          {stats?.entryLimitMode === 'multi' && (
            <p className="mt-3 text-xs text-gray-500">
              Members can hold multiple entries
              {stats.maxEntriesPerMember != null
                ? ` (up to ${stats.maxEntriesPerMember.toLocaleString()} each)`
                : ''}
              .
            </p>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-[#E7E9F2] shadow-sm p-4 sm:p-5 mb-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="search" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Search by entry number or order number
              </label>
              <input
                type="text"
                id="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. 089754 or UNC123456"
                className="w-full px-4 py-2.5 border border-[#E7E9F2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20 focus:border-[#6356E5]"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#6356E5] text-white rounded-xl text-sm font-semibold hover:bg-[#5648D8] transition"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}

        {/* Entries */}
        <div className="bg-white rounded-2xl border border-[#E7E9F2] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingRing label="Loading entries" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-gray-500">
                {search ? 'No entries match your search.' : 'No entries yet — be the first to enter.'}
              </p>
            </div>
          ) : (
            <>
              {/* Go to Draw Position — for the live random draw */}
              <form
                onSubmit={handleJumpToPosition}
                className="flex flex-wrap items-center gap-2 border-b border-[#E7E9F2] bg-[#FBFAFF] px-4 sm:px-6 py-3"
              >
                <label htmlFor="posjump" className="text-xs font-semibold text-gray-600">
                  Go to Draw Position
                </label>
                <input
                  id="posjump"
                  type="number"
                  min={1}
                  value={posInput}
                  onChange={(e) => setPosInput(e.target.value)}
                  placeholder="e.g. 3847"
                  className="w-28 rounded-lg border border-[#E7E9F2] px-3 py-1.5 text-sm focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#6356E5] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#5648D8]"
                >
                  Go
                </button>
                {highlightPos != null && (
                  <button
                    type="button"
                    onClick={() => {
                      setHighlightPos(null);
                      setPosInput('');
                    }}
                    className="px-2 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear highlight
                  </button>
                )}
              </form>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E7E9F2]">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Draw Position</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Member</th>
                      <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Entry Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEFB]">
                    {entries.map((entry) => {
                      const hl = highlightPos != null && entry.position === highlightPos;
                      return (
                        <tr key={entry.id} className={hl ? 'bg-[#F0EEFB]' : 'hover:bg-[#FBFAFF]'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex min-w-[2.75rem] items-center justify-center rounded-lg px-2.5 py-1 text-sm font-extrabold tabular-nums ${
                                hl ? 'bg-[#6356E5] text-white' : 'bg-[#F4F1FB] text-[#6356E5]'
                              }`}
                            >
                              {entry.position ?? '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {entry.maskedName || 'UNICASH Member'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-mono text-sm font-bold tracking-wider text-gray-900">
                              {formatEntryNumber(entry.ticketNumber)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="sm:hidden divide-y divide-[#F0EEFB]">
                {entries.map((entry) => {
                  const hl = highlightPos != null && entry.position === highlightPos;
                  return (
                    <li
                      key={entry.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3.5 ${hl ? 'bg-[#F0EEFB]' : ''}`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`inline-flex min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg px-2 py-0.5 text-xs font-extrabold tabular-nums ${
                            hl ? 'bg-[#6356E5] text-white' : 'bg-[#F4F1FB] text-[#6356E5]'
                          }`}
                        >
                          {entry.position ?? '—'}
                        </span>
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {entry.maskedName || 'UNICASH Member'}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-sm font-bold tracking-wider text-gray-900">
                        {formatEntryNumber(entry.ticketNumber)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-[#E7E9F2] bg-[#FBFAFF] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="rounded-lg border border-[#E7E9F2] bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">«</button>
                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg border border-[#E7E9F2] bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
                    <form onSubmit={handleJumpToPage} className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        placeholder={String(currentPage)}
                        aria-label="Jump to page"
                        className="w-14 rounded-lg border border-[#E7E9F2] px-2 py-1.5 text-center text-sm focus:border-[#6356E5] focus:outline-none focus:ring-2 focus:ring-[#6356E5]/20"
                      />
                      <span className="text-sm text-gray-500">/ {totalPages}</span>
                    </form>
                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-lg border border-[#E7E9F2] bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                    <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg border border-[#E7E9F2] bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">»</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Privacy + fairness note */}
        <div className="mt-5 bg-[#F4F1FB] border border-[#E7E9F2] rounded-2xl p-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Privacy &amp; fairness:</strong> Member names are
            partially hidden (e.g. “John V”) and no email, phone, or full surname is ever shown.
            Each entry has a fixed <strong className="text-gray-800">Draw Position</strong> that never
            changes — the winner is chosen by drawing a random position, making the result fully
            verifiable.
          </p>
        </div>
      </div>
    </div>
  );
}
