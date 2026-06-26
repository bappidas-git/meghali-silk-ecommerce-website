<!-- Batch D — Storefront Pages -->
# Prompt 19 — Checkout

## Objective
Re-skin the multi-step **Checkout** page (`src/pages/Checkout/Checkout.{js,module.css}`) to the
*Meghali's Silk* brand while keeping every piece of its commerce logic — coupon apply, store-credit
wallet, shipping methods, GST tax, payment-method selection, and **order creation** — fully intact. The
visual system follows the brand and the cart design; the **money math and the order-creation path must
not change**.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The storefront is **dark-first**: near-black charcoal canvas, deep
bottle-green brand panels, gold/champagne accents, emerald primary CTAs, elegant serif headings.

There is **no dedicated checkout mockup** — derive the look from the brand system and stay consistent
with `UI Designs/ADD TO CART.png` (same surfaces, gold prices, emerald CTAs, serif headings). Layout:
a **multi-step main column** (Cart review → Shipping address + method → Payment → Review & confirm) with
a step indicator, beside a **sticky Order Summary sidebar** (line items, Subtotal, Discount, Shipping,
Tax, Total, and — when store credit is applied — Amount Payable). On mobile the sidebar stacks under the
main column.

Tokens to consume (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-surface-hover`,
  `--sf-color-text`, `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`,
  `--sf-color-border-strong`.
- Brand/accents: `--sf-color-brand-green`, `--sf-color-gold`, `--sf-gradient-gold`, `--sf-color-price`.
- CTA emerald: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`.
- Semantic: `--sf-color-success{,-bg}`, `--sf-color-warning{,-bg}`, `--sf-color-danger{,-bg}`,
  `--sf-color-discount{,-bg}` (for the green discount/savings lines), `--sf-color-compare`.
- Type: `--sf-font-display` for section titles and the Total; `--sf-font-family` for body/inputs.
  Radius/space/shadow/motion via the `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`
  scales; focus ring `--sf-shadow-focus`.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/Checkout/Checkout.js` — re-skin markup/structure only; keep all hooks, handlers,
  state, and the order-math + order-creation logic exactly as-is (changes below are visual/labels and
  the one explicit tax-default note).
- (MODIFY) `src/pages/Checkout/Checkout.module.css` — full re-skin using `var(--sf-*)` tokens.
- **OUT of scope:** `OrderContext`/`createOrder`, `apiService` (shipping/settings/coupons/wallet/orders),
  `CartContext`, the `OrderConfirmation` page (separate prompt), `db.json` shapes, and `src/pages/Admin/*`.

## Detailed Requirements
1. **Keep the step machine.** Preserve the four steps `["Cart","Shipping","Payment","Review"]`, the
   `step` state, `handleNext` gating (cart non-empty → require auth via `openAuthModal("login")` →
   validate address + shipping method → payment → `placeOrder()`), and the Back button. Re-skin the step
   indicator into a branded progress strip: completed steps gold/emerald with a check, the active step a
   gold ring, upcoming steps muted. Each step circle/label stays readable in both themes.
2. **Step 1 — Cart review.** Re-skin the editable line list (thumbnail, name, variant sub-label, gold
   unit price, `- N +` stepper wired to `updateQuantity`, remove wired to `removeFromCart`, line
   subtotal). Keep the coupon block: input (uppercased), **Apply** (emerald) → `applyCoupon()` which
   calls `apiService.coupons.validate(code, subtotal)`; applied state shows "✓ CODE applied
   (−₹X)" with the `couponCapped` note when `maxDiscount` limited it, and a **Remove** control. Keep the
   not-authenticated login prompt that calls `openAuthModal("login")`.
3. **Step 2 — Shipping.** Keep saved-address radio selection and the "Add New Address" inline form with
   per-field validation (`validateAddress`, `addressErrors`, `inputError` styling, `fieldError`
   messages). Keep the shipping-method radio list built from `apiService.shipping.getMethods()` (active
   only) showing name, description, and "FREE"/`flatRate` — FREE when `rateType === "free"` or
   `freeAbove && subtotal >= freeAbove`. Keep the empty-methods fallback line and the
   "select a method" error. Re-skin selected cards with a gold/emerald ring and a tinted surface.
4. **Step 3 — Payment.** Keep the **store-credit** panel shown when `walletBalance > 0` (loaded via
   `apiService.wallet.getBalance(user.id)`): the apply toggle, the amount input clamped to
   `maxApplicableCredit`, "Use Max", and the applied/remaining rows; keep the `fullyCovered` note when
   credit covers the order. Keep the payment-method radios and their availability logic — especially COD
   gating from `storeSettings.payment` (`codEnabled`, `codMinOrder`, `codMaxOrder`) against
   `amountPayable`, and the effect that falls back to `card` when COD becomes invalid. Keep the
   card/UPI/net-banking/COD detail sub-forms. Re-skin each method tile (icon, label, description) with
   a selected ring; disabled COD shows the hint and a muted style. (You may keep the emoji icons, or
   swap to Iconify `@iconify/react` icons for a more premium look — if you swap, keep labels/values and
   the `paymentMethod` ids unchanged.)
5. **Step 4 — Review & confirm.** Keep the read-only item list and the three review blocks (Deliver To,
   Shipping Method, Payment) with their **Edit** buttons that jump back to the right step, and the
   store-credit / COD / charge messaging. Re-skin into branded cards.
6. **Order Summary sidebar.** Keep all rows and bind them to the existing derived values: Subtotal
   (`subtotal`), Discount (`couponDiscount`, only when > 0, in green), Shipping (`shippingCost`, FREE or
   amount), **Tax** labelled `Tax ({taxRatePct}% GST)` (`taxAmount`), Total (`total`, gold serif), and —
   when `storeCreditApplied > 0` — a Store Credit line and an **Amount Payable** total. Make the sidebar
   sticky on desktop. Re-skin the small trust badges row.
7. **Tax default (the only logic change permitted).** The page currently reads
   `storeSettings?.store?.taxRate ?? 18`. Change ONLY the fallback to **`?? 5`** so that if settings fail
   to load the displayed GST matches the silk/apparel rate (`db.json → settings.store.taxRate` is 5).
   Do **not** change how `taxAmount`, `total`, `amountPayable`, or any other figure is computed.
8. **Place order — DO NOT TOUCH the math or the creation call.** Keep `placeOrder()` exactly: it builds
   `orderData` from `cartItems` and the derived `subtotal / discountAmount / couponCode /
   shippingAmount / taxAmount / total / storeCreditUsed / amountPayable / paymentMethod / paymentStatus
   / fulfillmentStatus / shippingStatus`, calls `await createOrder(orderData)` (from
   `useOrder()` / OrderContext, which persists via `apiService.orders.create` and performs coupon
   redemption + wallet debit + payment record creation), then on success `clearCart({ silent: true })`
   and `navigate(\`/order-confirmation/${result.order.orderNumber || result.order.id}\`)`. The Place
   Order button keeps its dynamic label (`Place Order` when fully covered, else `Place Order - ₹payable`)
   and `isProcessing` disabled state. **No change to any amount, key name, or the order-creation flow.**
9. **Empty-cart guard.** Keep the early return when `cartItems.length === 0 && !orderPlaced` — re-skin it
   into the branded empty state with a "Continue Shopping" link to `/products`.
10. **Validation & error states themed.** All inline field errors, the coupon error, the shipping error,
    and disabled states use the semantic tokens (`--sf-color-danger`, `--sf-color-warning`) and remain
    screen-reader friendly. Keep the smooth `window.scrollTo` on step change.
11. **No hardcoded hex.** Every color in `Checkout.module.css` must be a `var(--sf-*)` token; reuse the
    nearest existing token when a precise shade is missing.

## Data / API Notes
- **apiService used (unchanged):** `shipping.getMethods()`, `settings.get()`, `wallet.getBalance(userId)`,
  `coupons.validate(code, orderAmount)`, and — via `OrderContext.createOrder` — `orders.create(...)`.
  Do not add new endpoints or move these out of `apiService`/contexts.
- **Settings shape consumed (read-only):** `settings.store.taxRate` (5), `settings.payment`
  (`codEnabled`, `codMinOrder`, `codMaxOrder`, …). Only the *fallback literal* `18 → 5` changes; the
  shape and key names stay identical.
- **Order payload contract (must stay byte-for-byte in field names/semantics):** the keys listed in
  requirement 8 are what Confirmation, Order History, and Admin read back — do not rename or drop any,
  and keep money as INR integers.
- No `db.json` data changes in this prompt (the silk products, coupons, shipping copy, and
  `settings.store.taxRate = 5` are seeded elsewhere). Keep referential integrity untouched.

## Constraints (Do Not Break)
- Keep checkout **fully functional & API-driven**: coupon validation, wallet balance/usage, shipping
  methods, tax, payment gating, and order creation all flow through the existing `apiService`/contexts.
  **Money math (subtotal, discount, shipping, tax, total, store credit, amount payable) and the
  `createOrder` call are the contract — do not alter them** (except the single `?? 5` tax fallback).
- **Re-skin only via `src/theme/storefront-tokens.css` tokens** — no hardcoded hex in
  `Checkout.module.css` or inline styles.
- Preserve the JSON Server ↔ Laravel swap contract and all JSON shapes (no new `fetch`/`axios`; only
  `apiService`).
- Do not modify the admin panel or any `src/pages/Admin/*` file.
- Accessibility: every input has an associated `<label>`; radio groups are keyboard-navigable; errors
  are announced; CTAs have visible focus and ≥44px targets. Mobile-first: the sidebar stacks under the
  steps; the Place Order button is always reachable. Images `loading="lazy"`.

## Acceptance Criteria / Definition of Done
- [ ] All four steps and the sticky Order Summary are restyled to the brand (gold serif titles, emerald
      CTAs, branded step indicator, tinted selected cards) and stay coherent in dark and light themes.
- [ ] Coupon apply/remove, store-credit toggle + amount + Use Max, shipping-method selection, COD gating,
      and the card/UPI/net-banking/COD sub-forms all still work.
- [ ] The summary shows `Tax (5% GST)` by default (settings-driven), and all amounts equal what is sent
      to `createOrder`.
- [ ] Placing an order creates the order via the existing path and redirects to
      `/order-confirmation/<orderNumber>` with the cart cleared; the confirmation page shows the same
      totals (proving the math was untouched).
- [ ] A fully store-credit-covered order shows "Place Order" (no payment sub-form) and is created
      correctly.
- [ ] No hardcoded hex in `Checkout.module.css`; no console errors; `npm run build` is clean.

## Verification Steps
1. `npm run dev`; add items to the cart and go to `/checkout` (log in when prompted, e.g. a seeded
   user).
2. Step through Cart → Shipping → Payment → Review. Apply a coupon (e.g. `SILK500`) and confirm the
   sidebar Discount + Total update; remove it and confirm reset.
3. If the user has store credit (seeded `walletTransactions`), toggle it on, set an amount / Use Max, and
   confirm Amount Payable updates; verify COD disables when the payable falls outside `codMin/MaxOrder`.
4. Confirm the sidebar shows `Tax (5% GST)`; place the order and verify redirect to
   `/order-confirmation/<orderNumber>` and that the totals there match the sidebar.
5. Place a separate order fully covered by store credit and confirm it succeeds with no payment sub-form.
6. Empty the cart → confirm the branded empty state with "Continue Shopping".
7. Toggle theme and re-check both modes; resize to mobile and confirm the sidebar stacks and Place Order
   is reachable.
8. `npm run build` → clean build, no console errors.
