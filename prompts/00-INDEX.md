# Meghali's Silk — Storefront Build Prompts (Index)

This folder contains **30 sequenced, self-contained build prompts** that transform the supplied generic
e-commerce boilerplate into a production-grade, brand-consistent storefront for **Meghali's Silk** — a
premium online store for **women's silk apparel** (sarees, suits, dupattas, lehengas, blouses, stoles,
bridal & ethnic wear).

## How to use
1. Feed these prompts to Claude Code **one at a time, in numeric order** (`01` → `30`). Each is written
   to run in a **fresh session with no memory of the others**, so just paste one prompt, let it finish,
   verify it, then move to the next.
2. **Order matters.** Foundation (tokens, fonts, brand config) comes first, then catalog data, then the
   global chrome, then pages, then content pages, then admin-logo/polish/QA. Pages depend on the tokens
   (01), the shared primitives (02), the data (03–06), and the shared `ProductCard` (14).
3. Every prompt ends with **Acceptance Criteria** and **Verification Steps** — confirm those before
   continuing. Most verification uses `npm run dev` (CRA + JSON Server) and a final `npm run build`.
4. **Guardrails baked into every prompt:** re-skin only via `src/theme/storefront-tokens.css` (the single
   re-skin point) — no hardcoded hex in components; keep every feature **API-driven** through
   `src/services/api.js` (`apiService`); **do not modify the admin panel** except the dedicated logo
   prompt (27); preserve all `db.json` JSON shapes and the **JSON Server ↔ Laravel swap contract**; honor
   **authenticity > persuasion** (no fabricated reviews/stock/urgency); accessibility + mobile-first.
5. **Catalog data — pick ONE path:** run the granular **03 → 06** sequence, **or** the consolidated
   all-in-one **31** (it seeds the entire `db.json` catalogue in a single session). They produce the same
   dataset — **do not run both.** Everything else (01–02, 07–30) is unaffected by which you choose.

## Brand system at a glance
- **Dark-first** charcoal canvas (`#0B0C0B`), deep bottle-green brand panels (`#0B3B2E`), **gold/
  champagne** accents (`#CBA35A`/`#E6C27A`), **emerald** CTAs (`#12B886`), multicolor category dots.
- **Logo-on-green rule:** the logo
  (`https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`) always sits on a
  panel filled with `var(--brand-logo-bg)` (`#0B3B2E`).
- **Type:** serif display **Cormorant Garamond** (`--sf-font-display`) + sans body **Inter**
  (`--sf-font-family`).
- **Data ids (set by Batch B):** categories `1–6` parents / `7–13` saree weaves; products `1–18` sarees /
  `19–33` other silk.

---

## Batch A — Foundation & Brand System
| # | Title | Designs | Key files |
|---|-------|---------|-----------|
| 01 | Brand Foundation & Design Tokens | `Logo.png`, `DESKTOP SCREEN VIEW.png` | `src/theme/storefront-tokens.css`, `src/theme/colors.js`, `src/context/ThemeContext.js`, `public/index.html`, `public/manifest.json`, `.env`, `.env.production`, `src/theme/tokens.js`, `src/utils/constants.js` |
| 02 | Global Primitives & Brand Chrome | `DESKTOP SCREEN VIEW.png`, `HOME PAGE HIDE FOOTER.png` | `src/theme/storefront-primitives.css` (new), `src/components/AnnouncementBar/*` (new), `src/components/TrustStrip/*` (new) |

