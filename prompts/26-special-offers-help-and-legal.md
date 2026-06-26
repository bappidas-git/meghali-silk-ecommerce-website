<!-- Batch E — Content & Policy Pages -->
# Prompt 26 — Special Offers, Help Center & Legal Pages

## Objective
Apply a consistent **Meghali's Silk** brand pass across the remaining content pages — **Special Offers /
Today's Deals** (`/special-offers`), the **Help Center** (`/help`), and the four **legal pages** (Privacy
`/privacy`, Terms `/terms`, Cookies `/cookies`, Refund `/refund`) — re-skinning them to the dark
gold-on-green system while keeping every piece of real data wiring intact (deals config, active coupons,
real-discount products, FAQ, support entry points) and making returns/shipping/refund language consistent
with the brand facts (**7-day returns**, **₹999 free shipping**).

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a Kolkata-rooted heritage handloom silk house
selling authentic women's silk apparel. The look is **dark-first, luxurious, gold-on-green** with elegant
serif headings and emerald CTAs. There is no dedicated mockup for these specific pages; match the brand
established across `UI Designs/HOME PAGE WITH FOOTER.png`, `UI Designs/PRODUCT LISTING.png`, and the gold
emblem from `UI Designs/OUR STORY.png` — dark charcoal canvas, gold serif headings, deep-green panels,
emerald/gold buttons, rounded surface cards with gold-tinted hairlines.

