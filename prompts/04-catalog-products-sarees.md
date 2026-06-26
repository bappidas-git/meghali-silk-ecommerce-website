<!-- Batch B — Catalog Data -->
# Prompt 04 — Catalog Products: Sarees

## Objective
Replace/seed the saree portion of the `db.json` `products` array with **18 realistic handloom silk
saree products** (ids 1–18) for *Meghali's Silk*, each with full fields — multiple portrait images,
fabric/colour variants with `swatchHex`, tags, INR `price` + `comparePrice`, plausible
`rating`/`totalReviews`, `featured`/`trending`/`hot` flags, SEO meta, and cross-linked
`relatedProductIds`/`frequentlyBoughtTogetherIds` — while **preserving the exact product JSON shape, key
names, numeric ids, INR-integer money, and ISO `…Z` dates.** These ids 1–18 are reserved for sarees; a
later prompt adds non-saree products starting at id 19.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house from
Bengal/Kolkata — a National Handloom Award winner selling authentic women's silk apparel. Descriptions
must read premium and **honest** (the storefront's "authenticity > persuasion" rule forbids fabricated
hype): reference handloom craft, Kolkata/Bengal and other Indian weaving clusters, artisans, zari, and
the specific weave. Pricing is **₹ INR integers** only.

Saree photography is tall (portrait, ~3:4). Use multiple angles (3+ images) per product. Use the brand
placeholder pattern with brand colors (deep green `0B3B2E`, gold `CBA35A`) at portrait size:
`https://placehold.co/600x800/0B3B2E/CBA35A?text=...` (e.g. `?text=Banarasi+Silk`, `?text=Pallu`,
`?text=Drape`). You may instead use stable royalty-free Unsplash/Pexels **direct** image URLs of silk
sarees if you prefer real photography — keep 3+ working URLs per product, portrait-friendly.

This prompt is **data only**; it renders no UI. It must, however, populate the fields the product card,
listing, PDP, deals, and cross-sell rails read so those surfaces show real data.

## Scope — Files to Create / Modify
- (MODIFY) `db.json` — set the `products` array so its **first 18 entries (ids 1–18) are the silk
  sarees** specified below. Do not leave any demo/laptop products among ids 1–18.
- **OUT of scope:** the `categories` array (it is the fixed taxonomy this prompt references — do not
  edit it), all non-saree products (ids 19+ are added by another prompt — do not create them here),
  every other `db.json` collection (`banners`, `coupons`, `reviews`, `shipping_methods`, `settings`,
  `dealsConfig`, `users`, `orders`, etc.), all `src/` application code, `src/services/api.js`, theme/
  token files, and the admin panel. Do not add/remove top-level `db.json` keys.

## Detailed Requirements

### Category id contract (restated — saree categories)
Products reference categories by numeric `categoryId`. The fixed saree-related category ids are:
- `1` Sarees (parent — use for cross-weave/mixed-fabric sarees or when no single weave fits)
- `7` Banarasi Silk · `8` Kanjivaram Silk · `9` Tussar Silk · `10` Mulberry Silk · `11` Eri Silk ·
  `12` Muga Silk · `13` Baluchari Silk (saree weave sub-categories, all children of `1`)

Bridal sarees may use `categoryId: 6` (Bridal) **or** keep their weave child id and add a `"bridal"`
tag — prefer the weave child id + `"bridal"` tag so the saree still appears under its weave; reserve
`categoryId: 6` for a couple of explicitly bridal hero sarees. Every saree's `categoryId` MUST be one of
`{1, 6, 7, 8, 9, 10, 11, 12, 13}`.

