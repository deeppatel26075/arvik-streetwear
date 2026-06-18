import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid checkout amount' }, { status: 400 });
    }

    // Fetch settings from database
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
      console.warn('Failed to load database payment config, using defaults:', e);
    }

    const key_id = paymentConfig.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = paymentConfig.key_secret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: 'Razorpay configurations are missing. Please enter Key ID and Secret in settings.' },
        { status: 400 }
      );
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), // Razorpay operates in paise
      currency,
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error generating Razorpay Order ID:', error);
    return NextResponse.json(
      { error: error.message || 'Razorpay order creation failed' },
      { status: 500 }
    );
  }
}
