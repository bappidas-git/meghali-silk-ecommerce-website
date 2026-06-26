<!-- Batch C — Global Layout / Navigation -->
# Prompt 10 — Footer

## Objective
Redesign the global storefront `Footer` into the Meghali's Silk footer from the mockup: a deep-green /
charcoal multi-column footer with a **brand column** (logo on a deep-green panel + tagline + social
icons), link columns (Shop by category, Company, Support, Legal), a **newsletter signup** (posts via the
existing leads API), a **payment-methods + trust** row, and a bottom copyright bar — all token-driven,
accessible, responsive, with every link pointing at a real route.

## Brand & Design Context
*Meghali's Silk* is a heritage handloom silk house; the footer is **deep-green / charcoal with gold
dividers and gold section headings**, an elegant serif for headings. Match
**`UI Designs/HOME PAGE WITH FOOTER.png`** (scroll to the bottom): a wide footer with the brand block on
the left (logo + short tagline + a row of social glyphs), several link columns, a newsletter input with a
gold/emerald subscribe button, a payment-icons + trust row, and a slim copyright line with legal links.

Consume only tokens from `src/theme/storefront-tokens.css` — never hardcode hex:
- `--brand-logo-bg` (`#0B3B2E`, logo panel), `--sf-color-brand-green`/`--sf-color-brand-green-deep`,
  `--sf-color-gold`/`--sf-gradient-gold` (dividers, headings, accents), `--sf-color-emerald` (subscribe
  CTA), `--sf-color-surface{,-2}`, `--sf-color-text{,-secondary,-muted}`, `--sf-color-border{,-strong}`,
  `--sf-font-display` (headings), `--sf-font-family` (body/links), radii, spacing, shadows.

**Logo rule:** render the logo image at
`https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png` inside a panel filled
with `var(--brand-logo-bg)` so it never floats on a different surface. Provide `alt={APP_NAME}`, fixed
dimensions, and `loading="lazy"`.

## Scope — Files to Create / Modify
- (MODIFY) `src/components/Footer/Footer.js` — restructure columns, brand block, newsletter, trust row.
- (MODIFY) `src/components/Footer/Footer.module.css` — restyle to match the mockup, token-driven.
- **OUT of scope:** do NOT change `src/App.js`, contexts, `src/services/api.js`, or `src/utils/constants.js`
  (consume them as-is). Do NOT touch the admin panel.

## Detailed Requirements
The current `Footer.js` already implements: `useTheme` (isDarkMode), `useDealsConfig` (enabled), a
newsletter form that calls **`apiService.leads.createNewsletter(email)`** with honest idle/success/error
states (it does NOT fake success on failure — keep this), `SOCIAL_LINKS` from `src/utils/constants.js`
with a `.filter((s) => s.url)` so an icon renders **only when its URL is non-empty**, link arrays for
Quick Links / Customer Service (filtered by `dealsEnabled` so no dead deals links), a Contact column
(`SUPPORT_ADDRESS/EMAIL/PHONE/HOURS`), a payment + trust bar, and a bottom legal bar (Terms `/terms`,
Privacy `/privacy`, Cookies `/cookies`). **Preserve the newsletter logic, the social-link non-empty
guard, and the deals filtering.**

1. **Brand column.** Replace the text-only `brandName` heading with the **logo image on a
   `var(--brand-logo-bg)` panel** (the logo rule), followed by a short brand **tagline** (use
   `APP_TAGLINE` from `src/utils/constants.js`, or `settings.store.tagline` if you wire it — see Data
   Notes; prefer the constant to stay simple) and the existing **social icons row**. Keep the
   `socialLinks` array sourced from `SOCIAL_LINKS` and the `.filter((s) => s.url)` so empty handles are
   not rendered. Each social link keeps `target="_blank" rel="noopener noreferrer"` and an `aria-label`,
   ≥44px hit area.
