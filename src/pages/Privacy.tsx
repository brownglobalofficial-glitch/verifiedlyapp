import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Privacy = () => (
  <div className="min-h-screen overflow-x-hidden bg-background px-4 py-12">
    <Helmet>
      <title>Privacy Policy — Verifiedly</title>
      <meta name="description" content="How Verifiedly handles official profiles, annual Membership, Stripe Identity results, and connected-app sign-in." />
      <link rel="canonical" href="https://verifiedly.app/privacy" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl break-words dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 30, 2026</em></p>
      <p>This policy explains how <strong>BrownGlobal Holdings LLC</strong>, operating Verifiedly, collects, uses, shares, and protects information.</p>

      <h2>1. Information we collect</h2>
      <h3>Account and security information</h3>
      <ul>
        <li>Name, email, handle, authentication records, account type, settings, and support communications</li>
        <li>Age-category or eligibility information used to restrict adult-only identity verification</li>
        <li>Security, session, device, browser, IP-address, and fraud-prevention information</li>
      </ul>

      <h3>Public profile information</h3>
      <ul>
        <li>Photo or logo, banner, display name, handle, professional label, city or country, social links, and public contact details</li>
        <li>Work roles, organizations, dates, education schools, programs or fields, and dates</li>
      </ul>
      <p>Information published on a public profile can be viewed, copied, indexed, or shared by others. Do not publish sensitive information you do not want made public.</p>

      <h3>Membership and payment information</h3>
      <ul>
        <li>Stripe customer, checkout, subscription, payment-status, annual-renewal, cancellation, and billing references</li>
        <li>Membership status and current period end</li>
      </ul>
      <p>Stripe processes complete payment-card details. Verifiedly does not store complete payment-card numbers.</p>

      <h3>Identity-verification information</h3>
      <p>When an eligible adult member chooses verification, Stripe collects the government ID and selfie in a Stripe-hosted flow. Verifiedly is designed to retain the provider session reference, status, result, attempt count, and verification date rather than ordinary copies of the ID or selfie.</p>

      <h3>Connected-app information</h3>
      <p>When you use Continue with Verifiedly, we process the requesting app, permissions, consent decision, authorization records, token references, and security logs. The connected app receives only the information covered by the displayed permissions and consent.</p>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, secure, maintain, and improve Verifiedly</li>
        <li>Create and display official profiles</li>
        <li>Operate annual Membership billing, renewal, cancellation, and benefits</li>
        <li>Start identity checks for eligible adults and display accurate verification status</li>
                <li>Provide approved connected-app sign-in</li>
        <li>Measure profile activity, prevent fraud, enforce our Terms, and meet legal obligations</li>
      </ul>

      <h2>3. How we disclose information</h2>
      <p>We do not sell personal information. We may disclose information:</p>
      <ul>
        <li><strong>Publicly:</strong> when you publish it on your profile</li>
        <li><strong>At your direction:</strong> when you consent to share basic information with a connected app</li>
        <li><strong>To service providers:</strong> including Supabase, Stripe, manufacturers, and shipping providers</li>
        <li><strong>For legal and safety reasons:</strong> when required by law or reasonably necessary to protect users, rights, or the service</li>
        <li><strong>During a business transaction:</strong> subject to appropriate safeguards</li>
      </ul>

      <h2>4. Security</h2>
      <p>We use safeguards including encrypted network connections, authentication, database access rules, server-side payment operations, signed webhooks, and access controls. No system can guarantee absolute security. Do not place government IDs, complete payment details, passwords, or authentication codes in public profile fields or support messages.</p>

      <h2>5. Retention and deletion</h2>
      <p>We retain information while your account is active and as reasonably needed to provide the service, fulfill the included card, handle disputes, prevent fraud, enforce agreements, and comply with law. Billing and fulfillment records may remain for accounting, tax, chargeback, warranty, fraud-prevention, and legal purposes after account closure.</p>
      <p>Retired profile-section data may be hidden rather than immediately deleted to preserve user data and migration compatibility. Public information may remain in search caches or recipient copies outside our control.</p>

      <h2>6. Your choices and rights</h2>
      <p>You can edit public information, manage Membership through the Stripe portal, revoke connected-app access where available, and request account deletion. Depending on where you live, you may have rights to access, correct, delete, restrict, object, withdraw consent, or receive a portable copy. Contact <strong>support@verifiedly.app</strong>.</p>

      <h2>7. Young users</h2>
      <p>Verifiedly is not intended for children under 13. Minors must have permission from a parent or legal guardian. Stripe Identity verification through Verifiedly is limited to eligible adults age 18 or older.</p>

      <h2>8. International processing and changes</h2>
      <p>Verifiedly is operated from the United States, and information may be processed where our providers operate. We may update this policy and will provide reasonable notice of material changes where required.</p>

      <h2>9. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Operating brand: <strong>Verifiedly</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Privacy;
