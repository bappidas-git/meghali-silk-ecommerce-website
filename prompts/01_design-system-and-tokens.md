# Design System & Tokens — the Meghali's Silk editorial foundation

**Prompt 1 of 30**

## Depends on

Nothing — this is the first prompt of the series. Every later prompt consumes the tokens finalized here.

## Context

Meghali's Silk is a heritage silk boutique (Assamese silk — Mekhela Chador, Muga, Eri — plus gifts) whose storefront is being fully redesigned into a warm-minimalist, editorial, gallery-like luxury DTC experience: generous whitespace, image-forward, restrained palette, understated gold, calm and confident. Stack reality: CRA + React 18, CSS Modules consuming a `--sf-*` token system (`src/theme/storefront-tokens.css`, `src/theme/colors.js`, `src/theme/tokens.js`, `src/context/ThemeContext.js`), dual-mode `src/services/api.js` (JSON Server ↔ Laravel `{ success, data, meta }`) + `db.json`. Brand logos:
- Light logo (for light backgrounds): `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png`
- White logo (for dark backgrounds): `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png`

## Objective

Rebuild the design-token layer into the definitive Meghali's Silk editorial system — a **light-first, classic, golden-logo-keyed** palette, editorial typography scale, refined spacing/radii/shadows/motion — and flip the app's default theme from dark to light, while keeping the dark mode toggle fully functional with a re-derived "evening" palette. Every token NAME stays stable (components reference them); only values change, plus new tokens may be added.

## Scope — files/areas to touch

- `src/theme/storefront-tokens.css` — the single source of `--sf-*` custom properties (light `:root` block + `body.dark` overrides)
- `src/theme/colors.js` — the mirrored MUI palette (`LIGHT` / `DARK` exports)
- `src/theme/tokens.js` — the JS mirror (`TOKENS.radius/space/breakpoints/tapTarget/containerMax`); update mirrored values only, do NOT change `STOREFRONT_CONFIG`, `TRUST_BADGE_CATALOG`, or `resolveTrustBadgeDetail`
- `src/context/ThemeContext.js` — default-mode flip + MUI theme value alignment
- `public/index.html` — ONLY the pre-mount theme script near the bottom (`var isDark = savedTheme !== "light"`) and its two inline body-background gradients, so first paint matches the new light default. (The full splash-screen redesign is Prompt 04 — do not do it here.)

## Brand & design requirements

1. **Derive the palette from the actual logo assets.** Download/open both logo URLs above and sample them before fixing hex values — do not guess. Direction to finalize:
   - Ground: warm ivory/off-white page background (in the `#FAF7F1`–`#F7F3EB` territory — final value from what harmonizes with the sampled logo golds), pure/warm white for raised surfaces.
   - Type: deep neutral **ink** (near-black with a warm cast, e.g. `#1D1A16`-region) for primary text; muted warm grays for secondary/muted.
   - Accent: **gold sampled from the logo** as the single, restrained accent (rules, eyebrows, stars, price highlights, active states). Gold is seasoning, never a fill for large areas.
   - Retire the loud values: the current emerald CTA accent (`--sf-color-accent: #12B886`), the purple/pink `--sf-gradient-heritage`, `--sf-gradient-announce-2/-3`, and the rainbow `--sf-cat-*` category accents must all be REDEFINED (same names, new values) to quiet brand-adjacent tones (ink, gold, muted silk tones like clay/moss/indigo at low saturation). `--sf-shadow-focus` (currently indigo) becomes a gold- or ink-based focus ring with ≥3:1 contrast on ivory.
   - The deep green `#0B3B2E` heritage tone may survive only as a supporting deep tone if it harmonizes with the new logos — verify against the assets. The new logos are used directly on surfaces; the old "logo on a green panel" device (`--brand-logo-bg`) is retired visually. Keep the `--brand-logo-bg` token defined (components still reference it until their own prompts land) but you may repoint it to the new deep/ink tone.
