'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function EntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mini' | 'major'>('mini');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    if (user) {
      loadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadEntries = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.entries.getUserEntries();
      console.log('Entries API response:', res);
      console.log('User ID:', user.id);
      
      // API returns array directly in res.data
      let entriesData: any[] = [];
      if (Array.isArray(res.data)) {
        entriesData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        entriesData = res.data.data;
      } else if (res.data?.entries && Array.isArray(res.data.entries)) {
        entriesData = res.data.entries;
      }
      
      console.log('Parsed entries:', entriesData);
      console.log('Entries count:', entriesData.length);
      setEntries(entriesData);
    } catch (error: any) {
      console.error('Error loading entries:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const { formatSydneyDateOnly } = require('@/lib/timezone');
    return formatSydneyDateOnly(date);
  };

  // Group entries by same draw + source + date (day) so we show one row with Count
  const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const entry of entries) {
      const key = `${entry.drawId ?? ''}-${entry.source ?? ''}-${dayKey(entry.createdAt)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return Array.from(groups.entries()).map(([key, groupItems]) => ({
      key,
      drawId: groupItems[0]?.drawId,
      draw: groupItems[0]?.draw,
      drawType: groupItems[0]?.draw?.drawType || null,
      source: groupItems[0]?.source,
      creditsSpent: groupItems[0]?.creditsSpent ?? 0,
      date: formatDate(groupItems[0]?.createdAt),
      createdAtRaw: new Date(groupItems[0]?.createdAt).getTime() || 0,
      count: groupItems.length,
      orderNoSample: groupItems.length === 1 ? groupItems[0].orderNo : null,
    }));
  }, [entries]);

  const visibleEntries = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return groupedEntries
      .filter((row) =>
        activeTab === 'mini'
          ? row.drawType === 'mini'
          : row.drawType === 'major',
      )
      .filter((row) => {
        if (!searchLower) return true;
        const title = row.draw?.title?.toLowerCase() || '';
        const order = row.orderNoSample?.toLowerCase() || '';
        return title.includes(searchLower) || order.includes(searchLower);
      })
      .sort((a, b) =>
        sortOrder === 'newest'
          ? b.createdAtRaw - a.createdAtRaw
          : a.createdAtRaw - b.createdAtRaw,
      );
  }, [groupedEntries, activeTab, search, sortOrder]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Entries</h1>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No entries yet</p>
            <Link href="/giveaways">
              <button className="btn-primary">Browse Draws</button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('mini')}
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
                  onClick={() => setActiveTab('major')}
                  className={`ml-1 px-3 py-1 text-sm font-medium rounded-md ${
                    activeTab === 'major'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Major Draw
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by draw or order no..."
                  className="w-56 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Draw</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      No entries found for this tab/search.
                    </td>
                  </tr>
                ) : (
                  visibleEntries.map((row) => (
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
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        row.source === 'membership_credit' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {row.source === 'membership_credit' ? 'Membership' : row.source === 'boost_credit' ? 'Boost' : row.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/giveaways/${row.drawId}`}>
                        <button className="text-purple-600 hover:text-purple-900">View Draw</button>
                      </Link>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

