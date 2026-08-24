# Order History — Orders, Cancel/Return & Review Modal

**Prompt 21 of 30**

## Depends on

Prompt 11 (auth entry), Prompt 19 (placeable orders), Prompts 01/02/03.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/orders` (`src/pages/OrderHistory/OrderHistory.js`, ~1000 lines): logged-out prompt (`openAuthModal`), header + refresh, search-by-order-number + filter tabs (All/Processing/Shipped/Delivered/Cancelled via `deriveOrderStatus`), order cards (status badge, thumbnails +N, Placed→Shipped→Delivered timeline hidden for cancelled/returned, action buttons, collapsible tracking + details), pagination (5/page). Flows: **Cancel** (only while derived status is "processing"; Swal confirm with payment-aware refund copy → `apiService.orders.cancel(order.id)` which runs the full mock cascade — refund/void, wallet return, coupon restore, restock); **Return/Exchange** (delivered within 7 days → navigates to `/support`); **Reorder** (`addToCart` loop + open drawer); **Reviews** via `components/ReviewModal/ReviewModal` (per delivered item; `reviews.submit` then re-fetch `reviews.getMine`; Pending/Approved/Rejected chips).

## Objective

Redesign order history into an elegant account ledger — refined cards, a dignified status timeline, calm collapsibles — and restyle `ReviewModal`, with cancel/return/reorder/review flows and all status logic untouched.

## Scope — files/areas to touch

- `src/pages/OrderHistory/OrderHistory.js` + `OrderHistory.module.css`
- `src/components/ReviewModal/ReviewModal.js` + `ReviewModal.module.css` — props stay `({ open, onClose, product, existing, onSubmit })`
- Permitted micro-cleanups: the Swal `confirmButtonColor: "#d32f2f"` literal → the token danger value (as a JS constant with sync comment); ReviewModal's hardcoded `placehold.co` fallback → `PLACEHOLDER_IMG` from `src/utils/helpers`.

## Brand & design requirements

1. **Header + filters:** serif page title, muted count, refresh as a quiet icon-button; search + the five filter tabs as hairline `sf-chip`-style tabs.
2. **Order cards:** editorial records — tracked-mono order number + copy, date, status as a quiet chip (per `STATUS_CONFIG` tones mapped to tokens); thumbnail strip (3 + "+N more") with serif Total; the three-stage timeline as a hairline progress with small nodes (hidden for cancelled/returned, as now); actions as text-buttons with hairline separators (Cancel / Return-Exchange / Reorder / Track / Details per eligibility).
3. **Collapsibles:** tracking panel (number+copy, external `trackingUrl` link, status, refund-status messaging — completed/processing/failed styled honestly) and details (items with per-item review control + status chip, address, payment, summary rows) — soft height animation, hairline internals.
4. **Cancel dialog:** Swal confirm copy preserved (payment-aware refund line quoting the real total); themed via the Prompt 03 Swal block + the danger-token constant; per-row "Cancelling…" spinner state kept.
5. **ReviewModal:** editorial dialog — serif "Share your thoughts", product row, refined star input (keep the `StarInput` behavior), title (max 80) + body (max 1000) fields in the house input style, edit-note when revising; the "re-enters moderation" reality communicated ("Your review will appear after approval").
6. **States:** logged-out prompt (elegant invitation → AuthModal), loading, error, empty ("No orders yet" + Shop CTA), no-matches — all restyled. Pagination in the Prompt 14 minimal style (5/page kept).

## Functional guardrails

1. Preserve every flow & rule: `isCancellable` (processing only), the cancel API call + result merge + error dialog; return eligibility (delivered + 7-day window) → `/support` navigation (do NOT build a new return UI — parity means parity); reorder loop with skipped-count toasts; review gating (`isReviewable` = delivered, per-item), `reviews.submit` payload and the `getMine` refresh; `deriveOrderStatus`/`STATUS_CONFIG` logic untouched; search/filter/pagination logic + clamping.
2. API-driven as-is: `orders.getByUserId`, `orders.cancel`, `reviews.getMine`, `reviews.submit`.
3. Tokens/primitives only; the two named literals above are the only sanctioned JS-color touches.
4. Do NOT modify the admin panel — but verify the cancel cascade lands correctly there (it's the proof the flow survived).
5. Responsive + accessible: cards keyboard-complete (collapsibles `aria-expanded`, copy buttons labeled), timeline has text equivalents, dialogs trap focus (ReviewModal + Swal), reduced motion honored.
6. No fabricated trust signals: status/refund messaging reflects real order fields only.
7. Test before done — see below.

## Implementation notes

- Test data: user@example.com / password123 has seeded orders across states (delivered, refunded, processing…); place a fresh order to exercise Cancel.
- Cancel proof: cancel a fresh prepaid order → storefront badge updates; Admin → Orders shows cancelled + timeline events; Admin → Payments shows refund-pending/void; wallet/coupon effects match the order's makeup.
- Review proof: submit on a delivered item → chip "Pending"; approve in Admin → Reviews → chip "Approved" after refresh; edit it → back to Pending.
- The duplicated `deriveOrderStatus` (also in Profile.js) stays duplicated — no refactors in a visual pass.

## Acceptance criteria

- [ ] Page reads as an editorial account ledger — refined cards/timeline/collapsibles; visibly redesigned.
- [ ] Search, five filters, pagination, refresh all work; states (logged-out/loading/error/empty/no-match) styled.
- [ ] Cancel: eligibility correct, dialog copy payment-aware, cascade verified in Admin; Return button only on delivered-within-7-days and routes to `/support`; Reorder fills the cart + opens drawer.
- [ ] Tracking/details collapsibles complete with working copy buttons + external link; refund-status messaging correct on the seeded refunded order.
- [ ] ReviewModal: create + edit flows, star input, validation, moderation states (Pending/Approved/Rejected chips) round-trip with Admin.
- [ ] Light/dark parity; 375→1440; keyboard pass; no unsanctioned hex.

## Test & QA

- `npm run dev`, log in, run the cancel/review proofs above end-to-end.
- Copy order number + tracking number; open `trackingUrl`.
- Filter to each tab; search a partial order number; paginate (place 6+ orders if needed).
- Both themes; 375/768/1280; reduced motion.
- Admin regression beyond the proofs: dashboard/orders list render as before.
