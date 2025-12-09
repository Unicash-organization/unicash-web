'use client';

import React, { useEffect, useState } from 'react';
import BoostPacksClient from '@/components/BoostPacksClient';
import BannerSlider from '@/components/BannerSlider';
import api from '@/lib/api';

export default function BoostPacksPage() {
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoadingBanners(true);
        const response = await api.banners.getByPage('boost-packs');
        setBanners(response.data || []);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoadingBanners(false);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div>
      {/* Banner Slider */}
      {banners.length > 0 ? (
        <BannerSlider banners={banners} loading={loadingBanners} />
      ) : loadingBanners ? (
        <BannerSlider banners={[]} loading={true} />
      ) : (
        /* Fallback: Default Hero Section */
        <section className="gradient-purple text-white py-20 relative overflow-hidden" style={{ minHeight: '600px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6">Need more entries?</h1>
                <p className="text-3xl font-bold text-yellow-300 mb-6">Power up anytime<br /><span className="text-white">with Boost Packs.</span></p>
                <p className="text-lg mb-8 text-white/90">One-time purchase to supercharge. Credits never expire — and Boost Packs work for members-only Bonus Draws with strictly limited entrants and verified fairness.</p>
              </div>
              <div className="hidden md:flex items-center justify-center"><div className="text-9xl">⚡</div></div>
            </div>
          </div>
        </section>
      )}

      <BoostPacksClient />
    </div>
  );
}
