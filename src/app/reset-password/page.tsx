'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen for Supabase recovery auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
      }
    });

    // 2. Also check if active session already established via recovery token in URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    // 3. Fallback: give Supabase URL hash parsing 1.5 seconds to establish session
    const timer = setTimeout(() => {
      setReady(true);
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccessMsg('Your password has been successfully reset! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Failed to update password. The reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 bg-stone-50 min-h-[60vh]">
      <div className="bg-white border border-stone-200/60 p-8 w-full max-w-md rounded-xs shadow-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="font-syne font-extrabold text-2xl tracking-[0.25em] text-stone-950">
            ARVIIK
          </span>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Create New Password
          </h2>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-red-50 text-red-800 text-[11px] font-semibold p-3 rounded-xs border border-red-100 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 text-[11px] font-semibold p-3 rounded-xs border border-emerald-100 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
              <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
              <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:opacity-90 transition-opacity rounded-xs flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-[10px] text-stone-500 hover:text-stone-900 font-bold uppercase tracking-wider underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
