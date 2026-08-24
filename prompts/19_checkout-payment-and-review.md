# Checkout II — Payment, Store Credit, Coupon & Review

**Prompt 19 of 30**

## Depends on

Prompt 18 (checkout shell — same file, lands first), Prompts 01/02/03.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). In `src/pages/Checkout/Checkout.js`, step 2 (Payment) renders: the coupon box (`apiService.coupons.validate(code, subtotal)`, derived `couponDiscountFor` with max-cap note, auto-remove-below-minimum effect); the store-credit section (shown when `walletBalance > 0` from `apiService.wallet.getBalance`; checkbox auto-fills `maxApplicableCredit = min(balance,total)`, numeric input + Use Max, clamps, live applied/remaining rows; `fullyCovered` hides the method list entirely); `PAYMENT_OPTIONS` = card / upi / net_banking / wallet / cod with per-method inline forms and COD gating from settings (`codEnabled/codMinOrder/codMaxOrder`, force-reset to "card" when out of range, disabled hint). Step 3 (Review) shows address/shipping/payment blocks with Edit jumps and places the order (`placeOrder` → `createOrder` → `apiService.orders.create`; `paymentMethod: "store_credit"` + `paymentStatus: "paid"` when fully covered; `"pending"` for COD; then `clearCart({silent:true})` → `/order-confirmation/:orderNumber`).

## Objective

Redesign the Payment and Review steps into calm, trustworthy editorial forms — dignified method selection, an honest store-credit module, a quiet coupon affordance, a confident final review — with every rule, clamp, and payload field untouched.

## Scope — files/areas to touch

- `src/pages/Checkout/Checkout.js` + `Checkout.module.css` — step 2 and step 3 render blocks + their styles (shell/steps 0–1 are Prompt 18's; reuse its shell classes).

## Brand & design requirements

1. **Coupon:** hairline underline input (uppercase transform kept) + quiet Apply; applied = small ink chip (CODE + amount + "· capped at max discount ₹X" note when `capped`) with remove ×; errors and the auto-removed-below-minimum message as calm inline text.
2. **Store credit:** an elegant wallet module — serif balance line ("₹N available"), refined checkbox/toggle, amount input + "Use Max" hairline button, live rows (Store credit applied / Remaining to pay). `fullyCovered` state becomes a gracious note ("Fully covered by your store credit") replacing the method list — exactly the current logic.
3. **Payment methods:** replace emoji icons with refined inline SVG marks; methods as hairline radio rows that expand their inline form beneath (card number/expiry/CVV/name; UPI ID; bank select; COD note). Disabled COD row shows its `codHint` ("Available for orders between ₹X–₹Y") in muted text. Forms styled to the Prompt 18 input language. (These are mock inputs — no gateway; do not add validation beyond what exists.)
4. **Review step:** three hairline summary blocks (Ship to / Delivery method / Payment) each with a quiet "Edit" underline (jump targets preserved), the line-item list, and the final CTA — a full-width primary `sf-btn` ("Place Order — ₹N" with the real `amountPayable`), with the placing/loading state.
5. **Summary rail rows** (styled in 18) now live-verified: Discount, Store Credit, Amount Payable appear/disappear correctly.

## Functional guardrails

1. Money math & payload are SACRED — zero edits to: `couponDiscountFor`, tax/total formulas, `maxApplicableCredit`/`storeCreditApplied` clamps and the shrink-effect, `amountPayable`, COD availability logic + force-reset effect, and the full `placeOrder` payload (items with variant-suffixed names/sku/subtotals, addresses, `subtotal/discountAmount/couponCode/shippingAmount/taxAmount/total/storeCreditUsed/amountPayable/paymentMethod/paymentStatus/fulfillmentStatus:"unfulfilled"/shippingStatus:"pending"`). Mock-mode side effects (payment record, coupon redemption, wallet debit) happen inside `apiService.orders.create` — untouched.
2. API-driven as-is: `coupons.validate`, `wallet.getBalance`, `settings.get`, `orders.create` via OrderContext.
3. Tokens/primitives only; zero hex; no emoji.
4. Do NOT modify the admin panel.
5. Responsive + accessible: method radios keyboard-operable with expanded-form focus order; inputs labeled + `autocomplete`/`inputmode` where apt; the capped/auto-removed coupon notes are announced (aria-live polite); place-order button state communicated. No fabricated trust signals — a single honest "Secure checkout" line max, backed by store policy.
6. Preserve step transitions/scroll behavior from Prompt 18.
7. Test before done — the matrix below is mandatory.

## Implementation notes

- Wallet test data: seed user id 3 has wallet credit (walletTransactions); log in as that user (see `db.json` users[2] email/password) to exercise store credit; user@example.com has 0 (module hidden — verify).
- COD bounds come from `settings.payment` in `db.json` (`codMinOrder`/`codMaxOrder`/`codEnabled`) — test by building carts around the limits.
- Coupons: use seeded codes; find one percentage-with-cap to see the capped note.
- After placing each test order, check Admin → Orders / Payments / Coupons reflect it (mock cascades) — that proves the payload untouched.

## Acceptance criteria

- [ ] Payment + Review read editorial and trustworthy — refined radios, no emoji, calm forms.
- [ ] Coupon: apply/remove/error/cap-note/auto-remove all styled and functional.
- [ ] Store credit: hidden at 0 balance; partial apply updates Remaining/Amount Payable; Use Max; fully-covered hides methods and places a `store_credit` paid order.
- [ ] COD: gated by settings bounds with hint; out-of-range force-resets to card.
- [ ] Orders place successfully for: online-paid, COD, partial store credit + online, fully store credit — each landing on `/order-confirmation/:orderNumber` with correct figures, and each visible in Admin → Orders/Payments with correct statuses.
- [ ] Review-step Edit jumps work; light/dark parity; keyboard pass; no hex.

## Test & QA

- Full matrix (mock mode): (1) card + coupon, (2) COD inside bounds, (3) COD out-of-bounds attempt, (4) partial store credit (login as the seeded wallet user), (5) fully-covered store credit, (6) coupon below-minimum auto-removal by editing cart from step 0.
- Verify math by hand once: subtotal − discount + shipping + tax = total; total − credit = amount payable; rail matches Review matches Confirmation.
- Admin: new orders/payments rows correct (store-credit order shows `store_credit` payment, COD pending); coupon `usedCount` advanced.
- Both themes; 375/768/1280; keyboard-only order placement.
- Admin untouched.
