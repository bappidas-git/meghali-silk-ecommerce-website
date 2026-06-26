<!-- Batch D — Storefront Pages -->
# Prompt 20 — Order Confirmation & Order History

## Objective
Re-skin the **Order Confirmation** screen (`/order-confirmation/:orderNumber`) and the **Order History**
page (`/orders`) to the *Meghali's Silk* brand, keeping all functionality intact: confirmation fetches a
real order by number and shows items/totals/shipping/payment/status with a celebratory but honest
success state; history lists the user's real orders with status badges, item thumbnails, tracking,
reorder, cancel (where allowed), return entry points, and the purchase-gated "write a review" flow.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The storefront is **dark-first**: near-black charcoal canvas, deep
bottle-green brand panels, gold/champagne accents, emerald primary CTAs, elegant serif headings.

There are **no dedicated mockups** for these two screens — derive the look from the brand system and stay
consistent with `UI Designs/ADD TO CART.png` (surfaces, gold prices/totals, emerald CTAs, serif
headings) and `UI Designs/PROFILE.png` (status badge + list-row styling). Confirmation: a centered
success badge (gold/emerald check), a prominent copyable order number, an estimated-delivery banner, an
order-summary card with items + totals, shipping-address and payment-method cards, and CTAs. History: a
header with count + refresh, a search + status filter bar, then a list of order cards (status badge,
thumbnails, total, Track / View Details / Return / Cancel actions, expandable details with per-item
"Rate & Review").

