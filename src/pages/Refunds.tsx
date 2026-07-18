import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Refunds = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Refund Policy — Verifiedly</title>
      <meta name="description" content="Refund information for Verifiedly Identity and Verifiedly Documents." />
      <link rel="canonical" href="https://verifiedly.app/refunds" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 18, 2026</em></p>

      <h2>1. Verifiedly Identity</h2>
      <p>Verifiedly Identity costs $9.99 once and includes an initial check and, when available, one retry. The charge pays for access to the verification service and related processing; it does not guarantee approval.</p>
      <p>After an identity check has begun, the charge is generally non-refundable if Stripe requires clearer information, the submitted information cannot be verified, or the result is unsuccessful. If payment succeeds but a Verifiedly system error prevents any Stripe Identity session from being created, contact us for review. We will provide refunds where required by applicable law.</p>

      <h2>2. Verifiedly Documents</h2>
      <p>Documents subscriptions are $4.99 monthly or $39 annually and renew until canceled. You can cancel through the Stripe billing portal. Cancellation normally prevents the next renewal while access continues through the current paid period.</p>
      <p>Subscription charges are generally non-refundable and are not prorated for unused time, except where required by law or where we determine that a duplicate charge or material service failure occurred.</p>

      <h2>3. Duplicate, unauthorized, or unrecognized charges</h2>
      <p>Contact us promptly with the email on the account and approximate charge date. Include only non-sensitive transaction details. Do not email an ID image, selfie, complete card number, password, or authentication code.</p>

      <h2>4. How to request review</h2>
      <p>Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with the account email, product name, charge date, and reason. Operated by BrownGlobal Holdings LLC.</p>
    </div>
  </div>
);

export default Refunds;
