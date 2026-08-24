# Global Styles, Primitives & Error Surface

**Prompt 3 of 30**

## Depends on

Prompt 01 — design system & tokens (this prompt makes the global CSS consume those tokens everywhere).

## Context

Meghali's Silk — Assamese-silk boutique storefront being redesigned into a warm-minimalist editorial luxury DTC experience on a light, golden-logo-keyed palette (tokens now live in `src/theme/storefront-tokens.css`). Stack: CRA, CSS Modules + `--sf-*` tokens, dual-mode `src/services/api.js` + `db.json`. The global stylesheet layer still carries a legacy "futuristic neon" skin (purple gradients, glow scrollbars) that fights the new brand and must be purged.

## Objective

Rebuild the global CSS layer — `src/App.css`, `src/index.css`, `src/theme/storefront-primitives.css` — into the editorial system (page ground, typography defaults, scrollbars, SweetAlert2 theming, button/chip/card/skeleton/toast primitives), and re-sync the deliberately-hardcoded `ErrorBoundary` palette. All class names and token names keep their contracts; only values and internals change.

## Scope — files/areas to touch

- `src/App.css` — legacy `:root` variables, `.App`/`.main-content` backgrounds, global + per-mode scrollbar styling, utility classes, keyframes, the SweetAlert2 theming block (`.swal2-popup` variables per `body.light/.dark`), and the `body.admin-area.*` blocks (keep these functional — see guardrails)
- `src/index.css` — font imports/order, body defaults
- `src/theme/storefront-primitives.css` — the `sf-*` primitive classes
- `src/components/ErrorBoundary/ErrorBoundary.js` — its intentionally inline hex palette (lines ~52–103), re-synced to the new tokens

## Brand & design requirements

1. **`App.css` purge.** Delete or repoint the legacy `:root` variables (`--primary-gradient #667eea/#764ba2`, `--neon-purple`, `--neon-pink`, `--neon-blue`, `--dark-bg #0a0e27`, `--light-bg #f5f7fa`, `--glass-*`, `--text-*`) — anything still consuming them must resolve to `--sf-*` tokens instead. `.App` and `.main-content` backgrounds become `var(--sf-color-bg)` in light and the dark token in `body.dark`. Remove/neutralize off-brand utilities (`.neon-glow`, `.gradient-text`, `.pulse-glow`, purple `.loading-spinner`) — keep the class names defined (empty or restyled) if anything still references them; grep first.
2. **Scrollbars.** Replace every purple-gradient scrollbar with a quiet editorial treatment: thin (8px), warm-neutral thumb (`--sf-color-border-strong`-derived), track = page ground; dark mode equivalent. Keep the `body.admin-area` scrollbar overrides EXACTLY as they are (slate palette) — the admin look is out of scope.
3. **SweetAlert2 theming.** The storefront uses Swal toasts/dialogs everywhere (cart, auth, order cancel, profile). Retheme the `body.light .swal2-popup` / `body.dark .swal2-popup` variable blocks to the editorial palette: ivory/ink surfaces, hairline border, restrained gold confirm-button, Inter type. Keep the `body.admin-area.*` Swal blocks untouched. Keep `.swal2-container { z-index: 2000 }` (in `index.css`) — it lifts Swal above MUI.
4. **`index.css`.** Remove the duplicate Inter `@import` (Inter already loads via the `<link>` in `public/index.html`); keep the load-bearing order `storefront-tokens.css` → `storefront-primitives.css`. Body font-family becomes `var(--sf-font-family)`; add editorial defaults: `color: var(--sf-color-text)`, `background: var(--sf-color-bg)`, text-rendering, and a tasteful `::selection` (gold-tinted). Keep `html { scroll-behavior: smooth }`.
5. **Primitives (`storefront-primitives.css`)** — restyle every class IN PLACE (names are a stable contract; `Header.js`/`Footer.js`/`SearchModal.js` consume `sf-btn sf-btn--emerald sf-btn--sm`, `sf-chip`, `sf-chip--active`):
   - `.sf-btn` family: editorial buttons — near-rectangular (2–4px radius), uppercase Inter with `--sf-tracking-wide`, sizes `--sm/--lg/--block` preserved. `.sf-btn--emerald` (name kept) becomes the PRIMARY ink button (ink fill, ivory text, slow hover to deep gold or gold underline-reveal). `.sf-btn--gold` = gold-fill for rare hero moments; `.sf-btn--outline-gold` = hairline outline; `.sf-btn--ghost` = quiet text button. Visible `:focus-visible` rings via `--sf-shadow-focus`; `:disabled` at reduced opacity.
   - `.sf-chip`/`.sf-chip--active`: hairline pill → refined tab/filter chip (active = ink fill or gold underline).
   - `.sf-card`/`.sf-card--hover`: flat surface, hairline border, soft hover lift (2–4px, slow ease) — no glow.
   - `.sf-badge-discount`, `.sf-pill-save`, `.sf-ribbon-premium`: quiet editorial marks (small caps, hairline or soft-tint fills), no neon.
   - `.sf-skeleton*` shimmer re-tinted to warm sand; `.sf-toast*` variants themed to the palette. Keep the `prefers-reduced-motion` block.