Tokens to consume (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-text`,
  `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`, `--sf-color-border-strong`.
- Brand/accents: `--sf-color-brand-green`, `--sf-color-gold`, `--sf-gradient-gold`, `--sf-color-price`;
  CTA `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`.
- Status semantics: `--sf-color-success{,-bg}` (delivered/paid), `--sf-color-info{,-bg}`
  (processing/shipped), `--sf-color-warning{,-bg}` (pending), `--sf-color-danger{,-bg}`
  (cancelled/failed). Category-accent tokens (`--sf-cat-*`) may color the menu/timeline dots.
- Type: `--sf-font-display` for the success title, order number, and totals; `--sf-font-family` for body.
  Radius/space/shadow/motion via the `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`
  scales.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/OrderConfirmation/OrderConfirmation.js` — re-skin markup; keep the fetch, the
  loading/error/not-found states, and the totals/status logic.
- (MODIFY) `src/pages/OrderConfirmation/OrderConfirmation.module.css` — full re-skin via `var(--sf-*)`.
- (MODIFY) `src/pages/OrderHistory/OrderHistory.js` — re-skin markup; keep all order logic (status
  derivation, cancel, returns, review gating, pagination, filters).
- (MODIFY) `src/pages/OrderHistory/OrderHistory.module.css` — full re-skin via `var(--sf-*)`.
- **OUT of scope:** `apiService` (orders/reviews), `OrderContext`, the `ReviewModal` component's logic
  (you may rely on it; restyle it only if it visibly clashes, otherwise leave it), `db.json` shapes, and
  `src/pages/Admin/*`.

## Detailed Requirements — Order Confirmation
1. **Keep the data flow.** Keep fetching with `apiService.orders.getByOrderNumber(orderNumber)` (from
   the `:orderNumber` route param), and keep the three distinct states: a branded **loading** spinner,
   a **fetch-error** state (network failure — offers "Try Again" + "View Order History", never claims
   the order is missing), and an **order-not-found** state. Re-skin each; keep the retry/navigation
   buttons.
2. **Success header.** Re-skin the animated check into a gold/emerald success badge (keep the
   `framer-motion` spring + the delayed `showCheck` reveal). Title "Order Confirmed!" in
   `--sf-font-display`. Keep the honest subtext that branches on `isPaymentPending` (COD/pending vs
   paid). `canvas-confetti` is acceptable: you MAY fire a one-shot confetti burst on first successful
   load using gold/emerald/green colors (`#E6C27A`, `#12B886`, `#0B3B2E`) — but it must respect
   `prefers-reduced-motion` (skip the burst when reduced motion is requested) and never block render.
3. **Order number + delivery banners.** Keep the prominent order-number banner with the copy button
   (clipboard + "Copied!" feedback) and the "Placed on {formatDate(createdAt)}" meta; re-skin to a gold
   panel. Keep the estimated-delivery banner (and the "Delivered" variant when `shippingStatus ===
   "delivered"`).
4. **Order summary, address, payment cards.** Keep the items list (image, name/variant, qty, line
   price) and the totals block bound to the real fields with their fallbacks: `subtotal`, Discount
   (`order.discountAmount`, only when > 0, with `couponCode`), Shipping (`order.shippingAmount ??
   order.shipping`, "FREE" when 0), Tax (`order.taxAmount ?? order.tax`), Total (`order.total`, gold),
   and — when `order.storeCreditUsed > 0` — Store Credit + Amount Paid. Keep the shipping-address card
   using `normalizeOrderAddress(order.shippingAddress)` and the payment card showing the formatted
   `paymentMethod` plus the **real** `paymentStatus` label (never a hardcoded "successful" — keep the
   switch). Re-skin all three into branded cards.
5. **CTAs.** Keep the action buttons; relabel/keep as **Continue Shopping** (→ `/`, emerald) and **View
   Orders** (→ `/orders`, secondary), plus the existing Track Order / Download Invoice affordances (the
   invoice button keeps its current placeholder behavior). Style the primary CTA emerald and the
   secondary as an outline.

## Detailed Requirements — Order History
6. **Keep auth + fetch.** Keep the not-authenticated prompt (only after `authLoading` settles; opens
   `openAuthModal("login")`), and keep `fetchOrders()` loading both
   `apiService.orders.getByUserId(user.id)` and `apiService.reviews.getMine(user.id)` in parallel, with
   the loading state, the **fetch-error** state (never masquerades as "No Orders Yet"), the empty state,
   and the "no matching results" state. Re-skin each.
7. **Header + filter bar.** Re-skin the page header ("My Orders" in `--sf-font-display`, order count,
   refresh button with the spinning icon) and the search-by-order-number input + the status filter tabs
   (`All / Processing / Shipped / Delivered / Cancelled`). Active filter tab uses a gold/emerald pill.
8. **Order cards.** For each order keep: the header (order number + copy button, date, **status badge**
   driven by `deriveOrderStatus(order)` mapped through `STATUS_CONFIG`), the thumbnail row (first 3 item
   images + "+N more") and the gold **Total**, and the action row. Re-skin the **status badge** to use
   the semantic status tokens (delivered=success, shipped/processing=info, cancelled=danger). You MAY
   add a small **status timeline** (Placed → Shipped → Delivered dots) derived only from the real
   `deriveOrderStatus` value — do not invent steps or dates the order doesn't have.
9. **Actions (keep all logic):**
   - **Track Order** — toggles the tracking section (tracking number + copy, carrier link when
     `trackingUrl`, status, refund line). Re-skin only.
   - **View Details** — toggles the expanded section (full items list, shipping address via
     `normalizeOrderAddress`, payment, and the order summary table). Re-skin only.
   - **Reorder** — ADD a "Reorder" action on each card that re-adds the order's items to the cart via
     `CartContext` (import `useCart`; for each `order.items` entry add a normalized cart line using the
     existing `buildCartItem`/cart helpers and the item's `productId`/`variantId`/`quantity`), then opens
     the cart drawer or navigates to `/checkout`. Disable per item if the product is unavailable; show a
     toast (SweetAlert2, already used here) on success. Do not fabricate stock — if an item can't be
     re-added, skip it and say so honestly.
   - **Return / Exchange** — keep `isReturnEligible(order)` gating (delivered within the 7-day window)
     and the entry point (currently navigates to `/support`). Re-skin the button.
   - **Cancel Order** — keep `isCancellable(order)` (derived status still "processing"), the SweetAlert2
     confirm with payment-aware refund messaging, the `apiService.orders.cancel(order.id)` call, the
     `cancellingId` spinner, and the optimistic state merge. **Do not change the cancel cascade.**
   - **Rate & Review** — keep the purchase-gated review control (`isReviewable(order)` → delivered),
     the per-item existing-review chip from `apiService.reviews.getMine`, and the `ReviewModal` →
     `apiService.reviews.submit` flow with the refresh + success toast. Re-skin the chip/button.
10. **Pagination.** Keep the paginator (5 per page) and re-skin its controls (gold active page).
11. **No hardcoded hex.** Both `.module.css` files use only `var(--sf-*)` tokens (the one exception
    already in the codebase is the SweetAlert2 `confirmButtonColor` passed in JS — leave those as-is or,
    if you prefer, read a token; do not break the dialogs). Reuse the nearest token when a shade is
    missing.

## Data / API Notes
- **apiService used (unchanged):** Confirmation → `orders.getByOrderNumber`. History →
  `orders.getByUserId`, `orders.cancel(id, reason?)`, `reviews.getMine(userId)`, `reviews.submit({...})`.
  Reorder reads `order.items` and uses `CartContext` (no new endpoint).
- **Order shape (read-only):** `{ orderNumber, createdAt, items:[{ productId, variantId?, name,
  variantName?, image, price, quantity, currency? }], subtotal, discountAmount, couponCode,
  shippingAmount, taxAmount, total, storeCreditUsed?, amountPayable?, paymentMethod, paymentStatus,
  fulfillmentStatus, shippingStatus, trackingNumber?, trackingUrl?, deliveredAt?, refundStatus?,
  refundedAmount?, refundMethod?, shippingAddress }`. Status display is **derived** via
  `deriveOrderStatus` — keep that helper; do not write new status fields.
- **Helpers:** `formatCurrency`, `formatDate`, `normalizeOrderAddress` (and for Reorder, the existing
  cart helpers e.g. `buildCartItem`) from `src/utils/helpers.js`. **Confetti:** `canvas-confetti` is
  already a dependency.
- No `db.json` changes in this prompt. Keep referential integrity; do not alter order/review shapes.

## Constraints (Do Not Break)
- Keep both pages **fully functional & API-driven**: order fetch by number, order list, cancel cascade,
  returns gating, and purchase-gated reviews all flow through `apiService`/contexts. The **cancel
  cascade and the review gating must remain intact**; Reorder must use `CartContext` (no direct cart
  mutation/fetch).
- Honor **authenticity > persuasion**: status, payment status, tracking, refunds, and review state must
  reflect REAL order/review data — no fabricated "successful"/"delivered"/social proof; honest empty,
  loading, and error states.
- **Re-skin only via `src/theme/storefront-tokens.css` tokens** — no hardcoded hex in the `.module.css`
  files.
- Preserve the JSON Server ↔ Laravel swap contract and all JSON shapes (no new `fetch`/`axios`).
- Do not modify the admin panel or any `src/pages/Admin/*` file.
- Accessibility: status badges have text (not color alone), copy buttons are labelled, the confetti and
  all motion respect `prefers-reduced-motion`, controls have visible focus and ≥44px targets.
  Mobile-first; thumbnails and item images `loading="lazy"`.

## Acceptance Criteria / Definition of Done
- [ ] Order Confirmation matches the brand: gold/emerald success badge + serif "Order Confirmed!",
      copyable gold order-number panel, delivery banner, branded summary/address/payment cards with real
      totals and the real payment-status label, and Continue Shopping / View Orders CTAs. Confetti (if
      added) is gold/green and respects reduced motion.
- [ ] Loading, fetch-error, and not-found states all render correctly and distinctly on confirmation.
- [ ] Order History matches the brand: branded header/filters, order cards with semantic status badges,
      thumbnails, gold Total, and working Track / View Details / Return / Cancel / Reorder / Rate &
      Review actions; pagination works.
- [ ] Cancelling an eligible order still runs the confirm → `orders.cancel` cascade and updates the card;
      Reorder re-adds available items to the cart; reviews remain gated to delivered orders.
- [ ] Both themes coherent; no purple/blue boilerplate; no hardcoded hex in the `.module.css` files; no
      console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`; log in as a seeded user with orders.
2. Place a new order (via `/checkout`) → land on `/order-confirmation/<orderNumber>`; confirm the
   success badge, copyable order number, real totals, and real payment status; verify confetti (if added)
   fires once and is skipped under reduced motion (toggle OS reduced-motion).
3. Visit a bad URL like `/order-confirmation/NOPE` → not-found state; simulate offline to see the
   fetch-error state with Try Again.
4. Go to `/orders`; confirm the list, status badges, search, and filter tabs. Expand Track Order and View
   Details on an order.
5. On a delivered order, use Rate & Review (submit through `ReviewModal`) and confirm the pending chip
   appears. On a processing order, Cancel it and confirm the confirm dialog + status change. Use Reorder
   and confirm items land in the cart.
6. Confirm the not-authenticated prompt shows when logged out, and the empty state when a logged-in user
   has no orders.
7. Toggle theme; check both modes; resize to mobile and confirm cards/actions remain usable.
8. `npm run build` → clean build, no console errors.
