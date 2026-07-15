import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Privacy = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <Helmet>
      <title>Privacy Policy — Verifiedly</title>
      <meta name="description" content="How Verifiedly collects, uses, and protects your personal information, including Stripe Identity verification data and account details." />
      <link rel="canonical" href="https://verifiedly.app/privacy" />
      <meta property="og:title" content="Privacy Policy — Verifiedly" />
      <meta property="og:description" content="How Verifiedly collects, uses, and protects your personal information across the platform." />
      <meta property="og:url" content="https://verifiedly.app/privacy" />
    </Helmet>
    <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: March 27, 2026</em></p>

      <p>This Privacy Policy describes how <strong>BrownGlobal Holdings LLC</strong> ("the Company," "we," "us," or "our"), operating the Verifiedly platform ("the Platform"), collects, uses, and protects your personal information.</p>

      <h2>1. Information We Collect</h2>
      <h3>Information You Provide</h3>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, username, password</li>
        <li><strong>Date of Birth:</strong> Collected at signup to confirm you are 18 or older. Stored securely and never displayed publicly.</li>
        <li><strong>Profile Information:</strong> Display name, biography, avatar image, social media links, category</li>
        <li><strong>Content:</strong> Digital products, bio links, subscription tiers, and other creator content</li>
        <li><strong>Payment Information:</strong> Processed securely by our third-party payment processor (Stripe). We do not store your full payment card details.</li>
        <li><strong>Identity Verification Data:</strong> If you choose to verify your identity, the ID document image and selfie are collected and processed by <strong>Stripe Identity</strong> — not by us. We only receive and store the verification result (verified / not verified), your legal name, country, and date of birth. Business accounts also submit their business name and country of registration. Verification is optional and required only to earn the blue checkmark.</li>
        <li><strong>Communications:</strong> Messages sent through the Platform, support requests</li>
      </ul>
      <h3>Information Collected Automatically</h3>
      <ul>
        <li><strong>Usage Data:</strong> Page views, link clicks, interaction analytics, referral sources</li>
        <li><strong>Device Information:</strong> Browser type, operating system, IP address (hashed for analytics)</li>
        <li><strong>Cookies:</strong> Essential cookies for authentication and session management</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide, maintain, and improve the Platform</li>
        <li>To process transactions and manage subscriptions</li>
        <li>To provide analytics to creators about their audience</li>
        <li>To communicate with you about your account, updates, and promotional offers</li>
        <li>To enforce our Terms of Service and protect against fraud</li>
        <li>To comply with legal obligations</li>
        <li>To administer the referral program</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>BrownGlobal Holdings LLC does not sell your personal information. We may share information with:</p>
      <ul>
        <li><strong>Service Providers:</strong> Third-party services that help us operate the Platform, including hosting (Supabase), payment processing (Stripe), and analytics</li>
        <li><strong>Legal Requirements:</strong> When required by law, subpoena, court order, or to protect our rights, property, or safety</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, reorganization, or sale of assets</li>
        <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>We implement industry-standard security measures including encryption in transit (TLS/SSL), secure password hashing, row-level security on all database tables, and column-level access controls on sensitive fields (date of birth and identity data are restricted to service-role access only). ID document images and selfies are handled exclusively by Stripe Identity and never touch our servers. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

      <h2>5. Data Retention</h2>
      <p>We retain your personal information for as long as your account is active or as needed to provide services. Upon account deletion, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention).</p>

      <h2>6. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access and receive a copy of your personal data</li>
        <li>Correct inaccurate personal data</li>
        <li>Request deletion of your account and personal data</li>
        <li>Object to or restrict processing of your data</li>
        <li>Data portability</li>
        <li>Opt out of marketing communications</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p>To exercise these rights, contact <strong>support@verifiedly.app</strong>.</p>

      <h2>7. Cookies</h2>
      <p>We use essential cookies for authentication and session management. We do not use third-party advertising or tracking cookies. You can configure your browser to refuse cookies, but some Platform features may not function properly.</p>

      <h2>8. Children's Privacy</h2>
      <p>The Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If we learn that we have collected data from a minor, we will delete it promptly.</p>

      <h2>9. International Data Transfers</h2>
      <p>BrownGlobal Holdings LLC is organized under the laws of the State of Georgia, United States, and operates the Platform from the United States. Your personal data may be processed in the United States and other countries where our service providers operate. For users in the European Economic Area, the United Kingdom, or Switzerland, we rely on Standard Contractual Clauses or other appropriate safeguards as required by GDPR / UK GDPR. EU/UK residents have the right to lodge a complaint with their local supervisory authority.</p>

      <h2>9a. International Users (GDPR / UK / Global)</h2>
      <p>If you are accessing the Platform from outside the United States, you acknowledge and consent to the collection, transfer, storage, and processing of your information in the United States. We honor data-subject rights granted by the GDPR, UK GDPR, and similar laws including Brazil (LGPD), Canada (PIPEDA), and Australia (Privacy Act). Requests can be submitted to <strong>support@verifiedly.app</strong>.</p>

      <h2>10. California Privacy Rights (CCPA)</h2>
      <p>California residents have additional rights under the CCPA, including the right to know what personal information is collected, the right to delete, and the right to opt out of the sale of personal information. We do not sell personal information.</p>

      <h2>11. Changes to This Policy</h2>
      <p>BrownGlobal Holdings LLC may update this Privacy Policy from time to time. We will notify registered users of material changes via email. The "Last updated" date at the top indicates when the policy was last revised.</p>

      <h2>12. Contact</h2>
      <p>For privacy-related questions or to exercise your rights, contact us at:</p>
      <p>
        <strong>BrownGlobal Holdings LLC</strong><br />
        Email: <strong>support@verifiedly.app</strong>
      </p>
    </div>
  </div>
);

export default Privacy;
