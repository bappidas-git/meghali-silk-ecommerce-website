# Meghali's Silk — Storefront Redesign Prompt Series (INDEX)

A 30-prompt sequential build plan that transforms the storefront into a warm-minimalist, editorial, luxury-DTC experience — light-first and keyed to the golden logo — with **zero functional regressions**. Execute the prompts **in order, one per session**; each file is self-contained. Run the app with `npm run dev` (CRA on :3000 + JSON Server on :3001). Test users (mock mode): customer `user@example.com / password123` · wallet-holding customer = `db.json` users[2] · admin `admin@store.com / admin123`.

Brand logos (used throughout): light-background logo `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png` · white logo for dark backgrounds `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png`.

## The series

| # | File | Delivers | Depends on |
|---|------|----------|-----------|
| 01 | `01_design-system-and-tokens.md` | Editorial token system (palette from the logo, type, space, motion), light-first default flip, MUI alignment | — |
| 02 | `02_seed-data-assamese-catalogue.md` | `db.json` content: Assamese silk catalogue (Mekhela Chador, Muga, Eri, Pat, gifts), categories, banners, coupons, reviews, dealsConfig — schema untouched | 01 |
| 03 | `03_global-styles-and-primitives.md` | `App.css`/`index.css` purge, scrollbars, Swal theming, `sf-*` primitives, ErrorBoundary re-sync | 01 |
| 04 | `04_app-shell-favicons-and-manifest.md` | `public/index.html` splash redesign, favicon-link repairs, `manifest.json` completion | 01 (03 rec.) |
| 05 | `05_header-and-desktop-navigation.md` | Editorial masthead: AnnouncementBar, TrustStrip, logo swap, API-driven category nav, overlay wiring intact | 01, 03 (02 rec.) |
| 06 | `06_mobile-navigation.md` | SidebarMenu (editorial full menu) + BottomNav | 01, 03, 05 |
| 07 | `07_search-experience.md` | SearchModal as an editorial overlay; honest suggestion labels | 01, 03, 05 (02 rec.) |
| 08 | `08_footer.md` | Deep editorial footer with the WHITE logo; newsletter flow intact | 01, 03 (02 rec.) |
| 09 | `09_product-card-and-commerce-primitives.md` | ProductCard, StarRating, PriceBlock, QuantityStepper, RelatedProducts — shared card language | 01, 03 (02 rec.) |
| 10 | `10_cart-drawer.md` | CartDrawer: editorial tray; free-ship meter, coupon, totals intact | 01, 03, 09 |
| 11 | `11_auth-modal.md` | AuthModal: login/register dialog + bottom sheet | 01, 03 |
| 12 | `12_home-hero.md` | HeroSection: cinematic full-bleed hero + collections strip; Home's opening | 01, 02, 03, 05 |
| 13 | `13_home-editorial-sections.md` | Home recomposition: featured, deals+countdown, heritage band, trending, promises, recently viewed | 09, 12 |
| 14 | `14_products-listing.md` | `/products` gallery: toolbar, filter drawer, grid, pagination; URL contract intact; fabric facet re-vocab | 09 (05 rec.) |
| 15 | `15_pdp-gallery-and-buybox.md` | PDP upper half: ProductGallery, buy box, VariantSelector, TrustBadges, DeliveryReturnsInfo, AddToCartBar, SocialProof | 09 |
| 16 | `16_pdp-story-reviews-and-recos.md` | PDP lower half: tabs/story, specs, ReviewsSection, FAQs (`FAQ_ITEMS` refresh), FBT, related placement | 15, 09 |
| 17 | `17_wishlist.md` | Wishlist page: collection grid, guest banner, move-to-cart, rec rail | 09, 11 |
| 18 | `18_checkout-shell-and-shipping.md` | Checkout shell + step indicator + Cart & Shipping steps + summary rail | 09, 10, 11 |
| 19 | `19_checkout-payment-and-review.md` | Payment step (methods, COD gating, store credit, coupon) + Review step; money math sacred | 18 |
| 20 | `20_order-confirmation.md` | Confirmation: thank-you moment, order record, honest status badges, guarded confetti | 19 |
| 21 | `21_order-history.md` | Order History + ReviewModal: cards, timeline, cancel/return/reorder/review flows | 11, 19 |
| 22 | `22_account-profile.md` | Profile hub: dashboard, addresses CRUD, wallet ledger, settings/password | 11, 21 |
| 23 | `23_special-offers.md` | Special Offers: admin-config-driven hero/countdown/coupons/deals; local card matched to 09 | 02, 09 |
| 24 | `24_support-and-help-center.md` | Support (lead form; fabricated stats removed) + Help Center (FAQ search, topics) | 01, 03 (16 rec.) |
| 25 | `25_about-us.md` | About: flagship editorial heritage long-read (Assamese silk story) | 01, 03 (12/13 rec.) |
| 26 | `26_policy-pages.md` | Privacy, Terms, Cookies, Refund — one editorial document treatment | 01, 03 |
| 27 | `27_motion-and-micro-interactions.md` | Cross-surface motion unification; reduced-motion sweep | 05–26 |
| 28 | `28_admin-logo-swap.md` | **The only admin change:** logo swap in `AdminLayout.js` + `AdminLogin.js` | 01 |
| 29 | `29_responsive-a11y-dark-parity.md` | Hardening sweep: responsive, accessibility, contrast, dark parity — fixes only | 01–28 |
| 30 | `30_final-qa-and-parity.md` | Full certification matrix: every flow, both themes, admin regression, build health | 01–29 |

