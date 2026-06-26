<!-- Batch C — Global Layout / Navigation -->
# Prompt 09 — Bottom Navigation

## Objective
Redesign the mobile-only bottom tab bar (`BottomNav`) into the Meghali's Silk navigation dock seen in the
mockups: Home · Categories · Search (center, emphasized) · Wishlist (with live badge) · Account, with a
gold/emerald active-state highlight, dark glass surface, ≥44px targets, and ARIA — while keeping its
existing routing and context wiring and staying hidden on desktop.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house; the dock is **dark with gold/emerald accents**.
Match the floating bottom bar visible in **`UI Designs/HOME PAGE HIDE FOOTER.png`**,
**`UI Designs/WISHLIST.png`**, and **`UI Designs/DESKTOP SCREEN VIEW.png`** (where it appears on the
mobile/narrow composition): a rounded dark bar pinned to the bottom with five icon+label tabs, the
active tab highlighted in gold/emerald, and a visually emphasized center action.

Consume only tokens from `src/theme/storefront-tokens.css` — never hardcode hex:
- `--sf-color-gold`, `--sf-gradient-gold`, `--sf-color-emerald`/`--sf-color-emerald-contrast`,
  `--sf-color-brand-green`, `--sf-color-surface{,-2}`, `--sf-color-text{,-secondary,-muted}`,
  `--sf-color-border{,-strong}`, `--sf-color-discount` (badge), radii, spacing, shadows,
  `--sf-z-sticky`, `--sf-tap-target`. Use `--sf-font-family` for labels.

(The logo is not used in the bottom nav, so the logo-bg rule does not apply here.)

## Scope — Files to Create / Modify
- (MODIFY) `src/components/BottomNav/BottomNav.js` — tab set, routing, active-state, center emphasis.
- (MODIFY) `src/components/BottomNav/BottomNav.module.css` — restyle to match the mockups, token-driven.
- **OUT of scope:** do NOT change `src/App.js`, the `Header`, `SearchModal`, contexts, or
  `src/services/api.js`. Do NOT touch the admin panel.

## Detailed Requirements
The current `BottomNav.js` already implements: a `NAV_ITEMS` array (Home `/`, Categories `/products`,
Search `null`→opens modal, Wishlist `/wishlist`, Account `/profile`); `useNavigate`/`useLocation`;
`useTheme` (isDarkMode); `useWishlist` (`getWishlistCount`); a **hide-on-scroll-down / show-on-scroll-up**
effect; an `getActiveKey()` route matcher; `handleNavClick` (opens `SearchModal` for the search tab,
else navigates); and renders `<SearchModal open={searchOpen} ... />`. **Preserve all of that behavior.**

1. **Tabs (keep five, restyle).** Keep the five tabs in this order: **Home** (`/`), **Categories**
   (`/products`), **Search** (center — opens `SearchModal`), **Wishlist** (`/wishlist`, with badge),
   **Account** (`/profile`). The Account tab should route guests to sign-in cleanly: it is acceptable to
   keep `/profile` (the Profile page handles unauthenticated users), OR route via the auth modal if a
   handler is available — but do NOT introduce a dead route. (Search has `path: null` and must keep
   opening the modal via `handleNavClick`.)
2. **Routing via react-router.** Use react-router for navigation. Prefer migrating the route-backed tabs
   (Home, Categories, Wishlist, Account) to `NavLink` from `react-router-dom` so the active class is
   handled by the router, OR keep the existing `getActiveKey()` + `navigate()` approach — either is fine,
   but the **Search** tab must remain a button that opens the modal (NavLink is only for real routes).
   Set `aria-current="page"` on the active tab (NavLink does this automatically when you map its
   `isActive` to the active class).
3. **Active state.** The active tab is highlighted with a **gold/emerald** treatment per the designs:
   e.g. icon + label switch to `var(--sf-color-gold)` (or emerald), with an optional pill/indicator
   behind the active icon using a gold/emerald tint. Inactive tabs use `--sf-color-text-secondary`/
   `--sf-color-text-muted`. Keep the active-key matching consistent with the current
   `getActiveKey()` rules (`/products` and `/products/...` → Categories, etc.).
4. **Center emphasis (optional but encouraged).** The center **Search** action may be visually
   emphasized — a slightly larger, raised circular button with a gold/emerald gradient
   (`var(--sf-gradient-gold)` or emerald) and the search icon — consistent with the dock look in the
   designs. Keep its ≥44px hit area and `aria-label="Search"`.
5. **Wishlist badge.** Keep the count badge on the Wishlist tab driven by `getWishlistCount()` from
   `WishlistContext` (show `99+` when over 99). Style it with the discount/red token so it reads against
   the dark dock. Only render the badge when the count > 0.
6. **Surface & layout.** Render a rounded dark bar (`--sf-color-surface` / `--sf-color-surface-2`, with
   a `--sf-color-border` hairline and `--sf-shadow-lg`), optionally floating with a small bottom margin
   to match the mockups. Distribute the five tabs evenly; labels sit under the icons in `--sf-text-xs`.
   Keep the existing **hide-on-scroll-down / show-on-scroll-up** animation (translateY) and respect
   `prefers-reduced-motion` (snap instead of animating).
