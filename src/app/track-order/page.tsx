'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Lock, ArrowRight, MessageCircle, PackageSearch } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchUserOrders, Order, orderDisplayId } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import { whatsappLink } from '@/lib/contact';
import OrderStatusBadge from '@/components/account/OrderStatusBadge';
import OrderTimeline from '@/components/account/OrderTimeline';
import Skeleton from '@/components/account/Skeleton';

// Real order tracking. Orders can only be placed by logged-in customers and
// row-level security only lets a customer read their own orders, so this
// page shows the signed-in customer's actual orders (same timeline as the
// order details page) and asks everyone else to log in. (It used to be a
// demo that invented a status and city from the length of the input.)

const normalizeRef = (s: string) => s.toUpperCase().replace(/^ARV-?/, '').replace(/[^A-Z0-9]/g, '');

export default function TrackOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchUserOrders(user.id)
      .then((data) => !cancelled && setOrders(data))
      .catch(() => !cancelled && setError('Could not load your orders right now. Please try again.'));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = normalizeRef(query);
    if (!q) return orders;
    return orders.filter((o) => normalizeRef(orderDisplayId(o.id)).includes(q));
  }, [orders, query]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          Where&apos;s My Order
        </span>
        <h1 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-950">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium max-w-md mx-auto">
          See exactly where each of your orders is, from placed to delivered.
        </p>
      </div>

      {authLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !user ? (
        <LoggedOut />
      ) : error ? (
        <p className="text-xs font-semibold text-red-600 border border-red-100 bg-red-50 rounded-xl p-4 text-center">{error}</p>
      ) : orders === null ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center border border-dashed border-stone-300 rounded-2xl px-6 py-12 space-y-4">
          <PackageSearch className="h-8 w-8 text-stone-300 mx-auto" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-900">No Orders Yet</h2>
          <p className="text-xs text-stone-500 font-medium">Once you place an order, you can follow it here.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest px-7 py-3.5 rounded-xl transition-colors"
          >
            <span>Shop The Collection</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.length > 1 && (
            <label className="relative block">
              <span className="sr-only">Find an order by number</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                inputMode="text"
                placeholder="Find an order, e.g. ARV-26B19A31"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
              />
            </label>
          )}

          {filtered.length === 0 ? (
            <p className="text-xs text-stone-500 font-medium text-center py-8">
              No order matches &ldquo;{query}&rdquo;. Check the number in your confirmation email.
            </p>
          ) : (
            filtered.map((order) => <OrderTrackCard key={order.id} order={order} />)
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-stone-400 font-medium">
        Something not right?{' '}
        <a
          href={whatsappLink('Hi ARVIIK, I need help tracking my order.')}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-stone-700 underline underline-offset-4 hover:text-stone-950"
        >
          Message us on WhatsApp
        </a>
      </p>
    </div>
  );
}

function OrderTrackCard({ order }: { order: Order }) {
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const items = order.order_items || [];
  const itemCount = items.reduce((n, i) => n + (i.quantity || 0), 0);
  const thumb = items[0]?.products?.product_images?.[0]?.image_url;

  return (
    <div className="p-5 sm:p-6 border border-stone-200/80 rounded-2xl bg-white space-y-5">
      {/* Header — same layout as the order details page */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Order</p>
          <p className="text-lg font-extrabold text-stone-950 font-mono">{orderDisplayId(order.id)}</p>
          <p className="text-xs text-stone-500 font-medium mt-0.5">{date}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderTimeline status={order.status} />

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-12 flex-shrink-0 bg-stone-100 rounded-sm overflow-hidden border border-stone-200/60">
            {thumb && <Image src={thumb} alt="" fill sizes="40px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate">
              {items[0]?.products?.name || 'Your order'}
              {items.length > 1 ? ` + ${items.length - 1} more` : ''}
            </p>
            <p className="text-[11px] text-stone-500 font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatPrice(order.total_amount)}
            </p>
          </div>
        </div>
        <Link
          href={`/account/orders/${order.id}`}
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-900 hover:text-stone-600"
        >
          Details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function LoggedOut() {
  return (
    <div className="text-center border border-stone-200/80 bg-stone-50/80 rounded-2xl px-6 py-12 space-y-4">
      <div className="h-11 w-11 rounded-full bg-stone-950 flex items-center justify-center mx-auto">
        <Lock className="h-4.5 w-4.5 text-lime-400" />
      </div>
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-900">Log In To Track Your Orders</h2>
      <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto leading-relaxed">
        Your orders are linked to your ARVIIK account. Log in with the email you used at checkout to
        see live status for every order.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        <Link
          href="/login?next=/track-order"
          className="inline-flex items-center gap-2 bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest px-7 py-3.5 rounded-xl transition-colors"
        >
          <span>Log In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={whatsappLink('Hi ARVIIK, I need help tracking my order.')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-stone-700 hover:text-stone-950 px-4 py-3.5"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Ask On WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
