<!-- Batch B — Catalog Data (consolidated all-in-one alternative to 03–06) -->
# Prompt 31 — Seed db.json with the Full Meghali's Silk Catalogue (All-in-One)

## Objective
Replace the boilerplate's generic demo catalogue (laptops, earbuds, etc.) with a **cohesive, fully
cross-linked Meghali's Silk dataset** in a single pass over `db.json`: a women's silk-apparel taxonomy,
~30 products (with variants, prices, SKUs, descriptions, placeholder imagery, ratings and
featured/trending/hot labels), an approved-reviews set, brand banners, coupons, shipping copy,
`dealsConfig` and brand `settings` — all using the **exact existing schema shapes** so the whole app
stays functional and the redesign renders real apparel content end-to-end. This is the consolidated
alternative to running the granular data prompts `prompts/03-catalog-categories.md`,
`prompts/04-catalog-products-sarees.md`, `prompts/05-catalog-products-suits-lehengas-dupattas-blouses-stoles.md`
and `prompts/06-catalog-supporting-data.md` — **run either this single prompt OR that 03–06 sequence, not both.**

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house from
Bengal/Kolkata selling **authentic women's silk apparel** — sarees, suits & salwar, lehengas, dupattas
& stoles, blouses and bridal wear (National Handloom Award winner; artisan/handloom story). All money is
**INR integers**; the storefront shows ₹ pricing and an Indian context (Kolkata showroom, weaving
clusters). This prompt seeds **data only** — no UI is changed here; the visual redesign lives in the
other prompts.

Placeholder imagery: use the brand placeholder pattern
`https://placehold.co/600x800/0B3B2E/CBA35A?text=<Label>` (deep-green `#0B3B2E` bg, gold `#CBA35A` text,
portrait ~3:4) for every product (3+ images each, distinct labels per angle), or stable royalty-free
direct image URLs (Unsplash/Pexels) of silk sarees/ethnic wear if you prefer real photography — but
every image field must remain a valid URL string.

## Scope — Files to Create / Modify
- (MODIFY) `db.json` — repopulate the storefront **content** collections: `categories`, `products`,
  `banners`, `coupons`, `shipping_methods` (copy only), `reviews`, `settings.store` / `settings.social` /
  `settings.seo`, and `dealsConfig`. Also fix product references inside seed `orders` / `wishlist` /
  `payments` so they point at valid silk products (for coherence) **without changing those collections'
  shapes**.
- **OUT of scope:** ANY component/page/theme/code change (the redesign prompts own that); the admin panel
  and `src/theme/adminTheme.js`; `src/services/api.js`; the structural shape of `users` / `admins` /
  `cart` / `returns` / `refunds` / `walletTransactions` (you may correct product references for integrity
  but must not rename keys, change id conventions, or alter their schema).

## Detailed Requirements

### 1. Categories (replace `categories` with these EXACT fixed ids/slugs)
Shape per row (keep every key): `id, name, slug, description, image, parentId, isActive, sortOrder,
showInMainMenu, menuOrder, createdAt, updatedAt` (ISO `…Z` dates).

| id | name | slug | parentId | sortOrder | showInMainMenu | menuOrder |
|----|------|------|----------|-----------|----------------|-----------|
| 1 | Sarees | `sarees` | null | 1 | true | 1 |
| 2 | Suits & Salwar | `suits-salwar` | null | 2 | true | 2 |
| 3 | Lehengas | `lehengas` | null | 3 | true | 3 |
| 4 | Dupattas & Stoles | `dupattas-stoles` | null | 4 | true | 4 |
| 5 | Blouses | `blouses` | null | 5 | true | 5 |
| 6 | Bridal | `bridal` | null | 6 | true | 6 |
| 7 | Banarasi Silk | `banarasi-silk` | 1 | 1 | false | 0 |
| 8 | Kanjivaram Silk | `kanjivaram-silk` | 1 | 2 | false | 0 |
| 9 | Tussar Silk | `tussar-silk` | 1 | 3 | false | 0 |
| 10 | Mulberry Silk | `mulberry-silk` | 1 | 4 | false | 0 |
| 11 | Eri Silk | `eri-silk` | 1 | 5 | false | 0 |
| 12 | Muga Silk | `muga-silk` | 1 | 6 | false | 0 |
| 13 | Baluchari Silk | `baluchari-silk` | 1 | 7 | false | 0 |

