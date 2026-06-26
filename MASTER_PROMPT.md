# MASTER PROMPT — Generate the Build Prompts for the **Meghali's Silk** Storefront

> **How to use this file:** Paste this entire document into a fresh Claude Code session
> opened at the root of this repository. It instructs Claude Code to **generate 25–30
> individual, sequenced build prompts** (one Markdown file each) inside a new `prompts/`
> folder. You will then feed those generated prompts to Claude Code **one at a time** to
> actually build the website. **This master prompt does not build the site — it writes the
> prompts that build the site.**

---

## 0. Your role and your one deliverable

You are a **senior front-end architect + expert prompt engineer**. Your single job in this
session is to **author a complete, dependency-ordered set of 25–30 build prompts** that, when
executed one-by-one by Claude Code on **this exact codebase**, transform the supplied generic
e-commerce boilerplate into a **production-grade, brand-consistent storefront for "Meghali's
Silk"** — a premium online store selling **silk apparel for women** (sarees, suits, dupattas,
lehengas, blouses, stoles, and related ethnic wear).

**Do NOT build, refactor, or restyle any application code in this session.** The only files you
create in this session are the prompt Markdown files (and one index file) inside `prompts/`.
Every actual code change must be **described inside a prompt**, to be executed later.

Before writing a single prompt you must:

1. **Open and study every image** in the root **`UI Designs/`** folder (listed in §3). These are
   the visual source of truth for the storefront. Sample exact colors from them where useful.
2. **Read the codebase orientation** in §5 and confirm it against the actual files. The
   architecture facts there are load-bearing — your prompts must respect them precisely.
3. Only then write the prompts described in §7–§8, following the exact output format in §6.

---

## 1. Project summary (what we are building)

- **Brand:** *Meghali's Silk* — "Galleria Producer Company Limited". A heritage, handloom-rooted
  silk house (Bengal/Kolkata craftsmanship; National Handloom Award winner) selling **authentic
  silk women's apparel** online.
- **Goal:** Redesign the **entire storefront UI/UX** to be **unique, modern, minimalistic,
  premium, and 100% brand-consistent** with the `UI Designs/` mockups and the logo — while
  **keeping every existing feature fully functional and API-driven** exactly as it works today
  (cart, checkout, login/registration, wishlist, orders, reviews, coupons, search, deals).
- **Admin panel:** **Do not redesign it.** The *only* permitted admin change is **swapping the
  logo** (see §4 and the relevant prompt). Everything else in `src/pages/Admin/*`,
  `src/components/AdminLayout`, and `src/theme/adminTheme.js` stays untouched.
- **Data:** The boilerplate ships generic demo products (laptops, etc.). Your prompts must
  **replace all storefront content data in `db.json`** with **realistic women's silk apparel**
  — correct categories, ~25–40 products with full fields, variants, images, ratings, reviews,
  coupons, banners, shipping, and store settings — **without changing any JSON shapes/contracts.**

> ⚠️ The original request mentioned "THIS Interiors e-commerce website" — that is a leftover from
> a template. **Ignore it. This project is Meghali's Silk (women's silk apparel).**

---

## 2. Brand identity & visual system (derive the precise values from the designs)

Treat the logo and the `UI Designs/` PNGs as the source of truth; the values below are a
**starting palette** to refine by sampling the real images.

### Logo (mandatory rule)
- Logo URL: `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`
- The logo PNG **ships with its own dark-green background**. **Wherever the logo is placed
  (header, mobile menu, admin sidebar, admin login, footer, favicon area), it must sit on a
  panel/chip filled with that SAME dark-green background color** so the logo never looks like a
  pasted rectangle floating on a different surface. Sample the exact green from the logo and
  expose it as a token (e.g. `--brand-logo-bg`).

### Color language (dark, luxurious, gold-on-green)
- **Mood:** dark, elegant, premium, minimal. Near-black charcoal canvas with deep emerald/bottle
  green brand panels and **gold/champagne** accents.
