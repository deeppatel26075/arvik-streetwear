// Server-only client for NimbusPost's Partner API v2
// (https://api-v2.nimbuspost.com/docs/reference/v2). Never import this
// from a client component — NIMBUSPOST_API_SECRET must stay server-side.
//
// Used only for pincode serviceability checks — deciding whether an
// address is deliverable (and, separately, COD-eligible) before letting
// checkout proceed. Shipments are booked manually by the store on
// NimbusPost's own dashboard, not through this app, so there's no
// booking/tracking/webhook code here.

const BASE_URL = 'https://api-v2.nimbuspost.com';

export class NimbusPostError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'NimbusPostError';
    this.code = code;
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  const key = process.env.NIMBUSPOST_API_KEY;
  const secret = process.env.NIMBUSPOST_API_SECRET;
  if (!key || !secret) {
    throw new Error('NimbusPost is not configured — set NIMBUSPOST_API_KEY and NIMBUSPOST_API_SECRET.');
  }
  return {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'x-api-secret': secret,
  };
}

async function nimbusRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.method || 'GET',
    headers: authHeaders(),
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!json || json.success !== true) {
    const err = json?.error;
    throw new NimbusPostError(
      err?.detail || `NimbusPost request to ${path} failed (${res.status}).`,
      err?.code || 'UNKNOWN_ERROR',
      err?.status || res.status
    );
  }

  return json.data as T;
}

// ── Serviceability ──────────────────────────────────────────────────────

export interface ServiceabilityPackage {
  weight: number; // grams
  length: number; // cm
  width: number; // cm
  height: number; // cm
}

export interface CourierRate {
  courierId: string;
  courierName: string;
  courierType: string;
  zone: string;
  tatDays: number;
  result: {
    chargeableGrams: number;
    shippingChargesPaise: number;
    codChargesPaise: number;
    totalPaise: number;
  };
}

export interface ServiceabilityResult {
  pickupPincode: string;
  deliveryPincode: string;
  paymentMode: 'cod' | 'prepaid';
  totalChargeableGrams: number;
  available: CourierRate[];
  excluded: { courierId: string; reason: string }[];
}

export async function checkServiceability(params: {
  deliveryPincode: string;
  paymentMode: 'cod' | 'prepaid';
  packages: ServiceabilityPackage[];
  orderValuePaise: number;
}): Promise<ServiceabilityResult> {
  const pickupPincode = process.env.NIMBUSPOST_PICKUP_PINCODE;
  if (!pickupPincode) {
    throw new Error('NIMBUSPOST_PICKUP_PINCODE is not set.');
  }

  return nimbusRequest<ServiceabilityResult>('/v2/serviceability', {
    method: 'POST',
    body: {
      pickupPincode,
      deliveryPincode: params.deliveryPincode,
      paymentMode: params.paymentMode,
      packages: params.packages,
      // Despite the docs describing this as "required for COD" (implying
      // optional for prepaid), the live API rejects every call — prepaid
      // included — with "Order Value: Must be a valid number" if it's
      // omitted. Confirmed directly against the real API, not assumed.
      orderValuePaise: params.orderValuePaise,
    },
  });
}

// Products don't carry real weight/dimension data yet (no such columns
// on `products`), so this is a documented, apparel-appropriate estimate
// rather than fabricated per-product data — used only to size the
// serviceability check's package, since NimbusPost's rate calculator
// needs *some* weight/dimensions even though the rate itself is ignored
// (shipping is a flat store fee — see src/lib/shippingConfig.ts).
export const ESTIMATED_ITEM_WEIGHT_KG = 0.25; // ~250g per oversized tee, packaged
export const ESTIMATED_PACKAGE_DIMENSIONS_CM = { length: 30, width: 25, height: 4 };

export function estimatePackage(totalItemQuantity: number) {
  const weightKg = Math.max(0.1, totalItemQuantity * ESTIMATED_ITEM_WEIGHT_KG);
  return { weightKg, ...ESTIMATED_PACKAGE_DIMENSIONS_CM };
}
