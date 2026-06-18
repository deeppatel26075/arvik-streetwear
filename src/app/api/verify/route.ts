import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      shipping,
      items,
      total,
      couponId,
      userId,
    } = await request.json();

    // 1. Signature Verification
    let paymentConfig: any = {};
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'payment_config')
        .single();
      if (data && data.value) {
        paymentConfig = data.value;
      }
    } catch (e) {
      console.warn('Failed to load DB payment config in verify:', e);
    }

    const key_secret = paymentConfig.key_secret || process.env.RAZORPAY_KEY_SECRET;
    const isCod = razorpay_payment_id === 'pay_cod';

    if (!isCod) {
      if (!key_secret) {
        return NextResponse.json({ error: 'Razorpay Key Secret is missing.' }, { status: 400 });
      }

      // Create text combination
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      
      // Generate HMAC hex digest
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(text)
        .digest('hex');

      const isVerified = generated_signature === razorpay_signature;

      if (!isVerified) {
        return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
      }
    }

    // 2. Insert into Database
    let coupon_db_id = null;

    // If coupon was used, verify and log it
    if (couponId) {
      const { data: couponData } = await supabase
        .from('coupons')
        .select('id, times_used')
        .eq('code', couponId.toUpperCase())
        .single();
      
      if (couponData) {
        coupon_db_id = couponData.id;
        // Increment coupon count
        await supabase
          .from('coupons')
          .update({ times_used: couponData.times_used + 1 })
          .eq('id', couponData.id);
      }
    }

    // Insert order entry
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        status: 'pending',
        total_amount: total,
        coupon_id: coupon_db_id,
        shipping_name: shipping.name,
        shipping_email: shipping.email,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_pincode: shipping.pincode,
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error('Error recording order in database:', orderError);
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
    }

    const orderId = orderData.id;

    // Insert order items & decrement inventory
    for (const item of items) {
      // 1. Insert order item
      await supabase.from('order_items').insert({
        order_id: orderId,
        product_id: item.productId,
        size: item.size,
        quantity: item.quantity,
        price: item.discountPrice || item.price,
      });

      // 2. Decrement inventory stock
      // Retrieve current quantity
      const { data: invData } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.productId)
        .eq('size', item.size)
        .single();
      
      if (invData) {
        const newQty = Math.max(0, invData.quantity - item.quantity);
        await supabase
          .from('inventory')
          .update({ quantity: newQty })
          .eq('product_id', item.productId)
          .eq('size', item.size);
      }
    }

    // Insert payment record
    await supabase.from('payments').insert({
      order_id: orderId,
      provider: isCod ? 'cod' : 'razorpay',
      transaction_id: razorpay_payment_id,
      signature: razorpay_signature || 'cod_signature',
      amount: total,
      status: isCod ? 'pending' : 'success',
    });

    // Mock send confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shipping.email,
          name: shipping.name,
          orderId,
          total,
        }),
      });
    } catch (e) {
      console.error('Error calling mock email handler:', e);
    }

    return NextResponse.json({
      message: 'Payment verified & order recorded successfully',
      orderId,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Signature verification failed' },
      { status: 500 }
    );
  }
}
