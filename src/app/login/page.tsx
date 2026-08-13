'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Lock, Mail, User, Phone } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading, signInMock } = useAuth();

  // Tab state
  const [isRegister, setIsRegister] = useState(false);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // UI state
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/profile');
      }
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthLoading(true);

    const cleanEmail = email.toLowerCase().trim();
    const isAdminAccount = cleanEmail === 'rishipatel1610@gmail.com';

    try {
      if (isRegister) {
        // Real user registration
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });

        if (error) throw error;

        // Automatically create or update profile
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName || (isAdminAccount ? 'Rishi Patel' : 'Customer'),
            phone: phone || '',
            role: isAdminAccount ? 'admin' : 'customer',
          });
        }
        
        setSuccessMsg('Account registered successfully! You can now sign in with your credentials.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Real user sign in
        let authUser = null;
        let authError = null;

        try {
          const { data: authData, error: sbError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (sbError) {
            authError = sbError;
          } else {
            authUser = authData.user;
          }
        } catch (sbErr: any) {
          authError = sbErr;
        }

        // If Supabase auth error occurs but credentials match designated admin (Rishi Patel)
        if (!authUser && isAdminAccount && password === 'Rishi1610') {
          signInMock('rishipatel1610@gmail.com');
          router.push('/admin');
          return;
        }

        if (authError && !authUser) {
          throw authError;
        }

        // Fetch user profile role
        let role = isAdminAccount ? 'admin' : 'customer';
        if (authUser) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUser.id)
            .single();

          if (prof?.role) role = prof.role;
        }

        if (role === 'admin' || isAdminAccount) {
          router.push('/admin');
        } else {
          router.push('/profile');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 bg-stone-50">
      <div className="bg-white border border-stone-200/50 p-8 w-full max-w-md rounded-xs shadow-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="font-syne font-extrabold text-2xl tracking-[0.25em] text-stone-950">
            ARVIIK
          </span>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
            {isRegister ? 'Create Account' : 'Customer Login'}
          </h2>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-100 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`flex-1 text-center pb-3 ${
              !isRegister ? 'text-stone-900 border-b border-stone-900' : 'text-stone-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`flex-1 text-center pb-3 ${
              isRegister ? 'text-stone-900 border-b border-stone-900' : 'text-stone-400'
            }`}
          >
            Register
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <p className="bg-red-50 text-red-800 text-[11px] font-semibold uppercase tracking-wider p-3 rounded-xs border border-red-100">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="bg-emerald-50 text-emerald-800 text-[11px] font-semibold p-3 rounded-xs border border-emerald-100">
            {successMsg}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Karan Malhotra"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                  <User className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                  <Phone className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="customer@arviik.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
              <Mail className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                Password
              </label>
              {!isRegister && (
                <a href="#" className="text-[10px] text-stone-400 hover:text-stone-900 underline font-semibold uppercase tracking-wider">
                  Forgot Password?
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
              <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:opacity-90 transition-opacity rounded-xs flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>{authLoading ? 'Verifying...' : isRegister ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
