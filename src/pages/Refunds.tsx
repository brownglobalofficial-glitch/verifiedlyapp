import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Refunds = () => (
  <div className="min-h-screen overflow-x-hidden bg-background px-4 py-12">
    <Helmet>
      <title>Refund Policy — Verifiedly</title>
      <meta name="description" content="Refund information for Verifiedly Pro and personalized Verifiedly Tap Card pre-orders." />
      <link rel="canonical" href="https://verifiedly.app/refunds" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl break-words dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 27, 2026</em></p>

      <h2>1. Verifiedly Pro</h2>
      <p>Verifiedly Pro is currently offered at $4.99 monthly or $49.99 yearly and renews automatically until canceled. You can cancel through the Stripe billing portal. Cancellation normally prevents the next renewal while access continues through the current paid period.</p>
      <p>Subscription charges are generally non-refundable and are not prorated for unused time, except where required by applicable law or where we determine that a duplicate charge, unauthorized charge, or material Verifiedly service failure occurred.</p>

      <h2>2. Identity-verification access through Pro</h2>
      <p>Verifiedly does not charge a separate $9.99 identity-verification fee. Eligible adults with active Pro may access the Stripe Identity flow. A Pro payment does not guarantee successful identity verification or a verification check.</p>
      <p>An unsuccessful, incomplete, expired, or additional-information result from Stripe Identity does not by itself make the Pro subscription refundable because Pro also includes other subscription benefits. Where a Verifiedly system error prevents access to the paid Pro service, contact us for review.</p>

      <h2>3. Personalized Verifiedly Tap Card pre-orders</h2>
      <p>A Tap Card pre-order is charged when Stripe Checkout confirms payment. It is then placed in Verifiedly's manual review and supplier-fulfillment queue. A paid pre-order is not the same as a shipped order.</p>
      <p>Tap Cards are personalized using the name, title, handle, QR link, NFC link, and shipping details approved before checkout. Review the preview, estimated shipping window, and address carefully before paying.</p>
      <p>Contact us immediately to request a correction or cancellation. We may be able to cancel and refund a pre-order that has not been submitted to the manufacturer, subject to payment-processing status and applicable law. Once the order has been submitted for proofing, printing, encoding, or production, personalized card charges are generally non-refundable and changes may require a replacement purchase, except where required by law.</p>
      <p>If Verifiedly cannot ship within the estimated window shown before payment, we may provide a revised shipping date and ask you to accept the delay, or we may cancel the pre-order and issue an appropriate refund. Where applicable law requires cancellation or a refund because you do not consent to a delay, we will follow those requirements.</p>
      <p>If Verifiedly cannot submit or fulfill the pre-order, or if the pre-order is canceled by Verifiedly before production, we will provide an appropriate refund to the original payment method. Processing time after a refund is issued depends on Stripe, the card network, and the customer's financial institution.</p>
      <p>If a card arrives damaged, has a manufacturing defect, or does not match the approved print information because of a Verifiedly or supplier error, contact us promptly with the order email and clear photos of the issue. We may provide a replacement or refund after review. Normal wear, customer-approved spelling or title choices, later profile changes, lost cards, and damage after delivery are not manufacturing defects.</p>
      <p>Shipping charges, taxes, expedited services, customs charges, and address-correction costs are refundable only where required by law or where the related service was not provided because of our error. Lost or delayed shipments are reviewed using the carrier's tracking information and claims process.</p>

      <h2>4. Duplicate, unauthorized, or unrecognized charges</h2>
      <p>Contact us promptly with the email on the account and approximate charge date. Include only non-sensitive transaction details. Do not email an ID image, selfie, complete card number, password, or authentication code.</p>

      <h2>5. How to request review</h2>
      <p>Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with the account email, product or order name, charge date, and reason. For a Tap Card issue, include the order number and non-sensitive photos where relevant. Verifiedly is operated by BrownGlobal Holdings LLC.</p>
    </div>
  </div>
);

export default Refunds;