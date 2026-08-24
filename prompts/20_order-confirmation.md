# Order Confirmation — the Thank-You Moment

**Prompt 20 of 30**

## Depends on

Prompt 19 (orders can be placed through the redesigned checkout), Prompts 01/02/03.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/order-confirmation/:orderNumber` (`src/pages/OrderConfirmation/OrderConfirmation.js`) fetches via `apiService.orders.getByOrderNumber`, and renders: loading / fetch-error (Try Again + View Order History) / not-found states; success = animated check + "Order Confirmed!", order-number banner with copy button, estimated-delivery banner (`createdAt + 5 days`, or real `deliveredAt` when delivered), a content grid (Order Summary with full totals incl. Store Credit + Amount Paid; Shipping Address; Payment Method with a real `paymentStatus`-derived badge; Actions: Continue Shopping / View Orders / Track Order / Download Invoice placeholder), plus a one-shot `canvas-confetti` burst (reduced-motion guarded, hardcoded colors).

## Objective

Turn the confirmation into a warm editorial thank-you — serif gratitude, refined order record, quiet celebration — preserving every state, the money rows, honest status badges, and the confetti guard.

## Scope — files/areas to touch

- `src/pages/OrderConfirmation/OrderConfirmation.js` + `OrderConfirmation.module.css`

## Brand & design requirements

1. **Hero moment:** replace the bouncy check-circle with a restrained mark (thin-stroke check or gold seal motif) + serif headline ("Thank you, {firstName}." / "Your order is confirmed") + one warm line. Confetti: KEEP the one-shot + `prefers-reduced-motion` guard, but update the hardcoded color array to the new palette values (read the final hexes from `storefront-tokens.css`, sync-comment them) and soften density — a brief gold shimmer, not a party.
2. **Order record:** order number as a tracked-mono line with the copy affordance (copied-state feedback kept); "Placed on" date; estimated-delivery as a quiet hairline banner (real logic kept — actual `deliveredAt` when delivered).
3. **Content grid:** hairline cards → editorial blocks: Order Summary (items + Subtotal/Discount/Shipping/Tax/serif Total, then Store Credit + Amount Paid rows when `storeCreditUsed > 0` — order preserved), Shipping Address (`normalizeOrderAddress`), Payment (method + the `paymentStatusInfo` badge restyled as a quiet status chip — paid/pending-COD/failed/refunded/partially_refunded states all styled honestly).
4. **Actions:** Continue Shopping (primary), View Orders, Track Order (behavior as-is), Download Invoice — keep it visibly a placeholder exactly as the code treats it (an `alert()`); do not dress it as a working feature (honesty rule) — a muted "coming soon" affordance is ideal.
5. **Error/not-found/loading states** restyled in the same language (Try Again preserved).

## Functional guardrails

1. Preserve all functionality & the API contract: `orders.getByOrderNumber(orderNumber)` fetch + retry; every derived field (dates via `formatDate`, currency via `formatCurrency`, delivery estimate math, status badge derivation from real `order.paymentStatus`); copy-to-clipboard; the confetti `confettiFiredRef` one-shot + reduced-motion guard.
2. Money rows must match the placed order exactly — presentation only.
3. Tokens only; the confetti color literals are the documented exception (sync-commented).
4. Do NOT modify the admin panel.
5. Responsive + accessible: headline hierarchy; copy button labeled with feedback announced; status chip has text (never color-only); grid collapses to one column on mobile.
6. No fabricated trust signals — no fake delivery guarantees; the estimate is presented as an estimate.
7. Test before done — see below.

## Implementation notes

- Reach this page only via a real placement (COD is fastest) — deep-link an existing seeded `orderNumber` from `db.json` too (covers historic shapes, e.g. a refunded order's badge).
- Test the store-credit rows with a partial-credit order (Prompt 19 matrix user).
- Not-found: visit `/order-confirmation/ORD-NOPE` → styled not-found with working links.
- `useTheme`'s `isDarkMode` class gate exists here — keep the pattern.

## Acceptance criteria

- [ ] Page reads as a warm editorial thank-you — restrained celebration, serif gratitude; visibly redesigned.
- [ ] All four states (loading / error+retry / not-found / success) styled and functional.
- [ ] Totals (incl. Store Credit + Amount Paid), address, payment badge all correct for: fresh COD order, fresh paid order, partial-credit order, seeded refunded order.
- [ ] Copy button works with feedback; Track Order + View Orders + Continue Shopping navigate; invoice stays an honest placeholder.
- [ ] Confetti fires once on success, in brand colors, and NOT under reduced motion.
- [ ] Light/dark parity; 375→1440; no undocumented hex.

## Test & QA

- `npm run dev`: place a COD order → land here; reload the URL → still renders (fetch-by-number path).
- Deep-link a seeded order number (see `db.json` orders) → refunded/partial badges styled.
- Reduced-motion OS setting → no confetti, static mark.
- Keyboard: copy, all action links.
- Both themes; 375/768/1280.
- Admin untouched.
