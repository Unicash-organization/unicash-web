'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const totalCredits = (user.membershipCredits || 0) + (user.boostCredits || 0);
      setCredits(totalCredits);
    }
  }, [user]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 w-full">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 text-gray-800"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo - Centered */}
          <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <Image
              src="/images/green-logo.svg"
              alt="UniCash Logo"
              width={150}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8 flex-1">
            <Link href="/giveaways" className="text-gray-800 hover:text-purple-600 font-medium transition">
              Giveaways
            </Link>
            <Link href="/boost-packs" className="text-gray-800 hover:text-purple-600 font-medium transition">
              Boost Packs
            </Link>
            <Link href="/winners" className="text-gray-800 hover:text-purple-600 font-medium transition">
              Winners
            </Link>
            <Link href="/faq" className="text-gray-800 hover:text-purple-600 font-medium transition">
              FAQ
            </Link>
          </div>

          {/* User Actions - Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
            {!authLoading && user ? (
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 sm:space-x-3 bg-purple-600 px-3 sm:px-4 py-2 rounded-full hover:bg-purple-700 transition-all duration-200 shadow-md"
              >
                {/* User Avatar */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-white">
                  {user.firstName || user.lastName ? (
                    <span className="text-purple-600 text-xs font-bold">
                      {user.firstName?.[0]?.toUpperCase() || ''}{user.lastName?.[0]?.toUpperCase() || ''}
                    </span>
                  ) : (
                    <span className="text-purple-600 text-xs font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                
                {/* Credits Text - Hidden on very small screens */}
                <span className="text-white font-bold text-xs sm:text-sm hidden sm:inline">
                  Credits: {credits}
                </span>
              </Link>
            ) : !authLoading ? (
              <>
                <Link href="/login" className="btn-secondary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3">
                  Log in
                </Link>
                <Link href="/#membership-plans" className="btn-primary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 hidden sm:inline-block">
                  Join Now
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <Link 
                href="/giveaways" 
                className="block text-gray-800 hover:text-purple-600 font-medium transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Giveaways
              </Link>
              <Link 
                href="/boost-packs" 
                className="block text-gray-800 hover:text-purple-600 font-medium transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Boost Packs
              </Link>
              <Link 
                href="/winners" 
                className="block text-gray-800 hover:text-purple-600 font-medium transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Winners
              </Link>
              <Link 
                href="/faq" 
                className="block text-gray-800 hover:text-purple-600 font-medium transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              {!authLoading && !user && (
                <Link 
                  href="/#membership-plans" 
                  className="block btn-primary text-center mt-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Join Now
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

