import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Privacy = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Privacy Policy — Verifiedly</title>
      <meta name="description" content="How Verifiedly handles public profiles, identity results, private professional documents, and payments." />
      <link rel="canonical" href="https://verifiedly.app/privacy" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 18, 2026</em></p>
      <p>This policy explains how <strong>BrownGlobal Holdings LLC</strong>, operating Verifiedly, collects, uses, shares, and protects information.</p>

      <h2>1. Information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Name, email address, handle, authentication records, account type, and settings</li>
        <li>Support requests and communications you send us</li>
      </ul>

      <h3>Public profile information</h3>
      <ul>
        <li>Display name, photo or logo, location, public email, website, and social links</li>
        <li>Work, education, credentials, licenses, awards, accomplishments, dates, and supporting links</li>
      </ul>
      <p>Information on a public profile can be viewed, copied, indexed, or shared by others. Do not publish sensitive information that you do not want made public.</p>

      <h3>Identity-check information</h3>
      <p>If an adult chooses Verifiedly Identity, Stripe collects the government ID and selfie in a Stripe-hosted flow. Both Stripe and Verifiedly can have access to information submitted through that flow under their respective roles and terms. Verifiedly is designed to retain only a Stripe session reference, result, attempt count, and check date in its ordinary database. Verifiedly does not intentionally copy government-ID or selfie images into Verifiedly Documents.</p>

      <h3>Private professional documents</h3>
      <p>If you subscribe to Verifiedly Documents, we collect the professional credential files you upload and metadata such as title, type, issuer, dates, original filename, file type, file size, storage path, and upload time. Files are stored in a private Supabase Storage bucket. They are not part of your public profile.</p>
      <p>Do not upload payment cards, banking records, Social Security or national-identification numbers, health records, passports, government IDs, identity selfies, birth or marriage certificates, passwords, or authentication codes.</p>

      <h3>Secure-link and usage information</h3>
      <p>When you create a document link, we store a one-way hash of the link token, expiration, view limit, view count, revocation status, and access timestamps. If you add a password, we store a salted password-derived hash rather than the plaintext password. A recipient's successful access produces a short-lived file URL.</p>

      <h3>Payment and technical information</h3>
      <ul>
        <li>Stripe customer, checkout, payment, subscription, and billing-status references</li>
        <li>Profile views, link clicks, referral pages, device, browser, IP, session, timestamps, and security events needed to operate and protect the service</li>
      </ul>
      <p>Stripe processes complete payment-card details. Verifiedly does not store complete payment-card numbers.</p>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, secure, maintain, and improve Verifiedly</li>
        <li>Create and display public profiles</li>
        <li>Operate identity checks and display accurate badge meaning</li>
        <li>Store private professional documents and issue controlled access links</li>
        <li>Process payments, subscriptions, cancellations, support, and refunds</li>
        <li>Prevent fraud, enforce our Terms, and meet legal obligations</li>
        <li>Measure service usage and investigate security incidents</li>
      </ul>

      <h2>3. How we disclose information</h2>
      <p>We do not sell personal information. We may disclose information:</p>
      <ul>
        <li><strong>Publicly:</strong> when you publish it on your profile</li>
        <li><strong>At your direction:</strong> when you create and provide a document link to another person</li>
        <li><strong>To service providers:</strong> including Supabase for hosting, authentication, database, and storage, and Stripe for payments and identity checks</li>
        <li><strong>For legal and safety reasons:</strong> when required by law or reasonably necessary to protect users, rights, or the service</li>
        <li><strong>During a business transaction:</strong> such as a merger, financing, acquisition, or sale, subject to appropriate safeguards</li>
      </ul>

      <h2>4. Security</h2>
      <p>We use administrative and technical safeguards including encrypted network connections, authentication, private storage, row-level access rules, short-lived file URLs, hashed sharing tokens, optional password protection, access limits, and revocation controls. No service can guarantee absolute security. Do not use Verifiedly Documents for prohibited high-risk records.</p>

      <h2>5. Retention and deletion</h2>
      <p>We retain information while your account is active and as reasonably needed to provide the service, handle disputes, prevent fraud, enforce agreements, and comply with law. Ending a Documents subscription ends access according to the paid billing period but does not itself guarantee immediate file deletion. You can remove files while access is active or request deletion through <strong>support@verifiedly.app</strong>. Account deletion requests include associated private files, subject to legally required or permitted retention.</p>
      <p>Public information may remain in search caches, recipient copies, or other third-party systems outside our control. A recipient may copy a document while a secure link is valid; revoking the link cannot delete copies already made.</p>

      <h2>6. Your choices and rights</h2>
      <p>You can edit public profile information, remove private documents, revoke sharing links, manage a subscription, and request account deletion. Depending on where you live, you may have rights to access, correct, delete, restrict, object to processing, withdraw consent, or receive a portable copy. Contact <strong>support@verifiedly.app</strong>. We may need to verify your identity before completing a request.</p>

      <h2>7. Young users</h2>
      <p>Verifiedly is not intended for children under 13. Users who are minors where they live must have permission from a parent or legal guardian. Verifiedly Identity is restricted to adults age 18 or older. If we learn that a child under 13 created an account, we may close the account and delete associated information as required by law.</p>

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
