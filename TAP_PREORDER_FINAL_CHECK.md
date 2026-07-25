# Tap preorder final readiness gate

Do not publicly promote paid preorders until all items are complete:

- Latest frontend is published.
- Latest Tap Edge Functions are deployed.
- Test-mode payment completed successfully.
- Webhook delivery returned HTTP 200.
- Paid preorder appeared once in customer and admin views.
- Supplier account and locked template are approved.
- BrownGlobal authorized adult approved live Stripe and supplier use.
- Terms and Refund Policy are published.
- Mobile checks pass at 320–412 pixel widths.

After these checks, enable the live server flag and complete one controlled live preorder before wider promotion.
