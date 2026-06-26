# Meghali's Silk — Brand & Usage Guide

**Meghali's Silk** (*Galleria Producer Company Limited*) is a heritage handloom silk house — Bengal/Kolkata
craftsmanship, a National Handloom Award winner — selling authentic women's silk sarees and ethnic wear.
This guide documents how the storefront is *themed and configured*: where the brand palette and typography
live, the content/policy knobs, the logo rule, dark-mode behaviour, the data-contract, and the product
rules a maintainer must respect. It is for re-skinning and content edits — not a code walkthrough. For
deeper detail see [`STOREFRONT_UX_GUIDELINES.md`](STOREFRONT_UX_GUIDELINES.md),
[`00_BACKEND_README_AND_CONVENTIONS.md`](00_BACKEND_README_AND_CONVENTIONS.md), and [`README.md`](README.md).

---

## 1. The token system — the single re-skin point

There is **one** place storefront brand values live:

- **`src/theme/storefront-tokens.css`** — all `--sf-*` CSS custom properties. **Light** values sit in
  `:root`; **dark** values override colour tokens under `body.dark`. Every storefront CSS Module reads
  these via `var(--sf-*)`. **Rule: never hardcode a hex value in a component — add or reuse a token.**
- **`src/theme/colors.js`** — the same brand palette as `LIGHT` / `DARK` objects for the **MUI** layer
  (the admin panel + a few MUI-based storefront bits). MUI consumes this; CSS Modules consume the tokens
  above. **Keep the brand hexes in the two files in sync.**

**Structural tokens are mode-agnostic** (declared once in `:root`, unchanged in dark): spacing
`--sf-space-1…16` (4px base), radius `--sf-radius-sm/md/lg/xl/pill`, shadows `--sf-shadow-xs…lg` +
`--sf-shadow-focus`, the type scale (`--sf-text-*`, `--sf-font-*`, `--sf-leading-*`), motion
(`--sf-transition*`), `--sf-container-max: 1280px`, and `--sf-tap-target: 44px` (WCAG 2.5.5 min touch
target). `src/theme/tokens.js` mirrors the structural scale in JS (`TOKENS`) for the rare inline-style /
framer-motion case.

---

## 2. Brand palette

Dark mode is the **primary** experience; light values are listed where they differ.

| Token | Dark (primary) | Light | Use |
|---|---|---|---|
| `--sf-color-brand-green` / `--brand-logo-bg` | `#0B3B2E` | `#0B3B2E` | Deep panels & the logo background (see §5) |
| `--sf-color-brand-green-deep` | `#0A2E24` | `#0A2E24` | Darkest green |
| `--sf-color-gold` | `#CBA35A` | `#CBA35A` | Headings/dividers/PREMIUM accents, rating stars |
| `--sf-color-gold-light` | `#E6C27A` | `#E6C27A` | Light gold |
| `--sf-color-gold-deep` | `#B6863C` | `#B6863C` | Deep gold |
| `--sf-color-emerald` | `#12B886` | `#12B886` | Primary CTA (`--sf-color-accent`) |
| `--sf-color-emerald-hover` | `#0FA577` | `#0FA577` | CTA hover |
| `--sf-color-price` | `#E6C27A` | `#9A7728` | Current/sale price |
| `--sf-color-compare` | `#8A8F8C` | `#9CA3AF` | Struck-through original price |
| `--sf-color-discount` | `#2FCF9B` | `#0F7A56` | "% off" + savings |
| `--sf-color-star` | `#E6C27A` | `#CBA35A` | Rating stars |

**Category-accent dots** (mode-agnostic): `--sf-cat-pink` `#EC4899`, `--sf-cat-purple` `#8B5CF6`,
`--sf-cat-orange` `#F59E0B`, `--sf-cat-blue` `#3B82F6`, `--sf-cat-teal` `#14B8A6`, `--sf-cat-red` `#EF4444`.

**Gradients** (mode-agnostic):

- `--sf-gradient-gold` — `linear-gradient(135deg, #E6C27A 0%, #CBA35A 50%, #B6863C 100%)`
- `--sf-gradient-heritage` — `linear-gradient(135deg, #6D28D9 0%, #9333EA 50%, #DB2777 100%)`
- `--sf-gradient-announce-1` — `linear-gradient(90deg, #0B3B2E, #12B886)`
- `--sf-gradient-announce-2` — `linear-gradient(90deg, #EC4899, #8B5CF6)`
- `--sf-gradient-announce-3` — `linear-gradient(90deg, #F59E0B, #F97316)`

---

## 3. Typography

- `--sf-font-display` → **"Cormorant Garamond"** (display/headings, weights 600/700; falls back to
  Playfair Display, Georgia, serif).
