import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Refunds = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Refund Policy — Verifiedly</title>
      <meta name="description" content="Refund information for Verifiedly Pro and personalized Verifiedly Tap Cards." />
      <link rel="canonical" href="https://verifiedly.app/refunds" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 24, 2026</em></p>

      <h2>1. Verifiedly Pro</h2>
      <p>Verifiedly Pro is currently offered at $4.99 monthly or $49.99 yearly and renews automatically until canceled. You can cancel through the Stripe billing portal. Cancellation normally prevents the next renewal while access continues through the current paid period.</p>
      <p>Subscription charges are generally non-refundable and are not prorated for unused time, except where required by applicable law or where we determine that a duplicate charge, unauthorized charge, or material Verifiedly service failure occurred.</p>

      <h2>2. Identity verification included with Pro</h2>
      <p>Verifiedly does not charge a separate $9.99 identity-verification fee. Eligible adults with active Pro may access the Stripe Identity flow. A Pro payment does not guarantee successful identity verification or a verification check.</p>
      <p>An unsuccessful, incomplete, expired, or additional-information result from Stripe Identity does not by itself make the Pro subscription refundable because Pro also includes other subscription benefits. Where a Verifiedly system error prevents access to the paid Pro service, contact us for review.</p>

      <h2>3. Personalized Verifiedly Tap Cards</h2>
      <p>Tap Cards are personalized using the name, title, handle, QR link, NFC link, and shipping details approved before checkout. Review the preview and address carefully before paying.</p>
      <p>Contact us immediately if you need to request a change or cancellation. We may be able to cancel an order that has not yet been submitted to the manufacturer. Once production has begun, personalized card charges are generally non-refundable and changes may require a replacement purchase, except where required by law.</p>
      <p>If a card arrives damaged, has a manufacturing defect, or does not match the print information approved because of a Verifiedly or supplier error, contact us promptly with the order email and clear photos of the issue. We may provide a replacement or refund after review. Normal wear, customer-approved spelling or title choices, later profile changes, lost cards, and damage after delivery are not manufacturing defects.</p>
      <p>Shipping charges, taxes, expedited services, customs charges, and address-correction costs are refundable only where required by law or where the related service was not provided because of our error. Lost or delayed shipments are reviewed using the carrier's tracking information and claims process.</p>

      <h2>4. Duplicate, unauthorized, or unrecognized charges</h2>
      <p>Contact us promptly with the email on the account and approximate charge date. Include only non-sensitive transaction details. Do not email an ID image, selfie, complete card number, password, or authentication code.</p>

      <h2>5. How to request review</h2>
      <p>Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with the account email, product or order name, charge date, and reason. For a Tap Card issue, include the order number and non-sensitive photos where relevant. Verifiedly is operated by BrownGlobal Holdings LLC.</p>
    </div>
  </div>
);

export default Refunds;
