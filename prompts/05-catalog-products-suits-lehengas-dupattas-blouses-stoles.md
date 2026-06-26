<!-- Batch B — Catalog Data -->
# Prompt 05 — Catalog Products: Suits, Lehengas, Dupattas, Stoles & Blouses

## Objective
Add **15 non-saree silk products (ids 19–33)** to the `db.json` `products` array — across Suits &
Salwar, Lehengas, Dupattas & Stoles, and Blouses — to round out the *Meghali's Silk* catalogue to ~33
products. Each gets the full product shape (multiple portrait images, Fabric/Color/Size variants with
`swatchHex`, tags, INR `price` + `comparePrice`, plausible `rating`/`totalReviews`, flags, SEO meta) and
**cross-linked `relatedProductIds`/`frequentlyBoughtTogetherIds` referencing the existing silk sarees
(ids 1–18) and these new products** — all while **preserving the exact product JSON shape, numeric ids,
INR-integer money, ISO `…Z` dates, and referential integrity.** Ids 19–33 continue from the sarees'
last id (18) with no collisions.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house from
Bengal/Kolkata — a National Handloom Award winner selling authentic women's silk apparel. Descriptions
must read premium and **honest** (the storefront's "authenticity > persuasion" rule forbids fabricated
hype): reference silk craft, Kolkata/Bengal/India weaving, artisans, and the specific fabric. Pricing is
**₹ INR integers** only.

Ethnic apparel photography is tall (portrait, ~3:4); use 3+ images per product. Use the brand
placeholder pattern with brand colors (deep green `0B3B2E`, gold `CBA35A`) at portrait size:
`https://placehold.co/600x800/0B3B2E/CBA35A?text=...` (e.g. `?text=Silk+Suit`, `?text=Dupatta`,
`?text=Lehenga`). You may instead use stable royalty-free Unsplash/Pexels **direct** image URLs of silk
ethnic wear — keep 3+ working URLs per product, portrait-friendly.

This prompt is **data only**; it renders no UI. It must populate the fields the product card, listing,
PDP, deals, and cross-sell rails read so those surfaces show real data.

## Scope — Files to Create / Modify
- (MODIFY) `db.json` — **append 15 product objects with ids 19–33** to the existing `products` array
  (which already contains the silk sarees ids 1–18). Do not modify or renumber the saree entries.
- **OUT of scope:** the saree products (ids 1–18 — do not edit; you may only be referenced by them via
  cross-links), the `categories` array (fixed taxonomy this prompt references — do not edit), every
  other `db.json` collection (`banners`, `coupons`, `reviews`, `shipping_methods`, `settings`,
  `dealsConfig`, `users`, `orders`, etc.), all `src/` application code, `src/services/api.js`, theme/
  token files, and the admin panel. Do not add/remove top-level `db.json` keys.

## Detailed Requirements

### Category id contract (restated — non-saree categories)
Products reference categories by numeric `categoryId`. The fixed non-saree category ids are:
- `2` Suits & Salwar · `3` Lehengas · `4` Dupattas & Stoles · `5` Blouses · `6` Bridal (for explicitly
  bridal lehengas/sets).

Every product in this prompt MUST have `categoryId` ∈ `{2, 3, 4, 5, 6}`. (Sarees use ids 1, 6, 7–13 and
are handled separately — do not create sarees here.)

### Saree ids available to cross-link (restated)
The catalogue already contains silk sarees at ids **1–18** (Banarasi 1–3, Tussar 4–6, Kanjivaram 7–9,
Mulberry 10–11, Eri 12–13, Muga 14–15, Baluchari 16–17, Bengal/Jamdani 18). Use these ids when
cross-linking a blouse/dupatta/stole back to a complementary saree.

