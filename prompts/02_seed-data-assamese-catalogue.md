# Seed Data — the Assamese Silk Catalogue

**Prompt 2 of 30**

## Depends on

Prompt 01 — design system (only for the brand-color placeholder-image convention; the data work itself is independent).

## Context

Meghali's Silk sells **Assamese silk** — Mekhela Chador, Muga silk, Eri silk, Pat (Paat) silk — plus curated gift items. The storefront redesign (warm-minimalist, editorial, luxury DTC) will be built against this catalogue, so the seed content must be refreshed FIRST. Stack: CRA storefront + JSON Server reading `db.json` through the dual-mode `src/services/api.js` (`{ success, data, meta }` Laravel contract in production mode). This prompt is **content only**: it may add/replace rows in `db.json` using the existing schema shapes — never change the schema, keys, or the API contract.

## Objective

Replace the current Bengal-centric seed catalogue (Banarasi/Kanjivaram/Tussar sarees) with a coherent, on-brand **Assamese silk** catalogue — products, categories, banners, coupons, reviews, deals config, wishlist rows, and store-settings copy — keeping every id-reference consistent so all existing flows (orders, payments, returns, wallet, admin) keep working untouched.

## Scope — files/areas to touch

- `db.json` ONLY. Collections to refresh: `products` (33 rows), `categories` (13 rows), `banners` (4), `coupons` (6), `reviews` (12), `dealsConfig`, `wishlist` (3), and the copy fields inside `settings` (`store.tagline`, `seo.metaTitle`, `seo.metaDescription`).
- Collections that must NOT be touched: `users`, `admins`, `orders`, `returns`, `payments`, `refunds`, `walletTransactions`, `cart`, `shipping_methods` (copy tweaks to `shipping_methods.description` are allowed; structure is not), `leads`.
- No `src/` file, no `public/` file, no config file.

## Brand & design requirements (content voice)

- **Catalogue plan** (keep exactly the current schema keys per row — copy an existing row as the template):
  - Top-level categories (`parentId: null`, `showInMainMenu: true`, sensible `menuOrder`): **Mekhela Chador**, **Sarees**, **Stoles & Wraps**, **Blouses & Fabric**, **Gifts & Keepsakes**, **Bridal & Occasion** (or a similarly curated six). Child categories under the relevant parents for the silk families: **Muga Silk**, **Eri Silk**, **Pat Silk**, **Nuni/Toss blends** etc. (`showInMainMenu: false`, ordered `sortOrder`).
  - ~33 products spread across those categories: Muga Mekhela Chador sets, Pat silk Mekhela Chador, Eri shawls/stoles, Muga sarees, gamosa-inspired gift weaves, silk cushion/keepsake gift items, bridal Mekhela sets. Keep `brand: "Meghali's Silk"`.
