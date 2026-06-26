<!-- Batch D — Storefront Pages -->
# Prompt 14 — Brand Product Card (unified storefront card)

## Objective
Re-skin the single reusable storefront product card — `src/components/storefront/ProductCard.js` — into
the **Meghali's Silk** brand card used everywhere (home rails, product listing, wishlist, related /
you-may-also-like). Portrait silk image, discount badge, wishlist heart, optional PREMIUM ribbon, name,
authentic star rating, gold price with struck compare + "Save ₹X", and an emerald **Add to Cart** with an
"Added ✓" micro-interaction — all token-driven, domain-agnostic, and bound to real product data.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house selling authentic women's silk apparel. The storefront
is **dark-first** (charcoal canvas, deep bottle-green panels, gold/champagne accents, emerald CTAs,
elegant serif headings).

Match the card as it appears across:
- **`UI Designs/PRODUCT LISTING.png`** — grid of dark rounded cards: silk image, gold price + struck
  compare, discount badge top-left, wishlist heart top-right, star rating + count.
- **`UI Designs/WISHLIST.png`** — same card with a filled heart and a "% OFF" badge; some show a
  "PREMIUM" treatment.
- **`UI Designs/HOME PAGE HIDE FOOTER.png`** — the same card in the Flash Deals / Featured / Trending
  rails.

Use ONLY tokens from `src/theme/storefront-tokens.css` (no hardcoded hex):
- Surfaces: `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-surface-hover`,
  `--sf-color-border`, `--sf-color-border-strong`.
- Price: gold `--sf-color-price`; struck compare `--sf-color-compare`; discount `--sf-color-discount` on
  `--sf-color-discount-bg`. Stars: `--sf-color-star`.
- PREMIUM ribbon: `--sf-gradient-gold` (or `--sf-color-gold` + `--sf-color-gold-deep`), dark text.
- Add-to-Cart: `--sf-color-emerald` (hover `--sf-color-emerald-hover`, text
  `--sf-color-emerald-contrast`).
- Wishlist accent: `--sf-cat-pink` or `--sf-color-emerald` for the filled state.
- Text/type: `--sf-color-text`, `--sf-color-text-secondary`, `--sf-font-family` (Inter);
  `--sf-font-display` optional for the name. Radius/space/shadow/motion: `--sf-radius-*`, `--sf-space-*`,
  `--sf-shadow-*`, `--sf-transition*`. Tap target `--sf-tap-target` (≥44px).

## Scope — Files to Create / Modify
- (MODIFY) `src/components/storefront/ProductCard.js` — keep the existing prop contract; restructure the
  markup for the brand card (discount badge, heart, optional PREMIUM ribbon, name, rating, price block,
  Add-to-Cart with "Added ✓").
- (MODIFY) `src/components/storefront/ProductCard.module.css` — full brand re-skin via tokens.
- **OUT of scope:** the page-local card variants (e.g. the inline card in `src/pages/Products/Products.js`
  and the inline card in `src/pages/Home/Home.js`) — those are handled in their own prompts. Do NOT
  change `StarRating` / `PriceBlock` internals here (only consume them). No `db.json` or admin changes.

## Detailed Requirements

### A. Keep the prop contract (call-sites depend on it)
1. Preserve the current props exactly — many call-sites pass them:
   ```
   product            object   (required)
   onAddToCart        fn       (cartItem) => void   — omit to hide the button
   onToggleWishlist   fn       (product) => void    — omit to hide the heart
   isWishlisted       boolean
   showAddToCart      boolean  default true (when onAddToCart given)
   ```
   `RelatedProducts.js` and `FrequentlyBoughtTogether.js` render this card; do not change the signature.
2. Keep deriving values with the existing helpers from `src/utils/helpers`:
   `getProductMinPrice(product)` → `{ sellingPrice, originalPrice, discount }`; `buildCartItem(product)`
   for the cart payload; `productPath(product)` for the link; `truncateText`; `PLACEHOLDER_IMG` +
   `onImageError`. `ratingCount = Number(product.totalReviews) || 0`; `rating = Number(product.rating)
   || 0`; `outOfStock = product.stock === 0`.

