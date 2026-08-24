# App Shell — Splash Screen, Favicons & Manifest

**Prompt 4 of 30**

## Depends on

Prompt 01 — design system (palette + the pre-mount light default already applied to `index.html`'s theme script). Prompt 03 recommended first (font import consolidation agreed there).

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC on a light golden-logo palette (`--sf-*` tokens in `src/theme/storefront-tokens.css`). Brand logos: light `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png` (for light backgrounds) · white `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png` (for dark). `public/` already ships a full favicon set (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`) — but `index.html` links point at files that DON'T exist (`favicon.svg`, `logo192.png`, `logo512.png`) and `manifest.json` has an empty `icons` array.

## Objective

Bring the pre-React shell fully on-brand: redesign the inline loading/splash screen to the light editorial identity with the real logo, repair all icon references to the existing favicon set, and complete `manifest.json` (icons, colors, names, install metadata).

## Scope — files/areas to touch

- `public/index.html` — `<head>` icon/meta links, `theme-color`, OG/Twitter image references, the inline `<style>` splash-screen block (lines ~78–407), and the `#loading-screen` markup. Do NOT restructure the two inline `<script>` blocks' logic (theme pre-mount + `react-loaded` MutationObserver/fallback) — they are load-bearing; only their color literals may change (Prompt 01 already flipped the default).
- `public/manifest.json`
- Nothing else in `public/` (the favicon PNGs are used as-is), nothing in `src/`.

## Brand & design requirements

1. **Splash screen — quiet editorial arrival.** Replace the current dark green/gold "futuristic loader" (floating generic layers-SVG, letter-wave "LOADING", dual spinners) with a calm light-first moment:
   - Ground: the token ivory (copy the final hex literal from `storefront-tokens.css` — inline styles here cannot use `var()` before tokens load… actually they can, but tokens aren't imported into `index.html`; use literals synced by comment).
   - Center: the actual light logo `<img>` (the Cloudinary light-logo URL above, with width/height attributes) — replace the inline generic SVG mark. Optional wordmark line beneath in Cormorant Garamond, tracked uppercase tagline in Inter.
   - Progress: a single 1px hairline progress shimmer or slow gold underline — no spinner circus, no letter waves. A gentle logo fade-in only. Respect `prefers-reduced-motion` (static state).
   - Keep the exact mechanics: `#loading-screen` id, `.fade-out` class, `body.react-loaded` contract with `src/index.js`, the 10s fallback timeout, the MutationObserver.
   - If the saved theme is dark, the pre-mount script already sets a dark body — acceptable for the splash to stay ivory (brief moment) OR add a `body.dark #loading-screen` override to the deep charcoal + WHITE logo variant; prefer the override for polish.
2. **Icons & meta repairs** in `<head>`:
   - `<link rel="icon">` → `%PUBLIC_URL%/favicon.ico` plus the `favicon-32x32.png`/`favicon-16x16.png` sized links; `apple-touch-icon` → the real `apple-touch-icon.png`.
   - `og:image` / `twitter:image` → `%PUBLIC_URL%/android-chrome-512x512.png` (the files that actually exist).
   - `<meta name="theme-color">` → the new brand surface/ink value from Prompt 01's palette (document which token it mirrors).
   - Keep title/description/keywords structure but refresh copy to the Assamese-silk positioning (align with `db.json` `settings.seo` from Prompt 02).
   - Fonts: ensure exactly ONE load path for Inter + Cormorant Garamond (the `<link>` here; Prompt 03 removed the CSS `@import`). Keep the Material Icons stylesheet — the admin uses Material icons.
3. **`manifest.json`** — complete it:
   - `name`: "Meghali's Silk", `short_name`: "Meghali's Silk" (or a shorter mark if it truncates), `description` per brand.
   - `icons`: the two `android-chrome-*` PNGs with correct `sizes`/`type` (+ optionally the 32px favicon).
   - `start_url: "."`, `display: "standalone"`, `theme_color` + `background_color` matching the head meta / splash ground.

## Functional guardrails

1. Preserve all functionality & the data/API contract — no `src/` change; the splash's `react-loaded` handshake, theme pre-mount behavior, and fallback timeout must behave identically.
2. Token discipline: inline `<head>`/splash styles cannot consume CSS custom properties from the app bundle — copy final literal values and mark each with a `<!-- synced with storefront-tokens.css -->` style comment.
3. Do NOT modify the admin panel. (The Material Icons `<link>` stays because admin icons depend on it.)
4. Brand consistency: light logo on light splash (white logo only on the dark-mode splash override); no generic placeholder mark anywhere.
5. Accessible: splash logo `alt="Meghali's Silk"`; reduced-motion users get a static splash; `noscript` message retained.
6. No fabricated trust signals — n/a.
7. Test before done — see below.

## Implementation notes

- Verify each icon file actually exists in `public/` before linking (`ls public/`).
- Preload hint for the splash logo (`<link rel="preload" as="image" href="…">`) is worth adding so the logo doesn't pop in late.
- Check the favicon set visually — if the existing `.ico`/PNGs still show an off-brand mark, note it in a comment; regenerating icon artwork is out of scope (assets are used as-shipped per the brief).
- Hard-refresh with cache disabled when testing favicon changes; browsers cache aggressively.

## Acceptance criteria

- [ ] Splash is the light editorial treatment with the real light logo; dark-saved-theme override present; mechanics (fade-out, fallback, reduced-motion) intact.
- [ ] Zero references to non-existent files: `favicon.svg`, `logo192.png`, `logo512.png` are gone from `index.html`.
- [ ] Tab shows the favicon; `manifest.json` passes Chrome DevTools → Application → Manifest with icons resolving and correct colors.
- [ ] `theme-color` matches the new palette; OG/Twitter images resolve.
- [ ] Exactly one Google Fonts load path; serif + sans both render.
- [ ] `npm start` and a production `npm run build` complete; `build/index.html` links resolve.

## Test & QA

- `npm run dev`, hard refresh: splash appears in the new style, fades out when React mounts, never re-flashes.
- Set theme to dark, reload: no jarring wrong-color splash flash.
- DevTools → Network: all icon/font requests 200; Application → Manifest: no warnings.
- Throttle to Slow 3G: splash holds gracefully; 10s fallback still clears it if you block JS.
- Confirm existing functionality: app boots into Home, Header/nav work, admin login page still loads its icons.