### Full product shape (preserve every key, camelCase, types)
Each product object MUST keep this exact shape (numbers as numbers, INR integers for money, ISO `…Z`
dates, variant ids as **strings** `"v1"`/`"v2"`):
```json
{
  "id": 1,
  "name": "Royal Banarasi Silk Saree — Deep Maroon",
  "slug": "royal-banarasi-silk-saree-deep-maroon",
  "sku": "SAR-BAN-001",
  "shortDescription": "Handwoven Banarasi silk saree with rich gold zari brocade and a contrast pallu.",
  "description": "Long heritage description referencing Kolkata/Bengal handloom, artisans, zari, weave, drape, care...",
  "categoryId": 7,
  "brand": "Meghali's Silk",
  "images": [
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Banarasi+Silk",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Pallu+Detail",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Border+Zari",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Drape"
  ],
  "price": 18500,
  "comparePrice": 24000,
  "costPrice": 12000,
  "stock": 24,
  "lowStockThreshold": 5,
  "weight": 0.8,
  "dimensions": { "length": 35, "width": 25, "height": 5 },
  "variants": [
    { "id": "v1", "name": "Deep Maroon", "price": 18500, "stock": 8, "sku": "SAR-BAN-001-MRN",
      "attributes": { "Fabric": "Banarasi Silk", "Color": "Deep Maroon" }, "swatchHex": "#7B1E2B" },
    { "id": "v2", "name": "Royal Blue", "price": 18500, "stock": 8, "sku": "SAR-BAN-001-BLU",
      "attributes": { "Fabric": "Banarasi Silk", "Color": "Royal Blue" }, "swatchHex": "#1E3A8A" },
    { "id": "v3", "name": "Emerald Green", "price": 18900, "stock": 8, "sku": "SAR-BAN-001-GRN",
      "attributes": { "Fabric": "Banarasi Silk", "Color": "Emerald Green" }, "swatchHex": "#0B6B4F" }
  ],
  "tags": ["saree", "banarasi", "silk", "wedding", "zari", "festive"],
  "featured": true,
  "trending": true,
  "hot": false,
  "isActive": true,
  "rating": 4.7,
  "totalReviews": 86,
  "metaTitle": "Royal Banarasi Silk Saree — Deep Maroon | Meghali's Silk",
  "metaDescription": "Handwoven Banarasi silk saree with gold zari. Pure silk, authentic handloom. Shop Meghali's Silk.",
  "createdAt": "2025-02-01T00:00:00.000Z",
  "updatedAt": "2025-05-01T00:00:00.000Z",
  "frequentlyBoughtTogetherIds": [],
  "relatedProductIds": []
}
```
Rules for every saree:
1. **`id`** numeric, sequential **1–18**, no gaps, no duplicates. **`slug`** unique kebab-case derived
   from the name. **`brand`** is `"Meghali's Silk"` for all.
2. **`sku`** top-level uses the pattern `SAR-<WEAVE>-NNN` where `<WEAVE>` is a 3-letter weave code —
   `BAN` Banarasi, `KAN` Kanjivaram, `TUS` Tussar, `MUL` Mulberry, `ERI` Eri, `MUG` Muga, `BAL`
   Baluchari (e.g. `SAR-TUS-004`). Variant SKUs append a colour suffix (e.g. `SAR-TUS-004-GLD`).
3. **`images`**: 3+ portrait URLs per product (front drape, pallu, border/zari close-up, and optionally
   a worn/styled shot). Use distinct `?text=` labels so they are visibly different placeholders.
4. **`variants`**: 2–4 variants, each with `attributes` containing a `"Fabric"` key (the weave, e.g.
   `"Tussar Silk"`) and a `"Color"` key, plus a real `swatchHex` colour chip. Variant `price`/`stock`/
   `sku` are required; variant `id` is a string. Keep variant prices at or near the top-level `price`.
5. **Money** (`price`, `comparePrice`, `costPrice`, variant `price`): **INR integers** only, no decimals,
   no currency symbols. Saree price band: **₹3,000–₹35,000**. Always set `comparePrice > price` (so a
   genuine discount shows) and `costPrice < price`.
6. **`stock`** is a positive integer; set `lowStockThreshold` (e.g. 5). The sum of variant `stock` should
   be ≈ the top-level `stock` (close enough for realism).
7. **`tags`**: lowercase, include `"saree"`, the weave (e.g. `"banarasi"`), `"silk"`, and occasion/
   attribute tags (`"wedding"`, `"festive"`, `"bridal"`, `"handloom"`, `"zari"`, `"bestseller"`). Tags
   power the tag-driven "Bestsellers"/"New Arrivals" collections — use `"bestseller"` on your top
   sellers and recent `createdAt` for new arrivals.
