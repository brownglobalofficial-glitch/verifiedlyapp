import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Refunds = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <Helmet>
      <title>Refund Policy — Verifiedly</title>
      <meta name="description" content="Current payment and refund information for Verifiedly." />
      <link rel="canonical" href="https://verifiedly.app/refunds" />
      <meta property="og:title" content="Refund Policy — Verifiedly" />
      <meta property="og:description" content="Current payment and refund information for Verifiedly." />
      <meta property="og:url" content="https://verifiedly.app/refunds" />
    </Helmet>
    <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 18, 2026</em></p>

      <h2>1. No Current Profile or Verification Charge</h2>
      <p>Verifiedly is not currently charging for profiles, subscriptions, or new verification checks. There is therefore no current product charge to refund.</p>

      <h2>2. Older or Unrecognized Charges</h2>
      <p>If you believe you have an older, duplicate, unauthorized, or unrecognized Verifiedly charge, contact us with the email on the account and approximate charge date. Include only non-sensitive transaction details. Do not email an ID image, selfie, complete card number, or password.</p>

      <h2>3. Future Paid Features</h2>
      <p>If Verifiedly introduces a paid feature later, the price and applicable refund terms will be shown before purchase and this policy will be updated.</p>

      <h2>4. Contact</h2>
      <p>Refund questions: <a href="mailto:support@verifiedly.app">support@verifiedly.app</a><br />Operated by BrownGlobal Holdings LLC.</p>
    </div>
  </div>
);

export default Refunds;