- Parents (1–6): `parentId: null`, `isActive: true`, `showInMainMenu: true`. Saree weave children (7–13):
  `parentId: 1`, `isActive: true`, `showInMainMenu: false`, `menuOrder: 0`. Give each a 1-line silk
  description and a brand-placeholder `image`. "New Arrivals" / "Bestsellers" are **tag/flag-driven**
  (not categories).

### 2. Products (replace `products` with ~30 silk items; ids 1–33, numeric, sequential, no gaps)
Use the full existing product shape for every item — keep ALL keys:
```json
{
  "id": 1, "name": "Royal Banarasi Silk Saree", "slug": "royal-banarasi-silk-saree",
  "sku": "SAR-BAN-001", "shortDescription": "...", "description": "...",
  "categoryId": 7, "brand": "Meghali's Silk",
  "images": ["https://placehold.co/600x800/0B3B2E/CBA35A?text=Banarasi+Front",
             "https://placehold.co/600x800/0B3B2E/CBA35A?text=Banarasi+Drape",
             "https://placehold.co/600x800/0B3B2E/CBA35A?text=Banarasi+Pallu"],
  "price": 18500, "comparePrice": 24000, "costPrice": 12000,
  "stock": 24, "lowStockThreshold": 5, "weight": 0.8,
  "dimensions": { "length": 550, "width": 115, "height": 2 },
  "variants": [
    { "id": "v1", "name": "Royal Red", "price": 18500, "stock": 10, "sku": "SAR-BAN-001-RED",
      "attributes": { "Color": "Royal Red" }, "swatchHex": "#8E1B2E" },
    { "id": "v2", "name": "Emerald Green", "price": 18500, "stock": 8, "sku": "SAR-BAN-001-GRN",
      "attributes": { "Color": "Emerald Green" }, "swatchHex": "#0B3B2E" },
    { "id": "v3", "name": "Royal Gold", "price": 19500, "stock": 6, "sku": "SAR-BAN-001-GLD",
      "attributes": { "Color": "Royal Gold" }, "swatchHex": "#CBA35A" }
  ],
  "tags": ["saree","banarasi","silk","wedding","zari"],
  "featured": true, "trending": true, "hot": false, "isActive": true,
  "rating": 4.7, "totalReviews": 96,
  "metaTitle": "Royal Banarasi Silk Saree | Meghali's Silk",
  "metaDescription": "Handwoven Banarasi silk saree with gold zari brocade. Free shipping over ₹999.",
  "createdAt": "2025-02-01T00:00:00.000Z", "updatedAt": "2026-05-01T00:00:00.000Z",
  "frequentlyBoughtTogetherIds": [26, 30], "relatedProductIds": [2, 8, 14]
}
```
Rules:
- **`id`** numeric sequential **1–33**; **`slug`** unique kebab; **`sku`** pattern `SAR-`/`SUT-`/`LEH-`/
  `DUP-`/`BLO-` + code + zero-padded number; `brand` = `"Meghali's Silk"`.
- **`comparePrice` > `price` > `costPrice`** (INR integers). Set `comparePrice` only where a genuine
  discount exists (most items; a few may omit it / set equal-to-price → then NO discount shows).
