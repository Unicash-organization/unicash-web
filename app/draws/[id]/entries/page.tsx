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
            className="text-primary-600 hover:text-primary-700 mb-3 inline-flex items-center gap-1 text-sm font-semibold"
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
                <p className="text-sm font-semibold text-primary-600">{pct}% filled</p>
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
                className="w-full px-4 py-2.5 border border-[#E7E9F2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
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
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E7E9F2]">
                  <thead className="bg-[#FBFAFF]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entry Number</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Number</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEFB]">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#FBFAFF]">
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.maskedName || 'UNICASH Member'}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-primary-700">
                            {formatEntryNumber(entry.ticketNumber)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-mono text-gray-500">{entry.orderNo}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-700">{getSourceLabel(entry.source)}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-400">
                          {require('@/lib/timezone').formatSydneyDate(entry.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="sm:hidden divide-y divide-[#F0EEFB]">
                {entries.map((entry) => (
                  <li key={entry.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.maskedName || 'UNICASH Member'}
                      </span>
                      <span className="text-sm font-mono font-semibold text-primary-700">
                        {formatEntryNumber(entry.ticketNumber)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                      <span className="font-mono">{entry.orderNo}</span>
                      <span>{getSourceLabel(entry.source)}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-[#FBFAFF] px-4 sm:px-6 py-3.5 flex items-center justify-between border-t border-[#E7E9F2]">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total.toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-[#E7E9F2] bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-sm text-gray-500">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-[#E7E9F2] bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
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
            Each entry has a unique Entry Number used to select the winner transparently.
          </p>
        </div>
      </div>
    </div>
  );
}