8. **Flags**: set `featured`, `trending`, `hot` per the table; `isActive: true` for all. Keep flag
   counts plausible (a handful featured, a handful trending, a few hot — not every product flagged).
9. **`rating`/`totalReviews`**: plausible and consistent with a premium silk house — `rating` between
   **4.2 and 4.9** (one decimal), `totalReviews` between **0 and ~180**. **Authenticity rule:** the
   supporting-data prompt seeds individual `reviews` for several of these products; those products'
   `totalReviews` must be ≥ the number of approved reviews they receive and the `rating` must be
   believable against them. Do not invent absurd numbers (no "10,000 reviews"). A brand-new arrival may
   have `totalReviews: 0` and you may omit `rating` or set a modest value.
10. **`metaTitle`/`metaDescription`**: set both, brand-suffixed (`… | Meghali's Silk`), keyword-rich but
    honest, ≤ ~160 chars for the description.
11. **`createdAt`/`updatedAt`**: ISO `…Z`. Vary `createdAt` across 2025–2026 so "New Arrivals" ordering
    is meaningful; `updatedAt ≥ createdAt`.
12. **`dimensions`/`weight`**: realistic for a folded saree, e.g. `weight` ~0.6–1.1 (kg, non-integer
    allowed) and `dimensions` ~`{ "length": 35, "width": 25, "height": 5 }` (cm).
13. **Cross-links**: `relatedProductIds` and `frequentlyBoughtTogetherIds` are arrays of **valid product
    ids that exist in the catalogue**. Within this prompt you can only safely reference saree ids 1–18.
    You MAY also reference non-saree ids **19–33** (created by the companion non-saree prompt) for FBT
    pairings like saree + matching blouse/dupatta — but if you do, ensure those ids fall in 19–33 (the
    reserved non-saree range) so they resolve once that data is seeded; otherwise keep cross-links within
    1–18. Never reference a product's own id, and never reference an id outside 1–33.

### Two fully-worked example sarees (write these verbatim as ids 1 and 4; adapt the rest)
You may copy these as-is and build the remaining products to match their depth.

**Example A — id 1 (Banarasi):** Use the id-1 object shown in the "Full product shape" block above.
Expand `description` to 3–4 sentences, e.g.: `"Woven on traditional handlooms by master artisans in the
Banaras-to-Bengal weaving tradition, this pure silk saree carries dense gold zari brocade across the
body and an opulent contrast pallu. The deep maroon ground is dyed for richness and the zari catches
light beautifully under evening wear. Comes with an unstitched matching blouse piece. Dry clean only;
store wrapped in muslin."` Keep `categoryId: 7`, weave code `BAN`, three colour variants with
`swatchHex`.

