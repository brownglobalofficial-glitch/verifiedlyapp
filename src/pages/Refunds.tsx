import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Refunds = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <Helmet>
      <title>Refund Policy — Verifiedly</title>
      <meta name="description" content="Refund policy for optional Verifiedly identity-verification attempts." />
      <link rel="canonical" href="https://verifiedly.app/refunds" />
      <meta property="og:title" content="Refund Policy — Verifiedly" />
      <meta property="og:description" content="Refund policy for optional Verifiedly identity-verification attempts." />
      <meta property="og:url" content="https://verifiedly.app/refunds" />
    </Helmet>
    <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 18, 2026</em></p>

      <h2>1. Free Profiles</h2>
      <p>Creating, completing, and sharing a Verifiedly profile is free, so there is no profile subscription charge to refund in this version.</p>

      <h2>2. Identity Verification Attempts</h2>
      <p>The current identity verification fee is <strong>$12.99 per attempt</strong>. It pays for an attempt to complete a government-ID and selfie check through Stripe Identity. Payment does not guarantee that Stripe will approve the check or that a badge will be issued.</p>
      <p>Once an identity check has been initiated, the fee is generally non-refundable because the third-party verification service has been used. This does not limit refund rights that cannot be waived under applicable law.</p>

      <h2>3. Before a Check Starts</h2>
      <p>If you paid but did not begin the identity check, contact <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with the email on your account and the approximate payment date. We will review the payment status and whether the verification service was used.</p>

      <h2>4. Duplicate, Unauthorized, or Technical Charges</h2>
      <p>Contact us promptly if you believe you were charged more than once, did not authorize a charge, or could not access the identity check because of a Verifiedly or Stripe technical failure. Include only non-sensitive transaction details. Do not email an ID image, selfie, full card number, or password.</p>

      <h2>5. Processing</h2>
      <p>Approved refunds are returned to the original payment method. Banks and card networks control how long the credit takes to appear.</p>

      <h2>6. Contact</h2>
      <p>Refund questions: <a href="mailto:support@verifiedly.app">support@verifiedly.app</a><br />Operated by BrownGlobal Holdings LLC.</p>
    </div>
  </div>
);

export default Refunds;
