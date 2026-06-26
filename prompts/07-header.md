<!-- Batch C — Global Layout / Navigation -->
# Prompt 07 — Header

## Objective
Redesign the global storefront `Header` into the Meghali's Silk masthead from the desktop mockup: a
cycling gradient **announcement bar** at the very top, a teal/green **trust strip** band below it, then a
main header row with a hamburger (mobile), the **logo image on a deep-green panel**, a prominent search
bar with an **"AI Search"** button, and right-side actions (wishlist, cart with live badge, account,
theme toggle), plus a **category nav-chips** row. Sticky on scroll, fully responsive, and every existing
handler (logout, cart drawer, search modal, sidebar) keeps working.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house. The header is **dark, gold-on-green, premium**.
Match **`UI Designs/DESKTOP SCREEN VIEW.png`** precisely, top to bottom:
1. Slim gradient **announcement/promo line** (cycling messages).
2. A four-item **trust strip** (7-Day Easy Returns · 100% Money Back · Free Shipping · Authentic Silk).
3. **Main row:** centered gold logo on a deep-green chip, a wide rounded search field with an emerald
   "AI Search" button on its right, and compact icon actions on the far right (wishlist heart, cart with
   a red count badge, account, theme toggle).
4. A **nav-chips row** of category quick-filters (New Arrivals, Bestsellers, Sale, Mega Silk, Bridal).

Consume only tokens from `src/theme/storefront-tokens.css` — never hardcode hex:
- `--brand-logo-bg` (`#0B3B2E`, the logo panel fill), `--sf-color-brand-green`, `--sf-color-gold`,
  `--sf-gradient-gold`, `--sf-color-emerald`/`--sf-color-emerald-hover`/`--sf-color-emerald-contrast`,
  `--sf-color-surface{,-2,-hover}`, `--sf-color-text{,-secondary,-muted}`, `--sf-color-border{,-strong}`,
  `--sf-font-display` (serif), `--sf-font-family`, radii, spacing, shadows, and
  `--sf-z-{sticky,stickybar}` for layering.

**Logo rule:** use the logo image at
`https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`. It ships with its own
deep-green background, so it MUST sit inside a panel/chip filled with `var(--brand-logo-bg)` so it never
looks like a pasted rectangle on a different surface. Give it an `alt` of the brand name, set explicit
width/height to avoid layout shift, and `loading="eager"` (above the fold) but `decoding="async"`.

Shared brand **primitives** already exist and should be reused (do NOT recreate them here):
- `AnnouncementBar` at `src/components/AnnouncementBar` (cycling gradient promo bar; dismissible).
- `TrustStrip` at `src/components/TrustStrip` (the four-item reassurance band).
- Global classes in `src/theme/storefront-primitives.css`: `.sf-btn--emerald`, `.sf-chip` /
  `.sf-chip--active`, etc.

## Scope — Files to Create / Modify
- (MODIFY) `src/components/Header/Header.js` — restructure the markup/logic per the requirements below.
- (MODIFY) `src/components/Header/Header.module.css` — restyle to match the mockup, token-driven.
- **OUT of scope:** do NOT create or restyle `AnnouncementBar`, `TrustStrip`, `SearchModal`,
  `CartDrawer`, `SidebarMenu`, or `AuthModal` (they already exist and are imported). Do NOT change
  routing in `src/App.js`, contexts, or `src/services/api.js`. Do NOT touch the admin panel.

## Detailed Requirements
The current `Header.js` already wires: `useTheme` (isDarkMode, toggleTheme), `useCart`
(getCartItemCount, isCartOpen, setIsCartOpen), `useAuth` (user, isAuthenticated, logout, authModalOpen,
authModalTab, openAuthModal, closeAuthModal), `useWishlist` (getWishlistCount), `useDealsConfig`
(enabled), `apiService.categories.getAll()` into `categories` state (with refetch on window focus),
the user dropdown `Menu`, and renders `<CartDrawer>`, `<SidebarMenu>`, `<AuthModal>`, `<SearchModal>` at
the bottom. **Preserve all of that wiring and the existing handlers** (`handleUserMenuOpen`,
`handleLogout`, `handleCartClick`, `handleSearchClick`, `handleMobileMenuClick`, `handleCategoryClick`).
Reuse the existing `useMediaQuery` breakpoints (`isMobile` ≤768, `isTablet` ≤1024).

1. **Announcement bar (very top).** Replace the current `topBar` (the "Free delivery…/Help Center/Track
   Order" strip, ~lines 156–189) with the shared `<AnnouncementBar />` component (import from
   `../AnnouncementBar`). It cycles its own messages and is dismissible — pass no props (defaults) or a
   `className` if you need to position it. It should be the first child of the header.
