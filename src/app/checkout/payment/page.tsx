'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { FLAT_SHIPPING_FEE_RUPEES, FLAT_COD_FEE_RUPEES } from '@/lib/shippingConfig';
import { ArrowLeft, Check, Lock, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShippingDetails {
  name: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { cart, getCartSubtotal, getDiscountAmount, clearCart, coupon } = useCart();
  const [shipping, setShipping] = useState<ShippingDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // NimbusPost is used only to confirm this pincode is actually
  // deliverable (and, separately, COD-eligible) — never to price
  // shipping. The charge is always the flat FLAT_SHIPPING_FEE_RUPEES.
  const [prepaidServiceable, setPrepaidServiceable] = useState<boolean | null>(null);
  const [codServiceable, setCodServiceable] = useState<boolean | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_shipping');
      if (stored) {
        setShipping(JSON.parse(stored));
      } else {
        router.push('/checkout');
      }
    } catch (e) {
      console.error('Failed to parse shipping details:', e);
      router.push('/checkout');
    }
  }, [router]);

  useEffect(() => {
    if (!shipping?.pincode) return;
    let cancelled = false;
    setQuoteLoading(true);

    const itemQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const orderValueRupees = getCartSubtotal() - getDiscountAmount();

    const checkMode = (paymentMode: 'prepaid' | 'cod') =>
      fetch('/api/nimbuspost/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: shipping.pincode, paymentMode, itemQuantity, orderValueRupees }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (r.ok) return data.serviceable !== false;
          // The route rejected the pincode itself (bad format/doesn't
          // exist) — that's a real "invalid", not a logistics outage.
          if (r.status === 400) return false;
          return true; // logistics outage shouldn't block checkout
        })
        .catch(() => true); // logistics outage shouldn't block checkout

    Promise.all([checkMode('prepaid'), checkMode('cod')]).then(([prepaid, cod]) => {
      if (cancelled) return;
      setPrepaidServiceable(prepaid);
      setCodServiceable(cod);
      setQuoteLoading(false);
      if (!cod) setPaymentMethod('razorpay');
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipping?.pincode]);

  const isServiceable = paymentMethod === 'cod' ? codServiceable : prepaidServiceable;
  const codFeeRupees = paymentMethod === 'cod' ? FLAT_COD_FEE_RUPEES : 0;
  const grandTotal = getCartSubtotal() - getDiscountAmount() + FLAT_SHIPPING_FEE_RUPEES + codFeeRupees;

  // Load Razorpay SDK script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  if (cart.length === 0) {
    return null;
  }

  // The one place an order actually gets created, for both payment
  // methods — /api/orders/place is what calls place_order() (with a
  // real NimbusPost-quoted shipping fee) and books the shipment. Needs
  // the browser session's access token forwarded since that server route
  // has no session of its own otherwise.
  const submitOrder = async (razorpay?: { paymentId: string; orderId: string; signature: string }) => {
    if (!shipping) throw new Error('Missing shipping details.');

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error('Your session expired. Please log in again and retry.');
    }

    const res = await fetch('/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipping,
        items: cart,
        couponCode: coupon?.code,
        paymentMethod: razorpay ? 'razorpay' : 'cod',
        accessToken,
        razorpay,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.orderId) {
      throw new Error(data.error || 'Failed to place order. Please try again.');
    }
    return data as { orderId: string; total: number; shippingFee: number };
  };

  const handlePlaceOrder = async () => {
    if (!shipping) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. CASH ON DELIVERY (COD) FLOW
      if (paymentMethod === 'cod') {
        const result = await submitOrder();

        clearCart();
        localStorage.removeItem('arviik_shipping');

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });

        router.push(`/checkout/success?orderId=${result.orderId}&email=${shipping.email}&total=${result.total}`);
        return;
      }

      // 2. RAZORPAY ONLINE PAYMENT FLOW
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Call backend route to generate Razorpay Order ID — required for a
      // real payment; if this fails there's no legitimate order to pay
      // for, so abort rather than opening the widget without one.
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          currency: 'INR',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        throw new Error(data.error || 'Could not start payment. Please try again.');
      }
      const razorpayOrderId = data.id;

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Payments are not configured right now. Please try again later.');
      }

      const options: any = {
        key: razorpayKey,
        amount: Math.round(grandTotal * 100), // in paise
        currency: 'INR',
        name: 'ARVIIK STREETWEAR',
        description: 'Payment for Streetwear Order',
        image: '/arviik-logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: shipping.name,
          email: shipping.email,
          contact: shipping.phone,
        },
        theme: {
          color: '#09090b',
        },
        handler: async function (response: any) {
          setLoading(true);
          try {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Payment confirmation was incomplete. If you were charged, contact support.');
            }
            const result = await submitOrder({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            const finalOrderId = result.orderId;

            clearCart();
            localStorage.removeItem('arviik_shipping');

            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });

            router.push(`/checkout/success?orderId=${finalOrderId}&email=${shipping.email}&total=${result.total}`);
          } catch (verifyError: any) {
            console.error('Verification error:', verifyError);
            setErrorMsg(verifyError.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        console.error('Razorpay Payment Failed:', response.error);
        setErrorMsg(`Payment failed: ${response.error.description || 'Transaction cancelled.'}`);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error('Order placement error:', err);
      setErrorMsg(err.message || 'An error occurred during order processing.');
      setLoading(false);
    }
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Return & Encrypted Banner */}
      <div className="flex justify-between items-center pb-2 border-b border-stone-200">
        <Link
          href="/checkout"
          className="inline-flex items-center space-x-2 text-xs text-stone-600 hover:text-stone-950 uppercase tracking-widest font-bold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Shipping Details</span>
        </Link>
        <div className="flex items-center space-x-1.5 text-[10px] text-stone-500 font-bold uppercase tracking-widest">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          <span>SSL 256-Bit Encrypted Checkout</span>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-6 pb-2 max-w-full overflow-x-hidden select-none">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold text-emerald-700">
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] sm:text-[10px]">
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
          </span>
          <span className="uppercase tracking-wider text-[9px] sm:text-[10px]">Shipping</span>
        </div>
        <div className="h-[1px] w-5 sm:w-12 bg-emerald-600" />
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold text-stone-950">
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-950 text-white flex items-center justify-center text-[9px] sm:text-[10px]">2</span>
          <span className="uppercase tracking-wider text-[9px] sm:text-[10px] font-extrabold">Payment</span>
        </div>
        <div className="h-[1px] w-5 sm:w-12 bg-stone-200" />
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold text-stone-400">
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-100 border border-stone-200 text-stone-500 flex items-center justify-center text-[9px] sm:text-[10px]">3</span>
          <span className="uppercase tracking-wider text-[9px] sm:text-[10px]">Confirmation</span>
        </div>
      </div>

      {/* 2-Column Responsive Payment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        
        {/* Left Column: Payment Options & Shipping Address Summary */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Shipping Address Summary Card */}
          {shipping && (
            <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xs space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-stone-200/60 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Delivering To:</span>
                <Link href="/checkout" className="text-[10px] font-bold text-stone-900 underline uppercase tracking-wider">
                  Change
                </Link>
              </div>
              <p className="font-bold text-stone-900 uppercase tracking-wide">{shipping.name} • {shipping.phone}</p>
              <p className="text-stone-600">{shipping.address}{shipping.apartment ? `, ${shipping.apartment}` : ''}, {shipping.city}, {shipping.state} - {shipping.pincode}</p>
            </div>
          )}

          <div className="bg-white border border-stone-200/80 p-6 lg:p-8 rounded-xs space-y-5 shadow-xs">
            <h1 className="font-syne font-extrabold text-base uppercase tracking-wider text-stone-950 border-b border-stone-200 pb-3">
              Select Payment Method
            </h1>

            {/* Payment Options Radio List */}
            <div className="space-y-3">
              {/* Razorpay Option */}
              <label
                className={`flex items-start justify-between p-4.5 rounded-xs border cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-stone-950 bg-stone-50/80 ring-2 ring-stone-950 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 text-stone-950 focus:ring-stone-950 h-4 w-4"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                        Razorpay Online Secure Checkout
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-2 py-0.5 rounded-xs uppercase tracking-widest border border-blue-200 flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 fill-current" /> Instant
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                      Pay via UPI (Google Pay, PhonePe, Paytm), Credit / Debit Cards, NetBanking, and Wallets.
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Methods:</span>
                      <span className="text-[9px] font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded-xs border border-stone-200">UPI</span>
                      <span className="text-[9px] font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded-xs border border-stone-200">Google Pay</span>
                      <span className="text-[9px] font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded-xs border border-stone-200">Debit / Credit Card</span>
                    </div>
                  </div>
                </div>
                <CreditCard className="h-5 w-5 text-stone-800 flex-shrink-0 mt-1" />
              </label>

              {/* COD Option */}
              <label
                className={`flex items-center justify-between p-4.5 rounded-xs border transition-all ${
                  codServiceable === false
                    ? 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed'
                    : paymentMethod === 'cod'
                    ? 'border-stone-950 bg-stone-50/80 ring-2 ring-stone-950 shadow-xs cursor-pointer'
                    : 'border-stone-200 bg-white hover:border-stone-400 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    disabled={codServiceable === false}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-stone-950 focus:ring-stone-950 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {codServiceable === false
                        ? 'COD is not available for this pincode — choose online payment instead.'
                        : `Pay cash upon doorstep parcel delivery. COD fee: ${formatPrice(FLAT_COD_FEE_RUPEES)}.`}
                    </span>
                  </div>
                </div>
                <ShieldCheck className="h-5 w-5 text-stone-800 flex-shrink-0" />
              </label>
            </div>

            {prepaidServiceable === false && codServiceable === false && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xs text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                ⚠️ We currently can&apos;t deliver to pincode {shipping?.pincode}. Please{' '}
                <Link href="/checkout" className="underline">
                  go back
                </Link>{' '}
                and try a different address.
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xs text-[11px] text-red-800 font-bold uppercase tracking-wider">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading || quoteLoading || isServiceable === false}
              className="w-full bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs tracking-widest uppercase py-4 rounded-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
            >
              <span>
                {loading
                  ? 'Processing Order...'
                  : quoteLoading
                  ? 'Checking Deliverability...'
                  : paymentMethod === 'razorpay'
                  ? `PAY ${formatPrice(grandTotal)} VIA RAZORPAY`
                  : `PLACE COD ORDER (${formatPrice(grandTotal)})`}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-stone-50 border border-stone-200/80 p-6 rounded-xs space-y-5 shadow-xs">
            <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
              <h2 className="font-syne font-extrabold text-sm uppercase tracking-wider text-stone-900">
                Order Summary ({totalItemCount} Items)
              </h2>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-stone-200 max-h-64 overflow-y-auto pr-1 space-y-3">
              {cart.map((item, idx) => (
                <div key={`${item.productId}-${item.size}-${idx}`} className="flex items-center space-x-3 pt-3 first:pt-0">
                  <div className="relative w-14 h-16 bg-stone-200 rounded-xs overflow-hidden flex-shrink-0 border border-stone-300">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                    <span className="absolute top-0 right-0 bg-stone-950 text-white text-[9px] font-bold px-1.5 py-0.2">
                      x{item.quantity}
                    </span>
                  </div>
                  <div className="flex-grow space-y-0.5">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold">
                      Size: {item.size} • Qty: {item.quantity}
                    </p>
                    <p className="text-xs font-extrabold text-stone-950 font-mono">
                      {formatPrice((item.discountPrice || item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-stone-200 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-900">{formatPrice(getCartSubtotal())}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon ({coupon.code})</span>
                  <span>-{formatPrice(getDiscountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-stone-900">{formatPrice(FLAT_SHIPPING_FEE_RUPEES)}</span>
              </div>
              {codFeeRupees > 0 && (
                <div className="flex justify-between pb-2 border-b border-stone-200">
                  <span>COD Fee</span>
                  <span className="text-stone-900">{formatPrice(codFeeRupees)}</span>
                </div>
              )}
              {codFeeRupees === 0 && <div className="pb-2 border-b border-stone-200" />}
              <div className="flex justify-between text-base font-extrabold text-stone-950 pt-1">
                <span>Total Amount</span>
                <span className="font-mono">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