### Full product shape (preserve every key, camelCase, types)
Each product object MUST keep the exact product shape used across the catalogue (numbers as numbers, INR
integers for money, ISO `…Z` dates, variant ids as **strings**). Worked example to match in depth:
```json
{
  "id": 19,
  "name": "Pure Silk Unstitched Suit Set — Wine Floral",
  "slug": "pure-silk-unstitched-suit-set-wine-floral",
  "sku": "SUT-SLK-019",
  "shortDescription": "Three-piece pure silk suit set with a printed dupatta — unstitched, ready to tailor.",
  "description": "A three-piece silk suit set in a deep wine tone with a delicate floral print, woven and finished in our Kolkata atelier. Includes top fabric, matching bottom and a soft silk dupatta. Unstitched so you can tailor it to your fit. Dry clean recommended for lasting sheen.",
  "categoryId": 2,
  "brand": "Meghali's Silk",
  "images": [
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Silk+Suit",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Dupatta",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Fabric+Detail"
  ],
  "price": 4200,
  "comparePrice": 5800,
  "costPrice": 2600,
  "stock": 40,
  "lowStockThreshold": 8,
  "weight": 0.6,
  "dimensions": { "length": 32, "width": 24, "height": 5 },
  "variants": [
    { "id": "v1", "name": "Wine / Free Size", "price": 4200, "stock": 14, "sku": "SUT-SLK-019-WIN-FS",
      "attributes": { "Fabric": "Mulberry Silk", "Color": "Wine", "Size": "Free Size" }, "swatchHex": "#6E1A2C" },
    { "id": "v2", "name": "Teal / Free Size", "price": 4200, "stock": 14, "sku": "SUT-SLK-019-TEA-FS",
      "attributes": { "Fabric": "Mulberry Silk", "Color": "Teal", "Size": "Free Size" }, "swatchHex": "#0E6B6B" }
  ],
  "tags": ["suit", "salwar", "silk", "unstitched", "festive"],
  "featured": true,
  "trending": false,
  "hot": false,
  "isActive": true,
  "rating": 4.4,
  "totalReviews": 27,
  "metaTitle": "Pure Silk Unstitched Suit Set — Wine Floral | Meghali's Silk",
  "metaDescription": "Three-piece pure silk suit set with printed dupatta, unstitched. Authentic silk from Meghali's Silk.",
  "createdAt": "2025-04-05T00:00:00.000Z",
  "updatedAt": "2025-06-10T00:00:00.000Z",
  "frequentlyBoughtTogetherIds": [25],
  "relatedProductIds": [20, 21, 26]
}
```
Rules for every product:
1. **`id`** numeric, sequential **19–33**, no gaps, no duplicates, **continuing from the sarees' last id
   (18)** — verify no id collides with an existing product (1–18). **`slug`** unique kebab.
   **`brand`** = `"Meghali's Silk"` for all.
2. **`sku`** top-level uses a category prefix: `SUT-` suits, `LEH-` lehengas, `DUP-` dupattas, `STO-`
   stoles, `BLO-` blouses — e.g. `LEH-SLK-022`. Variant SKUs append colour/size suffixes
   (e.g. `BLO-SLK-030-RED-M`).
3. **`images`**: 3+ portrait URLs per product, visibly distinct `?text=` labels (or real direct photo
   URLs).
4. **`variants`**: 2–4 variants. **Suits and blouses MUST include a `"Size"` attribute** with values
   from `Free Size` / `S` / `M` / `L` (a suit may be `Free Size`; a blouse should offer `S`/`M`/`L`).
   All variants include a `"Fabric"` attribute (the silk type) and a `"Color"` attribute with a real
   `swatchHex`. Dupattas/stoles typically vary by `Color` only (Size optional). Variant `price`/`stock`/
   `sku` required; variant `id` is a **string**.
5. **Money** (`price`, `comparePrice`, `costPrice`, variant `price`): **INR integers** only. Price bands
   by category — **suits ₹2,500–₹12,000; lehengas ₹8,000–₹45,000; dupattas/stoles ₹900–₹5,000; blouses
   ₹800–₹3,500.** Always set `comparePrice > price` (genuine discount) and `costPrice < price`.
6. **`stock`** positive integer; set `lowStockThreshold`; variant stock sums ≈ top-level `stock`.
7. **`tags`**: lowercase; include the garment type (`"suit"`/`"lehenga"`/`"dupatta"`/`"stole"`/
   `"blouse"`), `"silk"`, and occasion/attribute tags (`"festive"`, `"wedding"`, `"bridal"`,
   `"handloom"`, `"bestseller"`). Use `"bestseller"` on top sellers; vary `createdAt` for "New Arrivals".
8. **Flags**: set `featured`/`trending`/`hot` per the table; `isActive: true` for all; keep counts
   plausible.
9. **`rating`/`totalReviews`**: plausible for a premium silk house — `rating` **4.2–4.9** (one decimal),
   `totalReviews` **0–~120**. Authenticity rule: any product that receives seeded `reviews` elsewhere
   must have `totalReviews` ≥ its approved-review count and a believable `rating`. New arrivals may have
   `totalReviews: 0`.
10. **`metaTitle`/`metaDescription`**: set both, brand-suffixed (`… | Meghali's Silk`), honest,
    description ≤ ~160 chars.
