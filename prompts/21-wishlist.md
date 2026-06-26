<!-- Batch D — Storefront Pages -->
# Prompt 21 — Wishlist

## Objective
Re-skin the **Wishlist** page (`src/pages/Wishlist/Wishlist.{js,module.css}`, route `/wishlist`) to the
*Meghali's Silk* brand and the wishlist mockup: a "Wishlist (N items)" grid of product cards with filled
hearts, per-item **move-to-cart** and **remove**, and a **"You May Also Like"** recommendation rail —
keeping the guest (localStorage) and logged-in (`apiService.wishlist`) wishlist fully functional with an
honest empty state.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The storefront is **dark-first**: near-black charcoal canvas, deep
bottle-green brand panels, gold/champagne accents, emerald primary CTAs, elegant serif headings.

**Match `UI Designs/WISHLIST.png`.** It shows: an orange/gradient announcement bar and trust strip at
the very top (global chrome — do **not** rebuild it here), a "Wishlist" heading with an item count, a
responsive **grid of product cards** (image with discount badge top-left and a **filled** gold/red heart
top-right, brand, name, star rating + review count, gold price + struck compare, "Add to Cart"), and a
**"You May Also Like"** horizontal rail of more product cards below the grid. (The orange announcement
variant in the mockup is the global bar's orange cycle — relevant only as context; this page does not
render it.)