- **Suggested tokens (verify against designs):**
  - Brand green (logo bg / deep panels): `~#0B3B2E` → `#0A2E24`
  - Page background (charcoal, faint warm tint): `~#0C0E0D` / `#101212`
  - Card / surface: `~#15171A` with subtle `rgba(255,255,255,0.06)` borders
  - **Gold / champagne** (headings, prices, "PREMIUM" badge, dividers): `~#CBA35A` / `#D9B871` / `#E6C27A`
  - **Primary CTA emerald** (Add to Cart, Apply, Buy): a vivid emerald/teal `~#11B886` / `#1DB47A`
  - Price text: gold/amber; struck compare price: muted grey; discount: green or red badge
  - Category-accent dots (used as small multi-color highlights): pink `#EC4899`, purple `#8B5CF6`,
    orange `#F59E0B`, blue `#3B82F6`, teal `#14B8A6`, red `#EF4444`
- **Light mode must remain coherent** (the codebase has a light/dark toggle). The designs are
  **dark-first**, so make **dark mode the default/primary experience**, and provide a tasteful,
  on-brand light palette as the alternate. Both modes re-skin from the same token files.

### Typography
- **Display/headings:** an elegant serif (e.g. *Cormorant Garamond*, *Playfair Display*, or
  *EB Garamond*) — matches the refined wordmark feel ("Award-Winning Craftsmanship", "Our Story").
- **Body/UI:** a clean, modern sans (e.g. *Inter* or *Poppins*).
- Load fonts via Google Fonts in `public/index.html` and wire them into the `--sf-font-*` tokens.

### Recurring UI motifs seen in the designs (reuse consistently)
- A **gradient announcement/promo bar** pinned at the very top, cycling messages
  (e.g. "Flash Sale Extra 25% Off on Premium Collection", "Free Shipping on Orders Above ₹1,999").
  It appears in green→teal, pink→purple, and orange variants.
- A **trust strip** of four reassurances with icons: **7-Day Easy Returns · 100% Money Back ·
  Free Shipping · Authentic Silk**.
- Prominent **search bar with an "AI Search" button**; a dedicated search screen with
  **AI Suggestions / Recent Searches / Trending**.
- **Product cards:** rounded, dark, image-led, with discount badge, wishlist heart, gold price,
  star rating + review count, "Add to Cart".
- **PDP:** large gallery with thumbnail rail, a gold **"PREMIUM"** ribbon, social proof, price
  block with savings, fabric/color selectors, quantity stepper, **Buy Now (gold) + Add to Cart
  (emerald)**, delivery/returns info, tabbed **Description / Specifications / Fabric & Craft /
  Reviews / FAQs**, and a **"You May Also Like"** rail.
- **₹ INR pricing** throughout, Indian context (Kolkata showroom, handloom, artisans).
- Subtle, tasteful **micro-interactions** (Framer Motion), skeleton loaders, honest empty states.

---

## 3. The `UI Designs/` folder (study every screen before writing prompts)

Map each mockup to the page/component it governs. Your prompts must reproduce these layouts in
the brand system above.

| Image file | Screen it defines |
|---|---|
| `Logo.png` | The brand wordmark (gold on dark green). Drives the logo-background rule. |
| `HOME PAGE WITH FOOTER.png` | Full home page incl. footer. |
| `HOME PAGE HIDE FOOTER.png` | Home page above the footer (hero, categories, rails, heritage banner, "Shop with Confidence"). |
| `DESKTOP SCREEN VIEW.png` | Desktop header/hero composition (announcement bar, trust strip, search, nav chips, hero). |
| `MENU.png` | Slide-out mobile menu drawer (Profile / Contact Us / Settings + trust strip + logo panel). |
| `SEARCH OPTION.png` | Search screen: AI Suggestions, Recent Searches, Trending. |
| `PRODUCT LISTING.png` | Search results / product grid with filter chips and result count. |
| `PRODUCT DETAILED PAGE.png` | PDP layout (gallery, info, price, CTAs, badges, You May Also Like). |
| `PRODUCT DETAILED PAGE SPECIFICATION.png` | PDP "Specifications" tab content + table. |
| `ADD TO CART.png` | Cart page: line items, promo code, price details, Proceed to Checkout. |
| `WISHLIST.png` | Wishlist grid + "You May Also Like". |
| `PROFILE.png` | Account page: header, stats (Orders/Wishlist/Reviews), menu list, recent orders, logout. |
| `OUR STORY.png` | About/Our Story: heritage, values, journey timeline, impact stats. |
| `CONTACT US PAGE.png` | Contact: "Let's Start a Conversation", contact cards, message form, showroom, socials. |