**Example B — id 4 (Tussar):**
```json
{
  "id": 4,
  "name": "Handwoven Tussar Silk Saree — Natural Gold",
  "slug": "handwoven-tussar-silk-saree-natural-gold",
  "sku": "SAR-TUS-004",
  "shortDescription": "Textured wild Tussar (Kosa) silk saree with a natural golden sheen and hand-block pallu.",
  "description": "Handwoven in eastern India from wild Tussar (Kosa) silk, this saree has the fabric's signature slubby texture and warm golden lustre. The pallu carries a subtle hand-block motif and the border is finished with a fine zari line. A versatile drape for day functions and the festive season. Includes an unstitched blouse piece. Dry clean recommended.",
  "categoryId": 9,
  "brand": "Meghali's Silk",
  "images": [
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Tussar+Silk",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Texture",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Pallu",
    "https://placehold.co/600x800/0B3B2E/CBA35A?text=Border"
  ],
  "price": 7900,
  "comparePrice": 10500,
  "costPrice": 5200,
  "stock": 30,
  "lowStockThreshold": 6,
  "weight": 0.7,
  "dimensions": { "length": 34, "width": 24, "height": 5 },
  "variants": [
    { "id": "v1", "name": "Natural Gold", "price": 7900, "stock": 12, "sku": "SAR-TUS-004-GLD",
      "attributes": { "Fabric": "Tussar Silk", "Color": "Natural Gold" }, "swatchHex": "#C9A24B" },
    { "id": "v2", "name": "Rust", "price": 7900, "stock": 10, "sku": "SAR-TUS-004-RST",
      "attributes": { "Fabric": "Tussar Silk", "Color": "Rust" }, "swatchHex": "#9C4A21" },
    { "id": "v3", "name": "Olive", "price": 8200, "stock": 8, "sku": "SAR-TUS-004-OLV",
      "attributes": { "Fabric": "Tussar Silk", "Color": "Olive" }, "swatchHex": "#6B6B23" }
  ],
  "tags": ["saree", "tussar", "kosa", "silk", "handloom", "festive"],
  "featured": false,
  "trending": true,
  "hot": false,
  "isActive": true,
  "rating": 4.5,
  "totalReviews": 41,
  "metaTitle": "Handwoven Tussar Silk Saree — Natural Gold | Meghali's Silk",
  "metaDescription": "Pure wild Tussar (Kosa) silk saree, handwoven with a golden sheen. Authentic handloom from Meghali's Silk.",
  "createdAt": "2025-03-12T00:00:00.000Z",
  "updatedAt": "2025-06-01T00:00:00.000Z",
  "frequentlyBoughtTogetherIds": [],
  "relatedProductIds": [1, 7, 9]
}
```
(Also include a third Kanjivaram example at id 7 if helpful — a richly described `categoryId: 8` saree,
weave code `KAN`, `price` ~₹22,000, two contrast-border colour variants.)

### Completion table — create these as the remaining sarees (ids deterministic)
Build every row below to the same depth as the examples (full description, 3+ images, 2–4 variants with
`swatchHex`, tags, meta, dates, cross-links). Prices are guidance (₹3,000–₹35,000 band); set
`comparePrice` ~15–35% above `price`.

| id | name | slug | categoryId | weave/SKU | price | comparePrice | key fabrics / colours | featured | trending | hot |
|----|------|------|-----------|-----------|-------|--------------|------------------------|----------|----------|-----|
| 1 | Royal Banarasi Silk Saree — Deep Maroon | `royal-banarasi-silk-saree-deep-maroon` | 7 | BAN-001 | 18500 | 24000 | Banarasi; Maroon/Royal Blue/Emerald | true | true | false |
| 2 | Banarasi Katan Silk Saree — Ivory Gold | `banarasi-katan-silk-saree-ivory-gold` | 7 | BAN-002 | 15900 | 21000 | Banarasi Katan; Ivory/Rani Pink | true | false | true |
| 3 | Banarasi Georgette Silk Saree — Wine | `banarasi-georgette-silk-saree-wine` | 7 | BAN-003 | 9800 | 13500 | Banarasi Georgette; Wine/Teal | false | true | false |
| 4 | Handwoven Tussar Silk Saree — Natural Gold | `handwoven-tussar-silk-saree-natural-gold` | 9 | TUS-004 | 7900 | 10500 | Tussar; Natural Gold/Rust/Olive | false | true | false |
| 5 | Tussar Ghicha Silk Saree — Ochre | `tussar-ghicha-silk-saree-ochre` | 9 | TUS-005 | 6500 | 8900 | Tussar Ghicha; Ochre/Maroon | false | false | false |
| 6 | Pure Tussar Silk Saree — Indigo Block Print | `pure-tussar-silk-saree-indigo-block-print` | 9 | TUS-006 | 8400 | 11000 | Tussar; Indigo/Mustard | false | false | true |
| 7 | Kanjivaram Pure Silk Saree — Peacock Blue | `kanjivaram-pure-silk-saree-peacock-blue` | 8 | KAN-007 | 22500 | 29000 | Kanjivaram; Peacock Blue/Mustard | true | true | false |
| 8 | Kanjivaram Bridal Silk Saree — Rani Pink | `kanjivaram-bridal-silk-saree-rani-pink` | 6 | KAN-008 | 31500 | 39000 | Kanjivaram; Rani Pink/Red | true | false | true |
| 9 | Kanjivaram Temple Border Saree — Mustard | `kanjivaram-temple-border-saree-mustard` | 8 | KAN-009 | 19800 | 26000 | Kanjivaram; Mustard/Green | false | true | false |
| 10 | Mulberry Silk Saree — Classic Red | `mulberry-silk-saree-classic-red` | 10 | MUL-010 | 6900 | 9500 | Mulberry; Red/Black/Teal | true | false | false |
| 11 | Mulberry Silk Saree — Pastel Mint | `mulberry-silk-saree-pastel-mint` | 10 | MUL-011 | 5800 | 7900 | Mulberry; Mint/Lavender | false | false | false |
| 12 | Eri Silk Saree — Earthy Beige | `eri-silk-saree-earthy-beige` | 11 | ERI-012 | 5200 | 7200 | Eri (Ahimsa); Beige/Brown | false | true | false |
| 13 | Eri Silk Saree — Charcoal Stripe | `eri-silk-saree-charcoal-stripe` | 11 | ERI-013 | 4800 | 6500 | Eri; Charcoal/Olive | false | false | false |
| 14 | Muga Silk Saree — Assam Golden | `muga-silk-saree-assam-golden` | 12 | MUG-014 | 28500 | 35000 | Muga; Natural Golden | true | false | true |
| 15 | Muga Silk Saree — Golden with Red Border | `muga-silk-saree-golden-red-border` | 12 | MUG-015 | 26500 | 33000 | Muga; Golden/Red border | false | true | false |
| 16 | Baluchari Silk Saree — Maroon Narrative Pallu | `baluchari-silk-saree-maroon-narrative-pallu` | 13 | BAL-016 | 16500 | 22000 | Baluchari; Maroon/Cream | true | true | false |
| 17 | Baluchari Silk Saree — Midnight Blue | `baluchari-silk-saree-midnight-blue` | 13 | BAL-017 | 14900 | 19500 | Baluchari; Midnight Blue/Gold | false | false | false |
| 18 | Bengal Handloom Silk Saree — Dhakai Jamdani | `bengal-handloom-silk-saree-dhakai-jamdani` | 1 | BEN-018 | 3900 | 5500 | Blended/Jamdani; White/Red, Sky/Navy | false | true | true |

