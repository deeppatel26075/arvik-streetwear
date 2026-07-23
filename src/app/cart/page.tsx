'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartSubtotal,
    getDiscountAmount,
    getShippingFee,
    getCartTotal,
    applyCoupon,
    coupon,
    couponError,
    removeCoupon
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setSubmitting(true);
    await applyCoupon(couponCode);
    setSubmitting(false);
    setCouponCode('');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-bold text-xl uppercase tracking-wider text-[#111111]">
          Your Bag is Empty
        </h1>
        <p className="text-[#666666] text-xs font-medium max-w-sm mx-auto uppercase tracking-wider">
          Add items to your bag to check out.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="apple-button inline-flex items-center space-x-2 text-xs tracking-widest shadow-xs hover:opacity-90"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Return button */}
      <div>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-1.5 text-xs text-[#666666] hover:text-[#111111] uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to shop</span>
        </Link>
      </div>

      <h1 className="font-bold text-lg uppercase tracking-widest text-[#111111]">
        YOUR CART
      </h1>

      {/* Cart items list */}
      <div className="space-y-4">
        {cart.map((item) => {
          const activePrice = item.discountPrice && item.discountPrice > 0 
            ? item.discountPrice 
            : item.price;

          return (
            <div
              key={item.id}
              className="apple-card p-4 flex space-x-4 items-center justify-between"
            >
              <div className="flex items-center space-x-4 flex-grow">
                <div className="relative aspect-3/4 w-16 bg-[#F7F7F7] rounded-[10px] overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xs uppercase text-[#111111] line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-[#666666] font-bold uppercase tracking-wider">
                    {item.size}
                  </p>
                  <p className="text-xs font-bold text-[#111111]">
                    {formatPrice(activePrice)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Quantity */}
                <div className="flex items-center border border-[#ECECEC] rounded-[8px] bg-[#F7F7F7] text-xs">
                  <button
                    onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                    className="px-2.5 py-1.5 text-[#666666] hover:text-[#111111] font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold px-2 text-[#111111]">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                    className="px-2.5 py-1.5 text-[#666666] hover:text-[#111111] font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId, item.size)}
                  className="text-[#666666] hover:text-[#DC2626] p-1.5"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Application */}
      <div className="pt-2">
        <form onSubmit={handleCouponSubmit} className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#666666]">
            Apply Coupon
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="apple-input flex-grow text-[10px] uppercase font-bold py-2.5 px-3"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#111111] hover:opacity-90 text-white font-bold text-[9px] uppercase tracking-widest px-5 rounded-[10px]"
            >
              APPLY
            </button>
          </div>
          {couponError && (
            <p className="text-[9px] text-[#DC2626] font-bold uppercase tracking-wider">
              {couponError}
            </p>
          )}
          {coupon && (
            <div className="flex items-center justify-between text-[9px] text-[#16A34A] font-bold uppercase tracking-wider">
              <span>Applied: {coupon.code}</span>
              <button type="button" onClick={removeCoupon} className="underline text-[#666666]">
                Remove
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Summary block */}
      <div className="border-t border-[#ECECEC] pt-4 space-y-3.5 text-xs font-semibold text-[#666666]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-[#111111]">{formatPrice(getCartSubtotal())}</span>
        </div>
        {coupon && (
          <div className="flex justify-between text-[#16A34A]">
            <span>Discount</span>
            <span>-{formatPrice(getDiscountAmount())}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-[#111111]">
            {getShippingFee() === 0 ? 'Free' : formatPrice(getShippingFee())}
          </span>
        </div>
        <div className="border-t border-[#ECECEC] pt-4 flex justify-between text-sm font-bold text-[#111111]">
          <span>Total</span>
          <span>{formatPrice(getCartTotal())}</span>
        </div>
      </div>

      {/* Proceed CTA */}
      <div className="pt-2 space-y-2">
        <Link
          href="/checkout"
          className="w-full bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs tracking-widest uppercase py-4 rounded-xs shadow-md transition-all flex items-center justify-center space-x-2 border border-transparent hover:border-stone-800"
        >
          <span>PROCEED TO CHECKOUT</span>
          <span className="text-stone-300">→</span>
        </Link>
        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1">
          <span>🔒 256-Bit Encrypted Secure Checkout</span>
        </p>
      </div>
    </div>
  );
}
