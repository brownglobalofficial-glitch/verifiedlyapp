import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => (
  <div className="min-h-screen overflow-x-hidden bg-background px-4 py-12">
    <Helmet>
      <title>Terms of Service — Verifiedly</title>
      <meta name="description" content="Terms for Verifiedly official profiles, annual Membership, Stripe Identity verification access, and connected-app sign-in." />
      <link rel="canonical" href="https://verifiedly.app/terms" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl break-words dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground"><em>Last updated: July 30, 2026</em></p>

      <h2>1. Operator and acceptance</h2>
      <p>Verifiedly is operated by <strong>BrownGlobal Holdings LLC</strong> ("Verifiedly," "we," "us," or "our"). By accessing or using Verifiedly, you agree to these Terms and our Privacy Policy.</p>

      <h2>2. Eligibility</h2>
      <p>You must be at least 13 to create a free profile. A minor must have permission from a parent or legal guardian. Stripe Identity verification through Verifiedly is limited to eligible adults age 18 or older who are verifying their own identity. An organization-profile manager represents that they are authorized to act for that organization.</p>

      <h2>3. Accounts and official profiles</h2>
      <p>You are responsible for accurate registration information, account security, and activity under your account. Verifiedly profiles may display a name, handle, photo or logo, banner, professional label, location, social links, public contact details, Work, and Education.</p>
      <p>You must have the right to publish everything you add. You may not impersonate another person or organization or publish unlawful, deceptive, infringing, defamatory, or privacy-invasive information. Work, Education, organization authority, and other profile claims are user-provided unless Verifiedly clearly states otherwise.</p>

      <h2>4. Verifiedly Membership</h2>
      <p>Verifiedly Membership is an annually renewing subscription currently offered at <strong>$50 per year</strong>, plus applicable taxes. The amount shown at checkout is charged when the Membership begins and renews annually until canceled.</p>
      <p>Membership may include Stripe Identity verification access for eligible adults, organization verification, basic profile analytics as available, priority account support, and other clearly described benefits.</p>
      <p>You may cancel future renewal through the Stripe billing portal. Cancellation normally takes effect at the end of the current paid term. Membership features and availability may change prospectively where permitted by law, but we will not intentionally remove a benefit already owed for a paid term without an appropriate remedy.</p>

      <h2>5. Identity verification</h2>
      <p>Stripe Identity verification is included for eligible adult members. The Identity Verified badge appears only after successful verification. Paying for Membership does not buy or guarantee the badge.</p>
      <p>The badge means the supported Stripe Identity process successfully verified the adult account holder. It is not a background check and does not independently verify Work, Education, licenses, awards, organization registration, authority, safety, honesty, or every profile claim.</p>
      <p>We may review, remove, expire, or require renewal of a badge when account information changes, fraud is suspected, an account appears transferred, the provider result changes, or another reasonable security concern arises.</p>

      <h2>6. Included Verifiedly Tap Card</h2>
      <p>Verifiedly Tap is a personalized, non-payment PVC NFC card that opens the member's live Verifiedly profile through NFC or QR. It is not a debit card, credit card, stored-value card, government ID, or standalone proof of identity.</p>
      <p>An eligible member must approve the printed name, professional title, handle, shipping address, and displayed shipping estimate before claiming the included card. Verifiedly then manually reviews the information and may send the necessary print, NFC, QR, serial, and shipping information to a third-party manufacturer or fulfillment provider.</p>
      <p>A claimed card is not the same as a shipped card. Production and delivery timing can vary. Any displayed shipping window is an estimate rather than a guaranteed delivery date. If we cannot ship within the stated estimate, we may provide a revised date and request consent, cancel fulfillment, or provide another remedy required by law.</p>
      <p>The card remains linked to the live profile through its Verifiedly token. Disabling the card stops the Verifiedly redirect but cannot retrieve the physical card or erase information already printed on it.</p>

      <h2>7. Payments, taxes, and refunds</h2>
      <p>Stripe processes Membership payments and stores payment methods under Stripe's terms. Verifiedly does not store complete payment-card numbers. Prices may exclude taxes required by law. Refund, cancellation, defect, delay, and replacement rules appear in our <Link to="/refunds">Refund Policy</Link>.</p>

      <h2>8. Continue with Verifiedly</h2>
      <p>Approved apps may let users sign in with Verifiedly. A connected app receives only the information covered by the displayed permissions and user consent. Normal sign-in tokens do not include payment information, Identity documents or evidence, private records, or Membership status unless a separate authorized use case is clearly disclosed.</p>

      <h2>9. Prohibited conduct</h2>
      <ul>
        <li>Impersonating a person or organization or misrepresenting identity or authority</li>
        <li>Publishing information you do not have the right to use</li>
        <li>Uploading government IDs, complete card details, passwords, authentication codes, or other high-risk records into profile fields or support messages</li>
        <li>Bypassing authentication, billing, identity, rate-limit, or access controls</li>
        <li>Scraping, disrupting, probing, overloading, or abusing the service</li>
        <li>Using Verifiedly for fraud, harassment, or unlawful activity</li>
      </ul>

      <h2>10. Service providers and availability</h2>
      <p>Verifiedly relies on third parties including Supabase, Stripe, manufacturers, and shipping providers. Their availability, coverage, and rules may affect the service. We may modify, suspend, or discontinue features when reasonably necessary.</p>

      <h2>11. Suspension and termination</h2>
      <p>We may restrict, suspend, disable a card, remove a badge from, or terminate an account where reasonably necessary to protect users, enforce these Terms, comply with law, address fraud or security concerns, or protect the service.</p>

      <h2>12. Disclaimers and liability</h2>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" TO THE EXTENT PERMITTED BY LAW. WE DO NOT GUARANTEE THAT VERIFIEDLY WILL ALWAYS BE AVAILABLE, ERROR-FREE, COMPLETELY SECURE, OR ACCEPTED BY A THIRD PARTY.</p>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, BROWNGLOBAL HOLDINGS LLC WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES. NOTHING HERE EXCLUDES LIABILITY THAT CANNOT LEGALLY BE EXCLUDED.</p>

      <h2>13. Governing law and changes</h2>
      <p>These Terms are governed by Georgia law, without limiting non-waivable consumer rights that apply where you live. We may update these Terms and will provide reasonable notice of material changes where required.</p>

      <h2>14. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Operating brand: <strong>Verifiedly</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Terms;
