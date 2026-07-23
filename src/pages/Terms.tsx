import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Terms of Service — Verifiedly</title>
      <meta name="description" content="Terms for Verifiedly official profiles, connected-app sign-in, Pro, identity verification, support, and Tap Cards." />
      <link rel="canonical" href="https://verifiedly.app/terms" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground"><em>Last updated: July 23, 2026</em></p>

      <h2>1. Acceptance</h2>
      <p>Verifiedly is operated by <strong>BrownGlobal Holdings LLC</strong> ("Verifiedly," "we," "us," or "our"). By accessing or using Verifiedly, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.</p>

      <h2>2. Eligibility and authority</h2>
      <p>You must be at least 13 years old to create a free account. If you are under the legal age of majority where you live, a parent or legal guardian must permit your use. Identity verification is limited to eligible adults age 18 or older who are verifying their own identity.</p>
      <p>If you create or manage an organization profile, you represent that you are authorized to act for that organization. An account-holder identity badge does not by itself verify the organization or the person's authority to represent it.</p>

      <h2>3. Accounts and security</h2>
      <p>You are responsible for accurate registration information, safeguarding your login, and activity under your account. Notify <strong>support@verifiedly.app</strong> promptly if you believe your account has been accessed without permission. We may require additional checks before restoring access.</p>

      <h2>4. Official profiles</h2>
      <p>Verifiedly lets individuals and organizations publish structured profiles containing names, photos or logos, websites, social profiles, work, education, credentials, licenses, awards, accomplishments, and selected contact information. You retain ownership of information you submit and grant us a limited, non-exclusive license to host, format, display, and distribute it as needed to operate the service.</p>
      <p>You must have the right to publish everything you add. You may not impersonate another person or organization or submit deceptive, unlawful, infringing, defamatory, or privacy-invasive information. Unless a claim has a specific Verifiedly confirmation label, it is user supplied and has not been independently verified.</p>

      <h2>5. Continue with Verifiedly</h2>
      <p>Approved applications may let you sign in through Verifiedly using OAuth and OpenID Connect. The authorization screen identifies the application and information it requests. Standard sign-in may include a stable account identifier, selected profile details, and email address. Verifiedly does not include identity-document images, private support messages, payment methods, private credentials, or application-specific roles in the standard sign-in response.</p>
      <p>A connected application has its own terms, privacy practices, permissions, and account data. You can decline an authorization request. We may suspend or revoke an application's access where needed for security, legal compliance, misuse, or service operations.</p>

      <h2>6. Verifiedly Pro</h2>
      <p>Verifiedly Pro is an optional subscription currently offered at the prices shown before checkout. Pro includes profile tools, identity-verification eligibility, priority support, analytics, and Tap Card benefits. Monthly and annual plans renew automatically until canceled through the Stripe customer portal or another method we provide.</p>
      <p>An annual plan may include one standard PVC Tap Card credit under the offer displayed at purchase. Shipping, upgrades, replacements, taxes, and other disclosed charges are separate. A card credit has no cash value, cannot be transferred, and may expire or become unavailable if the annual subscription is refunded, reversed, fraudulent, or otherwise invalid.</p>

      <h2>7. Identity verification</h2>
      <p>Eligible Pro users may complete a Stripe-hosted government-ID and selfie check. Stripe collects the submitted ID and selfie. Verifiedly is designed to retain the provider session reference, status, attempt count, and check date rather than copies of the ID or selfie images in its ordinary application database.</p>
      <p>Paying for Pro does not purchase or guarantee a badge. A badge appears only after Stripe reports a successful result. It means only that the account holder completed the described identity-document and selfie check. It is not a background check and does not verify honesty, safety, employment, education, licenses, credentials, awards, business registration, authority, financial standing, or every profile claim.</p>
      <p>We may remove or require renewal of a badge if information changes, fraud is suspected, the account is transferred, the provider result changes, or another reasonable security concern arises. Verification availability depends on provider eligibility, geography, and technical requirements.</p>

      <h2>8. Support and analytics</h2>
      <p>Free users may submit standard support requests. Active Pro requests may be prioritized, but no response time is guaranteed unless we expressly agree otherwise in writing. Do not send passwords, authentication codes, full payment-card numbers, Social Security numbers, government-ID images, or other unnecessary sensitive information through support.</p>
      <p>Profile and Tap Card analytics may be approximate, delayed, filtered for abuse, or unavailable. Aggregate tap counts do not prove that a particular person viewed or accepted a profile.</p>

      <h2>9. Verifiedly Tap Cards</h2>
      <p>A Verifiedly Tap Card is a personalized, non-payment profile-sharing accessory. Its NFC chip and printed QR code open a unique Verifiedly redirect that can lead to the owner's live public profile. It is <strong>not a payment card, bank card, government-issued ID, access credential, or standalone proof of identity</strong>.</p>
      <p>Physical card ordering opens only after Verifiedly approves its supplier and fulfillment process. Available materials, countries, prices, shipping, production time, and replacement rules are shown before purchase and may change. Metal cards remain subject to sample testing and NFC-performance approval.</p>
      <p>The live profile is the source of current badge and account status. Printed information can become outdated. Card owners can activate, disable, or mark supported cards lost. We may disable a card linked to a deleted, suspended, fraudulent, compromised, or transferred account.</p>
      <p>For an account owned by a minor, the purchaser must be an authorized parent or legal guardian and is responsible for the purchase, shipping address, and permission to print the selected profile information. Personalized items may have limited cancellation or return eligibility as described in the Refund Policy and as permitted by law.</p>

      <h2>10. Payments, renewal, and cancellation</h2>
      <p>Stripe processes payments and stores payment methods under Stripe's terms. Verifiedly does not store complete payment-card details. Subscription cancellation normally takes effect at the end of the current paid period. Prices may exclude taxes required in your location. Refund eligibility is described in our <Link to="/refunds">Refund Policy</Link>.</p>

      <h2>11. Service providers and availability</h2>
      <p>Verifiedly relies on third-party services, including Supabase for hosting, authentication, database, and storage; Stripe for payments and identity checks; and approved manufacturers and carriers for physical-card fulfillment. Their availability, geographic coverage, outages, and rules may affect the service. We may modify, pause, or discontinue a feature where reasonably necessary.</p>

      <h2>12. Prohibited conduct</h2>
      <ul>
        <li>Impersonating a person or organization or misrepresenting identity or authority</li>
        <li>Publishing information you do not have the right to share</li>
        <li>Trying to bypass authentication, billing, verification, card-credit, rate-limit, or access controls</li>
        <li>Copying, altering, or misusing a Tap Card or badge to create a false impression of identity or endorsement</li>
        <li>Using automated systems to scrape, disrupt, overload, probe, or abuse the service</li>
        <li>Using Verifiedly to facilitate fraud, harassment, money laundering, or illegal activity</li>
      </ul>

      <h2>13. Suspension and termination</h2>
      <p>We may restrict, suspend, remove a badge from, disable a Tap Card linked to, or terminate an account where reasonably necessary to protect users, enforce these Terms, comply with law, address fraud or security concerns, or protect the service. You may request account deletion through support.</p>

      <h2>14. Disclaimers</h2>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" TO THE EXTENT PERMITTED BY LAW. WE DO NOT GUARANTEE THAT VERIFIEDLY WILL ALWAYS BE AVAILABLE, ERROR-FREE, COMPLETELY SECURE, OR SUITABLE FOR A PARTICULAR PURPOSE. WE DO NOT GUARANTEE THE TRUTH OR COMPLETENESS OF USER-PROVIDED INFORMATION OR THAT A THIRD PARTY WILL ACCEPT A PROFILE, BADGE, AUTHORIZATION, OR TAP CARD.</p>

      <h2>15. Limitation of liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, BROWNGLOBAL HOLDINGS LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO VERIFIEDLY. NOTHING IN THESE TERMS EXCLUDES LIABILITY THAT CANNOT LEGALLY BE EXCLUDED.</p>

      <h2>16. Governing law and international users</h2>
      <p>These Terms are governed by the laws of the State of Georgia, United States, without regard to conflict-of-law rules. Nothing here limits non-waivable consumer or data-protection rights that apply where you live. You are responsible for ensuring that your use is lawful in your jurisdiction.</p>

      <h2>17. Changes</h2>
      <p>We may update these Terms. If a change is material, we will provide reasonable notice, such as by email or an in-product message. Continued use after the effective date means you accept the updated Terms where permitted by law.</p>

      <h2>18. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Terms;