2. **Link columns (all real routes).** Provide clearly-titled columns with gold serif headings. Map them
   to real routes in `src/App.js` (no path may hit the catch-all redirect):
   - **Shop by category** — links into `/products?...` (e.g. Sarees / Suits / Dupattas / Bridal via
     `/products?category=<slug>` or curated `/products?sort=newest` etc.). You may keep the existing
     "Quick Links" set (Products `/products`, New Arrivals `/products?sort=newest`, Best Sellers
     `/products?sort=popular`, and the deals links filtered by `dealsEnabled`) and relabel the column
     "Shop". Do NOT hardcode category slugs that may not exist — prefer sort/listing deep-links, or
     fetch categories (optional) via `apiService.categories.getAll()` and link the first few.
   - **Company** — include **Our Story → `/about`** (route is `/about`, page is AboutUs) plus other real
     pages as desired (e.g. Special Offers `/special-offers` when `dealsEnabled`).
   - **Support** — **Support → `/support`**, **Help Center → `/help`**, Order Tracking `/orders`, My
     Account `/profile`, Returns & Exchange `/refund`.
   - **Legal** — Privacy `/privacy`, Terms `/terms`, Cookies `/cookies`, Refund `/refund`. (Use these
     exact paths — they all exist in `src/App.js`.)
   Use react-router `<Link>` for all internal links (already imported). Keep the existing Contact column
   (address/email/phone/hours from constants) if it fits the layout, or fold contact into the Support
   column — but do not drop the real contact details.
3. **Newsletter signup (keep behavior, restyle).** Keep the form posting to
   `apiService.leads.createNewsletter(email)` with `isEmailValid` validation and the idle/success/error
   states (do not fabricate success on error — surface real failures, per the authenticity rule).
   Restyle the input + **subscribe button** with brand tokens (emerald or gold CTA, e.g. reuse
   `.sf-btn--emerald`/`.sf-btn--gold` from `src/theme/storefront-primitives.css`). Keep `aria-label`,
   `aria-invalid`, and the `role="alert"`/`role="status"` messages.
4. **Payment-methods + trust row.** Keep a payment-methods strip (Visa / Mastercard / UPI / COD — the
   existing inline SVG badges are fine; they may keep their brand-mandated payment-network colors as
   those are external logos, but the surrounding chrome must be token-driven) and a short trust row
   (Secure Payment · Easy Returns · Free Shipping* · 24/7 Support, or reuse the four brand reassurances).
   Style dividers/labels with gold tokens.
5. **Bottom bar.** Keep the `© <year> <APP_NAME>. All rights reserved.` line and the legal links
   (Terms/Privacy/Cookies). Optionally add a small "Last updated" using `POLICY_LAST_UPDATED` from
   constants for legal context. Restyle with a gold hairline divider above it.
6. **Grid & layout (concrete).** Use a responsive CSS grid for the columns inside a
   `max-width: var(--sf-container-max)` (1280px) centered container with horizontal gutters. Desktop:
   the brand column spans wider (e.g. ~1.4fr) with the link columns as equal tracks beside it
   (`grid-template-columns: 1.4fr repeat(4, 1fr)` or a 4–5 column auto-fit); the newsletter may sit as a
   full-width band above or beside the brand block per the mockup. Tablet: 2–3 columns. Mobile: a single
   stacked column with the brand block first and each link group as a labelled section (optionally
   collapsible). Column headings use `--sf-font-display` in `var(--sf-color-gold)`; link lists use
   `--sf-font-family` with `--sf-color-text-secondary` (→ `--sf-color-text`/gold on hover). Separate
   major bands (main → payment/trust → bottom) with thin gold-tinted dividers (`--sf-color-border-strong`).
7. **Layout, theme, a11y.** Deep-green/charcoal background using brand tokens; gold dividers and gold
   serif headings. Responsive: multi-column on desktop collapsing to stacked sections on mobile (and the
   footer must clear the mobile `BottomNav` — add `padding-bottom` so the copyright isn't hidden behind
   the dock on mobile; account for `env(safe-area-inset-bottom)`). Honor `body.dark`/`body.light` purely
   through tokens. All links keyboard-reachable with visible `:focus-visible` rings; the logo image
   lazy-loaded with `alt`.

