# Verifiedly Identity and Documents setup

The code separates three products:

- Public profile: free.
- Verifiedly Identity: $9.99 one time.
- Verifiedly Documents: $4.99 monthly or $39 yearly.

Run all payment and Identity setup in Stripe test mode first. An adult authorized representative of BrownGlobal Holdings LLC must own and complete the Stripe account and accept Stripe's agreements.

## 1. Create the Stripe Identity flow

In Stripe Dashboard, open Identity → Verification flows → Create flow.

Use these settings:

- Name: `Verifiedly Identity`
- Type: `Document`
- Add selfie check: on
- Add ID number check: off
- Require live capture: on
- Allowed documents: driving license, ID card, and passport
- Verify email: off
- Verify phone: off
- Return URL: `https://verifiedly.app/dashboard/verification?identity=returned`

This configuration gives the badge one clear meaning: the account holder completed a government-ID and face-match check. ID-number checks collect more sensitive information and have narrower coverage. Email is already confirmed through account authentication and does not prove identity.

After saving, copy the Verification Flow ID. It starts with `vf_`.

## 2. Add Supabase Edge Function secrets

Add these separately in test and live environments:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_IDENTITY_FLOW_ID` — the `vf_...` value from step 1
- `VERIFIEDLY_ALLOWED_ORIGINS` — optional comma-separated exact preview origins if the preview URL changes

Never put these values in `VITE_` environment variables or commit them to GitHub.

## 3. Apply backend changes

Apply this migration:

- `supabase/migrations/20260718190000_verifiedly_identity_documents.sql`

Deploy these new or changed functions:

- `create-identity-checkout`
- `create-identity-session`
- `check-identity-status`
- `create-documents-checkout`
- `confirm-documents-checkout`
- `create-document-share`
- `access-document-share`
- `customer-portal`
- `stripe-webhook`

The migration creates a private `documents` bucket, billing entitlements, revocable share links, and access policies. Do not create a public Documents bucket.

## 4. Configure the Stripe webhook

Point the Stripe webhook endpoint to the deployed `stripe-webhook` Edge Function and subscribe to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `identity.verification_session.verified`
- `identity.verification_session.requires_input`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## 5. Test before live mode

Verify all of these in Stripe test mode:

1. A user can create a free profile without paying.
2. Identity checkout charges $9.99 and then opens Stripe Identity.
3. A payment alone never creates a badge.
4. A successful Identity event creates the identity badge.
5. A failed or incomplete check does not create a badge.
6. Documents checkout offers $4.99 monthly and $39 yearly.
7. A user without an active Documents plan cannot upload or download.
8. A subscriber can upload only PDF, JPG, PNG, or WebP files up to 10 MB.
9. A secure document link expires, can be password protected, and can be revoked.
10. Canceling a subscription removes access after the paid period while deletion remains available through support.

Before accepting real documents, obtain privacy/security counsel review of the Terms, Privacy Policy, retention process, incident-response process, vendor agreements, and applicable state or country requirements. Configure tax collection with a qualified accountant or Stripe Tax before live billing where required.
