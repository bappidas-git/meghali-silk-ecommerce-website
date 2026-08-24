# Mobile Navigation — Sidebar Menu & Bottom Nav

**Prompt 6 of 30**

## Depends on

Prompt 01 (tokens), Prompt 03 (primitives), Prompt 05 (Header — mounts `SidebarMenu` and defines the masthead this pairs with).

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). Mobile nav today: a left drawer (`SidebarMenu`) with logo-on-green-panel hero, trust strip, collapsible settings, lazy category tree; plus a fixed 5-tab `BottomNav` that hides on scroll-down. Logos: light `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png` · white `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png`.

## Objective

Redesign the mobile navigation into an editorial full-height menu (large serif type, calm reveals) and a refined minimal bottom bar — preserving every behavior: lazy category tree, theme switch, auth entry, wishlist badge, hide-on-scroll.

## Scope — files/areas to touch

- `src/components/SidebarMenu/SidebarMenu.js` + `SidebarMenu.module.css` — props stay `({ open, onClose, onOpenAuth })`
- `src/components/BottomNav/BottomNav.js` + `BottomNav.module.css`
- Nothing else (`SearchModal` is Prompt 07 — BottomNav's second `SearchModal` instance mount stays as-is).

## Brand & design requirements

1. **SidebarMenu — the editorial menu.** Rethink it from "app drawer" to "boutique menu":
   - Full-height panel (near full-width on phones) on ivory; light logo directly on the surface (delete the green `.logoPanel`); oversized close affordance.
   - Primary links set in the display serif at large sizes (e.g. Shop All, the top-level seeded categories, Today's Deals when enabled, Our Story, Support), with the existing category tree behavior preserved beneath: lazy `apiService.categories.getAll()` on first expand, recursive N-level accordion, "Shop all"/"View all" rows, links via `categoryParam()`.
   - Signed-in card / guest sign-in row (calls `onOpenAuth`), account rows (Profile, Orders, Wishlist), the collapsible Settings block with the dark-mode switch (`useTheme().toggleTheme`), Help link, and footer legal links — all preserved, restyled as quiet hairline-separated groups.
   - `TrustStrip` in the hero may stay or move lower, but keep it rendered (its promises are part of the trust story).
   - Motion: keep `AnimatePresence` + spring slide-in but slow/soften it (use the Prompt 01 easing; stagger reveal subtle, ≤0.03s steps); backdrop = token overlay. Body-scroll lock, Escape-to-close, focus-into-panel all preserved.
2. **BottomNav — thin editorial bar.** Keep the 5 tabs and behaviors (Home `/`, Categories `/products`, Search opens its own `SearchModal`, Wishlist `/wishlist` with `99+`-capped badge, Account `/profile`; hide on scroll-down past 80px, reveal on scroll-up):
   - Restyle: ivory bar, 1px top hairline, thin-stroke icons (existing MUI icon pairs fine), active tab = ink + small gold underline dot; labels in tracked 10–11px.
   - Safe-area inset padding (`env(safe-area-inset-bottom)`); tap targets ≥44px.
3. Dark mode: both surfaces re-derived (charcoal panel, WHITE logo variant in the SidebarMenu when `body.dark` — swap the image src by `isDarkMode` from `useTheme`).

## Functional guardrails

1. Preserve all functionality & the API contract: lazy category fetch (only on first expand), `useDealsConfig().enabled` gating of the deals link, `onOpenAuth` wiring from Header, navigation callbacks, wishlist count from `useWishlist().getWishlistCount`, scroll-direction logic.
2. Tokens/primitives only; no hardcoded hex/fonts; framer-motion durations/easings from tokens.
3. Do NOT modify the admin panel.
4. Brand: correct logo per background (light logo on ivory panel; white logo on dark panel); serif reserved for the big menu links, Inter for meta rows.
5. Responsive + accessible: drawer traps focus while open and restores on close; `aria-expanded` on accordions; switch keeps `role="switch"` semantics; BottomNav is `<nav aria-label="Bottom">`-style labeled; honors `prefers-reduced-motion` (no slide/stagger).
6. No fabricated trust signals — TrustStrip policy copy only.
7. Test before done — see below.

## Implementation notes

- The category tree recursion + "Shop all" logic is the trickiest part — restyle around it; don't rewrite its data handling.
- Verify the seeded top-level categories (Prompt 02) render with sensible lengths in the serif size; truncate gracefully.
- Keep `localStorage`-free: the drawer holds no persistence today; don't add any.
- BottomNav mounts independently in `App.js` next to `Footer` — its z-index must stay above page content but below drawers/modals (`--sf-z-*` scale).

## Acceptance criteria

- [ ] SidebarMenu reads as a full editorial menu (serif primary links, hairline groups) — clearly different from the old app-drawer look.
- [ ] Category tree still lazy-loads, expands N levels, and every link routes with slug params.
- [ ] Guest sees Sign-in row (opens AuthModal); signed-in sees their card + account rows; theme switch + Help + legal links work.
- [ ] BottomNav: 5 tabs, badge, hide/reveal on scroll, safe-area padding, active states.
- [ ] Correct logo variant per theme; both modes styled.
- [ ] Focus trap, Escape, body-lock, reduced-motion verified.

## Test & QA

- `npm run dev` at 375/414/768 widths (and desktop — drawer still opens from the hamburger at ≤768).
- Open drawer → expand two category levels → navigate → drawer closes, page scrolls to top.
- Toggle dark in the drawer settings; reload; state persists; white logo shows in dark.
- Scroll a long page (Products): bottom bar hides going down, returns going up; nothing overlaps the Footer's last content (`.main-content` bottom padding intact).
- Keyboard/screen-reader spot check: tab cycles inside the open drawer only.
- Confirm cart/checkout/wishlist flows still work from mobile nav entry points; admin untouched.
