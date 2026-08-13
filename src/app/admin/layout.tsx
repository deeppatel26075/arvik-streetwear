'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import { RefreshCw, Lock } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect client side if loaded and not admin
  useEffect(() => {
    if (mounted && !loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, isAdmin, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center">
        <div className="flex items-center space-x-2 text-stone-400 text-xs uppercase tracking-widest font-bold">
          <RefreshCw className="h-4 w-4 animate-spin text-white" />
          <span>Authenticating Admin...</span>
        </div>
      </div>
    );
  }

  // Deny render if user is not authorized admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <Lock className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider">Access Denied</h1>
          <p className="text-stone-400 text-xs leading-relaxed uppercase tracking-wider font-semibold">
            You do not have administrative privileges. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex text-stone-900">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-grow ml-0 lg:ml-64 pt-16 lg:pt-0 min-h-screen flex flex-col">
        <main className="flex-grow p-4 sm:p-8 md:p-10 bg-stone-50 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
