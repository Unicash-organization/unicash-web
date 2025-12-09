'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Button {
  text: string;
  link: string;
  className: string;
}

interface Banner {
  id: string;
  title: string;
  richTextTitle: string;
  description: string;
  notes: string;
  backgroundImageUrl: string;
  showCountdown: boolean;
  countdownTargetDate: string;
  buttons: Button[];
}

interface BannerSliderProps {
  banners: Banner[];
  autoPlayInterval?: number; // milliseconds, default 5000 (5 seconds)
  loading?: boolean; // Show loading skeleton
  height?: number; // Custom height in pixels, default 600
}

// Loading Skeleton Component
function BannerSkeleton({ height = 600 }: { height?: number }) {
  return (
    <section
      className="relative w-full text-white overflow-hidden"
      style={{
        height: `${height}px`,
        minHeight: `${height}px`,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-center">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content Skeleton */}
          <div className="space-y-6">
            <div className="h-16 bg-white/20 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded-lg animate-pulse w-3/4"></div>
            <div className="h-4 bg-white/20 rounded-lg animate-pulse w-2/3"></div>
            <div className="h-12 bg-white/20 rounded-lg animate-pulse w-1/2"></div>
          </div>
          {/* Right Graphics Skeleton */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-32 h-32 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BannerSlider({ banners, autoPlayInterval = 5000, loading = false, height = 600 }: BannerSliderProps) {
  // Debug: Log height prop
  console.log('BannerSlider height:', height);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-play functionality - MUST be called before any early returns (Rules of Hooks)
  useEffect(() => {
    // Only run auto-play if we have multiple banners
    if (!banners || banners.length <= 1 || !isAutoPlaying || isDragging) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval, isAutoPlaying, isDragging]);

  // Show skeleton while loading
  if (loading || !isMounted) {
    return <BannerSkeleton height={height} />;
  }

  // If no banners, show skeleton instead of null to prevent layout shift
  if (!banners || banners.length === 0) {
    return <BannerSkeleton height={height} />;
  }

  // Single banner - no slider needed
  if (banners.length === 1) {
    return <BannerSlide banner={banners[0]} height={height} />;
  }

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setIsDragging(false);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setIsDragging(false);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setIsDragging(false);
    setCurrentIndex(index);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe left - next
      goToNext();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous
      goToPrevious();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
    setTimeout(() => {
      setIsDragging(false);
      setIsAutoPlaying(true);
    }, 3000);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
    setIsDragging(true);
    setIsAutoPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStart === 0) return;
    setTouchEnd(e.clientX);
  };

  const handleMouseUp = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
    setTimeout(() => {
      setIsDragging(false);
      setIsAutoPlaying(true);
    }, 3000);
  };

  return (
    <div 
      className="relative group w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <BannerSlide banner={banners[currentIndex]} height={height} />

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
        aria-label="Previous banner"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
        aria-label="Next banner"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Banner Slide Component
function BannerSlide({ banner, height = 600 }: { banner: Banner; height?: number }) {
  // Debug: Log height prop
  console.log('BannerSlide height:', height);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload background image
  useEffect(() => {
    if (banner.backgroundImageUrl) {
      const img = new Image();
      // Use full URL if already full, otherwise prepend API URL
      const imageUrl = banner.backgroundImageUrl.startsWith('http') 
        ? banner.backgroundImageUrl 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${banner.backgroundImageUrl}`;
      img.src = imageUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true); // Still show even if image fails
    } else {
      setImageLoaded(true);
    }
  }, [banner.backgroundImageUrl]);

  useEffect(() => {
    if (!banner.showCountdown || !banner.countdownTargetDate) return;

    const updateCountdown = () => {
      const targetDate = new Date(banner.countdownTargetDate);
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [banner.showCountdown, banner.countdownTargetDate]);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    // Use full URL if already full, otherwise prepend API URL
    return url.startsWith('http') 
      ? url 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${url}`;
  };

  const backgroundStyle = banner.backgroundImageUrl && imageLoaded
    ? {
        backgroundImage: `url(${getImageUrl(banner.backgroundImageUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };

  return (
    <section
      className="relative w-full text-white overflow-hidden transition-opacity duration-300"
      style={{
        ...backgroundStyle,
        height: `${height}px`,
        minHeight: `${height}px`,
        maxHeight: `${height}px`,
        opacity: imageLoaded || !banner.backgroundImageUrl ? 1 : 0.7,
      }}
    >
      {/* Overlay for better text readability if background image */}
      {banner.backgroundImageUrl && imageLoaded && (
        <div className="absolute inset-0 bg-black/30"></div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-center">
        <div className="grid md:grid-cols-1 gap-12 items-center w-full">
          {/* Content - Centered vertically, text aligned left */}
          <div className="text-left">
            {/* Rich Text Title */}
            {banner.richTextTitle && (
              <div
                className="text-5xl md:text-6xl font-bold mb-6 gap-y-8 flex flex-col"
                dangerouslySetInnerHTML={{ __html: banner.richTextTitle }}
              />
            )}

            {/* Description */}
            {banner.description && (
              <p className="text-lg mb-6 text-white/90 whitespace-pre-line">{banner.description}</p>
            )}

            {/* Countdown - Inline format */}
            {banner.showCountdown && banner.countdownTargetDate && (
              <div className="flex items-center space-x-3 mb-6">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-lg font-semibold">
                  Grand Prize ends in{' '}
                  <span className="text-yellow-400 font-bold">
                    {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                  </span>
                </span>
              </div>
            )}

            {/* Buttons */}
            {banner.buttons && banner.buttons.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-6">
                {banner.buttons.map((button, index) => (
                  <Link key={index} href={button.link}>
                    <button className={`font-bold py-3 px-8 rounded-lg transition ${button.className || 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                      {button.text}
                    </button>
                  </Link>
                ))}
              </div>
            )}

            {/* Notes/Footer Text */}
            {banner.notes && (
              <p className="text-sm text-white/80">{banner.notes}</p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

