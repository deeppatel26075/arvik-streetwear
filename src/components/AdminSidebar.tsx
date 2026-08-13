'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, ShoppingBag, ClipboardList, Settings, Store, LogOut, Tags, Users, Menu, X } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: ClipboardList },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Coupons', path: '/admin/coupons', icon: Tags },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Website config', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-stone-950 text-white z-40 px-4 flex items-center justify-between border-b border-stone-900">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-stone-300 hover:text-white focus:outline-none"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="font-syne font-extrabold text-base tracking-[0.2em] uppercase">
            ARVIIK ADMIN
          </span>
        </div>
        <Link href="/" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-white">
          Store
        </Link>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Content (Desktop & Mobile Drawer) */}
      <aside
        className={`w-64 bg-stone-950 text-stone-300 flex flex-col h-screen fixed top-0 left-0 z-50 border-r border-stone-900 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-stone-900 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-syne font-extrabold text-lg text-white tracking-[0.25em] uppercase">
              ARVIIK
            </span>
            <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider mt-1">
              Control Center
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-stone-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-grow p-4 space-y-1.5 text-xs font-bold uppercase tracking-wider overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setMobileOpen(false)}
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
            onClick={() => setMobileOpen(false)}
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
    </>
  );
}
