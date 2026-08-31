import { NextResponse } from 'next/server';
import { checkServiceability, estimatePackage, NimbusPostError } from '@/lib/nimbuspost';

// Safe to call from the browser (checkout page, as the customer types
// their pincode) — used only to gate checkout on real deliverability.
// The shipping charge itself is a flat store-set fee (FLAT_SHIPPING_FEE_RUPEES),
// not derived from NimbusPost's rate quote, so this deliberately doesn't
// return or use the pricing part of NimbusPost's response.
export async function POST(request: Request) {
  try {
    const { pincode, paymentMode, itemQuantity, orderValueRupees } = await request.json();

    if (!pincode || !/^\d{6}$/.test(String(pincode))) {
      return NextResponse.json({ error: 'Enter a valid 6-digit pincode.' }, { status: 400 });
    }
    if (paymentMode !== 'cod' && paymentMode !== 'prepaid') {
      return NextResponse.json({ error: 'paymentMode must be "cod" or "prepaid".' }, { status: 400 });
    }

    const { weightKg, length, width, height } = estimatePackage(Number(itemQuantity) || 1);

    // NimbusPost's live API rejects every serviceability call without an
    // order value, prepaid included, regardless of what their docs say —
    // fall back to a nominal ₹1 so a caller that genuinely doesn't know
    // the cart value yet (e.g. checking a pincode before adding an item)
    // still gets a real serviceable/not-serviceable answer, just without
    // a fully accurate COD-charge figure.
    const orderValuePaise = Math.round((Number(orderValueRupees) || 1) * 100);

    const result = await checkServiceability({
      deliveryPincode: String(pincode),
      paymentMode,
      packages: [{ weight: Math.round(weightKg * 1000), length, width, height }],
      orderValuePaise,
    });

    return NextResponse.json({ serviceable: result.available.length > 0 });
  } catch (err) {
    if (err instanceof NimbusPostError) {
      return NextResponse.json({ error: err.message }, { status: err.status || 502 });
    }
    console.error('Serviceability check failed:', err);
    return NextResponse.json({ error: 'Could not check serviceability right now.' }, { status: 502 });
  }
}
