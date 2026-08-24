# Product Detail — Gallery & Buy Box

**Prompt 15 of 30**

## Depends on

Prompt 09 (PriceBlock/QuantityStepper/StarRating language), Prompts 01/02/03. Prompt 16 handles the PDP's lower half.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/products/:slug` (`src/pages/ProductDetails/ProductDetails.js`) resolves slug (numeric legacy id → canonical slug redirect), then renders: breadcrumb → two-column `mainLayout` — `ProductGallery` left; buy box right (category label, h1, `SocialProof`, `PriceBlock lg`, SKU, shortDescription, Key Features panel, `VariantSelector`, `QuantityStepper` + stock status, Buy Now / Add to Cart / wishlist, `TrustBadges variant="grid"`, `DeliveryReturnsInfo`) → a 4-card trust row → (tabs etc. = Prompt 16). `AddToCartBar` pins on mobile via IntersectionObserver on the buy box.

## Objective

Redesign the PDP's upper half into a gallery-forward editorial composition — large serene imagery, a calm confident buy box — preserving slug resolution, variant logic, stock states, cart/wishlist/Buy-Now flows, and the mobile sticky bar.

## Scope — files/areas to touch

- `src/pages/ProductDetails/ProductDetails.js` + `ProductDetails.module.css` — the breadcrumb, `mainLayout`, buy box, and trust-cards region ONLY (tabs/reviews/rails are Prompt 16; edit shared state carefully — one file serves both prompts)
- `src/components/storefront/ProductGallery.js` + `.module.css` — props stay `({ images, alt, discount, zoom, ribbon, inStock })`
- `src/components/storefront/VariantSelector.js` + `.module.css` — props stay `({ variants, value, onChange, productStock, currency })`; `variantUtils.js` is OFF-LIMITS
- `src/components/storefront/TrustBadges.js` + `.module.css` — `({ ids, settings, shipping, variant })`
- `src/components/storefront/DeliveryReturnsInfo.js` + `.module.css` — `({ shipping, settings, returnsWindowDays, currency })`
- `src/components/storefront/AddToCartBar.js` + `.module.css` — `({ anchorRef, price, comparePrice, currency, image, name, disabled, ctaLabel, onAddToCart, onBuyNow })`
- `src/components/storefront/SocialProof.js` + `.module.css` — `({ rating, count, onReviewsClick, size, className })`

## Brand & design requirements

1. **Composition:** generous asymmetric two-column (gallery ~55–60% / buy box sticky-scrolling right rail on desktop); consider the editorial move of a stacked large-image gallery column. Mobile: gallery first, buy box beneath, sticky bar as now.
2. **ProductGallery:** larger main stage (3:4), thumbnails as a quiet side/below strip (keep `role="tablist"` semantics + arrow keys), hover-zoom kept but subtle (`scale ~1.6–2`), badges restyled: discount as a small ink/gold mark, `ribbon` ("PREMIUM") as tracked hairline label, In-Stock pill quiet. Keep `PLACEHOLDER_IMG`/`onImageError` and the dots.
3. **Buy box:** editorial stack with hairline separations — tracked category eyebrow, serif h1 (large, 2-line comfortable), `SocialProof` as one quiet line (rating + count, click scrolls to reviews — preserved; honest "No ratings yet" state), `PriceBlock size="lg"` as the serif price moment + tax note, SKU in muted mono/small, shortDescription set with real line-height. Key Features panel → hairline list. `VariantSelector`: flat-mode price tiles and structured-mode attribute rows restyled (color rows stay swatch chips using `swatchHex`; sold-out hard-disabled with strikethrough; combo-unavailable muted; `.selectedMeta` low-stock line kept honest). Purchase row: refined stepper + stock status line (Out of Stock / "Only N left" / In Stock — real data only). Actions: Buy Now (primary `sf-btn`), Add to Cart (secondary, with the "Added ✓" moment), wishlist heart — same handlers, `openDrawer:false` Buy-Now path preserved.
4. **TrustBadges + DeliveryReturnsInfo:** merge visually into one calm "assurance" block — hairline grid of badge icon+label+live detail (dynamic values from settings/shipping — `resolveTrustBadgeDetail` — never stale copy), shipping methods list with real ETA/cost, returns window, COD note.
5. **Trust-cards row:** the 4 gradient cards become one editorial hairline band (offers/shipping/authentic/artisans copy retained, live free-ship threshold computed from `shipping[].freeAbove` kept).
6. **AddToCartBar (mobile):** slim ivory bar, hairline top, thumb+name+price+Add (+ Buy Now if present) — IntersectionObserver reveal logic untouched.

## Functional guardrails

1. Preserve all functionality & the API contract: slug/id resolution + canonical redirect (`navigate(..., {replace:true})`), `products.getById/getBySlug/getReviews/getRelated/getFrequentlyBoughtTogether`, `categories.getById`, `settings.get`, `shipping.getMethods`; recently-viewed localStorage write; variant state via `variantUtils` (NO logic edits); stock clamps; `addToCart`/Buy-Now→`/checkout`/wishlist flows; the `buyBoxRef` anchor contract with AddToCartBar.
2. Prop signatures of every touched component stay identical (other pages/prompts consume them).
3. Tokens/primitives only; zero hex.
4. Do NOT modify the admin panel.
5. Responsive + accessible: gallery keyboard-navigable, images alt-texted; buy box controls labeled; sticky elements never trap focus; ≥44px touch targets; reduced motion honored (no zoom transitions).
6. No fabricated trust signals: ratings/counts only from real data (blended avg logic preserved in the page); stock lines from real stock; badge details only when live data backs them (`null` hides them — keep that).
7. Test before done — see below.

## Implementation notes

- The page file also contains Prompt 16's regions — keep those rendering untouched below your work; shared state (`product`, `reviews`, `settings`, `shipping`, refs) serves both halves.
- Verify with seeded products: one multi-variant structured product (Fabric+Color), one flat-variant, one out-of-stock, one no-review, one premium (`isPremiumProduct` drives the ribbon).
- Desktop sticky buy box: cap with `position: sticky; top: <header height + gap>` — coordinate with the Prompt 05 header height.
- Legacy URL check: visit `/products/3` → redirects to the slug URL.

## Acceptance criteria

- [ ] PDP upper half reads editorial gallery + calm buy box — structurally distinct from the old layout.
- [ ] Slug + legacy-id resolution, canonical redirect, not-found state all work.
- [ ] Variants: both modes styled; sold-out/combo states correct; price/stock update on selection; swatches render `swatchHex`.
- [ ] Add to Cart (drawer opens, correct line + variant), Buy Now (straight to checkout, no drawer flash), wishlist toggle, quantity clamps — all work.
- [ ] Assurance block shows LIVE shipping/returns/COD details; trust band's free-ship threshold matches db.json.
- [ ] Mobile sticky bar appears when the buy box scrolls away; adds correctly.
- [ ] Light/dark parity; 375→1440; reduced motion; keyboard gallery + buy box pass; no hex.

## Test & QA

- `npm run dev`: exercise 4+ seeded products covering the matrix above (multi-variant, flat, OOS, no-review, premium, discounted vs full-price).
- Buy Now → Checkout carries the exact variant/qty; back → state sane.
- Change variant → price/stock/SKU update; select sold-out combo → correct disabled/muted behavior.
- Scroll: desktop sticky rail behaves; mobile bar reveals/hides at the right thresholds.
- SocialProof click scrolls to the reviews region (Prompt 16 area — still present).
- Both themes; keyboard-only purchase path up to the drawer; admin untouched.
