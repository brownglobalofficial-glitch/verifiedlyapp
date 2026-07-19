# Verifiedly provider setup

The application now includes the database and user-interface boundaries for
opt-in discovery, organization verification, and verified credential claims.
It intentionally does **not** issue a badge, take a credential-verification
payment, or claim a provider check occurred until the relevant provider account
is contracted and configured.

## Required for the first credential-verification launch

### Checkr Partner / API account

Use Checkr for the first U.S. education and professional-license workflows.
The authorized BrownGlobal adult representative must:

1. Apply for a Checkr partner/platform account and describe Verifiedly's flow.
2. Confirm in writing that Verifiedly may charge the customer directly or add a
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

Choose one initial provider; do not run both for the same first-market flow.

- **Middesk:** recommended for U.S. business registration/KYB checks.
- **Persona KYB:** recommended when multi-country coverage becomes the priority.

The provider should collect registration numbers, registered addresses,
beneficial-owner information, and supporting documents through its hosted or
approved secure flow. Verifiedly should retain only the provider status, the
safe public badge fields, the checked date, and the recheck date.

Recommended server-only secrets once a provider is contracted:

- `MIDDESK_API_KEY` and `MIDDESK_WEBHOOK_SECRET`, or
- `PERSONA_API_KEY`, `PERSONA_KYB_TRANSACTION_TYPE_ID`, and
  `PERSONA_WEBHOOK_SECRET`

Organization verification should be valid for 12 months, not permanent.

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
