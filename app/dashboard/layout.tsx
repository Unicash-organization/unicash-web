'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Redirect to login if not authenticated - use replace to avoid adding to history
  useEffect(() => {
    if (!loading && !user) {
      // Store the intended destination for redirect after login
      const currentPath = pathname || '/dashboard';
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      router.replace('/login');
    }
  }, [user, loading, router, pathname]);

  // Redirect to security-billing page if user hasn't changed password yet
  useEffect(() => {
    if (user && pathname !== '/dashboard/security-billing') {
      if (user.hasChangedPassword === false) {
        router.replace('/dashboard/security-billing');
      }
    }
  }, [user, pathname, router]);

  // Icon components
  const CategoryIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M7.24 2H5.34C3.15 2 2 3.15 2 5.33V7.23C2 9.41 3.15 10.56 5.33 10.56H7.23C9.41 10.56 10.56 9.41 10.56 7.23V5.33C10.57 3.15 9.42 2 7.24 2Z" fill="currentColor"/>
      <path d="M18.6704 2H16.7704C14.5904 2 13.4404 3.15 13.4404 5.33V7.23C13.4404 9.41 14.5904 10.56 16.7704 10.56H18.6704C20.8504 10.56 22.0004 9.41 22.0004 7.23V5.33C22.0004 3.15 20.8504 2 18.6704 2Z" fill="currentColor"/>
      <path d="M18.6704 13.4299H16.7704C14.5904 13.4299 13.4404 14.5799 13.4404 16.7599V18.6599C13.4404 20.8399 14.5904 21.9899 16.7704 21.9899H18.6704C20.8504 21.9899 22.0004 20.8399 22.0004 18.6599V16.7599C22.0004 14.5799 20.8504 13.4299 18.6704 13.4299Z" fill="currentColor"/>
      <path d="M7.24 13.4299H5.34C3.15 13.4299 2 14.5799 2 16.7599V18.6599C2 20.8499 3.15 21.9999 5.33 21.9999H7.23C9.41 21.9999 10.56 20.8499 10.56 18.6699V16.7699C10.57 14.5799 9.42 13.4299 7.24 13.4299Z" fill="currentColor"/>
    </svg>
  );

  const MyProfileIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M22 12C22 6.49 17.51 2 12 2C6.49 2 2 6.49 2 12C2 14.9 3.25 17.51 5.23 19.34C5.23 19.35 5.23 19.35 5.22 19.36C5.32 19.46 5.44 19.54 5.54 19.63C5.6 19.68 5.65 19.73 5.71 19.77C5.89 19.92 6.09 20.06 6.28 20.2C6.35 20.25 6.41 20.29 6.48 20.34C6.67 20.47 6.87 20.59 7.08 20.7C7.15 20.74 7.23 20.79 7.3 20.83C7.5 20.94 7.71 21.04 7.93 21.13C8.01 21.17 8.09 21.21 8.17 21.24C8.39 21.33 8.61 21.41 8.83 21.48C8.91 21.51 8.99 21.54 9.07 21.56C9.31 21.63 9.55 21.69 9.79 21.75C9.86 21.77 9.93 21.79 10.01 21.8C10.29 21.86 10.57 21.9 10.86 21.93C10.9 21.93 10.94 21.94 10.98 21.95C11.32 21.98 11.66 22 12 22C12.34 22 12.68 21.98 13.01 21.95C13.05 21.95 13.09 21.94 13.13 21.93C13.42 21.9 13.7 21.86 13.98 21.8C14.05 21.79 14.12 21.76 14.2 21.75C14.44 21.69 14.69 21.64 14.92 21.56C15 21.53 15.08 21.5 15.16 21.48C15.38 21.4 15.61 21.33 15.82 21.24C15.9 21.21 15.98 21.17 16.06 21.13C16.27 21.04 16.48 20.94 16.69 20.83C16.77 20.79 16.84 20.74 16.91 20.7C17.11 20.58 17.31 20.47 17.51 20.34C17.58 20.3 17.64 20.25 17.71 20.2C17.91 20.06 18.1 19.92 18.28 19.77C18.34 19.72 18.39 19.67 18.45 19.63C18.56 19.54 18.67 19.45 18.77 19.36C18.77 19.35 18.77 19.35 18.76 19.34C20.75 17.51 22 14.9 22 12ZM16.94 16.97C14.23 15.15 9.79 15.15 7.06 16.97C6.62 17.26 6.26 17.6 5.96 17.97C4.44 16.43 3.5 14.32 3.5 12C3.5 7.31 7.31 3.5 12 3.5C16.69 3.5 20.5 7.31 20.5 12C20.5 14.32 19.56 16.43 18.04 17.97C17.75 17.6 17.38 17.26 16.94 16.97Z" fill="currentColor"/>
      <path d="M12 6.92993C9.93 6.92993 8.25 8.60993 8.25 10.6799C8.25 12.7099 9.84 14.3599 11.95 14.4199C11.98 14.4199 12.02 14.4199 12.04 14.4199C12.06 14.4199 12.09 14.4199 12.11 14.4199C12.12 14.4199 12.13 14.4199 12.13 14.4199C14.15 14.3499 15.74 12.7099 15.75 10.6799C15.75 8.60993 14.07 6.92993 12 6.92993Z" fill="currentColor"/>
    </svg>
  );

  const PasswordIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18.75 8V10.1C18.31 10.04 17.81 10.01 17.25 10V8C17.25 4.85 16.36 2.75 12 2.75C7.64 2.75 6.75 4.85 6.75 8V10C6.19 10.01 5.69 10.04 5.25 10.1V8C5.25 5.1 5.95 1.25 12 1.25C18.05 1.25 18.75 5.1 18.75 8Z" fill="currentColor"/>
      <path d="M18.75 10.1C18.31 10.04 17.81 10.01 17.25 10H6.75C6.19 10.01 5.69 10.04 5.25 10.1C2.7 10.41 2 11.66 2 15V17C2 21 3 22 7 22H17C21 22 22 21 22 17V15C22 11.66 21.3 10.41 18.75 10.1ZM8.71 16.71C8.52 16.89 8.26 17 8 17C7.87 17 7.74 16.97 7.62 16.92C7.49 16.87 7.39 16.8 7.29 16.71C7.11 16.52 7 16.26 7 16C7 15.87 7.03 15.74 7.08 15.62C7.13 15.5 7.2 15.39 7.29 15.29C7.39 15.2 7.49 15.13 7.62 15.08C7.99 14.92 8.43 15.01 8.71 15.29C8.8 15.39 8.87 15.5 8.92 15.62C8.97 15.74 9 15.87 9 16C9 16.26 8.89 16.52 8.71 16.71ZM12.92 16.38C12.87 16.5 12.8 16.61 12.71 16.71C12.52 16.89 12.26 17 12 17C11.73 17 11.48 16.89 11.29 16.71C11.2 16.61 11.13 16.5 11.08 16.38C11.03 16.26 11 16.13 11 16C11 15.73 11.11 15.48 11.29 15.29C11.66 14.92 12.33 14.92 12.71 15.29C12.89 15.48 13 15.73 13 16C13 16.13 12.97 16.26 12.92 16.38ZM16.71 16.71C16.52 16.89 16.26 17 16 17C15.74 17 15.48 16.89 15.29 16.71C15.11 16.52 15 16.27 15 16C15 15.73 15.11 15.48 15.29 15.29C15.67 14.92 16.34 14.92 16.71 15.29C16.75 15.34 16.79 15.39 16.83 15.45C16.87 15.5 16.9 15.56 16.92 15.62C16.95 15.68 16.97 15.74 16.98 15.8C16.99 15.87 17 15.94 17 16C17 16.26 16.89 16.52 16.71 16.71Z" fill="currentColor"/>
    </svg>
  );

  const MembershipIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M17 22H7C6.59 22 6.25 21.66 6.25 21.25C6.25 20.84 6.59 20.5 7 20.5H17C17.41 20.5 17.75 20.84 17.75 21.25C17.75 21.66 17.41 22 17 22Z" fill="currentColor"/>
      <path d="M20.3502 5.52004L16.3502 8.38004C15.8202 8.76004 15.0602 8.53004 14.8302 7.92004L12.9402 2.88004C12.6202 2.01004 11.3902 2.01004 11.0702 2.88004L9.17022 7.91004C8.94022 8.53004 8.19022 8.76004 7.66022 8.37004L3.66022 5.51004C2.86022 4.95004 1.80022 5.74004 2.13022 6.67004L6.29022 18.32C6.43022 18.72 6.81022 18.98 7.23022 18.98H16.7602C17.1802 18.98 17.5602 18.71 17.7002 18.32L21.8602 6.67004C22.2002 5.74004 21.1402 4.95004 20.3502 5.52004ZM14.5002 14.75H9.50022C9.09022 14.75 8.75022 14.41 8.75022 14C8.75022 13.59 9.09022 13.25 9.50022 13.25H14.5002C14.9102 13.25 15.2502 13.59 15.2502 14C15.2502 14.41 14.9102 14.75 14.5002 14.75Z" fill="currentColor"/>
    </svg>
  );

  const ClockIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.35 15.57C16.21 15.81 15.96 15.94 15.7 15.94C15.57 15.94 15.44 15.91 15.32 15.83L12.22 13.98C11.45 13.52 10.88 12.51 10.88 11.62V7.52C10.88 7.11 11.22 6.77 11.63 6.77C12.04 6.77 12.38 7.11 12.38 7.52V11.62C12.38 11.98 12.68 12.51 12.99 12.69L16.09 14.54C16.45 14.75 16.57 15.21 16.35 15.57Z" fill="currentColor"/>
    </svg>
  );

  const MyEntriesIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.19C2 19.83 4.17 22 7.81 22H16.19C19.83 22 22 19.83 22 16.19V7.81C22 4.17 19.83 2 16.19 2ZM9.97 14.9L7.72 17.15C7.57 17.3 7.38 17.37 7.19 17.37C7 17.37 6.8 17.3 6.66 17.15L5.91 16.4C5.61 16.11 5.61 15.63 5.91 15.34C6.2 15.05 6.67 15.05 6.97 15.34L7.19 15.56L8.91 13.84C9.2 13.55 9.67 13.55 9.97 13.84C10.26 14.13 10.26 14.61 9.97 14.9ZM9.97 7.9L7.72 10.15C7.57 10.3 7.38 10.37 7.19 10.37C7 10.37 6.8 10.3 6.66 10.15L5.91 9.4C5.61 9.11 5.61 8.63 5.91 8.34C6.2 8.05 6.67 8.05 6.97 8.34L7.19 8.56L8.91 6.84C9.2 6.55 9.67 6.55 9.97 6.84C10.26 7.13 10.26 7.61 9.97 7.9ZM17.56 16.62H12.31C11.9 16.62 11.56 16.28 11.56 15.87C11.56 15.46 11.9 15.12 12.31 15.12H17.56C17.98 15.12 18.31 15.46 18.31 15.87C18.31 16.28 17.98 16.62 17.56 16.62ZM17.56 9.62H12.31C11.9 9.62 11.56 9.28 11.56 8.87C11.56 8.46 11.9 8.12 12.31 8.12H17.56C17.98 8.12 18.31 8.46 18.31 8.87C18.31 9.28 17.98 9.62 17.56 9.62Z" fill="currentColor"/>
    </svg>
  );

  const LogoutIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M16.8 2H14.2C11 2 9 4 9 7.2V11.25H13.44L11.37 9.18C11.22 9.03 11.15 8.84 11.15 8.65C11.15 8.46 11.22 8.27 11.37 8.12C11.66 7.83 12.14 7.83 12.43 8.12L15.78 11.47C16.07 11.76 16.07 12.24 15.78 12.53L12.43 15.88C12.14 16.17 11.66 16.17 11.37 15.88C11.08 15.59 11.08 15.11 11.37 14.82L13.44 12.75H9V16.8C9 20 11 22 14.2 22H16.79C19.99 22 21.99 20 21.99 16.8V7.2C22 4 20 2 16.8 2Z" fill="currentColor"/>
      <path d="M2.75 11.25C2.34 11.25 2 11.59 2 12C2 12.41 2.34 12.75 2.75 12.75H9V11.25H2.75Z" fill="currentColor"/>
    </svg>
  );

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: CategoryIcon },
    { name: 'My profile', href: '/dashboard/profile', icon: MyProfileIcon },
    { name: 'Security & Billing', href: '/dashboard/security-billing', icon: PasswordIcon },
    { name: 'Membership', href: '/dashboard/membership', icon: MembershipIcon },
    { name: 'Purchase history', href: '/dashboard/purchases', icon: ClockIcon },
    { name: 'My entries', href: '/dashboard/entries', icon: MyEntriesIcon },
  ];

  // Get breadcrumb based on current path
  const getBreadcrumb = () => {
    const pathMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/dashboard/profile': 'My profile',
      '/dashboard/security-billing': 'Security & Billing',
      '/dashboard/password': 'Password',
      '/dashboard/billing': 'Billing',
      '/dashboard/membership': 'Membership',
      '/dashboard/purchases': 'Purchase history',
      '/dashboard/entries': 'My entries',
    };
    
    const currentPath = pathname || '/dashboard';
    const pageName = pathMap[currentPath] || 'Dashboard';
    
    if (currentPath === '/dashboard') {
      return 'Dashboard';
    }
    return `Account/ ${pageName}`;
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  const getUserDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  // Block access if account is locked
  useEffect(() => {
    if (!loading && user?.isLocked) {
      // Account is locked - show warning but allow viewing dashboard
      // User can see the lock message and contact support
    }
  }, [user, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated - redirect will happen in useEffect
  // Return loading state to prevent flash of content
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 bg-white rounded-2xl shadow-lg p-6 flex-shrink-0 h-fit sticky top-24">
            {/* User Profile */}
            <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 mb-6">
              {navigation.map((item) => {
                const active = isActive(item.href);
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-purple-50'
                    }`}
                  >
                    <IconComponent className={active ? 'text-white' : 'text-gray-700'} />
                    <span className={`font-medium ${active ? 'text-white' : 'text-gray-700'}`}>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-purple-50 w-full transition-colors border-t border-gray-200 pt-4"
            >
              <LogoutIcon className="text-gray-700" />
              <span className="font-medium">Log out</span>
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">{getBreadcrumb()}</p>
            </div>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