Ordering rationale: foundation (01–04) → global chrome & overlays (05–11) → pages in journey order (12–26, each consuming the shared primitives from 09) → cross-cutting polish and certification (27–30). Prompts 15/16 and 18/19 split single large files (`ProductDetails.js`, `Checkout.js`) — their internal boundaries are stated in each prompt.

## Coverage cross-check (nothing missed, no duplication)

**Routes (`src/App.js`)** — `/` → 12+13 · `/products` → 14 · `/products/:slug` → 15+16 · `/checkout` → 18+19 · `/order-confirmation/:orderNumber` → 20 · `/orders` → 21 · `/profile` → 22 · `/wishlist` → 17 · `/special-offers` → 23 · `/help` + `/support` → 24 · `/about` → 25 · `/privacy` `/terms` `/cookies` `/refund` → 26 · `*` redirect → verified in 30. Admin routes → untouched except 28.

**Components** — Header/AnnouncementBar/TrustStrip → 05 · SidebarMenu/BottomNav → 06 · SearchModal → 07 · Footer → 08 · storefront/{ProductCard, StarRating, PriceBlock, QuantityStepper, RelatedProducts} → 09 · CartDrawer → 10 · AuthModal → 11 · HeroSection → 12 · storefront/{ProductGallery, VariantSelector, TrustBadges, DeliveryReturnsInfo, AddToCartBar, SocialProof} → 15 · storefront/{ReviewsSection, FrequentlyBoughtTogether} → 16 · ReviewModal → 21 · ErrorBoundary → 03 · ScrollToTop → behavioral, untouched · `variantUtils.js` → logic, untouched.

**Known-unused components (no importer — deliberately left untouched, do not wire in):** `CTASection`, `Newsletter`, `FAQ` (the component; `FAQ_ITEMS` data IS used), `FeaturedProducts`, `BottomDrawer`, `Breadcrumb`, `src/hooks/useSound.js`.

**Other surfaces** — `db.json` content → 02 (only prompt allowed to edit it) · `public/index.html` + `manifest.json` + favicon set → 04 (01 touches only the pre-mount theme script) · `App.css`/`index.css`/primitives → 03 · theme files + ThemeContext → 01 · `utils/constants.js` copy refreshes → 13 (TRUST_BADGES), 16 (FAQ_ITEMS), 24 (support copy), 26 (POLICY_LAST_UPDATED) — shapes never change · admin logo → 28 only.

## Shared Guardrails (restated, tailored, in EVERY prompt)

1. **Preserve all functionality & the data/API contract.** Everything stays API-driven through the dual-mode `src/services/api.js` (JSON Server ↔ Laravel `{ success, data, meta }`) + `db.json`. Never break: cart & drawer, checkout money math (subtotal − discount + shipping + tax = total; store credit → amount payable), auth (incl. remember-me), wishlist guest→login sync, store-credit wallet, coupons (validate/redeem/restore), purchase-gated reviews + moderation, deals config gating, slug routing with legacy-id redirect, category navigation. Visual/UX changes only — no changes to API call signatures, response handling, the Laravel-branch contract, or the `db.json` schema (Prompt 02 alone may replace seed **content**, using existing shapes).
2. **Reuse and extend the theme token system** (`src/theme/tokens.js`, `src/theme/colors.js`, `src/theme/storefront-tokens.css`, `ThemeContext`): colors/type/space/radii/shadows/motion as tokens, consumed everywhere; no scattered hardcoded hex or font names (the few sanctioned literals — ErrorBoundary, splash, payment/social brand SVGs, confetti — carry sync comments).
3. **Do NOT modify the admin panel** (`src/pages/Admin/*`, `src/components/AdminLayout/*`) except in Prompt 28 (logo swap only). Admin must remain fully functional throughout.
4. **Brand consistency + minimalism on every surface**: editorial warm-minimalist luxury; the light logo on light backgrounds, the white logo on dark — never mismatched; serif display + Inter body; hairlines over heavy borders; gold as restrained accent.
5. **Responsive (mobile/tablet/desktop) and accessible**: semantic HTML, keyboard navigation, visible focus, sufficient contrast, alt text, `prefers-reduced-motion` honored.
6. **No fabricated trust signals**: ratings/reviews/social proof/countdowns/stock states render only from seeded/real data with honest empty states; no fake urgency, stats, or dead controls.
7. **Test before done**: each prompt ends with its own Test & QA pass, always including "existing flows + admin still work".

## Definition of success

After Prompt 30 passes, the storefront is a cohesive, genuinely beautiful, minimalist, editorial Meghali's Silk experience — structurally distinct from the original layout in navigation, composition, and space utilisation — conversion-focused and trustworthy, with every feature, flow, and the admin panel working exactly as before, API-driven, requiring no further changes.
