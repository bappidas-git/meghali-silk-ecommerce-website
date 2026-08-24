# Product Detail — Story, Reviews & Recommendations

**Prompt 16 of 30**

## Depends on

Prompt 15 (PDP upper half + shared page state), Prompt 09 (card/rail language), Prompts 01/02/03.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). Below the PDP buy box, `ProductDetails.js` renders a `role="tablist"` tab section (Description / Specifications `<dl>` via `deriveSilkSpecRows` / Fabric & Craft / Reviews (N) / FAQs from `FAQ_ITEMS`), then `FrequentlyBoughtTogether` (curated `frequentlyBoughtTogetherIds` only), then `RelatedProducts` ("You May Also Like"), gated by `STOREFRONT_CONFIG.aov`.

## Objective

Turn the PDP's lower half into the product's editorial story — long-form description, beautiful specification table, craft narrative, an honest reviews section, and quiet AOV rails — preserving tab semantics (or an accessible equivalent), review data rules, and both recommendation modules.

## Scope — files/areas to touch

- `src/pages/ProductDetails/ProductDetails.js` + `ProductDetails.module.css` — the tabbed region and rails placement (upper half is Prompt 15's — don't rework it)
- `src/components/storefront/ReviewsSection.js` + `.module.css` — props stay `({ reviews, displayAvg, totalRatingsCount, loading, error, onRetry })`
- `src/components/storefront/FrequentlyBoughtTogether.js` + `.module.css` — `({ anchor, companions, onAddToCart, currency })`
- `src/utils/constants.js` — ONLY to refresh `FAQ_ITEMS` copy to the Assamese-silk catalogue (care, shipping, authenticity, sizing of Mekhela sets…), keeping the export shape
- `RelatedProducts` was restyled in Prompt 09 — consume, don't re-edit.

## Brand & design requirements

1. **Structure choice:** keep refined tabs (hairline underline tabs, roving ArrowLeft/Right/Home/End preserved) OR convert to stacked editorial sections with an in-page hairline nav — either is acceptable, but keyboard/AT semantics must remain equivalent and the reviews anchor (`onReviewsClick` scroll from `SocialProof`) must keep landing correctly.
2. **Description:** long-form serif-accented prose — comfortable measure (~65–75ch), generous leading, drop-cap optional.
3. **Specifications:** the silk `<dl>` (Warp/Weft Yarn, Design, Lengths, Border, Weave Type, Origin, Occasion, Craft Time — with generic fallback) as a beautiful hairline table: tracked labels, ink values, zebra-free.
4. **Fabric & Craft:** the loom story block becomes an editorial interlude (pull-quote or image+text) using `deriveFabricCraft` output.
5. **Reviews:** summary panel (serif average, `StarRating`, count, 5-bar breakdown as hairline bars) + review cards (initial-avatar, name, verified mark restyled quiet, date, stars, title, body, UGC photo thumbs, helpful count). Honest states preserved: loading, error+`onRetry`, and the empty "No reviews yet" (never invent). Approved-only data flow untouched (`products.getReviews` feeds it).
6. **FAQs:** hairline accordion, small tracked question labels, calm expand.
7. **AOV rails:** `FrequentlyBoughtTogether` restyled as an elegant "Completes the look" set — anchor + companions with the checklist + live total + "Add N to Cart" (bundle math preserved; renders nothing without curated companions). `RelatedProducts` rail placed as the final editorial farewell.

## Functional guardrails

1. Preserve all functionality & the API contract: reviews from `apiService.products.getReviews(productId)` (approved only) with the page's blended `displayAvg` math; FBT strictly from curated `frequentlyBoughtTogetherIds` (structural honesty — no co-purchase claims); related via `products.getRelated`; `STOREFRONT_CONFIG.aov` gates respected; tab state/derivation helpers (`deriveKeyFeatures`, `deriveSilkSpecRows`, `deriveGenericSpecRows`, `deriveFabricCraft`, `buildFaqs`) unchanged in logic.
2. Prop signatures of touched components stay identical.
3. Tokens/primitives only; zero hex.
4. Do NOT modify the admin panel — but note admin Reviews moderation feeds this surface; approved-only must keep holding.
5. Responsive + accessible: tabs/sections keyboard-complete; accordion `aria-expanded`; review images alt-texted; bars have text equivalents; reduced motion honored.
6. No fabricated trust signals: no invented review counts, no "92% recommend" derived stats, FBT/Related labeled as curation ("Completes the look", "You may also like") not statistics.
7. Test before done — see below.

## Implementation notes

- Verify against seed: a product WITH approved reviews + photos, one with zero reviews, one with FBT companions, one without (module hides), one with fabric/craft data and one falling back to generic specs.
- The reviews tab label shows the count — keep it real (`reviews (N)`).
- `FAQ_ITEMS` is also consumed by HelpCenter (`/help`) — write copy that serves both surfaces.
- Scroll anchoring: after restyle, re-test `SocialProof` → reviews scroll offset under the sticky header.

## Acceptance criteria

- [ ] Lower PDP reads as an editorial product story; tabs-or-sections fully keyboard/AT operable.
- [ ] Specification table, craft block, FAQs restyled; fallbacks (generic specs, no craft data) graceful.
- [ ] Reviews: summary + bars + cards; loading/error/empty all styled; only approved reviews appear; pending/rejected seed reviews stay hidden.
- [ ] FBT bundle math + Add-N works; hidden when uncurated. Related rail renders Prompt 09 cards.
- [ ] `SocialProof` click lands on reviews correctly.
- [ ] Light/dark parity; 375→1440; reduced motion; no hex.

## Test & QA

- `npm run dev`: run the product matrix above end-to-end.
- Admin → Reviews: approve a pending seeded review → PDP shows it after reload; reject → disappears.
- Add an FBT bundle → drawer shows all lines with correct prices.
- Keyboard: tab/arrow through tabs (or section nav), open FAQs, reach helpful counts.
- Both themes; 375/768/1280.
- Confirm upper-half (Prompt 15) still intact; admin otherwise untouched.
