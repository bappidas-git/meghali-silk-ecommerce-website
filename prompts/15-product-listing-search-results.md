<!-- Batch D — Storefront Pages -->
# Prompt 15 — Product Listing & Search Results

## Objective
Re-skin and restructure the listing/search page `src/pages/Products/Products.js` into the **Meghali's
Silk** look from `UI Designs/PRODUCT LISTING.png`: a result header that echoes the search query and a
live result count, brand filter chips (category / price range / fabric / sort) operating **client-side**,
a responsive grid of the unified storefront `ProductCard`, skeleton loading, and an honest empty state
("No silk found for …"). Preserve all existing filtering/sorting and URL-param handling — re-skin and
re-layout only; bind the count to real results (no fabrication).

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house selling authentic women's silk apparel. Dark-first
storefront (charcoal canvas, deep bottle-green panels, gold/champagne accents, emerald CTAs, elegant
serif headings).

Match **`UI Designs/PRODUCT LISTING.png`**: a search bar at the top (global Header chrome), a results
heading like **Results for "Elegant silk sarees for wedding"**, a row of filter/sort chips, then a grid
of dark portrait product cards (discount badge, heart, gold price + struck compare, star rating).

Use ONLY tokens from `src/theme/storefront-tokens.css` (no hardcoded hex):
- Surfaces/text/border: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`,
  `--sf-color-surface-hover`, `--sf-color-text`, `--sf-color-text-secondary`, `--sf-color-border`,
  `--sf-color-border-strong`.
- Chips/active state: `--sf-color-emerald` or `--sf-color-gold` for the selected chip; `--sf-color-surface-2`
  for the resting chip.
- Stars: `--sf-color-star`. Price/discount handled by `ProductCard`/`PriceBlock`.
- Headings use `--sf-font-display`; body `--sf-font-family`.
- Radius/space/shadow/motion: `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`. Tap
  target `--sf-tap-target` (≥44px). Container width `--sf-container-max` (1280px).

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/Products/Products.js` — re-skin + restructure to the design while preserving the
  existing client-side filter/sort logic, URL param sync, pagination, and mobile filter sheet. Prefer
  replacing the page-local `renderProductCard` markup with the shared storefront `ProductCard` (see A).
- (MODIFY) `src/pages/Products/Products.module.css` — full brand re-skin (header, chips, grid, skeleton,
  empty/error states, pagination, mobile sheet) via tokens. Map any local aliases
  (e.g. `--card-bg`, `--accent`) onto `--sf-*`.
- **OUT of scope:** the storefront `ProductCard` component itself (its own prompt — here you USE it); the
  global Header/search bar; the PDP; `db.json`; admin.

## Detailed Requirements

### A. Use the shared ProductCard
1. Replace the inline `renderProductCard` card markup (and the local `RatingStars`/`HeartIcon`/`CartIcon`
   used only by it) with the shared component:
   `import ProductCard from "../../components/storefront/ProductCard";`. Render each result as:
   ```jsx
   <ProductCard
     product={product}
     onAddToCart={(cartItem) => addToCart(cartItem)}   // shared card passes a cart item
     onToggleWishlist={(p) => toggleWishlist(p)}
     isWishlisted={isInWishlist(product.id)}
   />
   ```
   NOTE the shared card calls `onAddToCart(buildCartItem(product))` itself, so the listing handler must
   accept a cart item (do NOT re-wrap with `buildCartItem`). This consolidates the two divergent card
   designs into one brand card. You MAY keep the existing list-view variant if the design needs it, but
   the grid (default) must use the shared card. Keep `useCart()` / `useWishlist()`.

### B. Result header (query echo + live count)
2. Add a results header above the grid:
   - When `urlSearch` (the `search` URL param, already read as `urlSearch`) is present, show
     **Results for "{urlSearch}"** with the query in quotes, using `--sf-font-display`.
   - When a single category is selected, show the category name as the heading instead (reuse the
     existing `getCategoryName` / `breadcrumbItems` logic).
   - Always show a **live count** bound to real results — reuse the existing `filteredProducts.length`
     copy in the sort bar ("Showing N products" / "Showing X–Y of N"). The count must reflect the actual
     filtered set (never a hardcoded/marketing number). Keep the existing loading ("Loading products…"),
     error ("Couldn't load products"), and zero ("No products found") states wired to `loading` /
     `fetchError` / `filteredProducts.length`.

