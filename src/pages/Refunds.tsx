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

      <h2>3. Delays and inability to fulfill</h2>
      <p>If Verifiedly cannot provide a material paid Membership benefit and no reasonable replacement is available, we will review an appropriate partial or full Membership refund based on the circumstances and applicable law.</p>

      <h2>4. Duplicate, unauthorized, or unrecognized charges</h2>
      <p>Contact us promptly with the account email and approximate charge date. Do not email a government ID, selfie, complete payment-card number, password, or authentication code.</p>

      <h2>5. How to request review</h2>
      <p>Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with the account email, charge or card-claim date, and reason. Verifiedly is operated by BrownGlobal Holdings LLC. Approved refunds return to the original payment method, and processing time depends on Stripe, the card network, and the financial institution.</p>
    </div>
  </div>
);

export default Refunds;
