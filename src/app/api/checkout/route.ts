import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid checkout amount' }, { status: 400 });
    }

    // Deliberately NOT process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID here — Next.js
    // statically inlines NEXT_PUBLIC_* vars into the compiled output at BUILD
    // time, even inside server-only route handlers like this one. A stale
    // build (e.g. a "Redeploy" that reuses cached build output instead of
    // rebuilding) would keep using whatever Key ID was baked in at the last
    // real build, silently mismatched against a newer key_secret. A plain
    // server-only env var is read at actual runtime, every request.
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured.');
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
    // The Razorpay SDK throws errors shaped like { statusCode, error: { code, description } },
    // not a flat .message — surface the real reason instead of a generic string.
    const detail = error?.error?.description || error?.message || 'Razorpay order creation failed';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
