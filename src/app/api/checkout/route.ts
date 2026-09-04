import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid checkout amount' }, { status: 400 });
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured.');
      return NextResponse.json({ error: 'Payments are not configured right now. Please try again later.' }, { status: 500 });
    }

    const instance = new Razorpay({ key_id, key_secret });

    const options = {
      amount: Math.round(amount * 100), // Razorpay operates in paise (1 INR = 100 paise)
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
