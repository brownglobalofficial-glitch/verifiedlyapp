import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Refunds = () => (
  <div className="min-h-screen overflow-x-hidden bg-background px-4 py-12">
    <Helmet>
      <title>Refund Policy — Verifiedly</title>
      <meta name="description" content="Refund and cancellation information for the annual Verifiedly Membership and identity-verification access." />
      <link rel="canonical" href="https://verifiedly.app/refunds" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl break-words dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 30, 2026</em></p>

      <h2>1. Annual Verifiedly Membership</h2>
      <p>Verifiedly Membership is currently $50 per year and renews automatically until canceled. You can cancel future renewal through the Stripe billing portal. Cancellation normally prevents the next annual charge while access continues through the current paid term.</p>
      <p>Membership charges are generally non-refundable and are not prorated for unused time, except where required by law or where we determine that a duplicate charge, unauthorized charge, or material Verifiedly service failure occurred.</p>

      <h2>2. Identity-verification access</h2>
      <p>Stripe Identity verification is included for eligible adult members. The Identity Verified badge appears only after successful verification. An unsuccessful, incomplete, expired, or additional-information result does not by itself make the annual Membership refundable because Membership includes other benefits and does not guarantee a verification result.</p>

      <h2>3. Included first-term Tap Card</h2>
      <p>One personalized Tap Card is included with the first successfully paid annual Membership term only. Renewals do not include another card. The included card has no separate customer purchase price, but it is part of the Membership benefit package.</p>
      <p>Review the printed name, title, handle, shipping address, and estimated shipping window before claiming the card. Contact us immediately to request a correction or cancellation. We may be able to change or cancel a claim that has not entered manufacturer proofing, printing, encoding, or production.</p>
      <p>After supplier submission or production begins, customer-approved spelling, title, handle, and design choices generally cannot be changed without a new card. Replacement or additional cards are not automatically included.</p>

      <h2>4. Delays and inability to fulfill</h2>
      <p>A claimed card is not a shipped card, and the displayed shipping window is an estimate. If Verifiedly cannot ship within the stated estimate, we may provide a revised date and request consent, cancel the card fulfillment, or provide another remedy required by applicable law.</p>
      <p>If Verifiedly cannot provide a material paid Membership benefit and no reasonable replacement is available, we will review an appropriate partial or full Membership refund based on the circumstances and applicable law.</p>

      <h2>5. Defects, damage, and shipping issues</h2>
      <p>If a card arrives damaged, has a manufacturing defect, or does not match the approved print information because of a Verifiedly or supplier error, contact us promptly with the account email, order reference, and clear non-sensitive photos. We may provide a replacement or other appropriate remedy after review.</p>
      <p>Normal wear, later profile changes, customer-approved information, loss after delivery, and damage caused after delivery are not manufacturing defects. Carrier delays and lost shipments are reviewed using tracking information and the carrier's claims process.</p>

      <h2>6. Duplicate, unauthorized, or unrecognized charges</h2>
      <p>Contact us promptly with the account email and approximate charge date. Do not email a government ID, selfie, complete payment-card number, password, or authentication code.</p>

      <h2>7. How to request review</h2>
      <p>Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with the account email, charge or card-claim date, and reason. Verifiedly is operated by BrownGlobal Holdings LLC. Approved refunds return to the original payment method, and processing time depends on Stripe, the card network, and the financial institution.</p>
    </div>
  </div>
);

export default Refunds;