---

## 4. The admin panel boundary (read carefully)

- **Storefront = redesign fully.** **Admin = do not touch, except the logo.**
- The admin logo appears in **two** places as a placeholder constant:
  - `src/components/AdminLayout/AdminLayout.js` → `const LOGO = "https://placehold.co/160x40/...";`
  - `src/pages/Admin/AdminLogin.js` → `const LOGO = "https://placehold.co/210x70/...";`
  - Replace both with the Meghali's Silk logo, placed on the **brand-green background** per §2.
- Do **not** alter admin layout, navigation, tables, dialogs, `adminTheme.js`, or any admin data
  contract. The admin must keep working byte-for-byte as before aside from the logo.

---

## 5. Codebase orientation (the architecture your prompts MUST respect)

This is a **Create React App** project. Stack: **React 18, React Router v6, MUI 5, Framer Motion,
CSS Modules, Axios, SweetAlert2, Iconify**, with a **JSON Server** mock backend (`server.js` +
`db.json`). Verify all paths below before relying on them.

### 5.1 Theming is centralized — re-skin ONLY at the source
- **`src/theme/storefront-tokens.css`** — the **single re-skin point** for the storefront. All
  `--sf-*` CSS custom properties: light values in `:root`, dark values under `body.dark`
  (toggled by `ThemeContext`). Storefront CSS Modules consume `var(--sf-*)` — **never hardcode
  hex in components.** This is where the new brand palette lives.
- **`src/theme/colors.js`** — the same brand palette for the **MUI layer** (admin + a few MUI
  storefront bits). Keep it in sync with the tokens, but remember its DARK/LIGHT objects mostly
  drive MUI; **changing admin visuals beyond the logo is out of scope.**
- **`src/theme/tokens.js` → `STOREFRONT_CONFIG`** — themeable *content* config (which trust
  badges show, returns-window days, AOV toggles, gallery behaviour). Tune copy/policy here, not
  in component code.
- Read **`STOREFRONT_UX_GUIDELINES.md`** — it documents the storefront component library and the
  **"authenticity > persuasion"** rule (no fabricated reviews/stock/urgency; every persuasive
  element must bind to real API data). Your prompts must honor it.

### 5.2 Data & API contract (do not break the swap-to-Laravel guarantee)
- **All backend access goes through `src/services/api.js`** (a dual-mode service). The app flips
  from JSON Server to a real Laravel API by changing only two env vars
  (`REACT_APP_API_URL`, `REACT_APP_USE_MOCK_API`). **Do not add `fetch`/`axios` calls outside
  `apiService`.**
- **`db.json`** holds the mock data. Top-level collections (counts at time of writing):
  `banners`, `users`, `admins`, `categories`, `products`, `cart`, `orders`, `returns`,
  `payments`, `refunds`, `shipping_methods`, `coupons`, `reviews`, `wishlist`, `leads`,
  `settings` (object), `walletTransactions`, `dealsConfig` (object).
