'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AccountSidebar from '@/components/account/AccountSidebar';
import ConfirmDialog from '@/components/account/ConfirmDialog';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';

  return (
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-14">
      {/* Account Header — generous whitespace, strong typography, no
          dashboard chrome (no cards, no stat tiles). */}
      <div className="pb-6 sm:pb-8 mb-8 sm:mb-10 border-b border-stone-100">
        <h1 className="font-syne font-extrabold text-[clamp(1.05rem,4.6vw,1.75rem)] sm:text-3xl uppercase tracking-tight text-stone-950 leading-[1.15] sm:leading-tight">
          Welcome back, {displayName} 👋
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium mt-2">
          Manage your account information and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
        <AccountSidebar onLogoutClick={() => setShowLogoutConfirm(true)} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log Out"
        message="You'll need to sign in again to view your orders and account details."
        confirmLabel="Log Out"
        danger
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
