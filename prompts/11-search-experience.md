<!-- Batch C — Global Layout / Navigation -->
# Prompt 11 — Search Experience

## Objective
Redesign the full-screen search overlay (`SearchModal`) into the Meghali's Silk search experience from the
mockup: a prominent silk-focused search input, an **AI Suggestions** section (clearly-labelled curated
phrases), **Recent Searches** chips persisted in `localStorage`, and a numbered **Trending** list with
trend-up icons — with live, real product search via `apiService` that navigates to `/products?...` or
shows result rows, honest result counts, and full keyboard accessibility.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house; the search overlay is **dark with gold/emerald
accents**. Match **`UI Designs/SEARCH OPTION.png`**: a search field reading
**"Search for silk sarees..."** at the top, an **"AI Suggestions"** section listing a few curated
phrases (e.g. "Elegant silk sarees for wedding", "Luxury bridal collection", "Premium festive wear")
each on its own row, a **"Recent Searches"** row of chips, and a **"Trending"** list rendered as
**numbered rows** (1–5) each with a label and a small **trend-up** icon on the right.

Consume only tokens from `src/theme/storefront-tokens.css` — never hardcode hex:
- `--sf-color-gold`/`--sf-gradient-gold`, `--sf-color-emerald`, `--sf-color-brand-green`,
  `--sf-color-surface{,-2,-hover}`, `--sf-color-text{,-secondary,-muted}`, `--sf-color-border{,-strong}`,
  `--sf-color-overlay`, `--sf-color-price` (result prices), `--sf-color-star`, `--sf-font-display`,
  `--sf-font-family`, radii, spacing, shadows, `--sf-z-modal`, `--sf-tap-target`.

(The logo is not used in the search overlay, so the logo-bg rule does not apply here.)

## Scope — Files to Create / Modify
- (MODIFY) `src/components/SearchModal/SearchModal.js` — restructure the default (pre-typing) view into
  AI Suggestions / Recent / Trending; restyle; keep live search.
- (MODIFY) `src/components/SearchModal/SearchModal.module.css` — restyle to match the mockup, token-driven.
- (`src/components/SearchModal/index.js` already exists as a re-export — leave it; only touch it if the
  default export name changes, which it should not.)
- **OUT of scope:** do NOT change the `Header`/`BottomNav` that mount this modal, `src/App.js`, contexts,
  or `src/services/api.js`. Do NOT touch the admin panel.

## Detailed Requirements
The current `SearchModal.js` already implements a lot — **preserve the engine and the authenticity
guarantees**: props `{ open, onClose }`; `useTheme`; a **module-level cached** catalogue loader
(`loadSearchData()` → `apiService.products.getAll()` + `apiService.categories.getAll()`, fetched once and
shared across Header + BottomNav instances); **debounced** (300ms) relevance-scored search over the
in-memory catalogue (`scoreProduct`, `resolveCategory`, `matchesCategoryChip`); category filter chips
derived from the live category tree (`buildCategoryNav`); **recent searches in `localStorage`** under
`recentSearches` (`getRecentSearches`/`saveRecentSearch`/`clearRecentSearches`, max 8); body-scroll-lock;
Escape-to-close; input autofocus; result cards (image, name, category, price via `getProductMinPrice`,
star rating) that navigate via `productPath(product)`; and a "View all results" action that navigates to
`/products?search=<query>`. **Keep all of this working.** Restructure mainly the **default (empty-query)
view** and the styling.

1. **Search input.** Keep the top search field (form `onSubmit={handleSubmit}` → `goToSearchResults`),
   but change the placeholder to **"Search for silk sarees..."**. Keep the leading search icon, the clear
   (✕) button when there is text, and the close button (`onClose`, `aria-label="Close search"`). Style
   the field with brand tokens (rounded, `--sf-color-surface-2`, gold focus ring via `--sf-shadow-focus`).
2. **Default view — AI Suggestions (curated).** When the query is empty, render an **"AI Suggestions"**
   section ABOVE Recent/Trending. Source it from a **static curated list** declared in the component
   (clearly a curated list, not fabricated data), e.g.:
   ```js
   const AI_SUGGESTIONS = [
     "Elegant silk sarees for wedding",
     "Luxury bridal collection",
     "Premium festive wear",
   ];
   ```
   Label the section header clearly (e.g. "AI Suggestions" with a small `AutoAwesome`/sparkle icon).
   Render each phrase as a tappable row/chip; clicking one sets the query (reuse `handleChipSearch`) so it
   runs the real search (it must NOT pretend to be an AI answer — it just seeds a normal query). Per the
   authenticity rule, do not show any fabricated counts or "AI-generated" result claims.
3. **Default view — Recent Searches (keep).** Keep the **Recent Searches** section bound to
   `localStorage` (`recentSearches`): render the stored terms as chips (each with a clock icon),
   clicking a chip seeds the query, and keep the **"Clear all"** action (`handleClearRecent`). Only show
   the section when there is at least one recent term. Restyle the chips with `.sf-chip` tokens.
