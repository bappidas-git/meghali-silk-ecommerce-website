<!-- Batch D — Storefront Pages -->
# Prompt 13 — Home Content Sections (the stack below the hero)

## Objective
Re-skin and restructure the **homepage section stack below the hero** in
`src/pages/Home/Home.js` into the **Meghali's Silk** layout: Flash Deals (real discounts only), Shop by
Category, Featured, a Heritage/Luxury banner, Trending Now, a "Shop with Confidence" feature-cards grid,
Recently Viewed (localStorage), and authentic social-proof toasts (only if backed by real data). Every
product rail uses the unified storefront `ProductCard`. All content is API-driven with honest
empty/loading states and skeletons.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. Dark-first storefront (charcoal canvas, deep bottle-green panels,
gold/champagne accents, emerald CTAs, elegant serif headings).

Match these designs (the full vertical page):
- **`UI Designs/HOME PAGE HIDE FOOTER.png`** — section order: Flash Deals rail (with badges), Shop by
  Category circles, Featured grid, the purple/magenta **Heritage Meets Luxury** banner, Trending rail,
  the "Shop with Confidence" 6-card colored grid, and (lower) social-proof toasts.
- **`UI Designs/HOME PAGE WITH FOOTER.png`** — the same stack down to the footer.

Use ONLY tokens from `src/theme/storefront-tokens.css` (no hardcoded hex):
- Section surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`,
  `--sf-color-text`, `--sf-color-text-secondary`, `--sf-color-border`.
- Gold: `--sf-color-gold`, `--sf-color-gold-light`, `--sf-gradient-gold`. Section headings use
  `--sf-font-display`.
- Emerald CTA: `--sf-color-emerald` / `--sf-color-emerald-hover` / `--sf-color-emerald-contrast`.
- **Heritage banner**: `--sf-gradient-heritage` (purple→magenta).
- Feature-card accents: the category-dot tokens `--sf-cat-pink`, `--sf-cat-purple`, `--sf-cat-orange`,
  `--sf-cat-blue`, `--sf-cat-teal`, `--sf-cat-red` (one accent per "Shop with Confidence" card).
- Price/commerce tokens are consumed via `ProductCard`/`PriceBlock` (don't re-implement).
- Radius/space/shadow/motion: `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`. Tap
  target `--sf-tap-target` (≥44px). Container width `--sf-container-max` (1280px).

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/Home/Home.js` — the section stack BELOW `<HeroSection />`: Flash Deals, Shop by
  Category, Featured, Heritage banner, Trending, "Shop with Confidence", Recently Viewed, optional
  social-proof toasts. Reuse the unified storefront `ProductCard` for every product rail.
- (MODIFY) `src/pages/Home/Home.module.css` — brand re-skin of all those sections + skeletons.
- **OUT of scope:** the hero + trust strip + the top category quick-links (handled by
  `prompts/12-home-hero-and-top.md`); the storefront `ProductCard` itself (its own prompt — here you only
  USE it); the Header/Footer; `db.json` data; admin.

## Detailed Requirements

### A. Use the shared ProductCard for rails (remove the local card)
1. Replace the page-local `ProductCard` defined inside `Home.js` (and its local `StarRating`) with the
   shared component: `import ProductCard from "../../components/storefront/ProductCard";`. Render it as:
   ```jsx
   <ProductCard
     product={product}
     onAddToCart={handleAddToCart}          // (cartItem) => addToCart
     onToggleWishlist={handleToggleWishlist}
     isWishlisted={isInWishlist(product.id)}
   />
   ```
   IMPORTANT: the shared card's `onAddToCart` is called with a **cart item** (it calls
   `onAddToCart(buildCartItem(product))` internally). So `handleAddToCart` must accept a cart item:
   `const handleAddToCart = useCallback((cartItem) => addToCart(cartItem, 1), [addToCart])` — NOT
   `buildCartItem` again. Keep `handleToggleWishlist = (product) => toggleWishlist(product)`. Keep the
   existing `useCart()` and `useWishlist()` hooks.
2. Keep the horizontal `ScrollRow` wrapper for rails and the responsive grid for grid sections; just feed
   them the shared card.

### B. Data fetching (keep API-driven, add honest states)
3. Keep the `Promise.all` fetch of `apiService.categories.getAll()`, `apiService.products.getFeatured(8)`,
   `apiService.products.getTrending(8)`, each `.catch(() => [])`, with the `loading` flag and skeletons.