11. **`createdAt`/`updatedAt`**: ISO `…Z`; vary `createdAt` across 2025–2026; `updatedAt ≥ createdAt`.
12. **`dimensions`/`weight`**: realistic for the garment (lighter for dupattas/stoles/blouses; heavier
    for a worked lehenga). `weight` may be non-integer kg.
13. **Cross-links**: `relatedProductIds` (3–5 ids) and `frequentlyBoughtTogetherIds` (1–3 ids) must
    reference **valid product ids in 1–33** that are not the product's own id. Reference both other
    non-saree items (19–33) and complementary sarees (1–18) — e.g. a blouse FBT → a matching saree; a
    lehenga related → other lehengas; a dupatta FBT → a suit or saree. Curated order matters.

### Two fully-worked examples
- **Example A — id 19 (Suit):** use the id-19 object above (3-piece silk suit, `categoryId: 2`, `SUT-`
  SKU, `Size: Free Size`, two colour variants with `swatchHex`).
- **Example B — id 22 (Lehenga):**
```json
{
  "id": 22,
  "name": "Bridal Silk Lehenga — Crimson Zardozi",
  "slug": "bridal-silk-lehenga-crimson-zardozi",
  "sku": "LEH-SLK-022",
  "shortDescription": "Hand-embroidered silk bridal lehenga in crimson with zardozi and a matching dupatta.",
  "description": "A statement bridal lehenga in pure silk, hand-embroidered with zardozi and resham across the flared skirt and blouse, finished with a scalloped silk dupatta. Crafted over weeks by our karigars. Semi-stitched blouse with adjustable margins. Professional dry clean only.",
  "categoryId": 6,
  "brand": "Meghali's Silk",
  "images": [
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Bridal+Lehenga",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Zardozi",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Dupatta",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Skirt+Flare"
  ],
  "price": 38500,
  "comparePrice": 47000,
  "costPrice": 24000,
  "stock": 12,
  "lowStockThreshold": 3,
  "weight": 2.4,
  "dimensions": { "length": 40, "width": 32, "height": 10 },
  "variants": [
    { "id": "v1", "name": "Crimson / M", "price": 38500, "stock": 4, "sku": "LEH-SLK-022-CRM-M",
      "attributes": { "Fabric": "Pure Silk", "Color": "Crimson", "Size": "M" }, "swatchHex": "#9B1B2E" },
    { "id": "v2", "name": "Crimson / L", "price": 38500, "stock": 4, "sku": "LEH-SLK-022-CRM-L",
      "attributes": { "Fabric": "Pure Silk", "Color": "Crimson", "Size": "L" }, "swatchHex": "#9B1B2E" },
    { "id": "v3", "name": "Maroon / M", "price": 39500, "stock": 4, "sku": "LEH-SLK-022-MRN-M",
      "attributes": { "Fabric": "Pure Silk", "Color": "Maroon", "Size": "M" }, "swatchHex": "#5C1320" }
  ],
  "tags": ["lehenga", "bridal", "silk", "wedding", "zardozi", "handwork"],
  "featured": true,
  "trending": true,
  "hot": true,
  "isActive": true,
  "rating": 4.8,
  "totalReviews": 19,
  "metaTitle": "Bridal Silk Lehenga — Crimson Zardozi | Meghali's Silk",
  "metaDescription": "Hand-embroidered pure silk bridal lehenga with zardozi and matching dupatta. Meghali's Silk.",
  "createdAt": "2025-05-20T00:00:00.000Z",
  "updatedAt": "2025-06-15T00:00:00.000Z",
  "frequentlyBoughtTogetherIds": [25, 30],
  "relatedProductIds": [23, 24, 8]
}
```

### Completion table — create these as the remaining products (ids deterministic)
Build every row to the same depth as the examples (full description, 3+ images, 2–4 variants with
`swatchHex` and the required `Size` attribute where noted, tags, meta, dates, cross-links). Prices are
guidance within each band; set `comparePrice` ~15–35% above `price`.