- When repopulating `db.json` with silk data, **preserve every JSON shape, key name (camelCase),
  id convention (numeric top-level ids; string variant ids like `"v1"`), money as INR integers,
  and ISO-8601 `…Z` timestamps.** Keep referential integrity (e.g. `product.categoryId`,
  `relatedProductIds`, `frequentlyBoughtTogetherIds`, review `productId`, order items, coupon
  ids referenced by `dealsConfig`). The five backend docs (`00`–`04`) describe the contract;
  honor them so a future Laravel swap still works.
- Useful product fields already supported: `images[]`, `price`, `comparePrice`, `stock`,
  `lowStockThreshold`, `variants[]` (with `attributes` + optional `swatchHex`), `tags[]`,
  `featured`/`trending`/`hot`, `rating`, `totalReviews`, `relatedProductIds`,
  `frequentlyBoughtTogetherIds`, `metaTitle`/`metaDescription`, `slug`. Use them.
- **Product images:** use royalty-free silk/saree imagery via stable hotlinkable URLs
  (e.g. Unsplash/Pexels direct links) or the existing `placehold.co` pattern with brand colors;
  every product needs multiple angles. Prefer real-looking silk photography where possible.

### 5.3 Routes & pages (storefront)
`App.js` wires these storefront routes (each has a page under `src/pages/`):
`/` Home · `/products` Products (listing/search) · `/products/:slug` ProductDetails ·
`/checkout` Checkout · `/order-confirmation/:orderNumber` · `/orders` OrderHistory ·
`/profile` Profile · `/wishlist` Wishlist · `/special-offers` SpecialOffers ·
`/help` HelpCenter · `/support` Support · `/about` AboutUs · `/privacy` · `/terms` ·
`/cookies` · `/refund`. Admin routes live under `/admin/*` (out of scope except logo).

**Design→page mapping:** `OUR STORY.png` → `/about` (AboutUs). `CONTACT US PAGE.png` →
`/support` (Support) — confirm which page renders the contact UI and theme that one.
`PROFILE.png` → `/profile`. `WISHLIST.png` → `/wishlist`. `ADD TO CART.png` → cart
(CartDrawer + any cart page). `SEARCH OPTION.png` → SearchModal. `MENU.png` → SidebarMenu.

### 5.4 Global components (storefront chrome)
`src/components/`: `Header`, `BottomNav` (mobile tab bar), `Footer`, `HeroSection`,
`CartDrawer`, `SidebarMenu`, `AuthModal`, `SearchModal`, `Newsletter`, `FAQ`, `CTASection`,
`FeaturedProducts`, `Breadcrumb`, `ReviewModal`, `BottomDrawer`, `ScrollToTop`, `ErrorBoundary`,
and the **`storefront/` component library** (`ProductCard`, `ProductGallery`, `PriceBlock`,
`StarRating`, `VariantSelector`, `QuantityStepper`, `AddToCartBar`, `TrustBadges`,
`DeliveryReturnsInfo`, `SocialProof`, `RelatedProducts`, `FrequentlyBoughtTogether`,
`ReviewsSection`). Contexts in `src/context/` (Auth, Cart, Order, Admin, Wishlist, DealsConfig,
Theme). Shared constants in `src/utils/constants.js` (`APP_NAME` comes from `REACT_APP_NAME`;
social links, support email/phone/address, free-shipping threshold, FAQs, "Why choose us").

### 5.5 Brand/config touch-points your prompts should update
- `.env` / `.env.production` → `REACT_APP_NAME=Meghali's Silk` (drives `APP_NAME`).
- `public/index.html` → `<title>`, meta description/keywords/OG/Twitter, `theme-color`, favicon
  links, Google Fonts. `public/manifest.json` + favicon/logo PNGs.
- `src/utils/constants.js` → support email/phone/address, social links, FAQ copy, "Why Choose Us".
- `db.json → settings.store` + `settings.social` → store name, tagline, contact, currency (INR),
  taxRate, address (Kolkata), and social handles.

---

## 6. Output format for EACH generated prompt (follow exactly)

