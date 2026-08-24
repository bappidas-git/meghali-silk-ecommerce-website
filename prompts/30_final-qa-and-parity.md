# Final QA & Parity — Full Storefront Certification

**Prompt 30 of 30**

## Depends on

Prompts 01–29 (the complete series). This is the exit gate: after this prompt passes, no further changes should be needed.

## Context

Meghali's Silk — the Assamese-silk boutique storefront has been fully redesigned into the warm-minimalist editorial luxury DTC experience (light-first, golden-logo `--sf-*` token system) with the promise of ZERO functional regressions: everything stays API-driven through the dual-mode `src/services/api.js` (JSON Server ↔ Laravel `{ success, data, meta }`) + `db.json`, and the admin panel is untouched except its logo. Test users (mock mode): customer user@example.com / password123; wallet-holding customer = `db.json` users[2]; admin admin@store.com / admin123. Run with `npm run dev` (CRA :3000 + JSON Server :3001).

## Objective

Certify the finished storefront end-to-end: every flow, every route, both themes, key breakpoints, the admin regression, honest-data rules, and build health. Fix only what fails; report everything.

## Scope — files/areas to touch

- Fixes may touch any storefront file a failing check requires (minimal diffs, token-first). `db.json` may be mutated only BY exercising the app (orders/reviews/leads created during testing are fine).
- NOT: admin code, API contract, schema.

## The certification matrix

**A. Commerce flows (mock mode, end-to-end)**
1. Guest browse → search ("muga") → PDP via slug → variant select → add → drawer math → checkout gate → register fresh account → complete checkout (card) with a seeded coupon → confirmation figures correct → order in history.
2. COD order within settings bounds; COD blocked outside bounds with honest hint.
3. Wallet user: partial store credit + card, then a fully-covered store-credit order (`paymentMethod: "store_credit"`, paid).
4. Cancel a fresh processing order → refund/void copy correct → Admin Orders/Payments reflect the cascade → wallet/coupon restoration where applicable.
5. Delivered order → submit review → Pending chip → approve in Admin → appears on PDP (approved-only) → edit → back to Pending.
6. Wishlist: guest save → login merge → sort → move to cart → clear. Cart: guest persistence (reload), login merge, logout clear.
7. Coupons: valid, invalid, expired/exhausted message, below-minimum auto-remove (drawer + checkout), max-discount cap note. Free-shipping threshold flips in drawer + checkout.
8. Newsletter + contact leads → Admin → Leads. Legacy URL `/products/<numeric-id>` → canonical slug redirect. Unknown route → redirects home. Deals disabled in Admin → page + nav entries hide.

**B. Route & surface sweep** — all 16 storefront routes + all overlays render correctly, light AND dark, at 375 / 768 / 1280 (spot 480/1024/1440 where layouts shift). No console errors or warnings on any route.

**C. Brand & honesty audit** — correct logo variant per background on every surface (header, sidebar, footer, auth modal, splash, favicon tab, admin); serif/Inter typography only; no leftover neon/emerald/purple values (`grep -rn "#12B886\|#667eea\|#a855f7\|#ec4899" src/ public/index.html` → only sanctioned literals with sync comments); ratings/reviews/social proof rendered ONLY from seeded/real data with honest empty states; no fake urgency, stats, or dead controls; countdowns only from admin config.

**D. Admin regression (read-only pass)** — login; every module opens and lists (Dashboard, Products, Categories, Orders, Returns, Payments, Users, Shipping, Coupons, Special Offers, Reviews, Leads, Settings); one edit dialog opens; the new logo (Prompt 28) is the ONLY visual difference vs. pre-series admin.

**E. Contract spot-checks** — `git diff` (or file review) confirms: `src/services/api.js` unchanged; `db.json` schema shapes unchanged (content-only diffs from Prompt 02 + test-run rows); no admin file changed except the two Prompt 28 files; `.env` dual-mode switches untouched.

**F. Build health** — `npm run build` succeeds; serve the build once (`npx serve -s build` or equivalent) and smoke Home/PDP/Checkout; splash, favicon, manifest, fonts all load from the build.

## Functional guardrails

1. This prompt certifies; it does not redesign. Fixes are minimal, token-first, and each one is re-verified against the relevant matrix row.
2. The data/API contract, admin (beyond its logo), schema, and money math are inviolable — a failure there is fixed by reverting the offending change to parity, never by adapting the contract.
3. Tokens only in any fix; no new hex.
4. Accessibility/responsive standards from Prompt 29 hold for anything touched.
5. No fabricated trust signals may survive audit C.
6. Document honestly: failures found, fixes made, and anything deliberately left (with reason) in the final report.
7. Done = the matrix passes clean twice (fix pass, then a clean confirmation pass).

## Implementation notes

- Reset ambient state between flow groups (logout, clear localStorage where a test needs a cold start — note the theme key resets the default-light check).
- Keep a running checklist; the deliverable is the checked matrix + a short defect log (found → fixed → re-verified).
- If mock-mode side effects clutter `db.json` badly during testing, note it; do not hand-edit history rows.

## Acceptance criteria

- [ ] Matrix sections A–F pass completely, with a written run log.
- [ ] Zero console errors across the sweep; `npm run build` clean; built app smoke-tested.
- [ ] Grep audit clean (no unsanctioned legacy colors); logo-per-background audit clean.
- [ ] Admin regression: fully functional, logo-only delta.
- [ ] Defect log lists every issue found → fixed → re-verified (or explicitly deferred with reason).
- [ ] Final statement justified: the storefront is a cohesive, editorial, conversion-focused Meghali's Silk experience with all features, flows, and the admin working exactly as before — requiring no further changes.

## Test & QA

The certification matrix above IS the test plan. Execute it top to bottom, twice (fix pass + confirmation pass), in mock mode via `npm run dev`, and close with the production-build smoke (section F).