(Adjust names/colours for authenticity if needed, but keep ids, slugs, categoryIds, and SKU weave codes
as above so the data is deterministic and cross-links resolve.)

### Cross-link guidance
- Set each saree's `relatedProductIds` to 3–5 ids of **other sarees in the same or related weave**
  (e.g. id 4 → `[1, 7, 9]`; id 16 → `[17, 1, 8]`). Curated order matters (most relevant first).
- Set `frequentlyBoughtTogetherIds` to 1–3 ids — pair a saree with a **matching blouse or dupatta** from
  the reserved non-saree range **19–33** (e.g. `[19, 24]`) so the PDP's "Frequently Bought Together"
  bundle is meaningful once that data exists; or pair with a complementary saree id 1–18. Do not exceed
  3 entries and never include the product's own id.

## Data / API Notes
- Storefront reads: `apiService.products.getAll(params)`, `getById`, `getBySlug` (legacy numeric id →
  slug redirect on the PDP), `getFeatured(limit)` (mock: `GET /products?featured=true`),
  `getTrending(limit)` (`GET /products?trending=true`), `getByCategory(categoryId)` (`GET
  /products?categoryId=<id>`), `search(q)`, `getReviews(productId)` (approved only), `getRelated(product)`
  and `getFrequentlyBoughtTogether(product)` (resolved from the live catalogue, honouring the curated id
  arrays then same-category/shared-tags top-up; inactive and self always filtered out).
- Because `getFeatured`/`getTrending` filter on the boolean flags, set `featured`/`trending` honestly so
  those rails return silk sarees. Because related/FBT resolve curated ids against the live catalogue,
  every id in `relatedProductIds`/`frequentlyBoughtTogetherIds` MUST resolve to a real, `isActive`
  product (within 1–33) — invalid ids are silently dropped, but avoid them.