Tokens to consume (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-text`,
  `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`, `--sf-color-border-strong`.
- Price gold: `--sf-color-price`, `--sf-color-gold`, `--sf-gradient-gold`; star `--sf-color-star`;
  compare `--sf-color-compare`; discount `--sf-color-discount{,-bg}`.
- CTA emerald: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`;
  heart/remove danger `--sf-color-danger`.
- Type: `--sf-font-display` for the "Wishlist" and "You May Also Like" headings; `--sf-font-family` for
  body/UI. Radius/space/shadow/motion via the `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`,
  `--sf-transition*` scales.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/Wishlist/Wishlist.js` — re-skin markup; reuse the shared `ProductCard`; add the
  "You May Also Like" rail; keep all wishlist/cart wiring.
- (MODIFY) `src/pages/Wishlist/Wishlist.module.css` — full re-skin via `var(--sf-*)` tokens (page
  layout, grid, header, empty state, guest banner, recommendation rail).
- **OUT of scope:** `WishlistContext` and `CartContext` internals, `apiService`, the shared
  `ProductCard` component's internals (consume it — restyle the card only in its own prompt, not here),
  the global Header/announcement/trust strip, `db.json` shapes, and `src/pages/Admin/*`.

## Detailed Requirements
1. **Keep the data flow.** Keep `useWishlist()` (`wishlistItems`, `isLoading`, `removeFromWishlist`,
   `clearWishlist`), `useCart()` (`addToCart`), `useAuth()` (`user`, `isLoading`, `openAuthModal`), and
   `useTheme()`. Keep the sort dropdown and "Clear All", the skeleton loading grid, and the existing
   add/move/remove handlers (`handleAddToCart`, `handleMoveToCart`, `handleRemove`, `handleProductClick`)
   that use `buildCartItem`, `getProductMinPrice`, `getDefaultCartVariant`, and `productPath`.
2. **Guest banner (keep + re-skin).** Keep the guest banner shown when `!user && !authLoading`
   explaining the wishlist is saved on this device and offering **Log In** via `openAuthModal("login")`.
   Re-skin to a branded info strip. (Guests keep a fully working wishlist via localStorage; logged-in
   users sync via `apiService.wishlist` — both behaviors are owned by `WishlistContext`; do not change
   them.)
3. **Header.** "Wishlist" in `--sf-font-display` + a count chip: `({wishlistItems.length}
   item|items)`. Keep the sort `<select>` (labelled) and the "Clear All" control (re-skin; keep
   `clearWishlist`).
4. **Use the shared `ProductCard`.** Replace the page's bespoke inline card markup with the shared
   `ProductCard` from `src/components/storefront/` (the same card used across listing/home), so the
   wishlist grid matches the rest of the catalog. Pass each wishlist row as the product (wishlist rows
   carry the product fields; the product id lives in `item.productId`, with `slug` for the link). The
   card must render with a **filled** heart (active wishlist state) whose click **removes** the item via
   `removeFromWishlist(item.productId)`, and an **Add to Cart** that adds the default variant via the
   existing cart helper. If `ProductCard`'s props don't directly expose a "filled heart that removes"
   and a move-to-cart, wire those via the props/callbacks it already supports (e.g. an
   `onWishlistToggle` / `onAddToCart` style prop, or the WishlistContext the card already reads) — do
   **not** fork or restyle `ProductCard` here; only consume it. Keep a clear per-item **Move to Cart**
   affordance (add to cart then remove from wishlist) consistent with the current `handleMoveToCart`.
5. **Grid layout & motion.** Responsive grid (e.g. `auto-fill` minmax ~240–280px; 2 cols on small
   phones, more on larger screens). Keep the `framer-motion` enter/exit per card (layout +
   scale/opacity) and the `removingId` exit delay.
6. **"You May Also Like" rail.** Below the grid (and shown even when the grid has items), add a section
   titled "You May Also Like" in `--sf-font-display`: a horizontal, swipeable rail of `ProductCard`s for
   recommended products. Source them via `apiService.products.getRelated(seedProduct, limit)` using one
   wishlist item as the seed (e.g. the first/most-recent), and **fall back** to
   `apiService.products.getFeatured(limit)` when the wishlist is empty or `getRelated` returns nothing.
   De-duplicate against items already in the wishlist. Handle loading (skeletons) and an empty result
   (simply hide the rail) honestly — never show placeholder/fake products.
7. **Empty state (honest, with rail).** When `wishlistItems` is empty, keep/re-skin the empty state
   (heart illustration, "Your wishlist is empty", an honest line, and a **Shop** button → `/products`),
   and still render the "You May Also Like" rail underneath using `getFeatured` so the page is useful.
   Keep the guest banner visible in the empty state too.
8. **No hardcoded hex.** Every color in `Wishlist.module.css` must be a `var(--sf-*)` token; reuse the
   nearest existing token when a precise shade is missing. (The shared `ProductCard` brings its own
   tokenized styles.)

## Data / API Notes
- **apiService used:** `products.getRelated(product, limit)` and `products.getFeatured(limit)` for the
  recommendation rail. The wishlist itself flows through `WishlistContext` (which uses
  `apiService.wishlist.get/add/remove` for logged-in users and localStorage for guests) and the cart
  through `CartContext` — do not call those endpoints directly from the page.
- **Wishlist row shape (read-only):** carries product fields plus `productId`, `slug`, `image`, `brand`,
  `name`, `rating`, `totalReviews`, `price`/`comparePrice` (or variants), and `addedAt`. Use
  `getProductMinPrice(item)` for pricing and `getDefaultCartVariant(item)` for the add-to-cart variant.
- **Helpers:** `formatCurrency`, `getProductMinPrice`, `getDefaultCartVariant`, `buildCartItem`,
  `productPath` from `src/utils/helpers.js`.
- No `db.json` changes in this prompt (silk products/related ids are seeded elsewhere). Keep referential
  integrity; do not alter wishlist/product shapes.

## Constraints (Do Not Break)
- Keep the wishlist **fully functional & API-driven**: **guest wishlist via localStorage and logged-in
  wishlist via `apiService.wishlist`** both keep working (owned by `WishlistContext`); cart adds go
  through `CartContext`. Do not bypass these with direct `fetch`/`apiService` cart/wishlist mutations in
  the page.
- Honor **authenticity > persuasion**: the "You May Also Like" rail shows REAL API products (related or
  featured) or nothing — never fabricated items, fake ratings, or filler.
- **Re-skin only via `src/theme/storefront-tokens.css` tokens** — no hardcoded hex in
  `Wishlist.module.css`. Consume the shared `ProductCard`; do not fork/restyle it here.
- Preserve the JSON Server ↔ Laravel swap contract and all JSON shapes (no new `fetch`/`axios`).
- Do not modify the admin panel or any `src/pages/Admin/*` file.
- Accessibility: the heart toggle and remove/move buttons are labelled; the sort select has a `<label>`;
  the rail is keyboard-scrollable; controls have visible focus and ≥44px targets. Mobile-first grid;
  images `loading="lazy"`.

## Acceptance Criteria / Definition of Done
- [ ] Page matches `UI Designs/WISHLIST.png` adapted to the brand: serif "Wishlist (N items)", a grid of
      shared `ProductCard`s with **filled** hearts, gold prices + struck compare, ratings, and Add/Move
      to Cart, plus a "You May Also Like" rail below.
- [ ] Removing an item (heart or remove) updates the grid and count live; Move to Cart adds the item to
      the cart and removes it from the wishlist; Add to Cart adds without removing.
- [ ] Guest users keep a working wishlist (persists on reload via localStorage) and see the Log In
      banner; logged-in users' wishlist syncs (unchanged behavior).
- [ ] The recommendation rail shows real related/featured products (de-duplicated), with skeletons while
      loading and nothing when there are none; the empty wishlist still shows the rail + a Shop CTA.
- [ ] Both themes coherent; no purple/blue boilerplate; no hardcoded hex in `Wishlist.module.css`; no
      console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`; while logged **out**, heart a few products from the listing, then open `/wishlist`:
   confirm the grid (filled hearts), the guest banner, and the "You May Also Like" rail.
2. Reload the page → the guest wishlist persists (localStorage). Remove an item via the heart; confirm
   it disappears and the count updates.
3. Use **Move to Cart** on an item → it is added to the cart and removed from the wishlist; use **Add to
   Cart** on another → added but still in the wishlist.
4. Log in as a seeded user with a wishlist → confirm the logged-in wishlist renders and syncs; the
   recommendation rail still populates.
5. Clear the wishlist → confirm the honest empty state with the Shop CTA and that the rail still shows
   featured products.
6. Toggle theme; check both modes; resize to mobile (2-column grid, swipeable rail).
7. `npm run build` → clean build, no console errors.
