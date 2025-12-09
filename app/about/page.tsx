'use client';

import React, { useEffect, useState } from 'react';
import BannerSlider from '@/components/BannerSlider';
import api from '@/lib/api';

function AboutMainContent() {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.settings.getByKey('about_main_content');
        setContent(response.data.value || '');
      } catch (error) {
        console.error('Error fetching about main content:', error);
      }
    };
    fetchContent();
  }, []);

  if (!content) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </section>
  );
}

function AboutMissionVision() {
  const [mission, setMission] = useState<string>('');
  const [vision, setVision] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [missionRes, visionRes] = await Promise.all([
          api.settings.getByKey('about_mission'),
          api.settings.getByKey('about_vision'),
        ]);
        setMission(missionRes.data.value || '');
        setVision(visionRes.data.value || '');
      } catch (error) {
        console.error('Error fetching mission/vision:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Mission */}
          <div className="card p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-3xl font-bold text-accent-500">Mission</h2>
            </div>
            <p className="text-lg text-gray-700">
              {mission || 'To bring trust, clarity, and fairness to online rewards — making every member\'s chance real, verified, and transparent.'}
            </p>
          </div>

          {/* Vision */}
          <div className="card p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">💡</span>
              </div>
              <h2 className="text-3xl font-bold text-accent-500">Vision</h2>
            </div>
            <p className="text-lg text-gray-700">
              {vision || 'A future where every prize is earned through fairness, and every winner is verified in public.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPrinciples() {
  const [principles, setPrinciples] = useState<Array<{ title: string; description: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.settings.getByKey('about_principles');
        const data = response.data.value;
        if (data) {
          try {
            const parsed = JSON.parse(data);
            setPrinciples(Array.isArray(parsed) ? parsed : []);
          } catch {
            setPrinciples([]);
          }
        }
      } catch (error) {
        console.error('Error fetching principles:', error);
      }
    };
    fetchData();
  }, []);

  const defaultPrinciples = [
    { title: 'Transparency first', description: '— every draw, every number, every winner is visible and verified.' },
    { title: 'Fair by design', description: '— capped entries and one-entry-per-member ensure true odds.' },
    { title: 'Real value', description: '— prizes are genuine, deliverable, and publicly announced.' },
    { title: 'Member powered', description: '— UniCash is built around its community, not chance.' },
  ];

  const displayPrinciples = principles.length > 0 ? principles : defaultPrinciples;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 mb-12">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900">Our Principles</h2>
        </div>

        <div className="space-y-6">
          {displayPrinciples.map((principle, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{principle.title}</h3>
                <p className="text-gray-600">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoadingBanners(true);
        const response = await api.banners.getByPage('about');
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
    <>
      {/* Banner Slider - About Us style: 190px height */}
      {banners.length > 0 ? (
        <BannerSlider banners={banners} loading={loadingBanners} height={190} />
      ) : loadingBanners ? (
        <BannerSlider banners={[]} loading={true} height={190} />
      ) : (
        /* Fallback: Default Hero Section - About Us style */
        <section className="bg-gradient-to-br from-purple-50 to-white" style={{ height: '190px', minHeight: '190px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="grid md:grid-cols-1 gap-12 items-center w-full">
              <div className="text-left">
                <h1 className="text-5xl font-bold mb-6 text-accent-500">About UniCash</h1>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <AboutMainContent />

      {/* Mission & Vision */}
      <AboutMissionVision />

      {/* Our Principles */}
      <AboutPrinciples />
    </>
  );
}
