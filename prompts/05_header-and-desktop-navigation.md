# Header & Desktop Navigation — the Editorial Masthead

**Prompt 5 of 30**

## Depends on

Prompt 01 (tokens), Prompt 03 (primitives: `sf-btn`, `sf-chip`). Prompt 02 (seed categories) strongly recommended so the category nav shows the real Assamese-silk tree.

## Context

Meghali's Silk — Assamese-silk boutique storefront being redesigned into a warm-minimalist editorial luxury DTC experience (light, golden-logo-keyed `--sf-*` tokens). The current header is a busy marketplace stack (rotating gradient announcement bar → trust strip → logo-on-green-panel row with an "AI Search" button → category chips). Logos: light `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png` · white `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png` — light logo on light surfaces.

## Objective

Rebuild the masthead into a calm, structurally different editorial navigation: one quiet utility line, a spacious logo/nav/actions row over a hairline rule, and an API-driven primary category nav — while every existing behavior (overlay wiring, badges, theme toggle, deals gating, scroll behavior) keeps working identically.

## Scope — files/areas to touch

- `src/components/Header/Header.js` + `Header.module.css`
- `src/components/AnnouncementBar/AnnouncementBar.js` + `AnnouncementBar.module.css` (+ its `index.js` barrel untouched)
- `src/components/TrustStrip/TrustStrip.js` + `TrustStrip.module.css` (restyle; it is also consumed by `SidebarMenu` — keep its props `({ items, className })`)
- No other component (SidebarMenu/BottomNav/SearchModal/CartDrawer/AuthModal have their own prompts and keep their current APIs).

## Brand & design requirements

1. **Structure (desktop ≥1024px)** — visibly different from the current stack:
   - Row 1 — utility hairline: `AnnouncementBar` redesigned as a single quiet ink-on-ivory (or ivory-on-ink) line, small tracked uppercase, message rotation kept but as a slow crossfade; the three loud `--sf-gradient-announce-*` backgrounds are dropped in favor of one calm treatment (tokens were already recolored in Prompt 01). Dismiss button + `localStorage["sf_announcement_dismissed"]` persistence + hover/focus pause + reduced-motion behavior all preserved.
   - Row 2 — masthead: the light logo rendered DIRECTLY on the ivory surface (delete the `.logoPanel` green box and its `--brand-logo-bg` background; transparent-bg Cloudinary light logo, explicit width/height, `loading="eager"`), generous height (~72–88px), actions right-aligned as thin-line icon buttons.
   - Row 3 — primary nav under a 1px hairline: replace the "chips" row with tracked-uppercase text links. Data-driven: main-menu categories via the existing `apiService.categories.getAll()` fetch + `getMainMenuCategories` ordering (import from `src/utils/categories.js`), plus the curated links that exist today — New Arrivals (`/products?sort=newest`), Bestsellers (`?sort=popular`), Sale (`?sort=discount`), and **Today's Deals → `/special-offers` only when `useDealsConfig().enabled`**. Active state = gold underline (keep the `isChipActive`-style path+query matching). An optional hover "collection panel" (image + child links) may be added if restrained.
   - On scroll: keep the sticky header + `scrolled` state; treat it as a subtle elevation/hairline change, not a shadow pop.
2. **Search affordance:** replace the fake input + separate "AI Search" gold button with ONE honest, elegant affordance (an outlined search field-button or icon+label "Search") that opens `SearchModal` via the existing `searchModalOpen` state. Remove the "AI" claim — nothing AI-powered exists behind it.
3. **Actions:** wishlist (badge, `max={99}`), cart (badge, opens drawer via `setIsCartOpen(true)`), account (initial-avatar menu when authed / `openAuthModal("login")` for guests), theme toggle — all preserved with their exact handlers. The MUI `Menu` user dropdown stays MUI (restyle via the theme/sx to editorial: ivory, hairline, no glow).
4. **Mobile (≤768px):** keep the compact single row (hamburger → `SidebarMenu`, logo, search icon, cart, account) — refined spacing/iconography only; SidebarMenu/BottomNav redesign is Prompt 06.
5. **TrustStrip:** restyle as a hairline "promises" line (small icons + tracked labels: returns / authenticity / shipping / support from its `TRUST_ITEMS`). You may relocate it out of the sticky header (e.g. render it only where pages place it) BUT the component must keep rendering correctly in `SidebarMenu`'s hero, which also consumes it.