### C. Filter chips (client-side, preserve behavior)
3. Surface the filters as **chips** matching the design (category, price range, fabric, sort) in addition
   to / instead of the existing sidebar, but KEEP the underlying state and handlers exactly:
   `selectedCategories` + `handleCategoryToggle`, `minPrice`/`maxPrice` + `handlePriceRangeClick`/
   `handlePriceApply` (with `PRICE_RANGES`), `sortBy` + `handleSortChange` (with `SORT_OPTIONS` /
   `normalizeSort`), and the existing rating/discount/in-stock/brand filters. All filtering/sorting stays
   **client-side** over the data from `apiService.products.getAll()` + `apiService.categories.getAll()`
   (the page already fetches the full catalog and filters in `useMemo`). Do not move filtering to the
   server.
   - **Fabric filter:** the design shows a "Fabric" chip. Silk products carry fabric in
     `variants[].attributes.Fabric` (e.g. Tussar/Mulberry/Eri/Muga/Banarasi/Kanjivaram) and/or in
     `tags`. Add a client-side fabric facet derived from the loaded products (collect distinct fabric
     values from `variants[].attributes.Fabric` and matching `tags`), and filter the result set by the
     selected fabric(s). Derive options from real data only — if no products expose a fabric, hide the
     chip. Keep it consistent with the existing `availableBrands` pattern (a `useMemo` over
     `allProducts`).
4. The active chip uses an emerald/gold fill; chips are real buttons (≥44px) with `aria-pressed`. Keep
   the existing **Clear All** affordance (`clearAllFilters`) and the mobile bottom-sheet filters
   (`mobileFiltersOpen`, focus management, Escape-to-close, body-scroll lock) — just re-skin them.

### D. URL params (do not regress)
5. Preserve the URL-as-source-of-truth behavior exactly: reading `category`, `search`, `sort`, `page`,
   `per_page`, `min_price`, `max_price`; the `syncUrlParams` writer; the legacy `?category=<id>` →
   slug canonicalization; the page-clamp effect; and the post-pagination scroll. Do NOT change the param
   names or the merge/override semantics in `syncUrlParams` (its closure-override contract is load-
   bearing). A fabric facet, if added, can be **session-only** (like rating/discount/in-stock) and reset
   to page 1 via `resetToFirstPage` — it does not need to be a URL param.

### E. Grid, skeleton, empty/error
6. Responsive grid of `ProductCard`: ~4 columns desktop, 2–3 tablet, 2 mobile (token spacing). Keep the
   page's existing pagination controls and per-page selector, restyled to tokens.
7. Skeleton loading: keep the `SkeletonCard` placeholders during `loading` (restyle to brand surfaces +
   shimmer). Keep the **error** panel distinct from the empty state (the existing `fetchError` branch
   with a Try-Again button → `fetchCatalog`) — never show "No silk found" when the fetch actually failed.
8. **Honest empty state:** when `filteredProducts.length === 0` after a successful load, show a brand
   empty state. Rephrase to the silk voice, e.g. **"No silk found for "{urlSearch}""** when a query is
   present (otherwise "No silk matches your filters"), with a **Clear All Filters** button shown when
   `hasAnyConstraint`. Bind the message to the real query — do not invent results or counts.

### F. Polish & a11y
9. Mobile-first: header + chips wrap/scroll; the filter sheet opens from the bottom on mobile. All
   controls ≥44px with `:focus-visible` (`--sf-shadow-focus`). Lazy-load images (the shared card already
   does). Keep Framer Motion reveals reduced-motion safe.