## Data / API Notes
- **`apiService.leads.createNewsletter(email)`** is the only API call (already wired) — it returns a
  uniform response and must keep its honest success/error handling; do not change its contract or add
  direct `fetch`/`axios`.
- `SOCIAL_LINKS`, `APP_NAME`, `APP_TAGLINE`, `SUPPORT_EMAIL/PHONE/ADDRESS/HOURS`, `POLICY_LAST_UPDATED`
  come from `src/utils/constants.js`. Render a social icon **only when its URL is non-empty** (keep the
  `.filter((s) => s.url)`). Optionally, store social handles also live in `db.json → settings.social`; if
  you choose to source from settings instead, fetch via `apiService.settings.get()` and still render only
  non-empty URLs — but constants are sufficient and simpler; either way, never render an empty/`#` link.
- Optional category links may use `apiService.categories.getAll()`; otherwise use `/products?sort=...`
  deep-links. `db.json` shapes are unchanged. Preserve the JSON Server ↔ Laravel swap contract.
- Every link target must resolve to a real route in `src/App.js`: `/products`, `/about`, `/support`,
  `/help`, `/orders`, `/profile`, `/wishlist`, `/special-offers` (deals-gated), `/privacy`, `/terms`,
  `/cookies`, `/refund`. No path may fall through to the catch-all `/` redirect.

## Constraints (Do Not Break)
- Keep the newsletter functional and honest (real success/error; no fake success), and keep the social
  non-empty guard and the `dealsEnabled` link filtering.
- Re-skin only via tokens / shared primitive classes — **no hardcoded hex** in `Footer.js`/
  `Footer.module.css` (external payment-network logo SVGs may keep their official colors).
- The brand logo image must sit on a `var(--brand-logo-bg)` panel (the logo rule).
- All internal links use react-router `<Link>` and point at real routes (no dead links / no catch-all).
- Do not modify the admin panel, `src/App.js`, contexts, `src/services/api.js`, or constants.
- Accessibility: `aria-label`s on social/icon links, `role="alert"`/`role="status"` newsletter messages,
  ≥44px targets, visible `:focus-visible` rings; responsive + mobile-first; footer clears the mobile
  bottom nav; logo lazy-loaded.

## Acceptance Criteria / Definition of Done
- [ ] Footer matches `UI Designs/HOME PAGE WITH FOOTER.png`: brand column (logo-on-green + tagline +
      socials), link columns (Shop / Company / Support / Legal), newsletter, payment + trust row, bottom
      copyright with legal links.
- [ ] The logo renders as the Cloudinary image on a deep-green (`--brand-logo-bg`) panel.
- [ ] Newsletter submit calls `apiService.leads.createNewsletter`; a valid email shows success, an
      invalid email shows the inline error, and a simulated network failure shows the error (not a fake
      success).
- [ ] Social icons render only for non-empty `SOCIAL_LINKS` URLs; every footer link resolves to a real
      route (none redirect to `/`); deals links disappear when `dealsEnabled` is false.
- [ ] Deep-green/charcoal background with gold dividers/headings; dark + light coherent; footer clears
      the mobile bottom nav.
- [ ] No hardcoded hex (except external payment logos); no console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev` and scroll to the footer on `/`.
2. Confirm the logo sits on a green panel, the tagline shows, and only configured social icons appear.
3. Submit the newsletter with an invalid email → inline error; with a valid email → success message;
   (optionally stop JSON Server to confirm a real failure shows the error state, not success).
4. Click each footer link (Shop / Company / Support / Legal) → every one lands on a real page; none
   redirect to `/`. Toggle deals off (DealsConfig) → deals links disappear.
5. Toggle the theme → footer stays coherent (deep-green/charcoal ⇄ light). Resize to mobile → columns
   stack and the copyright is not hidden behind the bottom nav.
6. Tab through links/buttons → visible focus rings, ≥44px targets.
7. `npm run build` → clean.
