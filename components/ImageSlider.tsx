'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageSliderProps {
  images: Array<{
    id?: string;
    url: string;
    order?: number;
    isPrimary?: boolean;
  }>;
  autoPlayInterval?: number; // milliseconds
}

export default function ImageSlider({ 
  images, 
  autoPlayInterval = 5000 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (images.length <= 1 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false); // Stop auto-play when user manually navigates
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % images.length;
    goToSlide(newIndex);
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
        <span className="text-6xl">📱</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden relative group">
        <div className="aspect-video relative">
          <Image
            src={images[0].url.startsWith('http') ? images[0].url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${images[0].url}`}
            alt="Draw image"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden relative group">
      <div className="aspect-video relative">
        <Image
          src={images[currentIndex].url.startsWith('http') ? images[currentIndex].url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${images[currentIndex].url}`}
          alt={`Draw image ${currentIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-500"
          priority={currentIndex === 0}
          unoptimized
        />

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
          aria-label="Next image"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

