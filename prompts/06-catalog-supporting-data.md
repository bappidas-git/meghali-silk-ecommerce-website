<!-- Batch B — Catalog Data -->
# Prompt 06 — Catalog Supporting Data (Banners, Coupons, Shipping, Reviews, Settings, Deals)

## Objective
Repopulate the remaining storefront **content** collections in `db.json` so they reflect *Meghali's
Silk* and reference the real silk catalogue — **banners** (brand-gradient hero slides), **coupons**
(silk-appropriate codes), **shipping_methods** (copy only; keep the rate numbers), **reviews**
(authentic, mostly `approved`, some with photos, pointing at real product/user rows),
**settings.store/social/seo** (Meghali's Silk, Kolkata, INR, GST 5%), and **dealsConfig** (enabled, hero
copy, and id arrays pointing at REAL silk product/coupon ids with genuine discounts). Also fix any seed
`orders`/`wishlist`/`payments` product references for coherence **without changing those collections'
shapes**. All edits **preserve exact JSON shapes, key names, INR-integer money, ISO `…Z` dates, and
referential integrity.**

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house from
Bengal/Kolkata — a National Handloom Award winner selling authentic women's silk apparel. Pricing is **₹
INR integers**; GST on silk apparel is **5%**. Copy is premium, heritage-rooted, and honest — the
storefront's **"authenticity > persuasion"** rule forbids fabricated reviews/urgency/social proof, so
every seeded review must read like a real customer and every deal must reflect a real `comparePrice`
discount.

Banner gradients use the brand's announcement/heritage palette:
- green→teal `linear-gradient(135deg,#0B3B2E 0%,#12B886 100%)`
- pink→purple `linear-gradient(135deg,#EC4899 0%,#8B5CF6 100%)`
- orange `linear-gradient(135deg,#F59E0B 0%,#F97316 100%)`
- heritage purple/magenta `linear-gradient(135deg,#6D28D9 0%,#9333EA 50%,#DB2777 100%)`

Review/UGC photo URLs may use the brand placeholder pattern (`https://placehold.co/300x300/0B3B2E/CBA35A?text=...`)
or stable royalty-free direct image URLs.

This prompt is **data only**; it renders no UI.

## Scope — Files to Create / Modify
- (MODIFY) `db.json` — replace/repopulate: `banners`, `coupons`, `shipping_methods` (copy only),
  `reviews`, `settings.store`, `settings.social`, `settings.seo`, and `dealsConfig`. Make minimal,
  integrity-only edits to product **references** inside `orders[].items`, `wishlist[]`, and
  `payments[]` so they point at real silk products (see "Integrity fixes" below) — **without changing
  those collections' shapes**.
- **OUT of scope:** `categories` and `products` (the taxonomy and catalogue are fixed by their own
  prompts — do not edit them here, only reference their ids), `users`/`admins`/`returns`/`refunds`/
  `walletTransactions`/`cart`/`leads` structure, `settings.shipping`/`settings.payment`/
  `settings.notifications` keys, all `src/` application code, `src/services/api.js`, theme/token files,
  and the admin panel. Do not add/remove top-level `db.json` keys.

### Catalogue id contract (restated — for references)
The seeded silk catalogue (from the catalogue prompts) is:
- **Categories:** `1` Sarees, `2` Suits & Salwar, `3` Lehengas, `4` Dupattas & Stoles, `5` Blouses, `6`
  Bridal; saree weave children `7` Banarasi, `8` Kanjivaram, `9` Tussar, `10` Mulberry, `11` Eri, `12`
  Muga, `13` Baluchari. Banner category links use category **slugs**: `sarees`, `suits-salwar`,
  `lehengas`, `dupattas-stoles`, `blouses`, `bridal`.
- **Products:** silk sarees ids **1–18**; non-saree silk products ids **19–33** (suits 19–21, lehengas
  22–24, dupattas/stoles 25–29, blouses 30–33; bridal lehenga 22). All product ids referenced below
  (reviews, dealsConfig, integrity fixes) MUST be in **1–33** and exist in `products`.
- **Users** for review authorship: ids `1` (John D.), `2` (Jane / "Priya M." display ok), `3` (Bappi
  Das). Use these real user ids, or `userId: null` for admin-authored reviews (`"source": "admin"`).

## Detailed Requirements

