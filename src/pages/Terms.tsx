import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <Helmet>
      <title>Terms of Service — Verifiedly</title>
      <meta name="description" content="Terms for Verifiedly official profiles, public information, links, and future verification features." />
      <link rel="canonical" href="https://verifiedly.app/terms" />
      <meta property="og:title" content="Terms of Service — Verifiedly" />
      <meta property="og:description" content="Terms for using Verifiedly official profiles and verification features." />
      <meta property="og:url" content="https://verifiedly.app/terms" />
    </Helmet>
    <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground"><em>Last updated: July 18, 2026</em></p>

      <h2>1. Acceptance</h2>
      <p>Verifiedly is operated by <strong>BrownGlobal Holdings LLC</strong> ("Verifiedly," "we," "us," or "our"). By accessing or using Verifiedly, you agree to these Terms. If you do not agree, do not use the service.</p>

      <h2>2. Eligibility</h2>
      <p>You must be at least 13 years old to create or use a Verifiedly account. If you are under the age of legal majority where you live, you must have permission from a parent or legal guardian. You represent that your registration information is accurate.</p>

      <h2>3. Accounts and Security</h2>
      <p>You are responsible for safeguarding your account credentials and for activity under your account. Notify <strong>support@verifiedly.app</strong> promptly if you believe your account has been accessed without permission. We may require additional checks before restoring or changing access to an account.</p>

      <h2>4. Profiles and User-Provided Information</h2>
      <p>Verifiedly lets individuals and organizations publish structured profiles, including names, links, work, education, credentials, licenses, awards, and accomplishments. You retain ownership of information you submit. You grant us a limited, non-exclusive license to host, format, display, and distribute that information as needed to operate and promote the service.</p>
      <p>You must have the right to publish everything you add. You may not impersonate another person or organization or submit information that is deceptive, unlawful, infringing, or harmful.</p>

      <h2>5. What Verification Means</h2>
      <p>New identity-verification enrollment is currently paused while Verifiedly finalizes its verification method. If verification is offered, the profile will explain the provider used and exactly what a badge or label means. Existing verified profiles may continue to display the result of a previously completed check.</p>
      <p>A Verified badge does not verify every statement, link, credential, accomplishment, organization, or other claim on a profile. Unless Verifiedly clearly labels a specific item otherwise, profile information is supplied by the profile owner and should be evaluated independently.</p>

      <h2>6. Verification Availability and Pricing</h2>
      <p>Verifiedly is not currently offering new paid or free verification checks, and no verification subscription is available. Before any future verification method launches, Verifiedly will disclose the provider, information requested, price if any, and applicable terms before a user begins.</p>

      <h2>7. Third-Party Links and Services</h2>
      <p>Profiles may link to third-party websites and social accounts. Verifiedly does not control or endorse those services and is not responsible for their content, availability, privacy practices, or transactions. Your use of a third-party service is governed by that service's terms.</p>

      <h2>8. Prohibited Conduct</h2>
      <ul>
        <li>Impersonating a person or organization or misrepresenting your identity or authority</li>
        <li>Publishing unlawful, defamatory, infringing, fraudulent, or privacy-invasive content</li>
        <li>Trying to bypass authentication, verification, rate limits, or access controls</li>
        <li>Using automated systems to scrape, disrupt, overload, or abuse the service</li>
        <li>Using Verifiedly to facilitate fraud, money laundering, harassment, or other illegal activity</li>
        <li>Misusing the Verified badge or suggesting that it verifies claims it does not verify</li>
      </ul>

      <h2>9. Our Intellectual Property</h2>
      <p>The Verifiedly name, marks, software, design, and other platform materials are owned by BrownGlobal Holdings LLC or its licensors. These Terms do not grant permission to copy or use our branding except as needed to use the service normally.</p>

      <h2>10. Suspension and Termination</h2>
      <p>We may restrict, suspend, remove a badge from, or terminate an account when reasonably necessary to protect users, enforce these Terms, comply with law, address fraud or security concerns, or protect the service. You may request account deletion by contacting <strong>support@verifiedly.app</strong>.</p>

      <h2>11. Disclaimers</h2>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" TO THE EXTENT PERMITTED BY LAW. WE DO NOT GUARANTEE THAT VERIFIEDLY WILL ALWAYS BE AVAILABLE, ERROR-FREE, OR SUITABLE FOR A PARTICULAR PURPOSE. WE DO NOT GUARANTEE THE TRUTH OR COMPLETENESS OF USER-PROVIDED PROFILE INFORMATION.</p>

      <h2>12. Limitation of Liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, BROWNGLOBAL HOLDINGS LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO VERIFIEDLY. NOTHING IN THESE TERMS EXCLUDES LIABILITY THAT CANNOT LEGALLY BE EXCLUDED.</p>

      <h2>13. Indemnification</h2>
      <p>To the extent permitted by law, you agree to defend, indemnify, and hold BrownGlobal Holdings LLC harmless from claims, losses, and expenses arising from your unlawful use of Verifiedly, your profile content, or your violation of these Terms or another party's rights.</p>

      <h2>14. Governing Law and International Users</h2>
      <p>These Terms are governed by the laws of the State of Georgia, United States, without regard to conflict-of-law rules. Nothing here limits non-waivable consumer or data-protection rights that apply where you live. You are responsible for ensuring that your use of Verifiedly is lawful in your jurisdiction.</p>

      <h2>15. Changes</h2>
      <p>We may update these Terms. If a change is material, we will provide reasonable notice, such as by email or an in-product message. Continued use after the effective date means you accept the updated Terms.</p>

      <h2>16. Contact</h2>
      <p><strong>BrownGlobal Holdings LLC</strong><br />Email: <strong>support@verifiedly.app</strong></p>
    </div>
  </div>
);

export default Terms;
