'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { ACCOUNT_NAV_ITEMS } from './AccountSidebar';

interface AccountMobileMenuProps {
  onLogoutClick: () => void;
}

// A collapsed "Account Menu" accordion, not a horizontally-scrolling pill
// row — a phone-width list of labels ("My Orders", "Personal Information",
// "Notifications"...) never fits without either tiny text or clipping, so
// this trades a second tap for zero clipped/tiny text.
export default function AccountMobileMenu({ onLogoutClick }: AccountMobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const activeItem = ACCOUNT_NAV_ITEMS.find((item) => pathname?.startsWith(item.href));

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 border rounded-xs transition-colors ${
          open ? 'border-stone-950' : 'border-stone-200'
        }`}
      >
        <span className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-stone-950 min-w-0">
          {activeItem ? (
            <activeItem.icon className="h-4 w-4 text-stone-500 flex-shrink-0" />
          ) : null}
          <span className="truncate">{activeItem ? activeItem.label : 'Account Menu'}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-stone-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-2 border border-stone-200 rounded-xs divide-y divide-stone-100 overflow-hidden animate-fade-in">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  active ? 'bg-stone-950 text-white' : 'text-stone-700 active:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                <ChevronRight className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white/60' : 'text-stone-300'}`} />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogoutClick();
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-red-500 active:bg-red-50"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
