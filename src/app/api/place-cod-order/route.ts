import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/place-cod-order
 *
 * Creates a Cash on Delivery order atomically via place_order() SECURITY DEFINER.
 *
 * Security guarantees:
 * - User must be authenticated (JWT in Authorization header).
 * - Prices are calculated server-side by place_order(). Client total is ignored.
 * - If database creation fails, returns an error — never a fake order ID.
 * - No localStorage fallback. No mock order IDs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shipping, items, couponCode } = body;

    // ── 1. Validate required fields ──────────────────────────────────────────
    if (!shipping || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing order data.' },
        { status: 400 }
      );
    }

    // ── 2. Get user's auth token ──────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required to place an order.' },
        { status: 401 }
      );
    }

    const userJwt = authHeader.replace('Bearer ', '');

    // ── 3. Create Supabase client with user's JWT ─────────────────────────────
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

    // Verify the JWT is valid
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    // ── 4. Call place_order() — ALL prices fetched from database ─────────────
    const orderItems = items.map((item: any) => ({
      product_id: item.productId,
      size:       item.size,
      quantity:   item.quantity,
      // Prices are NOT passed — place_order() fetches authoritative prices from DB
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
      p_payment_method:     'cod',
      p_razorpay_payment_id: null,
      p_razorpay_order_id:   null,
      p_razorpay_signature:  null,
    });

    if (orderError || !orderResult?.order_id) {
      console.error('place_order() COD error:', orderError);
      return NextResponse.json(
        { error: orderError?.message || 'Failed to create order. Please try again.' },
        { status: 500 }
      );
    }

    // ── 5. Return real database order ID ─────────────────────────────────────
    // NEVER return a fake/generated order ID
    return NextResponse.json({
      message:  'COD order placed successfully.',
      orderId:  orderResult.order_id,
      total:    orderResult.total,
      subtotal: orderResult.subtotal,
      discount: orderResult.discount,
    });

  } catch (error: any) {
    console.error('COD order error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
