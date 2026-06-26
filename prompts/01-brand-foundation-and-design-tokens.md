<!-- Batch A — Foundation & Brand System -->
# Prompt 01 — Brand Foundation & Design Tokens

## Objective
Re-skin the storefront's single source of truth — `src/theme/storefront-tokens.css` — from the generic
purple/blue boilerplate to the **Meghali's Silk** brand system (dark-first charcoal canvas, deep
bottle-green brand panels, gold/champagne accents, emerald CTAs, elegant serif headings). Align the MUI
palette in `colors.js`, load the brand fonts, make **dark mode the default**, and update all brand
config touch-points (`.env`, `public/index.html`, `manifest.json`, `STOREFRONT_CONFIG`). This prompt
establishes the foundation every later prompt depends on, including the **logo-on-green rule** as a token.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The visual language is **dark, luxurious, gold-on-green**.

Match the brand defined by `UI Designs/Logo.png` (gold serif wordmark on deep bottle-green with a faint
gold temple-arch motif) and the dark, premium look across `UI Designs/DESKTOP SCREEN VIEW.png` and
`UI Designs/HOME PAGE WITH FOOTER.png`.

Sampled palette (dark mode is the **primary/default** experience):
- **Brand green** (the logo's own background; deep panels): `#0B3B2E`, deeper `#0A2E24`
- **Page background** (near-black charcoal, faint warm tint): `#0B0C0B` / `#101312`
- **Card / surface**: `#15171A`; surface-2 `#1B1E20`; hairline borders `rgba(255,255,255,0.06)` and a
  gold-tinted variant `rgba(203,163,90,0.18)`
- **Gold / champagne** (headings, prices, PREMIUM badge, dividers): `#CBA35A` (primary), `#D9B871`
  (mid), `#E6C27A` (light); gold gradient `linear-gradient(135deg,#E6C27A 0%,#CBA35A 50%,#B6863C 100%)`
- **Primary CTA emerald**: `#12B886` (hover `#0FA577`), contrast text `#04130E`
- **Compare/struck price**: muted grey `#8A8F8C`
- **Category-accent dots**: pink `#EC4899`, purple `#8B5CF6`, orange `#F59E0B`, blue `#3B82F6`,
  teal `#14B8A6`, red `#EF4444`
- **Announcement-bar gradients** (to cycle): green→teal `linear-gradient(90deg,#0B3B2E,#12B886)`,
  pink→purple `linear-gradient(90deg,#EC4899,#8B5CF6)`, orange `linear-gradient(90deg,#F59E0B,#F97316)`
- **Heritage/Luxury banner gradient**: `linear-gradient(135deg,#6D28D9 0%,#9333EA 50%,#DB2777 100%)`

Light mode (must stay coherent; secondary to dark): warm ivory `#FBF8F2` bg, white surface, deep-green
text `#10221C`, the SAME brand green `#0B3B2E` for the logo panel, slightly deeper gold for text on
white (`#9A7728`/`#B6863C`), emerald CTA `#12B886` (darken on hover).

Typography: display/headings serif **"Cormorant Garamond"** (600/700); body/UI sans **"Inter"**.

**Logo-on-green rule (establish here):** the logo PNG ships with its own deep-green background, so it
must always sit on a panel filled with that SAME green. Expose it as a token so every placement reuses
it. Logo URL: `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`.

## Scope — Files to Create / Modify
- (MODIFY) `src/theme/storefront-tokens.css` — rewrite all `--sf-*` color tokens (light `:root` + dark
  `body.dark`); add new brand tokens; keep structural tokens (spacing/radius/shadow/type scale).
- (MODIFY) `src/theme/colors.js` — update `LIGHT`/`DARK` brand hues so the MUI layer matches.
- (MODIFY) `src/context/ThemeContext.js` — make dark the default when no saved theme; keep the
  `body.dark`/`body.light` toggle + `localStorage` persistence intact.
- (MODIFY) `public/index.html` — Google Fonts (add Cormorant Garamond), `<title>`, meta
  description/keywords/author, OG/Twitter tags, `theme-color` (`#0B3B2E`), the pre-mount theme script
  (default dark) and the inline loading-screen brand name/colors.
- (MODIFY) `public/manifest.json` — name/short_name/theme_color/background_color.
- (MODIFY) `.env` and `.env.production` — `REACT_APP_NAME=Meghali's Silk`.
- (MODIFY) `src/theme/tokens.js` — `STOREFRONT_CONFIG` (trust badges order, `returnsWindowDays`).
- (MODIFY) `src/utils/constants.js` — `APP_TAGLINE`, `APP_DESCRIPTION`, `TRUST_BADGES` copy only here
  (contact details are handled in a later prompt; you may leave them).
- **OUT of scope:** any component/page restyle (later prompts), the admin theme
  (`src/theme/adminTheme.js`), `db.json` data, the favicon PNG binaries (just wire the references).

## Detailed Requirements
1. **`storefront-tokens.css` — `:root` (LIGHT) block.** Replace the brand/surface/text/commerce color
   values with the light palette above. Specifically:
   - `--sf-color-primary` → brand green `#0B3B2E`; `--sf-color-primary-dark` `#0A2E24`;
     `--sf-color-primary-light` `#13573F`; `--sf-color-primary-contrast` `#FFFFFF`;
     `--sf-color-primary-soft` `rgba(11,59,46,0.08)`.
   - `--sf-color-secondary` → gold `#B6863C`; `--sf-color-accent` → emerald `#12B886`.
   - `--sf-gradient-primary` → the gold gradient; `--sf-gradient-primary-hover` a reversed/darker gold.
   - Surfaces: `--sf-color-bg` `#FBF8F2`; `--sf-color-surface` `#FFFFFF`; `--sf-color-surface-2`
     `#F4EFE6`; `--sf-color-surface-hover` `#FAF6EE`.
   - Text: `--sf-color-text` `#10221C`; `--sf-color-text-secondary` `#4A5550`;
     `--sf-color-text-muted` `#7A837E`.
   - Borders: `--sf-color-border` `#E7E0D2`; `--sf-color-border-strong` `#D7CDBA`.
   - Commerce: `--sf-color-star` `#CBA35A`; `--sf-color-price` `#9A7728` (gold readable on white);
     `--sf-color-compare` `#9CA3AF`; `--sf-color-discount` `#0F7A56`;
     `--sf-color-discount-bg` `rgba(18,184,134,0.12)`; `--sf-color-badge-bg` `rgba(11,59,46,0.06)`.
2. **`storefront-tokens.css` — `body.dark` block (PRIMARY).** Override the color tokens to the dark
   palette:
   - `--sf-color-primary` keeps brand green `#0B3B2E` but use a brighter interactive green where needed;
     set `--sf-color-primary-light` `#1C6E50`, `--sf-color-primary-soft` `rgba(18,184,134,0.14)`.
   - `--sf-color-secondary` gold `#CBA35A`; `--sf-color-accent` emerald `#12B886`.
   - `--sf-color-bg` `#0B0C0B`; `--sf-color-surface` `#15171A`; `--sf-color-surface-2` `#1B1E20`;
     `--sf-color-surface-hover` `#1F2326`.
   - `--sf-color-text` `#F3EFE6`; `--sf-color-text-secondary` `#C3C9C4`; `--sf-color-text-muted`
     `#8A918C`.
   - `--sf-color-border` `rgba(255,255,255,0.07)`; `--sf-color-border-strong` `rgba(203,163,90,0.28)`.
   - `--sf-color-overlay` `rgba(0,0,0,0.7)`.
   - Commerce: `--sf-color-star` `#E6C27A`; `--sf-color-price` `#E6C27A`; `--sf-color-compare`
     `#8A8F8C`; `--sf-color-discount` `#2FCF9B`; `--sf-color-discount-bg` `rgba(18,184,134,0.16)`;
     `--sf-color-badge-bg` `rgba(203,163,90,0.14)`.
   - Dark shadows: deepen the existing `--sf-shadow-*` and set `--sf-shadow-focus`
     `0 0 0 3px rgba(18,184,134,0.5)`.
3. **Add NEW brand tokens** (declare in `:root`, override under `body.dark` only where the value
   differs) — these are consumed by later prompts, so name them exactly:
   - `--sf-color-brand-green: #0B3B2E;` and alias `--brand-logo-bg: #0B3B2E;` (the logo panel fill —
     same in both modes).
   - `--sf-color-brand-green-deep: #0A2E24;`
   - `--sf-color-gold: #CBA35A;` `--sf-color-gold-light: #E6C27A;` `--sf-color-gold-deep: #B6863C;`
   - `--sf-gradient-gold: linear-gradient(135deg,#E6C27A 0%,#CBA35A 50%,#B6863C 100%);`
   - `--sf-gradient-heritage: linear-gradient(135deg,#6D28D9 0%,#9333EA 50%,#DB2777 100%);`
   - `--sf-gradient-announce-1: linear-gradient(90deg,#0B3B2E,#12B886);`
     `--sf-gradient-announce-2: linear-gradient(90deg,#EC4899,#8B5CF6);`
     `--sf-gradient-announce-3: linear-gradient(90deg,#F59E0B,#F97316);`
   - Category-accent tokens: `--sf-cat-pink:#EC4899; --sf-cat-purple:#8B5CF6; --sf-cat-orange:#F59E0B;
     --sf-cat-blue:#3B82F6; --sf-cat-teal:#14B8A6; --sf-cat-red:#EF4444;`
   - `--sf-color-emerald: #12B886;` `--sf-color-emerald-hover: #0FA577;`
     `--sf-color-emerald-contrast: #04130E;`
4. **Typography tokens.** Add `--sf-font-display: "Cormorant Garamond", "Playfair Display", Georgia,
   serif;` and keep `--sf-font-family` as `"Inter", ...` (body). Do not change the numeric type scale.
5. **`colors.js`.** Update `LIGHT`/`DARK` so MUI primary = brand green, secondary = gold, accents =
   emerald, `gradient.primary` = gold gradient, dark `background.default` `#0B0C0B` / `paper` `#15171A`,
   light `background.default` `#FBF8F2` / `paper` `#FFFFFF`, `bodyBackground` updated to match. Keep the
   object shapes identical (do not rename keys).
6. **Dark default.** In `ThemeContext.js`, change the initial `isDarkMode` fallback so that with **no**
   saved theme it defaults to **dark** (i.e. dark unless the user explicitly chose light). Keep reading/
   writing `localStorage.theme` and toggling `body.dark`/`body.light`.
7. **`public/index.html`.**
   - Add Cormorant Garamond to the Google Fonts `<link>` (keep Inter), e.g.
     `family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@300;400;500;600;700;800;900`.
   - `<title>` → `Meghali's Silk — Authentic Handloom Silk Sarees & Ethnic Wear`.
   - Update meta description/keywords/author, OG/Twitter title+description+url to the brand.
   - `theme-color` → `#0B3B2E`.
   - In the pre-mount inline `<script>`, make the **default dark** (mirror ThemeContext) and set the
     dark background to `#0B0C0B`, the light background to `#FBF8F2`.
   - In the loading screen markup, change `.loader-brand-name` text to `MEGHALI'S SILK`, the tagline to
     a brand line, and recolor the loader gradient to gold/green (swap the purple/pink hexes for
     `#E6C27A`/`#12B886`/`#0B3B2E`). Keep the loader mechanism (`react-loaded` class) intact.
8. **`public/manifest.json`.** `name` `Meghali's Silk`, `short_name` `Meghali's Silk`,
   `theme_color` `#0B3B2E`, `background_color` `#0B0C0B`.
9. **`.env` / `.env.production`.** Set `REACT_APP_NAME=Meghali's Silk` in both (this drives `APP_NAME`).
10. **`STOREFRONT_CONFIG`** (`src/theme/tokens.js`). Order trust badges to match the brand strip:
    `["easyReturns","genuine","freeShipping","support"]` (or keep 4 that map to 7-Day Returns / Authentic
    Silk / Free Shipping / Support); keep `returnsWindowDays: 7`. Do not remove keys.
11. **`constants.js`.** `APP_TAGLINE` → e.g. `"Heritage handloom silk, woven for you"`;
    `APP_DESCRIPTION` → a silk-apparel sentence; `TRUST_BADGES` array → `["7-Day Easy Returns",
    "100% Money Back","Free Shipping","Authentic Silk"]`.
12. **Reduced motion / structural tokens** — leave the `@media (prefers-reduced-motion)` block and all
    spacing/radius/shadow/type *scales* as-is (only color/shadow values change). Do not introduce
    hardcoded hex anywhere outside these token files.

## Data / API Notes
- No `db.json` or `apiService` changes in this prompt. `APP_NAME` is read from `REACT_APP_NAME` via
  `src/utils/constants.js`. The store name/contact in `db.json → settings` is handled in prompt 06.
- The token names introduced here (`--sf-color-brand-green`, `--brand-logo-bg`, `--sf-font-display`,
  `--sf-color-gold*`, `--sf-gradient-gold`, `--sf-gradient-heritage`, announcement/category tokens,
  `--sf-color-emerald*`) are a **contract** later prompts rely on — define them exactly as named.

## Constraints (Do Not Break)
- `storefront-tokens.css` and `colors.js` are the ONLY places brand hex values live; components must
  keep consuming `var(--sf-*)`. Do not hardcode hex in components in this or any later prompt.
- Keep all existing `--sf-*` token NAMES (only change values); keep `colors.js` object shapes/keys.
- Do not touch the admin theme (`src/theme/adminTheme.js`) or any admin file.
- Keep the JSON Server ↔ Laravel swap contract intact (only `REACT_APP_NAME` changes in `.env`).
- Preserve the loading-screen mechanism and the pre-mount no-flash theme script behavior.
- Maintain WCAG contrast (gold text on dark ≥ 4.5:1 for body sizes; the lighter gold `#E6C27A` for small
  text on dark, the deeper `#9A7728` for text on white).

## Acceptance Criteria / Definition of Done
- [ ] App boots in **dark mode by default** (fresh profile / cleared `localStorage`), with a near-black
      charcoal background and gold/green accents — no purple/blue boilerplate colors remain.
- [ ] Toggling the theme switches to a coherent warm-ivory light mode and back; choice persists across
      reload with no flash of the wrong theme.
- [ ] All new tokens exist and resolve in DevTools (`getComputedStyle(document.body)` shows
      `--sf-color-brand-green`, `--sf-color-gold`, `--sf-font-display`, etc.) in both modes.
- [ ] Cormorant Garamond loads (visible on any `--sf-font-display` element later) and Inter still loads.
- [ ] Browser tab shows "Meghali's Silk …" title; `theme-color` is green; loading screen reads
      MEGHALI'S SILK with gold/green loader.
- [ ] `REACT_APP_NAME=Meghali's Silk` so `APP_NAME` resolves brand-wide.
- [ ] `npm run build` completes with no errors; no console errors at runtime.

## Verification Steps
1. `npm install` (if needed), then `npm run dev` (starts CRA + JSON Server) and open the app.
2. In a fresh/incognito window, confirm the first paint is **dark** with the new palette.
3. Toggle theme (header switch) → verify light mode coherence; reload → choice persists, no flash.
4. DevTools console: `getComputedStyle(document.body).getPropertyValue('--sf-color-gold')` → returns the
   gold hex; repeat for `--sf-color-brand-green` and `--sf-font-display`.
5. Confirm the document title, `theme-color` meta, and loading-screen brand name are updated.
6. Run `npm run build` and confirm a clean build.
