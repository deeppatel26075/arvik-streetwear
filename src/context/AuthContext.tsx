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

  const checkIsAdminEmail = (email?: string | null) => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower === 'rishipatel1610@gmail.com' || lower === 'admin@arviik.com' || lower === 'admin@arvik.com';
  };

  const fetchProfile = async (userId: string, userEmail?: string | null) => {
    const isAdminEmail = checkIsAdminEmail(userEmail);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        const fetchedProfile = data as UserProfile;
        if (isAdminEmail && fetchedProfile.role !== 'admin') {
          fetchedProfile.role = 'admin';
          // Try to update DB role as well
          supabase.from('profiles').update({ role: 'admin' }).eq('id', userId).then();
        }
        setProfile(fetchedProfile);
      } else {
        // Fallback default profile if not in DB yet
        const defaultProfile: UserProfile = {
          id: userId,
          full_name: userEmail?.split('@')[0] || 'User',
          phone: null,
          role: isAdminEmail ? 'admin' : 'customer',
          shipping_address: null,
          shipping_city: null,
          shipping_state: null,
          shipping_pincode: null,
          created_at: new Date().toISOString(),
        };
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfile({
        id: userId,
        full_name: userEmail?.split('@')[0] || 'User',
        phone: null,
        role: isAdminEmail ? 'admin' : 'customer',
        shipping_address: null,
        shipping_city: null,
        shipping_state: null,
        shipping_pincode: null,
        created_at: new Date().toISOString(),
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const signInMock = (email: string) => {
    const isAdminEmail = checkIsAdminEmail(email);
    const mockUser = {
      id: isAdminEmail ? 'admin-user-id' : `customer-${Date.now()}`,
      email,
      user_metadata: { full_name: isAdminEmail ? 'Rishi Patel' : 'Customer' },
    } as any;
    
    const mockProfile: UserProfile = {
      id: mockUser.id,
      full_name: isAdminEmail ? 'Rishi Patel' : 'Customer',
      phone: '',
      role: isAdminEmail ? 'admin' : 'customer',
      shipping_address: null,
      shipping_city: null,
      shipping_state: null,
      shipping_pincode: null,
      created_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem('arviik_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
    } catch (e) {}
    
    setUser(mockUser);
    setProfile(mockProfile);
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email);
        } else {
          // Check local session storage if available
          const stored = localStorage.getItem('arviik_session');
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed.user);
            setProfile(parsed.profile);
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email);
        } else if (!localStorage.getItem('arviik_session')) {
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
      localStorage.removeItem('arviik_session');
      localStorage.removeItem('arviik_mock_session');
    } catch (e) {}
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const isAdmin = profile?.role === 'admin' || checkIsAdminEmail(user?.email);

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
