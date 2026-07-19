import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Terms of Service — Verifiedly</title>
      <meta name="description" content="Terms for Verifiedly profiles, identity checks, and private professional documents." />
      <link rel="canonical" href="https://verifiedly.app/terms" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground"><em>Last updated: July 18, 2026</em></p>

      <h2>1. Acceptance</h2>
      <p>Verifiedly is operated by <strong>BrownGlobal Holdings LLC</strong> ("Verifiedly," "we," "us," or "our"). By accessing or using Verifiedly, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.</p>

      <h2>2. Eligibility and authority</h2>
      <p>You must be at least 13 years old to create a free profile. If you are under the legal age of majority where you live, a parent or legal guardian must permit your use. <strong>Verifiedly Identity is available only to people age 18 or older</strong> who are verifying their own identity.</p>
      <p>If you use Verifiedly for an organization, you represent that you are authorized to act for it. An organization profile or an account-holder identity badge does not independently verify the organization or the account holder's authority.</p>

      <h2>3. Accounts and security</h2>
      <p>You are responsible for accurate registration information, safeguarding your login, and activity under your account. Notify <strong>support@verifiedly.app</strong> promptly if you believe your account has been accessed without permission. We may require additional checks before restoring account access.</p>

      <h2>4. Public profiles</h2>
      <p>Verifiedly lets individuals and organizations publish structured profiles containing names, photos or logos, official websites, social profiles, work, education, credentials, licenses, awards, and accomplishments. You retain ownership of information you submit and grant us a limited, non-exclusive license to host, format, display, and distribute it as needed to operate the service.</p>
      <p>You must have the right to publish everything you add. You may not impersonate another person or organization or submit deceptive, unlawful, infringing, defamatory, or privacy-invasive information.</p>

      <h2>5. Verifiedly Identity</h2>
      <p>Verifiedly Identity is an optional <strong>$9.99 one-time service</strong>. After payment, the account holder completes a Stripe-hosted document and selfie check. Stripe, not Verifiedly, collects the government ID and selfie. Verifiedly receives and stores a provider session reference, result, attempt count, and check date. We do not intentionally copy the government-ID or selfie images into Verifiedly Documents.</p>
      <p>The service includes an initial attempt and, when the Stripe session allows it, one retry. A successful result adds one identity badge. A badge means only that Stripe Identity reported that the account holder's identity document and selfie check passed. It is not a background check and does not verify honesty, safety, employment, education, licenses, credentials, awards, business registration, authority, financial standing, or every profile claim.</p>
      <p>We may remove or require renewal of a badge if information changes, fraud is suspected, the account is transferred, the provider result is reversed, or another reasonable security concern arises. The badge is not guaranteed to remain permanently.</p>

      <h2>6. Verifiedly Documents</h2>
      <p>Verifiedly Documents is an optional subscription priced at <strong>$4.99 per month</strong> or <strong>$39 per year</strong>. It provides private storage for professional credentials such as degrees, certifications, professional licenses, and awards, subject to file-type and size limits shown in the product.</p>
      <p><strong>Do not upload</strong> payment cards, bank or investment records, Social Security cards or numbers, national-identification numbers, tax documents (including W-2s and 1099s), health records, passports, government IDs, identity selfies, passwords, authentication codes, birth or marriage certificates, or other information that the product identifies as prohibited. Verifiedly may remove prohibited content to protect users and the service.</p>
      <p>Files are not published on your public profile. If you create a secure link, anyone who has the link and any required password may access the selected file until the link expires, is revoked, or reaches its view limit. You are responsible for choosing recipients and sending passwords separately. No storage or sharing method is completely risk-free.</p>

      <h2>7. Payments, renewal, and cancellation</h2>
      <p>Stripe processes payments and stores payment methods under Stripe's terms. Verifiedly does not store complete payment-card details. Documents subscriptions renew automatically at the selected interval until canceled. You may manage or cancel through the Stripe customer portal. Cancellation normally takes effect at the end of the paid billing period.</p>
      <p>Prices may exclude taxes required in your location. Any price change will apply only as permitted by law and after required notice. Refund eligibility is described in our <Link to="/refunds">Refund Policy</Link>.</p>

      <h2>8. Service providers and availability</h2>
      <p>Verifiedly relies on third-party services, including Supabase for hosting, authentication, database, and storage, and Stripe for payments and identity checks. Their availability, geographic coverage, and rules may affect the service. We may modify, suspend, or discontinue a feature where reasonably necessary.</p>

      <h2>9. Prohibited conduct</h2>
      <ul>
        <li>Impersonating a person or organization or misrepresenting identity or authority</li>
        <li>Uploading content you do not have the right to store or share</li>
        <li>Uploading prohibited sensitive information to Verifiedly Documents</li>
        <li>Trying to bypass authentication, billing, verification, rate limits, file limits, or access controls</li>
        <li>Using automated systems to scrape, disrupt, overload, probe, or abuse the service</li>
        <li>Using Verifiedly to facilitate fraud, harassment, money laundering, or illegal activity</li>
        <li>Misusing a badge or suggesting that it verifies claims it does not verify</li>
      </ul>

      <h2>10. Suspension and termination</h2>
      <p>We may restrict, suspend, remove a badge from, or terminate an account where reasonably necessary to protect users, enforce these Terms, comply with law, address fraud or security concerns, or protect the service. You may request account deletion by contacting <strong>support@verifiedly.app</strong>.</p>

      <h2>11. Disclaimers</h2>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" TO THE EXTENT PERMITTED BY LAW. WE DO NOT GUARANTEE THAT VERIFIEDLY WILL ALWAYS BE AVAILABLE, ERROR-FREE, COMPLETELY SECURE, OR SUITABLE FOR A PARTICULAR PURPOSE. WE DO NOT GUARANTEE THE TRUTH OR COMPLETENESS OF USER-PROVIDED INFORMATION OR THAT A THIRD PARTY WILL ACCEPT A PROFILE, BADGE, OR DOCUMENT.</p>

      <h2>12. Limitation of liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, BROWNGLOBAL HOLDINGS LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO VERIFIEDLY. NOTHING IN THESE TERMS EXCLUDES LIABILITY THAT CANNOT LEGALLY BE EXCLUDED.</p>

      <h2>13. Governing law and international users</h2>
      <p>These Terms are governed by the laws of the State of Georgia, United States, without regard to conflict-of-law rules. Nothing here limits non-waivable consumer or data-protection rights that apply where you live. You are responsible for ensuring that your use is lawful in your jurisdiction.</p>

      <h2>14. Changes</h2>
      <p>We may update these Terms. If a change is material, we will provide reasonable notice, such as by email or an in-product message. Continued use after the effective date means you accept the updated Terms where permitted by law.</p>

      <h2>15. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Terms;