6. **ErrorBoundary re-sync.** Its inline styles are hardcoded on purpose (it must render when the provider tree has crashed). Update the literal hex values and font stack to mirror the NEW light/dark tokens (read them from `storefront-tokens.css` and copy the values in as literals, with a comment noting the sync source). Keep the class-free inline-style approach and all behavior (reload / go home / details).

## Functional guardrails

1. Preserve all functionality & the data/API contract — pure CSS + one inline-style sync; no JS logic, routes, or API calls change.
2. Consume tokens everywhere: no new hardcoded hex outside `ErrorBoundary` (where literals are the documented exception).
3. Do NOT modify the admin panel — and inside `App.css`, leave every `body.admin-area` block (backgrounds, scrollbars, Swal) byte-compatible; the admin's look must not shift.
4. Brand consistency + minimalism: nothing neon, no gradients except the token-defined gold, hairlines over heavy borders.
5. Responsive & accessible: primitive buttons keep ≥44px tap height at `--sm` on touch; focus states visible on every interactive primitive; reduced-motion blocks preserved.
6. No fabricated trust signals — n/a, but don't add decorative badges.
7. Test before done — see below.

## Implementation notes

- Grep for consumers before deleting anything: `grep -r "neon-glow\|gradient-text\|glass-effect\|--primary-gradient" src/` — restyle rather than remove if referenced.
- The Header/Footer/SearchModal will be redesigned in Prompts 05–08; the primitives you style here are what they'll build on, so keep them generic.
- `.main-content` keeps its `padding-bottom` (80px / 70px mobile) — the fixed BottomNav depends on it.
- Keep `@media print { … }` rules and the `.desktop-only`/`.mobile-only` utilities working.

## Acceptance criteria

- [ ] No purple/neon values remain in `App.css`; page ground is token ivory (light) / token charcoal (dark).
- [ ] Scrollbars are quiet editorial in both storefront modes; admin scrollbars unchanged.
- [ ] Swal toasts (add to cart, login) and dialogs (cancel order) render in the new palette in both modes; admin Swal unchanged.
- [ ] All `sf-*` primitive class names still exist and render the editorial style; Header/Footer/SearchModal buttons+chips pick it up without code changes.
- [ ] Duplicate Inter import removed; fonts still load (serif headlines render).
- [ ] ErrorBoundary fallback (temporarily throw in a component to check) renders in the new palette, light and dark.
- [ ] `npm start` compiles clean.

## Test & QA

- `npm run dev`: visually sweep Home, Products, product page, Checkout, Profile in light + dark — ground/scrollbars/toasts consistent.
- Trigger toasts: add to cart, remove from cart, login (user@example.com / password123), cancel-order dialog from Order History.
- Keyboard: tab the Header buttons/chips — focus visible.
- Mobile (≤768px): BottomNav clearance intact (no content hidden behind it).
- Admin regression (admin@store.com / admin123): background, scrollbars, dialogs identical to before this prompt.