## Data / API Notes
- `apiService.products.getAll()` + `apiService.categories.getAll()` load the catalog (already fetched in
  `fetchCatalog`). All filtering/sorting is client-side in the existing `useMemo`
  (`filteredProducts`/`paginatedProducts`). The page also tolerates `apiService.products.search(query)` /
  `getByCategory(categoryId)` as alternate data paths, but the current client-side approach reading
  `search`/`category` URL params is the contract — keep it.
- URL params: `category` (comma-separated slugs), `search`, `sort`, `page`, `per_page`, `min_price`,
  `max_price`. Product shape includes `variants[].attributes.Fabric` (fabric facet) and `tags`.
- The result count must equal the real `filteredProducts.length`. Do NOT add `fetch`/`axios` outside
  `apiService`; no `db.json` shape changes.

## Constraints (Do Not Break)
- Keep everything API-driven & functional: catalog via `apiService`; Add-to-Cart / wishlist via the
  shared card callbacks (CartContext / WishlistContext); the result count reflects real filtered data.
- Preserve ALL existing filtering, sorting, pagination, URL-param sync, legacy-id canonicalization, and
  mobile-sheet focus/scroll behavior. Do not rename URL params or alter `syncUrlParams` override
  semantics.
- Re-skin ONLY via tokens — no hardcoded hex in `Products.js` (inline styles like the current
  `fill="#f59e0b"` / `stroke="#ec4899"` must move to tokens) or `Products.module.css`.
- Authenticity > persuasion: no fabricated result counts, no fake "X people viewing", no invented
  discounts (the card derives discounts from real prices). Empty state is honest.
- Use the shared `src/components/storefront/ProductCard` for the grid.
- Do not modify the admin panel, the global Header/search, the PDP, or `db.json`.
- Preserve the JSON Server ↔ Laravel swap contract.
- Accessibility (chips as buttons with `aria-pressed`, sheet `role="dialog"`/`aria-modal`,
  `:focus-visible`, ≥44px), mobile-first, lazy images.

## Acceptance Criteria / Definition of Done
- [ ] The page matches `PRODUCT LISTING.png`: a "Results for '<query>'" header (or category name), a live
      real count, brand filter/sort chips, and a responsive grid of the shared storefront `ProductCard`.
- [ ] A fabric facet (Tussar / Mulberry / Eri / Muga / Banarasi / Kanjivaram, etc.) is derived from real
      product data and filters client-side; it hides when no product exposes a fabric.
- [ ] All existing filters/sorts/pagination still work and stay reflected in the URL; deep links
      (`/products?search=…&category=…&sort=…`) reproduce the same result set; legacy `?category=<id>`
      canonicalizes to the slug.
- [ ] Skeletons show while loading; the fetch-error panel (Try Again) is distinct from the empty state;
      the empty state reads "No silk found for '<query>'" and offers Clear All when constrained.
- [ ] The result count equals the actual filtered product count (verify by changing filters).
- [ ] Dark + light modes coherent; no raw hex in `Products.js`/`Products.module.css`; no console errors;
      `npm run build` clean.

## Verification Steps
1. `npm run dev`. From the header search, search e.g. "wedding saree" → the page shows
   **Results for "wedding saree"** with a matching count and a grid of brand cards.
2. Toggle category / price-range / fabric / sort chips → results and the count update live; the URL
   updates (`?search=…&category=…&sort=…&min_price=…`); reload reproduces the same state.
3. Click a fabric chip (e.g. Tussar) → only products with that fabric remain; confirm the chip is hidden
   if no product exposes a fabric.
4. Add a product to cart from the grid (card shows "Added ✓") and toggle a heart → it appears on
   `/wishlist`.
5. Apply filters that match nothing → the honest "No silk found for '<query>'" empty state with Clear
   All; click Clear All → results return.
6. Simulate a fetch failure (block `/products`) → the "Couldn't load products" panel with Try Again
   (NOT the empty state); Try Again refetches.
7. Open the mobile filter sheet at 375px → it slides up, traps focus, closes on Escape and on Apply;
   chips/buttons are ≥44px.
8. Deep-link `/products?category=<numeric id>` → it canonicalizes to the slug; `/products?page=2` paginates
   and scrolls to the top of results.
9. Toggle theme → coherent. Run `npm run build` → clean.