2. **Typography — editorial pairing.** Display serif **Cormorant Garamond** (already loaded in `public/index.html`) for headlines, hero copy, prices-as-moments; **Inter** for UI/body. Formalize the editorial scale as tokens: extend `--sf-text-*` upward (add e.g. `--sf-text-4xl`/`--sf-text-5xl` ≈ 3–4.5rem clamp-based for hero headlines), add letter-spacing tokens for the uppercase tracked "eyebrow" style (e.g. `--sf-tracking-wide: 0.14em`, `--sf-tracking-wider: 0.2em`) and a display line-height token (≈1.1). Keep `--sf-font-display` / `--sf-font-family` names.
3. **Space, radii, hairlines.** Extend the 4px spacing scale with editorial section tokens (e.g. `--sf-space-20: 80px`, `--sf-space-24: 96px`, `--sf-space-32: 128px`). Radii shrink toward the classic (`--sf-radius-lg` and up may reduce; sharp/2–8px feel, no bubbly 22px cards). Borders become hairlines: `--sf-color-border` a warm sand hairline visible on ivory.
4. **Shadows & motion.** Shadows go softer, warmer, lower-contrast (editorial pages sit flat; shadows only for overlays/drawers). Motion tokens: keep `--sf-transition-fast/-/-slow` names but retune (≈0.2s / 0.35s / 0.6s) and add an editorial easing token (e.g. `--sf-ease: cubic-bezier(0.22, 1, 0.36, 1)`). The existing `prefers-reduced-motion` block that zeroes transitions must be preserved.
5. **Dark mode = evening gallery, not neon.** Re-derive `body.dark`: deep warm charcoal ground, ivory text, the same gold accent slightly lifted, hairlines as low-alpha ivory. Commerce tokens (`--sf-color-star`, `--sf-color-price`, `--sf-color-discount`, `--sf-color-badge-bg`) re-derived in both modes to the new palette. Semantic tokens (success/warning/danger/info) stay functional but desaturate toward the editorial palette.
6. **Default theme flips to LIGHT.** In `src/context/ThemeContext.js` change the initializer so light is the default (`savedTheme === "dark"` → dark; anything else → light). Update the matching pre-mount script in `public/index.html` (currently `savedTheme !== "light"`) and its two inline gradients so the pre-React paint is the new ivory. Keep `localStorage("theme")` persistence and the `body.dark`/`body.light` class mechanism exactly as-is — the toggle in the Header and Profile → Settings must keep working.
7. **MUI theme alignment.** In `colors.js` + `ThemeContext.js` update `LIGHT`/`DARK` palettes, gradients, and the MUI component overrides (buttons currently hover-lift with purple glow shadows; drawers/appbar use stale rgba tints) to the new editorial values — flat, restrained, no translateY glow hovers. Note: the storefront only uses MUI for `CssBaseline` and the Header's `Menu/Badge/IconButton/Avatar`; the admin wraps itself in its own `buildAdminTheme` (`src/theme/adminTheme.js`) in both `AdminLayout.js` and `AdminLogin.js`, so it is insulated — do NOT edit `adminTheme.js`.

## Functional guardrails

1. Preserve all functionality & the data/API contract — this prompt is tokens + theme plumbing only. No changes to `src/services/api.js`, `db.json`, contexts other than the specified `ThemeContext.js` edits, or any component/page file.
2. Reuse and extend the token system: change token **values**, add new tokens; never remove or rename an existing `--sf-*` custom property, an exported `LIGHT`/`DARK` key, or a `TOKENS` key — components consume them by name.
3. Do NOT modify the admin panel (`src/pages/Admin/*`, `src/components/AdminLayout/*`, `src/theme/adminTheme.js`). Admin has its own theme builder and must stay pixel-functional. (The admin will now default to light because it reads `isDarkMode` from ThemeContext — that is acceptable; `buildAdminTheme` supports both modes.)
4. Brand consistency: light, classic, keyed to the golden logo; verify against the real logo assets, never guessed hexes.
5. Responsive/accessible: focus ring token must meet contrast; body text ink on ivory ≥ 7:1; secondary text ≥ 4.5:1; keep the reduced-motion token block.
6. No fabricated trust signals — not applicable here, but do not introduce any decorative "social proof" tokens.
7. Test before done — see below.

## Implementation notes

- Work token-file-first: finalize `storefront-tokens.css`, then mirror into `colors.js`, then `tokens.js` numbers, then the ThemeContext/MUI alignment, then the index.html pre-mount sync.
- Keep the file's existing header-comment conventions and the light/dark structure (`:root` + `body.dark`) — other prompts rely on that architecture.
- `src/App.css` still carries a legacy neon palette and purple scrollbars; do NOT fix it here (that is Prompt 03) — but expect the app to look transitional until then.
- Grep for direct consumers of any token whose value you change dramatically (`--sf-color-accent`, `--sf-cat-*`, `--sf-gradient-*`) to sanity-check nothing becomes unreadable before its redesign prompt lands.
- Document the final palette in a comment block at the top of `storefront-tokens.css` (hex + role), since later prompts will be executed in fresh sessions and read this file as the source of truth.

## Acceptance criteria

- [ ] `storefront-tokens.css` defines the full light-first editorial palette; dark block re-derived; all pre-existing token names still defined.
- [ ] Gold values are sampled from the actual light logo asset; a comment documents the sampled palette.
- [ ] Emerald/purple/pink/neon values are gone from the token layer (names kept, values replaced).
- [ ] Typography tokens include the editorial display scale + tracking tokens; Cormorant Garamond + Inter only.
- [ ] App defaults to LIGHT on first visit (no saved theme); explicit dark choice persists; toggle works both ways with no flash of wrong theme on reload.
- [ ] `colors.js`, `tokens.js`, ThemeContext MUI themes agree with the CSS tokens.
- [ ] Admin panel unchanged in code (except none) and still fully functional in both modes.
- [ ] `npm start` compiles clean; no console errors.

## Test & QA

- Run `npm run dev` (CRA :3000 + JSON Server :3001). Clear `localStorage.theme` → app loads light, ivory ground, no dark flash before React mounts.
- Toggle dark via Header (desktop) and Profile → Settings switch: both directions persist across reload.
- Spot-check Home, Products, a product page, Cart drawer, Checkout, Profile in both modes — everything readable (old layouts, new palette; full redesigns come later).
- Log into `/admin` (admin@store.com / admin123): dashboard, products table, orders — visually and functionally intact.
- Keyboard-tab through the Header: focus ring visible on ivory.
- Confirm existing functionality still works: add to cart, wishlist toggle, search modal open.
