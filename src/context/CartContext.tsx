'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface CartItem {
  id: string; // product_id + size combination
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  slug: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
  maxStock: number;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  slug: string;
}

interface Coupon {
  code: string;
  discountPercent: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  coupon: Coupon | null;
  couponError: string | null;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  getCartSubtotal: () => number;
  getDiscountAmount: () => number;
  getShippingFee: () => number;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('arviik_cart');
      const storedWishlist = localStorage.getItem('arviik_wishlist');
      const storedCoupon = localStorage.getItem('arviik_coupon');

      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
      if (storedCoupon) setCoupon(JSON.parse(storedCoupon));
    } catch (err) {
      console.error('Error loading cart from localStorage:', err);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('arviik_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  }, [cart, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('arviik_wishlist', JSON.stringify(wishlist));
    } catch (err) {
      console.error('Error saving wishlist:', err);
    }
  }, [wishlist, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      if (coupon) {
        localStorage.setItem('arviik_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('arviik_coupon');
      }
    } catch (err) {
      console.error('Error saving coupon:', err);
    }
  }, [coupon, isInitialized]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      const existingItemIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.size === item.size
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prev];
        const newQty = updatedCart[existingItemIndex].quantity + item.quantity;
        // Limit to maxStock
        updatedCart[existingItemIndex].quantity = Math.min(newQty, item.maxStock);
        return updatedCart;
      }

      return [...prev, { ...item, id: `${item.productId}-${item.size}` }];
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.size === size
          ? { ...i, quantity: Math.min(quantity, i.maxStock) }
          : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const toggleWishlist = (item: WishlistItem) => {
    setWishlist((prev) => {
      const index = prev.findIndex((i) => i.id === item.id);
      if (index > -1) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((i) => i.id === productId);
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        setCouponError('Invalid coupon code');
        return false;
      }

      const expiryDate = new Date(data.expiry_date);
      if (expiryDate < new Date()) {
        setCouponError('Coupon has expired');
        return false;
      }

      if (data.usage_limit && data.times_used >= data.usage_limit) {
        setCouponError('Coupon usage limit reached');
        return false;
      }

      setCoupon({
        code: data.code,
        discountPercent: data.discount_percent,
      });
      return true;
    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('Error applying coupon');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => {
      const activePrice = item.discountPrice !== undefined && item.discountPrice !== null && item.discountPrice > 0
        ? item.discountPrice 
        : item.price;
      return sum + activePrice * item.quantity;
    }, 0);
  };

  const getDiscountAmount = () => {
    if (!coupon) return 0;
    const subtotal = getCartSubtotal();
    return Math.round((subtotal * coupon.discountPercent) / 100);
  };

  const getShippingFee = () => {
    const subtotal = getCartSubtotal();
    if (subtotal === 0) return 0;
    // Free shipping above ₹1500, otherwise flat ₹100
    return subtotal >= 1500 ? 0 : 100;
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const discount = getDiscountAmount();
    const shipping = getShippingFee();
    return subtotal - discount + shipping;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        coupon,
        couponError,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyCoupon,
        removeCoupon,
        getCartSubtotal,
        getDiscountAmount,
        getShippingFee,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
