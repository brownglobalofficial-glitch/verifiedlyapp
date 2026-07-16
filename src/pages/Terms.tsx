import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <Helmet>
      <title>Terms of Service — Verifiedly</title>
      <meta name="description" content="The Verifiedly Terms of Service covering account eligibility, subscription tiers, identity verification, refunds, and creator content ownership." />
      <link rel="canonical" href="https://verifiedly.app/terms" />
      <meta property="og:title" content="Terms of Service — Verifiedly" />
      <meta property="og:description" content="Rules of the road for using Verifiedly: accounts, subscriptions, identity verification, and creator content." />
      <meta property="og:url" content="https://verifiedly.app/terms" />
    </Helmet>
    <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground"><em>Last updated: March 27, 2026</em></p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using Verifiedly ("the Platform"), operated by <strong>BrownGlobal Holdings LLC</strong> ("the Company," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.</p>

      <h2>2. Company Information</h2>
      <p>Verifiedly is owned and operated by BrownGlobal Holdings LLC. For questions regarding these Terms, contact us at <strong>support@verifiedly.app</strong>.</p>

      <h2>3. Eligibility</h2>
      <p>You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Platform. By registering, you represent and warrant that you meet this requirement.</p>

      <h2>4. Account Registration</h2>
      <p>You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are solely responsible for safeguarding your password and for all activities conducted under your account. You must notify us immediately of any unauthorized use.</p>

      <h2>5. Account Types and Subscriptions</h2>
      <p>The Platform offers the following tiers:</p>
      <ul>
        <li><strong>Free:</strong> Basic access with a 10% platform fee on transactions.</li>
        <li><strong>Verifiedly Pro ($9.99/mo):</strong> Reduced 3% platform fee, paid subscription tiers, advanced analytics, and free identity verification. Pro does <em>not</em> grant a verified badge on its own.</li>
        <li><strong>Identity Verification ($4.99 one-time):</strong> Government-ID + selfie check via Stripe Identity. Grants the blue verified badge. Non-refundable once the ID scan runs. Free for Verifiedly Pro subscribers.</li>
      </ul>
      <p>Subscription fees are billed monthly and are non-refundable except as required by applicable law. The one-time identity verification fee is non-refundable once the Stripe Identity scan has been initiated. We reserve the right to change pricing with 30 days' notice.</p>

      <h2>6. Creator Content</h2>
      <p>Creators retain full ownership of all content they upload to the Platform. By posting content, you grant BrownGlobal Holdings LLC a non-exclusive, worldwide, royalty-free, sublicensable license to display, distribute, and promote your content on and in connection with the Platform.</p>
      <p>You represent and warrant that you have all necessary rights to the content you upload and that your content does not violate any applicable laws or third-party rights, including intellectual property and privacy rights.</p>

      <h2>7. Referral Program</h2>
      <p>Users may earn referral commissions (10% of the referred user's first subscription payment) when a referred user subscribes to a paid plan. BrownGlobal Holdings LLC reserves the right to modify, suspend, or terminate the referral program at any time. Abuse of the referral system, including self-referrals or fraudulent activity, will result in forfeiture of commissions and potential account termination.</p>

      <h2>8. Marketplace</h2>
      <p>Business accounts may post sponsorship and affiliate campaigns. Creators may apply to campaigns. BrownGlobal Holdings LLC does not guarantee any outcomes from marketplace interactions and is not a party to agreements between businesses and creators.</p>

      <h2>9. Prohibited Conduct</h2>
      <ul>
        <li>Uploading illegal, harmful, defamatory, or infringing content</li>
        <li>Impersonating another person or entity</li>
        <li>Attempting to gain unauthorized access to the Platform or its systems</li>
        <li>Using the Platform for money laundering, fraud, or any illegal activity</li>
        <li>Harassing, threatening, or abusing other users</li>
        <li>Manipulating the referral system or platform metrics</li>
        <li>Scraping, data mining, or automated access to the Platform</li>
      </ul>

      <h2>10. Payments & Fees</h2>
      <p>All payments are processed through Stripe, Inc. and Stripe Connect. By using Verifiedly, creators and buyers also agree to the <a href="https://stripe.com/legal/connect-account" target="_blank" rel="noopener noreferrer">Stripe Connected Account Agreement</a> and the <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">Stripe Services Agreement</a>. Platform fees (10% Free / 3% Pro) are deducted automatically as application fees on each transaction. Identity verification uses Stripe Identity, a Stripe service; Stripe collects and stores the government-ID document and selfie under its own privacy policy. BrownGlobal Holdings LLC is not the merchant of record for creator sales — creators are the merchants of record for their own products, subscriptions, and tips, and are solely responsible for fulfillment, customer service, applicable taxes, and any chargebacks or disputes on those sales.</p>

      <h2>10a. Creator Payouts</h2>
      <p>Payouts to creators are made directly by Stripe to the bank account connected via Stripe Connect Express, on Stripe's standard rolling payout schedule (typically every 2 business days for US accounts; varies by country). Verifiedly does not hold creator funds. Stripe may delay, reserve, or withhold payouts as described in the Stripe Connected Account Agreement, including for risk review, disputes, refunds, or compliance reasons. Creators are responsible for keeping their Stripe account, tax forms (e.g., W-9 / W-8BEN, 1099-K where applicable), and bank details up to date. Failure to complete Stripe identity verification will prevent payouts.</p>

      <h2>10b. Refunds & Disputes</h2>
      <p><strong>Subscription fees paid to Verifiedly</strong> (Verifiedly Pro, $9.99/month) are non-refundable except where required by law. You may cancel at any time and will retain access until the end of the current billing period. Verifiedly is 18+ at launch. The $4.99 identity check purchases a verification attempt — not a guaranteed badge — and is non-refundable once Stripe Identity runs the check.</p>
      <p><strong>Creator sales</strong> (digital products, fan subscriptions, tips): refunds are at the sole discretion of the selling creator. Buyers should contact the creator directly first. Verifiedly may, but is not obligated to, mediate disputes. Chargebacks initiated through your bank or card issuer may result in deduction of the disputed amount plus Stripe's dispute fee from the creator's balance. Tips are generally final and non-refundable.</p>
      <p>To request a refund on a creator purchase, contact the creator via their profile contact email; for platform billing issues, contact <strong>support@verifiedly.app</strong>.</p>

      <h2>11. Intellectual Property</h2>
      <p>The Verifiedly name, logo, and Platform design are the exclusive property of BrownGlobal Holdings LLC. You may not use our trademarks, trade names, or branding without prior written permission.</p>

      <h2>12. Termination</h2>
      <p>We may suspend or terminate your account at our sole discretion if you violate these Terms or engage in conduct that we determine is harmful to the Platform or other users. You may delete your account at any time by contacting <strong>support@verifiedly.app</strong>. Upon termination, your right to use the Platform ceases immediately.</p>

      <h2>13. Disclaimer of Warranties</h2>
      <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. BROWNGLOBAL HOLDINGS LLC DOES NOT GUARANTEE UNINTERRUPTED, SECURE, OR ERROR-FREE SERVICE.</p>

      <h2>14. Limitation of Liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BROWNGLOBAL HOLDINGS LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF REVENUE, DATA, OR GOODWILL.</p>

      <h2>15. Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless BrownGlobal Holdings LLC and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising from your use of the Platform or violation of these Terms.</p>

      <h2>16. Governing Law & Dispute Resolution</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to conflict of law principles. Any disputes arising from these Terms shall be resolved through binding arbitration administered by the American Arbitration Association in Atlanta, Georgia, USA. Users outside the United States expressly consent to this venue and to the application of Georgia law, except where local mandatory consumer protection laws apply.</p>

      <h2>16a. International Users</h2>
      <p>The Platform is operated from the United States and is intended for a global audience. By using the Platform from outside the United States, you represent that doing so is lawful in your jurisdiction and you consent to the transfer of your data to, and processing in, the United States and other countries where our service providers operate. You are responsible for compliance with all local laws applicable to your use of the Platform, including tax, consumer, and content regulations. EU/UK residents retain rights described in our Privacy Policy (GDPR/UK GDPR). Nothing in these Terms limits non-waivable consumer rights granted to you by the laws of your country of residence.</p>

      <h2>17. Severability</h2>
      <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>

      <h2>18. Changes to Terms</h2>
      <p>BrownGlobal Holdings LLC reserves the right to modify these Terms at any time. We will notify registered users of material changes via email. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>

      <h2>19. Contact</h2>
      <p>For questions about these Terms, contact us at:</p>
      <p>
        <strong>BrownGlobal Holdings LLC</strong><br />
        Email: <strong>support@verifiedly.app</strong>
      </p>
    </div>
  </div>
);

export default Terms;
