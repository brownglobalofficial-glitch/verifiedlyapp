# Verifiedly provider setup

The application now includes the database and user-interface boundaries for
opt-in discovery, organization verification, and verified credential claims.
It intentionally does **not** issue a badge, take a credential-verification
payment, or claim a provider check occurred until the relevant provider account
is contracted and configured.

## Required for the first credential-verification launch

### Checkr Partner / API account

Use Checkr only for education and professional-license workflows that Checkr
has approved for Verifiedly and supports in the candidate's jurisdiction. It is
not a universal international credential database.
The authorized BrownGlobal adult representative must:

1. Apply for a Checkr partner/platform account and describe Verifiedly's flow.
2. Confirm in writing which countries, institutions, and license types are
   supported and that Verifiedly may charge the customer directly or add a
   disclosed platform fee. If not, let Checkr bill the organization and use the
   approved partner revenue model.
3. Obtain a production API key and the approved education/license package IDs.
4. Confirm the provider-hosted candidate invitation and consent flow.
5. Add production webhook signing credentials and a webhook endpoint.

Recommended server-only secret names:

- `CHECKR_API_KEY`
- `CHECKR_EDUCATION_PACKAGE`
- `CHECKR_LICENSE_PACKAGE`
- `CHECKR_WEBHOOK_SECRET`

Never expose these through `VITE_*` variables or browser code.

### Stripe

Keep Stripe for checkout and billing only. After the Checkr commercial agreement
is approved, create separate Stripe products/prices for:

- U.S. degree verification (planned retail: $24.99)
- U.S. professional-license verification (planned retail: $19.99)

Do not accept payment before coverage and any pass-through fee are known. The
checkout should display the final price before payment and create the provider
order only after the webhook confirms successful payment.

### National Student Clearinghouse (optional second education source)

DegreeVerify can later be used as a direct U.S. degree source. Obtain an
enterprise/web-services agreement before building the adapter. It is optional
for the first Checkr-backed release.

## Required for organization verification

Use **Persona's full KYB product** as the first organization-verification
provider. This is the best fit for Verifiedly's international positioning.
Persona's lightweight U.S. business-verification product is not a substitute
for the full KYB product. Confirm each supported country and data source before
showing a verification checkout.

Middesk can be evaluated later for deeper U.S.-only checks, but should not run
alongside Persona in the initial flow.

The provider should collect registration numbers, registered addresses,
beneficial-owner information, and supporting documents through its hosted or
approved secure flow. Verifiedly should retain only the provider status, the
safe public badge fields, the checked date, and the recheck date.

Recommended server-only secrets once a provider is contracted:

- `PERSONA_API_KEY`, `PERSONA_KYB_TRANSACTION_TYPE_ID`, and
  `PERSONA_WEBHOOK_SECRET`

Organization verification should be valid for 12 months, not permanent.

## Individual identity verification

Continue using Stripe Identity for the optional adult identity badge. Always
check that Verifiedly's Stripe account is eligible to offer Identity in the
business's country before enabling production checkout. Stripe hosts the ID and
selfie flow; Verifiedly should store only the provider session reference,
status, and check date required for the badge.

Stripe's published use-case rules prohibit reselling Identity as an independent
identity-verification service. Obtain written Stripe approval for Verifiedly's
profile-badge use case and its proposed fee before enabling the $9.99 production
checkout. If Stripe does not approve it, keep the badge disabled and evaluate a
contracted Persona identity inquiry instead; do not work around the restriction.

Identity verification remains separate from organization and credential
verification. It must not be presented as a background check or an endorsement.

## Not required yet

No background-check API should be configured in this release. When that phase
begins, use a consumer-reporting-agency hosted flow, require a permissible
purpose and the person's written consent, and keep SSNs and full reports out of
Verifiedly and Supabase.

## Safe status model

- `provider_setup_required`: request saved; no payment or provider order exists.
- `pending` / `in_review`: the provider has an active order.
- `verified`: the provider returned an authoritative match.
- `needs_action`: the provider needs the user to respond in its hosted flow.
- `failed`: the claim was not confirmed; never make the reason public.
- `expired`: the result needs a new check.

Only `verified` claims with `display_public = true` appear on a public profile.
