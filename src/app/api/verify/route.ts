import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/verify
 *
 * Verifies a Razorpay payment HMAC signature, then creates the order
 * atomically in the database via place_order() SECURITY DEFINER function.
 *
 * Security guarantees:
 * - Signature MUST pass HMAC-SHA256 verification. No bypass conditions.
 * - Prices are calculated server-side by place_order(). Client total is ignored.
 * - Order is only created on real signature verification success.
 * - User must be authenticated (JWT passed in Authorization header from client).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      shipping,
      items,
      couponCode,
    } = body;

    // ── 1. Validate required fields ──────────────────────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment fields.' },
        { status: 400 }
      );
    }

    if (!shipping || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing order data.' },
        { status: 400 }
      );
    }

    // ── 2. Verify Razorpay HMAC Signature ────────────────────────────────────
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error('RAZORPAY_KEY_SECRET environment variable is not set.');
      return NextResponse.json(
        { error: 'Payment gateway is not configured.' },
        { status: 503 }
      );
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    // Strict constant-time comparison — NO bypass conditions whatsoever
    const isVerified =
      generated_signature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generated_signature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
      );

    if (!isVerified) {
      console.warn('Razorpay signature verification FAILED for order:', razorpay_order_id);
      return NextResponse.json(
        { error: 'Payment signature verification failed. This payment cannot be accepted.' },
        { status: 400 }
      );
    }

    // ── 3. Get user's auth token from request header ──────────────────────────
    // The client must send its Supabase session JWT in Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required to place an order.' },
        { status: 401 }
      );
    }

    const userJwt = authHeader.replace('Bearer ', '');

    // ── 4. Create Supabase client with user's JWT ─────────────────────────────
    // This ensures place_order() runs with auth.uid() = the real user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are not configured.');
      return NextResponse.json(
        { error: 'Database is not configured.' },
        { status: 503 }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });

    // Verify the JWT is valid and get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    // ── 5. Call place_order() — ALL prices calculated server-side ────────────
    // The client items array only contains: { product_id, size, quantity }
    // Prices are fetched from the database inside place_order().
    const orderItems = items.map((item: any) => ({
      product_id: item.productId,
      size:       item.size,
      quantity:   item.quantity,
      // Note: price is intentionally NOT passed — place_order() fetches it from DB
    }));

    const { data: orderResult, error: orderError } = await supabaseUser.rpc('place_order', {
      p_items:              orderItems,
      p_shipping_name:      shipping.name,
      p_shipping_email:     shipping.email,
      p_shipping_phone:     shipping.phone,
      p_shipping_address:   shipping.address,
      p_shipping_city:      shipping.city,
      p_shipping_state:     shipping.state,
      p_shipping_pincode:   shipping.pincode,
      p_coupon_code:        couponCode || null,
      p_payment_method:     'razorpay',
      p_razorpay_payment_id: razorpay_payment_id,
      p_razorpay_order_id:   razorpay_order_id,
      p_razorpay_signature:  razorpay_signature,
    });

    if (orderError || !orderResult?.order_id) {
      console.error('place_order() error:', orderError);
      return NextResponse.json(
        { error: orderError?.message || 'Failed to create order. Please contact support.' },
        { status: 500 }
      );
    }

    // ── 6. Return real database order ID ─────────────────────────────────────
    return NextResponse.json({
      message:  'Payment verified and order created successfully.',
      orderId:  orderResult.order_id,
      total:    orderResult.total,
      subtotal: orderResult.subtotal,
      discount: orderResult.discount,
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
