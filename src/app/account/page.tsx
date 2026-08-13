'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChevronRight, LogOut, LayoutDashboard, ShoppingBag, Heart, MapPin, User } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  // Redirect to login if unauthenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[40vh]">
        <div className="text-[#666666] text-[10px] uppercase tracking-widest font-bold">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/account' },
    { label: 'Orders', icon: ShoppingBag, path: '/account' },
    { label: 'Wishlist', icon: Heart, path: '/wishlist' },
    { label: 'Addresses', icon: MapPin, path: '/account' },
    { label: 'Account Details', icon: User, path: '/account' },
  ];

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';
  const displayEmail = user.email || 'customer@arviik.com';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AV';

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Avatar Card */}
      <div className="flex items-center space-x-4 border-b border-[#ECECEC] pb-6">
        <div className="w-14 h-14 rounded-full bg-[#F7F7F7] border border-[#ECECEC] flex items-center justify-center text-sm font-bold text-[#111111] uppercase">
          {initials}
        </div>
        <div className="space-y-0.5">
          <h1 className="font-bold text-base text-[#111111] uppercase tracking-wide">
            {displayName}
          </h1>
          <p className="text-xs text-[#666666] font-medium">
            {displayEmail}
          </p>
        </div>
      </div>

      <h2 className="font-bold text-[10px] uppercase tracking-widest text-[#666666] mb-1">
        MY ACCOUNT
      </h2>

      {/* Menu List Stack matching the design exactly */}
      <div className="space-y-2">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => router.push(item.path)}
            className="w-full flex items-center justify-between p-4 bg-white border border-[#ECECEC] rounded-[10px] hover:bg-[#F7F7F7] transition-colors"
          >
            <div className="flex items-center space-x-3 text-xs font-bold text-[#111111] uppercase tracking-wider">
              <item.icon className="h-4 w-4 text-[#666666]" />
              <span>{item.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[#666666]" />
          </button>
        ))}

        <button
          onClick={() => signOut().then(() => router.push('/login'))}
          className="w-full flex items-center justify-between p-4 bg-white border border-[#ECECEC] rounded-[10px] hover:bg-[#F7F7F7] transition-colors"
        >
          <div className="flex items-center space-x-3 text-xs font-bold text-[#DC2626] uppercase tracking-wider">
            <LogOut className="h-4 w-4 text-[#DC2626]" />
            <span>Logout</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[#666666]" />
        </button>
      </div>
    </div>
  );
}
