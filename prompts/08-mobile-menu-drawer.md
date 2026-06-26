<!-- Batch C — Global Layout / Navigation -->
# Prompt 08 — Mobile Menu Drawer

## Objective
Redesign the slide-out mobile navigation drawer (`SidebarMenu`) into the Meghali's Silk "Menu / Account
& Settings" panel from the mockup: a dark, green/gold-accented drawer with the **logo on a deep-green
panel** and a compact trust strip at the top, primary items (Profile, Contact Us, Settings), category
navigation, and account actions (sign in / logout) — all API-driven, accessible as a dialog, and keeping
its existing open/close props and handlers.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house; the drawer is **dark with green/gold accents**.
Match **`UI Designs/MENU.png`**: a left slide-out panel headed "Menu" with an "Account & Settings"
subtitle, the brand logo at the top, a slim trust row, and a vertical list whose first three rows are
**Profile**, **Contact Us**, and **Settings** (each with an icon and a left accent), over a dark
overlay that dims the page behind it.

Consume only tokens from `src/theme/storefront-tokens.css` — never hardcode hex:
- `--brand-logo-bg` (`#0B3B2E`, logo panel), `--sf-color-brand-green`, `--sf-color-gold`,
  `--sf-gradient-gold`, `--sf-color-emerald`, `--sf-color-surface{,-2,-hover}`,
  `--sf-color-text{,-secondary,-muted}`, `--sf-color-border{,-strong}`, `--sf-color-overlay`,
  `--sf-font-display`, radii, spacing, shadows, `--sf-z-overlay`/`--sf-z-modal`, `--sf-tap-target`.

**Logo rule:** render the logo image at
`https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png` inside a panel filled
with `var(--brand-logo-bg)` so it never floats on a different surface. Provide `alt={APP_NAME}`, fixed
dimensions, and `loading="lazy"`.

Reuse the shared **trust strip** primitive at `src/components/TrustStrip` (compact variant) rather than
re-implementing it. Shared classes in `src/theme/storefront-primitives.css` (`.sf-btn--*`, `.sf-chip`)
are available.

## Scope — Files to Create / Modify
- (MODIFY) `src/components/SidebarMenu/SidebarMenu.js` — restructure header/hero, top items, and styling.
- (MODIFY) `src/components/SidebarMenu/SidebarMenu.module.css` — restyle to match the mockup, token-driven.
- **OUT of scope:** do NOT change the `Header` that mounts this drawer, `src/App.js`, contexts, or
  `src/services/api.js`. Do NOT recreate `TrustStrip`. Do NOT touch the admin panel.

## Detailed Requirements
The current `SidebarMenu.js` already implements: props `{ open, onClose, onOpenAuth }`; `useTheme`
(isDarkMode, toggleTheme), `useAuth` (user, logout), `useDealsConfig` (enabled); lazy
`apiService.categories.getAll()` when the category section expands; a parent→children category index;
**body-scroll-lock** while open; **Escape-to-close** + focus-move into the panel; Framer Motion backdrop
+ panel slide; `role="dialog" aria-modal="true"`; and sections for Discover (quick links), Shop by
Category, My Account (Orders/Wishlist/Profile/Logout), and Settings (Help & Support, theme toggle).
**Preserve all of that behavior and the handlers** (`handleNavigate`, `handleSignIn`, `handleLogout`,
`toggleCat`, `renderDescendants`, the category fetch effect, scroll-lock, Escape handling).

1. **Header / hero of the drawer.** Restyle the top area (`hero`, ~lines 305–362) to match the mockup:
   - Title **"Menu"** with a secondary line **"Account & Settings"** (use `--sf-font-display` for the
     title, muted token for the subtitle), and the existing close button (`onClose`,
     `aria-label="Close menu"`, ≥44px).
   - Replace the current `ShoppingCartRounded` brand icon + `APP_NAME` text with the **logo image on a
     `var(--brand-logo-bg)` panel** (the logo rule). Keep the brand name accessible via the image `alt`.
   - Below the logo, render a **compact `<TrustStrip />`** (import from `../TrustStrip`) — a slim,
     condensed variant (you may pass a `className` for compact spacing). It must not overflow the drawer
     width.
   - Keep the existing **user card / guest block**: when `user` exists, the tappable card → `/profile`
     (avatar/initials, name, email); when guest, the "Welcome / Sign in" block → `handleSignIn`
     (`onOpenAuth`). Restyle with green/gold accents.
2. **Primary items (top of the list).** Add/reorder a primary section so the **first three rows** are,
   in order, matching the design:
   - **Profile** → `handleNavigate("/profile")` (icon: `PersonOutline`).
   - **Contact Us** → `handleNavigate("/support")` (icon: e.g. `HeadsetMicOutlined` or `MailOutline`).
   - **Settings** → a Settings affordance. Since there is no dedicated `/settings` route, "Settings"
     should group the existing **theme toggle** and preferences (you may make "Settings" expand to
     reveal the theme toggle and Help links, or keep the theme toggle inline beneath it). Do NOT invent a
     `/settings` route or a dead link.
   Each row is ≥`var(--sf-tap-target)` tall, has an icon with a tinted chip, a label, and a chevron/arrow
   affordance, and a clear `:focus-visible` ring.
3. **Category navigation (keep & restyle).** Keep the lazy "Shop by Category" expander that fetches
   `apiService.categories.getAll()` and renders the parent→children tree (`renderDescendants`,
   `Shop all <cat>`, `View all products` → `/products`). Restyle the parent/child rows and chevrons with
   brand tokens; keep single-open behavior (`expandedCat`) and `categoryParam(cat)` links to
   `/products?category=...`.
