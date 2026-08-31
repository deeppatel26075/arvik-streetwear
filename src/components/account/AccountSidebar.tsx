'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, MapPin, User, Bell, LogOut } from 'lucide-react';
import AccountMobileMenu from './AccountMobileMenu';

export const ACCOUNT_NAV_ITEMS = [
  { label: 'My Orders', href: '/account/orders', icon: Package },
  { label: 'Addresses', href: '/account/address', icon: MapPin },
  { label: 'Personal Information', href: '/account/personal', icon: User },
  { label: 'Notifications', href: '/account/notifications', icon: Bell },
];

interface AccountSidebarProps {
  onLogoutClick: () => void;
}

export default function AccountSidebar({ onLogoutClick }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile — a collapsed "Account Menu" accordion instead of a
          horizontal pill row, so no label is ever visually clipped. */}
      <AccountMobileMenu onLogoutClick={onLogoutClick} />

      {/* Desktop sidebar — the border lives on this outer, self-stretched
          box so the divider line runs the full height of the content
          column next to it, while the nav links themselves stay pinned
          near the top via the inner sticky wrapper. */}
      <div className="hidden lg:block w-72 flex-shrink-0 border-r border-stone-100 self-stretch">
        <nav className="sticky top-24 flex flex-col pr-10">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-stone-400 mb-4 px-3.5">
            Account
          </p>
          <div className="space-y-1">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? 'bg-stone-950 text-white'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-950'
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-5 border-t border-stone-100">
            <button
              type="button"
              onClick={onLogoutClick}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xs text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
