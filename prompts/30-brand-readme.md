<!-- Batch F — Admin Logo, Polish & QA -->
# Prompt 30 — Brand & Usage Guide (BRAND_README)

## Objective
Author a concise, accurate **brand & usage guide** documenting how the *Meghali's Silk* storefront is
themed and configured — so a future maintainer can re-skin the palette, swap content, and understand the
brand rules without reading every file. Output is a single Markdown doc; **no application code changes**.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house (Bengal/Kolkata
craftsmanship, National Handloom Award winner) selling authentic women's silk apparel. The doc must
faithfully describe the implemented system (not invent features). Key facts the guide documents:

- **Single re-skin point:** `src/theme/storefront-tokens.css` (`--sf-*` custom properties; light values in
  `:root`, dark values under `body.dark`). `src/theme/colors.js` carries the same brand palette for the
  **MUI** layer (admin + a few MUI storefront bits). Content/policy config lives in
  `src/theme/tokens.js` → `STOREFRONT_CONFIG`.
- **Palette:** brand green `#0B3B2E` (deep panels / logo bg, `--sf-color-brand-green`), gold/champagne
  `#CBA35A` / light `#E6C27A` / deep `#B6863C` (`--sf-color-gold*`), emerald CTA `#12B886`
  (`--sf-color-emerald`), plus category-accent dots (pink #EC4899, purple #8B5CF6, orange #F59E0B,
  blue #3B82F6, teal #14B8A6, red #EF4444).
- **Fonts:** display/headings `--sf-font-display` ("Cormorant Garamond", serif, 600/700); body/UI
  `--sf-font-family` ("Inter").
- **Logo-on-green rule:** logo URL
  `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`, always placed on a
  `--brand-logo-bg` (#0B3B2E) panel (header, mobile menu, footer, admin sidebar + login).
- **Dark mode is the default**; theme persists in `localStorage.theme` (ThemeContext toggles `body.dark`
  / `body.light`).
- **Authenticity > persuasion** rule (from `STOREFRONT_UX_GUIDELINES.md`): no fabricated
  reviews/stock/urgency/social proof; honest empty states; persuasive UI binds to real API data.

This doc is text only; there is no `UI Designs/` mockup to match — describe the system, don't restyle.

## Scope — Files to Create / Modify
- (CREATE) `BRAND_README.md` at the **repo root**.
  - If a root `README.md` already exists, do **not** overwrite it — create `BRAND_README.md` alongside it
    (acceptable alternative: `docs/BRAND_README.md`, creating `docs/` if needed). Prefer repo root.
- **OUT of scope:** any application code, CSS, `db.json`, the admin panel, or `apiService` — this prompt
  writes documentation only. Do not edit the existing `README.md` or `00_BACKEND_README_AND_CONVENTIONS.md`.

## Detailed Requirements
Write `BRAND_README.md` with the following sections (keep it concise — roughly 120–200 lines — and
accurate to the codebase; verify names against the actual files before stating them):

1. **Title & one-paragraph intro.** "Meghali's Silk — Brand & Usage Guide": what the brand is and what
   this doc covers (theming, content config, brand rules).
2. **The token system (single re-skin point).**
   - Explain `src/theme/storefront-tokens.css` as the ONE place storefront brand values live: `--sf-*`
     custom properties, light in `:root`, dark under `body.dark`, consumed by CSS Modules via
     `var(--sf-*)`. State the rule: **never hardcode hex in components.**
   - Explain `src/theme/colors.js` (`LIGHT`/`DARK` objects) as the MUI-layer palette (drives admin + some
     MUI storefront bits) that must stay in sync with the CSS tokens.
   - Note structural tokens (spacing `--sf-space-*`, radius `--sf-radius-*`, shadow `--sf-shadow-*`, type
     scale, motion, `--sf-container-max:1280px`, `--sf-tap-target:44px`) are mode-agnostic.
3. **Brand palette table.** List the key tokens with their values and intended use: brand green
   (panels/logo bg), gold (headings/prices/dividers/PREMIUM), emerald (primary CTAs), price/compare,
   category-accent dots, and the gradients (`--sf-gradient-gold`, `--sf-gradient-heritage`, the three
   announcement-bar gradients). Give both dark (primary) and light values where they differ.
4. **Typography.** `--sf-font-display` = Cormorant Garamond (headings, 600/700); `--sf-font-family` =
   Inter (body/UI). Note fonts load via Google Fonts in `public/index.html`.
5. **The logo-on-green rule.** State the logo URL and that it must always sit on a `--brand-logo-bg`
   (#0B3B2E) panel everywhere it appears (header, mobile menu, footer, admin sidebar + login). Mention the
   admin uses a small inline green wrapper because it doesn't consume `--sf-*` tokens.
6. **How to tweak the palette / re-skin.** Step-by-step: edit values in `storefront-tokens.css`
   (both `:root` and `body.dark`), mirror brand hues in `colors.js`, and that's the whole re-skin — no
   component edits needed. Add new shared values as tokens, not inline.
7. **How to tweak content / policy.** Explain `STOREFRONT_CONFIG` in `src/theme/tokens.js` (trust-badge
   order via `TRUST_BADGE_CATALOG` ids, `returnsWindowDays`, `aov` settings, `gallery` options) and
   `src/utils/constants.js` (`APP_NAME` from `REACT_APP_NAME`, tagline/description, contact/social, FAQs,
   trust-badge copy). Explain that catalog/store **data** lives in `db.json` (`products`, `categories`,
   `banners`, `coupons`, `reviews`, `shipping_methods`, `settings.store/social/seo`, `dealsConfig`) and
   must keep its existing JSON shapes/keys/id conventions (INR integers, ISO `…Z` dates, referential
   integrity across `categoryId`/`relatedProductIds`/`frequentlyBoughtTogetherIds`/review refs/`dealsConfig`
   ids).
8. **Dark-mode-default behavior.** Dark is the default on a fresh profile; ThemeContext persists the
   choice in `localStorage.theme` and toggles `body.dark`/`body.light`; a pre-mount script in
   `public/index.html` prevents a flash of the wrong theme.
9. **Architecture & data-contract note (brief).** All backend access goes through
   `src/services/api.js` (`apiService`); the app swaps JSON Server ↔ a real Laravel API by changing only
   `REACT_APP_API_URL` + `REACT_APP_USE_MOCK_API` in `.env` — **no `fetch`/`axios` outside `apiService`.**
   Note the cart is a `CartDrawer` (no `/cart` route) and the admin is not part of the redesign except the
   logo.
10. **Authenticity > persuasion rule.** Restate the rule from `STOREFRONT_UX_GUIDELINES.md` and that it is
    a hard product constraint: persuasive elements bind to real API data; no fabricated
    reviews/stock/urgency; honest empty states.
11. **Quick reference / run commands (optional, brief).** `npm install`, `npm run dev` (CRA + JSON Server
    on :3001), `npm run build`; point to `STOREFRONT_UX_GUIDELINES.md` and
    `00_BACKEND_README_AND_CONVENTIONS.md` for deeper detail.

Keep the tone clear and practical; use short tables/lists and fenced code where it aids skimming. Verify
every file path, token name, and config key against the repo so nothing is inaccurate.

## Data / API Notes
- This prompt creates **documentation only** — no `apiService` calls and no `db.json` changes.
- It must **describe** the existing contract accurately (the `apiService` surface, dual-mode `.env`
  switch, JSON shapes, referential integrity) but must not alter any of it.
- Cross-reference existing docs rather than duplicating them: `STOREFRONT_UX_GUIDELINES.md`,
  `00_BACKEND_README_AND_CONVENTIONS.md`, and the existing `README.md`.

## Constraints (Do Not Break)
- Write only `BRAND_README.md` (repo root preferred; `docs/BRAND_README.md` acceptable). Do **not** modify
  any application code, CSS, `db.json`, the admin panel, or `apiService`.
- Do **not** overwrite the existing `README.md` or other existing docs.
- Everything documented must be **accurate to the codebase** — verify token names, file paths, and config
  keys before writing them (do not invent tokens, scripts, or features).
- Preserve the framing of the hard rules: tokens are the only re-skin point, logo-on-green, dark default,
  the JSON Server ↔ Laravel swap contract, and authenticity > persuasion.

## Acceptance Criteria / Definition of Done
- [ ] `BRAND_README.md` exists at the repo root (or `docs/BRAND_README.md`) and the existing `README.md`
      is untouched.
- [ ] It documents the token system (`storefront-tokens.css` as the single re-skin point + `colors.js`
      for MUI) and the rule against hardcoded hex.
- [ ] It includes the brand palette (green/gold/emerald + category accents + gradients) with token names
      and values, and the fonts (`--sf-font-display` Cormorant Garamond / `--sf-font-family` Inter).
- [ ] It states the logo-on-green rule and the exact logo URL.
- [ ] It explains how to tweak palette (token files) and content (`STOREFRONT_CONFIG`, `constants.js`,
      `db.json` within existing shapes).
- [ ] It explains dark-mode-default behavior and the `localStorage.theme` persistence.
- [ ] It states the JSON Server ↔ Laravel swap contract (only `.env` vars; no `fetch`/`axios` outside
      `apiService`) and the authenticity > persuasion rule.
- [ ] All file paths, token names, and config keys referenced are correct; the doc is concise (~120–200
      lines) and contains no application-code changes.

## Verification Steps
1. Create `BRAND_README.md` at the repo root, then open it and read it top to bottom for accuracy.
2. Cross-check each referenced path/token/key against the repo:
   - `src/theme/storefront-tokens.css` (confirm `--sf-color-brand-green`, `--brand-logo-bg`,
     `--sf-color-gold*`, `--sf-font-display`, gradient tokens exist as documented),
   - `src/theme/colors.js` (`LIGHT`/`DARK` shapes), `src/theme/tokens.js` (`STOREFRONT_CONFIG` keys),
     `src/utils/constants.js` (`APP_NAME`, tagline, trust badges).
3. Confirm the logo URL in the doc matches the one used in the header/footer/admin.
4. Run `git status` → confirm the ONLY new/changed file is `BRAND_README.md` (or `docs/BRAND_README.md`)
   and no application code, CSS, `db.json`, or admin file changed.
5. Confirm the existing `README.md` and `00_BACKEND_README_AND_CONVENTIONS.md` are unmodified.
6. (Optional) Run `npm run build` to confirm the doc addition does not affect the build.