4. **Account actions (keep & restyle).** Keep My Orders (`/orders`), My Wishlist (`/wishlist`), My
   Profile (`/profile`), and the **Logout** row (only when `user`; calls `logout()` then navigates `/`).
   For guests, the sign-in path stays via the hero "Sign in" block (`onOpenAuth`). Restyle with the
   danger token on Logout.
5. **Settings / preferences (keep & restyle).** Keep Help & Support (`/support`) and the **theme toggle**
   (`toggleTheme`, `role="switch" aria-checked={isDarkMode}`). Keep the small footer links (Terms
   `/terms`, Privacy `/privacy`) and the `© year APP_NAME` line. Restyle with tokens.
6. **Row anatomy & dimensions (concrete).** Every list row is a full-width button/link, min-height
   ≥`var(--sf-tap-target)` (44px), laid out as: a leading **icon chip** (~36–40px rounded square with a
   tinted background — gold/emerald/neutral per row), the **label** (`--sf-font-family`,
   `--sf-text-sm/base`, `--sf-color-text`), a flexible spacer, and a trailing chevron/arrow or count.
   Rows separated by hairline `--sf-color-border` dividers or section gaps. Hover/press → faint
   `--sf-color-surface-hover`; the danger Logout row tints its icon chip with the danger token. Panel
   width ~`min(86vw, 380px)`; the hero (logo panel + trust strip + user card) is fixed at the top while
   the rest scrolls.
7. **Theming, motion, a11y (keep & verify).**
   - Drawer must remain **dark-themed** with green/gold accents; honor `body.dark`/`body.light` purely
     through tokens (the existing `data-theme={themeAttr}` attribute may stay, but colors come from
     tokens).
   - Keep `role="dialog" aria-modal="true"` with an `aria-label` (e.g. `${APP_NAME} menu`), the
     **backdrop** (click + overlay close), **ESC close**, and **body-scroll-lock**. Ensure focus moves
     into the panel on open (already implemented) and that all rows are keyboard-reachable with visible
     focus.
   - Keep the Framer Motion slide-in/out; respect `prefers-reduced-motion` (reduce/disable the
     transform animation gracefully — you may add a reduced-motion CSS guard).
   - All interactive rows/buttons ≥44px; logo image lazy-loaded.

## Data / API Notes
- Data sources unchanged: `AuthContext` (`user`, `logout`, plus `onOpenAuth` from the Header to open the
  auth modal), `useDealsConfig().enabled` (drops the Special Offers quick link when deals are off),
  `apiService.categories.getAll()` (lazy, returns active categories sorted by `sortOrder`), `APP_NAME`
  from `src/utils/constants.js`.
- Do NOT add `fetch`/`axios` — categories flow through `apiService` only. `db.json` shapes unchanged.
- Category objects expose `name`, `slug`, `parentId`, `isActive`, `sortOrder`; use `categoryParam(cat)`
  (already imported from `../../utils/categories`) for links. Preserve the JSON Server ↔ Laravel swap
  contract.

## Constraints (Do Not Break)
- Keep the drawer fully functional and API-driven: navigation, category fetch/expand, sign-in/logout,
  theme toggle, and the open/close props (`open`, `onClose`, `onOpenAuth`) all work unchanged.
- Re-skin only via tokens / shared primitive classes — **no hardcoded hex** in `SidebarMenu.js`/
  `SidebarMenu.module.css`.
- The logo image must sit on a `var(--brand-logo-bg)` panel (the logo rule).
- Reuse the shared `TrustStrip` component (compact); do not duplicate it.
- Do not add a `/settings` route or any dead link; "Settings" groups existing preferences only.
- Do not modify the admin panel, `src/App.js`, contexts, or `src/services/api.js`.
- Accessibility: `role="dialog" aria-modal`, backdrop + ESC + overlay close, body-scroll-lock,
  focus-into-panel, ≥44px rows, visible `:focus-visible` rings, `prefers-reduced-motion` path.

## Acceptance Criteria / Definition of Done
- [ ] Opening the mobile menu shows a left slide-out drawer matching `UI Designs/MENU.png`: "Menu" +
      "Account & Settings" header, the logo on a deep-green panel, a compact trust strip, then
      Profile / Contact Us / Settings as the first three rows.
- [ ] Profile → `/profile`, Contact Us → `/support`; Settings exposes the theme toggle (and Help)
      without any dead `/settings` link.
- [ ] "Shop by Category" lazy-loads categories via `apiService.categories.getAll()`, expands the
      parent/child tree, and each link goes to a real `/products?category=...` route.
- [ ] Account actions (Orders/Wishlist/Profile/Logout) and the guest "Sign in" path work; Logout returns
      to `/`; theme toggle flips dark/light.
- [ ] Drawer is dark with green/gold accents; backdrop click, overlay, and ESC close it; body scroll is
      locked while open; focus moves into the panel; tabbing shows visible focus rings.
- [ ] No hardcoded hex; dark + light coherent; no console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`, narrow the viewport to mobile (≤768px), and tap the header hamburger to open the
   drawer.
2. Confirm the header reads "Menu / Account & Settings", the logo sits on a green panel, and a compact
   trust strip shows beneath it.
3. Tap Profile → `/profile`; tap Contact Us → `/support`; open Settings and toggle the theme → page
   switches dark/light. Confirm no "Settings" link 404s/redirects.
4. Expand "Shop by Category" → categories load; tap a child → lands on `/products?category=...`.
5. As a guest, tap "Sign in" → the auth modal opens; log in, reopen the drawer → user card shows; tap
   Logout → returns to `/`.
6. Press ESC, click the backdrop, and click the close button → each closes the drawer; confirm the page
   behind cannot scroll while it is open.
7. Tab through every row → visible focus rings, all targets ≥44px. With `prefers-reduced-motion: reduce`
   set, the slide animation is reduced/disabled.
8. `npm run build` → clean.
