import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Privacy = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <Helmet>
      <title>Privacy Policy — Verifiedly</title>
      <meta name="description" content="How Verifiedly handles account, public profile, analytics, and optional Stripe Identity verification information." />
      <link rel="canonical" href="https://verifiedly.app/privacy" />
      <meta property="og:title" content="Privacy Policy — Verifiedly" />
      <meta property="og:description" content="How Verifiedly handles account, profile, and identity-verification information." />
      <meta property="og:url" content="https://verifiedly.app/privacy" />
    </Helmet>
    <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: July 18, 2026</em></p>

      <p>This policy explains how <strong>BrownGlobal Holdings LLC</strong>, operating Verifiedly, collects, uses, shares, and protects information.</p>

      <h2>1. Information We Collect</h2>
      <h3>Account and eligibility information</h3>
      <ul>
        <li>Name, email address, handle, authentication information, and account settings</li>
        <li>Date of birth, used to enforce Verifiedly's age requirement and not displayed publicly</li>
        <li>Support requests and other communications you send us</li>
      </ul>

      <h3>Profile information</h3>
      <ul>
        <li>Display name, profile photo or logo, biography, professional label, website, and social links</li>
        <li>Work, education, accomplishments, credentials, projects, supporting links, and other sections you choose to add</li>
        <li>Your visibility choices for profile sections</li>
      </ul>
      <p>Information you publish on a public profile can be viewed, copied, indexed, or shared by others. Do not publish sensitive information that you do not want made public.</p>

      <h3>Identity verification and payment information</h3>
      <p>If you choose identity verification, Stripe Identity collects and processes the government-ID image, live capture, and selfie used for the check. Verifiedly does not receive or store the raw ID image or selfie. We may receive and store the verification status and limited outputs such as legal name, country, date of birth, verification timestamp, and Stripe session reference.</p>
      <p>Stripe processes the verification payment. We do not store your complete card number. Stripe's handling of information is governed by its own privacy policy.</p>

      <h3>Information collected automatically</h3>
      <ul>
        <li>Profile views, link clicks, referral pages, and timestamps</li>
        <li>Device, browser, IP, session, and security-event information needed to operate and protect the service</li>
        <li>Essential cookies and local storage used for authentication, preferences, and security</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>Provide, secure, maintain, and improve Verifiedly</li>
        <li>Create and display profiles according to your visibility choices</li>
        <li>Process optional identity checks and show the appropriate badge status</li>
        <li>Process payments, prevent fraud, enforce our Terms, and meet legal obligations</li>
        <li>Respond to support requests and send important service notices</li>
        <li>Measure profile and link usage</li>
      </ul>

      <h2>3. How We Share Information</h2>
      <p>We do not sell personal information. We may share information:</p>
      <ul>
        <li><strong>Publicly:</strong> when you choose to publish it on your profile</li>
        <li><strong>With service providers:</strong> including Supabase for hosting and authentication and Stripe for payments and identity verification</li>
        <li><strong>For legal and safety reasons:</strong> when required by law or reasonably necessary to protect users, our rights, or the service</li>
        <li><strong>During a business transaction:</strong> such as a merger, financing, acquisition, or sale, subject to appropriate safeguards</li>
        <li><strong>With your direction or consent</strong></li>
      </ul>

      <h2>4. Security</h2>
      <p>We use reasonable administrative, technical, and organizational safeguards, including encrypted connections, access controls, and database security policies. No system is completely secure, so we cannot guarantee absolute security. If you believe your account or data is at risk, contact <strong>support@verifiedly.app</strong>.</p>

      <h2>5. Retention</h2>
      <p>We keep information while your account is active and as reasonably needed to provide the service, resolve disputes, prevent fraud, enforce agreements, and comply with law. After a valid deletion request, we delete or de-identify information unless continued retention is required or permitted by law. Public information may remain in third-party caches or copies outside our control.</p>

      <h2>6. Your Choices and Rights</h2>
      <p>You can edit profile information and make supported sections private from your account. Depending on where you live, you may also have rights to access, correct, delete, restrict, object to processing, or receive a portable copy of personal information. Contact <strong>support@verifiedly.app</strong> to make a request. We may need to verify your identity before completing it.</p>

      <h2>7. Cookies</h2>
      <p>Verifiedly uses essential authentication, security, and preference technologies. Blocking them may prevent the service from working. We do not use third-party advertising cookies in this version.</p>

      <h2>8. Age Requirement</h2>
      <p>Verifiedly is not intended for people under 18. If we learn that an ineligible person created an account, we may close the account and delete associated information as required by law.</p>

      <h2>9. International Processing</h2>
      <p>Verifiedly is operated from the United States, and information may be processed in the United States and other countries where our providers operate. Where required, we use legally recognized transfer mechanisms. Local privacy rights remain available where applicable.</p>

      <h2>10. Changes</h2>
      <p>We may update this policy. We will provide reasonable notice of material changes and update the date above.</p>

      <h2>11. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Privacy;
