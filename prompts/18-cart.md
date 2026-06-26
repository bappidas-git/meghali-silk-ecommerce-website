<!-- Batch D — Storefront Pages -->
# Prompt 18 — Cart (Slide-over Drawer)

## Objective
Re-skin and complete the slide-over **shopping cart drawer** (`CartDrawer`) to the *Meghali's Silk*
brand and to the "Shopping Cart" mockup, adapting that full-page design into the existing right-side
drawer. Deliver: a "Shopping Cart (N)" header, line items with fabric/variant labels and a quantity
stepper, a **free-shipping progress bar** toward ₹999, an **Apply Promo Code** field that validates a
coupon through the API and reflects the discount in totals, a **Price Details** block (Subtotal,
Savings, Shipping, Total), and a single emerald **Proceed to Checkout** action — all live from
`CartContext`, with an honest empty state.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The storefront is **dark-first**: near-black charcoal canvas, deep
bottle-green brand panels, gold/champagne accents, emerald primary CTAs, elegant serif headings.

**Match `UI Designs/ADD TO CART.png`.** That mockup shows a full "Shopping Cart" *page*, but **there is
NO `/cart` route in this app** — the cart is this slide-over drawer. Adapt the page's content into the
drawer's single vertical column (the drawer is a tall, narrow right-side panel, not a two-column page):
- A "Shopping Cart" heading with the item count.
- A list of cart line items: square product thumbnail, product name, a small fabric/variant sub-label,
  a gold unit price, a `- N +` quantity stepper, and a red remove (trash) control.
- A green/emerald **free-shipping progress bar** with a "you're ₹X away from FREE shipping" / "you
  qualify" message.
- An **"Apply Promo Code"** row: a text input + an emerald **Apply** button; once applied, show the
  applied code with a remove affordance.
- A **"Price Details"** panel: Subtotal, Savings (green), Shipping (FREE or amount), and a gold Total.
- A full-width emerald **"Proceed to Checkout"** button.

