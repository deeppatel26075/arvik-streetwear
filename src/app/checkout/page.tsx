'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { FLAT_SHIPPING_FEE_RUPEES } from '@/lib/shippingConfig';
import SlideToConfirm from '@/components/SlideToConfirm';
import AuthGateModal from '@/components/AuthGateModal';
import {
  ArrowLeft,
  Check,
  Lock,
  ShieldCheck,
  Tag,
  Sparkles,
  ShoppingBag,
  Clock
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const {
    cart,
    getCartSubtotal,
    getDiscountAmount,
    coupon,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [shippingMethod] = useState<'standard'>('standard');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pincode serviceability — checked against prepaid delivery (the
  // baseline; COD-specific availability/charges are re-checked on the
  // payment page once a payment method is actually chosen). This is
  // purely early UI feedback — /api/orders/place re-verifies for real at
  // order-placement time regardless of what this shows.
  const [pincodeCheck, setPincodeCheck] = useState<'idle' | 'checking' | 'serviceable' | 'unserviceable'>('idle');

  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeCheck('idle');
      return;
    }
    let cancelled = false;
    setPincodeCheck('checking');
    const timer = setTimeout(() => {
      const itemQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
      fetch('/api/nimbuspost/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode, paymentMode: 'prepaid', itemQuantity, orderValueRupees: getCartSubtotal() }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (cancelled) return;
          if (r.ok) {
            setPincodeCheck(data.serviceable === false ? 'unserviceable' : 'serviceable');
          } else if (r.status === 400) {
            // The route rejected the pincode itself (bad format/doesn't
            // exist) — that's a real "invalid", not a logistics outage,
            // so it shouldn't fall through to the outage-tolerant default.
            setPincodeCheck('unserviceable');
          } else {
            setPincodeCheck('serviceable'); // logistics outage shouldn't block the form
          }
        })
        .catch(() => {
          if (!cancelled) setPincodeCheck('serviceable'); // logistics outage shouldn't block the form
        });

      // Auto-fill City/State from the pincode (India Post public data) —
      // always overwrites on a new valid pincode, on the assumption that
      // whatever the pincode says is more trustworthy than a stale value
      // from a previously-typed pincode.
      fetch(`/api/pincode-lookup?pincode=${pincode}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || !data.found) return;
          setCity(data.city);
          setState(data.state);
        })
        .catch(() => {});
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.shipping_address || '');
      setCity(profile.shipping_city || '');
      setState(profile.shipping_state || '');
      setPincode(profile.shipping_pincode || '');
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
        <div className="w-16 h-16 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="font-syne font-extrabold text-xl uppercase tracking-wider text-stone-900">
          Your Cart is Empty
        </h1>
        <p className="text-stone-500 text-xs font-medium max-w-xs mx-auto leading-relaxed">
          Add your favorite streetwear pieces to proceed with checkout.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-block bg-stone-950 text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xs shadow-md hover:bg-stone-900 transition-all"
          >
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  // Placing an order requires a signed-in account. Show a blocking sign-in
  // gate instead of the shipping form until AuthContext confirms a user —
  // it disappears on its own once a session lands, no manual close needed.
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 flex items-center justify-center min-h-[50vh]">
        <div className="w-7 h-7 border-2 border-stone-200 border-t-stone-950 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center text-center space-y-3 min-h-[60vh]">
          <div className="w-14 h-14 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center text-stone-400">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-syne font-extrabold text-lg uppercase tracking-wider text-stone-900">
            Sign In Required
          </h1>
          <p className="text-stone-500 text-xs font-medium max-w-xs mx-auto leading-relaxed">
            Your {cart.reduce((sum, item) => sum + item.quantity, 0)} item{cart.length === 1 ? '' : 's'} are saved in your bag — sign in to continue to checkout.
          </p>
        </div>
        <AuthGateModal onCancel={() => router.push('/cart')} />
      </>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    if (!couponInput.trim()) return;

    const success = await applyCoupon(couponInput.trim());
    if (success) {
      setCouponSuccess(`Coupon '${couponInput.trim().toUpperCase()}' applied successfully!`);
      setCouponInput('');
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const submitShipping = () => {
    if (!name || !phone || !email || !address || !city || !state || !pincode) {
      setErrorMsg('Please complete all required shipping fields');
      return false;
    }
    if (pincodeCheck === 'unserviceable') {
      setErrorMsg('We currently cannot deliver to this pincode. Please check the address.');
      return false;
    }
    setErrorMsg(null);

    const shippingDetails = {
      name,
      phone,
      email,
      address,
      apartment,
      city,
      state,
      pincode,
      shippingMethod
    };

    localStorage.setItem('arviik_shipping', JSON.stringify(shippingDetails));
    router.push('/checkout/payment');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitShipping();
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Return button */}
      <div className="flex justify-between items-center pb-2 border-b border-stone-200">
        <Link
          href="/cart"
          className="inline-flex items-center space-x-2 text-xs text-stone-600 hover:text-stone-950 uppercase tracking-widest font-bold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Shopping Bag</span>
        </Link>
        <div className="flex items-center space-x-1.5 text-[10px] text-stone-500 font-bold uppercase tracking-widest">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          <span>SSL 256-Bit Encrypted Checkout</span>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-6 pb-2 max-w-full overflow-x-hidden select-none">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold text-stone-950">
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-950 text-white flex items-center justify-center text-[9px] sm:text-[10px]">1</span>
          <span className="uppercase tracking-wider text-[9px] sm:text-[10px] font-extrabold">Shipping</span>
        </div>
        <div className="h-[1px] w-5 sm:w-12 bg-stone-200" />
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold text-stone-400">
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-100 border border-stone-200 text-stone-500 flex items-center justify-center text-[9px] sm:text-[10px]">2</span>
          <span className="uppercase tracking-wider text-[9px] sm:text-[10px]">Payment</span>
        </div>
        <div className="h-[1px] w-5 sm:w-12 bg-stone-200" />
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold text-stone-400">
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-100 border border-stone-200 text-stone-500 flex items-center justify-center text-[9px] sm:text-[10px]">3</span>
          <span className="uppercase tracking-wider text-[9px] sm:text-[10px]">Confirmation</span>
        </div>
      </div>

      {/* 2-Column Responsive Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        
        {/* Left Column: Shipping Form */}
        <div className="lg:col-span-7 space-y-6 bg-white border border-stone-200/80 p-6 lg:p-8 rounded-xs shadow-xs">
          
          <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
            <h1 className="font-syne font-extrabold text-base uppercase tracking-wider text-stone-950">
              Delivery & Shipping Information
            </h1>
            {user && (
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-xs uppercase tracking-widest">
                Auto-Filled Profile
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Contact Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">
                Email Address for Order Updates *
              </label>
              <input
                type="email"
                required
                placeholder="rishipatel1610@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
              />
            </div>

            {/* Name & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rishi Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">
                  Mobile Number (for SMS & Tracking) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="ARVIIK HQ, Street 12, S.T. Stand Area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
              />
            </div>

            {/* Apartment */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                Apartment, suite, unit, etc. (optional)
              </label>
              <input
                type="text"
                placeholder="Flat 402, Building B"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
              />
            </div>

            {/* City, State, Pincode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Surendranagar"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">
                  State *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Gujarat"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="363001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className={`w-full bg-stone-50 border px-3.5 py-2.5 text-xs focus:outline-none rounded-xs ${
                    pincodeCheck === 'unserviceable' ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
                {pincodeCheck === 'checking' && (
                  <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Checking deliverability...</p>
                )}
                {pincodeCheck === 'serviceable' && (
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">✓ Delivery available to this pincode</p>
                )}
                {pincodeCheck === 'unserviceable' && (
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">✗ Not deliverable to this pincode</p>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="pt-3 space-y-2">
              <label className="text-[10px] text-stone-700 font-extrabold uppercase tracking-wider block">
                Shipping Method
              </label>

              <div className="p-3.5 rounded-xs border border-stone-950 bg-stone-50/80 shadow-xs flex items-center space-x-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-stone-900" />
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">Standard Courier</span>
                  </div>
                  <span className="text-[10px] text-stone-500 block font-medium">Pan-India 5-7 Days</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-[11px] text-red-800 font-bold uppercase tracking-wider">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="mt-4">
              <SlideToConfirm label="Slide To Buy" onConfirm={submitShipping} />
            </div>
          </form>
        </div>

        {/* Right Column: Live Order Summary Card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-stone-50 border border-stone-200/80 p-6 rounded-xs space-y-5 shadow-xs">
            <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
              <h2 className="font-syne font-extrabold text-sm uppercase tracking-wider text-stone-900">
                Order Summary ({totalItemCount} Items)
              </h2>
              <Link href="/cart" className="text-[10px] font-bold text-stone-500 hover:text-stone-900 uppercase tracking-wider underline">
                Edit Cart
              </Link>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-stone-200 max-h-64 overflow-y-auto pr-1 space-y-3">
              {cart.map((item, idx) => (
                <div key={`${item.productId}-${item.size}-${idx}`} className="flex items-center space-x-3 pt-3 first:pt-0">
                  <div className="relative w-14 h-16 bg-stone-200 rounded-xs overflow-hidden flex-shrink-0 border border-stone-300">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="60px"
                      className="object-cover"
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

            {/* Promo / Coupon Application Box */}
            <div className="pt-2 border-t border-stone-200 space-y-2">
              <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3 w-3 text-stone-700" />
                <span>Have a Discount Coupon?</span>
              </label>

              {coupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs flex justify-between items-center text-xs text-emerald-900 font-bold">
                  <div>
                    <span className="uppercase font-extrabold">{coupon.code}</span> Applied!
                    <p className="text-[9px] text-emerald-700 font-medium">({coupon.discountPercent}% Off Total)</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[10px] text-red-700 hover:text-red-900 uppercase tracking-widest font-bold underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10 or ARVIIK20"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-grow bg-white border border-stone-200 px-3 py-2 text-xs uppercase focus:outline-none focus:border-stone-900 rounded-xs"
                  />
                  <button
                    type="submit"
                    className="bg-stone-950 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 hover:bg-stone-900 transition-all rounded-xs"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{couponSuccess}</p>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-stone-200 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItemCount} items)</span>
                <span className="text-stone-900">{formatPrice(getCartSubtotal())}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount ({coupon.code})</span>
                  <span>-{formatPrice(getDiscountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span>Shipping</span>
                <span className="text-stone-900">{formatPrice(FLAT_SHIPPING_FEE_RUPEES)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-stone-950 pt-1">
                <span>Total Amount</span>
                <span className="font-mono">
                  {formatPrice(getCartSubtotal() - getDiscountAmount() + FLAT_SHIPPING_FEE_RUPEES)}
                </span>
              </div>
            </div>

          </div>

          {/* Guarantee Badges Banner */}
          <div className="grid grid-cols-2 gap-3 text-center text-[10px] font-bold uppercase tracking-wider text-stone-600">
            <div className="p-3 bg-white border border-stone-200 rounded-xs flex items-center justify-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-stone-900" />
              <span>100% Authentic Quality</span>
            </div>
            <div className="p-3 bg-white border border-stone-200 rounded-xs flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 text-stone-900" />
              <span>Easy 7-Day Exchange</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
