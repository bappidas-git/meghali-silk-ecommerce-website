# Special Offers — Today's Deals, Editorially

**Prompt 23 of 30**

## Depends on

Prompt 09 (card language to mirror), Prompts 01/02/03. Prompt 02 (seeded dealsConfig/coupons) required for meaningful content.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/special-offers` (`src/pages/SpecialOffers/SpecialOffers.js`, ~750 lines, fully self-contained) is admin-driven via `useDealsConfig`: master `enabled` toggle (disabled state page), hero (`config.hero.tag/title/subtitle`) + countdown (`resolveCountdownTarget`; honest "deals have ended" state), Active Coupons grid (headline/description/min-max meta/expiry/code + Copy), Deal of the Day (≤3, timer chip, savings, Add), Deals by Category (`CategoryTabs` scroll strip), and a products grid using a page-LOCAL `ProductCard` (forwardRef) + local `StarRating` — deliberately separate from the shared card. Data: `products.getAll`, `categories.getAll`, `coupons.getActive`; admin selections resolved by `pickByIds` with discount-derived fallbacks.

## Objective

Redesign the offers page into a restrained editorial "Season's Offers" experience — quiet urgency, dignified coupon presentation, curated deal features — preserving the admin-config contract, honest countdown/discount rules, and all copy-code / add-to-cart mechanics.

## Scope — files/areas to touch

- `src/pages/SpecialOffers/SpecialOffers.js` + `SpecialOffers.module.css` — including its local `ProductCard`, `StarRating`, `CategoryTabs`, skeleton subcomponents (restyle them here; they stay local).

## Brand & design requirements

1. **Hero:** the config-driven tag/title/subtitle as an editorial band — tracked eyebrow (tag), serif headline (title), quiet line (subtitle); countdown reduced from boxy digit tiles to one elegant tracked line ("Ends in 04 : 12 : 33") or thin digit pairs; the ended state as a graceful serif notice. Disabled state ("No deals right now") = warm editorial page with a Products CTA.
2. **Coupons:** hairline "voucher" cards — the %/₹ headline in serif, description, honest meta (min order, max discount, expiry via `formatExpiry`), and the code as a dashed-hairline chip with Copy ("Copied!" feedback kept). No fake scarcity ("only today!" unless the data says so).
3. **Deal of the Day:** up to 3 curated features as large editorial cards — image-led, real savings line (from `comparePrice` math), quiet timer chip, Add to Cart.
4. **Category tabs + grid:** `CategoryTabs` becomes a hairline tab strip (edge fades + scroll buttons preserved); the local ProductCard restyled to MATCH Prompt 09's shared card language (3:4 media, quiet meta, discount as small ink/gold mark, wishlist heart, refined Quick View overlay if kept — or drop Quick View for a direct link if it can't be made calm; navigation must remain).
5. **Skeletons/empty:** on the `sf-skeleton` language; empty state warm.

## Functional guardrails

1. Preserve the admin-config contract: `config.enabled` gate, hero fields, `timer` resolution (incl. `onExpiry: "endOfDay"`), `featuredCouponIds`/`dealOfTheDayIds`/`featuredProductIds` resolved in admin order via `pickByIds` with the discount-derived fallbacks — an admin change must keep steering this page with zero code assumptions.
2. API-driven as-is: `products.getAll`, `categories.getAll`, `coupons.getActive`; coupon validity filtering (`isCouponValid`) kept so only live codes display; every displayed code must actually redeem at checkout (same store the checkout validates against — no display-only codes).
3. Honest urgency ONLY: countdown solely from the admin timer; savings solely from real `comparePrice`; no invented stock/demand claims.
4. Tokens/primitives only; zero hex.
5. Do NOT modify the admin panel.
6. Responsive + accessible: tabs keyboard-scrollable; Copy buttons labeled + feedback announced; countdown has an accessible text form; grids collapse cleanly; reduced motion honored.
7. Test before done — see below.

## Implementation notes

- Drive it from Admin → Special Offers: change hero copy, timer end, featured ids → page follows (tab refocus refetches via context).
- Copy a code → paste in checkout/cart coupon box → applies (the end-to-end honesty proof).
- The local card is intentionally local — match the shared card visually without importing it (or import the shared `StarRating` if trivial; behavior-neutral swaps only).
- Check `useDealsCountdown` re-render cadence stays (1s tick) without layout jitter (fixed-width digit styling).

## Acceptance criteria

- [ ] Page reads as a restrained editorial offers experience — no marketplace shouting; visibly redesigned.
- [ ] Enabled/disabled/ended states all styled and driven purely by admin config.
- [ ] Coupons display honest meta; Copy works with feedback; copied codes redeem at checkout.
- [ ] Deal of the Day + category tabs + grid function; savings lines only where real markdowns exist.
- [ ] Local card matches the Prompt 09 visual language; add-to-cart + wishlist + navigation work.
- [ ] Light/dark parity; 375→1440; keyboard pass; reduced motion; no hex.

## Test & QA

- `npm run dev`: baseline sweep, then Admin-side experiments: disable deals (page + nav entry hide), set a near-future `endAt` (countdown → ended state), reorder featured ids.
- Copy 2 codes → redeem one in the cart drawer, one at checkout.
- Add a deal product → drawer line correct.
- Both themes; 375/768/1280; keyboard tabs + copy buttons.
- Admin untouched.
