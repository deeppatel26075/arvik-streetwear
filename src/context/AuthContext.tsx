'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInMock: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user && user.id !== 'mock-admin-id' && user.id !== 'mock-customer-id') {
      await fetchProfile(user.id);
    }
  };

  const signInMock = (email: string) => {
    const isMockAdmin = email.toLowerCase() === 'admin@arviik.com';
    const mockUser = {
      id: isMockAdmin ? 'mock-admin-id' : 'mock-customer-id',
      email,
      user_metadata: { full_name: isMockAdmin ? 'Arviik Admin' : 'Demo Customer' },
    } as any;
    
    const mockProfile: UserProfile = {
      id: mockUser.id,
      full_name: isMockAdmin ? 'Arviik Admin' : 'Demo Customer',
      phone: '9999999999',
      role: isMockAdmin ? 'admin' : 'customer',
      shipping_address: '123 Fashion Street',
      shipping_city: 'Mumbai',
      shipping_state: 'Maharashtra',
      shipping_pincode: '400001',
      created_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem('arviik_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
    } catch (e) {
      console.error('Failed to write mock session:', e);
    }
    
    setUser(mockUser);
    setProfile(mockProfile);
  };

  useEffect(() => {
    // 1. Get initial session
    const getInitialSession = async () => {
      try {
        // Check local storage for mock session first
        const storedMock = localStorage.getItem('arviik_mock_session');
        if (storedMock) {
          const parsed = JSON.parse(storedMock);
          setUser(parsed.user);
          setProfile(parsed.profile);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignore auth changes if using mock session
        if (localStorage.getItem('arviik_mock_session')) {
          return;
        }

        setLoading(true);
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signout failed:', err);
    }
    try {
      localStorage.removeItem('arviik_mock_session');
    } catch (e) {}
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signOut, refreshProfile, signInMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
