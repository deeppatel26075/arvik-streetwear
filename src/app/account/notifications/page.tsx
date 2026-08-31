'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ToggleSwitch from '@/components/account/ToggleSwitch';
import Toast from '@/components/account/Toast';
import { loadNotificationPrefs, saveNotificationPrefs, NotificationPrefs } from '@/lib/notificationPrefs';

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(loadNotificationPrefs());
  }, []);

  const update = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      saveNotificationPrefs(next);
      return next;
    });
    setToastMsg('Preference saved.');
  };

  if (!prefs) return null;

  return (
    <div className="space-y-6">
      <Link
        href="/account"
        className="lg:hidden inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-600 hover:text-stone-950 uppercase tracking-wider transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to Account
      </Link>

      <h2 className="font-syne font-extrabold text-sm uppercase tracking-[0.2em] text-stone-950">
        Notification Preferences
      </h2>

      <div className="space-y-8">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
            Order Updates
          </p>
          <div className="divide-y divide-stone-100">
            <ToggleSwitch
              label="Order Confirmation"
              description="Get notified when your order is placed"
              checked={prefs.orderConfirmation}
              onChange={(v) => update('orderConfirmation', v)}
            />
            <ToggleSwitch
              label="Shipping Updates"
              description="Know when your order ships"
              checked={prefs.shippingUpdates}
              onChange={(v) => update('shippingUpdates', v)}
            />
            <ToggleSwitch
              label="Delivery Updates"
              description="Track your order until it arrives"
              checked={prefs.deliveryUpdates}
              onChange={(v) => update('deliveryUpdates', v)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
            ARVIIK Updates
          </p>
          <div className="divide-y divide-stone-100">
            <ToggleSwitch
              label="New Drops"
              description="Be first to know about new releases"
              checked={prefs.newDrops}
              onChange={(v) => update('newDrops', v)}
            />
            <ToggleSwitch
              label="Offers & Promotions"
              description="Occasional discounts and offers"
              checked={prefs.offersPromotions}
              onChange={(v) => update('offersPromotions', v)}
            />
          </div>
        </div>
      </div>

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
}
