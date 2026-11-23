import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/LegalPageLayout';
import { formatPrice } from '@/lib/utils';
import {
  FLAT_SHIPPING_FEE_RUPEES,
  FLAT_COD_FEE_RUPEES,
  FREE_SHIPPING_THRESHOLD_RUPEES,
} from '@/lib/shippingConfig';

export const metadata: Metadata = {
  title: 'Shipping Policy | ARVIIK',
  description: 'Where we ship, what it costs, and how long delivery takes for ARVIIK orders across India.',
};

// Fees come straight from lib/shippingConfig — the same numbers cart,
// checkout and order placement use — so this page can never drift from
// what customers are actually charged.
const shippingFee = formatPrice(FLAT_SHIPPING_FEE_RUPEES);
const codFee = formatPrice(FLAT_COD_FEE_RUPEES);
const freeAbove = formatPrice(FREE_SHIPPING_THRESHOLD_RUPEES);

const SECTIONS: LegalSection[] = [
  {
    id: 'where',
    title: 'Where We Ship',
    body: (
      <p>
        We currently ship only within <strong>India</strong>. Your pincode is checked at checkout, so
        you&apos;ll know before you pay if our courier partners can&apos;t deliver to your address.
      </p>
    ),
  },
  {
    id: 'charges',
    title: 'Shipping Charges',
    body: (
      <>
        <ul>
          <li>
            Orders of <strong>{freeAbove} and above</strong>: <strong>free shipping</strong>.
          </li>
          <li>
            Orders below {freeAbove}: a flat shipping fee of <strong>{shippingFee}</strong>.
          </li>
          <li>
            <strong>Cash on Delivery</strong> orders carry an additional flat COD handling fee of{' '}
            <strong>{codFee}</strong>, on top of any shipping fee.
          </li>
        </ul>
        <p>
          The free-shipping threshold is based on your cart value before any coupon discount. Every charge
          is shown clearly at checkout before you place your order.
        </p>
      </>
    ),
  },
  {
    id: 'timelines',
    title: 'Dispatch & Delivery Times',
    body: (
      <p>
        Orders are typically dispatched within <strong>24–48 hours</strong> and delivered in{' '}
        <strong>3–5 business days</strong> depending on your pincode. Remote areas may take a little longer.
        Delivery timelines are estimates, not guarantees: delays caused by courier partners, weather, or
        events outside our control can happen.
      </p>
    ),
  },
  {
    id: 'tracking',
    title: 'Tracking Your Order',
    body: (
      <p>
        You can follow every stage of your order (confirmed, processing, shipped, delivered) on our{' '}
        <a href="/track-order">Track Order</a> page after logging in to your account.
      </p>
    ),
  },
  {
    id: 'damaged',
    title: 'Damaged or Wrong Item',
    body: (
      <p>
        If your order arrives damaged, defective, or isn&apos;t what you ordered, contact us within{' '}
        <strong>48 hours of delivery</strong>. We&apos;ll send a free replacement; see our{' '}
        <a href="/refund-policy">Exchange Policy</a> for details.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Questions About Delivery?',
    body: (
      <p>
        If your order is taking longer than expected, email <a href="mailto:info@arviik.in">info@arviik.in</a>{' '}
        with your order number, or reach us through our <a href="/contact">Contact page</a>.
      </p>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Shipping & Delivery"
      title="Shipping Policy"
      intro="Where we ship, what it costs, and when your order will arrive."
      lastUpdated="November 24, 2026"
      sections={SECTIONS}
    />
  );
}