4. **Default view — Trending (numbered).** Replace the current flat `TRENDING_SEARCHES` chip group with a
   **numbered Trending list** matching the design: each row shows an index (1–5), a label, and a small
   **trend-up** icon on the right; clicking a row seeds the query (real search). Source the trending
   terms from one of:
   - a **curated silk list** declared in the component (e.g. "Designer Silk Sarees", "Premium Wedding
     Collection", "Gold Border Saree", "Festive Collection", "Traditional Handloom"), clearly curated; OR
   - **derived from real data** via `apiService.products.getTrending(limit)` (the service exists) — e.g.
     map the trending products' names/primary tags to labels.
   Either is acceptable; if you derive from `getTrending`, fall back to the curated list on error/empty.
   Do NOT fabricate trend percentages or counts — the trend-up icon is decorative.
5. **Live results (keep).** When the user types, keep the debounced real search over the cached catalogue
   and the result rows/grid (image with `loading="lazy"` + fallback, name, resolved category, price,
   star rating) navigating to `productPath(product)`. Keep the **honest results header** ("N results for
   '…'") — N is the real match count from the engine (do NOT fabricate). Keep "View all results" →
   `/products?search=<query>` and the empty state ("No products found for '…'"). Keep saving the term to
   recent searches on submit/result click. You MAY keep the category filter chips
   (`buildCategoryNav`) — restyle them with `.sf-chip`/`.sf-chip--active`.
6. **Keyboard accessibility (enhance).** Keep `role="dialog" aria-modal="true"`, the autofocus on the
   input, ESC-to-close, and body-scroll-lock. Add a **focus trap** so Tab/Shift+Tab cycle within the
   overlay while open (first/last focusable wrap), and return focus to the trigger on close if feasible.
   Arrow-key navigation of suggestion/trending/result rows is **optional** but encouraged (roving
   tabindex or `aria-activedescendant`). All rows/chips/buttons ≥`var(--sf-tap-target)` with visible
   `:focus-visible` rings.
7. **Theming, motion, layout.** Keep the Framer Motion overlay/modal fade-slide; respect
   `prefers-reduced-motion`. Dark with gold/emerald accents via tokens only; honor `body.dark`/
   `body.light`. Responsive: full-screen-ish on mobile, centered panel on desktop (match the mockup
   proportions); sections stack cleanly with clear gold-accented headings (`--sf-font-display`).

## Data / API Notes
- **`apiService.products.getAll()` + `apiService.categories.getAll()`** power the cached in-memory search
  (already wired via `loadSearchData()`); optionally **`apiService.products.getTrending(limit)`** for the
  Trending list. Do not add direct `fetch`/`axios`; all data flows through `apiService`.
- Recent searches persist in `localStorage` under `recentSearches` (existing keys/limits — keep them).
- Result navigation uses `productPath(product)` and listing search uses `/products?search=<query>`
  (existing helpers from `src/utils/helpers`). `db.json` shapes are unchanged.
- AI Suggestions and the curated Trending fallback are **static curated phrases** (owner/brand curated,
  clearly labelled) — consistent with `STOREFRONT_UX_GUIDELINES.md`'s "authenticity > persuasion": no
  fabricated result counts, no fake "AI" answers, no invented trend metrics. Real result counts come
  only from the real search engine.
- Preserve the JSON Server ↔ Laravel swap contract.

## Constraints (Do Not Break)
- Keep live search functional and API-driven (cached catalogue, debounced scoring, real result counts,
  navigation to PDP and to `/products?search=...`).
- Re-skin only via tokens / shared primitive classes — **no hardcoded hex** in `SearchModal.js`/
  `SearchModal.module.css` (existing inline-SVG icon stroke colors should be migrated to tokens or
  `currentColor` where practical).
- Do not fabricate result counts, trend metrics, or AI answers; AI Suggestions / curated Trending must be
  clearly labelled curated phrases that simply seed a real query.
- Keep recent searches in `localStorage` (existing key `recentSearches`); keep the module-level catalogue
  cache shared across instances.
- Do not modify the admin panel, the mounting components, `src/App.js`, contexts, or `src/services/api.js`.
- Accessibility: `role="dialog" aria-modal`, autofocus, ESC + overlay close, body-scroll-lock, focus
  trap, ≥44px targets, visible `:focus-visible` rings, `prefers-reduced-motion` path. Mobile-first.

## Acceptance Criteria / Definition of Done
- [ ] Search overlay matches `UI Designs/SEARCH OPTION.png`: "Search for silk sarees..." input, an
      "AI Suggestions" section (curated phrases), a "Recent Searches" chip row, and a numbered "Trending"
      list with trend-up icons.
- [ ] Typing performs the real debounced product search; results show real products with image/name/
      category/price/rating and an honest "N results" count; clicking a result opens its PDP; "View all
      results" goes to `/products?search=...`.
- [ ] Clicking an AI Suggestion / Trending row / Recent chip seeds the query and runs a real search;
      "Clear all" empties recent searches; recent searches persist across reloads (`localStorage`).
- [ ] No fabricated counts/metrics/AI answers; curated sections are clearly labelled.
- [ ] Keyboard: opens focused on the input, ESC and overlay/close button close it, Tab is trapped within
      the overlay, all rows have visible focus rings and ≥44px targets; body scroll is locked while open.
- [ ] No hardcoded hex; dark + light coherent; no console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev`, open the search overlay (header "AI Search" button or the bottom-nav Search tab).
2. Confirm the empty state shows AI Suggestions (curated phrases), Recent Searches (if any), and a
   numbered Trending list with trend-up icons; the placeholder reads "Search for silk sarees...".
3. Click an AI Suggestion and a Trending row → each seeds the query and shows real results; click a
   Recent chip → same; click "Clear all" → recent searches clear; reload → recent searches persist.
4. Type a known product term → debounced results appear with an honest count; click a result → its PDP
   opens; type and submit → navigates to `/products?search=...`. Type gibberish → honest empty state.
5. Keyboard: open it, confirm the input is focused, Tab/Shift+Tab cycle within the overlay (focus trap),
   ESC closes, the backdrop and close button close it, and body scroll is locked while open.
6. Toggle the theme → overlay stays coherent; set `prefers-reduced-motion: reduce` → animations reduce.
7. Resize to mobile and desktop → layout matches the mockup proportions; targets ≥44px.
8. `npm run build` → clean.
