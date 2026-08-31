'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Check,
  FileText,
  Eye,
  RotateCcw,
  Ban,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { fetchOrderById, Order, orderDisplayId, isCancellable, isReturnable } from '@/lib/orders';
import { downloadInvoice } from '@/lib/invoice';
import { formatPrice } from '@/lib/utils';
import OrderStatusBadge from '@/components/account/OrderStatusBadge';
import ConfirmDialog from '@/components/account/ConfirmDialog';
import Skeleton from '@/components/account/Skeleton';
import InvoiceViewModal from '@/components/InvoiceViewModal';

// Adapted from the 7-value DB status enum to a 5-step happy-path timeline.
// There is no distinct "Out for Delivery" state in the schema today — the
// closest honest equivalent is "packing" (labelled Processing here).
const TIMELINE_STEPS = [
  { key: 'pending', label: 'Ordered' },
  { key: 'accepted', label: 'Confirmed' },
  { key: 'packing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const;

const WHATSAPP_NUMBER = '917698892815';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    fetchOrderById(orderId)
      .then((data) => {
        if (cancelled) return;
        if (!data || (user && data.user_id && data.user_id !== user.id)) {
          setError('This order could not be found.');
          return;
        }
        setOrder(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this order right now.');
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, user]);

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-xs font-semibold text-red-600 border border-red-100 bg-red-50 rounded-xs p-4">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.key === order.status);
  const isTerminalAlt = order.status === 'cancelled' || order.status === 'returned';
  const paymentStatus = order.payments?.[0]?.status;
  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleBuyAgain = () => {
    order.order_items.forEach((item) => {
      if (!item.products) return;
      addToCart({
        productId: item.product_id || '',
        name: item.products.name,
        price: item.products.price,
        discountPrice: item.products.discount_price || undefined,
        image: item.products.product_images?.[0]?.image_url || '',
        slug: item.products.slug,
        size: item.size as any,
        quantity: item.quantity,
        maxStock: 10,
      });
    });
    router.push('/cart');
  };

  const handleDownloadInvoice = async () => {
    if (generatingInvoice) return;
    setGeneratingInvoice(true);
    try {
      await downloadInvoice(order);
    } catch (err) {
      console.error('Failed to generate invoice PDF:', err);
      alert('Could not generate the invoice right now. Please try again.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const supportMessage = (reason: string) =>
    `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
      `Hi ARVIIK, I'd like to ${reason} for order ${orderDisplayId(order.id)}.`
    )}`;

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Order</p>
          <p className="text-lg font-extrabold text-stone-950 font-mono">{orderDisplayId(order.id)}</p>
          <p className="text-xs text-stone-500 font-medium mt-0.5">{orderDate}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status Timeline */}
      {isTerminalAlt ? (
        <div className="p-5 border border-stone-200 rounded-lg bg-stone-50/60">
          <OrderStatusBadge status={order.status} />
          <p className="text-xs text-stone-500 font-medium mt-2">
            {order.status === 'cancelled'
              ? 'This order was cancelled.'
              : 'This order was returned.'}
          </p>
        </div>
      ) : (
        <div className="flex items-start overflow-x-auto py-2">
          {TIMELINE_STEPS.map((step, i) => {
            const done = i <= currentStepIdx;
            const isLast = i === TIMELINE_STEPS.length - 1;
            return (
              <div key={step.key} className={`flex items-center ${isLast ? '' : 'flex-1 min-w-[64px]'}`}>
                <div className="flex flex-col items-center gap-2 w-16 sm:w-20 flex-shrink-0">
                  <div
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                      done ? 'bg-stone-950 border-stone-950 text-white' : 'bg-white border-stone-200 text-stone-300'
                    }`}
                  >
                    <Check className="h-4 w-4" />
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
                    className={`flex-1 h-0.5 -mt-5 transition-colors ${i < currentStepIdx ? 'bg-stone-950' : 'bg-stone-200'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Items</h3>
        <div className="border border-stone-200 rounded-lg divide-y divide-stone-100">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="relative w-16 h-20 flex-shrink-0 bg-stone-100 rounded-sm overflow-hidden border border-stone-200/60">
                {item.products?.product_images?.[0]?.image_url && (
                  <Image
                    src={item.products.product_images[0].image_url}
                    alt={item.products.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-bold text-stone-950 truncate">{item.products?.name || 'Product'}</p>
                <p className="text-[11px] text-stone-500 font-semibold uppercase tracking-wide">
                  Size: {item.size} &nbsp;•&nbsp; Qty: {item.quantity}
                </p>
                <p className="text-sm font-extrabold text-stone-950">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-1 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Paid</span>
          <span className="text-base font-extrabold text-stone-950">{formatPrice(order.total_amount)}</span>
        </div>
      </div>

      {/* Delivery + Payment */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 border border-stone-200 rounded-lg space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Delivery Address
          </p>
          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            {order.shipping_name}
            <br />
            {order.shipping_address}, {order.shipping_city}
            <br />
            {order.shipping_state} - {order.shipping_pincode}
          </p>
        </div>
        <div className="p-4 border border-stone-200 rounded-lg space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Payment Status</p>
          <p className="text-xs text-stone-700 font-bold uppercase tracking-wide">
            {paymentStatus === 'success' ? 'Paid' : paymentStatus === 'pending' ? 'Pay on Delivery' : paymentStatus || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5 pt-2 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setShowInvoice(true)}
          className="inline-flex items-center gap-2 py-3 px-5 text-[11px] font-bold uppercase tracking-wider border border-stone-300 text-stone-700 rounded-xs hover:bg-stone-50 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View Invoice
        </button>

        <button
          type="button"
          onClick={handleDownloadInvoice}
          disabled={generatingInvoice}
          className="inline-flex items-center gap-2 py-3 px-5 text-[11px] font-bold uppercase tracking-wider bg-stone-950 text-white rounded-xs hover:bg-stone-800 transition-colors disabled:opacity-60"
        >
          {generatingInvoice ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          {generatingInvoice ? 'Generating...' : 'Download Invoice'}
        </button>

        <button
          type="button"
          onClick={handleBuyAgain}
          className="inline-flex items-center gap-2 py-3 px-5 text-[11px] font-bold uppercase tracking-wider bg-stone-950 text-white rounded-xs hover:bg-stone-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Buy Again
        </button>

        {isReturnable(order.status) && (
          <a
            href={supportMessage('request a return / exchange')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-3 px-5 text-[11px] font-bold uppercase tracking-wider border border-stone-300 text-stone-700 rounded-xs hover:bg-stone-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Return / Exchange
          </a>
        )}

        {isCancellable(order.status) && (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center gap-2 py-3 px-5 text-[11px] font-bold uppercase tracking-wider border border-red-200 text-red-600 rounded-xs hover:bg-red-50 transition-colors"
          >
            <Ban className="h-3.5 w-3.5" /> Cancel Order
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel This Order?"
        message="We'll connect you with ARVIIK support on WhatsApp to process the cancellation right away."
        confirmLabel="Continue on WhatsApp"
        danger
        onConfirm={() => {
          window.open(supportMessage('cancel my order'), '_blank');
          setShowCancelConfirm(false);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {showInvoice && <InvoiceViewModal order={order} onClose={() => setShowInvoice(false)} />}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/account/orders"
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-600 hover:text-stone-950 uppercase tracking-wider transition-colors"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      Back to Orders
    </Link>
  );
}