### B. Media (portrait, lazy, badges)
3. The card links to `productPath(product)` (i.e. `/products/:slug`). The media is a **portrait** image
   area (~3:4 — saree photography is tall) with `object-fit: cover`, `loading="lazy"`,
   `onError={onImageError}`, and `src = product.images?.[0] || product.image || PLACEHOLDER_IMG`.
4. **Discount badge — top-left**, shown ONLY when `discount > 0` (i.e. `comparePrice > price`); label
   `{discount}% OFF`. Style with `--sf-color-discount` / `--sf-color-discount-bg`. Never render a 0% or
   negative badge.
5. **Wishlist heart — top-right**, shown only when `onToggleWishlist` is provided. It must `preventDefault`
   on click (so it doesn't trigger the card link) and call `onToggleWishlist(product)`. The heart is
   **filled** when `isWishlisted` is true (toggle `styles.wishlisted`); outline otherwise. Accessible
   label toggles "Add to wishlist" / "Remove from wishlist". This binds to `WishlistContext` at the
   call-site — the card stays presentational.
6. **Optional PREMIUM ribbon — top corner**: render a small gold "PREMIUM" ribbon ONLY when the product
   is genuinely flagged — i.e. `product.featured === true` OR the product's tags include a bridal/premium
   marker (e.g. `product.tags?.includes("bridal")`). Drive it off real fields; never show it
   unconditionally. Style with `--sf-gradient-gold` + dark text. Keep it from overlapping the discount
   badge (place ribbon and badge on opposite corners or stack cleanly).

### C. Body (name, authentic rating, price, CTA)
7. Optional brand line (`product.brand`) above the name in `--sf-color-text-secondary`.
8. **Name** links to `productPath(product)`, clamped to **2 lines** (use line-clamp;
   `truncateText(product.name, 48)` as a fallback). Use `--sf-color-text`; `--sf-font-display` is
   acceptable for a more premium feel.
9. **Star rating (authenticity rule):**
   - When `ratingCount > 0`: render `<StarRating rating={rating} size={13} />` (gold via
     `--sf-color-star`) followed by the count, e.g. `({ratingCount.toLocaleString()})`.
   - When `ratingCount === 0`: render a muted **"No ratings yet"** label (NOT a hollow "(0)"). This is
     a deliberate authenticity requirement — never imply reviews that don't exist.
10. **Price** via the existing `PriceBlock` component:
    `<PriceBlock price={sellingPrice} comparePrice={originalPrice} size="sm" showSavings />` so the gold
    price (`--sf-color-price`), the struck compare (`--sf-color-compare`), the computed discount, and a
    **"Save ₹X"** line all render from real numbers. (PriceBlock derives the discount/savings itself, so
    nothing can be faked.) If `showSavings` crowds the small card, you may pass `showSavings={false}` and
    rely on the discount badge — but the design shows a "Save ₹X"; prefer keeping it.
11. **Add to Cart** button — emerald, full-width under the price, shown only when `showAddToCart &&
    onAddToCart`:
    - `disabled` when `outOfStock`; label "Out of Stock" in that case.
    - On click: `e.preventDefault()` then `onAddToCart(buildCartItem(product))`.
    - **Micro-interaction:** on a successful add, briefly swap the label to **"Added ✓"** (local
      `useState` + a ~1.4s timeout that resets it), matching the "Added ✓" pattern used on the PDP. Do
      not fire confetti or block the button; keep it snappy. Disabled/added states must remain
      accessible (don't remove the button from the tab order while merely showing "Added ✓").

### D. Layout, states, a11y
12. Card container: `--sf-color-surface` background, `--sf-radius-lg`, `--sf-color-border` hairline,
    `--sf-shadow-sm`; a subtle hover lift / `--sf-shadow-md` + `--sf-color-border-strong` on hover
    (token-driven; respect reduced motion). The whole card should feel consistent in a grid and in a
    horizontal rail.
13. Out-of-stock: dim the media slightly and disable the CTA; do NOT hide the card.
14. Accessibility: the image link has `aria-label={product.name}`; the heart and CTA are real `<button>`s
    with labels; `:focus-visible` rings via `--sf-shadow-focus`; interactive targets ≥44px
    (`--sf-tap-target`). Keep the card keyboard-navigable (link + heart + CTA all tabbable).
15. Return `null` when `!product` (keep the existing guard).

## Data / API Notes
- The card is **presentational** and domain-agnostic. It does NOT call `apiService` itself — callers pass
  `product` and wire `onAddToCart` (via `CartContext` / `buildCartItem`) and `onToggleWishlist` (via
  `WishlistContext`). Keep it that way.
- `product` shape (from `db.json`): `{ id, name, slug, brand, images[], price, comparePrice, stock,
  variants[], tags[], featured, rating, totalReviews, ... }`. The card reads only display fields; it must
  tolerate missing optional fields (no `images`, no `comparePrice`, `totalReviews: 0`).
- Do NOT change the `product` JSON shape or the cart-item shape produced by `buildCartItem` (preserves
  the merge-by-id behavior with the PDP and listing).

## Constraints (Do Not Break)
- Keep everything API-driven & functional: wishlist toggles via the passed `onToggleWishlist`
  (WishlistContext), Add-to-Cart via the passed `onAddToCart` (`buildCartItem` → CartContext). Do not
  introduce direct context/`apiService` calls inside the card.
- Re-skin ONLY via tokens — no hardcoded hex in `ProductCard.js` (inline styles) or
  `ProductCard.module.css`.
- Authenticity > persuasion: rating shows only when `totalReviews > 0` (else "No ratings yet"); discount
  badge and "Save ₹X" derive from real `price`/`comparePrice` (never typed in); PREMIUM ribbon only on a
  real flag; no fabricated stock/urgency/social proof.
- Keep the existing prop contract and the `null`-on-no-product guard so every call-site keeps working.
- Do not modify the admin panel, `StarRating`/`PriceBlock` internals, page-level card variants, or
  `db.json`.
- Preserve the JSON Server ↔ Laravel swap contract.
- Accessibility (ARIA, `:focus-visible`, ≥44px), responsive, lazy images.

## Acceptance Criteria / Definition of Done
- [ ] The card matches `PRODUCT LISTING.png` / `WISHLIST.png` / home rails: portrait silk image,
      top-left "% OFF" badge (only when discounted), top-right wishlist heart (filled when wishlisted),
      optional gold PREMIUM ribbon, 2-line name, gold price + struck compare + "Save ₹X", emerald Add
      to Cart.
- [ ] Star rating shows real `rating` + count when `totalReviews > 0`, and "No ratings yet" when it's 0
      (never "(0)").
- [ ] Clicking the heart toggles wishlist without navigating; clicking Add to Cart adds the item and
      briefly shows "Added ✓"; out-of-stock disables the CTA and dims the card without hiding it.
- [ ] The same card renders correctly in the home rails, the listing grid, the wishlist grid, and the
      PDP "You may also like" / "Frequently bought together" rows (prop contract intact).
- [ ] Dark and light modes are coherent; gold price meets contrast; PREMIUM ribbon legible.
- [ ] No raw hex in `ProductCard.module.css`; no console errors; `npm run build` is clean.

## Verification Steps
1. `npm run dev` and open `/` — confirm the home rails render the new card (badge/heart/price/CTA).
2. Open `/products` — the listing grid uses the brand card; click a card → navigates to
   `/products/:slug`; click the heart → it fills and the item appears on `/wishlist`.
3. On `/wishlist`, confirm hearts are filled and "% OFF" badges show only on discounted items.
4. On any PDP (`/products/:slug`), scroll to "You may also like" / "Frequently bought together" → the
   same card renders identically.
5. Click Add to Cart on a card → the label flips to "Added ✓" briefly and the cart count/drawer updates;
   find an out-of-stock product → its CTA reads "Out of Stock" and is disabled, card still visible.
6. Find a product with `totalReviews: 0` → it shows "No ratings yet"; a product with reviews shows
   stars + count.
7. Toggle theme → card stays coherent. Resize to 375px → grid/rail cards remain tappable (≥44px).
8. Run `npm run build` → clean.