### 1. `banners` (3–5 hero slides) — preserve shape
Each banner keeps exactly: `id`, `title`, `subtitle`, `cta`, `link`, `gradient`. Links point at real
category slugs via `/products?category=<slug>` (or `/special-offers`). Use brand gradients. Example:
```json
{ "id": 1, "title": "The Bridal Silk Edit", "subtitle": "Heirloom Kanjivaram & Banarasi for the big day",
  "cta": "Shop Bridal", "link": "/products?category=bridal",
  "gradient": "linear-gradient(135deg,#6D28D9 0%,#9333EA 50%,#DB2777 100%)" }
```
Write 3–5 banners covering: a bridal/heritage slide (purple/magenta), a sarees slide (green→teal), a
festive/offers slide (orange) linking to `/special-offers`, and optionally a new-arrivals slide
(pink→purple). Replace the demo electronics/clothing banners entirely. Keep `id`s sequential from 1.

### 2. `coupons` (5–6 codes) — preserve shape; keep valid & not expired
Each coupon keeps exactly: `id`, `code`, `description`, `type` (`"fixed"`|`"percentage"`),
`value`, `minOrderAmount`, `maxDiscount`, `usageLimit`, `usedCount`, `perUserLimit`, `isActive`,
`expiresAt`, `createdAt`, `updatedAt`. The validator checks `isActive`, `expiresAt` (must be in the
future), `usageLimit` vs `usedCount`, and `minOrderAmount` — so keep advertised coupons **valid and not
expired**. Money is INR integers; `expiresAt` is ISO `…Z` and **in 2026 or later** (today is 2026-06-26,
so use late-2026/2027 expiries). For percentage coupons set a sensible `maxDiscount` cap; for fixed
coupons `maxDiscount` typically equals `value`. Keep `usedCount < usageLimit` (when `usageLimit` is set)
so they still redeem.

Write these (codes silk-appropriate; ids sequential from 1):
| id | code | type | value | minOrderAmount | maxDiscount | usageLimit | usedCount | perUserLimit | isActive | expiresAt |
|----|------|------|-------|----------------|-------------|------------|-----------|--------------|----------|-----------|
| 1 | `SILK500` | fixed | 500 | 2000 | 500 | 1000 | 0 | 1 | true | `2027-03-31T23:59:59.000Z` |
| 2 | `FESTIVE15` | percentage | 15 | 3000 | 3000 | null | 0 | null | true | `2026-12-31T23:59:59.000Z` |
| 3 | `BRIDAL10` | percentage | 10 | 15000 | 5000 | 500 | 0 | 1 | true | `2027-06-30T23:59:59.000Z` |
| 4 | `WELCOME1000` | fixed | 1000 | 5000 | 1000 | null | 0 | 1 | true | `2027-12-31T23:59:59.000Z` |
| 5 | `FREESHIP` | fixed | 99 | 999 | 99 | null | 0 | null | true | `2027-12-31T23:59:59.000Z` |
| 6 | `MEGHALI20` | percentage | 20 | 8000 | 6000 | 300 | 0 | 1 | true | `2026-12-31T23:59:59.000Z` |
(`FREESHIP` as a ₹99 fixed coupon offsets the ₹99 flat shipping; describe it as "Free standard shipping".
You may keep an inactive/expired historical coupon too, but at least 5 must be active and valid.)
Give each a clear `description`. Set `createdAt`/`updatedAt` to valid ISO `…Z`.

