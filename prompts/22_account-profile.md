# Account — Profile Hub, Addresses, Wallet & Settings

**Prompt 22 of 30**

## Depends on

Prompt 11 (auth), Prompt 21 (orders language to match), Prompts 01/02/03.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/profile` (`src/pages/Profile/Profile.js`, ~1350 lines) is a hub-and-section page: `activeSection` null = dashboard (header card with avatar/initials + membership badge, stats row Orders/Wishlist/Reviews, menu rows, Recent Orders top-3, Logout w/ Swal confirm); sections = `profile` (personal info; email read-only), `addresses` (full CRUD with label chips, default enforcement, Swal delete confirm — persisted whole-array via `updateUser({addresses})`), `payment` (honest empty state), `wallet` (Store Credit balance + `walletTransactions` ledger), `notifications` (coming-soon), `settings` (dark-mode `role="switch"` + change-password with 4-level strength meter + requirements checklist → `apiService.auth.changePassword`).

## Objective

Redesign the account area into a refined members' space — editorial dashboard, hairline section forms, a dignified wallet ledger — preserving the hub navigation model, every CRUD flow, and honest empty states.

## Scope — files/areas to touch

- `src/pages/Profile/Profile.js` + `Profile.module.css`
- Permitted micro-cleanup: the two Swal `"#dc2626"` literals → a token-synced JS constant.

## Brand & design requirements

1. **Dashboard:** serif greeting header ("Good to see you, {firstName}") with initial-avatar in a hairline ring; membership badge stays HONEST (the existing `getMembership` logic — "Member" unless the user record really carries a premium tier); stats row as three quiet figures with hairline separators (Orders → `/orders`, Wishlist → `/wishlist`, Reviews non-clickable, `—` while loading); menu rows lose the rainbow tone system (`menuRows` tones) for a uniform editorial list — thin icon, label, chevron, count badge where real (orders); Recent Orders as three hairline mini-records (status chips per Prompt 21's language); Logout as a quiet danger text-button (Swal confirm kept).
2. **Section shell:** the back-bar ("← Account") + serif section title; consistent form language (hairline/underline inputs, tracked labels, calm errors) across all sections.
3. **Profile:** first/last/phone editable, email locked with its explanatory note; save states.
4. **Addresses:** cards with label chip (Home/Work/Other), default mark as a small gold seal; Set Default / Edit / Delete as text-buttons; the add/edit form restyled; all rules preserved (exclusive default, first-address default, validation, Swal delete confirm).
5. **Wallet:** the balance as a serif money moment on a quiet band; the ledger as hairline rows — credit/debit mark, reason, date, linked order number → `/orders`, amount (+/− toned), running `balanceAfter`. Honest empty state when no transactions.
6. **Payment & Notifications:** keep the honest empty/coming-soon states, restyled kindly — never fake capability.
7. **Settings:** Appearance row with the theme switch (semantics kept); Change Password with show/hide toggles, the 4-segment strength meter re-toned to tokens, live requirements checklist, submit flow.

## Functional guardrails

1. Preserve all logic & flows: hub state model (`activeSection`), every validation (`isValidPhone`, password rules/strength), address array persistence via `updateUser`, wallet lazy-load on section open, `deriveOrderStatus` for recent orders, logout flow.
2. API-driven as-is: `orders.getByUserId`, `reviews.getMine`, `wallet.getBalance`, `wallet.getTransactions`, `auth.changePassword`, `auth.updateUser` (via context).
3. Tokens/primitives only; the sanctioned Swal-constant literal is the only JS color.
4. Do NOT modify the admin panel.
5. Responsive + accessible: forms labeled with `autocomplete`; the theme switch stays `role="switch"` with state; checklist items announced; section back-navigation keyboard-friendly; ≥44px targets.
6. No fabricated trust signals: membership stays derived from real fields; stats are real counts; no invented "profile completeness" gamification.
7. Test before done — see below.

## Implementation notes

- Wallet content: log in as the seeded wallet user (see `db.json` users[2]) for a populated ledger; user@example.com shows the empty state.
- Address CRUD full pass: add (becomes default if first), add second, set default (exclusivity), edit, delete (confirm) — then verify checkout step 1 lists them.
- Change password in mock mode returns success without persistence (documented mock behavior) — the UI flow is what's under test.
- Recent Orders statuses should visually match Prompt 21's chips — reuse the same class patterns.

## Acceptance criteria

- [ ] Account reads as a refined members' space — uniform editorial lists/forms, no rainbow tones; visibly redesigned.
- [ ] Hub ↔ section navigation intact; every section renders and functions.
- [ ] Profile save, full address CRUD with default rules, wallet balance + ledger (and empty state), password change flow + strength meter, theme switch — all verified.
- [ ] Stats row + Recent Orders real and linked; membership badge honest; Logout confirm works.
- [ ] Payment/Notifications remain honest placeholders, styled.
- [ ] Light/dark parity; 375→1440; keyboard pass; no unsanctioned hex.

## Test & QA

- `npm run dev`: both test users (empty wallet vs seeded wallet).
- Address changes reflect in Checkout step 1 immediately after.
- Wallet order-number link lands on `/orders`.
- Toggle theme from Settings → persists → matches Header toggle state.
- Both themes; 375/768/1280; reduced motion.
- Admin untouched.
