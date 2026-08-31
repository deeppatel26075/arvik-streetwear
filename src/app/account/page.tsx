'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchUserOrders, Order } from '@/lib/orders';
import OrderCard from '@/components/account/OrderCard';
import EmptyState from '@/components/account/EmptyState';
import { OrderCardSkeleton } from '@/components/account/Skeleton';
import { ShoppingBag } from 'lucide-react';

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    fetchUserOrders(user.id)
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your orders right now.');
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const latestOrder = orders?.[0];

  return (
    <div className="space-y-10">
      {/* My Orders — most recent order only, full history lives under
          "My Orders" in the sidebar / quick access. */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-syne font-extrabold text-sm uppercase tracking-[0.2em] text-stone-950">
            My Orders
          </h2>
          {orders && orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-950 transition-colors"
            >
              View All
            </Link>
          )}
        </div>

        {orders === null && !error && <OrderCardSkeleton />}

        {error && (
          <p className="text-xs font-semibold text-red-600 border border-red-100 bg-red-50 rounded-xs p-4">
            {error}
          </p>
        )}

        {orders && orders.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title="No Orders Yet"
            message="Your ARVIIK journey starts here."
            ctaLabel="Shop Now"
            ctaHref="/shop"
          />
        )}

        {latestOrder && <OrderCard order={latestOrder} />}
      </section>
    </div>
  );
}