### 3. `shipping_methods` (copy only) — DO NOT change rate numbers
Keep the existing 4 methods and their **`flatRate`/`freeAbove`/`rateType`/`estimatedDays`/`isActive`/
`id`** numbers exactly — in particular the Standard method's **`flatRate: 99` and `freeAbove: 999`**
(this matches `FREE_SHIPPING_THRESHOLD = 999` in the app). You may only refine `name`/`carrier`/
`description` copy for the silk brand (e.g. carrier `"Shiprocket"`, description "Delivered in 5–7
business days, insured silk packaging"). Do not add/remove methods or change which is active.

### 4. `reviews` (8–12) — authentic, mostly `approved`, real refs
Each review keeps exactly: `id`, `productId`, `userId`, `userName`, `rating` (1–5), `title`, `body`,
`status` (`approved`|`pending`|`rejected`), `isVerifiedPurchase`, `helpfulCount`, `createdAt`,
`updatedAt`; optional `photos` (array of URLs) and optional `source: "admin"` (+ `userId: null`) for
admin-authored. Storefront PDPs show **approved only**, so keep most `approved` (a couple `pending`/
`rejected` is fine for realism). Write 8–12 reviews spread across the **popular** products (your
featured/trending sarees, the bridal lehenga, a dupatta/blouse). Requirements:
- `productId` ∈ 1–33 and exists; `userId` ∈ {1, 2, 3} (real users) or `null` for admin-authored.
- Bodies read like genuine silk customers (fabric feel, zari, drape, delivery/packaging, true-to-photo,
  fit for blouses) — honest, varied, not marketing copy.
- 2–3 reviews include `photos` (1–2 URLs each), e.g.
  `["https://placehold.co/300x300/0B3B2E/CBA35A?text=Drape"]`.
- `helpfulCount` modest (0–40). `createdAt`/`updatedAt` ISO `…Z`; `updatedAt ≥ createdAt`.
- **Authenticity/consistency rule:** the number of `approved` reviews per product must be **≤ that
  product's `totalReviews`** and the ratings must be believable against the product's aggregate
  `rating`. Spread several products' reviews so multiple PDPs show social proof; do not pile all reviews
  on one product, and do not contradict the catalogue's `rating`/`totalReviews`. Example:
```json
{ "id": 1, "productId": 1, "userId": 1, "userName": "Priya S.", "rating": 5,
  "title": "Stunning Banarasi, true to the photos",
  "body": "The zari work is even richer in person and the silk has a beautiful weight. Came wrapped in muslin with the blouse piece. Wore it to a wedding and got endless compliments.",
  "status": "approved", "isVerifiedPurchase": true, "helpfulCount": 22,
  "photos": ["https://placehold.co/300x300/0B3B2E/CBA35A?text=Drape"],
  "createdAt": "2026-02-10T09:00:00.000Z", "updatedAt": "2026-02-10T09:00:00.000Z" }
```
Keep `id`s sequential from 1.

### 5. `settings` — repopulate `store`, `social`, `seo` only (keep other sections' keys)
Do not change the keys/structure of `settings.shipping`, `settings.payment`, or
`settings.notifications`. Update:
- **`settings.store`:** `name: "Meghali's Silk"`; a brand `tagline` (e.g. "Heritage handloom silk, woven
  for you"); a brand `email` (e.g. `care@meghalisilk.com`) and `phone`; `address` a real-sounding
  **Kolkata, West Bengal** address (e.g. "Galleria Producer Company Limited, Park Street, Kolkata, West
  Bengal 700016"); keep `currency: "INR"`, `currencySymbol: "₹"`, `timezone: "Asia/Kolkata"`,
  `logo: null`, `favicon: null`; set **`taxRate: 5`** (silk/apparel GST) and keep `taxIncluded: false`.
- **`settings.social`:** plausible brand handles for `facebook`, `instagram`, `twitter`, `youtube`,
  `whatsapp` (e.g. instagram `https://instagram.com/meghalisilk`, whatsapp a phone/wa.me link). Keep all
  five keys.
- **`settings.seo`:** brand `metaTitle` (e.g. "Meghali's Silk — Authentic Handloom Silk Sarees & Ethnic
  Wear") and `metaDescription` (silk-apparel sentence); keep `googleAnalyticsId`/`facebookPixelId` keys
  (may stay empty strings).

### 6. `dealsConfig` — enable, brand hero, REAL ids with genuine discounts
Preserve the exact shape: `enabled`, `hero { tag, title, subtitle }`, `timer { enabled, endAt,
onExpiry }`, `featuredCouponIds`, `dealOfTheDayIds`, `featuredProductIds`, `updatedAt`. Requirements:
- `enabled: true`; brand hero copy (tag e.g. "Festive Silk Sale", a silk title/subtitle).
- `timer`: keep `enabled: true`, `endAt: ""`, `onExpiry: "endOfDay"` (or set `endAt` to a future ISO
  `…Z`).
- **`featuredCouponIds`**: an ordered subset of the **real coupon ids** above (e.g. `[2, 3]` for
  FESTIVE15 + BRIDAL10) — every id must exist in `coupons` and be active/valid.
- **`dealOfTheDayIds`**: ordered **product ids that have a real `comparePrice > price` discount** so the
  deals page shows genuine savings (e.g. `[1, 22, 16]` — a Banarasi saree, the bridal lehenga, a
  Baluchari saree). Every id must exist in `products` and have a true discount.
- **`featuredProductIds`**: ordered real product ids (e.g. `[7, 10, 25]`) that exist and are `isActive`;
  prefer discounted/featured items.
- Set `updatedAt` to a valid ISO `…Z`. Do NOT leave any old demo ids (e.g. 10/12/16 referencing the
  former electronics) unless they now genuinely resolve to silk products with discounts.

### 7. Integrity fixes (minimal, shape-preserving) for orders / wishlist / payments
The seed `orders`, `wishlist`, and `payments` collections currently reference demo product ids/names
(laptops, earbuds). For catalogue coherence, **update only the product *references*** so they point at
real silk products — **without changing the collections' shapes, ids, totals math, or any non-product
fields**:
- **`wishlist[]`**: each row stores a flat product snapshot (`productId`, `slug`, `name`, `image`,
  `brand`, `price`, `comparePrice`, `rating`, `totalReviews`, `shortDescription`, `variants`, `stock`,
  `trending`, `hot`, `addedAt`, `userId`, `id`). Repoint each row's `productId` to a real silk product
  (1–33) and update the snapshot fields (`slug`, `name`, `image`, `brand: "Meghali's Silk"`, `price`,
  `comparePrice`, `variants`, etc.) to match that product. Keep each row's `id`, `userId`, `addedAt`, and
  the overall array shape unchanged.
- **`orders[].items[]`**: each line item has `productId`, `variantId`, `name`, `image`, `sku`, `price`,
  `quantity`, `subtotal`. Repoint `productId` (and `name`/`image`/`sku`/`variantId`) to a real silk
  product/variant. **Keep `price`, `quantity`, and `subtotal = price × quantity` consistent with the
  order's existing `subtotal`/`total`/`taxAmount`/etc.** — i.e. choose silk products/prices that keep the
  order's stored monetary fields internally consistent, OR keep the existing line `price`/`quantity` and
  only swap the descriptive product reference. Do NOT alter order ids, `orderNumber`, statuses,
  addresses, `statusHistory`, or any monetary totals. This is coherence-only; keep it minimal.
- **`payments[]`**: payments reference orders, not products directly — only adjust a product name inside
  a free-text field if one exists; otherwise leave payments untouched. Do not change amounts, statuses,
  `orderId`/`orderNumber` links, or `refunds`/`gatewayResponse`.
- Preserve all cross-link integrity proven by the seed (order↔return↔payment↔refund↔walletTransaction
  chains, `users.storeCredit` = ledger balance). If unsure whether a change breaks totals, prefer the
  conservative option: **keep line prices/quantities and only rename the product reference.**

## Data / API Notes
- Storefront reads: `apiService.banners.getAll()` (`GET /banners`; tolerates empty → falls back to UI
  defaults); `apiService.coupons.getActive(params)` (`GET /coupons?isActive=true`) and
  `apiService.coupons.validate(code, orderAmount)` (mock checks `isActive`, `expiresAt`, `usageLimit` vs
  `usedCount`, `minOrderAmount`); `apiService.reviews` / `apiService.products.getReviews(productId)`
  returns **approved only**; `apiService.shipping.getMethods()` returns **active** methods;
  `apiService.settings.get()` returns public store settings; `apiService.deals.getConfig()` returns
  `dealsConfig`. The Special Offers / deals page resolves `dealOfTheDayIds`/`featuredProductIds` against
  live `products` (and computes savings from `comparePrice − price`) and `featuredCouponIds` against live
  `coupons` — so those ids MUST reference real, discounted/active rows.
- **Do not change `src/services/api.js`** or any contract. The mock JSON Server and a future Laravel API
  serve these same shapes; keep camelCase keys, numeric ids, **string** variant ids, INR integers, ISO
  `…Z` dates, and the `type ∈ {"fixed","percentage"}` coupon enum — so flipping
  `REACT_APP_API_URL`/`REACT_APP_USE_MOCK_API` needs no code change.
- Referential integrity to preserve: review `productId`→`products` and `userId`→`users` (or null);
  `dealsConfig` ids → real `coupons`/`products`; banner `link` slugs → real categories; integrity-fixed
  `orders`/`wishlist` `productId` → real `products`.

## Constraints (Do Not Break)
- This prompt changes **only `db.json`** (the content collections listed plus minimal product-reference
  integrity fixes). It must NOT modify any component, theme, token, or `src/` file, and must NOT call
  into or alter `apiService`.
- Preserve **all JSON shapes / key names / id conventions / camelCase / INR-integer money / ISO `…Z`
  dates** and referential integrity. Coupon `type` stays `"fixed"`|`"percentage"`; advertised coupons
  stay valid and **not expired** (`expiresAt` in 2026+). Keep `shipping_methods` rate numbers (esp.
  `flatRate: 99` / `freeAbove: 999`) unchanged.
- Honour the **"authenticity > persuasion"** rule: reviews read like real customers; deals reflect real
  `comparePrice` discounts; review counts/ratings stay consistent with the catalogue's aggregates.
- Keep the **JSON Server ↔ Laravel swap contract** intact — every response shape unchanged.
- Do **not** touch the admin panel, the `categories` or `products` collections (reference their ids
  only), `settings.shipping`/`settings.payment`/`settings.notifications` keys, or
  `users`/`returns`/`refunds`/`walletTransactions` structure. Do not add/remove top-level `db.json`
  keys. Integrity fixes to `orders`/`wishlist`/`payments` are reference-only and must not change shapes,
  ids, statuses, or monetary totals.

## Acceptance Criteria / Definition of Done
- [ ] `db.json` is valid JSON. `banners` has 3–5 silk slides with brand gradients and `link`s to real
      category slugs / `/special-offers`; no demo electronics/clothing banners remain.
- [ ] `coupons` has ≥ 5 active, non-expired silk codes (e.g. SILK500, FESTIVE15, BRIDAL10, WELCOME1000,
      FREESHIP, MEGHALI20) with valid `type`, INR-integer values, `usedCount < usageLimit` where set, and
      `expiresAt` in 2026+; `apiService.coupons.validate` accepts them for a qualifying order amount.
- [ ] `shipping_methods` keeps its rate numbers (Standard `flatRate: 99`, `freeAbove: 999`); only copy
      changed.
- [ ] `reviews` has 8–12 entries, mostly `approved`, each with `productId` ∈ 1–33 (exists) and `userId`
      ∈ {1,2,3} or null; 2–3 include `photos`; counts/ratings are consistent with product aggregates.
- [ ] `settings.store.name = "Meghali's Silk"`, Kolkata address, `currency: "INR"`, **`taxRate: 5`**;
      `settings.social`/`settings.seo` are brand-appropriate with all keys intact;
      `settings.shipping`/`payment`/`notifications` keys unchanged.
- [ ] `dealsConfig.enabled = true`; `featuredCouponIds` resolve to real active coupons; `dealOfTheDayIds`
      resolve to real products that each have `comparePrice > price` (genuine savings);
      `featuredProductIds` resolve to real `isActive` products. No stale demo ids remain.
- [ ] `orders[].items`, `wishlist[]`, and `payments[]` product references point at real silk products;
      their shapes, ids, statuses, and monetary totals are unchanged.
- [ ] `npm run server` starts; `GET /banners`, `GET /coupons`, `GET /reviews`, `GET /settings`,
      `GET /deals/config` (or `dealsConfig`) all return the silk content; the Special Offers/deals page
      shows real discounts.

## Verification Steps
1. From the project root run `npm run dev` (CRA + JSON Server on :3001).
2. `GET http://localhost:3001/banners` → silk slides with brand gradients and real category links.
3. `GET "http://localhost:3001/coupons?isActive=true"` → the active silk coupons; confirm `expiresAt`
   dates are in the future.
4. `GET http://localhost:3001/reviews` → 8–12 reviews with real `productId`/`userId`; spot-check a couple
   are `status: "approved"` with `photos`.
5. `GET http://localhost:3001/settings` → store name "Meghali's Silk", Kolkata address, `taxRate: 5`,
   brand social/seo; `GET http://localhost:3001/dealsConfig` → enabled with real id arrays.
6. Validate JSON: `node -e "JSON.parse(require('fs').readFileSync('db.json','utf8'))"` exits cleanly.
7. Browse the storefront: home shows the silk hero banners; open `/special-offers` and confirm the
   "Deal of the Day"/featured products show genuine struck-through savings and the featured coupons list;
   apply a coupon (e.g. `FESTIVE15`) at checkout for a qualifying cart and confirm it validates; open a
   popular product's PDP and confirm its reviews (and photos) render. Toggle theme to confirm both modes.