| id | name | slug | categoryId | SKU prefix | price | comparePrice | variants / sizes | featured | trending | hot |
|----|------|------|-----------|-----------|-------|--------------|-------------------|----------|----------|-----|
| 19 | Pure Silk Unstitched Suit Set — Wine Floral | `pure-silk-unstitched-suit-set-wine-floral` | 2 | SUT-SLK | 4200 | 5800 | Wine/Teal · Free Size | true | false | false |
| 20 | Silk Salwar Kameez — Mustard Chikankari | `silk-salwar-kameez-mustard-chikankari` | 2 | SUT-SLK | 6500 | 8500 | Mustard/Sky · S/M/L | false | true | false |
| 21 | Tussar Silk Suit Set — Ivory Print | `tussar-silk-suit-set-ivory-print` | 2 | SUT-TUS | 5400 | 7200 | Ivory/Rust · Free Size | false | false | true |
| 22 | Bridal Silk Lehenga — Crimson Zardozi | `bridal-silk-lehenga-crimson-zardozi` | 6 | LEH-SLK | 38500 | 47000 | Crimson/Maroon · M/L | true | true | true |
| 23 | Banarasi Silk Lehenga — Rani Pink | `banarasi-silk-lehenga-rani-pink` | 3 | LEH-BAN | 24500 | 31000 | Rani Pink/Red · M/L | true | false | false |
| 24 | Silk Lehenga — Emerald Resham | `silk-lehenga-emerald-resham` | 3 | LEH-SLK | 18900 | 24500 | Emerald/Navy · S/M/L | false | true | false |
| 25 | Pure Silk Dupatta — Gold Zari Border | `pure-silk-dupatta-gold-zari-border` | 4 | DUP-SLK | 1900 | 2800 | Red/Ivory/Black · — | true | true | false |
| 26 | Banarasi Silk Dupatta — Peacock Blue | `banarasi-silk-dupatta-peacock-blue` | 4 | DUP-BAN | 2400 | 3400 | Peacock Blue/Wine · — | false | false | false |
| 27 | Tussar Silk Dupatta — Hand Block | `tussar-silk-dupatta-hand-block` | 4 | DUP-TUS | 1500 | 2200 | Ochre/Indigo · — | false | false | true |
| 28 | Eri Silk Stole — Earthy Natural | `eri-silk-stole-earthy-natural` | 4 | STO-ERI | 1200 | 1800 | Beige/Charcoal · — | false | true | false |
| 29 | Mulberry Silk Stole — Pastel Set | `mulberry-silk-stole-pastel-set` | 4 | STO-MUL | 990 | 1500 | Mint/Lavender/Peach · — | false | false | false |
| 30 | Ready Silk Blouse — Gold Brocade | `ready-silk-blouse-gold-brocade` | 5 | BLO-SLK | 1600 | 2400 | Gold/Maroon · S/M/L | true | false | false |
| 31 | Kanjivaram Silk Blouse — Contrast Border | `kanjivaram-silk-blouse-contrast-border` | 5 | BLO-KAN | 1900 | 2800 | Mustard/Green · S/M/L | false | true | false |
| 32 | Designer Silk Blouse — Embroidered Black | `designer-silk-blouse-embroidered-black` | 5 | BLO-SLK | 2200 | 3200 | Black/Wine · S/M/L | false | false | true |
| 33 | Plain Silk Blouse — Basics Set | `plain-silk-blouse-basics-set` | 5 | BLO-SLK | 850 | 1300 | Red/Black/Cream · S/M/L | false | false | false |

(Adjust names/colours for authenticity if needed, but keep ids, slugs, categoryIds, and SKU prefixes as
above so the data is deterministic and cross-links resolve.)

### Cross-link guidance
- **Blouses (30–33)** → `frequentlyBoughtTogetherIds` should point at a matching **saree (1–18)** (e.g.
  the Kanjivaram blouse 31 → Kanjivaram saree 7); `relatedProductIds` → other blouses.
- **Dupattas/stoles (25–29)** → FBT a complementary **suit (19–21)** or **saree (1–18)**; related →
  other dupattas/stoles.
- **Suits (19–21)** → FBT a **dupatta (25–27)**; related → other suits.
- **Lehengas (22–24)** → FBT a **blouse (30) or dupatta (25)**; related → other lehengas and a bridal
  saree (e.g. 8). Keep all referenced ids within 1–33, never the product's own id, ≤ 3 FBT entries.

## Data / API Notes
- Storefront reads: `apiService.products.getAll(params)`, `getById`, `getBySlug`, `getFeatured(limit)`
  (mock: `GET /products?featured=true`), `getTrending(limit)` (`GET /products?trending=true`),
  `getByCategory(categoryId)` (`GET /products?categoryId=<id>`), `search(q)`, `getReviews(productId)`,
  `getRelated(product)` and `getFrequentlyBoughtTogether(product)` (resolved from the live catalogue,
  honouring curated id arrays then same-category/shared-tags top-up; inactive/self filtered out).