4. Keep loading `recentlyViewed` from `localStorage` (`RECENTLY_VIEWED_KEY = "recentlyViewed"`, the same
   key `ProductDetails.js` writes).

### C. Section stack (in this order)
5. **Flash Deals** — render ONLY products with a **real** `comparePrice` discount. Keep the existing
   filter that keeps products where `getProductMinPrice(p).discount > 0` (combine featured+trending or
   fetch via `apiService.products.getAll()` and filter). If none qualify, **omit the whole section** (no
   empty rail). Header reads "Flash Deals" with a "View All" link to `/products?sort=sale`.
   - **Countdown (optional, honest):** the existing `CountdownTimer` counts to end-of-day. Gate it on the
     real deals timer: read `useDealsConfig()` from `src/context/DealsConfigContext` and only show a
     countdown when `config.timer.enabled` is true; use `resolveCountdownTarget(config.timer)` from
     `src/utils/dealsConfig` to get the target (or `{active:false}` → render no timer). Do NOT show a
     fabricated countdown when the timer is disabled.
6. **Shop by Category** — a grid/row of categories from `categories` (already fetched). Link each to
   `/products?category=${categoryParam(cat)}` (import `categoryParam` from `src/utils/categories`). Show
   the category `image` (lazy, `onError={onImageError}`) with a gold-on-dark label overlay. Skeletons
   while loading. (If the top category circles already live in the hero prompt, this is the larger
   "browse categories" tile grid from the design — keep them visually distinct; do not duplicate the same
   row twice.)
7. **Featured Products** — grid of `featuredProducts` via the shared `ProductCard`; skeletons while
   loading; "View All" → `/products?sort=featured`. If empty after load, omit the section.
8. **Heritage / Luxury banner** — a full-width band using `--sf-gradient-heritage` with a serif headline
   (e.g. "Heritage Meets Luxury"), a short supporting line, and a single CTA button (gold or
   gold-outline) linking to `/products` or `/about`. Replace the existing "Up to 50% Off on Top Brands /
   electronics" promo copy entirely — no fabricated percentages. Decorative only; no fake urgency.
9. **Trending Now** — grid/rail of `trendingProducts` via the shared `ProductCard`; "View All" →
   `/products?sort=trending`. Omit if empty after load.
10. **Shop with Confidence** — a grid of **6 token-driven colored feature cards**, each with an icon,
    title, and one-line copy: **7-Day Returns**, **100% Money Back**, **Free Shipping**, **Authentic
    Silk**, **Secure Payment**, **Expert Support**. Assign each card one category-dot accent
    (`--sf-cat-*`) for its icon chip / top border. These are owner-attested policy statements (you may
    source titles from `WHY_CHOOSE_US` / `TRUST_BADGES` in `src/utils/constants.js` if convenient) — NOT
    live stats. This replaces the old generic "Why Choose Us" section; keep it driven by a small local
    array or the constants, with icons via `@iconify/react` (`Icon`).
11. **Recently Viewed** — render the `recentlyViewed` rail via the shared `ProductCard` ONLY when
    `recentlyViewed.length > 0`; render **nothing** when empty (keep the existing conditional). Header
    "Recently Viewed", "Continue where you left off".
12. **Authentic social-proof toasts (conditional)** — the design shows small "Divya from Kolkata
    ordered…" toasts. Implement these ONLY if backed by real data you can fetch via `apiService` (e.g. a
    real recent-orders/leads feed). If there is **no** real source available, **omit them entirely** —
    do NOT fabricate names/cities/timestamps. (Default: omit, since `apiService` exposes no public
    recent-purchase feed. If you add them later, gate on real data and make them dismissible + reduced-
    motion safe.)

### D. Reuse shared components & polish
13. If a `Newsletter` (`src/components/Newsletter/Newsletter.js`) and/or `CTASection`
    (`src/components/CTASection/CTASection.js`) component exists and the design calls for a newsletter /
    closing CTA near the bottom, render them (they already wire `apiService.leads.createNewsletter`). Do
    not duplicate a newsletter if the Footer already includes one — pick one placement.
14. Keep section headers consistent (reuse the existing `SectionHeader` helper): serif title
    (`--sf-font-display`), optional subtitle, and a gold "View All →" link where relevant.
