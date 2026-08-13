'use client';

import { useState } from 'react';
import { Search, PackageCheck, PackageSearch, Truck, Home, XCircle, MapPin } from 'lucide-react';

type OrderStatus = 'pending' | 'accepted' | 'packing' | 'shipped' | 'delivered' | 'cancelled';

interface TrackedOrder {
  id: string;
  status: OrderStatus;
  placedAt: string;
  shippingCity: string;
}

const STEPS: { key: OrderStatus; label: string; icon: typeof PackageCheck }[] = [
  { key: 'accepted', label: 'Order Confirmed', icon: PackageCheck },
  { key: 'packing', label: 'Processing', icon: PackageSearch },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

function stepIndex(status: OrderStatus) {
  if (status === 'pending') return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    // Demo lookup — swap for a real order-status API/query once one exists.
    setTimeout(() => {
      setLoading(false);
      const seed = orderNumber.trim().length + email.trim().length;
      const demoStatuses: OrderStatus[] = ['accepted', 'packing', 'shipped', 'delivered'];
      const status = demoStatuses[seed % demoStatuses.length];
      setOrder({
        id: orderNumber.trim().toUpperCase(),
        status,
        placedAt: new Date(Date.now() - (seed % 6) * 86400000).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        shippingCity: ['Mumbai', 'Bengaluru', 'Delhi', 'Pune'][seed % 4],
      });
    }, 700);
  };

  const currentStep = order ? stepIndex(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          Where&apos;s My Order
        </span>
        <h1 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-950">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium max-w-md mx-auto">
          Enter your order number and the email you used at checkout to see its current status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-5 sm:p-6 bg-stone-50/80 border border-stone-200/80 rounded-xl space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600 block">
              Order Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ARV-10234"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600 block">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          <span>{loading ? 'Searching...' : 'Track Order'}</span>
        </button>
        {error && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-red-600">
            <XCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </form>

      {order && (
        <div className="p-5 sm:p-6 border border-stone-200/80 rounded-xl bg-white space-y-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-stone-200">
            <div>
              <p className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider">Order</p>
              <p className="text-sm font-extrabold text-stone-950 font-mono">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider">Placed On</p>
              <p className="text-sm font-bold text-stone-700">{order.placedAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500">
            <MapPin className="h-3.5 w-3.5" />
            Shipping to {order.shippingCity}
          </div>

          {/* Status timeline */}
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= currentStep;
              const isLast = i === STEPS.length - 1;
              return (
                <div key={step.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                  <div className="flex flex-col items-center gap-2 w-16 sm:w-20">
                    <div
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? 'bg-stone-950 border-stone-950 text-white'
                          : 'bg-white border-stone-200 text-stone-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-center leading-tight ${
                        done ? 'text-stone-900' : 'text-stone-300'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 -mt-6 transition-colors ${
                        i < currentStep ? 'bg-stone-950' : 'bg-stone-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