- **Location & naming:** create a root folder **`prompts/`**. One file per prompt, zero-padded and
  ordered: `prompts/01-<kebab-title>.md`, `prompts/02-<kebab-title>.md`, … (25–30 total).
- **Self-contained:** assume each prompt is run in a **fresh Claude Code session with no memory of
  the others.** Each prompt must restate the minimal brand/architecture context it needs, name
  **exact file paths**, and never say "as in the previous prompt."
- **Dependency-ordered:** foundation (tokens, fonts, data) first; pages that depend on shared
  components come after those components.
- **Structure every prompt with these sections (in this order):**

  ```markdown
  # Prompt NN — <Title>

  ## Objective
  One or two sentences: what this prompt delivers and why.

  ## Brand & Design Context
  The minimal brand facts needed here (palette tokens, fonts, motifs, the logo-bg rule)
  + which `UI Designs/` image(s) to match.

  ## Scope — Files to Create / Modify
  Explicit list of file paths. Mark each create/modify. Call out what is OUT of scope.

  ## Detailed Requirements
  Numbered, unambiguous, imperative build steps (layout, structure, states, responsiveness,
  data wiring). Reference exact components/contexts/api methods to use.

  ## Data / API Notes
  Which `apiService` methods and `db.json` shapes are involved; what must NOT change in the
  contract; any db.json data to add/adjust (with example JSON honoring existing shapes).

  ## Constraints (Do Not Break)
  - Keep everything API-driven & functional (cart/checkout/auth/wishlist/orders).
  - Re-skin only via `src/theme/storefront-tokens.css` / tokens; no hardcoded hex in components.
  - Do not modify the admin panel (except the dedicated logo prompt).
  - Preserve the JSON Server ↔ Laravel swap contract and all JSON shapes.
  - Accessibility (focus states, ARIA, ≥44px targets), responsive/mobile-first, lazy images.

  ## Acceptance Criteria / Definition of Done
  A checkbox list that is concretely verifiable (visual parity with the named design,
  dark+light coherence, no console errors, feature still works end-to-end, `npm run build` clean).

  ## Verification Steps
  Exact commands/clicks to confirm it works (e.g. `npm run dev`, navigate to a route, perform a
  cart/checkout/login flow, toggle theme, check mobile width).
  ```

- **Tone:** precise, imperative, concrete. Prefer specifics ("gold `--sf-color-price`, 1.25rem,
  weight 600") over vague adjectives. Where a layout is shown in a design, describe it section by
  section.

---

## 7. Required prompt backbone (produce 25–30 prompts, grouped in batches)

Author the prompts to cover **all** of the following, in this order. You may split or merge
slightly to land within 25–30, but **every item below must be covered by some prompt**, and the
ordering/dependencies must hold. Group them under the batch headings (reflect the batch in the
index, and optionally as a comment at the top of each file).

**Batch A — Foundation & Brand System**
1. **Brand foundation & design tokens** — rewrite `src/theme/storefront-tokens.css` (light+dark
   `--sf-*` palette to the silk brand), align `src/theme/colors.js`, add Google Fonts + serif/sans
   wiring, set dark mode as default, update `.env`/`.env.production` (`REACT_APP_NAME`),
   `public/index.html` (title/meta/OG/theme-color/favicon), `manifest.json`, and `STOREFRONT_CONFIG`
   (trust badges, returns window). Establish the **logo-background rule** as a token.
2. **Global primitives & brand chrome** — shared button/badge/chip/card styles, the **gradient
   announcement/promo top bar** (cycling messages), the **trust strip** (7-Day Returns / 100%
   Money Back / Free Shipping / Authentic Silk), toast & skeleton styling — all token-driven.

**Batch B — Catalog Data (silk apparel)**
3. **Categories** — replace `db.json` categories with a women's silk taxonomy (e.g. Sarees with
   sub-types Banarasi/Tussar/Kanjivaram/Mulberry/Eri/Muga/Baluchari; Suits & Salwar; Lehengas;
   Dupattas & Stoles; Blouses; Bridal; New Arrivals; Bestsellers), with slugs, images, menu flags,
   ordering — preserving shape and parent/child links.
