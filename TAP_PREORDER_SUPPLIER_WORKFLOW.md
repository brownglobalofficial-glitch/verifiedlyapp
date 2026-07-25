# Manual Tap Card supplier workflow

For the first preorder batch, BrownGlobal should place supplier orders manually rather than connect an API.

1. Confirm Stripe shows the payment as successful.
2. Open the paid preorder in `/dashboard/admin/tap-orders`.
3. Compare the approved name, title, handle, QR URL, NFC URL, and template version against the locked card preview.
4. Submit the order through the approved supplier's dashboard using the locked white Verifiedly template.
5. Save the supplier name and supplier order ID.
6. Update the status to `submitted`, then `production`, `shipped`, and `delivered` as appropriate.
7. Add the tracking number and URL.
8. Email the customer the status from the admin queue.
9. Use CSV import for bulk tracking updates when the supplier provides a spreadsheet.

Do not send Stripe data, identity-verification information, IDs, selfies, passwords, private messages, or other unnecessary profile information to the card supplier.
