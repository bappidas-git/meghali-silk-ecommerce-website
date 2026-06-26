<!-- Batch F — Admin Logo, Polish & QA -->
# Prompt 28 — Cross-Cutting Storefront Polish & Consistency Pass

## Objective
Run a storefront-wide **polish and consistency** pass that unifies theming, responsiveness, motion,
states, accessibility, and image performance across every storefront surface — **without adding any new
features or changing data/API logic**. The goal is a coherent, premium, accessible experience in both
dark and light modes at every breakpoint.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house with a **dark-first**, gold-on-green, premium
aesthetic. The polish must reinforce that language consistently everywhere.

- **Tokens (the single re-skin point):** `src/theme/storefront-tokens.css` defines all `--sf-*` custom
  properties — light values in `:root`, dark values under `body.dark` (ThemeContext toggles `body.dark`).
  Every storefront surface must read these tokens; **no hardcoded hex** in components.
- **Palette cues:** brand green `--sf-color-brand-green` (#0B3B2E), gold `--sf-color-gold` (#CBA35A) /
  `--sf-color-gold-light` (#E6C27A), emerald CTA `--sf-color-emerald` (#12B886, hover #0FA577,
  contrast #04130E), price `--sf-color-price`, struck compare `--sf-color-compare`.
- **Fonts:** headings `--sf-font-display` (Cormorant Garamond serif, 600/700); body/UI
  `--sf-font-family` (Inter).
- **Logo-on-green rule:** wherever the logo appears it sits on a `--brand-logo-bg` (#0B3B2E) panel —
  verify this holds across header, mobile menu, footer.
- **Motifs to keep consistent:** gradient announcement bar, teal/green trust strip, rounded dark
  product cards, gold "PREMIUM" ribbon, gold round emblem.
- **Design references** (consistency check, not a rebuild): `UI Designs/DESKTOP SCREEN VIEW.png`,
  `UI Designs/HOME PAGE WITH FOOTER.png`, `UI Designs/PRODUCT LISTING.png`,
  `UI Designs/PRODUCT DETAILED PAGE.png`, `UI Designs/ADD TO CART.png`, `UI Designs/WISHLIST.png`.

## Scope — Files to Create / Modify
This is an **audit + targeted fixes** pass; touch only what the checklist flags as inconsistent.
- (MODIFY, as needed) Storefront chrome under `src/components/` (storefront only): `Header`, `Footer`,
  `BottomNav`, `HeroSection`, `CartDrawer`, `SidebarMenu`, `AuthModal`, `SearchModal`, `Newsletter`,
  `FAQ`, `CTASection`, `FeaturedProducts`, `Breadcrumb`, `ReviewModal`, `BottomDrawer`, `ScrollToTop`,
  `ErrorBoundary`, and the `src/components/storefront/` library (`ProductCard`, `ProductGallery`,
  `PriceBlock`, `StarRating`, `VariantSelector`, `QuantityStepper`, `AddToCartBar`, `TrustBadges`,
  `DeliveryReturnsInfo`, `SocialProof`, `RelatedProducts`, `FrequentlyBoughtTogether`, `ReviewsSection`)
  — each with its `X.js` + `X.module.css`.
- (MODIFY, as needed) Non-admin pages under `src/pages/`: `Home`, `Products`, `ProductDetails`,
  `Checkout`, `OrderConfirmation`, `OrderHistory`, `Profile`, `Wishlist`, `SpecialOffers`, `HelpCenter`,
  `Support`, `AboutUs`, and the legal pages (`Privacy`, `Terms`, `Cookies`, `Refund`).
- (MODIFY, as needed) `src/theme/storefront-tokens.css` — ONLY to add a missing shared token if a surface
  needs one that doesn't exist (e.g. a skeleton shimmer color); never to hardcode in components.
- **OUT of scope:**
  - The **admin** panel (`src/pages/Admin/*`, `src/components/AdminLayout/*`, `src/theme/adminTheme.js`).
  - `db.json` (no data edits) and `src/services/api.js` / `baseURL.js` logic (no API/contract changes).
  - New features, new routes, new components, or copy rewrites that change meaning.

## Detailed Requirements
Work through this **concrete checklist**, one surface at a time. For each item, audit then fix in place.

### 1. Dark / light parity audit
1. Open every storefront surface in **both** dark and light mode and confirm it is coherent in each.
2. Grep storefront CSS Modules and JSX for **hardcoded hex / rgb / named colors**
   (`#`, `rgb(`, `rgba(` with literal channels, color keywords) and replace each with the correct
   `var(--sf-*)` token. (Admin files are exempt.)
3. Ensure text/background/border colors all resolve from tokens so toggling theme never leaves a stranded
   light-on-light or dark-on-dark element. Pay special attention to: badges, chips, dividers, overlays,
   skeletons, disabled states, placeholder text, focus rings, and hover backgrounds.
4. Verify the **logo panel** is `--brand-logo-bg` (#0B3B2E) in header, mobile menu, and footer in both
   modes (the logo must never look pasted on the wrong surface).

### 2. Responsive QA (mobile-first)
Use `BREAKPOINTS` (`src/utils/constants.js`) — **480 / 768 / 1024 / 1280**. At each width:
1. No horizontal scroll, no clipped content, no overlapping elements; `--sf-container-max` (1280px)
   respected and content centered beyond it.
2. Header collapses correctly (hamburger + `SidebarMenu` on mobile); `BottomNav` shows on mobile and
   never overlaps page content or the `CartDrawer`.
3. Product grids reflow sensibly (e.g. 2-up mobile → 3/4-up desktop) with consistent gaps using
   `--sf-space-*`.
4. PDP gallery, variant selectors, quantity stepper, and the `AddToCartBar` are usable on mobile (sticky
   add-to-cart bar does not cover the footer or `BottomNav`).
5. Modals/drawers (`SearchModal`, `AuthModal`, `CartDrawer`, `BottomDrawer`) are full-height/scrollable
   on small screens and do not trap or hide their close affordance.

### 3. Consistent Framer-Motion micro-interactions
1. Standardize entrance/transition variants (reuse `ANIMATION_VARIANTS` from `src/utils/constants.js`
   where present) for page/section reveals so timing/easing feel uniform — avoid one-off durations.
2. Consistent **hover lifts** on interactive cards/buttons (subtle translate/scale + shadow via
   `--sf-shadow-*`).
3. **Add-to-cart confirmation:** a consistent "Added ✓" affirmation (button state and/or toast) wherever
   add-to-cart exists (`ProductCard`, PDP `AddToCartBar`, `CartDrawer` re-add). Do not fabricate any
   counts — only reflect the real cart state from `CartContext`.
4. **Honor `prefers-reduced-motion`:** the existing `@media (prefers-reduced-motion)` block in
   `storefront-tokens.css` must neutralize transitions; ensure Framer-Motion animations are gated/reduced
   when reduced motion is requested (e.g. respect the token-driven transitions and avoid large movement).

### 4. Unified empty / loading / error states + skeletons
1. **Loading:** every data-fetching surface (Home rails, Products listing, PDP, OrderHistory, Wishlist,
   SpecialOffers, search results) shows a **skeleton** that matches the final layout (cards, gallery,
   list rows) using token colors — not a bare spinner or blank flash.
2. **Empty:** honest, branded empty states (no results, empty wishlist, empty cart, no orders) with a
   clear next action (e.g. "Browse Sarees"). **No fabricated content** to fill space.
3. **Error:** graceful error UI with a retry affordance where a fetch can fail; the global
   `ErrorBoundary` styling matches the brand.
4. Skeletons, empty, and error states must look consistent across surfaces (same spacing, radius,
   typography from tokens).

### 5. Accessibility
1. **Focus-visible** rings on all interactive elements using `--sf-shadow-focus` (keyboard navigation
   must be clearly visible); never remove outlines without a visible replacement.
2. **ARIA & semantics:** correct roles/labels for modals/drawers (`role="dialog"`, `aria-modal`,
   labelled by a heading), nav landmarks, buttons vs links, icon-only buttons have `aria-label`, images
   have meaningful `alt` (decorative images `alt=""`).
3. **Color contrast:** body text ≥ 4.5:1, large text ≥ 3:1 in both modes (use the lighter gold
   `--sf-color-gold-light` for small text on dark, deeper gold for text on white).
4. **Tap targets ≥ 44px** using `--sf-tap-target` for buttons, nav items, steppers, close buttons,
   wishlist hearts.
5. Keyboard: modals/drawers trap focus while open, close on `Esc`, and return focus to the trigger;
   tab order is logical.

### 6. Image performance (no layout shift)
1. Add `loading="lazy"` and `decoding="async"` to non-critical `<img>` (product thumbs, gallery
   non-first images, banners below the fold). Keep the LCP/hero image eager.
2. Provide intrinsic sizing — `width`/`height` attributes or CSS `aspect-ratio` — so images reserve space
   and avoid Cumulative Layout Shift (saree imagery is portrait ~3:4; reserve that ratio).
3. Ensure `ProductGallery` and `ProductCard` images have stable aspect boxes so swapping/loading does not
   jump the layout.

### 7. Final sweep
1. Remove dead inline styles that duplicate token-driven CSS; consolidate repeated values into tokens
   where it improves consistency (but do not over-refactor).
2. Verify no `console.log`/debug noise and no React key warnings on list renders.

## Data / API Notes
- **No `apiService` or `db.json` changes.** All persuasive/social-proof elements must remain bound to
  real API data (ratings, review counts, stock) per the **"authenticity > persuasion"** rule — do NOT
  add fake reviews, stock, urgency, or social proof to fill states.
- All data continues to flow through `apiService` (`products`, `categories`, `cart`, `orders`,
  `wishlist`, `reviews`, `coupons`, `deals`, etc.); this prompt only polishes presentation/behavior.
- Cart confirmations reflect `CartContext`; wishlist reflects `WishlistContext` (guest localStorage +
  logged-in) — do not change their logic, only their feedback/visuals.

## Constraints (Do Not Break)
- Keep everything **API-driven & functional** (cart/checkout/auth/wishlist/orders/reviews/coupons/search)
  — this is presentation polish only; no behavior or data-shape changes.
- Re-skin only via `src/theme/storefront-tokens.css` / tokens; **no hardcoded hex** in storefront
  components (replace any you find).
- Do **not** modify the admin panel or `src/theme/adminTheme.js`.
- Do **not** edit `db.json` or `src/services/api.js` / `baseURL.js` logic; preserve the JSON Server ↔
  Laravel swap contract (no `fetch`/`axios` outside `apiService`).
- Honor **authenticity > persuasion** (no fabricated reviews/stock/urgency/social proof; honest empty
  states).
- Maintain accessibility (focus-visible, ARIA, contrast, ≥44px targets) and mobile-first responsiveness;
  honor `prefers-reduced-motion`.

## Acceptance Criteria / Definition of Done
- [ ] Every storefront surface is coherent in **both** dark and light mode; toggling theme leaves no
      stranded/illegible element; no hardcoded hex remains in storefront components.
- [ ] At **480 / 768 / 1024 / 1280** widths there is no horizontal scroll, clipping, or overlap; grids,
      header, `BottomNav`, drawers, and the PDP add-to-cart bar all behave correctly.
- [ ] Micro-interactions (page/section reveals, hover lifts, "Added ✓" on add-to-cart) are consistent and
      are reduced/neutralized under `prefers-reduced-motion`.
- [ ] Loading uses layout-matching **skeletons**; empty and error states are branded, honest, and
      consistent, each with a clear next action / retry.
- [ ] Keyboard focus is always visible (`--sf-shadow-focus`); modals/drawers have correct ARIA, trap
      focus, close on `Esc`, and restore focus; icon-only controls have `aria-label`; tap targets ≥ 44px.
- [ ] Non-critical images are lazy/`decoding="async"` with reserved aspect ratio; no visible layout shift
      while images load.
- [ ] No console errors/warnings; `npm run build` completes cleanly.

## Verification Steps
1. `npm install` (if needed), then `npm run dev`.
2. **Theme parity:** visit Home, Products, a PDP, Wishlist, Checkout, Profile, SpecialOffers, AboutUs,
   Support, and the legal pages; toggle theme on each and confirm coherence in both modes.
3. **Responsive:** in DevTools device toolbar, test 480 / 768 / 1024 / 1280; confirm no horizontal scroll
   or overlap and that header/`BottomNav`/drawers/grids reflow correctly.
4. **Motion:** add a product to cart from a `ProductCard` and from the PDP → confirm a consistent
   "Added ✓"; enable OS "Reduce motion" and reload → confirm animations are minimized.
5. **States:** throttle/disable the network (or search a nonsense query) to see skeletons, then empty,
   then error+retry; confirm they are branded and consistent.
6. **A11y:** tab through Home and a PDP with the keyboard → focus rings always visible; open `SearchModal`
   and `CartDrawer` → focus trapped, `Esc` closes, focus returns; run an axe/Lighthouse a11y check and
   confirm no new critical violations and contrast passes.
7. **Images:** inspect product images → `loading="lazy"` + `decoding="async"` and reserved size; scroll
   quickly and confirm no layout jump.
8. Confirm `git status` shows **no** changes under `src/pages/Admin/`, `src/components/AdminLayout/`,
   `src/theme/adminTheme.js`, `db.json`, or `src/services/`.
9. Run `npm run build` and confirm a clean build with no console errors.
