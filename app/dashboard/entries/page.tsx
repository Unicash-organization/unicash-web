'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

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
      const any =
        countsList.reduce((acc, x) => acc + (Number(x.count) || 0), 0) > 0;
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
        .catch(() => ({
          data: { data: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 },
        }));

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
        return {
          key: `${r.drawId}-${r.source}-${r.dayUtc}`,
          drawId: r.drawId,
          draw: r.draw,
          drawType: r.draw?.drawType || 'mini',
          source: r.source,
          creditsSpent: Number(r.creditsSpent) || 0,
          date: formatDate(r.latestCreatedAt),
          count,
          orderNoSample: count === 1 ? (r.sampleOrderNo ?? null) : null,
        };
      });
      setRows(mapped);
      setTotal(typeof payload?.total === 'number' ? payload.total : 0);
    } finally {
      setLoading(false);
    }
  }, [user, page, activeTab, search, sortOrder, formatDate]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

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
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Entries</h1>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {!user ? (
          <div className="p-12 text-center text-gray-600">Sign in to view entries.</div>
        ) : loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : !hasAnyEntries ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No entries yet</p>
            <Link href="/giveaways">
              <button className="btn-primary">Browse Draws</button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-wrap gap-3">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mini');
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    activeTab === 'mini'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Mini Draw
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('major');
                    setPage(1);
                  }}
                  className={`ml-1 px-3 py-1 text-sm font-medium rounded-md ${
                    activeTab === 'major'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Major Draw
                </button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by draw or order no..."
                  className="w-56 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as 'newest' | 'oldest');
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Draw</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  {activeTab === 'mini' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === 'major' ? 6 : 7}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      No entries found for this tab or search.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.orderNoSample ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.draw?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.creditsSpent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            row.source === 'membership_credit'
                              ? 'bg-blue-100 text-blue-800'
                              : row.source === 'external_payment'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {row.source === 'membership_credit'
                            ? 'Membership'
                            : row.source === 'boost_credit'
                              ? 'Boost'
                              : row.source === 'external_payment'
                                ? 'One-time package'
                                : row.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.count}
                      </td>
                      {activeTab === 'mini' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/giveaways/${row.drawId}`}>
                            <button className="text-purple-600 hover:text-purple-900">View Draw</button>
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-600 border-t border-gray-100">
                <span>
                  Page {page} of {totalPages} ({total} groups)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