- Set `featured`/`trending` honestly so those rails return a mix of silk products. Every id in
  `relatedProductIds`/`frequentlyBoughtTogetherIds` MUST resolve to a real, `isActive` product in 1–33.
- **Do not change `src/services/api.js`** or any contract. The mock JSON Server and a future Laravel API
  serve the same product shape; keep camelCase keys, numeric top-level ids, **string** variant ids, INR
  integers, ISO `…Z` dates — so flipping `REACT_APP_API_URL`/`REACT_APP_USE_MOCK_API` needs no code
  change.
- Referential integrity: every `categoryId` ∈ `{2, 3, 4, 5, 6}`, all of which exist in the categories
  taxonomy; cross-links resolve within the seeded catalogue (1–33).

## Constraints (Do Not Break)
- This prompt changes **only `db.json`** (appends products ids 19–33). It must NOT modify any component,
  theme, token, or `src/` file, and must NOT call into or alter `apiService`.
- Preserve **all JSON shapes / key names / id conventions / camelCase / INR-integer money / ISO `…Z`
  dates** and referential integrity (`product.categoryId`, `relatedProductIds`,
  `frequentlyBoughtTogetherIds`). Variant `id` values stay **strings**; money stays integer rupees.
- Honour the **"authenticity > persuasion"** rule: ratings/`totalReviews` must be plausible and
  consistent with reviews seeded elsewhere; no fabricated/absurd numbers.
- Keep the **JSON Server ↔ Laravel swap contract** intact — the product response shape must not change.
- Do **not** touch the admin panel, the saree products (ids 1–18), the `categories` array, or any other
  `db.json` collection. Do not add/remove top-level `db.json` keys. Continue ids from 18 with no
  collisions.
- Product ids 19–33 are a cross-prompt contract for cross-links — do not renumber them.

## Acceptance Criteria / Definition of Done
- [ ] `db.json` is valid JSON; the `products` array now contains the silk sarees (ids 1–18) **plus** 15
      new products with ids 19–33 (sequential, unique, no collisions), each with the full product shape.
- [ ] Categories represented: Suits & Salwar (`2`), Lehengas (`3`), Dupattas & Stoles (`4`), Blouses
      (`5`), and at least one Bridal (`6`); every new product's `categoryId` ∈ `{2, 3, 4, 5, 6}`.
- [ ] Suits and blouses include a `"Size"` attribute (Free Size / S / M / L); every variant has a
      `Fabric` + `Color` attribute and a `swatchHex`; variant ids are strings.
- [ ] All money fields are INR integers with `comparePrice > price` and `costPrice < price`, within the
      per-category price bands (suits 2,500–12,000; lehengas 8,000–45,000; dupattas/stoles 900–5,000;
      blouses 800–3,500).
- [ ] `rating` (4.2–4.9) and `totalReviews` (0–~120) are plausible; flags are realistic.
- [ ] Every `relatedProductIds`/`frequentlyBoughtTogetherIds` id is within 1–33, not the product's own
      id, and resolves to a real product (cross-links span sarees 1–18 and new items 19–33).
- [ ] `npm run server` starts and `GET http://localhost:3001/products?categoryId=3` returns the lehengas;
      `GET http://localhost:3001/products` returns the full ~33-product silk catalogue.
- [ ] The saree entries (ids 1–18) and all non-product collections are unchanged.

## Verification Steps
1. From the project root run `npm run dev` (CRA + JSON Server on :3001), or `npm run server` for API-only
   checks.
2. `GET http://localhost:3001/products` → confirm ~33 products total, ids 1–33 contiguous.
3. `GET "http://localhost:3001/products?categoryId=2"` (suits), `?categoryId=3` (lehengas),
   `?categoryId=4` (dupattas/stoles), `?categoryId=5` (blouses) → each returns the expected items.
4. `GET "http://localhost:3001/products?slug=bridal-silk-lehenga-crimson-zardozi"` → returns exactly id
   22.
5. Validate JSON: `node -e "JSON.parse(require('fs').readFileSync('db.json','utf8'))"` exits cleanly.
6. Open the storefront `http://localhost:3001/products`; filter by a non-saree category. Open a lehenga
   and a blouse PDP; confirm gallery, variant Fabric/Color/Size swatches, price + struck compare price,
   and that "Frequently Bought Together" pairs the blouse with a real saree (and the lehenga with a
   blouse/dupatta) — all with no console errors. Toggle theme to confirm both modes render.
