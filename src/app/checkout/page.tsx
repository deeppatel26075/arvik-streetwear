'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ArrowLeft, CreditCard, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    cart,
    coupon,
    clearCart,
    getCartSubtotal,
    getDiscountAmount,
    getShippingFee,
    getCartTotal,
  } = useCart();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);

  // Autofill if user is logged in and has profile data
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setEmail(user?.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.shipping_address || '');
      setCity(profile.shipping_city || '');
      setState(profile.shipping_state || '');
      setPincode(profile.shipping_pincode || '');
    }
  }, [profile, user]);

  if (cart.length === 0 && !orderCompleted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest">
          Your bag is empty. Add items to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-block text-xs bg-stone-900 text-white font-bold uppercase tracking-widest px-8 py-3.5 hover:opacity-85 transition-opacity"
        >
          View Collection
        </Link>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !city || !state || !pincode) {
      setErrorMsg('Please complete all fields');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Create order on server side (initialize Razorpay Order ID)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: getCartTotal(),
          currency: 'INR',
          email,
          name,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.id) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ARVIIK Streetwear',
        description: 'Order Payment',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=150',
        order_id: orderData.id,
        handler: async function (response: any) {
          // Razorpay returns checkout success data
          try {
            setLoading(true);
            
            // 3. Verify payment signature and record order in database
            const verifyRes = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                shipping: {
                  name,
                  email,
                  phone,
                  address,
                  city,
                  state,
                  pincode,
                },
                items: cart,
                total: getCartTotal(),
                couponId: coupon ? coupon.code : null,
                userId: user?.id || null,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Signature verification failed');
            }

            // Payment successful, order recorded
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });

            // Local cache saving for order and stock decrementing (prototype mode)
            try {
              const localOrder = {
                id: verifyData.orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
                created_at: new Date().toISOString(),
                shipping_name: name,
                shipping_email: email,
                shipping_phone: phone,
                shipping_address: address,
                shipping_city: city,
                shipping_state: state,
                shipping_pincode: pincode,
                total_amount: getCartTotal(),
                status: 'pending',
                order_items: cart.map(item => ({
                  size: item.size,
                  quantity: item.quantity,
                  price: item.discountPrice || item.price,
                  products: { name: item.name }
                }))
              };
              const existingOrders = JSON.parse(localStorage.getItem('arviik_custom_orders') || '[]');
              localStorage.setItem('arviik_custom_orders', JSON.stringify([localOrder, ...existingOrders]));

              // Decrement local inventory stock in product listings
              const storedProducts = localStorage.getItem('arviik_custom_products');
              if (storedProducts) {
                const productsList = JSON.parse(storedProducts);
                const updatedProducts = productsList.map((prod: any) => {
                  const cartItemsForProduct = cart.filter(item => item.productId === prod.id);
                  if (cartItemsForProduct.length > 0) {
                    const updatedSizes = prod.sizes?.map((sizeItem: any) => {
                      const matchedCartItem = cartItemsForProduct.find(item => item.size === sizeItem.size);
                      if (matchedCartItem) {
                        return {
                          ...sizeItem,
                          quantity: Math.max(0, sizeItem.quantity - matchedCartItem.quantity)
                        };
                      }
                      return sizeItem;
                    }) || [];
                    return {
                      ...prod,
                      sizes: updatedSizes,
                      inventory: updatedSizes
                    };
                  }
                  return prod;
                });
                localStorage.setItem('arviik_custom_products', JSON.stringify(updatedProducts));
              }
            } catch (e) {
              console.error('Failed to update local order cache/inventory:', e);
            }

            setCompletedOrderDetails({
              orderId: verifyData.orderId,
              email,
              total: getCartTotal(),
            });
            setOrderCompleted(true);
            clearCart();
          } catch (err: any) {
            console.error('Payment processing failed:', err);
            setErrorMsg(err.message || 'Payment signature verification failed.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: '#0c0c0b',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMsg('Payment transaction failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Checkout failed:', err);
      setErrorMsg(err.message || 'An error occurred during checkout setup.');
      setLoading(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.25em]">
            Order Successful
          </span>
          <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
            Thank you for your order
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Order Reference: <strong className="font-semibold text-stone-800">{completedOrderDetails?.orderId}</strong>
            <br />
            A confirmation email has been logged to {completedOrderDetails?.email}.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="text-xs bg-stone-900 text-white font-bold uppercase tracking-widest px-8 py-3.5 hover:opacity-85 transition-opacity"
          >
            Continue Shopping
          </Link>
          <Link
            href="/profile"
            className="text-xs border border-stone-300 text-stone-700 font-bold uppercase tracking-widest px-8 py-3.5 hover:border-stone-900 transition-colors"
          >
            Track Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Return button */}
      <div className="mb-8">
        <Link
          href="/shop"
          className="inline-flex items-center space-x-1 text-xs text-stone-500 hover:text-stone-900 uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to shop</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left column: Shipping Details form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-syne font-extrabold text-xl uppercase tracking-wider text-stone-900">
              Delivery Information
            </h2>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Karan Malhotra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="karan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                Street Address
              </label>
              <input
                type="text"
                required
                placeholder="Apartment, suite, unit, building, street, etc."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  required
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  placeholder="400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-700 font-bold uppercase tracking-wider pt-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-4 hover:opacity-90 transition-opacity rounded-xs flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>{loading ? 'Processing Securely...' : `Pay ${formatPrice(getCartTotal())}`}</span>
            </button>
          </form>
        </div>

        {/* Right column: Order Summary Panel */}
        <div className="lg:col-span-5 bg-white border border-stone-200/50 p-6 rounded-xs shadow-xs h-fit space-y-6">
          <div className="border-b border-stone-100 pb-3 flex items-center space-x-2">
            <ShoppingBag className="h-4.5 w-4.5 text-stone-800" />
            <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider">
              Order Summary
            </h3>
          </div>

          {/* Items Preview */}
          <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto space-y-3 pr-2">
            {cart.map((item) => {
              const activePrice = item.discountPrice !== undefined && item.discountPrice > 0 
                ? item.discountPrice 
                : item.price;
              return (
                <div key={item.id} className="flex items-center space-x-3 pt-3 first:pt-0">
                  <div className="relative h-14 w-11 bg-stone-100 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow text-[11px] text-stone-600">
                    <p className="font-semibold text-stone-900 uppercase tracking-wide line-clamp-1">{item.name}</p>
                    <p className="uppercase tracking-widest text-[9px] mt-0.5 text-stone-400">Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-stone-900">
                    {formatPrice(activePrice * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-stone-100 pt-4 space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">{formatPrice(getCartSubtotal())}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-emerald-700">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>Discount ({coupon.discountPercent}%)</span>
                </span>
                <span>-{formatPrice(getDiscountAmount())}</span>
              </div>
            )}
            <div className="flex justify-between pb-2">
              <span>Shipping</span>
              <span>
                {getShippingFee() === 0 ? 'FREE' : formatPrice(getShippingFee())}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-stone-150">
              <span className="font-syne font-bold uppercase text-stone-900 text-sm">Total Amount</span>
              <span className="font-syne font-extrabold text-stone-950 text-lg">
                {formatPrice(getCartTotal())}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
