<!-- Batch D — Storefront Pages -->
# Prompt 22 — Profile / Account

## Objective
Re-skin the **Profile / Account** page (`src/pages/Profile/Profile.{js,module.css}`, route `/profile`)
to the *Meghali's Silk* brand and the profile mockup: a green header card with avatar + name + email +
member badge, a real **Orders / Wishlist / Reviews** stats row, a list of menu rows with colored icons
and chevrons, a **Recent Orders** list, and a red **Logout** — all backed by real account/API data, with
the existing profile / addresses / password / wallet editing preserved and a logged-out guard.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The storefront is **dark-first**: near-black charcoal canvas, deep
bottle-green brand panels, gold/champagne accents, emerald primary CTAs, elegant serif headings.

**Match `UI Designs/PROFILE.png`.** It shows (top to bottom): the global announcement + trust strip
(global chrome — do **not** rebuild here); a **deep-green header card** with a circular avatar (gold
ring), the user's name (serif), email, and a small **member badge**; a **stats row** of three tiles —
**Orders / Wishlist / Reviews** with counts; a vertical **menu list** of rows, each a rounded surface
with a small **colored square icon** on the left, a label, and a chevron on the right (My Orders,
Addresses, Payment Methods, Store Credit/Wallet, Notifications, Settings); a **Recent Orders** section
with thumbnail rows and a "View All" link; and a full-width **red Logout** button at the bottom.

