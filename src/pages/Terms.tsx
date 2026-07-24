import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => (
  <div className="min-h-screen bg-background px-4 py-12">
    <Helmet>
      <title>Terms of Service — Verifiedly</title>
      <meta name="description" content="Terms for Verifiedly official profiles, Pro, identity verification, Tap Cards, and connected-app sign-in." />
      <link rel="canonical" href="https://verifiedly.app/terms" />
    </Helmet>
    <div className="prose prose-sm mx-auto max-w-3xl dark:prose-invert">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground"><em>Last updated: July 24, 2026</em></p>

      <h2>1. Acceptance</h2>
      <p>Verifiedly is operated by <strong>BrownGlobal Holdings LLC</strong> ("Verifiedly," "we," "us," or "our"). By accessing or using Verifiedly, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.</p>

      <h2>2. Eligibility and authority</h2>
      <p>You must be at least 13 years old to create a free profile. If you are under the legal age of majority where you live, a parent or legal guardian must permit your use. Stripe Identity verification through Verifiedly is limited to eligible adults age 18 or older who are verifying their own identity.</p>
      <p>If you create or manage an organization profile, you represent that you are authorized to act for that organization. A profile does not by itself prove business registration, ownership, employment, authority, or endorsement.</p>

      <h2>3. Accounts and security</h2>
      <p>You are responsible for accurate registration information, safeguarding your login, and activity under your account. Notify <strong>support@verifiedly.app</strong> promptly if you believe your account has been accessed without permission. We may require additional checks before restoring access or changing security-sensitive information.</p>

      <h2>4. Official profiles</h2>
      <p>Verifiedly lets people and organizations publish structured profiles containing names, photos or logos, public contact information, websites, social links, work, education, credentials, licenses, awards, and accomplishments. You retain ownership of information you submit and grant us a limited, non-exclusive license to host, format, display, and distribute it as needed to operate the service.</p>
      <p>You must have the right to publish everything you add. You may not impersonate another person or organization or submit deceptive, unlawful, infringing, defamatory, or privacy-invasive information.</p>
      <p>Unless separately verified and clearly labeled, profile roles, credentials, licenses, education, employment, awards, and other claims are user-supplied. An identity verification check does not verify those claims.</p>

      <h2>5. Verifiedly Pro</h2>
      <p>Verifiedly Pro is an optional subscription currently offered at <strong>$4.99 per month</strong> or <strong>$49.99 per year</strong>, plus applicable taxes. Pro may include enhanced profile and sharing tools, analytics as available, priority support, Tap Card member pricing, and access to the Stripe Identity flow for eligible adults.</p>
      <p>Pro subscriptions renew automatically until canceled. You can manage or cancel through the Stripe customer portal. Cancellation normally takes effect at the end of the current paid billing period. Feature availability may change as the service develops, subject to applicable law.</p>

      <h2>6. Identity verification</h2>
      <p>Verifiedly does not charge a separate $9.99 identity-verification fee. Eligible adults with active Pro may be allowed to complete a Stripe-hosted government-ID and selfie check. Stripe, not Verifiedly, collects the ID and selfie in the verification flow. Verifiedly ordinarily stores the provider session reference, status, attempt count, and verification date rather than copies of the ID or selfie.</p>
      <p>Paying for Pro does not buy or guarantee a verification check. The check appears only after Stripe Identity reports a successful result. A check means only that the account holder completed the supported identity-document and selfie process. It is not a background check and does not verify safety, honesty, employment, education, licenses, credentials, awards, organization registration, authority, financial standing, or every profile claim.</p>
      <p>Access to new or retry verification sessions may require active Pro. A previously completed verification may remain visible after Pro ends, but we may review, remove, expire, or require renewal of the check if account information changes, fraud is suspected, the account is transferred, the provider result changes, or another reasonable security concern arises.</p>

      <h2>7. Verifiedly Tap</h2>
      <p>Verifiedly Tap is a personalized, non-payment PVC NFC profile-sharing card. The card may include the approved name, professional title, handle, QR code, NFC link, serial number, and Verifiedly branding. It is not a debit card, credit card, stored-value card, government ID, or standalone proof of identity. The live Verifiedly profile is the source of current profile and verification status.</p>
      <p>Current Tap Card pricing is shown before checkout, including the regular price and any active-Pro member price. Shipping charges, taxes, geographic availability, production estimates, and delivery estimates are shown in the ordering flow where applicable.</p>
      <p>You must review and approve the card preview and shipping details before payment. After payment, BrownGlobal may manually review the order and submit the approved information to a third-party manufacturer or fulfillment provider. Only information reasonably necessary to print, encode, fulfill, and ship the card is shared with that provider.</p>
      <p>A Tap Card can be disabled or marked lost through supported account controls. Disabling the card stops the Verifiedly redirect but cannot physically retrieve the card or erase information already printed on it.</p>

      <h2>8. Continue with Verifiedly</h2>
      <p>Approved websites and apps may let users sign in with Verifiedly. A connected app receives only the information covered by the permissions shown in the consent screen. You can revoke a connected app where account controls are available. Connected apps operate under their own terms and privacy practices.</p>

      <h2>9. Payments, renewal, taxes, and refunds</h2>
      <p>Stripe processes payments and stores payment methods under Stripe's terms. Verifiedly does not store complete payment-card details. Prices may exclude taxes or shipping charges required for the order. Refund eligibility is described in our <Link to="/refunds">Refund Policy</Link>.</p>

      <h2>10. Service providers and availability</h2>
      <p>Verifiedly relies on third-party services, including Supabase for hosting, authentication, database, and storage; Stripe for payments and identity checks; and card manufacturers or shipping providers for Tap Card fulfillment. Their availability, geographic coverage, production schedules, and rules may affect the service. We may modify, suspend, or discontinue a feature where reasonably necessary.</p>

      <h2>11. Prohibited conduct</h2>
      <ul>
        <li>Impersonating a person or organization or misrepresenting identity or authority</li>
        <li>Publishing information or content you do not have the right to use</li>
        <li>Uploading government IDs, complete payment-card details, bank credentials, passwords, authentication codes, or other prohibited sensitive records into profile fields or support messages</li>
        <li>Trying to bypass authentication, billing, verification, rate limits, order controls, or access controls</li>
        <li>Using automated systems to scrape, disrupt, overload, probe, or abuse the service</li>
        <li>Using Verifiedly to facilitate fraud, harassment, money laundering, or illegal activity</li>
        <li>Misusing a verification check or Tap Card to suggest that Verifiedly verifies claims it does not verify</li>
      </ul>

      <h2>12. Suspension and termination</h2>
      <p>We may restrict, suspend, disable a card, remove a verification check from, or terminate an account where reasonably necessary to protect users, enforce these Terms, comply with law, address fraud or security concerns, or protect the service. You may request account deletion by contacting <strong>support@verifiedly.app</strong>.</p>

      <h2>13. Disclaimers</h2>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" TO THE EXTENT PERMITTED BY LAW. WE DO NOT GUARANTEE THAT VERIFIEDLY WILL ALWAYS BE AVAILABLE, ERROR-FREE, COMPLETELY SECURE, OR SUITABLE FOR A PARTICULAR PURPOSE. WE DO NOT GUARANTEE THE TRUTH OR COMPLETENESS OF USER-PROVIDED INFORMATION OR THAT A THIRD PARTY WILL ACCEPT A PROFILE, VERIFICATION CHECK, TAP CARD, OR CONNECTED-APP SIGN-IN.</p>

      <h2>14. Limitation of liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, BROWNGLOBAL HOLDINGS LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO VERIFIEDLY. NOTHING IN THESE TERMS EXCLUDES LIABILITY THAT CANNOT LEGALLY BE EXCLUDED.</p>

      <h2>15. Governing law and international users</h2>
      <p>These Terms are governed by the laws of the State of Georgia, United States, without regard to conflict-of-law rules. Nothing here limits non-waivable consumer or data-protection rights that apply where you live. You are responsible for ensuring that your use is lawful in your jurisdiction.</p>

      <h2>16. Changes</h2>
      <p>We may update these Terms. If a change is material, we will provide reasonable notice, such as by email or an in-product message. Continued use after the effective date means you accept the updated Terms where permitted by law.</p>

      <h2>17. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Terms;
