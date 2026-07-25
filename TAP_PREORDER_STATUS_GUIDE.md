# Tap preorder status guide

- `paid`: Stripe confirmed payment; awaiting BrownGlobal review.
- `manual_review`: BrownGlobal is checking approved print and shipping details.
- `submitted`: BrownGlobal placed the manual supplier order.
- `production`: The supplier is printing or encoding the card.
- `shipped`: Tracking has been added and the card is in transit.
- `delivered`: Delivery is confirmed.
- `canceled`: The preorder was canceled before completion.
- `refunded`: Stripe refund was issued.
