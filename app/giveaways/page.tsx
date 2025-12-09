'use client';

import React, { useEffect, useState } from 'react';
import GiveawaysClient from '@/components/GiveawaysClient';
import FeaturedBonusDraw from '@/components/FeaturedBonusDraw';
import BannerSlider from '@/components/BannerSlider';
import api from '@/lib/api';

export default function GiveawaysPage() {
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoadingBanners(true);
        const response = await api.banners.getByPage('giveaways');
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
        <section className="gradient-purple text-white py-16" style={{ minHeight: '600px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-5xl font-bold mb-4">Bonus Draws</h1>
                <p className="text-2xl text-yellow-300 font-semibold mb-4">Real rewards, limited entries.</p>
                <p className="text-lg text-white/90 mb-6">
                  Every draw has a strict entry cap and real stats — so members can see exactly how many people are in and what your odds truly are.
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="text-9xl">🎁</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Bonus Draw */}
      <FeaturedBonusDraw />

      <GiveawaysClient />
    </div>
  );
}
