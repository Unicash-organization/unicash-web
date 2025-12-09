'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (user) {
      const totalCredits = (user.membershipCredits || 0) + (user.boostCredits || 0);
      setCredits(totalCredits);
    }
  }, [user]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/green-logo.svg"
              alt="UniCash Logo"
              width={150}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
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

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {!authLoading && user ? (
              <Link 
                href="/dashboard"
                className="flex items-center space-x-3 bg-purple-600 px-4 py-2 rounded-full hover:bg-purple-700 transition-all duration-200 shadow-md"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-white">
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
                
                {/* Credits Text */}
                <span className="text-white font-bold text-sm">
                  Credits: {credits}
                </span>
              </Link>
            ) : !authLoading ? (
              <>
                <Link href="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link href="/#membership-plans" className="btn-primary">
                  Join Now
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}