## Batch B — Catalog Data (women's silk apparel)
| # | Title | Designs | Key files |
|---|-------|---------|-----------|
| 03 | Catalog Categories (Women's Silk Taxonomy) | listing/nav context | `db.json` → `categories` (ids 1–6 parents, 7–13 saree weaves) |
| 04 | Catalog Products: Sarees (~18) | `PRODUCT LISTING.png`, `PRODUCT DETAILED PAGE.png` | `db.json` → `products` ids 1–18 |
| 05 | Catalog Products: Suits, Lehengas, Dupattas, Stoles & Blouses (~15) | `PRODUCT LISTING.png` | `db.json` → `products` ids 19–33 |
| 06 | Catalog Supporting Data (Banners, Coupons, Shipping, Reviews, Settings, Deals) | `HOME PAGE WITH FOOTER.png` | `db.json` → `banners`, `coupons`, `shipping_methods`, `reviews`, `settings.store/social/seo`, `dealsConfig` |

## Batch C — Global Layout / Navigation
| # | Title | Designs | Key files |
|---|-------|---------|-----------|
| 07 | Header | `DESKTOP SCREEN VIEW.png` | `src/components/Header/Header.{js,module.css}` |
| 08 | Mobile Menu Drawer | `MENU.png` | `src/components/SidebarMenu/SidebarMenu.{js,module.css}` |
| 09 | Bottom Navigation | `HOME PAGE HIDE FOOTER.png`, `WISHLIST.png` | `src/components/BottomNav/BottomNav.{js,module.css}` |
| 10 | Footer | `HOME PAGE WITH FOOTER.png` | `src/components/Footer/Footer.{js,module.css}` |
| 11 | Search Experience | `SEARCH OPTION.png` | `src/components/SearchModal/SearchModal.{js,module.css}` (+ `index.js`) |

## Batch D — Storefront Pages
| # | Title | Designs | Key files |
|---|-------|---------|-----------|
| 12 | Home Hero & Top | `HOME PAGE HIDE FOOTER.png`, `DESKTOP SCREEN VIEW.png` | `src/components/HeroSection/*`, `src/pages/Home/Home.{js,module.css}` |
| 13 | Home Content Sections | `HOME PAGE HIDE FOOTER.png`, `HOME PAGE WITH FOOTER.png` | `src/pages/Home/Home.{js,module.css}` |
| 14 | Brand Product Card | `PRODUCT LISTING.png`, `WISHLIST.png` | `src/components/storefront/ProductCard.{js,module.css}` |
| 15 | Product Listing & Search Results | `PRODUCT LISTING.png` | `src/pages/Products/Products.{js,module.css}` |
| 16 | PDP Layout & Buy Box | `PRODUCT DETAILED PAGE.png` | `src/pages/ProductDetails/*` + storefront `ProductGallery`/`PriceBlock`/`VariantSelector`/`QuantityStepper`/`AddToCartBar`/`TrustBadges`/`DeliveryReturnsInfo`/`SocialProof` |
| 17 | PDP Tabs (Specifications) & Cross-Sell | `PRODUCT DETAILED PAGE SPECIFICATION.png` | `src/pages/ProductDetails/*` + storefront `RelatedProducts`/`FrequentlyBoughtTogether`/`ReviewsSection` |
| 18 | Cart (Slide-over Drawer) | `ADD TO CART.png` | `src/components/CartDrawer/CartDrawer.{js,module.css}` |
| 19 | Checkout | brand system | `src/pages/Checkout/Checkout.{js,module.css}` |
| 20 | Order Confirmation & Order History | brand system | `src/pages/OrderConfirmation/*`, `src/pages/OrderHistory/*` |
| 21 | Wishlist | `WISHLIST.png` | `src/pages/Wishlist/Wishlist.{js,module.css}` |
| 22 | Profile / Account | `PROFILE.png` | `src/pages/Profile/Profile.{js,module.css}` |
| 23 | Authentication Modal | brand system | `src/components/AuthModal/AuthModal.{js,module.css}` |

## Batch E — Content & Policy Pages
| # | Title | Designs | Key files |
|---|-------|---------|-----------|
| 24 | Our Story / About | `OUR STORY.png` | `src/pages/AboutUs/AboutUs.{js,module.css}` (`/about`) |
| 25 | Contact Us | `CONTACT US PAGE.png` | `src/pages/Support/Support.{js,module.css}` (`/support`) |
| 26 | Special Offers, Help Center & Legal | `HOME PAGE WITH FOOTER.png` | `src/pages/SpecialOffers/*`, `src/pages/HelpCenter/*`, `src/pages/{PrivacyPolicy,TermsOfService,CookiePolicy,RefundPolicy}/*` |

## Batch F — Admin Logo, Polish & QA
| # | Title | Designs | Key files |
|---|-------|---------|-----------|
| 27 | Admin Logo Swap (Brand Logo on Green) | `Logo.png` | `src/components/AdminLayout/AdminLayout.js`, `src/pages/Admin/AdminLogin.js` (logo only) |
| 28 | Cross-Cutting Storefront Polish & Consistency | all | `src/components/*` (storefront), `src/pages/*` (non-admin) |
| 29 | Final QA & Acceptance (End-to-End) | all | whole storefront (verification + minimal fixes) |
| 30 | Brand & Usage Guide | — | `BRAND_README.md` (new) |

## Optional / Alternative — Consolidated Catalog Data
| # | Title | Designs | Key files |
|---|-------|---------|-----------|
| 31 | Seed db.json with the Full Meghali's Silk Catalogue (All-in-One) | `PRODUCT LISTING.png`, `HOME PAGE WITH FOOTER.png` | `db.json` (categories 1–13, ~33 products 1–33, banners, coupons, shipping, reviews, settings, dealsConfig) |

> **Prompt 31 is a single-session alternative to Batch B (03–06)** — it replaces the entire generic
> catalogue with the cohesive silk dataset in one pass (taxonomy, products with variants/SKUs/prices/
> imagery/ratings/labels, approved reviews, coupons, `dealsConfig`, brand `settings`), using the exact
> existing schema shapes. **Run 03–06 _or_ 31, never both.**

---

### Coverage note
All items from the build backbone are covered, batches **A–F** are all represented, the **admin panel is
untouched except the logo** (27), and the catalog-data prompts (03–06) repopulate **realistic women's
silk apparel** while preserving every `db.json` shape, id convention, INR money, ISO date, and
referential link.
