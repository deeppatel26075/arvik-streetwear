// Deliberately tiny and side-effect-free (no Node built-ins, no env
// reads) so it's safe to import from both client components (checkout
// pages) and server code (/api/orders/place) without pulling
// server-only code like src/lib/nimbuspost.ts into the browser bundle.

// The customer-facing shipping charge is a flat store policy, not
// derived from NimbusPost's per-courier rate quote — what NimbusPost
// actually bills the store for booking a shipment can differ from this;
// that's normal margin, not a bug. NimbusPost is used only to check
// real deliverability (see src/lib/nimbuspost.ts), never to price it.
export const FLAT_SHIPPING_FEE_RUPEES = 100;

// Applied on top of FLAT_SHIPPING_FEE_RUPEES for every COD order,
// regardless of pincode or courier — a flat store policy, same as the
// shipping fee itself.
export const FLAT_COD_FEE_RUPEES = 50;
