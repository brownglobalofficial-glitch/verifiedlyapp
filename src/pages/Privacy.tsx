import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Privacy = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Privacy Policy — Verifiedly</title>
      <meta name="description" content="How Verifiedly handles official profiles, connected-app sign-in, identity results, subscriptions, support, analytics, and Tap Card orders." />
      <link rel="canonical" href="https://verifiedly.app/privacy" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 23, 2026</em></p>
      <p>This policy explains how <strong>BrownGlobal Holdings LLC</strong>, operating Verifiedly, collects, uses, shares, and protects information.</p>

      <h2>1. Information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Name, email address, handle, authentication records, account type, and settings</li>
        <li>Subscription, billing-status, verification-status, and account-security records</li>
        <li>Support requests and communications you send us</li>
      </ul>

      <h3>Public profile information</h3>
      <ul>
        <li>Display name, photo or logo, general location, public email, website, and social links</li>
        <li>Work, education, credentials, licenses, awards, accomplishments, dates, and supporting links</li>
      </ul>
      <p>Information on a public profile can be viewed, copied, indexed, or shared by others. Do not publish sensitive information that you do not want made public.</p>

      <h3>Connected-app authorization</h3>
      <p>When you use Continue with Verifiedly, we process the requesting application's client identifier, redirect address, requested permissions, your decision, authorization codes, tokens, revocations, security records, and related timestamps. Approved applications may receive the information described on the authorization screen, such as a stable account identifier, selected profile details, and email address.</p>
      <p>Standard sign-in is not designed to disclose identity-document images, payment methods, private support messages, private credentials, or unrelated application data.</p>

      <h3>Identity-check information</h3>
      <p>When an eligible adult starts identity verification, Stripe collects the government ID and selfie in a Stripe-hosted flow. Verifiedly is designed to retain the Stripe session reference, result, attempt count, and check date in its ordinary application database rather than copies of the government-ID or selfie images. Stripe processes verification data under its own terms and privacy notices.</p>

      <h3>Pro subscription and payments</h3>
      <p>We process Stripe customer, checkout, payment, invoice, subscription, cancellation, and billing-status references. Stripe processes complete payment-card details. Verifiedly does not store complete payment-card numbers.</p>

      <h3>Tap Cards and fulfillment</h3>
      <p>For Tap Card ordering and management, we may collect the chosen material, profile name and handle selected for printing, unique card token, card serial, order status, aggregate tap count, activation state, shipment status, tracking details, shipping name, and shipping address. A manufacturer or fulfillment provider receives only the information reasonably needed to produce and deliver the card.</p>
      <p>The NFC chip and QR code contain a Verifiedly redirect link, not payment details, government-ID images, Stripe verification-session data, private credentials, or passwords. The public redirect may record an aggregate tap and timestamp. The initial design does not require storing the visitor's IP address or raw device fingerprint in the Tap Card record.</p>

      <h3>Technical and usage information</h3>
      <ul>
        <li>Profile views, link clicks, consent activity, browser, device, approximate location derived from network information, IP address, session, timestamps, and security events needed to operate and protect the service</li>
        <li>Aggregate Tap Card counts, last-tap time, errors, abuse signals, and service diagnostics</li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, secure, maintain, and improve Verifiedly</li>
        <li>Create and display official public profiles</li>
        <li>Operate Continue with Verifiedly and record user authorization choices</li>
        <li>Operate identity checks and display accurate badge meaning</li>
        <li>Process subscriptions, payments, cancellations, support, and refunds</li>
        <li>Create, activate, disable, fulfill, and support Tap Cards</li>
        <li>Provide analytics and investigate abuse or security incidents</li>
        <li>Enforce our Terms and meet legal obligations</li>
      </ul>

      <h2>3. How we disclose information</h2>
      <p>We do not sell personal information. We may disclose information:</p>
      <ul>
        <li><strong>Publicly:</strong> when you publish it on your profile</li>
        <li><strong>At your direction:</strong> when you approve a connected application's requested access</li>
        <li><strong>To service providers:</strong> including Supabase for hosting, authentication, database, and storage; Stripe for payments and identity checks; and approved manufacturers, fulfillment providers, and shipping carriers for Tap Cards</li>
        <li><strong>For legal and safety reasons:</strong> when required by law or reasonably necessary to protect users, rights, or the service</li>
        <li><strong>During a business transaction:</strong> such as a merger, financing, acquisition, or sale, subject to appropriate safeguards</li>
      </ul>

      <h2>4. Security</h2>
      <p>We use administrative and technical safeguards including encrypted network connections, authentication, row-level access rules, restricted service credentials, signed payment webhooks, randomly generated Tap Card tokens, revocation controls, and audit records. No service can guarantee absolute security. Do not send passwords, authentication codes, full payment-card numbers, Social Security numbers, or government-ID images through profile or support fields.</p>

      <h2>5. Retention and deletion</h2>
      <p>We retain information while your account is active and as reasonably needed to provide the service, handle disputes, fulfill orders, prevent fraud, enforce agreements, and comply with law. Tap Card order and shipping records may be retained for transaction, warranty, tax, fraud-prevention, and legal purposes even after a profile or card is disabled.</p>
      <p>Public information may remain in search caches, recipient copies, or third-party systems outside our control. Disabling a Tap Card stops a supported redirect but cannot remove screenshots or copies another person already made.</p>

      <h2>6. Your choices and rights</h2>
      <p>You can edit public profile information, decline connected-app authorization, manage a subscription, disable supported Tap Cards, and request account deletion. Depending on where you live, you may have rights to access, correct, delete, restrict, object to processing, withdraw consent, or receive a portable copy. Contact <strong>support@verifiedly.app</strong>. We may need to verify your identity before completing a request.</p>

      <h2>7. Young users</h2>
      <p>Verifiedly is not intended for children under 13. Users who are minors where they live must have permission from a parent or legal guardian. Identity verification is restricted to eligible adults age 18 or older. A physical card purchase for a minor's account must be completed or authorized by a parent or legal guardian. If we learn that a child under 13 created an account, we may close the account and delete associated information as required by law.</p>

      <h2>8. International processing</h2>
      <p>Verifiedly is operated from the United States, and information may be processed in the United States and other countries where service providers operate. Provider and fulfillment coverage varies by country. Where required, we use legally recognized transfer mechanisms. Local privacy rights remain available where applicable.</p>

      <h2>9. Changes</h2>
      <p>We may update this policy. We will provide reasonable notice of material changes and update the date above.</p>

      <h2>10. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Privacy;
