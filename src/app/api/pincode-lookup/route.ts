import { NextResponse } from 'next/server';

// Proxies India Post's public pincode API (api.postalpincode.in) — it
// has no CORS headers, so the browser can't call it directly. Used to
// auto-fill City/State on the checkout shipping form as the customer
// types their pincode. This is unrelated to NimbusPost (a different
// free public data source) and has nothing to do with deliverability —
// that's still checked separately via /api/nimbuspost/serviceability.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: 'Enter a valid 6-digit pincode.' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    const result = data?.[0];

    if (result?.Status !== 'Success' || !result.PostOffice?.length) {
      return NextResponse.json({ found: false });
    }

    const office = result.PostOffice[0];
    return NextResponse.json({
      found: true,
      city: office.District,
      state: office.State,
    });
  } catch (err) {
    console.error('Pincode lookup failed:', err);
    return NextResponse.json({ error: 'Could not look up this pincode right now.' }, { status: 502 });
  }
}