## Functional guardrails

1. Preserve all functionality & the API contract: category fetch (`apiService.categories.getAll()` on mount + window `focus` refetch), `useDealsConfig().enabled` gating, cart/wishlist counts from `useCart`/`useWishlist`, `toggleTheme`, logout flow, and the four overlay mounts at the bottom of Header.js — `<CartDrawer open={isCartOpen} …/>`, `<SidebarMenu open={sidebarOpen} … onOpenAuth/>`, `<AuthModal open={authModalOpen} defaultTab={authModalTab}/>`, `<SearchModal open={searchModalOpen}/>` — must remain mounted with the same props/state sources.
2. Consume tokens/primitives only (`--sf-*`, `sf-btn`, `sf-chip` or module classes); no hardcoded hex/fonts.
3. Do NOT modify the admin panel.
4. Brand: light logo on light header (white logo would be wrong here); logo links to `/`; no green logo panel anywhere in the header.
5. Responsive + accessible: sticky header ≤~120px total on desktop, compact on mobile; all controls keyboard-reachable with visible focus; nav is `<nav>` with meaningful `aria-label`s; badges have accessible text; `@media print` hiding kept.
6. No fabricated trust signals: TrustStrip copy is store-attested policy (fine); do not add "N people viewing" or similar.
7. Test before done: full nav click-through + admin regression.

## Implementation notes

- Header.js is the app's overlay switchboard — refactor markup freely but keep every `useState`/context wire intact. `useMediaQuery("(max-width:768px)")` / `(max-width:1024px)` breakpoints already exist; reuse.
- Category links go to `/products?category=${categoryParam(cat)}` (slug scheme from `src/utils/categories.js`).
- The curated chips currently bind "Mega Silk"/"Bridal" to live categories by regex with search fallbacks — rebind these curated slots to the NEW seed categories (e.g. Mekhela Chador, Bridal) after verifying slugs in `db.json`.
- Keep MUI imports working (`IconButton, Badge, Avatar, Menu, MenuItem`); thin-stroke icon look can come from styling, or swap individual `@mui/icons-material` glyphs — do not add new icon libraries.
- Sizes: serve the Cloudinary logo at 2× for retina (Cloudinary `w_` transform allowed) with fixed CSS height (~40–48px desktop, 32–36px mobile).

## Acceptance criteria

- [ ] Header reads as a new editorial masthead (utility line / masthead / hairline nav) — structurally distinct from the old chips stack.
- [ ] Light logo renders directly on the light surface, no green panel, crisp on retina, links home.
- [ ] Category nav is API-driven from the seeded tree; Today's Deals appears only when deals are enabled (verify by toggling in Admin → Special Offers).
- [ ] Search, cart (with count), wishlist (with count), account menu, theme toggle, hamburger all work exactly as before; all four overlays open/close.
- [ ] No "AI Search" or other unbacked claims.
- [ ] Announcement line: rotates calmly, dismisses, stays dismissed after reload, honors reduced motion.
- [ ] Light + dark both resolved; no hardcoded hex in the touched files.

## Test & QA

- `npm run dev`; test at 1440/1280/1024/768/480/375 widths.
- Keyboard-only pass: tab order logo → nav → search → actions; Escape closes the account menu.
- Login (user@example.com / password123) → avatar menu shows profile/orders/wishlist/logout; logout returns to `/`.
- Add to cart from Home → badge increments → drawer auto-opens (CartContext behavior).
- Admin → Special Offers: disable deals → storefront nav hides Today's Deals after tab refocus.
- Admin regression: `/admin` login + dashboard render untouched.
