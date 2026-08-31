'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Truck, ShieldAlert, RotateCcw, Eye, FileText, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchOrderById, Order } from '@/lib/orders';
import { downloadInvoice } from '@/lib/invoice';
import InvoiceViewModal from '@/components/InvoiceViewModal';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || 'ARVIIK345678';
  const email = searchParams?.get('email') || 'your email';

  const [order, setOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  // The invoice needs the full order (items, payment, shipping) — this
  // page only gets orderId/email/total as URL params from the redirect,
  // so it fetches the rest the same way the order-detail page does. A
  // failed/slow fetch just means the invoice buttons don't appear yet;
  // it never blocks the confirmation itself.
  useEffect(() => {
    let cancelled = false;
    fetchOrderById(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!order || generatingInvoice) return;
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

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Icon checkmark */}
      <div className="h-16 w-16 bg-white border-2 border-[#16A34A] text-[#16A34A] rounded-full flex items-center justify-center mx-auto shadow-xs">
        <Check className="h-8 w-8 stroke-[3px]" />
      </div>
      
      {/* Success Messages */}
      <div className="space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#16A34A]">✓ Order Confirmed</p>
        <h1 className="font-bold text-2xl uppercase tracking-widest text-[#111111]">
          THANK YOU!
        </h1>
        <p className="text-xs text-[#666666] font-medium max-w-xs mx-auto leading-relaxed">
          Your order has been placed successfully.
        </p>
        <div className="pt-2 text-xs font-semibold text-[#666666] space-y-1">
          <p>Order ID: <span className="text-[#111111] font-bold">{orderId}</span></p>
          <p className="text-[10px] text-[#666666] max-w-xs mx-auto uppercase tracking-wide">
            We have sent the order details to your email and SMS.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        {order && (
          <>
            <button
              type="button"
              onClick={() => setShowInvoice(true)}
              className="inline-flex items-center gap-1.5 bg-white border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest px-5 py-3.5 hover:bg-[#F7F7F7] transition-all rounded-[10px] shadow-xs"
            >
              <Eye className="h-3.5 w-3.5" /> View Invoice
            </button>
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={generatingInvoice}
              className="inline-flex items-center gap-1.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest px-5 py-3.5 hover:opacity-90 transition-all rounded-[10px] shadow-xs disabled:opacity-60"
            >
              {generatingInvoice ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              {generatingInvoice ? 'Generating...' : 'Download Invoice'}
            </button>
          </>
        )}
        <Link
          href="/"
          className="inline-block bg-white border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest px-8 py-3.5 hover:bg-[#F7F7F7] transition-all rounded-[10px] shadow-xs"
        >
          CONTINUE SHOPPING
        </Link>
      </div>

      {/* Features Grid Block */}
      <div className="grid grid-cols-3 gap-2 pt-8 border-t border-[#ECECEC] text-[9px] text-[#666666] uppercase tracking-widest font-bold">
        <div className="flex flex-col items-center space-y-1.5">
          <Truck className="h-4.5 w-4.5 text-[#111111]" />
          <span>Estimated Delivery<br/><span className="text-[#111111] font-bold">3-5 Business Days</span></span>
        </div>
        <div className="flex flex-col items-center space-y-1.5">
          <ShieldAlert className="h-4.5 w-4.5 text-[#111111]" />
          <span>Order Tracking<br/><span className="text-[#111111] font-bold">Available</span></span>
        </div>
        <div className="flex flex-col items-center space-y-1.5">
          <RotateCcw className="h-4.5 w-4.5 text-[#111111]" />
          <span>Easy Returns<br/><span className="text-[#111111] font-bold">7 Days Return</span></span>
        </div>
      </div>

      {order && showInvoice && <InvoiceViewModal order={order} onClose={() => setShowInvoice(false)} />}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 text-[10px] font-bold uppercase tracking-widest text-[#666666]">
        Loading details...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