Tokens to consume (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Brand panel: `--sf-color-brand-green`, `--sf-color-brand-green-deep`, `--brand-logo-bg`;
  gold ring/badge `--sf-color-gold`, `--sf-gradient-gold`, `--sf-color-gold-light`.
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-text`,
  `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`, `--sf-color-border-strong`.
- CTA emerald: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`; logout
  danger `--sf-color-danger`, `--sf-color-danger-bg`. Price gold `--sf-color-price`.
- Colored menu-row icon tiles: the category-accent tokens `--sf-cat-pink`, `--sf-cat-purple`,
  `--sf-cat-orange`, `--sf-cat-blue`, `--sf-cat-teal`, `--sf-cat-red` (one per row, as small filled
  squares).
- Type: `--sf-font-display` for the user name and section titles; `--sf-font-family` for body. Radius/
  space/shadow/motion via the `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`
  scales.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/Profile/Profile.js` — restructure into the header card + stats + menu list +
  recent orders + logout layout; keep all profile/address/password/wallet editing and handlers; add the
  stats + recent-orders data fetch.
- (MODIFY) `src/pages/Profile/Profile.module.css` — full re-skin via `var(--sf-*)` tokens.
- **OUT of scope:** `AuthContext`/`useAuth` internals, `apiService`, `db.json` shapes, the `ReviewModal`,
  and `src/pages/Admin/*`.

## Detailed Requirements
1. **Keep auth + editing logic.** Keep `useAuth()` (`user`, `isAuthenticated`, `isLoading`, `logout`,
   `updateUser`), `useTheme()`, and all existing section logic and handlers: profile edit
   (`handleProfileSave` → `updateUser`), change password (`handlePasswordSubmit` →
   `apiService.auth.changePassword`) with the strength meter + requirements, addresses
   (add/edit/delete/set-default via `updateUser({ addresses })` with the canonical
   firstName/lastName/postalCode shape and single-default invariant), and the wallet section
   (`apiService.wallet.getBalance` + `getTransactions`). These continue to power the editable
   sub-screens — do not change their behavior.
2. **Logged-out guard.** Keep the redirect-to-`/` after `authLoading` settles AND, per the design intent,
   prefer prompting login: when not authenticated (and not loading), show a branded "Sign in to view
   your account" prompt with a **Log In** button that calls `openAuthModal("login")` (add
   `openAuthModal` from `useAuth`), falling back to navigation if the user dismisses. Never flash the
   account UI before the session restore completes.
3. **Header card.** Build a deep-green header card (`--sf-color-brand-green`) containing: a circular
   avatar with a **gold ring** showing `getInitials(user.firstName, user.lastName)` (or the user's photo
   if one exists on the user object); the **name** (`{firstName} {lastName}`) in `--sf-font-display`; the
   **email**; and "Member since {formatDate(user.createdAt, 'medium')}" when `createdAt` exists.
4. **Member badge — authenticity rule.** Only render a **"Premium Member"** gold badge if it is **real
   or derivable** from data (e.g. a truthy `user.isPremium` / `user.membershipTier === 'premium'` /
   `user.tier` flag on the user object). If no such field exists, **do not fabricate it** — instead omit
   the badge, or show a neutral **"Member"** badge (gold-outlined, not implying a paid tier). Decide
   based on the actual user shape; never hardcode "Premium" for everyone.
5. **Stats row (real counts).** Add a three-tile stats row — **Orders**, **Wishlist**, **Reviews** —
   with counts from real data:
   - Orders: `apiService.orders.getByUserId(user.id)` → length (reuse for Recent Orders below).
   - Wishlist: the count from `WishlistContext` (`useWishlist().wishlistItems.length`) — guest or
     logged-in.
   - Reviews: `apiService.reviews.getMine(user.id)` → length.
   Load these once when the user is known; show a small skeleton/`—` while loading and `0` honestly when
   empty. Do not invent counts.
6. **Menu list.** Render a vertical list of rounded rows, each with a small colored icon tile (use the
   `--sf-cat-*` tokens, one per row), a label, and a right chevron:
   - **My Orders** → navigate to `/orders`.
   - **Addresses** → opens the addresses section/editor (existing address logic).
   - **Payment Methods** → opens a payment-methods section. (No payment-method API exists; render an
     honest "No saved payment methods yet" placeholder or omit the row if it would be empty/dead — do not
     fake saved cards.)
   - **Store Credit / Wallet** → opens the wallet section (`apiService.wallet`).
   - **Notifications** → opens a notifications/preferences section (use real `user` preference fields if
     present; otherwise an honest "coming soon"/empty state, not fake toggles that don't persist).
   - **Settings** → opens settings (e.g. change password lives here; theme toggle if appropriate).
   Implement these either as in-page sections (keep the existing section-switch pattern) or sub-routes,
   but keep all existing editable functionality reachable. Each row is a button/link with an
   `aria-label`, visible focus, and ≥44px height.
7. **Recent Orders.** Below the menu, a "Recent Orders" section listing the most recent ~3 orders from
   the `apiService.orders.getByUserId` result (sorted by `createdAt` desc): per row a product thumbnail,
   the order number, date, a small status badge (derive from the order's `paymentStatus`/`shippingStatus`
   like Order History does), and the gold total; a "View All" link → `/orders`. Honest empty state ("No
   orders yet") when the user has none; loading skeleton while fetching.
8. **Logout.** A full-width **red Logout** button at the bottom (`--sf-color-danger`) that runs the
   existing `handleLogout` (SweetAlert2 confirm → `logout()` → navigate `/`). Keep the confirm dialog.
9. **Keep all sub-section editing.** The profile-edit form, address CRUD, password change (+ strength
   meter/requirements), and wallet (balance + transaction history) must all still be reachable and
   functional from the new layout — re-skin them into branded cards/inputs (gold focus ring
   `--sf-shadow-focus`, tokenized inputs), keep their validation and feedback toasts.
10. **No hardcoded hex.** Every color in `Profile.module.css` must be a `var(--sf-*)` token (replace the
    current inline strength-meter hexes with tokens or keep them only in JS where unavoidable — prefer
    tokens). Reuse the nearest token when a precise shade is missing.

## Data / API Notes
- **apiService used:** `orders.getByUserId(userId)` (stats + recent orders), `reviews.getMine(userId)`
  (reviews count), `wallet.getBalance(userId)` + `wallet.getTransactions(userId)` (wallet section), and
  `auth.changePassword({...})` (password). Profile/address writes go through `useAuth().updateUser`.
  Wishlist count comes from `WishlistContext` (`useWishlist`).
- **User shape (read-only except via `updateUser`):** `{ firstName, lastName, email, phone, createdAt,
  addresses:[{ id, label, firstName, lastName, phone, addressLine1, addressLine2?, city, state,
  postalCode, country, isDefault }], ... }`. Membership flags (if any) are read-only — only render the
  Premium badge when such a field is truthy.
- **Helpers:** `getInitials`, `formatDate`, `formatCurrency`, `isValidPhone`, `generateId` from
  `src/utils/helpers.js`.
- No `db.json` changes in this prompt. Do not add fields to users or fabricate membership/payment data.

## Constraints (Do Not Break)
- Keep the account **fully functional & API-driven**: profile/address/password/wallet editing all flow
  through `useAuth().updateUser` and `apiService` exactly as before; stats/recent-orders are read-only
  fetches. **Keep `updateUser` wiring intact.**
- Honor **authenticity > persuasion**: stats, recent orders, wallet, and the member badge must reflect
  REAL data — no fabricated counts, fake "Premium" tier for everyone, fake saved cards, or non-persisting
  toggles. Honest empty/loading states.
- **Re-skin only via `src/theme/storefront-tokens.css` tokens** — no hardcoded hex in
  `Profile.module.css`.
- Preserve the JSON Server ↔ Laravel swap contract and all JSON shapes (no new `fetch`/`axios`).
- Do not modify the admin panel or any `src/pages/Admin/*` file.
- Accessibility: menu rows and the logout button are labelled with visible focus and ≥44px targets; all
  inputs keep `<label>`s; status badges include text. Mobile-first (the design is a single-column mobile
  layout — it must look right on phone widths and scale up gracefully); thumbnails `loading="lazy"`.

## Acceptance Criteria / Definition of Done
- [ ] Page matches `UI Designs/PROFILE.png` on the brand: deep-green header card with gold-ringed avatar,
      serif name, email, and an honest member badge; an Orders/Wishlist/Reviews stats row with **real**
      counts; a colored-icon menu list with chevrons; a Recent Orders list; a red Logout.
- [ ] The member badge only shows "Premium" when a real membership field is truthy; otherwise it is
      omitted or a neutral "Member" badge.
- [ ] Profile edit, address add/edit/delete/set-default, change password (with strength meter), and the
      wallet section all still work and persist via `updateUser`/`apiService`.
- [ ] Menu rows navigate/open the right destinations (My Orders → `/orders`, etc.); Recent Orders "View
      All" → `/orders`; Logout runs the confirm → `logout` → `/` flow.
- [ ] Logged-out users see the login prompt (no flash of account UI); logged-in users see their data.
- [ ] Both themes coherent; no purple/blue boilerplate; no hardcoded hex in `Profile.module.css`; no
      console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`; log in as a seeded user (one with orders, a wishlist, and reviews if possible).
2. Open `/profile`: confirm the green header card (gold-ringed avatar, serif name, email, member badge
   per the authenticity rule), and that the stats row shows real Orders/Wishlist/Reviews counts.
3. Confirm the menu rows open/navigate correctly and Recent Orders lists the latest orders with status +
   gold total; click "View All" → `/orders`.
4. Edit the profile (save) and confirm persistence; add/edit/delete an address and set a default; change
   the password; open the wallet section and confirm balance + transactions load.
5. Click Logout → confirm dialog → logged out and redirected to `/`. Visit `/profile` while logged out →
   login prompt (open the AuthModal), no account-UI flash.
6. Toggle theme; check both modes; resize to mobile and confirm the single-column layout looks right.
7. `npm run build` → clean build, no console errors.
