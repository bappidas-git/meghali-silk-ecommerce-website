<!-- Batch D — Storefront Pages -->
# Prompt 16 — Product Detail Page (PDP) Layout & Buy Box

## Objective
Re-skin the above-the-fold **Product Detail Page** — `src/pages/ProductDetails/ProductDetails.js`
assembled from the storefront component library — into the **Meghali's Silk** look from
`UI Designs/PRODUCT DETAILED PAGE.png`: breadcrumb, a gallery with a vertical thumbnail rail + gold
"PREMIUM" ribbon, and a buy box (category label, serif title, real social proof, gold price block with
savings + tax note, KEY FEATURES, Fabric/Color variant swatches, quantity + honest stock, Buy Now (gold)
+ Add to Cart (emerald), delivery/returns, trust badges, and a 4-card trust row). Keep all data wiring in
the page and the components presentational, preserving their prop contracts and the authenticity
guarantees.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. Dark-first storefront (charcoal canvas, deep bottle-green panels,
gold/champagne accents, emerald CTAs, elegant serif headings).

Match **`UI Designs/PRODUCT DETAILED PAGE.png`** (top half):
- Breadcrumb (Home › Category › Product name).
- Left: a **vertical thumbnail rail** beside a large product image, with a gold **"PREMIUM"** ribbon over
  the image and an "In Stock" pill.
- Right buy box: category label, serif **title**, rating + count, a **gold price** with struck compare +
  "% off" + "You save ₹X" + an inclusive-of-taxes note, a **KEY FEATURES** bullet list, **FABRIC** and
  **COLOR** selectors (chips/swatches), a **QUANTITY** stepper, **Buy Now** (gold) + **Add to Cart**
  (emerald), and a **Check Delivery** / delivery-returns block.
- A **4-card trust row** under the buy box: Offers / Free shipping / 100% authentic / Handwoven by
  artisans.

Use ONLY tokens from `src/theme/storefront-tokens.css` (no hardcoded hex):
- Surfaces/text/border: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`,
  `--sf-color-text`, `--sf-color-text-secondary`, `--sf-color-border`, `--sf-color-border-strong`.
- Price: gold `--sf-color-price`; compare `--sf-color-compare`; discount `--sf-color-discount` /
  `--sf-color-discount-bg`. Stars `--sf-color-star`.
- **PREMIUM ribbon**: `--sf-gradient-gold` + dark text. Gold accents: `--sf-color-gold`,
  `--sf-color-gold-light`.
- **Buy Now** = gold (`--sf-gradient-gold` / `--sf-color-gold`, dark text). **Add to Cart** = emerald
  (`--sf-color-emerald` / `--sf-color-emerald-hover` / `--sf-color-emerald-contrast`).
- Trust-row accents may use `--sf-cat-*`. Title uses `--sf-font-display`.
- Radius/space/shadow/motion: `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`. Tap
  target `--sf-tap-target` (≥44px). Z-index for sticky bar `--sf-z-stickybar`.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/ProductDetails/ProductDetails.js` — the breadcrumb + above-the-fold layout (gallery
  section, buy box, the 4-card trust row). Keep ALL data wiring (fetch, variant/stock derivation, reviews
  blend, cart/buy-now handlers) in the page.
- (MODIFY) `src/pages/ProductDetails/ProductDetails.module.css` — brand re-skin of the breadcrumb,
  layout grid, buy box, KEY FEATURES list, stock pills, CTAs, trust row, skeleton, not-found.
- (MODIFY, for brand parity only) `src/components/storefront/ProductGallery.module.css`,
  `PriceBlock.module.css`, `VariantSelector.module.css`, `QuantityStepper.module.css`,
  `AddToCartBar.module.css`, `TrustBadges.module.css`, `DeliveryReturnsInfo.module.css`,
  `SocialProof.module.css` — and their markup ONLY as needed for brand parity. **Keep every component's
  prop contract and the authenticity guarantees documented in `STOREFRONT_UX_GUIDELINES.md`.**