4. **Products part 1 — Sarees** (~15–20) with full fields, multiple images, fabric/color variants
   (`attributes` + `swatchHex`), tags, INR pricing + `comparePrice`, `rating`/`totalReviews`,
   featured/trending/hot, related & FBT ids.
5. **Products part 2 — Suits, Lehengas, Dupattas, Blouses, Stoles** (~10–15) to round out the
   catalog, consistent fields, cross-linked related/FBT ids referencing Batch B4.
6. **Supporting data** — themed `banners` (hero slides w/ brand gradients + links), `coupons`
   (silk-appropriate codes), `shipping_methods`, `reviews` (authentic, approved, some with
   photos), `settings.store`/`settings.social` (Meghali's Silk, Kolkata, INR), and `dealsConfig`
   (featured/deal-of-the-day product & coupon ids) — all shape-preserving.

**Batch C — Global Layout / Navigation**
7. **Header** (`DESKTOP SCREEN VIEW.png`) — logo on brand-green panel, AI search bar, category
   nav chips, account/wishlist/cart actions, announcement bar + trust strip integration, theme
   toggle; fully responsive.
8. **Mobile menu drawer** `SidebarMenu` (`MENU.png`) — logo panel, Profile/Contact/Settings, trust
   strip, themed.
9. **Bottom navigation** `BottomNav` — themed mobile tab bar (Home/Categories/Search/Wishlist/
   Account) with active states matching the designs.
10. **Footer** (`HOME PAGE WITH FOOTER.png`) — brand columns, newsletter, socials, payment/trust
    row, logo on brand-green.
11. **Search experience** `SearchModal` (`SEARCH OPTION.png`) — AI Suggestions, Recent Searches,
    Trending; wired to real product search via `apiService`.

**Batch D — Storefront Pages**
12. **Home — hero & top** (`HOME PAGE HIDE FOOTER.png`) — `HeroSection` carousel (brand banners),
    trust strip, category quick-links.
13. **Home — content sections** — Flash Deals (real-discount only), Shop by Category, Featured,
    a **Heritage/Luxury banner**, Trending, **"Shop with Confidence"** feature cards, Recently
    Viewed, authentic social-proof toasts.
14. **Product card** (`storefront/ProductCard` + Home/listing cards) — unified brand card: image,
    discount badge, wishlist heart, gold price + struck compare, rating, Add to Cart.
15. **Product listing / search results** (`PRODUCT LISTING.png`) — result header/count, filter
    chips (category/price/fabric/sort), responsive grid, empty/loading states; client-side
    filtering preserved.
16. **PDP — layout** (`PRODUCT DETAILED PAGE.png`) — `ProductGallery` w/ thumbnail rail + PREMIUM
    ribbon, title/social proof/price block, fabric & color `VariantSelector`, `QuantityStepper`,
    **Buy Now (gold) + Add to Cart (emerald)**, `DeliveryReturnsInfo`, `TrustBadges`.
17. **PDP — tabs & cross-sell** (`PRODUCT DETAILED PAGE SPECIFICATION.png`) — Description /
    Specifications (spec table) / Fabric & Craft / Reviews / FAQs tabs + **You May Also Like**
    (`RelatedProducts`) and `FrequentlyBoughtTogether`, all data-driven.
18. **Cart** (`ADD TO CART.png`) — `CartDrawer` + cart view: line items w/ variant, qty steppers,
    free-shipping progress, promo-code apply, price details, Proceed to Checkout; live totals.
19. **Checkout** — themed multi-step (contact/address → shipping → payment → review), coupon &
    wallet, order summary; **all money math + order creation via existing context/api unchanged.**
20. **Order confirmation & order history** — themed `/order-confirmation/:orderNumber` and
    `/orders` (status timeline, reorder, return entry points) — functionality intact.
21. **Wishlist** (`WISHLIST.png`) — themed grid, move-to-cart, "You May Also Like"; guest wishlist
    via localStorage preserved.
22. **Profile / Account** (`PROFILE.png`) — header, stats (Orders/Wishlist/Reviews), menu list,
    recent orders, logout; addresses/settings sections themed.
23. **Auth** `AuthModal` — themed login/register/forgot flows; validation + error states intact.

**Batch E — Content & Policy Pages**
24. **Our Story / About** (`OUR STORY.png`) — heritage, values, journey timeline, impact stats,
    media; brand storytelling copy for Meghali's Silk.
25. **Contact Us** (`CONTACT US PAGE.png`) — "Let's Start a Conversation", contact cards
    (call/email/WhatsApp), message form (posts a lead via `apiService`), showroom card, socials,
    "Why Choose Us".
26. **Special Offers / Today's Deals** + **Help Center** + **legal pages** (Privacy, Terms,
    Cookies, Refund) — consistent brand pass; deals page reads `dealsConfig`.