Use ONLY these tokens (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-surface-hover`,
  `--sf-color-text`, `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`,
  `--sf-color-border-strong`.
- Gold: `--sf-color-gold`, `--sf-color-gold-light`, `--sf-color-gold-deep`, `--sf-gradient-gold`.
- Brand green panels: `--sf-color-brand-green` (= `--brand-logo-bg`), `--sf-color-brand-green-deep`; the
  hero band for Special Offers may also use `--sf-gradient-heritage` (purple/magenta) for a luxury accent.
- Commerce: `--sf-color-price`, `--sf-color-compare`, `--sf-color-discount`, `--sf-color-discount-bg`,
  `--sf-color-star`, `--sf-color-badge-bg`.
- CTAs/category accents: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`;
  `--sf-cat-pink|purple|orange|blue|teal|red` for help-topic icon accents.
- Type: `--sf-font-display` (serif) for page titles, section headings, coupon headline figures, big deal
  numbers; `--sf-font-family` (Inter) for body/UI. Radii `--sf-radius-*`, spacing `--sf-space-*`, shadows
  `--sf-shadow-*`, motion `--sf-transition*`.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/SpecialOffers/SpecialOffers.module.css` — re-skin to the brand system (tokens only).
- (MODIFY) `src/pages/SpecialOffers/SpecialOffers.js` — visual/markup polish ONLY; **keep all existing
  data logic** (deals config gating, countdown, coupon/product selection, add-to-cart, wishlist, empty
  states). Do not change its data flow or `apiService` calls.
- (MODIFY) `src/pages/HelpCenter/HelpCenter.js` + `src/pages/HelpCenter/HelpCenter.module.css` — themed
  FAQ + support entry points; keep FAQ sourced from `FAQ_ITEMS` and the search/accordion behavior.
- (MODIFY) `src/pages/PrivacyPolicy/PrivacyPolicy.js` + `.module.css`
- (MODIFY) `src/pages/TermsOfService/TermsOfService.js` + `.module.css`
- (MODIFY) `src/pages/CookiePolicy/CookiePolicy.js` + `.module.css`
- (MODIFY) `src/pages/RefundPolicy/RefundPolicy.js` + `.module.css`
- (OPTIONAL, values only) `src/utils/constants.js` — you MAY refine `FAQ_ITEMS` copy and confirm
  `POLICY_LAST_UPDATED` for brand consistency; change values only, keep names/shapes. (Contact details
  are owned by the Contact prompt; do not contradict them here.)
- **OUT of scope:** `db.json` (do not edit), `apiService` (use existing methods; no signature changes, no
  calls outside `apiService`), other pages/components, the admin panel, and the shared brand tokens
  themselves. **Do not change any data-fetching/selection logic** — this is a re-skin + copy-consistency
  pass.

## Detailed Requirements

### A. Special Offers / Today's Deals (`/special-offers` — `SpecialOffers.js`)
This page is **fully data-driven and admin-managed**; preserve every bit of that. Re-skin only.
1. **Keep the data contract.** The page reads `dealsConfig` via the `DealsConfigContext` (backed by
   `apiService.deals.getConfig`) for the master `enabled` toggle, hero `tag/title/subtitle`, the
   countdown `timer`, and the ordered id selections (`featuredCouponIds`, `dealOfTheDayIds`,
   `featuredProductIds`). It also fetches `apiService.products.getAll()`, `apiService.categories.getAll()`,
   and `apiService.coupons.getActive()`. **Do not alter any of this**, including the countdown hook, the
   `pickByIds` selection, the "real discounts only" filtering (`getProductMaxDiscount(p) > 0`), and the
   add-to-cart/wishlist handlers. Restyle the existing class names; if you rename a class, update both JS
   and CSS together.
2. **Respect `dealsConfig.enabled`.** Keep the disabled/`!enabled` branch and its "No Deals Right Now"
   state, and the config-loading spinner — just re-skin them (deep-green/gold, gold emblem-style icon).
3. **Hero band.** Re-skin the `heroBanner` to a premium brand band (deep green or `--sf-gradient-heritage`),
   serif title from `config.hero.title`, gold `heroTag` pill, and the live countdown boxes styled as gold-
   bordered tiles on dark. Keep the `timerEnded` message branch.
4. **Coupons section.** Keep the real coupon cards (headline figure, description, min-order/expiry meta,
   `Copy Code` button with copied state). Style the coupon "stub" with a gold left rail + perforation
   look; the discount figure uses `--sf-font-display` gold. Keep the honest empty copy ("No active coupons
   right now…").
5. **Deal of the Day + Deals by Category grid.** Re-skin the product cards to the brand product-card
   language (rounded dark surface, gold price via `--sf-color-price`, struck compare via
   `--sf-color-compare`, emerald/gold "Add to Cart", discount badge top-left, wishlist heart top-right,
   star rating). Keep the `CategoryTabs` strip behavior (scroll buttons, edge fades, active-into-view) and
   the AnimatePresence grid. Keep the "No Deals Available" empty state — honest, no fabricated deals.
6. **Authenticity.** Show ONLY real discounts (already enforced) and real, redeemable coupons (already
   filtered to active/non-expired/non-exhausted). Do NOT add fake urgency, fake stock, or fabricated
   "people viewing" widgets. The admin-configured countdown is the only urgency element and must stay
   bound to `config.timer`.

### B. Help Center (`/help` — `HelpCenter.js`)
1. **Keep FAQ data-driven.** FAQs come from `FAQ_ITEMS` (`src/utils/constants.js`); keep the search filter
   and the accessible accordion (`aria-expanded`/`aria-controls`/`role="region"`). Re-skin the search box,
   topic cards, and accordion to the brand system.
2. **Browse Help Topics.** Keep the topic cards linking to real routes (`/orders`, `/refund`, `/support`,
   `/profile`, `/special-offers`, `/privacy`). Give each topic icon a distinct `--sf-cat-*` accent and use
   Iconify glyphs instead of raw HTML entities where practical (or keep the existing rendering — just
   theme it). Cards: surface fill, hairline border, hover lift.
3. **FAQ list.** Gold serif section heading; accordion items on `--sf-color-surface` with a gold toggle
   indicator; keep the "No FAQs match your search → Contact us" empty state.
4. **Support entry points.** Re-skin the "Still need help?" banner (deep-green/gold) keeping the real
   `SUPPORT_EMAIL`/`SUPPORT_PHONE` (`mailto:`/`tel:`) and the **Contact Support** (`/support`) button. Make
   the brand contact copy consistent with the Contact page (same constants source).
5. **Copy consistency.** Ensure FAQ answers about returns/shipping match the brand facts: **7-day returns**
   and **free shipping on orders ₹999+** (align the relevant `FAQ_ITEMS` entries; the threshold constant is
   `FREE_SHIPPING_THRESHOLD = 999`). Keep silk/apparel context (e.g. mention COD up to the configured max).

### C. Legal pages (Privacy / Terms / Cookies / Refund)
Re-skin all four to a consistent **long-form document** layout on the brand surfaces/typography, keeping
their existing section structure and the `POLICY_LAST_UPDATED` date from `constants.js`.
1. **Shared document chrome.** Gold serif `<h1>` title, a muted "Last updated: {POLICY_LAST_UPDATED}" line,
   a readable measure (max ~72ch) on `--sf-color-surface`/`bg`, numbered `<h2>` section headings, comfortable
   line-height (`--sf-leading-*`), and a closing contact line using `SUPPORT_EMAIL`/`/support`. Keep the
   existing breadcrumb. Keep section content arrays; only restyle and adjust copy for brand consistency.
2. **Brand & policy facts (make consistent across pages):**
   - **Returns/Refund:** **7-day** return window (matches `STOREFRONT_CONFIG.returnsWindowDays = 7`). Keep
     the Refund page's steps, eligible/non-eligible lists, and refund-timeline table; ensure wording says
     "within 7 days of delivery" everywhere. Tailor non-eligible examples to silk apparel (e.g. "blouses
     stitched/altered to measure", "items with removed tags or worn/washed", "customised stitching") and
     keep digital/gift-card exclusions only if relevant.
   - **Shipping:** **free shipping on orders ₹999+** (matches `FREE_SHIPPING_THRESHOLD` and the Standard
     method's `freeAbove: 999`); standard delivery 5–7 business days. Use these numbers in Terms (Shipping
     & Delivery) and any refund/shipping references.
   - **Pricing/tax:** prices in **INR (₹)**; GST applies (silk/apparel GST is 5% per the store settings) —
     keep tax wording generic but India-appropriate; do not assert a wrong rate.
   - **Governing law / jurisdiction:** update Terms to **Kolkata, West Bengal** (the brand's home), not
     Mumbai.
   - **Brand identity:** refer to the operator as **Meghali's Silk (Galleria Producer Company Limited)**
     where the existing copy names the store (it already interpolates `APP_NAME`; keep using `APP_NAME` and
     add the legal entity in intro/identity sections).
3. **Refund page specifics.** Keep the 4-step "How Returns Work", the two-column eligible/not-eligible
   cards, and the refund-timeline table — re-skinned (gold step numbers, emerald check / muted cross icons,
   table rows on alternating surfaces). Keep links to `/support` and `mailto:SUPPORT_EMAIL`.
4. **Cookies page.** Keep the cookie-types table (Essential/Functional/Analytics/Marketing) and managing-
   cookies copy; re-skin the table to a brand data-table (gold header row, hairline dividers).
5. **No new legal claims.** Do not invent guarantees the store can't honor; keep statements honest and
   consistent with the 7-day / ₹999 facts and the data in `db.json` (shipping methods, COD max).

### D. Cross-page consistency
- Mobile-first; document pages single-column with comfortable reading width; Special Offers grids reflow
  (1 → 2 → 3+ columns) and the Help topic grid reflows (1 → 2 → 3).
- Keep/keep-honest all empty states (no active deals, no coupons, no FAQ matches).
- Subtle Framer Motion section reveals; respect the existing `prefers-reduced-motion` block.

## Data / API Notes
- **Special Offers:** uses `apiService.deals.getConfig` (via `DealsConfigContext`),
  `apiService.products.getAll()`, `apiService.categories.getAll()`, `apiService.coupons.getActive()`, plus
  cart/wishlist contexts and `buildCartItem`/`getProductMinPrice`/`getProductMaxDiscount` helpers. **Do
  not change which methods are called or how results are selected/filtered.** `dealsConfig` shape (for
  reference, do not edit in this prompt): `{ enabled, hero{tag,title,subtitle}, timer{enabled,endAt,onExpiry},
  featuredCouponIds[], dealOfTheDayIds[], featuredProductIds[] }`. Coupon shape includes
  `type:"fixed"|"percentage"`, `value`, `minOrderAmount`, `maxDiscount`, `expiresAt`, `isActive`,
  `usageLimit`, `usedCount` — keep the existing validity filtering.
- **Help Center & legal:** read from `src/utils/constants.js` (`FAQ_ITEMS`, `SUPPORT_EMAIL`,
  `SUPPORT_PHONE`, `POLICY_LAST_UPDATED`) — no API calls. You may refine `FAQ_ITEMS` text and confirm
  `POLICY_LAST_UPDATED`, but change **values only** (keep names/shapes); do not duplicate or contradict the
  contact values set by the Contact prompt.
- **No `db.json` edits in this prompt.** The deal/coupon/shipping *data* is seeded elsewhere; here you only
  re-skin and make copy consistent with the known facts (7-day returns, ₹999 free shipping, INR, Kolkata).
- Preserve the JSON Server ↔ Laravel swap contract: all backend access stays through `apiService`; do not
  add `fetch`/`axios` anywhere.

## Constraints (Do Not Break)
- Keep everything API-driven & functional: deals gating + countdown + coupon copy + add-to-cart + wishlist
  on Special Offers; FAQ search/accordion + support links on Help Center; all real links on legal pages.
  Do not alter data-fetching or selection logic — re-skin only.
- Re-skin ONLY via tokens in `src/theme/storefront-tokens.css`; **no hardcoded hex** in any of these
  `*.module.css`/`*.js` files. If you rename a CSS-module class, update JS and CSS together.
- Do NOT edit `db.json` or the admin panel; do NOT change `apiService` signatures or add calls outside it.
- Keep all JSON shapes/contracts intact (dealsConfig/coupon/product shapes are referenced, not modified).
- Accessibility: keep the FAQ accordion ARIA wiring; semantic headings; ≥44px tap targets; visible
  `focus-visible` (`--sf-shadow-focus`); `tel:`/`mailto:`/external links labelled and (external) opened
  with `rel="noopener noreferrer"`.
- Responsive/mobile-first; lazy-load any images (`loading="lazy"`); honest empty states everywhere.
- Authenticity > persuasion: only real discounts/coupons; the only urgency is the admin-configured
  countdown; no fabricated stock/views/social proof; legal copy stays honest and consistent with the
  7-day / ₹999 facts.

## Acceptance Criteria / Definition of Done
- [ ] `/special-offers` is fully re-skinned to the brand (deep-green/gold hero, gold coupon stubs, brand
      product cards, gold countdown) while still: honoring `dealsConfig.enabled` (disabled state shows),
      listing real active coupons, showing only real-discount products, and adding to cart/wishlist.
- [ ] `/help` shows the themed FAQ (from `FAQ_ITEMS`) with working search + accessible accordion, themed
      topic cards linking to real routes, and a brand support banner with real `mailto:`/`tel:`/Contact
      Support links; returns/shipping answers say 7-day returns / ₹999 free shipping.
- [ ] `/privacy`, `/terms`, `/cookies`, `/refund` are consistently themed long-form documents showing
      "Last updated: {POLICY_LAST_UPDATED}", with returns (7-day), shipping (₹999 free, 5–7 days), INR
      pricing, and **Kolkata** jurisdiction in Terms; the Refund page keeps its steps/eligibility/timeline.
- [ ] All colors come from `--sf-*` tokens (no `#` hex in these CSS modules); dark + light modes both
      coherent; no console errors on any of the six routes.
- [ ] No data logic changed on Special Offers/Help Center; all links resolve; `npm run build` is clean.

## Verification Steps
1. `npm run dev` (CRA + JSON Server). Visit `/special-offers`: confirm the hero, real coupons (Copy Code
   works), Deal of the Day, category tabs, and product grid render; Add to Cart opens/updates the cart
   drawer; the wishlist heart toggles.
2. In `db.json` set `dealsConfig.enabled` to `false` (via JSON Server / file), reload `/special-offers` →
   the themed "No Deals Right Now" state shows; restore to `true`.
3. Visit `/help`: search a term → list filters; expand/collapse an FAQ (check `aria-expanded`); click a
   topic card → correct route; click Contact Support / Email Us / Call.
4. Visit `/privacy`, `/terms`, `/cookies`, `/refund`: confirm consistent theming, the "Last updated" date,
   7-day returns + ₹999 free-shipping wording, Kolkata jurisdiction in Terms, and the Refund page's
   steps/eligibility/timeline; click the contact links.
5. Toggle theme on each page and resize to ~375px → dark/light coherent, grids/columns reflow, targets
   ≥44px, focus rings visible.
6. DevTools console: no errors on any of the six routes. Run `npm run build` → clean.
