'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchUserOrders, Order } from '@/lib/orders';
import OrderCard from '@/components/account/OrderCard';
import EmptyState from '@/components/account/EmptyState';
import { OrderCardSkeleton } from '@/components/account/Skeleton';

export default function MyOrdersPage() {
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
        My Orders
      </h2>

      {orders === null && !error && (
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold text-red-600 border border-red-100 bg-red-50 rounded-xs p-4">{error}</p>
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

      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
