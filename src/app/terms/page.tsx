import LegalPageLayout, { LegalSection } from '@/components/LegalPageLayout';

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: (
      <p>
        By accessing or placing an order on arviik.in (&quot;ARVIIK&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be
        bound by these Terms &amp; Conditions, our{' '}
        <a href="/privacy-policy">Privacy Policy</a>, <a href="/refund-policy">Refund Policy</a>, and{' '}
        <a href="/payment-policy">Payment Policy</a>. If you don&apos;t agree with any part of these terms, please
        don&apos;t use the site or place an order.
      </p>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    body: (
      <p>
        You must be at least 18 years old, or placing an order under the supervision of a parent or legal
        guardian, to use this site and make purchases. By ordering, you confirm the information you provide
        (name, address, contact details) is accurate and belongs to you.
      </p>
    ),
  },
  {
    id: 'products',
    title: 'Products & Pricing',
    body: (
      <>
        <p>
          All products are described as accurately as possible, but slight variations in colour, print
          placement, or fabric texture may occur between what&apos;s shown on screen and the physical piece —
          this is normal for garment-dyed and screen-printed apparel, not a defect.
        </p>
        <ul>
          <li>Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
          <li>We reserve the right to change prices, run promotions, or discontinue products at any time without prior notice.</li>
          <li>
            <strong>Limited Edition</strong>{' '}pieces don&apos;t restock once sold out — availability shown at
            checkout is final.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Order Acceptance & Cancellation',
    body: (
      <>
        <p>
          Placing an order is an offer to buy — we confirm it once payment is verified (or, for Cash on
          Delivery, once the order is accepted). We reserve the right to cancel or refuse any order for
          reasons including but not limited to: stock unavailability, pricing errors, suspected fraud, or an
          undeliverable address.
        </p>
        <p>
          Orders can be changed or cancelled free of charge within 2 hours of placing them, before they&apos;re
          handed off for packing — contact <a href="mailto:support@arviik.com">support@arviik.com</a>{' '}with your
          order number immediately. Once an order has shipped, it can no longer be cancelled; you&apos;re welcome
          to return it instead under our <a href="/refund-policy">Refund Policy</a>.
        </p>
      </>
    ),
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    body: (
      <>
        <p>
          We currently ship only within India. Orders are typically dispatched within 24–48 hours and
          delivered in 3–5 business days depending on your pincode; remote areas may take longer. Delivery
          timelines are estimates, not guarantees — delays caused by our courier partners, weather, or events
          outside our control aren&apos;t our liability.
        </p>
        <p>
          A flat shipping fee applies at checkout, waived automatically on prepaid orders above ₹1,499. Cash
          on Delivery orders carry an additional flat COD handling fee. Full details are in our{' '}
          <a href="/payment-policy">Payment Policy</a>.
        </p>
      </>
    ),
  },
  {
    id: 'account',
    title: 'Account & Conduct',
    body: (
      <>
        <p>
          You&apos;re responsible for keeping your account credentials confidential and for all activity under
          your account. Let us know immediately at <a href="mailto:support@arviik.com">support@arviik.com</a>{' '}if
          you suspect unauthorised access.
        </p>
        <p>You agree not to:</p>
        <ul>
          <li>Use the site for any unlawful purpose or in violation of any applicable law.</li>
          <li>Attempt to interfere with, hack, or disrupt the site, its servers, or its security.</li>
          <li>Place orders using fraudulent payment information or on behalf of someone without authorisation.</li>
          <li>Scrape, resell, or republish site content (including product photography and copy) without permission.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    body: (
      <p>
        All content on this site — the ARVIIK name and logo, product designs, graphics, photography, and
        written copy — is the property of ARVIIK or its licensors, protected under applicable copyright and
        trademark law. Nothing here grants you a licence to reproduce, distribute, or create derivative works
        from it without our prior written consent.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    body: (
      <p>
        ARVIIK is not liable for any indirect, incidental, or consequential damages arising from your use of
        the site or your purchase of our products, to the fullest extent permitted by law. Our total liability
        for any claim relating to an order is limited to the amount you paid for that order.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing Law',
    body: (
      <p>
        These Terms are governed by the laws of India. Any disputes arising from your use of this site or a
        purchase made on it are subject to the exclusive jurisdiction of the courts of Ahmedabad, Gujarat.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    body: (
      <p>
        We may update these Terms from time to time to reflect changes in our practices or for legal reasons.
        The &quot;Last updated&quot; date at the top of this page always reflects the current version — continued use
        of the site after a change means you accept the updated Terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: (
      <p>
        Questions about these Terms? Reach us at{' '}
        <a href="mailto:support@arviik.com">support@arviik.com</a> or through our{' '}
        <a href="/contact">Contact page</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="The Fine Print"
      title="Terms & Conditions"
      intro="The rules for using arviik.in and buying from us — written to actually be read, not just scrolled past."
      lastUpdated="September 5, 2026"
      sections={SECTIONS}
    />
  );
}
