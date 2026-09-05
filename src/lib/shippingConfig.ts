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

// Matches the "FREE SHIPPING ... ABOVE ₹1499" copy advertised in the
// Navbar banner, FAQ, and Terms/Payment Policy pages — this is the one
// place that number lives, so cart, checkout, and order placement all
// agree on it.
export const FREE_SHIPPING_THRESHOLD_RUPEES = 1499;

// Shared by CartContext (cart/drawer display) and the checkout pages so
// they never disagree about whether an order qualifies for free
// shipping. subtotalRupees should be the pre-discount item subtotal —
// the threshold is based on what's in the basket, not what the coupon
// leaves you paying.
export function getShippingFeeRupees(subtotalRupees: number): number {
  if (subtotalRupees <= 0) return 0;
  return subtotalRupees >= FREE_SHIPPING_THRESHOLD_RUPEES ? 0 : FLAT_SHIPPING_FEE_RUPEES;
}
