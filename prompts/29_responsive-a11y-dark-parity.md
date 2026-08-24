# Hardening — Responsive, Accessibility & Dark-Mode Parity

**Prompt 29 of 30**

## Depends on

Prompts 01–28 (everything built). This is a sweep-and-fix pass across the finished redesign.

## Context

Meghali's Silk — Assamese-silk boutique storefront, fully redesigned into the warm-minimalist editorial system (light-first, golden-logo `--sf-*` tokens; dark "evening" mode via `body.dark`; breakpoints per `TOKENS.breakpoints`: 480 / 768 / 1024 / 1280 / 1440; tap target token 44px). All storefront surfaces and flows are now in their final form and must be hardened as one product.

## Objective

Audit and fix every redesigned surface for responsive integrity, accessibility (semantic HTML, keyboard, focus, contrast, alt text, reduced motion), and light/dark parity — fixes only, no redesigns.

## Scope — files/areas to touch

- Any storefront page/component `.module.css` (+ minimal `.js` markup fixes: aria attributes, alt text, heading levels, label associations)
- NOT: logic/flows/API/data, `src/pages/Admin/*`, `src/components/AdminLayout/*`, `db.json`

## Brand & design requirements (audit matrix)

1. **Responsive sweep** — at 360, 375, 480, 768, 1024, 1280, 1440 (+ one ultra-wide ~1920 check for max-width containment), audit every route: `/`, `/products` (+ filter sheet), `/products/:slug`, `/checkout` (all 4 steps), `/order-confirmation/:orderNumber`, `/orders`, `/profile` (all sections), `/wishlist`, `/special-offers`, `/help`, `/support`, `/about`, `/privacy`, `/terms`, `/cookies`, `/refund` — plus overlays (Header states, SidebarMenu, SearchModal, CartDrawer, AuthModal, ReviewModal, filter sheet) and the splash. Fix: horizontal overflow (tables/rails must scroll inside their own containers), text clipping, broken grids, sticky-element collisions (header vs PDP buy box vs AddToCartBar vs BottomNav), safe-area insets.
2. **Keyboard & focus** — complete these journeys keyboard-only: browse → filter → PDP → variant → add → drawer → checkout → place order; login/register; search → result; wishlist save/move; order cancel; review submit; theme toggle. Fix: unreachable controls, invisible focus (especially on the dark footer and image-hover reveals), focus traps that leak (all five overlays), focus restoration, skip-to-content if trivially addable.
3. **Semantics & AT** — one h1 per page and sane heading order; landmarks (header/nav/main/footer); form labels + `autocomplete`; images alt-texted (decorative = empty alt); icon-only buttons labeled; status changes announced (cart count, copied, applied coupon — aria-live where already patterned); tables with `<th>`; tabs/accordions with correct aria state.
4. **Contrast** — verify against the final token values: body ink on ivory, secondary/muted text, gold-on-ivory accents (gold text must pass 4.5:1 or be enlarged/darkened per the token — fix at the token level in `storefront-tokens.css` if systemic), status chips, dark-mode muted text, focus rings on all grounds.
5. **Dark parity** — every route + overlay in `body.dark`: no light-mode leftovers (hardcoded surfaces, invisible hairlines, images with white matting), the footer's constant-dark treatment correct in both, splash dark override, logo variants correct per background everywhere (light logo never on dark ground, white never on light).
6. **Reduced motion** — full re-verification post-27 (spot-fix stragglers).

## Functional guardrails

1. FIXES ONLY: CSS + markup-level accessibility corrections. No flow, state, API, or data changes; if an audit finding requires logic surgery, document it in the summary for human triage instead of fixing.
2. Token-level fixes preferred over per-surface overrides (a contrast fix belongs in `storefront-tokens.css` once, not in twelve modules).
3. Do NOT modify the admin panel.
4. Brand consistency preserved — fixes must not water down the editorial look (e.g. fix hairline contrast by tone-shifting the token, not by thickening borders everywhere).
5. Tap targets ≥44px on touch; keep `@media print` behaviors.
6. No fabricated trust signals — n/a.
7. Test before done — the matrix above IS the test; then the regression list below.

## Implementation notes

- Work route-by-route with a checklist; batch fixes per file.
- Tools: browser devtools device mode, Lighthouse a11y pass per key route (Home, Products, PDP, Checkout), manual contrast checks on the final hexes.
- Common suspects from this codebase: rails' scroll affordances at touch sizes, the checkout summary on mobile, the Products filter sheet focus trap, dark-mode Swal, the PDP tabs' roving focus after restyle, image aspect boxes (CLS) on slow loads.

## Acceptance criteria

- [ ] Zero horizontal page scroll on any route at any tested width; all sticky/fixed elements coexist.
- [ ] Every listed journey completable keyboard-only with always-visible focus.
- [ ] Lighthouse accessibility ≥ 95 on Home, Products, PDP, Checkout (document scores).
- [ ] Contrast verified for the token palette in both modes; systemic fixes made at token level.
- [ ] Dark mode: every route/overlay clean; logo variants correct everywhere.
- [ ] Reduced-motion: no stragglers.
- [ ] No functional/flow diffs; admin untouched; findings needing logic changes documented, not hacked.

## Test & QA

- Full regression after fixes: place an order (COD), cancel it, submit a review, subscribe to the newsletter, copy a coupon and redeem it — all still work.
- `npm run build` completes clean.
- Admin smoke: login + 3 modules render as before.
