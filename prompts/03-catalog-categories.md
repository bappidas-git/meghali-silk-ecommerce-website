<!-- Batch B — Catalog Data -->
# Prompt 03 — Catalog Categories (Women's Silk Taxonomy)

## Objective
Replace the generic demo `categories` array in `db.json` with a realistic **women's silk apparel
taxonomy** for *Meghali's Silk* — parents (Sarees, Suits & Salwar, Lehengas, Dupattas & Stoles,
Blouses, Bridal) plus saree sub-categories by weave — while **preserving the exact category JSON shape,
key names, id conventions, and the active/sort/menu flags the storefront reads**. This category table is
the **id contract** every product prompt references via `product.categoryId`, so the ids and slugs
defined here are FIXED.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house from
Bengal/Kolkata selling authentic women's silk apparel (sarees, suits, dupattas, lehengas, blouses,
stoles, bridal, ethnic wear). It is a National Handloom Award winner; copy should read premium,
heritage-rooted, and honest. Pricing is **₹ INR** throughout.

Category imagery uses the brand placeholder pattern with brand colors (deep bottle-green `0B3B2E`
background, gold `CBA35A` text): `https://placehold.co/400x300/0B3B2E/CBA35A?text=...` (this matches the
existing `image` field dimensions of `400x300`). You may instead use stable royalty-free Unsplash/Pexels
direct image URLs of silk sarees/ethnic wear if you prefer real photography — but keep the field present
and a working URL.

This prompt is **data only**. It does not render any UI; the menu/category surfaces are built by other
prompts. It must, however, set the flags those surfaces read so the nav and category pages populate
correctly.

## Scope — Files to Create / Modify
- (MODIFY) `db.json` — replace the entire `categories` array with the silk taxonomy defined below.
- **OUT of scope:** every other `db.json` collection (`products`, `banners`, `coupons`, `reviews`,
  `shipping_methods`, `settings`, `dealsConfig`, `users`, `orders`, etc. — do not touch them in this
  prompt), all application code under `src/`, `src/services/api.js`, the admin panel, and theme/token
  files. Do **not** add or remove top-level keys in `db.json`.

## Detailed Requirements
1. **Preserve the exact category shape.** Every category object MUST keep these keys, camelCase, and
   types (numbers as numbers, booleans as booleans, ISO `…Z` dates as strings):
   ```json
   {
     "id": 1,
     "name": "Sarees",
     "slug": "sarees",
     "description": "...",
     "image": "https://placehold.co/400x300/0B3B2E/CBA35A?text=Sarees",
     "parentId": null,
     "isActive": true,
     "sortOrder": 1,
     "showInMainMenu": true,
     "menuOrder": 1,
     "createdAt": "2025-01-01T00:00:00.000Z",
     "updatedAt": "2025-01-01T00:00:00.000Z"
   }
   ```
   A child category is the same shape with `"parentId": <parent id>`, `"showInMainMenu": false`, and
   `"menuOrder": 0`.

2. **Write EXACTLY these categories, with these FIXED ids, names, slugs, and parentIds** (this is the
   id contract the product prompts depend on — do not renumber, rename, or re-slug):

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

   - The six **parents** (ids 1–6) have `parentId: null`, `isActive: true`, `showInMainMenu: true`, and
     a `menuOrder` matching the table (the storefront top-nav reads `showInMainMenu`/`menuOrder`).
   - The seven **saree children** (ids 7–13) have `parentId: 1`, `isActive: true`,
     `showInMainMenu: false`, `menuOrder: 0`, and `sortOrder` per the table.
   - Total = **13 categories**. (The current demo data has 16; you are replacing — not appending — so
     the final `categories` array has exactly these 13 objects in this id order.)

3. **New Arrivals / Bestsellers are TAG-DRIVEN, not categories.** Do NOT add `new-arrivals` or
   `bestsellers` as category rows. They are surfaced from product flags/tags instead: "New Arrivals"
   from recent `createdAt`, "Bestsellers"/"Trending" from the `trending`/`featured`/`hot` product flags
   and tags such as `"bestseller"`. Add a short note in the category descriptions if helpful, but keep
   these as conceptual collections only — the product prompts seed the `trending`/`featured`/`hot`
   flags and `tags` that power them.

4. **Descriptions — heritage, concrete, honest.** Give each category a 1–2 sentence `description`
   referencing handloom/Bengal/weave where apt. Examples (you may refine, keep them realistic):
   - Sarees: `"Handwoven silk sarees from India's finest weaving clusters — Banarasi, Kanjivaram, Tussar and more."`
   - Suits & Salwar: `"Silk suit sets and salwar kameez in pure and blended silks, ready to wear or unstitched."`
   - Lehengas: `"Festive and bridal silk lehengas with zari, resham and hand embroidery."`
   - Dupattas & Stoles: `"Pure silk dupattas and stoles to layer over any outfit."`
   - Blouses: `"Ready and semi-stitched silk blouses to pair with your saree."`
   - Bridal: `"Curated bridal silks — heirloom sarees and lehengas for the big day."`
   - Banarasi Silk: `"Opulent Banarasi silk sarees with intricate gold and silver zari brocade."`
   - Kanjivaram Silk: `"South Indian Kanjivaram (Kanchipuram) pure silk with contrast borders and temple motifs."`
   - Tussar Silk: `"Textured wild Tussar (Kosa) silk with a natural golden sheen, handwoven in eastern India."`
   - Mulberry Silk: `"Lustrous mulberry silk — the classic smooth, fine-grained silk."`
   - Eri Silk: `"Soft, matte Eri (Ahimsa) silk handwoven in Assam — warm and earthy."`
   - Muga Silk: `"Rare golden Muga silk of Assam, prized for its natural glow and durability."`
   - Baluchari Silk: `"Bengal's Baluchari silk with mythological narrative pallu motifs."`

