import { Link } from "react-router-dom";

const Refunds = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground"><em>Last updated: April 20, 2026</em></p>

      <p>
        This policy explains who is responsible for refunds on Verifiedly. In short:
        <strong> creators are the merchants of record for everything they sell</strong>,
        and <strong>BrownGlobal Holdings LLC</strong> (the Platform) is the merchant of
        record only for Platform subscription plans (Pro and Elite).
      </p>

      <h2>1. Quick Summary</h2>
      <table>
        <thead>
          <tr>
            <th>What you bought</th>
            <th>Who refunds it</th>
            <th>How to request</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Platform plan (Pro, Elite)</td>
            <td>Verifiedly</td>
            <td>Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a></td>
          </tr>
          <tr>
            <td>A creator's product, tip, or subscription</td>
            <td>The creator</td>
            <td>Contact the creator first; escalate to us if unresolved</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Platform Subscriptions (Pro &amp; Elite)</h2>
      <p>
        If you upgrade to a paid Verifiedly plan, the Platform charges your card directly.
      </p>
      <ul>
        <li>
          <strong>14-day refund window.</strong> You can request a full refund within 14 days
          of your initial upgrade if you have not made meaningful use of paid features.
        </li>
        <li>
          <strong>Renewals.</strong> Recurring monthly charges are non-refundable once the new
          billing period has started, but you can cancel any time and keep access until the
          end of the period.
        </li>
        <li>
          <strong>How to request.</strong> Email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with
          the email on your account. We respond within 5 business days.
        </li>
      </ul>

      <h2>3. Creator Sales (Products, Tips, Subscriptions)</h2>
      <p>
        When you buy a digital product, send a tip, or subscribe to a creator's tier, you
        are buying directly from that creator. They are the seller and merchant of record.
        Verifiedly only provides the technology and payment rails (via Stripe Connect).
      </p>
      <ul>
        <li>
          <strong>Refund authority.</strong> Only the creator can approve a refund for their
          own sales. The Platform cannot unilaterally refund a creator's earnings.
        </li>
        <li>
          <strong>Step 1 — Contact the creator.</strong> Use the contact information on the
          creator's profile or any receipt you received. Allow them up to 7 days to respond.
        </li>
        <li>
          <strong>Step 2 — Escalate to us.</strong> If the creator does not respond, the
          product is materially different from what was described, or the file was never
          delivered, email <a href="mailto:support@verifiedly.app">support@verifiedly.app</a> with
          your purchase details. We will mediate and, where appropriate, remove the listing
          and assist with a chargeback.
        </li>
        <li>
          <strong>Tips.</strong> Tips are voluntary gifts and are generally non-refundable
          unless the creator agrees.
        </li>
        <li>
          <strong>Recurring subscriptions to creators.</strong> You can cancel any time from
          your fan dashboard. Cancellations stop future renewals but do not refund the
          current period unless the creator agrees.
        </li>
      </ul>

      <h2>4. Digital Goods Disclosure</h2>
      <p>
        Most items sold on Verifiedly are digital goods that are delivered immediately upon
        purchase. By completing checkout, you acknowledge that you are receiving digital
        content right away and that statutory rights to withdraw from a purchase of digital
        content may not apply once the download begins, except as required by your local
        consumer-protection laws.
      </p>

      <h2>5. Chargebacks &amp; Disputes</h2>
      <p>
        If you file a chargeback with your bank instead of contacting the creator or us
        first, Stripe will deduct the disputed amount from the creator's account along with
        a dispute fee. We strongly encourage you to reach out first so we can resolve the
        issue without involving your bank.
      </p>

      <h2>6. Fraud, Abuse &amp; Policy Violations</h2>
      <p>
        We may issue refunds, reverse payouts, or remove listings without the creator's
        consent if we determine in good faith that a sale involves fraud, intellectual
        property infringement, illegal content, or any other violation of our Terms of
        Service.
      </p>

      <h2>7. Contact</h2>
      <p>
        Refund questions: <a href="mailto:support@verifiedly.app">support@verifiedly.app</a>
        <br />
        Operated by BrownGlobal Holdings LLC.
      </p>
    </div>
  </div>
);

export default Refunds;
