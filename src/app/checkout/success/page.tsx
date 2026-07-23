'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Truck, ShieldAlert, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || 'ARVIIK345678';
  const email = searchParams?.get('email') || 'your email';

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Icon checkmark */}
      <div className="h-16 w-16 bg-white border-2 border-[#16A34A] text-[#16A34A] rounded-full flex items-center justify-center mx-auto shadow-xs">
        <Check className="h-8 w-8 stroke-[3px]" />
      </div>
      
      {/* Success Messages */}
      <div className="space-y-3">
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

      {/* Button */}
      <div className="pt-2">
        <Link
          href="/shop"
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