**Batch F — Admin Logo, Polish & QA**
27. **Admin logo swap only** — replace the `LOGO` constants in `AdminLayout.js` and
    `AdminLogin.js` with the Meghali's Silk logo on the brand-green background; **no other admin
    change.**
28. **Cross-cutting polish** — dark/light parity audit, responsive QA at mobile/tablet/desktop,
    Framer-Motion micro-interactions, unified empty/loading/error states, accessibility
    (focus-visible, ARIA, contrast, ≥44px targets), image lazy-loading.
29. **Final QA & acceptance** — end-to-end verification that **every feature still works
    API-driven** (browse → search → PDP → add to cart → checkout → order; register/login;
    wishlist; coupons; reviews), `npm run build` is clean, and the Laravel-swap contract is
    intact. Include a master acceptance checklist and run instructions (`npm run dev`).
30. *(optional)* **Brand README** — short brand/usage guide documenting the token system and how
    to tweak palette/content.

---

## 8. Also create an index file

Create **`prompts/00-INDEX.md`** listing all prompts in order: number, title, the batch, a
one-line summary, the primary `UI Designs/` image(s) it targets, and the key files it touches.
Add a short "How to use" note (feed them to Claude Code in numeric order; each is self-contained).

---

## 9. Your working method for this session

1. **Study** every `UI Designs/` image and skim the files referenced in §5 to confirm paths,
   token names, db.json shapes, and the admin boundary.
2. **Plan** the final numbered list (25–30) honoring §7's coverage and ordering.
3. **Write** each prompt as its own file in `prompts/` using the exact §6 format, then write
   `prompts/00-INDEX.md`.
4. **Self-check** against §10 before finishing. Do **not** modify any application code or
   `db.json` in this session — only the prompt files.

---

## 10. Definition of done (for THIS prompt-generation task)

- [ ] A `prompts/` folder exists with **25–30** sequential, zero-padded `.md` prompt files + `00-INDEX.md`.
- [ ] Prompts are **dependency-ordered** and each is **self-contained** (fresh-session safe, exact paths).
- [ ] Every §7 item is covered; batches A–F are all represented.
- [ ] Each prompt follows the §6 structure incl. **Acceptance Criteria** and **Verification Steps**.
- [ ] Brand system (dark-first, emerald + gold, serif/sans, logo-on-green rule) is consistently
      specified and tied to `storefront-tokens.css` as the single re-skin point.
- [ ] The **admin-untouched-except-logo** rule and the **API-driven / JSON-shape / Laravel-swap**
      constraints are restated in the prompts they apply to.
- [ ] `db.json` repopulation prompts specify **realistic women's silk apparel** data while
      **preserving all shapes, ids, money, dates, and referential integrity**.
- [ ] No application code or `db.json` was changed in this session — only files under `prompts/`.

> Now: study the designs and the codebase, then generate the prompt files.