- **Voice:** refined, warm, aspirational — loom provenance (Sualkuchi weaving tradition), fibre character (Muga's natural golden sheen, Eri's soft matte warmth), care notes (dry clean, muslin storage). No hype, no fake scarcity.
- **Pricing:** realistic INR (Muga Mekhela sets ≈ ₹15,000–₹45,000; Eri stoles ≈ ₹2,500–₹8,000; gifts ≈ ₹800–₹5,000). `comparePrice` only where an honest markdown story exists; many products should have NO discount (editorial stores don't blanket-discount).
- **Imagery:** keep the existing `placehold.co` placeholder convention but recolor to the NEW brand palette from Prompt 01 (read the final surface/ink/gold hexes from `src/theme/storefront-tokens.css` and use them in the placeholder URLs, e.g. `https://placehold.co/600x800/<bg-hex>/<fg-hex>?text=Muga+Mekhela`). 3–4 images per product, portrait 600×800. Never hotlink Meghali's Silk's real photography.
- **Reviews:** 12 rows tied to real new productIds; mostly `status: "approved"`, keep 1–2 `pending` and 1 `rejected` so admin moderation and the Order History "your review" states stay exercisable. Grounded, specific bodies; ratings 4–5 with one honest 3.

## Functional guardrails

1. Preserve the data/API contract absolutely: every row keeps the exact key set and value types of the current seed rows (`products` rows keep `slug`, `sku`, `variants[].{id,name,price,stock,sku,attributes,swatchHex}`, `tags`, `featured/trending/hot`, `rating`, `totalReviews`, `relatedProductIds`, `frequentlyBoughtTogetherIds`, `metaTitle`, `metaDescription`, timestamps…). JSON Server and the Laravel branch both depend on these shapes.
2. **Keep the product id space stable (ids 1–33) and repair every cross-reference:** `products[].relatedProductIds` and `frequentlyBoughtTogetherIds` must point at valid new ids; `dealsConfig.featuredCouponIds/dealOfTheDayIds/featuredProductIds` must reference existing coupons/products; `wishlist` rows must snapshot real new products (keep their `userId` values); `categories.parentId` links must resolve. Historic `orders`/`returns`/`payments` reference old productIds but carry their own name/image snapshots — leave them alone; they must keep rendering in Order History and Admin.
3. Do NOT modify the admin panel or any `src/` code. Admin Products/Categories/Coupons/Reviews/Special Offers must list the new content correctly with zero code change.
4. Brand consistency: every name/description/SEO string reads like one curated Assamese silk boutique; `settings.store.name` stays "Meghali's Silk"; tagline/SEO copy updated to the Assamese silk identity.
5. Variant integrity: `variants[].attributes.Fabric` values become the new fabric vocabulary (**Muga Silk, Eri Silk, Pat Silk**, blends) — Prompt 14 will align the Products page fabric facet to this exact vocabulary, so keep it consistent and spelled identically across products. `swatchHex` values should be plausible textile tones. Per-variant `stock` sums should roughly match product `stock`.
6. No fabricated trust signals: `rating`/`totalReviews` must stay modest and plausible (dozens, not thousands); coupons must be honestly redeemable (sane `minOrderAmount`, future `expiresAt`, `usedCount: 0`); `dealsConfig` deal products must genuinely have a `comparePrice` markdown.
7. Test before done — see below.

## Implementation notes

- Work by transforming rows in place (same array positions/ids) rather than regenerating the file — it minimizes reference breakage and keeps untouched collections byte-identical.
- `slug` values: lowercase-hyphenated from the new names, unique — slug routing (`/products/:slug`) resolves via `products?slug=` in mock mode.
- Countdown: `dealsConfig.timer` currently uses `onExpiry: "endOfDay"` with empty `endAt` — keep that structure.
- Coupons: 6 rows; refresh codes/copy to the new brand (e.g. MUGA500, FIRSTLOOM, BRIDAL10…) keeping the exact field set (`type` fixed/percentage, `minOrderAmount`, `maxDiscount`, `usageLimit`, `perUserLimit`, `expiresAt` in the future).
- Banners: 4 rows keyed to real category links (`/products?category=<new-slug>`) with `gradient` values built from the new token palette hexes.
- Validate at the end: `node -e "JSON.parse(require('fs').readFileSync('db.json'))"` and restart `npm run server`.

## Acceptance criteria

- [ ] All 33 products are Assamese-silk/gift items with complete, schema-identical rows and unique slugs.
- [ ] Category tree is the new curated structure; every `products[].categoryId` and `categories[].parentId` resolves.
- [ ] `relatedProductIds`, `frequentlyBoughtTogetherIds`, `dealsConfig.*Ids`, and `wishlist` rows all reference valid new content.
- [ ] `reviews` reference valid productIds with a status mix (approved/pending/rejected).
- [ ] `users`, `admins`, `orders`, `returns`, `payments`, `refunds`, `walletTransactions` are byte-identical to before.
- [ ] `db.json` parses; JSON Server starts clean.

## Test & QA

- `npm run dev`, then click through: Home (featured/trending rails populate), Products (all categories filter correctly, fabric chips appear), a product detail page by slug (variants, related, FBT render), search finds "Muga"/"Mekhela".
- Special Offers: hero, countdown, featured coupons, deal-of-the-day products all resolve.
- Log in as user@example.com / password123 → Order History still renders the historic orders (old snapshots) without errors; wallet balance unchanged.
- Admin (admin@store.com / admin123): Products, Categories, Coupons, Reviews, Special Offers config all list the new content; open one product edit dialog to confirm field mapping.
- Add a new product to cart → checkout to the Review step (don't need to place) → totals compute.
