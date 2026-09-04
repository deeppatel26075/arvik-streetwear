import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { checkServiceability, estimatePackage, NimbusPostError } from '@/lib/nimbuspost';
import { FLAT_SHIPPING_FEE_RUPEES, FLAT_COD_FEE_RUPEES } from '@/lib/shippingConfig';

interface PlaceOrderItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  slug: string;
  size: string;
  quantity: number;
}

// The one place an order gets created, for both COD and Razorpay. Doing
// this server-side (rather than the browser calling place_order()
// directly) is what makes the deliverability check trustworthy: this
// route confirms with NimbusPost itself that the pincode is actually
// serviceable before creating anything — the client never gets to skip
// that. The shipping charge itself is a flat store fee
// (FLAT_SHIPPING_FEE_RUPEES), not derived from NimbusPost's rate quote.
// NimbusPost's role stops there — shipments are booked manually by the
// store on NimbusPost's own dashboard, not through this app.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shipping, items, couponCode, paymentMethod, accessToken, razorpay } = body as {
      shipping: {
        name: string;
        email: string;
        phone: string;
        address: string;
        apartment?: string;
        city: string;
        state: string;
        pincode: string;
      };
      items: PlaceOrderItem[];
      couponCode?: string;
      paymentMethod: 'cod' | 'razorpay';
      accessToken?: string;
      razorpay?: { paymentId: string; orderId: string; signature: string };
    };

    if (!shipping || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing shipping details or cart items.' }, { status: 400 });
    }
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing session — please log in and try again.' }, { status: 401 });
    }
    if (!/^\d{6}$/.test(shipping.pincode)) {
      return NextResponse.json({ error: 'Enter a valid 6-digit delivery pincode.' }, { status: 400 });
    }

    // place_order() requires auth.uid() to resolve, which only happens
    // when the request carries the actual signed-in user's JWT.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tquoyphmzpsuiwnchctg.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdW95cGhtenBzdWl3bmNoY3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjY2NTQsImV4cCI6MjA5NzI0MjY1NH0.4jgW1wQ1HiTJ3PSlmwSAqUP-GIV8aDYVok-ffyXt_OY';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // ── Razorpay signature verification ──────────────────────────────
    // This HMAC check is the ONLY thing standing between "a real payment
    // happened" and "someone POSTed fabricated IDs at this endpoint." It
    // must actually reject a mismatch — Razorpay's test mode still signs
    // with a real key secret, so there's no legitimate reason for a
    // genuine checkout to ever produce a bad signature here.
    if (paymentMethod === 'razorpay') {
      if (!razorpay?.paymentId || !razorpay?.orderId || !razorpay?.signature) {
        return NextResponse.json({ error: 'Missing Razorpay payment details.' }, { status: 400 });
      }
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        console.error('RAZORPAY_KEY_SECRET is not configured — cannot verify payment.');
        return NextResponse.json({ error: 'Payment verification is not configured. Please contact support.' }, { status: 500 });
      }
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay.orderId}|${razorpay.paymentId}`)
        .digest('hex');
      if (generatedSignature !== razorpay.signature) {
        console.error('Razorpay signature verification failed — rejecting order.');
        return NextResponse.json({ error: 'Payment verification failed. If you were charged, contact support.' }, { status: 402 });
      }
    }

    const totalItemQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const { weightKg, length, width, height } = estimatePackage(totalItemQuantity);
    const cartValueRupees = items.reduce(
      (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
      0
    );
    const paymentMode: 'cod' | 'prepaid' = paymentMethod === 'cod' ? 'cod' : 'prepaid';

    // ── Confirm real deliverability before creating anything — this is
    //    NimbusPost's only role here. The charge is always the flat
    //    FLAT_SHIPPING_FEE_RUPEES regardless of what NimbusPost quotes. ──
    try {
      const serviceability = await checkServiceability({
        deliveryPincode: shipping.pincode,
        paymentMode,
        packages: [{ weight: Math.round(weightKg * 1000), length, width, height }],
        orderValuePaise: Math.round(cartValueRupees * 100),
      });

      if (serviceability.available.length === 0) {
        return NextResponse.json(
          { error: `Sorry, we can't currently deliver to pincode ${shipping.pincode}${paymentMode === 'cod' ? ' via Cash on Delivery' : ''}. Please try a different address or payment method.` },
          { status: 422 }
        );
      }
    } catch (err) {
      if (err instanceof NimbusPostError) throw err;
      // NimbusPost not configured yet (missing env vars) or unreachable —
      // don't block checkout on a logistics outage.
      console.error('Serviceability check failed, allowing checkout to proceed:', err);
    }
    const shippingFeeRupees = FLAT_SHIPPING_FEE_RUPEES + (paymentMethod === 'cod' ? FLAT_COD_FEE_RUPEES : 0);

    // ── Create the order via the atomic DB function ──────────────────
    const { data: orderResult, error: orderError } = await supabase.rpc('place_order', {
      p_items: items.map((item) => ({ product_id: item.productId, size: item.size, quantity: item.quantity })),
      p_shipping_name: shipping.name,
      p_shipping_email: shipping.email,
      p_shipping_phone: shipping.phone,
      p_shipping_address: shipping.apartment ? `${shipping.address}, ${shipping.apartment}` : shipping.address,
      p_shipping_city: shipping.city,
      p_shipping_state: shipping.state,
      p_shipping_pincode: shipping.pincode,
      p_coupon_code: couponCode || null,
      p_payment_method: paymentMethod,
      p_razorpay_payment_id: razorpay?.paymentId || null,
      p_razorpay_order_id: razorpay?.orderId || null,
      p_razorpay_signature: razorpay?.signature || null,
      p_shipping_fee: shippingFeeRupees,
    });

    if (orderError || !orderResult?.order_id) {
      console.error('place_order() error:', orderError);
      return NextResponse.json({ error: orderError?.message || 'Failed to create order. Please try again.' }, { status: 500 });
    }

    const orderId: string = orderResult.order_id;

    return NextResponse.json({
      orderId,
      total: orderResult.total,
      shippingFee: shippingFeeRupees,
    });
  } catch (error: any) {
    console.error('Order placement error:', error);
    const status = error instanceof NimbusPostError ? error.status || 502 : 500;
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status });
  }
}