5. **Images.** Set each `image` to a working URL. Default to the brand placeholder
   `https://placehold.co/400x300/0B3B2E/CBA35A?text=<Label>` where `<Label>` is the category name with
   `+` for spaces and `%26` for `&` (e.g. `?text=Dupattas+%26+Stoles`, `?text=Suits+%26+Salwar`). If you
   use real Unsplash/Pexels photo URLs instead, ensure they hotlink directly to an image and keep an
   appropriate landscape aspect.

6. **Dates.** Set `createdAt`/`updatedAt` to valid ISO `…Z` strings (e.g. `"2025-01-01T00:00:00.000Z"`).
   Consistent dates across the seed are fine; they need only be valid ISO-8601 with the `Z` suffix.

7. **Valid JSON.** After editing, `db.json` must remain valid JSON (no trailing commas, correct
   brackets). Keep all other top-level collections byte-for-byte unchanged.

## Data / API Notes
- The storefront reads categories through `apiService.categories.getAll()`, which on the mock backend
  calls `GET /categories` and (in the app) **filters out `isActive === false` and sorts ascending by
  `sortOrder`** — so every category here is `isActive: true` and has a sensible `sortOrder`.
  `apiService.categories.getBySlug(slug)` resolves `GET /categories/slug/{slug}`, so **slugs must be
  unique** and stable (the product prompts and banner links use these slugs).
- The top-navigation menu is built from categories where `showInMainMenu === true`, ordered by
  `menuOrder` — that is exactly the six parents (ids 1–6) here.
- **The category ids 1..13 defined above are a contract.** The product prompts set
  `product.categoryId` to one of these ids: sarees → a child id 7–13 (or the parent `1` for
  cross-weave/mixed sets), suits → `2`, lehengas → `3`, dupattas/stoles → `4`, blouses → `5`, bridal →
  `6`. Do not change these ids in later edits.
- Do **not** change `src/services/api.js` or any contract. Changing the data must not require code
  changes: the JSON Server (mock) and a future Laravel API both serve this same shape, so keep camelCase
  keys, numeric ids, boolean flags, and ISO dates exactly.
- This prompt does not touch `products` — but be aware the existing demo `products` still reference old
  numeric `categoryId` values; that mismatch is resolved by the product prompts that reseed `products`.
  Do not attempt to fix products here.

## Constraints (Do Not Break)
- This prompt changes **only `db.json`** (the `categories` array). It must NOT modify any component,
  theme, token, or `src/` file, and must NOT call into or alter `apiService`.
- Preserve **all JSON shapes / key names / id conventions / camelCase / boolean & number types / ISO
  `…Z` dates** and referential integrity. Keep the category object shape identical to the existing one
  (same keys, same casing).
- Keep the **JSON Server ↔ Laravel swap contract** intact: the data shape served by `GET /categories`
  must be unchanged so flipping `REACT_APP_API_URL` / `REACT_APP_USE_MOCK_API` needs no code edits.
- Do **not** touch the admin panel or any admin data; do not add/remove top-level `db.json` keys; do not
  alter `users`, `orders`, `payments`, `products`, or any collection other than `categories`.
- Category ids/slugs are a cross-prompt contract — do not renumber or re-slug them.

## Acceptance Criteria / Definition of Done
- [ ] `db.json` is valid JSON and its `categories` array contains **exactly the 13 objects** above, in
      id order 1→13, each with the full original shape/keys.
- [ ] Six parents (ids 1–6) have `parentId: null`, `showInMainMenu: true`, ascending `menuOrder` 1–6;
      seven saree children (ids 7–13) have `parentId: 1`, `showInMainMenu: false`, `menuOrder: 0`.
- [ ] Every `slug` is unique and matches the table; every category is `isActive: true` with a numeric
      `sortOrder`; every `image` is a working URL; all dates are ISO `…Z`.
- [ ] No `new-arrivals` / `bestsellers` category rows exist (they are tag/flag-driven).
- [ ] `npm run server` starts and `GET http://localhost:3001/categories` returns the 13 silk categories;
      `GET http://localhost:3001/categories?slug=banarasi-silk` returns exactly one row (id 7).
- [ ] No other top-level collection in `db.json` changed.

## Verification Steps
1. From the project root, run `npm run dev` (starts CRA + JSON Server on :3001). If you only need the
   data layer, `npm run server` alone is enough for the API checks.
2. `GET http://localhost:3001/categories` → confirm 13 rows, ids 1–13, correct names/slugs/parentIds.
3. `GET "http://localhost:3001/categories?parentId=1"` → returns the 7 saree weave children (ids 7–13).
4. `GET "http://localhost:3001/categories?showInMainMenu=true"` → returns the 6 parents (ids 1–6).
5. `GET "http://localhost:3001/categories?slug=suits-salwar"` → returns exactly the Suits & Salwar
   parent (id 2).
6. In a JSON validator (or `node -e "JSON.parse(require('fs').readFileSync('db.json','utf8'))"`), confirm
   `db.json` parses without error.
7. Open the storefront and confirm the top navigation lists the six parent categories in order (Sarees,
   Suits & Salwar, Lehengas, Dupattas & Stoles, Blouses, Bridal) with no console errors.