2. **Trust strip band.** Directly below the announcement bar, render the shared `<TrustStrip />`
   (import from `../TrustStrip`). On mobile you may hide it (`isMobile`) to save vertical space, or keep
   a compact version — match the design (desktop shows all four). Use a token-driven wrapper.
3. **Main header row.**
   - Keep the **hamburger** `IconButton` on mobile (`isMobile`) wired to `handleMobileMenuClick` (opens
     `SidebarMenu`); `aria-label="Open menu"`, ≥44px.
   - **Logo:** replace the current icon+text logo (the `ShoppingCart` glyph + `APP_NAME` span, ~lines
     205–217) with the **logo image inside a deep-green panel** (`background: var(--brand-logo-bg)`,
     rounded `--sf-radius-md`, small inset padding). Wrap it in the existing `<Link to="/">`. Keep the
     subtle Framer Motion hover/tap scale. Provide `alt={APP_NAME}` and fixed dimensions.
   - **Search bar (desktop/tablet, `!isMobile`):** a prominent rounded field that opens the search modal
     on click (`handleSearchClick`, which sets `searchModalOpen`). Show a placeholder
     `"Search for silk sarees, suits, dupattas..."`. On the right end render an **"AI Search"** button
     styled like an emerald CTA (you may reuse `.sf-btn--emerald` or a local class consuming the same
     tokens) with a small AI/sparkle icon (MUI `AutoAwesome`) + the label "AI Search". The whole bar and
     the button both invoke `handleSearchClick`. Keep it keyboard-focusable (`role="search"` wrapper,
     button `aria-label="Open AI search"`).
   - **Mobile:** collapse the inline search bar; keep a search `IconButton` in the actions cluster that
     calls `handleSearchClick` (as today).
4. **Right-side actions** (keep existing order/handlers, restyle to match):
   - **Theme toggle** — keep `toggleTheme`; show it on desktop/tablet (and it can live in the account
     cluster on mobile or the sidebar). `aria-label="Toggle theme"`, swap `Brightness7`/`Brightness4`.
   - **Account** — keep `handleUserMenuOpen` (opens the MUI `Menu` when authenticated, else
     `openAuthModal("login")`) and the existing dropdown `Menu` items (My Profile `/profile`, My Orders
     `/orders`, My Wishlist `/wishlist`, Logout via `logout()` then navigate `/`; logged-out → Login /
     Register). Keep the avatar/initials treatment.
   - **Wishlist** — keep the `IconButton` → `navigate("/wishlist")` wrapped in a `Badge` with
     `badgeContent={wishlistCount}` (from `getWishlistCount()`), `max={99}`.
   - **Cart** — keep the `IconButton` → `handleCartClick` (`setIsCartOpen(true)`) wrapped in a `Badge`
     with `badgeContent={cartCount}` (from `getCartItemCount()`), `max={99}`. Style the badge with the
     red/discount token so the count reads clearly.
   - All action icons ≥44px, `:focus-visible` rings, `aria-label`s preserved.
5. **Category nav-chips row.** Replace the old `navBar` "All Categories" dropdown + plain text links
   (~lines 363–439) with a horizontally-scrollable **chips** row (desktop/tablet). Render chips for
   **New Arrivals, Bestsellers, Sale, Mega Silk, Bridal**, binding each to real data where possible:
   - Fetch is already done into `categories` via `apiService.categories.getAll()`. Map chip labels to
     real categories/tags: e.g. "Bridal" → a matching category slug if present
     (`/products?category=<slug>`), "Sale" → `/products?sort=...` or a sale/deal deep-link, "New
     Arrivals" → `/products?sort=newest`, "Bestsellers" → `/products?sort=popular`. Use
     `categoryParam(cat)` (already imported from `../../utils/categories`) when linking to a real
     category. Where no matching category/tag exists, fall back to a sensible `/products?...` query (do
     not render a dead link). You MAY keep an "All Categories" affordance, but the primary visual is the
     chips row per the design.
   - Use the shared `.sf-chip` styling (active state `.sf-chip--active` reflects the current route/query
     when it matches). Chips scroll horizontally on overflow; on mobile this row collapses (handled by
     the sidebar instead).
   - Keep the deals link behavior: if `dealsEnabled` (from `useDealsConfig`), a "Today's Deals" /
     "Sale" chip may point at `/special-offers`; hide it when deals are disabled.
6. **Sticky behavior.** Make the header `position: sticky; top: 0;` (or fixed) with the proper z-index
   (`var(--sf-z-sticky)`/`--sf-z-stickybar`) so it stays on scroll. Keep/adjust the existing
   `headerSpacer` so page content is never hidden behind the header — recompute its height for the new
   layout (announcement + trust + main + chips on desktop; less on mobile). Optionally add a subtle
   elevation/shadow once scrolled.