- **Variants where sensible**: sarees & dupattas/stoles → `Color` variants with `swatchHex` (1–3 each;
  some sarees may be a single colourway — that's fine); suits & blouses → `Size` (and optional `Color`)
  variants (e.g. `Free Size`/`S`/`M`/`L`); lehengas → `Size`/`Color`. Each variant needs
  `id`("v1"…), `name`, `price`, `stock`, `sku`, `attributes`.
- **Labels/flags**: set `featured`/`trending`/`hot` per the table (these drive the storefront's badges /
  Featured & Trending rails; the discount badge and "PREMIUM" ribbon are derived from `comparePrice` and
  `featured`). Keep `isActive: true`.
- **Ratings authentic**: `rating` ∈ 4.2–4.9, `totalReviews` plausible (10–180) and **≥** the number of
  seeded approved reviews for that product (see §5).
- **Referential integrity**: `categoryId` ∈ the table above; `relatedProductIds` and
  `frequentlyBoughtTogetherIds` reference OTHER existing ids in 1–33 (never the item's own id). Sarees use
  `categoryId` 1 or a weave child 7–13 (bridal sarees may use 6). Non-sarees use 2/3/4/5/6.

**Product completion table** (write all 33; adapt colours/names for authenticity but keep id, slug,
categoryId, sku prefix, price/comparePrice and flags):

| id | name | slug | catId | sku | price | comparePrice | variants | flags |
|----|------|------|-------|-----|-------|--------------|----------|-------|
| 1 | Royal Banarasi Silk Saree | royal-banarasi-silk-saree | 7 | SAR-BAN-001 | 18500 | 24000 | Color×3 | featured,trending |
| 2 | Kanjivaram Temple Border Saree | kanjivaram-temple-border-saree | 8 | SAR-KAN-002 | 26500 | 32000 | Color×2 | featured |
| 3 | Handwoven Tussar Silk Saree | handwoven-tussar-silk-saree | 9 | SAR-TUS-003 | 8900 | 11500 | Color×2 | trending |
| 4 | Pure Mulberry Silk Saree | pure-mulberry-silk-saree | 10 | SAR-MUL-004 | 12500 | 15000 | Color×3 | featured |
| 5 | Natural Eri Silk Saree | natural-eri-silk-saree | 11 | SAR-ERI-005 | 7500 | 9500 | Color×2 | — |
| 6 | Assam Muga Silk Saree | assam-muga-silk-saree | 12 | SAR-MUG-006 | 21000 | 26000 | Color×2 | featured,hot |
| 7 | Baluchari Mythological Saree | baluchari-mythological-saree | 13 | SAR-BAL-007 | 16500 | 20000 | Color×1 | trending |
| 8 | Golden Zari Banarasi Saree | golden-zari-banarasi-saree | 7 | SAR-BAN-008 | 22000 | 28000 | Color×2 | hot |
| 9 | Kanjivaram Bridal Silk Saree | kanjivaram-bridal-silk-saree | 6 | SAR-KAN-009 | 34500 | 42000 | Color×2 | featured |
| 10 | Tussar Ghicha Silk Saree | tussar-ghicha-silk-saree | 9 | SAR-TUS-010 | 9900 | 12500 | Color×2 | — |
| 11 | Mulberry Printed Silk Saree | mulberry-printed-silk-saree | 10 | SAR-MUL-011 | 6900 | 8900 | Color×3 | — |
| 12 | Eri Handloom Silk Saree | eri-handloom-silk-saree | 11 | SAR-ERI-012 | 8200 | 10500 | Color×2 | trending |
| 13 | Muga Tussar Blend Saree | muga-tussar-blend-saree | 12 | SAR-MUG-013 | 14500 | 18000 | Color×1 | — |
| 14 | Banarasi Georgette Silk Saree | banarasi-georgette-silk-saree | 7 | SAR-BAN-014 | 11500 | 14500 | Color×3 | — |
| 15 | Soft Silk Kanjivaram Saree | soft-silk-kanjivaram-saree | 8 | SAR-KAN-015 | 15500 | 19000 | Color×2 | featured |
| 16 | Baluchari Resham Silk Saree | baluchari-resham-silk-saree | 13 | SAR-BAL-016 | 17500 | 21500 | Color×1 | — |
| 17 | Red Bridal Banarasi Saree | red-bridal-banarasi-saree | 6 | SAR-BAN-017 | 38500 | 46000 | Color×2 | featured,hot |
| 18 | Pastel Tussar Silk Saree | pastel-tussar-silk-saree | 9 | SAR-TUS-018 | 7900 | 9900 | Color×3 | — |
| 19 | Silk Anarkali Suit Set | silk-anarkali-suit-set | 2 | SUT-ANA-019 | 6500 | 8500 | Size×4 | featured |
| 20 | Chanderi Silk Salwar Suit | chanderi-silk-salwar-suit | 2 | SUT-CHA-020 | 4200 | 5500 | Size×4 | — |
| 21 | Tussar Silk Straight Suit | tussar-silk-straight-suit | 2 | SUT-TUS-021 | 5200 | 6800 | Size×4 | trending |
| 22 | Banarasi Silk Palazzo Suit | banarasi-silk-palazzo-suit | 2 | SUT-BAN-022 | 7200 | 9000 | Size×4 | — |
| 23 | Silk Bridal Lehenga Choli | silk-bridal-lehenga-choli | 3 | LEH-BRD-023 | 32000 | 40000 | Size×3,Color×2 | featured,hot |
| 24 | Embroidered Silk Lehenga | embroidered-silk-lehenga | 3 | LEH-EMB-024 | 18500 | 23000 | Size×3 | trending |
| 25 | Banarasi Silk Lehenga | banarasi-silk-lehenga | 3 | LEH-BAN-025 | 24500 | 30000 | Size×3,Color×2 | featured |
| 26 | Banarasi Silk Dupatta | banarasi-silk-dupatta | 4 | DUP-BAN-026 | 2200 | 3000 | Color×3 | trending |
| 27 | Tussar Silk Stole | tussar-silk-stole | 4 | DUP-TUS-027 | 1500 | 2200 | Color×3 | — |
| 28 | Embroidered Pure Silk Dupatta | embroidered-pure-silk-dupatta | 4 | DUP-EMB-028 | 2800 | 3600 | Color×2 | featured |
| 29 | Muga Silk Stole | muga-silk-stole | 4 | DUP-MUG-029 | 1900 | 2600 | Color×2 | — |
| 30 | Designer Silk Blouse | designer-silk-blouse | 5 | BLO-DSG-030 | 1800 | 2500 | Size×4,Color×2 | — |
| 31 | Banarasi Brocade Blouse | banarasi-brocade-blouse | 5 | BLO-BAN-031 | 2200 | 2900 | Size×4 | trending |
| 32 | Readymade Silk Blouse | readymade-silk-blouse | 5 | BLO-RDY-032 | 1200 | 1700 | Size×4 | — |
| 33 | Bridal Silk Saree & Blouse Set | bridal-silk-saree-blouse-set | 6 | SAR-BRD-033 | 45000 | 55000 | Color×2 | featured,hot |

Worked examples to write verbatim then adapt the rest: **id 1** (the full object above), plus build
**id 19** (Anarkali suit, `categoryId: 2`, Size variants `S/M/L/XL` with one shared price + colour
attribute) and **id 26** (Banarasi dupatta, `categoryId: 4`, three `Color` variants with `swatchHex`)
on the same shape. Give every product 3+ images, real-sounding handloom descriptions, tags, and
cross-linked `relatedProductIds`/`frequentlyBoughtTogetherIds`.

### 3. Banners (replace `banners`; shape `id,title,subtitle,cta,link,gradient`)
4 hero slides using brand gradients and real category links, e.g.:
```json
{ "id": 1, "title": "The Bridal Edit", "subtitle": "Heirloom silks for the big day",
  "cta": "Shop Bridal", "link": "/products?category=bridal",
  "gradient": "linear-gradient(135deg,#6D28D9 0%,#9333EA 50%,#DB2777 100%)" }
```
Others: a Banarasi feature (green→teal `linear-gradient(90deg,#0B3B2E,#12B886)`), a Festive Sale
(orange `linear-gradient(90deg,#F59E0B,#F97316)`), a New Arrivals (pink→purple
`linear-gradient(90deg,#EC4899,#8B5CF6)`), each linking to a valid `/products?category=…` route.

### 4. Coupons (replace `coupons`; shape incl. `type,value,minOrderAmount,maxDiscount,usageLimit,usedCount,perUserLimit,isActive,expiresAt`)
6 brand coupons, all `isActive: true`, `expiresAt` in 2027, `usedCount` < `usageLimit`:
`SILK500` (fixed 500, min 2000, maxDiscount 500) · `FESTIVE15` (percentage 15, min 5000, maxDiscount
3000) · `BRIDAL10` (percentage 10, min 20000, maxDiscount 5000) · `WELCOME1000` (fixed 1000, min 5000,
perUserLimit 1) · `MEGHALI20` (percentage 20, min 10000, maxDiscount 6000) · `NEWSILK750` (fixed 750,
min 3000). Codes uppercase/trimmed (checkout `validate()` checks isActive/expiresAt/usageLimit/
minOrderAmount).

### 5. Reviews (replace `reviews`; only `status:"approved"` show on the storefront)
8–12 reviews, shape `id,productId,userId,userName,rating,title,body,status,isVerifiedPurchase,
helpfulCount,createdAt,updatedAt` (optional `photos:[]`). Spread across popular ids (e.g. 1,2,3,4,6,9,
15,17,19,23,26); mostly `status:"approved"`, `isVerifiedPurchase:true`, ratings 4–5, authentic
silk-buyer wording; 1–2 with a `photos` URL. `productId`/`userId` must reference real rows (users 1–3
exist). Each product's seeded approved-review count must be ≤ its `totalReviews`.

### 6. Shipping methods (keep `shipping_methods` shape; copy only)
Keep the 4 methods; brand the `name`/`description`/`carrier` and **keep Standard `flatRate: 99`,
`freeAbove: 999`** (matches `FREE_SHIPPING_THRESHOLD = 999`). Keep `isActive`, `estimatedDays`, `rateType`.

### 7. Settings (repopulate `settings.store` / `.social` / `.seo`; keep other sections' keys)
`store`: `name:"Meghali's Silk"`, brand `tagline`, `email:"hello@meghalisilk.com"`, `phone`, a Kolkata
`address` (e.g. "Galleria Producer Company Limited, … Kolkata, West Bengal 700001"), `currency:"INR"`,
`currencySymbol:"₹"`, `timezone:"Asia/Kolkata"`, **`taxRate: 5`** (silk/apparel GST), `taxIncluded:false`.
`social`: real-looking handles (`facebook`/`instagram`/`twitter`/`youtube`/`whatsapp`). `seo`: brand
`metaTitle`/`metaDescription`. Do NOT remove `shipping`/`payment`/`notifications` keys.

### 8. dealsConfig (update id references to REAL discounted products/coupons)
Keep shape `{enabled,hero,timer,featuredCouponIds,dealOfTheDayIds,featuredProductIds,updatedAt}`.
`enabled:true`; brand `hero` copy ("Festive Silk Edit" etc.); `featuredCouponIds` → 2 real coupon ids;
`dealOfTheDayIds` → 3 product ids that have a genuine `comparePrice` discount (e.g. 1, 6, 23);
`featuredProductIds` → 3 `featured` product ids (e.g. 2, 4, 17). Every referenced id must exist.

### 9. Integrity sweep on seed transactional rows
In existing `orders` / `wishlist` / `payments`, update any `items[].productId` / `items[].name` /
`productId` that pointed at removed demo products so they reference valid silk products (1–33) with
matching names — **without** changing those collections' shapes, ids, totals structure, or keys. This
keeps Order History, the admin, and the wishlist coherent.

## Data / API Notes
- This prompt touches **only `db.json`**. The storefront reads it through `apiService`
  (`products.getAll/getBySlug/getFeatured/getTrending/getByCategory/search/getReviews/getRelated/
  getFrequentlyBoughtTogether`, `categories.getAll`, `banners.getAll`, `coupons.getActive/validate`,
  `shipping.getMethods`, `settings.get`, `deals.getConfig`) — do not call the API or change it here.
- `apiService.categories.getAll` returns only `isActive` categories sorted by `sortOrder`; `getReviews`
  filters to `status:"approved"`; `getFeatured`/`getTrending` read the `featured`/`trending` flags.
- Preserve camelCase keys, numeric top-level ids, string variant ids (`"v1"`), INR-integer money and ISO
  `…Z` timestamps exactly as the existing rows use them.

## Constraints (Do Not Break)
- Use the **exact existing JSON schema shapes** — same key names, id conventions, money as INR integers,
  ISO `…Z` dates. Do not add or rename collections/keys.
- Preserve **referential integrity**: every `product.categoryId`, `relatedProductIds`,
  `frequentlyBoughtTogetherIds`, `review.productId`/`userId`, and `dealsConfig` id must resolve.
- Keep everything **API-driven & functional** — after seeding, browse/search/PDP/cart/checkout/wishlist/
  coupons/reviews/deals must all still work with the new data.
- Preserve the **JSON Server ↔ Laravel swap contract**: no changes to `src/services/api.js`; the data
  shapes must remain what a Laravel backend would return.
- **Do not modify the admin panel**, theme, or any component/page code in this prompt — `db.json` only.
- **Authenticity > persuasion**: ratings/review counts plausible and consistent; discounts real
  (`comparePrice > price`); no fabricated stock/urgency. `dealOfTheDayIds` only point at genuinely
  discounted products.
- Run **this prompt OR the granular 03–06 sequence — not both** (they produce the same dataset).

## Acceptance Criteria / Definition of Done
- [ ] `db.json` parses as valid JSON; `npm run server` starts and `GET http://localhost:3001/products`
      returns ~33 silk products (no laptops/earbuds remain), `GET /categories` returns the 13 rows above.
- [ ] Every `product.categoryId` resolves to a category id (1–13); every `relatedProductIds` /
      `frequentlyBoughtTogetherIds` / `review.productId` / `dealsConfig` id resolves to an existing row.
- [ ] `apiService.products.getFeatured` / `getTrending` return silk products; PDPs show approved reviews,
      real variant swatches, and genuine "You save ₹X" where `comparePrice > price`.
- [ ] `GET /coupons` returns the 6 brand coupons (active, unexpired); `SILK500` etc. validate at the cart.
- [ ] `GET /settings` shows Meghali's Silk / Kolkata / INR / taxRate 5; `GET /dealsConfig` references only
      real discounted products + real coupons.
- [ ] Storefront browses end-to-end (home rails, listing by category, search, PDP, add-to-cart, checkout
      with a coupon) with the new data and no console errors.

## Verification Steps
1. `npm run dev` (CRA + JSON Server). Confirm JSON Server loaded `db.json` without a parse error.
2. Hit `http://localhost:3001/products`, `/categories`, `/coupons`, `/settings`, `/dealsConfig` and spot-
   check shapes/ids; try `/products?categoryId=7` and `/products?slug=royal-banarasi-silk-saree`.
3. In the app: open Home (Featured/Trending/Deals show silk), a category listing, a PDP (variants,
   reviews, related, FBT, "You save ₹X"), add to cart, apply `SILK500` at checkout, and place a test order.
4. Open `/admin` → Products/Categories/Coupons/Reviews and confirm the silk data renders and the admin
   still works (only data changed).
5. `npm run build` → clean build.
