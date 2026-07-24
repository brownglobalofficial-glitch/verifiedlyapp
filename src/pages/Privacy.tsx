import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Privacy = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Privacy Policy — Verifiedly</title>
      <meta name="description" content="How Verifiedly handles profiles, Pro billing, identity results, Tap Card orders, and connected-app sign-in." />
      <link rel="canonical" href="https://verifiedly.app/privacy" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 24, 2026</em></p>
      <p>This policy explains how <strong>BrownGlobal Holdings LLC</strong>, operating Verifiedly, collects, uses, shares, and protects information.</p>

      <h2>1. Information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Name, email address, handle, authentication records, account type, and settings</li>
        <li>Age-category or eligibility information needed to control access to adult-only identity verification</li>
        <li>Support requests and communications you send us</li>
      </ul>

      <h3>Public profile information</h3>
      <ul>
        <li>Display name, photo or logo, location, public email, website, and social links</li>
        <li>Work, education, credentials, licenses, awards, accomplishments, dates, and supporting links</li>
      </ul>
      <p>Information on a public profile can be viewed, copied, indexed, or shared by others. Do not publish sensitive information that you do not want made public.</p>

      <h3>Identity-verification information</h3>
      <p>If an eligible adult with active Verifiedly Pro chooses identity verification, Stripe collects the government ID and selfie in a Stripe-hosted flow. Stripe and Verifiedly process information under their respective roles and terms. Verifiedly is designed to retain the Stripe session reference, result, attempt count, status, and verification date in its ordinary database rather than copies of the government ID or selfie.</p>

      <h3>Pro billing and payment information</h3>
      <ul>
        <li>Stripe customer, checkout, subscription, payment, billing-status, renewal, and cancellation references</li>
        <li>Plan interval, current subscription status, and period-end information</li>
      </ul>
      <p>Stripe processes complete payment-card details. Verifiedly does not store complete payment-card numbers.</p>

      <h3>Tap Card order information</h3>
      <ul>
        <li>Approved printed name, title, handle, template version, preview-approval time, card serial, NFC link, QR link, and order status</li>
        <li>Shipping name and address, supplier reference, tracking information, and support notes related to fulfillment</li>
        <li>Card state, such as active, disabled, lost, or replaced, and aggregate tap counts</li>
      </ul>
      <p>Verifiedly may process limited technical logs to operate and protect the redirect service. Tap-count records are designed to be aggregate and are not intended to store an IP address with each card tap.</p>

      <h3>Connected-app information</h3>
      <p>When you use Continue with Verifiedly, we process the requesting app, requested permissions, consent decision, authorization records, token references, and security logs needed to provide and protect the sign-in connection. The connected app receives only the information covered by the approved permissions and your consent.</p>

      <h3>Technical and usage information</h3>
      <p>We may process profile views, link clicks, referral pages, device and browser information, IP address, timestamps, session information, and security events needed to operate, measure, troubleshoot, and protect the service.</p>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, secure, maintain, and improve Verifiedly</li>
        <li>Create and display public profiles</li>
        <li>Operate Pro billing and account benefits</li>
        <li>Start identity checks for eligible adults and display accurate verification status</li>
        <li>Create, fulfill, activate, disable, replace, and support Verifiedly Tap Cards</li>
        <li>Provide Continue with Verifiedly and honor consented permissions</li>
        <li>Process payments, subscriptions, cancellations, support, and refunds</li>
        <li>Prevent fraud, enforce our Terms, and meet legal obligations</li>
        <li>Measure service usage and investigate security incidents</li>
      </ul>

      <h2>3. How we disclose information</h2>
      <p>We do not sell personal information. We may disclose information:</p>
      <ul>
        <li><strong>Publicly:</strong> when you publish it on your profile</li>
        <li><strong>At your direction:</strong> when you consent to share profile information with a connected app</li>
        <li><strong>To service providers:</strong> including Supabase for hosting, authentication, database, and storage; Stripe for payments and identity checks; and card manufacturers or shipping providers for Tap Card production and delivery</li>
        <li><strong>For legal and safety reasons:</strong> when required by law or reasonably necessary to protect users, rights, or the service</li>
        <li><strong>During a business transaction:</strong> such as a merger, financing, acquisition, or sale, subject to appropriate safeguards</li>
      </ul>
      <p>For Tap Card fulfillment, we aim to send the supplier only the information reasonably necessary to print, encode, ship, and track the card, such as the approved print fields, QR and NFC link, serial, template, and shipping address. We do not send payment-card details or Stripe Identity evidence to the card supplier.</p>

      <h2>4. Security</h2>
      <p>We use administrative and technical safeguards including encrypted network connections, authentication, row-level database rules, server-side Stripe operations, signed webhook verification, random Tap Card tokens, and access controls. No service can guarantee absolute security. Do not place government IDs, complete payment-card details, bank credentials, passwords, authentication codes, or other high-risk records in profile fields or support messages.</p>

      <h2>5. Retention and deletion</h2>
      <p>We retain information while your account is active and as reasonably needed to provide the service, fulfill orders, handle disputes, prevent fraud, enforce agreements, and comply with law. Billing and order records may be retained for accounting, tax, chargeback, warranty, fraud-prevention, and legal purposes even after an account is closed.</p>
      <p>Public information may remain in search caches, recipient copies, or other third-party systems outside our control. Disabling a Tap Card stops the Verifiedly redirect but does not erase information already printed on the physical card.</p>

      <h2>6. Your choices and rights</h2>
      <p>You can edit public profile information, manage a Pro subscription, disable supported Tap Cards, revoke connected-app access where available, and request account deletion. Depending on where you live, you may have rights to access, correct, delete, restrict, object to processing, withdraw consent, or receive a portable copy. Contact <strong>support@verifiedly.app</strong>. We may need to verify your identity before completing a request.</p>

      <h2>7. Young users</h2>
      <p>Verifiedly is not intended for children under 13. Users who are minors where they live must have permission from a parent or legal guardian. Stripe Identity verification through Verifiedly is restricted to eligible adults age 18 or older. If we learn that a child under 13 created an account, we may close the account and delete associated information as required by law.</p>

      <h2>8. International processing</h2>
      <p>Verifiedly is operated from the United States, and information may be processed in the United States and other countries where service providers operate. Provider coverage varies by country. Where required, we use legally recognized transfer mechanisms. Local privacy rights remain available where applicable.</p>

      <h2>9. Changes</h2>
      <p>We may update this policy. We will provide reasonable notice of material changes and update the date above.</p>

      <h2>10. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Privacy;