- **OUT of scope:** the tabbed section (Description/Specifications/Fabric & Craft/Reviews/FAQs) and the
  cross-sell rails (RelatedProducts / FrequentlyBoughtTogether / ReviewsSection) — those are
  `prompts/17-pdp-tabs-and-cross-sell.md`. Also out: the storefront `ProductCard`, the Header/Footer,
  `db.json`, admin.

## Detailed Requirements

### A. Keep the page's data wiring (do not move it into components)
1. Keep the existing data layer untouched in behavior: `fetchProduct` (slug + legacy-id resolution +
   canonical redirect + recently-viewed write), `fetchReviews` (approved-only), `fetchAov`, and the
   `apiService.settings.get()` / `apiService.shipping.getMethods()` effects. Keep the derived values:
   `images`, `currentPrice` (variant-aware), `comparePrice`, `discount`, `currentSku`, `currentStock`,
   `isOutOfStock`, `isLowStock` (using the product's REAL `lowStockThreshold`), `maxQuantity`, and the
   reviews blend (`displayAvg`, `totalRatingsCount`). Keep `handleAddToCart`, `handleAddClick` (with the
   "Added ✓" state), `handleBuyNow`, and `scrollToReviews`.
2. Components stay presentational and keep their prop contracts:
   - `ProductGallery({ images, alt, discount, zoom })`
   - `SocialProof({ rating, count, onReviewsClick, size })`
   - `PriceBlock({ price, comparePrice, currency, size, showSavings, taxNote })`
   - `VariantSelector({ variants, value, onChange, productStock, currency })`
   - `QuantityStepper({ value, onChange, min, max, disabled, size })`
   - `TrustBadges({ ids, settings, shipping, variant })`
   - `DeliveryReturnsInfo({ shipping, settings, returnsWindowDays, currency })`
   - `AddToCartBar({ anchorRef, price, comparePrice, currency, image, name, disabled, onAddToCart,
     onBuyNow })`

### B. Breadcrumb
3. Keep the existing breadcrumb (Home › {category.name} › {product.name}) wired to the fetched
   `category` and `categoryParam`. Re-skin to brand: muted links, gold/`--sf-color-text` current item.

### C. Gallery (left) — vertical thumb rail + PREMIUM ribbon
4. Render `<ProductGallery images={images} alt={product.name} discount={discount} />`. Restyle
   `ProductGallery.module.css` so the **thumbnail strip sits vertically to the LEFT** of the large image
   on desktop (and below on mobile), matching the design — the component already renders thumbs + main
   image + arrow-key nav + hover-zoom; do not break its keyboard/zoom behavior. The discount badge it
   draws should use `--sf-color-discount`.
5. Add a gold **"PREMIUM"** ribbon over the gallery image when the product is genuinely flagged (e.g.
   `product.featured === true` or a bridal/premium tag). Implement it in the PDP layer (an overlay in
   `ProductDetails.js` positioned over `.gallerySection`) OR pass a small additive prop — but if you add
   a prop to `ProductGallery`, keep it backward-compatible (default off) and document it. Style with
   `--sf-gradient-gold` + dark text. Do not show it unconditionally.

### D. Buy box (right)
6. Order, top-to-bottom, matching the design:
   - **Category label** (small, uppercase, gold/muted) — from the fetched `category.name`.
   - **Title** — `product.name` in `--sf-font-display`, large.
   - **SocialProof** — `<SocialProof rating={displayAvg} count={totalRatingsCount}
     onReviewsClick={scrollToReviews} />`. It already shows "No ratings yet" when count is 0 — keep that
     honest empty state.
   - **PriceBlock** — `<PriceBlock price={currentPrice} comparePrice={comparePrice} currency="INR"
     size="lg" taxNote={settings?.store?.taxIncluded === false ? "Exclusive of taxes — calculated at
     checkout" : "Inclusive of all taxes"} />`. Gold price, struck compare, "% off", and "You save ₹X"
     are derived inside the component — do not hardcode any of them.
   - **KEY FEATURES** — a bulleted list. Source from real data: prefer an explicit `product.features` /
     `product.highlights` array if present; otherwise derive concise bullets from
     `product.shortDescription` / key spec fields. Omit the block entirely if there's nothing real to
     show. Keep `product.shortDescription` visible if it isn't repurposed into the bullets.
   - **VariantSelector** — render when `product.variants?.length > 0`:
     `<VariantSelector variants={product.variants} value={selectedVariant} onChange={setSelectedVariant}
     productStock={product.stock} currency="INR" />`. It auto-groups by attribute, so **Fabric** and
     **Color** rows appear from `variants[].attributes` with real color chips from `swatchHex`; impossible
     combos are disabled and per-variant price/stock are real. Do not convert it to a dropdown.
   - **QUANTITY + stock** — keep the `QuantityStepper` (max = real `maxQuantity`) and the honest stock
     status: "Out of Stock" / "Only {currentStock} left — order soon!" (only within the real
     `lowStockThreshold`) / "In Stock". Style the "In Stock" as a green/emerald pill per the design.
   - **CTAs** — **Buy Now (gold)** and **Add to Cart (emerald)**, plus the wishlist heart button. Keep
     the wiring: Add to Cart → `handleAddClick` (shows "Added to Cart ✓"); Buy Now → `handleBuyNow`
     (adds then navigates to `/checkout`); wishlist → `toggleWishlist(product)` with `aria-pressed`. In
     the design Buy Now is gold and Add to Cart is emerald — set the button styles accordingly. Both
     disabled when `isOutOfStock`.
   - **TrustBadges** — `<TrustBadges settings={settings} shipping={shipping} variant="grid" />`
     (config-driven; dynamic numbers resolve from live data).
   - **DeliveryReturnsInfo** — `<DeliveryReturnsInfo shipping={shipping} settings={settings}
     currency="INR" />` (real shipping methods/rates/free-above, COD, returns window, tax note). The
     design's "Check Delivery" affordance maps to this real, store-configured block — do NOT add a
     fabricated pincode-serviceability guesser (it was deliberately removed for authenticity).

### E. 4-card trust row
7. Under the buy box (or spanning beneath both columns, per the design) render a **4-card trust row**:
   **Offers** · **Free shipping** · **100% authentic** · **Handwoven by artisans**, each with an icon
   and one line. These are owner-attested statements (you may reuse `TrustBadges` with a tailored `ids`
   list, or build a small token-driven card row). Where a card implies a number (free-shipping
   threshold), resolve it from live `settings`/`shipping` — do not hardcode it. Use `--sf-cat-*` accents
   for the icon chips if desired.

### F. Sticky mobile Add-to-Cart + states
8. Keep the sticky mobile `AddToCartBar` wired to `buyBoxRef`, the real `currentPrice`/`comparePrice`,
   `image`, `name` (variant-aware), `disabled={isOutOfStock}`, `onAddToCart={handleAddClick}`,
   `onBuyNow={handleBuyNow}`. Re-skin it: gold Buy Now + emerald Add to Cart, `--sf-z-stickybar`.
9. Re-skin the loading `Skeleton` and the `NotFound` state to brand tokens (keep their structure).

### G. Responsiveness & a11y
10. Mobile-first: gallery on top (thumbs below the main image), buy box stacked beneath; CTAs full-width;
    the sticky bar appears once the in-page buy box scrolls away (existing IntersectionObserver). Desktop:
    two-column layout (gallery left, buy box right) within `--sf-container-max`.
11. Accessibility: keep ARIA on the gallery, social-proof button, variant radiogroups, quantity stepper;
    `:focus-visible` (`--sf-shadow-focus`) on all controls; ≥44px targets. Lazy images (gallery already
    lazy-loads).

## Data / API Notes
- `apiService.products.getBySlug` / `getById` (page already handles both + canonical redirect),
  `apiService.products.getReviews` (approved only), `apiService.categories.getById`,
  `apiService.settings.get`, `apiService.shipping.getMethods`. AOV (`getRelated` /
  `getFrequentlyBoughtTogether`) feeds the cross-sell prompt — leave it wired.
- Product shape includes `variants[].attributes.Fabric` / `.Color` + `swatchHex`, `stock`,
  `lowStockThreshold`, `comparePrice`, `rating`, `totalReviews`, `featured`, `tags`. Settings carry
  `store.taxIncluded`/`taxRate` and `payment.codEnabled`/`codMaxOrder`. Shipping methods carry
  `flatRate`/`freeAbove`/`estimatedDays`.
- Do NOT add `fetch`/`axios` outside `apiService`; do NOT change `db.json` shapes or any component prop
  contract.

## Constraints (Do Not Break)
- Keep everything API-driven & functional: product/category/reviews/settings/shipping load via
  `apiService`; Add to Cart, Buy Now (→ `/checkout`), wishlist, variant selection, and quantity all work
  end-to-end via CartContext / WishlistContext.
- Components stay PRESENTATIONAL; data stays in the page. Preserve every prop contract listed above and
  the authenticity guarantees in `STOREFRONT_UX_GUIDELINES.md` (real social proof / variants /
  stock / delivery; no fabricated pincode serviceability, no fake urgency).
- Re-skin ONLY via tokens — no hardcoded hex in `ProductDetails.js` or any touched `*.module.css`.
- PREMIUM ribbon and KEY FEATURES bind to real product fields; never show them with no real backing.
- Do not modify the admin panel, the storefront `ProductCard`, the tabs/cross-sell (separate prompt), or
  `db.json`.
- Preserve the JSON Server ↔ Laravel swap contract.
- Accessibility (ARIA, `:focus-visible`, ≥44px), mobile-first, lazy images, sticky mobile CTA.

## Acceptance Criteria / Definition of Done
- [ ] The PDP above-the-fold matches `PRODUCT DETAILED PAGE.png`: breadcrumb, left gallery with a
      vertical thumb rail + gold PREMIUM ribbon + In-Stock pill, right buy box (category, serif title,
      rating, gold price + savings + tax note, KEY FEATURES, Fabric/Color swatches, quantity, gold Buy
      Now + emerald Add to Cart), delivery/returns, and a 4-card trust row.
- [ ] Variant selection shows Fabric + Color as swatches/chips (real `swatchHex`), reflects per-variant
      price/stock, and disables impossible combos; quantity max = real stock; stock pill is honest.
- [ ] Add to Cart shows "Added to Cart ✓" and updates the cart; Buy Now adds then navigates to
      `/checkout`; wishlist toggles with `aria-pressed`; the sticky mobile bar appears on scroll with
      gold Buy Now + emerald Add to Cart.
- [ ] Social proof shows real rating+count (or "No ratings yet"); price savings/discount and the tax
      note derive from real data; delivery/returns shows real store-configured info (no pincode
      guesser).
- [ ] Dark + light modes coherent; no raw hex in `ProductDetails.js` or the touched component CSS; no
      console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`, open a PDP via a card (`/products/:slug`). Confirm breadcrumb, vertical-thumb gallery,
   PREMIUM ribbon (on a featured/bridal product), serif title, gold price + "You save ₹X" + tax note,
   KEY FEATURES, Fabric/Color swatches, quantity, gold Buy Now + emerald Add to Cart, delivery/returns,
   and the 4-card trust row.
2. Pick different Fabric/Color options → price/stock and the selected meta update; an impossible combo is
   disabled; an out-of-stock option is marked.
3. Click Add to Cart → "Added to Cart ✓" + cart drawer/count updates. Click Buy Now → item added and you
   land on `/checkout`. Toggle the wishlist heart → reflected on `/wishlist`.
4. Find a product with `totalReviews: 0` → SocialProof shows "No ratings yet"; a product with a low
   `lowStockThreshold` near its stock → "Only N left" shows only when genuinely low.
5. Confirm DeliveryReturnsInfo lists the real shipping methods/rates/free-above + COD + returns window
   (no pincode input).
6. Resize to 375px → gallery on top, buy box stacked, CTAs full-width; scroll down → the sticky
   Add-to-Cart bar appears (gold Buy Now + emerald Add to Cart).
7. Toggle theme → PDP coherent in light mode. Open a non-existent slug → branded Not-Found.
8. Run `npm run build` → clean.
