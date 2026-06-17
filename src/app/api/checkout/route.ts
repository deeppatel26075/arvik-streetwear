import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabase';

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

    const isLive = paymentConfig.payment_mode === 'live';
    const key_id = isLive
      ? (paymentConfig.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123')
      : 'rzp_test_mockkeyid123';
    const key_secret = isLive
      ? (paymentConfig.key_secret || process.env.RAZORPAY_KEY_SECRET || 'mockkeysecret456')
      : 'mockkeysecret456';

    if (!isLive) {
      // Demo simulation mode - Return mock order object instantly
      return NextResponse.json({
        id: `order_mock_${Math.floor(100000 + Math.random() * 900000)}`,
        amount: Math.round(amount * 100),
        currency,
        receipt: `receipt_order_${Date.now()}`,
        status: 'created',
        isMock: true
      });
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
