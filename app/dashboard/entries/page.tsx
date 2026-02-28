'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function EntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const groupedEntries = React.useMemo(() => {
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
      source: groupItems[0]?.source,
      creditsSpent: groupItems[0]?.creditsSpent ?? 0,
      date: formatDate(groupItems[0]?.createdAt),
      count: groupItems.length,
      orderNoSample: groupItems.length === 1 ? groupItems[0].orderNo : null,
    }));
  }, [entries]);

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
                {groupedEntries.map((row) => (
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

