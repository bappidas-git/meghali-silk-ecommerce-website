# Search Experience — the Editorial Search Overlay

**Prompt 7 of 30**

## Depends on

Prompt 01 (tokens), Prompt 03 (primitives: `sf-chip`), Prompt 05 (Header search affordance opens this). Prompt 02 (seed data) recommended so suggestions/trending show Assamese-silk content.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `SearchModal` is a top-sheet overlay opened from Header (desktop + mobile icon) AND from a second independent instance mounted by `BottomNav`. It debounces 300ms over a module-level cached `products.getAll()` + `categories.getAll()`, shows category chips, a 12-result grid, "AI Suggestions", recent searches (localStorage, max 8), and trending (`products.getTrending(5)`).

## Objective

Redesign search into a serene, gallery-like overlay — large editorial input, quiet typographic results, honest suggestion labels — with every mechanic intact (debounce, cache, recents, trending, keyboard/focus behavior, dual mounting).

## Scope — files/areas to touch

- `src/components/SearchModal/SearchModal.js` + `SearchModal.module.css` (props stay `({ open, onClose })`; the local `StarRating` subcomponent may be restyled or replaced by the shared `components/storefront/StarRating` — visual choice only)
- Nothing else (Header/BottomNav mount points untouched).

## Brand & design requirements

1. **Layout:** evolve the top-sheet into a full-width editorial veil: ivory sheet descending over a token overlay scrim; an oversized serif-adjacent input line (big Inter or serif at ~24–32px, bottom hairline instead of a boxed field, blinking caret welcome), close affordance top-right, tracked-uppercase section labels.
2. **Idle state:** replace "AI Suggestions" with an honest label — e.g. "Popular searches" or "Suggestions" — sourced exactly as today (no new claims). Recent searches as quiet text rows with remove affordances; trending products as a small editorial rail (image, name, price via `formatCurrency`/`getProductMinPrice`).
3. **Results:** the 12-cap result set becomes a refined list or airy grid — 3:4 thumbnail, name, category, price, small star line; hover = image ease + underline. Empty state: warm serif "Nothing yet for '…'" with a link to `/products`. Category chips stay (`sf-chip`/`sf-chip--active`), horizontally scrollable on mobile.
4. **Motion:** overlay fade + sheet slide retimed to the Prompt 01 easing (slower, softer); stagger on results ≤0.03s; all disabled under `prefers-reduced-motion`.
5. Dark mode parity via tokens.

## Functional guardrails

1. Preserve all functionality & the API contract: module-level `loadSearchData` cache (`products.getAll` + `categories.getAll` in `Promise.all`), `products.getTrending(5)`, 300ms debounce, result cap, navigation to product/category routes via `productPath`/category params, `localStorage["recentSearches"]` (max 8) semantics.
2. Preserve interaction plumbing: body-scroll lock, Escape-to-close, Tab focus-trap, focus restore to the opener, the `if (!open) return` guards (two instances exist simultaneously on mobile — Header's and BottomNav's — and must not fight).
3. Tokens/primitives only; the inline-SVG data-URI fallback image's two literal hexes may be updated to the new palette (data-URIs can't use `var()`) with a sync comment.
4. Do NOT modify the admin panel.
5. Brand: honest copy — no "AI" or capability claims the code doesn't back; refined placeholder text (e.g. "Search Muga, Eri, Mekhela Chador…").
6. Responsive + accessible: input labeled, results keyboard-navigable, chip row reachable, visible focus, reduced motion honored.
7. Test before done — see below.

## Implementation notes

- Search matching logic (name/category/price filtering) stays as-is; you are restyling presentation.
- If you adopt the shared `StarRating`, import from `../storefront/StarRating` (or the barrel `../storefront`) and delete the local duplicate — behavior-neutral.
- Keep the modal in the same z-index band (`--sf-z-modal`).
- Verify against the reseeded catalogue: type "muga", "eri", "mekhela", "gift" — results should feel curated.

## Acceptance criteria

- [ ] Overlay reads editorial (oversized hairline input, tracked labels, airy results) — clearly not the old boxed modal.
- [ ] Idle state: honest suggestion label, recents (persisted, removable), trending rail — all data-driven as before.
- [ ] Typing filters with debounce; results navigate to slug URLs; empty state graceful.
- [ ] Chips filter by category; active state styled.
- [ ] Focus trap + Escape + body lock + focus restore verified from BOTH mounts (Header and BottomNav on mobile).
- [ ] Light + dark parity; reduced-motion clean; no hardcoded hex (except the documented data-URI literals).

## Test & QA

- `npm run dev`: open from desktop Header, mobile Header icon, and the BottomNav Search tab.
- Search "muga" → click result → lands on `/products/<slug>`; reopen → recent search recorded; remove a recent.
- Keyboard-only: open, type, Tab through chips/results, Enter to navigate, Escape to close, focus returns to the trigger.
- Slow network (throttle): loading treatment appears; cache prevents refetch on reopen.
- Both themes; 375/768/1280 widths.
- Confirm nothing else regressed: cart drawer and auth modal still open from Header.
