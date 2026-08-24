# Home — Editorial Sections & Page Composition

**Prompt 13 of 30**

## Depends on

Prompt 09 (ProductCard), Prompt 12 (hero + section conventions). Also 01/02/03 as always.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). Below the new hero, `Home.js` currently stacks marketplace-style sections: Flash Deals rail + countdown, Shop-by-Category tile grid, Featured grid, a heritage banner, Trending grid, six "Shop with Confidence" accent cards, and a Recently Viewed rail. Local subcomponents: `ScrollRow`, `CountdownTimer`, `SectionHeader`, `ProductSkeleton`.

## Objective

Recompose the Home page below the hero into fewer, larger, curated editorial sections — a magazine flow with generous whitespace — while every data-driven capability (deals + countdown, categories, featured, trending, recently viewed) remains present and API-driven.

## Scope — files/areas to touch

- `src/pages/Home/Home.js` + `Home.module.css` (everything below the Prompt 12 hero/trust region)
- `src/utils/constants.js` — ONLY if refreshing `TRUST_BADGES` copy to the brand voice (labels/sublabels; keep the export shape)
- Note: `CTASection`, `Newsletter`, `FeaturedProducts`, `FAQ`, `BottomDrawer`, `Breadcrumb` in `src/components/` are UNUSED (no importer) — leave them untouched; do not wire them in.

## Brand & design requirements

Recompose into an editorial sequence (order is yours; every data source must survive). A strong arrangement:

1. **Collections statement** — the Shop-by-Category grid becomes 2–3 large image-led "collection stories" (Mekhela Chador / Muga & Eri / Gifts) with serif titles + "Explore" underline links (data: `apiService.categories.getAll()`, links via `categoryParam`).
2. **"The Edit" — Featured** — `products.getFeatured(8)` as an asymmetric editorial grid or generous 3–4-col grid of the new ProductCard, with the Prompt 12 section-header convention (tracked eyebrow + serif title + quiet "View all" → `/products?sort=featured`).
3. **Offers, quietly** — the Flash Deals rail survives as a restrained "Season's offers" rail: `ScrollRow` of deal cards + the `CountdownTimer` reduced to a single tracked line (e.g. "Ends in 04:12:33") — data exactly as now (featured+trending pool filtered by real `getProductMinPrice(p).discount > 0`, capped 12, countdown from `resolveCountdownTarget(dealsConfig?.timer)`, section hidden when no real deals). "View all" → `/products?sort=sale`.
4. **Heritage interlude** — the heritage banner becomes a full-width editorial band (serif pull-line about Assamese silk craft, CTA → `/about`); may use a large image + text split.
5. **Trending** — `products.getTrending(8)` rail or grid, "View all" → `/products?sort=trending`.
6. **Promises** — the six confidence cards compress into one hairline row of 3–4 quiet store-attested promises (no rainbow accent cards; reuse/retire the `CONFIDENCE_CARDS` copy tastefully).
7. **Recently viewed** — keep the conditional rail from `localStorage["recentlyViewed"]`, restyled to match.

Section rhythm: `--sf-space-24/-32` vertical padding, hairline top rules, alternating full-bleed vs contained widths for cadence. Motion: gentle fade/rise on scroll-in (respecting `useReducedMotion` — already imported), stagger ≤0.05s.

## Functional guardrails

1. Preserve all functionality & the API contract: `apiService.categories.getAll` / `products.getFeatured(8)` / `products.getTrending(8)` calls; `useDealsConfig` countdown resolution (`resolveCountdownTarget`, `diffToParts`); recently-viewed localStorage read; `addToCart`/`toggleWishlist`/`isInWishlist` handlers passed to cards; skeleton loading states for each section (restyle `ProductSkeleton` on the `sf-skeleton` primitives).
2. Honest data: deals section renders ONLY when real discounts exist; countdown only from the admin-configured timer; never invent urgency. Ratings/discounts on cards come from Prompt 09's card, fed real data.
3. Tokens/primitives only; zero hex; section spacing via tokens.
4. Do NOT modify the admin panel.
5. Responsive + accessible: rails scroll with visible affordance + keyboard reachability; headings hierarchical (one h1 on the page — likely visually-hidden or the hero's); grids collapse 4→2→1; reduced motion = no scroll animations.
6. No fabricated trust signals: promises row is store-attested policy copy; no fake "10k+ customers" style claims anywhere on Home.
7. Test before done — see below.

## Implementation notes

- Keep the local subcomponents (`ScrollRow`, `CountdownTimer`, `SectionHeader`, `ProductSkeleton`) as the implementation vehicles — restyle/reshape rather than delete, unless folding one away simplifies (behavior preserved).
- The deals pool derivation and 12-cap stay; don't refetch differently.
- Home is the storefront's proof-of-concept for the whole redesign — invest in the composition; a viewer who knew the old Home must not recognize the layout.
- Verify links: `/products?sort=featured|trending|sale` are real supported sort aliases (`normalizeSort` in Products handles them — "sale" maps via `SORT_ALIASES`; verify in `src/pages/Products/Products.js` and use aliases that actually resolve, e.g. `sort=discount` if that's the canonical one).

## Acceptance criteria

- [ ] Home reads as a curated editorial magazine — fewer, larger sections, generous whitespace; structurally distinct from the old stack.
- [ ] All data sections present and API-driven: collections, featured, deals+countdown (hidden when none), heritage band, trending, promises, recently viewed.
- [ ] Every "View all"/CTA routes to a working filtered Products view.
- [ ] Skeletons show during load; empty sections collapse gracefully.
- [ ] Cards inherit Prompt 09; add-to-cart + wishlist work from every rail/grid.
- [ ] Light/dark parity; 375→1440 clean; reduced motion honored; no hex.

## Test & QA

- `npm run dev`: full-page scroll at 375/768/1024/1440, both themes.
- Admin → Special Offers: change the deals timer/window → Home countdown follows after tab refocus; disable all product discounts scenario (mentally or via data): deals section hides.
- View 2–3 products → return Home → Recently Viewed appears.
- Click through every section CTA; add to cart from a rail; toggle wishlist.
- Keyboard: reach rail scroll + all links; reduced-motion pass.
- Admin untouched; no console errors.