- `--sf-font-family` → **"Inter"** (body/UI; system-font fallbacks).

Both load via Google Fonts in [`public/index.html`](public/index.html) (Cormorant Garamond 500/600/700 +
Inter 300–900).

---

## 4. The logo-on-green rule

The logo PNG ships with its own deep-green background, so it must **always** sit on a `--brand-logo-bg`
(`#0B3B2E`) panel — identical in light and dark. Logo URL:

```
https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png
```

It appears in the header, mobile menu drawer, footer, and admin sidebar + login — each on a green panel.
The **admin** uses a small inline green wrapper because the admin layer does not consume `--sf-*` tokens.

---

## 5. How to re-skin the palette

1. Edit values in `src/theme/storefront-tokens.css` — change them in **both** `:root` (light) and
   `body.dark` (dark) for any colour token that differs per mode.
2. Mirror the brand hues in `src/theme/colors.js` (`LIGHT` / `DARK`) so the MUI/admin layer matches.
3. That is the whole re-skin — **no component edits**. Components only read tokens.

When you introduce a new shared value, add it as a token; never inline a hex in a component.

---

## 6. How to tweak content / policy

- **`src/theme/tokens.js` → `STOREFRONT_CONFIG`** — themeable persuasive surfaces without touching
  components:
  - `trustBadges` — ordered list of ids drawn from `TRUST_BADGE_CATALOG`
    (`genuine`, `securePayment`, `easyReturns`, `freeShipping`, `support`, `warranty`, `cod`).
  - `returnsWindowDays` (default `7`; `0` advertises "no returns").
  - `aov` — `frequentlyBoughtTogether`, `relatedProducts`, `maxRelated`, `maxBundle`.
  - `gallery` — `zoom`, `thumbnailPosition`.
- **`src/utils/constants.js`** — `APP_NAME` (from `REACT_APP_NAME`, default `"Meghali's Silk"`),
  `APP_TAGLINE`, `APP_DESCRIPTION`, contact (`SUPPORT_EMAIL/PHONE/ADDRESS/HOURS`), `SOCIAL_LINKS`,
  `FAQ_ITEMS`, `TRUST_BADGES` copy, `FREE_SHIPPING_THRESHOLD`, `POLICY_LAST_UPDATED`.
- **Catalog/store data → `db.json`**: `products`, `categories`, `banners`, `coupons`, `reviews`,
  `shipping_methods`, `settings` (`store` / `social` / `seo`), `dealsConfig`. Keep the existing JSON
  shapes/keys/id conventions: INR **integers**, ISO `…Z` dates, and referential integrity across
  `categoryId`, `relatedProductIds`, `frequentlyBoughtTogetherIds`, review references, and `dealsConfig`
  ids.

---

## 7. Dark-mode-default behaviour

Dark is the default on a fresh profile. `src/context/ThemeContext.js` persists the user's choice in
`localStorage.theme` and toggles `body.dark` / `body.light`. A small pre-mount script in
[`public/index.html`](public/index.html) reads `localStorage.theme` and applies the class **before** React
mounts (dark unless explicitly `"light"`), preventing a flash of the wrong theme.

---

## 8. Architecture & data-contract note

All backend access goes through **`src/services/api.js`** (`apiService`) — **no `fetch`/`axios` calls
outside `apiService`.** The app swaps JSON Server ↔ a real Laravel API by changing only **`.env`**:
`REACT_APP_API_URL` + `REACT_APP_USE_MOCK_API` (see `src/services/baseURL.js`; mock = JSON Server on
`http://localhost:3001`). No other code changes are required to switch backends.

Note: the cart is a **`CartDrawer`** (there is no `/cart` route), and the **admin panel is out of scope**
for the redesign except the logo swap.

---

## 9. Authenticity > persuasion (hard product rule)

From [`STOREFRONT_UX_GUIDELINES.md`](STOREFRONT_UX_GUIDELINES.md) — a non-negotiable constraint:

- No fabricated reviews, stock counts, urgency, or social proof.
- Persuasive UI binds to **real API data** at render time; if there's no data, the element renders
  nothing.
- Honest empty states everywhere.

`STOREFRONT_CONFIG` values are store-owner-attested *policy* (e.g. "we offer 7-day returns"), not live
demand/stock/rating signals — those must always come from the API.

---

## 10. Quick reference

```bash
npm install     # install deps
npm run dev     # CRA dev server + JSON Server on :3001 (concurrently)
npm run build   # production build
```

See [`STOREFRONT_UX_GUIDELINES.md`](STOREFRONT_UX_GUIDELINES.md) and
[`00_BACKEND_README_AND_CONVENTIONS.md`](00_BACKEND_README_AND_CONVENTIONS.md) for deeper detail.
