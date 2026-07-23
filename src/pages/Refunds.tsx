import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Refunds = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Refund Policy — Verifiedly</title>
      <meta name="description" content="Refund information for Verifiedly Pro subscriptions and personalized NFC Tap Cards." />
      <link rel="canonical" href="https://verifiedly.app/refunds" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 23, 2026</em></p>

      <h2>1. Verifiedly Pro</h2>
      <p>Verifiedly Pro renews monthly or annually until canceled. You can manage or cancel through the Stripe billing portal. Cancellation normally prevents the next renewal while access continues through the current paid period.</p>
      <p>Subscription charges are generally non-refundable and are not prorated for unused time, except where required by applicable law or where we determine that a duplicate charge or material Verifiedly service failure occurred. Paying for Pro does not guarantee successful identity verification or a badge.</p>

      <h2>2. Identity verification</h2>
      <p>Identity verification is a feature available to eligible Pro users. Stripe may require additional images or information, or may be unable to verify a submission. An unsuccessful, incomplete, unavailable, or reversed identity result does not automatically make the Pro subscription refundable because Pro also includes other account, support, analytics, and Tap Card benefits.</p>
      <p>Where a Verifiedly system error prevents an eligible active Pro user from starting any verification session, contact support for technical review and a reasonable remedy. We provide refunds or other remedies where required by law.</p>

      <h2>3. Personalized Tap Cards</h2>
      <p>Tap Card ordering remains closed until supplier samples and fulfillment are approved. Once ordering opens, the final card design, material, price, shipping charge, production estimate, and available destination will be shown before payment.</p>
      <p>Because Tap Cards are personalized and programmed for a specific profile, an order generally cannot be canceled or changed after it enters production. Personalized cards are generally not returnable for preference changes, outdated user-entered text, a changed handle, or a decision not to use the card, except where required by law.</p>
      <p>Contact support promptly if the wrong card was delivered, the printing materially differs from the approved preview, the NFC or QR link is incorrectly programmed, the card arrives damaged, or a verified fulfillment error occurred. We may replace, reprogram, reprint, or refund the affected item after review. Normal wear, device-specific NFC positioning, disabled phone NFC, and damage caused after delivery may not qualify.</p>
      <p>Shipping charges are generally non-refundable after shipment. A carrier delay does not automatically qualify for a refund, but Verifiedly will assist with tracking and claims where reasonably available. Metal-card availability remains subject to sample and NFC-performance approval.</p>

      <h2>4. Annual Tap Card credit</h2>
      <p>A promotional PVC Tap Card credit included with an annual Pro plan has no cash value and cannot be exchanged for a cash refund. Shipping, metal upgrades, replacements, and other disclosed charges remain separate. If the annual subscription payment is reversed, refunded, disputed, fraudulent, or otherwise invalid, the unused credit may be removed and a fulfilled card may be considered when determining any refund.</p>

      <h2>5. Duplicate, unauthorized, or unrecognized charges</h2>
      <p>Contact us promptly with the email on the account and approximate charge date. Include only non-sensitive transaction details. Do not email an ID image, selfie, complete card number, password, Social Security number, or authentication code.</p>

      <h2>6. How to request review</h2>
      <p>Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> or submit a dashboard support ticket with the account email, product or order, charge date, and reason. Verifiedly is operated by BrownGlobal Holdings LLC.</p>
    </div>
  </div>
);

export default Refunds;
