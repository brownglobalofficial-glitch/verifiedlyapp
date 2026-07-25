# Verifiedly Tap mobile regression checklist

Use this checklist before each Tap Card launch build.

## Customer Tap page

- No horizontal scrolling at 320, 360, 375, 390, or 412 CSS pixels wide.
- Front and back card previews stay fully visible.
- Long names, titles, and handles remain inside the physical-card preview.
- The QR code remains square and scannable.
- The official Verifiedly V mark remains in the bottom-right on both sides.
- All print and shipping fields fit the viewport.
- Approval labels wrap without pushing checkboxes off screen.
- The $29.99 or $19.99 price does not overlap its label.
- Pre-order and Pro buttons wrap instead of clipping.
- Success, canceled, and error notices are readable.
- Customer order status and tracking links wrap safely.

## Admin fulfillment page

- Header actions stack on mobile.
- Filters fit a 320-pixel viewport.
- Names, handles, addresses, card serials, NFC links, and supplier IDs wrap.
- Copy, QR, save, email, CSV import, and refresh controls remain usable.
- Supplier and tracking inputs stay within the card.
- No order card creates horizontal scrolling.

## Functional payment test

- Complete one Stripe test payment from a phone-sized viewport.
- Confirm the webhook returns HTTP 200.
- Confirm one paid preorder appears for the customer and administrator.
- Confirm a canceled checkout creates no preorder.
