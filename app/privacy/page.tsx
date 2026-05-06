'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import LoadingRing from '@/components/LoadingRing';

export default function PrivacyPage() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.settings.getByKey('privacy_policy');
        setContent(response.data.value || '');
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
        // Fallback to empty content if API fails
        setContent('');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center py-12">
              <LoadingRing label="Loading privacy policy" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            {content ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <p className="text-gray-500">Content not available. Please contact support.</p>
            )}

            <p className="text-sm text-gray-500 mt-8">
              Last updated: {(() => {
                const { formatSydneyDateOnly } = require('@/lib/timezone');
                return formatSydneyDateOnly(new Date());
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

