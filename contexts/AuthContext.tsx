'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  membershipCredits?: number;
  boostCredits?: number;
  state?: string;
  hasChangedPassword?: boolean;
  isLocked?: boolean;
  lockedAt?: string;
  lockReason?: string;
  metadata?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        fetchUser(storedToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await api.auth.me();
      setUser(response.data);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      // Only clear token if it's a 401 (Unauthorized) - token is invalid
      // Don't clear on network errors (ERR_NETWORK, ERR_INSUFFICIENT_RESOURCES)
      if (error.response?.status === 401) {
        console.log('Token invalid (401), clearing auth state');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } else {
        // Network error or other error - keep token, might be temporary
        console.warn('Network or temporary error, keeping token:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const deviceId = getDeviceFingerprint();
      const response = await api.auth.login(email, password, deviceId);
      const { token: authToken, user: userData } = response.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    
    // Clear Stripe Link session to prevent showing saved emails/cards
    if (typeof window !== 'undefined') {
      // Clear all Stripe-related localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('__stripe') || key.startsWith('stripe')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear Stripe cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    
    router.push('/');
  };

  const setAuth = (authToken: string, userData: User) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchUser(token);
    } else if (typeof window !== 'undefined') {
      // Try to get token from localStorage if state is out of sync
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUser(storedToken);
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

