<!-- Batch F — Admin Logo, Polish & QA -->
# Prompt 29 — Final QA & Acceptance (End-to-End Verification)

## Objective
Verify end-to-end that **every storefront feature still works, fully API-driven**, and that the
*Meghali's Silk* brand redesign is complete and coherent in both themes — then fix anything that fails.
This is a **verification prompt** (a master acceptance checklist plus targeted fixes), **not** a redesign:
do not rebuild or restyle working surfaces; only repair regressions you discover.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house with a
**dark-first**, gold-on-green premium aesthetic. The redesign is considered done when the brand language
and all features hold together.

- **Tokens:** `src/theme/storefront-tokens.css` (`--sf-*`, light in `:root`, dark under `body.dark`) is
  the single re-skin point; no hardcoded hex in storefront components.
- **Palette cues:** brand green `--sf-color-brand-green` (#0B3B2E), gold `--sf-color-gold` (#CBA35A),
  emerald CTA `--sf-color-emerald` (#12B886). Fonts: `--sf-font-display` (Cormorant Garamond) /
  `--sf-font-family` (Inter).
- **Logo-on-green rule:** the logo
  (`https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`) always sits on a
  `--brand-logo-bg` (#0B3B2E) panel — header, mobile menu, footer, **and admin** (sidebar + login).
- **Dark mode is the default** (fresh profile boots dark); the theme toggle persists in
  `localStorage.theme`.
- **Authenticity > persuasion:** every persuasive element (ratings, review counts, stock, social proof)
  must bind to REAL API data; no fabricated reviews/stock/urgency; honest empty states.
- **Design references** (parity check): all images in `UI Designs/` (Logo, DESKTOP SCREEN VIEW, HOME PAGE
  WITH/HIDE FOOTER, MENU, SEARCH OPTION, PRODUCT LISTING, PRODUCT DETAILED PAGE [+ SPECIFICATION],
  ADD TO CART, WISHLIST, PROFILE, OUR STORY, CONTACT US PAGE).

## Scope — Files to Create / Modify
- (VERIFY everything; MODIFY only to fix regressions) All storefront pages under `src/pages/` (non-admin)
  and all storefront components under `src/components/` (incl. `src/components/storefront/`), plus
  `src/theme/storefront-tokens.css` / `src/theme/colors.js` / `src/theme/tokens.js`, `src/context/*`,
  `src/utils/*`, `public/index.html`, `public/manifest.json`, `.env` / `.env.production`, and `db.json`
  (content/referential-integrity fixes only — no shape changes).
- (VERIFY) Admin logo only: `src/components/AdminLayout/AdminLayout.js` and
  `src/pages/Admin/AdminLogin.js` show the brand logo on green; the rest of the admin is untouched.
- **OUT of scope (no functional changes):** `src/services/api.js` / `src/services/baseURL.js` logic, the
  JSON shapes in `db.json`, and any admin file beyond confirming the logo. Do not add features.

## Detailed Requirements
Work top-to-bottom through the **MASTER ACCEPTANCE CHECKLIST**. For each line: exercise the flow; if it
passes, check it; if it fails, fix the minimal cause (token, wiring, prop, state) and re-test. Every flow
must be **API-driven through `apiService`** — no `fetch`/`axios` outside it.

### A. Browse → discover → buy (core commerce)
1. **Browse:** Home renders banners, category tiles, and product rails from the API
   (`products.getFeatured`/`getTrending`, `categories.getAll`, `banners.getAll`, `deals.getConfig`).
2. **Search:** the header search and `SearchModal` query `apiService.products.search(query)` and show
   results (and any AI Suggestions / Recent / Trending UI) without errors; selecting a result navigates
   to the PDP.
3. **PDP:** `/products/:slug` loads via `products.getBySlug` (legacy numeric id redirects to slug);
   gallery, price block (gold price + struck compare + savings), variant/fabric & color selectors,
   quantity stepper, tabs (Description / Specifications / Fabric & Craft / Reviews / FAQs), and cross-sell
   rails (`getRelated`, `getFrequentlyBoughtTogether`) all render.
4. **Add to cart:** from `ProductCard` and the PDP `AddToCartBar`, items add to the cart via
   `CartContext` (selected variant respected); the `CartDrawer` slide-over opens/reflects items
   (remember: there is **no `/cart` route**). Quantity update and remove work.
5. **Checkout:** `/checkout` lists cart items, shipping methods (`shipping.getMethods`), totals (subtotal,
   tax at the configured rate, shipping with free-above threshold), and accepts an address + payment
   method; placing the order calls `orders.create`.
6. **Order placed → confirmation:** redirect to `/order-confirmation/:orderNumber`
   (`orders.getByOrderNumber`) showing the order summary and confetti/affirmation as designed.
7. **Order history:** `/orders` lists the user's orders (`orders.getByUserId`), order detail opens, and
   cancel (`orders.cancel`) works where allowed.

### B. Accounts
8. **Register / login / logout:** `AuthModal` registers (`auth.register`), logs in (`auth.login`), and
   logout clears session; `AuthContext` state updates app-wide (header reflects logged-in user).
9. **Profile:** `/profile` shows/updates user info (`auth.updateUser`) and change password
   (`auth.changePassword`) where present.

### C. Wishlist
10. **Wishlist add/remove:** the heart toggles on cards and PDP; **guest** wishlist persists in
    localStorage and **logged-in** wishlist uses `wishlist.get/add/remove`; `/wishlist` lists items.
11. **Move to cart:** moving a wishlist item to the cart adds it (variant-aware) and updates both lists.

### D. Promotions
12. **Coupons:** applying a code at the cart/checkout calls `coupons.validate(code, orderAmount)` and
    reflects the discount; invalid/expired/under-min codes show a clear error (validate checks isActive,
    expiresAt, usageLimit vs usedCount, minOrderAmount).
13. **Deals page:** `/special-offers` reads `dealsConfig` (`deals.getConfig`) — hero, timer,
    `featuredCouponIds`, `dealOfTheDayIds`, `featuredProductIds` resolve to real coupons/products.

### E. Reviews (authenticity-gated)
14. **Submit:** review submission is **purchase-gated** (only eligible buyers can submit via
    `reviews.submit`), tied to a real `productId`/`userId`/`orderId`.
15. **Display:** only `status:"approved"` reviews show on the PDP (`products.getReviews`); ratings/counts
    shown match real data (no fabricated reviews).

### F. Theme & brand
16. **Theme toggle:** dark is the default on a fresh profile; toggling persists across reload with no
    flash; both modes are coherent on every surface.
17. **Logo-on-green everywhere:** header, mobile menu, footer, **and admin** (sidebar + login) show the
    brand logo on the #0B3B2E panel; favicon/title/`theme-color` are brand-correct.
18. **Brand content:** storefront copy, currency (₹ INR), Kolkata/handloom context, and `db.json`
    `settings.store`/`social`/`seo` reflect Meghali's Silk (no leftover demo "MY STORE"/laptops/earbuds).

### G. Admin (logo only)
19. **Admin intact:** admin still logs in and navigates fully; the ONLY admin change is the logo on green
    (no layout/nav/table/dialog/adminTheme changes).

### H. Data & contract integrity
20. **Referential integrity in `db.json`:** every `product.categoryId`, `relatedProductIds`,
    `frequentlyBoughtTogetherIds`, review `productId`/`userId`, order/wishlist product references, and all
    `dealsConfig` ids point to existing rows; INR money is integers; dates are ISO `…Z`. Fix dangling
    references (content only — never change shapes/keys/id conventions).
21. **Swap contract intact:** confirm there are **no** `fetch(`/`axios` usages outside
    `src/services/api.js`; the only thing that switches backends is `REACT_APP_API_URL` +
    `REACT_APP_USE_MOCK_API` in `.env`. `apiService` method names/signatures are unchanged.

### I. Build & runtime health
22. **Clean build:** `npm run build` completes with **no errors** (warnings minimized).
23. **No console errors:** navigating the full app produces no runtime console errors or React key/ARIA
    warnings.

## Data / API Notes
- All flows use the documented `apiService` surface (`auth`, `products`, `categories`, `banners`, `cart`,
  `orders`, `wallet`, `reviews`, `returns`, `coupons`, `wishlist`, `shipping`, `settings`, `deals`,
  `leads`). Do **not** add `fetch`/`axios` elsewhere or rename/alter `apiService` methods.
- `db.json` edits are limited to **content + referential-integrity** fixes within the existing shapes
  (`banners`, `categories`, `products`, `coupons`, `reviews`, `shipping_methods` copy,
  `settings.store/social/seo`, `dealsConfig` id refs). Do **not** alter shapes/keys/id conventions or
  restructure users/admins/orders/payments/refunds/returns/cart/wishlist/walletTransactions.
- Coupon `type` is `"fixed"` or `"percentage"`; reviews show only when `status:"approved"`; tax rate is
  per `settings.store.taxRate` (silk GST 5%, `taxIncluded:false`); free shipping threshold is ₹999.
- Run instructions: `npm install`; `npm run dev` (CRA + JSON Server on :3001) for manual testing;
  `npm run build` for the production build check. (`npm start` / `npm run server` run them individually.)

## Constraints (Do Not Break)
- This is **verification + minimal fixes** — do not redesign or restyle working surfaces.
- Keep everything **API-driven & functional**; preserve the JSON Server ↔ Laravel swap contract (no
  `fetch`/`axios` outside `apiService`; only `.env` vars switch backends).
- Preserve all `db.json` JSON shapes/keys/id conventions; only fix content/referential integrity.
- Re-skin only via `src/theme/storefront-tokens.css` / tokens; no hardcoded hex in storefront components.
- Do **not** modify the admin panel beyond confirming the logo-on-green (no other admin change allowed).
- Honor **authenticity > persuasion** (no fabricated reviews/stock/urgency; honest empty states).
- Maintain accessibility (focus-visible, ARIA, contrast, ≥44px targets) and responsive behavior at
  480/768/1024/1280.

## Acceptance Criteria / Definition of Done
- [ ] All of section A (browse → search → PDP → add to cart → checkout → order placed → confirmation →
      order history) works end-to-end via `apiService`.
- [ ] Register/login/logout and Profile (update + change password) work; `AuthContext` updates app-wide.
- [ ] Wishlist add/remove + move-to-cart work for **guest** (localStorage) and **logged-in**
      (`wishlist.*`) users.
- [ ] Coupon apply works at cart/checkout (`coupons.validate`) with correct accept/reject behavior; the
      deals page reads `dealsConfig` and resolves real coupons/products.
- [ ] Reviews are purchase-gated on submit and show only `status:"approved"`; ratings/counts are real.
- [ ] Theme toggle persists, dark is default, both modes coherent; logo-on-green appears everywhere incl.
      admin; brand content/currency/SEO are correct (no demo leftovers).
- [ ] Admin still fully functional with **only** the logo changed.
- [ ] `db.json` referential integrity holds; **no** `fetch`/`axios` outside `apiService`; `apiService`
      surface unchanged.
- [ ] `npm run build` is **clean**; navigating the app produces **no console errors**.

## Verification Steps
1. `npm install`, then `npm run dev`; open the app in a **fresh/incognito** window → confirm it boots in
   **dark** mode with brand colors.
2. **Commerce flow:** Home → search a product in `SearchModal` → open the PDP → select a variant → add to
   cart → open `CartDrawer` → go to `/checkout` → fill address + payment → place order → land on
   `/order-confirmation/:orderNumber` → open `/orders` and confirm the order appears; try cancel.
3. **Auth:** open `AuthModal`, register a new user, log out, log back in; update profile + change password.
4. **Wishlist:** as a guest, heart a few items (verify localStorage persistence across reload); log in and
   confirm `wishlist.*` is used; move an item to cart from `/wishlist`.
5. **Coupons & deals:** at cart/checkout apply a valid code, then an invalid/expired one (expect a clear
   error); visit `/special-offers` and confirm hero/timer/featured coupons & products come from
   `dealsConfig`.
6. **Reviews:** as a non-purchaser confirm the submit path is gated; as an eligible buyer submit a review;
   confirm only approved reviews render on the PDP and rating/count match the data.
7. **Theme & logo:** toggle theme and reload (persists, no flash); verify the logo-on-green in header,
   mobile menu, footer, and at `/admin` (login + sidebar). Confirm tab title/`theme-color`/favicon.
8. **Contract checks:** run a repo-wide search for `fetch(` and `axios` outside `src/services/api.js`
   (expect none); confirm `apiService` method names are unchanged; spot-check `db.json` references
   (categoryId, related/FBT ids, review productId/userId, dealsConfig ids) resolve to real rows.
9. **Admin integrity:** click through admin pages → fully functional; `git status` shows no admin changes
   beyond the logo files.
10. Run `npm run build` → confirm a **clean** build; re-walk the app and confirm **no console errors**.
