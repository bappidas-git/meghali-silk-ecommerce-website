<!-- Batch D — Storefront Pages -->
# Prompt 17 — PDP Tabs (Specifications table) & Cross-Sell

## Objective
Re-skin and extend the **below-the-fold Product Detail Page** in
`src/pages/ProductDetails/ProductDetails.js`: a brand tabbed section (Description / Specifications /
Fabric & Craft / Reviews / FAQs) — where Specifications renders a 2-column silk **spec table** driven by
real product fields (omitting rows with no data) — plus the cross-sell rails below the tabs:
`RelatedProducts` ("You May Also Like") and `FrequentlyBoughtTogether`, with the `ReviewsSection` inside
the Reviews tab. Match `UI Designs/PRODUCT DETAILED PAGE SPECIFICATION.png`. Everything is data-driven;
component prop contracts and authenticity guarantees are preserved.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house selling authentic women's silk apparel. Dark-first
storefront (charcoal canvas, deep bottle-green panels, gold/champagne accents, emerald CTAs, elegant
serif headings).

Match:
- **`UI Designs/PRODUCT DETAILED PAGE SPECIFICATION.png`** — the active **Specifications** tab showing a
  two-column **Product Specification** table (Warp Yarn, Weft Yarn, Design, Saree Length, Blouse Length,
  Border Width, Blouse Width, Weave Type, Origin, Occasion, Craft Time), with the tab bar above
  (Description · Specifications · Fabric & Craft · Reviews · FAQs) and the "You May Also Like" rail below.
- The lower part of **`UI Designs/PRODUCT DETAILED PAGE.png`** — the Description tab and the
  "You May Also Like" rail of brand product cards.

Use ONLY tokens from `src/theme/storefront-tokens.css` (no hardcoded hex):
- Tab bar: active tab uses gold (`--sf-color-gold`) underline/text; resting tabs `--sf-color-text-secondary`.
- Table: `--sf-color-surface` / `--sf-color-surface-2` row striping, `--sf-color-border` hairlines,
  `--sf-color-text` values, `--sf-color-text-secondary` labels.