Tokens to consume (already defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-text`,
  `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`, `--sf-color-border-strong`,
  `--sf-color-overlay`.
- Price gold: `--sf-color-price` (and `--sf-color-gold` / `--sf-gradient-gold` for the Total / accents).
- Primary CTA: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`.
- Savings/discount green: `--sf-color-discount`, `--sf-color-discount-bg`; struck compare price:
  `--sf-color-compare`. Danger (remove): `--sf-color-danger`.
- Type: `--sf-font-display` (serif) for the "Shopping Cart" heading and the Total; `--sf-font-family`
  for body/UI. Radius/space/shadow/motion via the `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`,
  `--sf-transition*` scales. Drawer overlay z-index via `--sf-z-overlay` / `--sf-z-modal`.

## Scope — Files to Create / Modify
- (MODIFY) `src/components/CartDrawer/CartDrawer.js` — restructure markup, add the promo-code section
  and the Price Details block; keep the open/close props and all CartContext wiring.
- (MODIFY) `src/components/CartDrawer/CartDrawer.module.css` — full re-skin using `var(--sf-*)` tokens.
- **OUT of scope:** the `Checkout` page (separate prompt), `ProductCard`, the header cart icon/badge
  that opens this drawer (only consume the existing `open`/`onClose` props — do not change the opener),
  `CartContext` internals, `apiService`, `db.json`, and anything under `src/pages/Admin/*`.

## Detailed Requirements
1. **Preserve the component contract.** Keep the default export `CartDrawer({ open, onClose })`, the
   `framer-motion` `AnimatePresence` backdrop + spring slide-in panel, and the body-scroll lock effect.
   Keep consuming `useCart()` for `cartItems`, `updateQuantity`, `removeFromCart`, `getCartTotal`,
   `getCartItemCount` (and add `getCartItemCount`-derived count to the header). Keep `useTheme()` for the
   dark/light class. Do NOT introduce direct `apiService`/`fetch` for cart mutations — those stay in
   `CartContext`.
2. **Header.** Replace the current title row with **"Shopping Cart"** in `--sf-font-display` plus a
   count chip showing `getCartItemCount()` (e.g. `Shopping Cart (3)` or a gold pill with the number).
   Keep the close (✕) button with `aria-label="Close cart"` and a ≥44px tap target.
3. **Free-shipping progress bar.** Keep the existing logic that compares `getCartTotal()` against
   `FREE_SHIPPING_THRESHOLD` (imported from `src/utils/constants.js`, value ₹999) and renders the
   animated fill. Re-skin the track to a subtle surface and the fill to an emerald→gold gradient (use
   `--sf-color-emerald` / `--sf-gradient-gold`). Message: "Add **₹X** more for **FREE shipping**" when
   below, and a check + "You've unlocked **FREE shipping!**" when met. Use `formatCurrency` from
   `src/utils/helpers.js` for the remaining amount.
4. **Line items.** For each `item` in `cartItems` render:
   - Thumbnail (`item.image`, fallback `PLACEHOLDER_IMG`, `onError={onImageError}`, `loading="lazy"`),
     clickable to `productPath(item)` via `onClose()` then `navigate(...)`.
   - Name (`truncateText(item.name, 45)`), clickable to the same product path.
   - A fabric/variant sub-label from `item.variantName` when present (small, muted, e.g. the silk
     fabric). Do not invent a label when `variantName` is absent.
   - Gold unit price `formatCurrency(item.price)` (`--sf-color-price`); if `item.comparePrice >
     item.price`, show the struck compare price in `--sf-color-compare`.
   - A `- N +` quantity stepper wired to `updateQuantity(item.id, item.quantity ± 1)`; the `-` button is
     `disabled` at quantity 1; the `+` button is `disabled` when `item.stock` is a positive number and
     `item.quantity >= item.stock` (keep the existing `atStockLimit` guard + tooltip). Each stepper
     button needs an `aria-label` and a ≥44px (or comfortably tappable) hit area.
   - A red remove (trash) button wired to `removeFromCart(item.id)` with `aria-label="Remove item"`.
   - Keep the per-item enter/exit `motion` animation (layout + slide/fade).
5. **Apply Promo Code section.** Add below the items list (and above Price Details):
   - A heading "Apply Promo Code".
   - A text input (controlled, uppercase the value on change) + an emerald **Apply** button.
   - On Apply, call `apiService.coupons.validate(code.trim(), subtotal)` where `subtotal =
     getCartTotal()`. On success store the returned coupon in local state and show it as applied
     ("✓ CODE applied −₹X") with a **Remove** control that clears it. On failure show the thrown
     `e.message` (e.g. "Invalid coupon", "Minimum order …") in a small error line. Disable Apply while a
     request is in flight and when the input is empty.
   - Derive the discount **locally** from the applied coupon and the *current* subtotal (do not store a
     fixed amount): `raw = type === "percentage" ? round(subtotal * value / 100) : value`, then clamp by
     `maxDiscount` and by `subtotal`. This mirrors how Checkout computes it, so the drawer and Checkout
     agree. If the subtotal later drops below the coupon's `minOrderAmount`, auto-clear the coupon and
     surface a short note (same behavior pattern as Checkout).
6. **Price Details block.** Replace the current two-line summary with a titled **"Price Details"**
   panel containing:
   - **Subtotal** → `formatCurrency(getCartTotal())`.
   - **Savings** (only when there is a discount, i.e. coupon discount and/or summed
     `comparePrice − price` line savings) → shown in green (`--sf-color-discount`) as `−₹X`. Be explicit
     about what "Savings" includes; at minimum include the applied-coupon discount. (Compare-price
     savings may be added but must be computed from real `comparePrice` values, never fabricated.)
   - **Shipping** → "FREE" (in green) when `getCartTotal() >= FREE_SHIPPING_THRESHOLD`, else
     `formatCurrency(99)` (the flat rate already constant in this file). Keep this consistent with the
     free-shipping bar.
   - **Total** → gold, `--sf-font-display`, computed as `subtotal − couponDiscount + shipping`. This is
     an *estimate* shown in the drawer; the authoritative tax/shipping-method math happens on Checkout —
     do not add tax here (the drawer has no shipping-method/tax selection).
7. **Proceed to Checkout.** A single full-width emerald button "Proceed to Checkout" that calls
   `onClose()` then `navigate("/checkout")`. Remove the redundant "View Cart" button (there is no cart
   page). Keep it disabled/hidden when the cart is empty.
8. **Empty state (honest).** When `cartItems` is empty, show a centered illustration, "Your cart is
   empty", an honest line ("Browse our handloom silk collections to get started."), and a **Shop**
   button that calls `onClose()` then `navigate("/products")` (or `/`). No promo/price/checkout UI in
   the empty state.
9. **Responsiveness & motion.** The drawer is full-width on mobile (≤480px) and a fixed comfortable
   width (≈400–440px) on larger screens; the items list scrolls while the header, promo, Price Details,
   and CTA stay reachable (sticky footer region is fine). Respect `prefers-reduced-motion` (the global
   token block already handles transitions; do not add motion that ignores it).
10. **No hardcoded hex.** Every color in `CartDrawer.module.css` must be a `var(--sf-*)` token. If a
    shade you need is missing, reuse the nearest existing token rather than inventing a hex.

## Data / API Notes
- **apiService used:** `apiService.coupons.validate(code, orderAmount)` only. It already checks
  `isActive`, `expiresAt`, `usageLimit` vs `usedCount`, and `minOrderAmount`, and throws with a message
  on failure — surface that message; do not reimplement validation.
- **Coupon shape** (do not change): `{ code, type: "fixed"|"percentage", value, minOrderAmount,
  maxDiscount, ... }`. Discount math must clamp by `maxDiscount` and the subtotal.
- **Cart line shape** (read-only here): `{ id, productId, variantId?, name, variantName?, image, sku?,
  price, comparePrice?, quantity, stock? }`. Use `item.id` for `updateQuantity`/`removeFromCart`.
- **Constants:** `FREE_SHIPPING_THRESHOLD` (999) from `src/utils/constants.js`. **Helpers:**
  `formatCurrency`, `truncateText`, `productPath`, `PLACEHOLDER_IMG`, `onImageError` from
  `src/utils/helpers.js`.
- No `db.json` changes in this prompt. Do not add cart endpoints or alter the JSON shapes.

## Constraints (Do Not Break)
- Keep the cart fully **API-driven & functional** through `CartContext`/`useCart` (add/update/remove
  still work and persist exactly as before); coupon validation goes through `apiService.coupons.validate`
  only. Do not move money mutations into the component.
- **Re-skin only via `src/theme/storefront-tokens.css` tokens** — no hardcoded hex in
  `CartDrawer.module.css` or inline styles.
- Do not change the component's public props (`open`, `onClose`) or how the header opens the drawer.
- Preserve the JSON Server ↔ Laravel swap contract and all JSON shapes (no new `fetch`/`axios`).
- Do not modify the admin panel or any `src/pages/Admin/*` file.
- Accessibility: labelled buttons/inputs, visible focus states, ≥44px tap targets, the dialog uses an
  appropriate role and is keyboard-dismissible (ESC/overlay already close it — keep that). Mobile-first
  layout; images `loading="lazy"` with `onError` fallback.

## Acceptance Criteria / Definition of Done
- [ ] Drawer visually matches `UI Designs/ADD TO CART.png` adapted to a single-column slide-over: gold
      serif "Shopping Cart (N)", themed line items with fabric sub-labels and `- N +` steppers, emerald
      free-shipping bar, promo-code row, Price Details (Subtotal / Savings / Shipping / Total), emerald
      "Proceed to Checkout".
- [ ] Adding/updating/removing items updates the list, count chip, progress bar, and Price Details live.
- [ ] Applying a valid coupon (e.g. `SILK500`) shows it as applied and reduces the Total / shows
      Savings; an invalid code shows the API error message; reducing the cart below the coupon's minimum
      auto-removes it with a note.
- [ ] "Proceed to Checkout" closes the drawer and navigates to `/checkout`; the cart contents persist.
- [ ] Empty cart shows the honest empty state with a working Shop CTA and no promo/price/checkout UI.
- [ ] Dark and light themes are both coherent; no purple/blue boilerplate colors remain; no hardcoded
      hex in `CartDrawer.module.css`.
- [ ] No console errors; `npm run build` is clean.

## Verification Steps
1. `npm run dev` (CRA + JSON Server) and open the app.
2. Add 2–3 products to the cart; open the drawer from the header cart icon. Confirm the header count,
   per-item fabric labels, gold prices, and the free-shipping bar render and update as you change
   quantities.
3. In the promo row, apply a known active coupon from `db.json` (e.g. `SILK500`); confirm Savings
   appears and Total drops. Apply a bogus code; confirm the error message. Remove the coupon; confirm
   totals reset.
4. Lower the cart subtotal below the coupon's `minOrderAmount` (remove items) and confirm the coupon is
   auto-removed with a note.
5. Click "Proceed to Checkout" → lands on `/checkout` with the same items; the drawer is closed.
6. Empty the cart and reopen the drawer → empty state with Shop CTA.
7. Toggle the theme (header switch) and re-check both modes; resize to mobile width (≤480px) and confirm
   the drawer is usable and the CTA is reachable.
8. `npm run build` → clean build, no console errors.
