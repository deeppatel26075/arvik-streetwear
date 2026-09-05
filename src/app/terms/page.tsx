import LegalPageLayout, { LegalSection } from '@/components/LegalPageLayout';

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>
          This website, arviik.in (the &quot;Site&quot;), is operated by <strong>ARVIIK</strong> (&quot;ARVIIK&quot;,
          &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). Throughout the Site, these terms refer to ARVIIK. ARVIIK offers
          this website, including all information, tools, and services available from this Site to you, the
          user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
        </p>
        <p>
          By visiting our Site and/or purchasing something from us, you engage in our &quot;Service&quot; and agree
          to be bound by the following terms and conditions (&quot;Terms of Service&quot;, &quot;Terms&quot;), including
          those additional terms and conditions and policies referenced herein and/or available by
          hyperlink — our <a href="/privacy-policy">Privacy Policy</a>,{' '}
          <a href="/refund-policy">Refund Policy</a>, and <a href="/payment-policy">Payment Policy</a>. These
          Terms apply to all users of the Site, including without limitation users who are browsers, vendors,
          customers, and contributors of content.
        </p>
        <p>
          Please read these Terms of Service carefully before accessing or using our Site. By accessing or
          using any part of the Site, you agree to be bound by these Terms. If you do not agree to all the
          terms and conditions of this agreement, you may not access the Site or use any of its services.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'General Conditions',
    body: (
      <>
        <p>
          You must be at least 18 years of age, or placing an order under the supervision of a parent or
          legal guardian, to use this Site and make purchases. We reserve the right to refuse Service to
          anyone, for any reason, at any time.
        </p>
        <p>
          You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service
          without express written permission from us.
        </p>
      </>
    ),
  },
  {
    id: 'accuracy',
    title: 'Accuracy of Information',
    body: (
      <p>
        We are not responsible if information made available on this Site is not accurate, complete, or
        current. The material on this Site is provided for general information only and should not be
        relied upon or used as the sole basis for making decisions without consulting primary, more
        accurate, more complete, or more timely sources of information. Any reliance on the material on
        this Site is at your own risk.
      </p>
    ),
  },
  {
    id: 'modifications',
    title: 'Modifications to the Service and Prices',
    body: (
      <>
        <p>Prices for our products are subject to change without notice.</p>
        <p>
          We reserve the right at any time to modify or discontinue the Service (or any part or content
          thereof) without notice at any time. We shall not be liable to you or to any third party for any
          modification, price change, suspension, or discontinuance of the Service.
        </p>
      </>
    ),
  },
  {
    id: 'products',
    title: 'Products or Services',
    body: (
      <>
        <p>
          Certain products or services may be available exclusively online through the Site. These products
          or services may have limited quantities and are subject to return or exchange only according to
          our <a href="/refund-policy">Refund Policy</a>.
        </p>
        <p>
          We have made every effort to display as accurately as possible the colours and images of our
          products. We cannot guarantee that your device&apos;s display of any colour will be accurate — slight
          variations in colour, print placement, or fabric texture may occur between what&apos;s shown on
          screen and the physical piece, which is normal for garment-dyed and screen-printed apparel and
          not a defect.
        </p>
        <p>
          We reserve the right, but are not obligated, to limit the sales of our products or services to any
          person, geographic region, or jurisdiction, and to discontinue any product at any time. All
          descriptions of products or product pricing are subject to change at any time without notice, at
          our sole discretion. <strong>Limited Edition</strong>{' '}pieces do not restock once sold out —
          availability shown at checkout is final.
        </p>
      </>
    ),
  },
  {
    id: 'billing',
    title: 'Accuracy of Billing and Account Information',
    body: (
      <p>
        We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or
        cancel quantities purchased per person, per household, or per order — including orders placed under
        the same account, the same payment method, and/or orders that use the same billing/shipping address.
        You agree to provide current, complete, and accurate purchase and account information for all
        purchases made on our Site, and to promptly update your account and other information so that we can
        complete your transactions and contact you as needed.
      </p>
    ),
  },
  {
    id: 'links',
    title: 'Third-Party Links',
    body: (
      <p>
        Certain content, products, and services available via our Service may include materials from
        third parties. Third-party links on this Site may direct you to third-party websites that are not
        affiliated with us. We are not responsible for examining or evaluating the content or accuracy of
        such websites, and we do not warrant and will not have any liability for any third-party materials
        or websites, or for any other materials, products, or services of third parties.
      </p>
    ),
  },
  {
    id: 'orders',
    title: 'Order Cancellation & Exchange Policy',
    body: (
      <>
        <p>
          Placing an order is an offer to buy — we confirm it once payment is verified (or, for Cash on
          Delivery, once the order is accepted). We reserve the right to cancel or refuse any order for
          reasons including but not limited to: stock unavailability, pricing or typographical errors,
          suspected fraud, or an undeliverable address.
        </p>
        <p className="pt-1"><strong>Order Cancellation</strong></p>
        <ul>
          <li>
            Once an order is placed, you can cancel it within 2 hours of order confirmation by contacting us
            at <a href="mailto:support@arviik.com">support@arviik.com</a>{' '}with your order number.
          </li>
          <li>After 2 hours, the order cannot be cancelled or refunded.</li>
        </ul>
        <p className="pt-1"><strong>Exchange Policy</strong></p>
        <ul>
          <li>We offer an exchange instead of a refund for eligible products.</li>
          <li>
            If you receive a product that is eligible for exchange, you must contact us within the specified
            exchange period and provide your order number and reason for the exchange.
          </li>
          <li>
            Once your exchange request is approved, the replacement item will be processed and delivered
            within 7–10 working days, depending on availability and your delivery location.
          </li>
          <li>
            The product must be unused, unwashed, undamaged, and in its original condition with all tags and
            packaging intact. Products that do not meet these conditions may not be accepted for exchange.
          </li>
        </ul>
        <p className="pt-1">
          <strong>Important:</strong>{' '}We do not provide refunds after the 2-hour cancellation period.
          Exchanges are subject to our exchange conditions and product availability. For exchange requests,
          contact <a href="mailto:support@arviik.com">support@arviik.com</a>.
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
          outside our control are not our liability.
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
    id: 'prohibited',
    title: 'Prohibited Uses',
    body: (
      <>
        <p>In addition to other prohibitions set forth in these Terms, you are prohibited from using the Site or its content:</p>
        <ul>
          <li>For any unlawful purpose, or to solicit others to perform or participate in any unlawful acts.</li>
          <li>To violate any applicable international, national, or state regulations, rules, or laws.</li>
          <li>To submit false or misleading information, or to interfere with or circumvent the security features of the Service.</li>
          <li>To place orders using fraudulent payment information, or on behalf of someone without authorisation.</li>
          <li>To scrape, resell, or republish site content (including product photography and copy) without permission.</li>
        </ul>
        <p>We reserve the right to terminate your use of the Service for violating any of these prohibited uses.</p>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    body: (
      <p>
        All content on this Site — the ARVIIK name and logo, product designs, graphics, photography, and
        written copy — is the property of ARVIIK or its licensors, protected under applicable Indian
        copyright and trademark law. Nothing here grants you a licence to reproduce, distribute, or create
        derivative works from it without our prior written consent.
      </p>
    ),
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer of Warranties; Limitation of Liability',
    body: (
      <>
        <p>
          We do not guarantee, represent, or warrant that your use of our Service will be uninterrupted,
          timely, secure, or error-free. We do not warrant that the results that may be obtained from the use
          of the Service will be accurate or reliable.
        </p>
        <p>
          In no case shall ARVIIK, our directors, officers, employees, affiliates, or suppliers be liable for
          any indirect, incidental, punitive, special, or consequential damages of any kind arising from your
          use of the Service or any products procured using the Service. Our total liability for any claim
          relating to an order is limited to the amount you paid for that order.
        </p>
      </>
    ),
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    body: (
      <p>
        You agree to indemnify, defend, and hold harmless ARVIIK and our affiliates, officers, and employees
        from any claim or demand, including reasonable legal fees, made by any third party due to or arising
        out of your breach of these Terms of Service or the documents they incorporate by reference, or your
        violation of any law or the rights of a third party.
      </p>
    ),
  },
  {
    id: 'severability',
    title: 'Severability',
    body: (
      <p>
        In the event that any provision of these Terms of Service is determined to be unlawful, void, or
        unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by
        applicable law, and the unenforceable portion shall be deemed to be severed from these Terms, without
        affecting the validity and enforceability of the remaining provisions.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing Law',
    body: (
      <p>
        These Terms of Service and any separate agreements whereby we provide you Services shall be governed
        by and construed in accordance with the laws of India. Any disputes arising from your use of this
        Site or a purchase made on it are subject to the exclusive jurisdiction of the courts of Ahmedabad,
        Gujarat.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    body: (
      <p>
        You can review the most current version of the Terms of Service at any time on this page. We reserve
        the right, at our sole discretion, to update, change, or replace any part of these Terms by posting
        updates to our Site. The &quot;Last updated&quot; date at the top of this page always reflects the current
        version — it is your responsibility to check this page periodically for changes. Continued use of the
        Site following any changes constitutes acceptance of those changes.
      </p>
    ),
  },
  {
    id: 'website-updates',
    title: 'Website Updates & Technical Changes',
    body: (
      <>
        <p>
          ARVIIK may update, modify, or change its policies, information, pricing, offers, or other website
          content from time to time. Due to technical, maintenance, or IT-related issues, there may be a
          delay before such changes are reflected on the Website.
        </p>
        <p>
          In such cases, ARVIIK will make reasonable efforts to update the Website as soon as possible.
          Temporary discrepancies caused by technical or IT-related delays shall not, by themselves, be
          considered a change in ARVIIK&apos;s applicable policy or terms.
        </p>
        <p>
          The latest policy or terms communicated and confirmed by ARVIIK shall apply to the relevant order
          or request, subject to applicable law.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Information',
    body: (
      <p>
        Questions about these Terms of Service should be sent to us at{' '}
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