- Headings use `--sf-font-display`. Cross-sell cards/rating/price come from `ProductCard`/`PriceBlock`/
  `StarRating` (don't re-implement).
- Radius/space/shadow/motion: `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`. Tap
  target `--sf-tap-target` (≥44px). Container `--sf-container-max`.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/ProductDetails/ProductDetails.js` — replace the current 2-tab (Description /
  Reviews) section with the 5-tab section (Description · Specifications · Fabric & Craft · Reviews · FAQs)
  and the spec table; keep the cross-sell rails below it. Keep ALL data wiring in the page.
- (MODIFY) `src/pages/ProductDetails/ProductDetails.module.css` — brand re-skin of the tab bar, tab
  panels, and the spec table.
- (MODIFY, for brand parity only) `src/components/storefront/RelatedProducts.module.css`,
  `FrequentlyBoughtTogether.module.css`, `ReviewsSection.module.css` — and their markup ONLY as needed
  for brand parity. **Keep their prop contracts and authenticity guarantees** (see
  `STOREFRONT_UX_GUIDELINES.md`).
- **OUT of scope:** the above-the-fold layout/buy box (handled by `prompts/16-pdp-layout.md`); the
  storefront `ProductCard` internals (used by the rails — its own prompt); the Header/Footer; `db.json`;
  admin.

## Detailed Requirements

### A. Tabbed section (5 tabs, accessible)
1. Replace the existing two-button tab nav with a five-tab `role="tablist"` (keep the `tabsRef` so
   `scrollToReviews` from the buy box still jumps here and selects Reviews):
   **Description · Specifications · Fabric & Craft · Reviews · FAQs**. Each tab is a `role="tab"` button
   with `aria-selected`; panels are `role="tabpanel"`. Keep the active state in `activeTab`
   (extend the allowed values). Keep the Reviews tab label showing the real count
   (`Reviews ({reviews.length})`). Re-skin: gold active underline, smooth panel transition (reduced-motion
   safe). On mobile the tab bar scrolls horizontally.
2. **Description** tab — render `product.description` (keep the existing honest fallback "No description
   available." only if truly empty). Brand typography.
3. **Reviews** tab — render the existing `<ReviewsSection reviews={reviews} displayAvg={displayAvg}
   totalRatingsCount={totalRatingsCount} loading={reviewsLoading} error={reviewsError}
   onRetry={fetchReviews} />`. Reviews are approved-only (via `apiService.products.getReviews`), with
   honest empty/error/loading states and UGC photos when a review has them — keep all of that intact.
4. **FAQs** tab — render product/brand FAQs. Source from `FAQ_ITEMS` in `src/utils/constants.js`
   (`{ question, answer }[]`) and/or a product-specific `product.faqs` array if present. Render as an
   accessible accordion (buttons with `aria-expanded`, ≥44px). Omit the tab content gracefully (or hide
   the tab) if there are no FAQs.

### B. Specifications tab — the silk spec table (real data only)
5. The **Specifications** tab renders a **two-column table** ("Product Specification") with these rows,
   IN ORDER: **Warp Yarn, Weft Yarn, Design, Saree Length, Blouse Length, Border Width, Blouse Width,
   Weave Type, Origin, Occasion, Craft Time**.
6. Drive each row from real product data — **omit any row that has no value** (no fabrication, no
   placeholder dashes for missing data). Read values from, in priority order:
   - a structured `product.specifications` / `product.specs` object if present (e.g.
     `{ "Warp Yarn": "Tussar Silk", "Weave Type": "Traditional Handloom", ... }`), then
   - `product.attributes` (a generic map), then
   - sensible existing fields where they map (e.g. `product.dimensions` for lengths/widths,
     `category?.name` for context, `variants[].attributes.Fabric` for yarn/weave hints).
   Build the row list by checking each label and pushing `{ label, value }` only when a non-empty value
   exists. If NO rows resolve, show an honest note (e.g. "Full specifications coming soon") rather than an
   empty table — but prefer that the catalog data (seeded by Batch B) supplies these fields. Keep the
   existing generic spec fallback (Brand/SKU/Weight/Dimensions/Category/Tags) available, but the
   silk-specific labels above take precedence and match the design.
7. **Fabric & Craft** tab — a richer narrative panel about the fabric, weave, and artisan craft. Source
   from real fields: prefer `product.fabricAndCraft` / `product.craftStory` if present; otherwise
   compose from real spec values (Weave Type, Origin, Craft Time, Fabric) and `product.description`
   fragments. Omit the tab content if there's nothing real to show. Do NOT invent provenance claims.

### C. Cross-sell rails (below the tabs, data-driven)
8. Keep the cross-sell rails BELOW the tabs, in this order, wired to the page's existing AOV state:
   - `<FrequentlyBoughtTogether anchor={product} companions={bundle} onAddToCart={addToCart}
     currency="INR" />` — it renders **nothing** when `bundle` is empty (curated
     `frequentlyBoughtTogetherIds` only). Do not force it to show fabricated companions.
   - `<RelatedProducts title="You May Also Like" products={relatedProducts} onAddToCart={addToCart}
     onToggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />` — it renders nothing when
     `relatedProducts` is empty. Update the title to "You May Also Like" to match the design.
   These use the shared `ProductCard` internally — keep the brand card consistent.
9. Re-skin `RelatedProducts.module.css` / `FrequentlyBoughtTogether.module.css` headings to
   `--sf-font-display`, the horizontal scroller to brand surfaces, and the FBT checklist/total/Add button
   to tokens (emerald Add button). Keep the FBT total computed from real prices (no fake bundle
   discount).

### D. Polish & a11y
10. Mobile-first: the tab bar scrolls horizontally; the spec table stays readable (2-column, wrapping
    values) or collapses to stacked label/value rows on the narrowest widths. Cross-sell rails scroll
    horizontally with accessible controls. All interactive elements get `:focus-visible`
    (`--sf-shadow-focus`) and ≥44px targets. Keep Framer Motion tab transitions reduced-motion safe.

## Data / API Notes
- `apiService.products.getReviews(productId)` (approved only) → Reviews tab via `ReviewsSection`.
- `apiService.products.getRelated(product, limit)` → `relatedProducts`;
  `apiService.products.getFrequentlyBoughtTogether(product, limit)` → `bundle` (curated
  `frequentlyBoughtTogetherIds`; empty → FBT hides). These are already fetched in the page's `fetchAov`.
- Spec/FAQ data: read from product fields (`specifications`/`specs`/`attributes`/`dimensions`/`faqs`/
  `fabricAndCraft`) and `FAQ_ITEMS` from `src/utils/constants.js`. The silk spec fields are seeded into
  `db.json` products by Batch B prompts; here you only READ them. Omit missing rows.
- Do NOT add `fetch`/`axios` outside `apiService`; do NOT change `db.json` shapes or any component prop
  contract.

## Constraints (Do Not Break)
- Keep everything API-driven & functional: reviews load (approved-only) via `apiService`; related/bundle
  load via `apiService`; Add-to-Cart / wishlist on the rails work via CartContext / WishlistContext.
- Components stay PRESENTATIONAL; the spec/FAQ/fabric data assembly lives in the page. Preserve
  `ReviewsSection` / `RelatedProducts` / `FrequentlyBoughtTogether` prop contracts and the authenticity
  guarantees in `STOREFRONT_UX_GUIDELINES.md` (approved reviews only, honest empty states, curated FBT,
  no fabricated co-purchase stats).
- Re-skin ONLY via tokens — no hardcoded hex in `ProductDetails.js` or the touched `*.module.css`.
- Specifications/Fabric & Craft/FAQs render ONLY real data; **omit rows/tabs with no data** — never
  fabricate spec values or provenance.
- Do not modify the admin panel, the storefront `ProductCard`, the above-the-fold PDP (separate prompt),
  or `db.json`.
- Preserve the JSON Server ↔ Laravel swap contract.
- Accessibility (`role="tablist"/"tab"/"tabpanel"`, `aria-selected`, accordion `aria-expanded`,
  `:focus-visible`, ≥44px), mobile-first.

## Acceptance Criteria / Definition of Done
- [ ] The PDP shows a 5-tab section (Description · Specifications · Fabric & Craft · Reviews · FAQs) with
      a gold active state, matching `PRODUCT DETAILED PAGE SPECIFICATION.png`.
- [ ] The Specifications tab renders a 2-column table with the silk rows (Warp Yarn, Weft Yarn, Design,
      Saree Length, Blouse Length, Border Width, Blouse Width, Weave Type, Origin, Occasion, Craft Time),
      driven by real product fields, with **missing rows omitted** (no fabricated/placeholder values).
- [ ] The Reviews tab uses `ReviewsSection` (approved reviews, honest empty/error states, UGC photos
      when present); the buy-box "ratings" link still jumps here and selects Reviews.
- [ ] FAQs render as an accessible accordion from real FAQ data; Fabric & Craft shows real
      fabric/weave/craft info or is omitted.
- [ ] Below the tabs, "You May Also Like" (`RelatedProducts`) and `FrequentlyBoughtTogether` render only
      when there is real data, using the shared brand `ProductCard`; FBT total is computed from real
      prices.
- [ ] Dark + light modes coherent; no raw hex in `ProductDetails.js` or the touched component CSS; no
      console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`, open a PDP (`/products/:slug`). Click each tab → Description, Specifications, Fabric &
   Craft, Reviews, FAQs panels render with a gold active tab.
2. On Specifications, confirm the 2-column silk spec table; verify a product missing some fields omits
   exactly those rows (no blanks/dashes).
3. From the buy box, click the rating/social-proof → it scrolls to the tabs and selects Reviews; confirm
   approved reviews (with UGC photos where present) and an honest empty state on a product with no
   reviews.
4. Open FAQs → accordion items expand/collapse via keyboard (`aria-expanded`); Fabric & Craft shows real
   content or is omitted.
5. Scroll below the tabs → "You May Also Like" and "Frequently bought together" render with brand cards;
   on a product with no curated `frequentlyBoughtTogetherIds`, FBT is absent; on one with no related,
   that rail is absent. Tick/untick FBT items → the total updates from real prices; Add N to Cart works.
6. Resize to 375px → tab bar scrolls horizontally, the spec table stays readable, rails scroll; tap
   targets ≥44px.
7. Toggle theme → tabs/table/rails coherent in light mode.
8. Run `npm run build` → clean.