7. **Responsiveness.** Desktop: full search bar + chips + all actions. Tablet: search bar persists,
   chips scroll, top trust strip may compact. Mobile: hamburger + logo + search icon + cart + account;
   inline search and chips collapse; cart and account always remain reachable. Use the existing
   `isMobile`/`isTablet` flags.
8. **Modals/drawers (unchanged).** Keep rendering `<CartDrawer open={isCartOpen} ... />`,
   `<SidebarMenu open={sidebarOpen} ... onOpenAuth={...} />`, `<AuthModal ... />`, and
   `<SearchModal open={searchModalOpen} ... />` exactly as today (only their trigger styling changes).

## Data / API Notes
- Data sources stay the same: `CartContext` (`getCartItemCount`), `WishlistContext`
  (`getWishlistCount`), `AuthContext` (`user`, `isAuthenticated`, `logout`, `openAuthModal`),
  `apiService.categories.getAll()` (already active, returns active categories sorted by `sortOrder`),
  `useDealsConfig().enabled`, and constants `APP_NAME` / `FREE_SHIPPING_THRESHOLD` from
  `src/utils/constants.js`.
- Do **not** add any `fetch`/`axios` — all category data flows through `apiService` (already wired).
- `db.json` shapes are unchanged. Category objects expose `name`, `slug`, `parentId`, `isActive`,
  `sortOrder`, `showInMainMenu`, `menuOrder`; use `categoryParam(cat)` for the link param. If a "Bridal"
  / "Mega Silk" chip should map to a real category, it depends on the catalog seeded by the data
  prompts; until then, fall back to a `tag`/`sort` query so the chip is never a dead link.
- Preserve the JSON Server ↔ Laravel swap contract (no direct API calls, only `apiService`).

## Constraints (Do Not Break)
- Keep the header fully functional and API-driven: cart drawer opens, search modal opens, sidebar opens,
  account menu + logout work, wishlist/cart badges reflect live counts.
- Re-skin only via `src/theme/storefront-tokens.css` tokens and the shared `storefront-primitives.css`
  classes — **no hardcoded hex** in `Header.js`/`Header.module.css`.
- The logo image must sit on a `var(--brand-logo-bg)` panel (the logo rule), with `alt`, fixed
  dimensions, and lazy/eager decoding as specified.
- Do not modify the admin panel, `src/App.js` routing, contexts, or `src/services/api.js`.
- Reuse the existing `AnnouncementBar` and `TrustStrip` components; do not duplicate their logic in the
  header.
- Accessibility: `role="search"` on the search wrapper, `aria-label`s on all icon buttons, `aria-current`
  on the active chip, ≥44px targets, visible `:focus-visible` rings. Mobile-first/responsive.

## Acceptance Criteria / Definition of Done
- [ ] Header visually matches `UI Designs/DESKTOP SCREEN VIEW.png`: announcement bar → trust strip →
      main row (logo-on-green + search + AI Search button + actions) → category chips row.
- [ ] The logo renders as the Cloudinary image on a deep-green (`--brand-logo-bg`) panel, with no
      mismatched-rectangle look, and links to `/`.
- [ ] "AI Search" button and the search field both open the existing `SearchModal`; the mobile search
      icon still opens it.
- [ ] Cart badge shows the live `getCartItemCount()`; wishlist badge shows `getWishlistCount()`; clicking
      cart opens the `CartDrawer`; clicking wishlist navigates to `/wishlist`.
- [ ] Account menu opens for logged-in users (Profile/Orders/Wishlist/Logout) and `openAuthModal("login")`
      for guests; Logout logs out and routes home. Theme toggle still flips dark/light.
- [ ] Category chips link to real `/products?...` routes (no dead links); deals chip hidden when
      `dealsEnabled` is false; active chip reflects the current route.
- [ ] Header is sticky on scroll and the spacer prevents content from hiding behind it at desktop,
      tablet, and mobile widths.
- [ ] Dark + light themes both coherent; no console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev` and open `/`.
2. Confirm the announcement bar cycles and is dismissible, the trust strip shows four items, and the
   logo sits on a green panel.
3. Click the search field and the "AI Search" button → the search modal opens; on mobile width the
   inline search collapses and the search icon opens it.
4. Add a product to the cart → header cart badge increments and clicking it opens the cart drawer; add a
   wishlist item → wishlist badge increments and clicking it routes to `/wishlist`.
5. Log in / out via the account menu; confirm Logout returns to `/`. Toggle the theme and confirm
   coherence; reload to confirm no flash.
6. Click each category chip → lands on a real `/products?...` page (none redirect to `/`). Disable deals
   (DealsConfig) and confirm the deals/sale-to-offers chip disappears.
7. Resize to 360px, 768px, 1024px, and ≥1280px → layout adapts; cart/account always reachable; chips
   scroll without clipping.
8. `npm run build` → clean.