- **Do not change `src/services/api.js`** or any contract. The mock JSON Server and a future Laravel API
  serve the same product shape; keep camelCase keys, numeric top-level ids, **string** variant ids, INR
  integers, and ISO `…Z` dates so flipping `REACT_APP_API_URL`/`REACT_APP_USE_MOCK_API` needs no code
  changes.
- Keep `categoryId` referential integrity: every saree's `categoryId` ∈ `{1, 6, 7, 8, 9, 10, 11, 12,
  13}`, all of which exist in the categories taxonomy.

## Constraints (Do Not Break)
- This prompt changes **only `db.json`** (the saree products, ids 1–18). It must NOT modify any
  component, theme, token, or `src/` file, and must NOT call into or alter `apiService`.
- Preserve **all JSON shapes / key names / id conventions / camelCase / INR-integer money / ISO `…Z`
  dates** and referential integrity (`product.categoryId`, `relatedProductIds`,
  `frequentlyBoughtTogetherIds`). Variant `id` values stay **strings**; money stays integer rupees.
- Honour the **"authenticity > persuasion"** rule: ratings/`totalReviews` must be plausible and
  consistent with the reviews seeded elsewhere; no fabricated/absurd social proof.
- Keep the **JSON Server ↔ Laravel swap contract** intact — the product response shape must not change.
- Do **not** touch the admin panel, the `categories` array, non-saree products (ids 19+), or any other
  `db.json` collection. Do not add/remove top-level `db.json` keys. Reserve ids 1–18 for sarees only.
- Product ids 1–18 are a cross-prompt contract for cross-links — do not renumber them.

## Acceptance Criteria / Definition of Done
- [ ] `db.json` is valid JSON; the `products` array's first 18 entries are silk sarees with ids 1–18
      (sequential, unique), each with the full product shape/keys; no demo (laptop/earbud) products
      remain among ids 1–18.
- [ ] Every saree has `brand: "Meghali's Silk"`, a unique kebab `slug`, an `SAR-<WEAVE>-NNN` (or
      `BEN-018`) SKU, 3+ portrait image URLs, 2–4 variants each with a `Fabric` + `Color` attribute and a
      `swatchHex`, lowercase `tags`, and `isActive: true`.
- [ ] All money fields are INR integers with `comparePrice > price` and `costPrice < price`; every
      `categoryId` ∈ `{1, 6, 7, 8, 9, 10, 11, 12, 13}`; prices fall in ₹3,000–₹35,000.
- [ ] `rating` (4.2–4.9) and `totalReviews` (0–~180) are plausible; flag counts are realistic (not every
      product featured/trending/hot).
- [ ] Every id in `relatedProductIds`/`frequentlyBoughtTogetherIds` is within 1–33, is not the product's
      own id, and (for 1–18) resolves to a real saree.
- [ ] `npm run server` starts and `GET http://localhost:3001/products` returns the silk sarees;
      `GET http://localhost:3001/products?featured=true` returns flagged silk sarees;
      `GET http://localhost:3001/products?categoryId=7` returns the Banarasi sarees.
- [ ] No other top-level collection (categories, coupons, reviews, etc.) changed.

## Verification Steps
1. From the project root run `npm run dev` (CRA + JSON Server on :3001), or `npm run server` for API-only
   checks.
2. `GET http://localhost:3001/products` → confirm sarees with ids 1–18 and full fields.
3. `GET "http://localhost:3001/products?featured=true"` and `?trending=true` → return silk sarees you
   flagged.
4. `GET "http://localhost:3001/products?categoryId=9"` → returns the Tussar sarees (ids 4–6).
5. `GET "http://localhost:3001/products?slug=handwoven-tussar-silk-saree-natural-gold"` → returns exactly
   id 4.
6. Validate JSON: `node -e "JSON.parse(require('fs').readFileSync('db.json','utf8'))"` exits cleanly.
7. Open the storefront `http://localhost:3001/products` (and the home "Featured"/"Trending" rails). Open
   a saree PDP; confirm gallery, variant fabric/colour swatches, price + struck compare price, and the
   "You May Also Like" / "Frequently Bought Together" rails populate with real silk products and no
   console errors. Toggle theme to confirm imagery/data render in both modes.
