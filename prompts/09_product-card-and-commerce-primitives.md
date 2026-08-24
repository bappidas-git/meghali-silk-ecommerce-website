# Product Card & Shared Commerce Primitives

**Prompt 9 of 30**

## Depends on

Prompt 01 (tokens), Prompt 03 (primitives). Prompt 02 recommended (real catalogue to look at). These components ship on Home, Products, Wishlist and inside PDP rails — do this BEFORE the page prompts (12–17).

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). The shared commerce primitives live in `src/components/storefront/` (CSS Modules, token-clean, exported via the `index.js` barrel): `ProductCard`, `StarRating`, `PriceBlock`, `QuantityStepper`, `RelatedProducts`. They are consumed by `Home.js`, `Products.js`, `Wishlist.js`, `ProductDetails.js` — their prop signatures are a stable contract.

## Objective

Redesign the shared commerce primitives into the editorial language — image-led, hairline, serif-accented, quietly confident — with every prop, behavior, and honest-data rule preserved, so all consuming pages inherit the new look before their own prompts run.

## Scope — files/areas to touch

- `src/components/storefront/ProductCard.js` + `ProductCard.module.css` — props stay `({ product, onAddToCart, onToggleWishlist, isWishlisted = false, showAddToCart = true })`
- `src/components/storefront/StarRating.js` + `StarRating.module.css` — `({ rating = 0, size = 18, label })`
- `src/components/storefront/PriceBlock.js` + `PriceBlock.module.css` — `({ price, comparePrice, currency = "INR", size = "lg", showSavings, taxNote })`
- `src/components/storefront/QuantityStepper.js` + `QuantityStepper.module.css` — `({ value, onChange, min = 1, max = Infinity, disabled, size = "md" })`
- `src/components/storefront/RelatedProducts.js` + `RelatedProducts.module.css` — `({ title, products, onAddToCart, onToggleWishlist, isInWishlist })`
- Do NOT touch `variantUtils.js`, the barrel `index.js` exports, or the other storefront components (they belong to Prompts 15–16).

## Brand & design requirements

1. **ProductCard — a gallery object, not a marketplace tile.** Borderless composition: 3:4 media on the soft surface token, generous inner air, then a quiet text stack — small tracked category/brand line, product name (serif or refined Inter — pick once, apply everywhere), star line, `PriceBlock size="sm"`. Hover (desktop): slow image scale ~1.03 + hairline underline on the name; a restrained reveal for the Add affordance is welcome, but Add must remain always reachable on touch. Keep every mechanic: media click → `productPath(product)`; discount badge + PREMIUM ribbon + Out-of-Stock tag (restyled via the `sf-badge-discount`/`sf-ribbon-premium` primitives); wishlist heart toggle with `isWishlisted` state; "No ratings yet" when reviews are absent; `PLACEHOLDER_IMG`/`onImageError` fallback; `showAddToCart` gate.
2. **StarRating:** refine the mark — smaller, gold token (`--sf-color-star`), consistent optical alignment; keep half-star rendering, `role="img"` + aria-label.
3. **PriceBlock:** editorial price typography — current price prominent (serif at `lg` is a nice moment), compare-price struck in muted, "% off" and "You save ₹X" as quiet gold/ink text rather than loud pills. Discount stays DERIVED from price/comparePrice (never passed in); `taxNote` + `showSavings` defaults preserved.
4. **QuantityStepper:** hairline bordered − / value / + with token focus states, `aria-live` value, disabled edges, "No more stock available" title at max — behavior identical.
5. **RelatedProducts:** the rail shell — tracked-uppercase or serif section title, hairline top rule, horizontal scroll with subtle edge affordance (snap optional), cards spaced generously; still renders `null` when empty.
6. Dark-mode parity for all five via tokens.

## Functional guardrails

1. Preserve all functionality & prop contracts exactly — these components are imported by 4+ pages and 2 PDP rails; renaming/removing a prop or changing default behavior breaks surfaces this prompt can't see. No API-call changes (these components make none; data arrives via props).
2. Honest-data rules are structural: rating row only from real `rating`/`totalReviews`; discount only from a real `comparePrice > price`; stock states from real `stock`. Do not add urgency/scarcity styling beyond the existing out-of-stock state.
3. Tokens/primitives only; zero hex; fonts via `--sf-font-*`.
4. Do NOT modify the admin panel.
5. Responsive + accessible: card fully keyboard-operable (link, heart, add all focusable with visible rings); image `alt` from product name; tap targets ≥44px; grids remain the consumer's concern — the card must be fluid (100% width of its cell).
6. No fabricated trust signals — no "selling fast", no fake view counts.
7. Test before done — verify on every consuming page.

## Implementation notes

- Consumers and their grids: `Home.js` (rails + grids), `Products.js` (main grid), `Wishlist.js` (grid + per-cell Move-to-Cart button UNDER the card — keep the card's outer box predictable), `RelatedProducts` (rail), `FrequentlyBoughtTogether` does NOT use ProductCard.
- `SpecialOffers.js` has its own LOCAL ProductCard/StarRating duplicates — do not touch them here (Prompt 23 handles that page); visual language you define here is the reference it will match.
- Keep `truncateText` usage for names but allow 2-line clamp via CSS for the editorial look.
- Image aspect: enforce 3:4 via CSS `aspect-ratio` with `object-fit: cover` — seed images are 600×800.

## Acceptance criteria

- [ ] ProductCard reads editorial (airy, hairline, image-led) and is visibly different from the old boxed tile.
- [ ] All props/behaviors intact: navigation, add-to-cart, wishlist toggle, badges/ribbon/OOS, fallback image, `showAddToCart`.
- [ ] StarRating/PriceBlock/QuantityStepper/RelatedProducts restyled with contracts intact.
- [ ] "No ratings yet" and no-discount cards render honestly and beautifully.
- [ ] Home, Products, Wishlist, PDP rails all inherit the new card with zero page-code changes.
- [ ] Light + dark parity; keyboard pass clean.

## Test & QA

- `npm run dev`: check the card on Home rails, Products grid, Wishlist grid, PDP "You May Also Like" — consistent everywhere.
- Interact: card click → PDP; heart toggles (guest + logged in user@example.com / password123); Add → cart drawer opens with correct line.
- Find a no-review product and a no-discount product in the seed — cards render clean.
- Stepper on PDP: min/max clamps, aria-live announces.
- 375/768/1280 widths; both themes; reduced-motion (hover transforms off).
- Admin untouched.
