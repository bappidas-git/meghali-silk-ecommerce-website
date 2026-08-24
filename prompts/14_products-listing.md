# Products Listing — the Collection Gallery

**Prompt 14 of 30**

## Depends on

Prompt 09 (ProductCard), Prompts 01/02/03. Prompt 05 (nav that links here) recommended.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/products` (`src/pages/Products/Products.js`, ~1300 lines) is the catalogue: URL-driven state via `useSearchParams` (`category` comma-joined slugs, `search`, `sort`, `page`, `per_page`, `min_price`, `max_price`), client-side filtering over `apiService.products.getAll()` + `categories.getAll()`, a toolbar (Filters button, chip scroller, sort select), a filter bottom-sheet/drawer with facets (hierarchical categories with counts, price ranges + manual, Fabric families, rating, discount, availability, brand), numbered pagination (12/24/48), skeletons, error and empty states.

## Objective

Redesign the catalogue into a gallery-like editorial browse — refined toolbar, elegant filter drawer, airy grid — with the entire URL contract, every facet, and pagination preserved bit-for-bit.

## Scope — files/areas to touch

- `src/pages/Products/Products.js` + `Products.module.css`
- Within `Products.js`, the ONLY permitted logic edit: update the hardcoded `FABRIC_FAMILIES` grouping list to the reseeded Assamese fabric vocabulary (verify against `db.json` `variants[].attributes.Fabric` — e.g. Muga Silk, Eri Silk, Pat Silk, blends), keeping the derive-from-data + hide-when-empty behavior.

## Brand & design requirements

1. **Page head:** breadcrumb (restyle the hand-rolled one), then an editorial header — serif collection title (`resultsHeading` reflects category/search context as now) + muted result summary; generous top padding.
2. **Toolbar:** one hairline row — "Filter" text-button with active-count, the chip scroller (active category/price/fabric chips as refined `sf-chip`s with removal ×), and Sort as a quiet underline select (native `<select>` retained for a11y, restyled). Sticky below the header is acceptable if calm.
3. **Grid:** 4/3/2-col airy grid of the Prompt 09 ProductCard, wide gutters (`--sf-space-8+`), no card boxes; hairline row separators optional. Skeleton grid on `sf-skeleton` primitives; fetch-error panel (Try Again preserved) and the empty state redesigned as warm editorial moments (refine or replace the inline `EmptyIllustration` in the brand line style + "Clear filters" action).
4. **Filter drawer:** the bottom-sheet (mobile) / drawer becomes an editorial filter panel — tracked-uppercase facet titles, hairline separators, refined checkboxes/chips: hierarchical categories with counts and parent-includes-children scope, the four price quick-ranges + manual min/max + Go, Fabric families (reseeded vocabulary), Customer Rating (4★+…), Discount (50/30/20/10%+), In-stock toggle, Brand list. Footer: "Clear all" + "Show N results" (count preserved). `AnimatePresence` overlay softened to the token easing.
5. **Pagination:** restyle as minimal editorial pagination — prev/next word-buttons + numbers with the ellipsis logic and per-page select preserved; "Page X of Y" line kept.
6. Dark parity via tokens; NOTE: this page currently does not consume `useTheme` — keep it that way (tokens + `body.dark` cascade handle theming).

## Functional guardrails

1. Preserve the URL contract EXACTLY: params `category` (comma slugs, legacy-id canonicalization), `search`, `sort` (+ all `SORT_ALIASES`), `page`, `per_page`, `min_price`, `max_price`; defaults omitted; `replace: true` semantics; deep links from Header/Home/Footer must keep resolving.
2. Preserve all filtering/sorting/pagination logic: `getCategoryScopeIds` hierarchy, per-category counts, session-only facets (fabric/rating/discount/availability/brand) staying out of the URL, `clearAllFilters` preserving `per_page`, `safePage` clamping, post-commit scroll with `getDeviceType` offsets, `PER_PAGE_OPTIONS [12,24,48]`.
3. API-driven as-is: `products.getAll` + `categories.getAll` in the retryable `fetchCatalog`; no new endpoints, no server-side assumptions.
4. Tokens/primitives only; zero hex (the local `--empty-*` SVG vars may be repointed to tokens).
5. Do NOT modify the admin panel.
6. Responsive + accessible: filter sheet traps focus + Escape-closes; facets keyboard-operable with visible focus; chips removable by keyboard; grid landmarks/headings sensible; reduced motion honored. No fabricated trust signals (counts are real; no "N sold today").
7. Test before done — see below.

## Implementation notes

- This file is large — restyle in place, keeping state hooks/memos intact; the risk is regression via accidental logic edits, so diff-check logic blocks after.
- Verify chip active-state matching still works after restyle (`isChipActive`-style logic lives here for filters).
- Confirm the reseeded catalogue exercises every facet: at least one product per fabric family, a mix of discounts, one out-of-stock product (adjust nothing in db.json here — just verify; report gaps for the data prompt if found).
- Empty-state art: keep it inline-SVG token-driven.

## Acceptance criteria

- [ ] Catalogue reads editorial (airy grid, hairline toolbar, refined drawer) — structurally distinct from the old marketplace look.
- [ ] Deep links all work: `/products?category=<new-slug>`, `?search=muga`, `?sort=discount`, `?min_price=&max_price=`, `?page=2&per_page=24` — and combinations.
- [ ] Every facet filters correctly with live counts; fabric facet shows the Assamese vocabulary; clear-all resets (keeping per_page).
- [ ] Pagination + per-page + clamping + smooth scroll offsets work at all breakpoints.
- [ ] Skeleton, error (Try Again), and empty states all restyled and functional.
- [ ] Light/dark parity; keyboard + focus-trap pass; no hex.

## Test & QA

- `npm run dev`: from Header nav and Home CTAs into filtered views; verify URL round-trips (reload restores state).
- Apply 3 facets + a price range → results + counts correct → remove via chips → clear all.
- Kill JSON Server → error panel + Try Again; restart → recovers.
- 375 (bottom sheet) / 768 / 1024 / 1440 (drawer) passes; both themes; reduced motion.
- Add to cart + wishlist from the grid.
- Admin untouched.