15. Keep Framer Motion `whileInView` reveals but make them reduced-motion safe (gate via the token
    `@media (prefers-reduced-motion)` behavior; subtle fades only). Maintain skeleton loaders for each
    rail/grid while `loading`.

## Data / API Notes
- `apiService.products.getFeatured(8)`, `apiService.products.getTrending(8)`,
  `apiService.products.getAll()` (for the discount filter if needed), `apiService.categories.getAll()`.
- `useDealsConfig()` (DealsConfigContext) → `{ config: { enabled, hero, timer, featuredProductIds, ... }
  }`; `resolveCountdownTarget(config.timer)` from `src/utils/dealsConfig` returns
  `{ active, target } | { active:false, ended }`.
- `recentlyViewed` from `localStorage["recentlyViewed"]` (written by `ProductDetails.js`).
- `getProductMinPrice(product).discount` decides Flash-Deals eligibility (real `comparePrice > price`).
- `Newsletter` calls `apiService.leads.createNewsletter`. Do NOT add `fetch`/`axios` outside
  `apiService`. No `db.json` shape changes (product/category/deals content is seeded by Batch B/C).

## Constraints (Do Not Break)
- Keep everything API-driven & functional: rails/grids load from `apiService`; Add-to-Cart and wishlist
  work via the shared card's callbacks (CartContext / WishlistContext); category links navigate with the
  correct query param.
- Re-skin ONLY via tokens — no hardcoded hex in `Home.js`/`Home.module.css` for these sections (replace
  the old electronics gradients/copy).
- Authenticity > persuasion: Flash Deals shows ONLY real-discount products; the countdown appears only
  when the real deals timer is enabled; the Heritage banner carries no fabricated discount; social-proof
  toasts appear ONLY with real data (default: omitted). Recently Viewed renders nothing when empty.
- Use the shared `src/components/storefront/ProductCard` for all product rails (do not keep a local card).
- Do not modify the admin panel, the Header/Footer, `ProductCard` internals, or `db.json`.
- Preserve the JSON Server ↔ Laravel swap contract.
- Accessibility (section landmarks/headings, ARIA on scroll buttons, `:focus-visible`, ≥44px),
  mobile-first, lazy images, honest empty/loading states.

## Acceptance Criteria / Definition of Done
- [ ] The homepage stack matches `HOME PAGE HIDE FOOTER.png` / `HOME PAGE WITH FOOTER.png`: Flash Deals,
      Shop by Category, Featured, Heritage/Luxury banner, Trending, "Shop with Confidence" (6 colored
      cards), Recently Viewed — in that order, all brand-styled.
- [ ] Every product rail/grid uses the shared storefront `ProductCard`; the page-local card/StarRating
      are removed; Add-to-Cart receives a cart item (no double `buildCartItem`).
- [ ] Flash Deals only shows products with a real `comparePrice` discount and is omitted when none
      qualify; any countdown is gated on the real deals timer (no fake countdown).
- [ ] The Heritage banner uses `--sf-gradient-heritage` with serif copy and a single CTA; no electronics
      copy or fabricated "% off" remains.
- [ ] Recently Viewed renders only when localStorage has items; social-proof toasts are absent unless
      bound to real data.
- [ ] Skeletons show while loading; empty product responses omit their section cleanly (no broken rails).
- [ ] Dark and light modes coherent; no raw hex in the section CSS; no console errors; `npm run build`
      clean.

## Verification Steps
1. `npm run dev` and open `/`. Scroll the full page and confirm the section order + brand styling.
2. Confirm Flash Deals shows only discounted products; with the deals timer enabled a countdown shows,
   and with it disabled (or no real timer) no countdown renders.
3. Click a "Shop by Category" tile → `/products?category=<slug>` filtered. Click a "View All" link on
   Featured/Trending → the listing with the right `sort` param.
4. Add a product to cart from a rail → cart count/drawer updates (and the card shows "Added ✓"); toggle
   a heart → it appears on `/wishlist`.
5. Visit a PDP, return to `/` → Recently Viewed now shows that product; in a fresh profile (cleared
   localStorage) the Recently Viewed section is absent.
6. Throttle/stop the network so product fetches return empty → the empty rails are omitted (no broken
   sections), skeletons appear during loading.
7. Toggle theme → all sections coherent in light mode; resize to 375px → grids reflow, rails scroll,
   tap targets ≥44px.
8. Confirm no social-proof toast appears with fabricated names/cities.
9. Run `npm run build` → clean.
