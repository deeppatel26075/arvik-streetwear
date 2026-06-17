'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, ShoppingBag, ClipboardList, Settings, Store, LogOut, Tags, Users } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: ClipboardList },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Coupons', path: '/admin/coupons', icon: Tags },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Website config', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-stone-950 text-stone-300 flex flex-col h-screen fixed top-0 left-0 z-30 border-r border-stone-900">
      {/* Brand Header */}
      <div className="p-6 border-b border-stone-900 flex flex-col">
        <span className="font-syne font-extrabold text-lg text-white tracking-[0.25em] uppercase">
          ARVIIK
        </span>
        <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider mt-1">
          Control Center
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-grow p-4 space-y-1.5 text-xs font-bold uppercase tracking-wider">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-sm transition-colors ${
                isActive
                  ? 'bg-white text-stone-950 shadow-sm'
                  : 'hover:bg-stone-900 hover:text-white text-stone-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-stone-900 space-y-2 text-xs font-bold uppercase tracking-wider">
        <Link
          href="/"
          className="flex items-center space-x-3 px-4 py-3 text-stone-400 hover:text-white rounded-sm hover:bg-stone-900"
        >
          <Store className="h-4 w-4" />
          <span>View Storefront</span>
        </Link>
        <button
          onClick={() => signOut().then(() => router.push('/login'))}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 rounded-sm hover:bg-stone-900"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