7. **Icons (keep the MUI set, refine for silk).** The current tabs use `HomeOutlined`,
   `GridViewOutlined`, `Search`, `FavoriteBorder`, `PersonOutline` from `@mui/icons-material`. Keep these
   (or swap to closely-equivalent outlined glyphs) and size them consistently (~24px). The active tab may
   switch its icon to the filled variant (e.g. `Home`, `Favorite`, `Person`) for extra emphasis — keep it
   subtle and consistent across tabs.
8. **Dimensions & spacing (concrete).** Dock height ~`64px` content (plus safe-area: add
   `padding-bottom: env(safe-area-inset-bottom)` so it clears the iOS home indicator). Each tab is a
   flex column (icon over label), evenly distributed (`flex: 1`), with a ≥`var(--sf-tap-target)` (44px)
   touch area even though the visual icon is smaller. Labels in `--sf-text-xs`, `--sf-font-medium`,
   truncate gracefully. The optional center Search button may sit ~8–12px raised above the bar with a
   circular `var(--sf-gradient-gold)`/emerald fill and `--sf-shadow-md`. Use `--sf-radius-xl`/`-lg` for
   the bar corners.
9. **Mobile-only.** The dock must be **hidden on desktop** (≥ the storefront breakpoint, e.g. ≥768px or
   1024px — match the breakpoint already used for `BottomNav` so it doesn't double up with the desktop
   header nav). Use a CSS media query (`@media (min-width: ...) { display: none }`), not just opacity.
   Ensure it never overlaps page content awkwardly — pages already account for it; do not change page
   padding here.
10. **State matrix (verify each).** For every tab confirm the four visual states render correctly and are
    token-driven: **default** (muted icon+label), **active** (gold/emerald icon+label + indicator,
    `aria-current="page"`), **hover/press** (subtle surface-hover tint or scale), and **focus-visible**
    (`var(--sf-shadow-focus)` ring). The Wishlist tab additionally shows its count badge.
11. **Accessibility.** Each tab is a real `<a>`/`NavLink` (route tabs) or `<button>` (Search) with an
    `aria-label`, `aria-current="page"` on the active route tab, ≥44px target, and a visible
    `:focus-visible` ring. Icons are `aria-hidden`; labels provide the accessible text.

## Data / API Notes
- Data sources unchanged: `WishlistContext` (`getWishlistCount`), `ThemeContext` (`isDarkMode`),
  react-router (`useNavigate`/`useLocation`/`NavLink`), and the already-imported `SearchModal`.
- No `apiService` calls and no `db.json` changes in this prompt. Preserve the JSON Server ↔ Laravel swap
  contract (no direct API calls).

## Constraints (Do Not Break)
- Keep navigation and the search modal working; Wishlist badge stays bound to live `getWishlistCount()`.
- Re-skin only via tokens — **no hardcoded hex** in `BottomNav.js`/`BottomNav.module.css`.
- Keep the dock **mobile-only** (hidden on desktop via media query) and keep the existing hide/show on
  scroll.
- Do not modify the admin panel, `src/App.js`, the `Header`, `SearchModal`, contexts, or
  `src/services/api.js`.
- Accessibility: `NavLink`/buttons with `aria-label`, `aria-current="page"` on the active tab, ≥44px
  targets, visible `:focus-visible` rings, `prefers-reduced-motion` path. Mobile-first.

## Acceptance Criteria / Definition of Done
- [ ] On mobile, a dark rounded bottom dock shows Home · Categories · Search (emphasized center) ·
      Wishlist · Account, matching `UI Designs/HOME PAGE HIDE FOOTER.png` / `WISHLIST.png`.
- [ ] The active tab is highlighted in gold/emerald and carries `aria-current="page"`; inactive tabs are
      muted.
- [ ] Home → `/`, Categories → `/products`, Wishlist → `/wishlist`, Account → `/profile` (no dead
      route); the center Search tab opens the existing `SearchModal`.
- [ ] Wishlist badge reflects `getWishlistCount()` (shows `99+` past 99) and only appears when count > 0.
- [ ] The dock hides on desktop (≥ breakpoint) via media query and keeps the hide-on-scroll-down /
      show-on-scroll-up behavior.
- [ ] No hardcoded hex; dark + light coherent; no console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`, set the viewport to mobile (≤768px), open `/`.
2. Confirm the bottom dock renders with five tabs and an emphasized center Search; the active tab
   (Home) is highlighted gold/emerald.
3. Tap Categories → `/products` (tab activates); tap Wishlist → `/wishlist` (badge visible if items
   exist); tap Account → `/profile`; tap the center Search → the search modal opens.
4. Add a wishlist item → the badge count updates; remove all → the badge disappears.
5. Scroll down → the dock hides; scroll up → it reappears.
6. Resize to desktop width → the dock is gone (no overlap with the header nav).
7. Tab through the dock → visible focus rings, ≥44px targets, `aria-current` on the active tab. Toggle
   the theme → dock stays coherent.
8. `npm run build` → clean.
