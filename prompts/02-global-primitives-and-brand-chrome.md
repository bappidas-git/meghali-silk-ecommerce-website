<!-- Batch A — Foundation & Brand System -->
# Prompt 02 — Global Primitives & Brand Chrome

## Objective
Establish the shared, token-driven brand **primitives** that the rest of the storefront reuses
everywhere: button styles (gold primary, emerald CTA, ghost/outline), badge/chip/pill styles (discount
badge, PREMIUM ribbon, category chip), the card surface style, the gradient **announcement/promo top
bar** (cycling messages), the **trust strip** (7-Day Easy Returns · 100% Money Back · Free Shipping ·
Authentic Silk), and **toast + skeleton-loader** styling. Deliver these as one shared CSS file of
reusable classes plus two small reusable React components, so later prompts (Header, pages) simply
import and consume them. This prompt does NOT wire them into the Header or any page.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The look is **dark-first, luxurious, gold-on-green** with emerald CTAs
and an elegant serif for display type.

Tokens already exist in `src/theme/storefront-tokens.css` (light values in `:root`, dark under
`body.dark`). Consume these by name — never hardcode hex:
- Brand green / logo panel: `--brand-logo-bg` (`#0B3B2E`), `--sf-color-brand-green`,
  `--sf-color-brand-green-deep`.
- Gold/champagne: `--sf-color-gold`, `--sf-color-gold-light`, `--sf-color-gold-deep`,
  `--sf-gradient-gold`.
- Emerald CTA: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`.
- Announcement-bar gradients (cycle these three): `--sf-gradient-announce-1` (green→teal),
  `--sf-gradient-announce-2` (pink→purple), `--sf-gradient-announce-3` (orange).
- Heritage banner gradient: `--sf-gradient-heritage`.
- Surfaces/text/border: `--sf-color-surface{,-2,-hover}`, `--sf-color-text{,-secondary,-muted}`,
  `--sf-color-border{,-strong}`, `--sf-color-overlay`.
- Commerce: `--sf-color-price`, `--sf-color-compare`, `--sf-color-discount{,-bg}`,
  `--sf-color-star`, `--sf-color-badge-bg`.
- Radius `--sf-radius-{sm,md,lg,xl,pill}`, spacing `--sf-space-1..16`, shadow `--sf-shadow-{xs,sm,md,lg,focus}`,
  type `--sf-font-display` (serif), `--sf-font-family` (Inter), `--sf-text-{xs..3xl}`,
  `--sf-font-{normal..bold}`, motion `--sf-transition{,-fast,-slow}`, layout
  `--sf-container-max` (1280px), `--sf-tap-target` (44px), z-index `--sf-z-{sticky,stickybar,overlay,modal}`.

Match the **announcement bar + trust strip** band shown at the very top of
`UI Designs/DESKTOP SCREEN VIEW.png` (a slim gradient promo line above a teal/green four-item trust
strip with icons), and the **card / badge / chip** treatments visible across
`UI Designs/HOME PAGE HIDE FOOTER.png` (rounded dark product cards with a top-left discount badge, gold
prices, category pills) and the green/gold toast in the corner of `UI Designs/DESKTOP SCREEN VIEW.png`.

**Logo rule (applies wherever the logo is placed):** the logo PNG ships with its own deep-green
background, so it MUST sit on a panel filled with `var(--brand-logo-bg)` (`#0B3B2E`) so it never floats
on a different surface. Logo URL: `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`.
(This prompt does not render the logo itself; later chrome prompts do — but the primitives must not
fight that rule.)

## Scope — Files to Create / Modify
- (CREATE) `src/theme/storefront-primitives.css` — shared, reusable, token-driven classes (buttons,
  badges/chips/pills, card surface, skeleton, toast). Plain CSS (NOT a CSS Module) so the classes are
  globally usable; prefix every class with `sf-` to avoid collisions.
- (MODIFY) `src/index.css` — add a single `@import "./theme/storefront-primitives.css";` directly
  after the existing `storefront-tokens.css` import so the primitives load app-wide exactly once.
- (CREATE) `src/components/AnnouncementBar/AnnouncementBar.js` — the cycling gradient promo bar.
- (CREATE) `src/components/AnnouncementBar/AnnouncementBar.module.css`.
- (CREATE) `src/components/AnnouncementBar/index.js` — `export { default } from "./AnnouncementBar";`.
- (CREATE) `src/components/TrustStrip/TrustStrip.js` — the four-item trust strip.
- (CREATE) `src/components/TrustStrip/TrustStrip.module.css`.
- (CREATE) `src/components/TrustStrip/index.js` — `export { default } from "./TrustStrip";`.
- **OUT of scope:** wiring these into `Header`, `SidebarMenu`, `Footer`, pages, or routing (Header
  prompt and page prompts import them). Do NOT edit `src/theme/storefront-tokens.css` (tokens already
  exist; if a token you need is missing, consume the closest existing one — do not invent hex). Do NOT
  touch any admin file.

## Detailed Requirements

### A. `storefront-primitives.css` — reusable classes (all token-driven, `sf-` prefixed)
1. **Buttons.** Define `.sf-btn` (base: inline-flex, center, gap `--sf-space-2`, min-height
   `var(--sf-tap-target)`, padding, radius `--sf-radius-pill`, `--sf-font-family`, weight
   `--sf-font-semibold`, cursor pointer, `transition: var(--sf-transition)`, no text-decoration) plus
   modifiers:
   - `.sf-btn--gold` — background `var(--sf-gradient-gold)`, text `var(--sf-color-brand-green-deep)`
     (dark, readable on gold); subtle lift + deeper shadow on `:hover`.
   - `.sf-btn--emerald` — background `var(--sf-color-emerald)`, text `var(--sf-color-emerald-contrast)`;
     `:hover` background `var(--sf-color-emerald-hover)`. This is the primary commerce CTA (Add to Cart,
     Apply, Proceed).
   - `.sf-btn--ghost` — transparent background, `1px solid var(--sf-color-border-strong)`, text
     `var(--sf-color-text)`; `:hover` background `var(--sf-color-surface-hover)`.
   - `.sf-btn--outline-gold` — transparent, `1px solid var(--sf-color-gold)`, text
     `var(--sf-color-gold)`; `:hover` fills faintly with a gold tint.
   - Add `.sf-btn--sm` / `.sf-btn--lg` size modifiers and a `.sf-btn--block` (full width).
   - `:disabled` / `[aria-disabled="true"]` → reduced opacity, `cursor: not-allowed`, no hover lift.
   - `:focus-visible` → `box-shadow: var(--sf-shadow-focus)` and a visible outline; never remove focus
     rings.
2. **Badges / chips / pills.**
   - `.sf-badge-discount` — small pill, background `var(--sf-color-discount-bg)`, text
     `var(--sf-color-discount)`, weight bold, `--sf-text-xs`, radius `--sf-radius-sm`. Intended for the
     top-left "-NN%" badge on cards.
   - `.sf-ribbon-premium` — gold "PREMIUM" ribbon: background `var(--sf-gradient-gold)`, text
     `var(--sf-color-brand-green-deep)`, uppercase, letter-spacing, weight bold, small shadow. Used on
     PDP/hero later.
   - `.sf-chip` — neutral category chip: background `var(--sf-color-surface-2)`, text
     `var(--sf-color-text-secondary)`, `1px solid var(--sf-color-border)`, radius `--sf-radius-pill`,
     min-height `var(--sf-tap-target)` when interactive; `.sf-chip--active` → gold/emerald accent
     (background tint + `var(--sf-color-gold)` or `--sf-color-emerald` border + brighter text).
   - `.sf-pill-save` — "Save ₹X" pill in emerald tint for cards/PDP.
3. **Card surface.** `.sf-card` — background `var(--sf-color-surface)`, `1px solid
   var(--sf-color-border)`, radius `--sf-radius-lg`, shadow `--sf-shadow-sm`, `overflow: hidden`,
   `transition: var(--sf-transition)`; `.sf-card--hover:hover` → border `var(--sf-color-border-strong)`
   (gold-tinted) + shadow `--sf-shadow-md` + a few-px translateY lift. This is the shared visual base;
   ProductCard (a later prompt) may compose on top of it.
4. **Skeleton loader.** `.sf-skeleton` — background derived from `var(--sf-color-surface-2)` with a
   gentle shimmer via a `@keyframes sf-skeleton-shimmer` background-position animation; radius
   `--sf-radius-md`. Add helpers `.sf-skeleton--text` (line height) and `.sf-skeleton--block`. Guard the
   animation in a `@media (prefers-reduced-motion: reduce)` block (disable the shimmer, keep a static
   tint).
5. **Toast.** `.sf-toast` — floating notification surface: background `var(--sf-color-surface)`,
   `1px solid var(--sf-color-border-strong)`, radius `--sf-radius-lg`, shadow `--sf-shadow-lg`, padding,
   `--sf-font-family`, text `var(--sf-color-text)`; with a left accent bar variants
   `.sf-toast--success` (emerald), `.sf-toast--error` (`--sf-color-danger`), `.sf-toast--info`
   (`--sf-color-gold`). Include a `.sf-toast__title` (weight semibold) and `.sf-toast__body` (muted).
   These are style hooks only — no JS toast engine here.
6. **Do not** declare any `@import` of Google Fonts here (fonts load in `public/index.html`), and do not
   redefine tokens — only consume them.

### B. `AnnouncementBar` component
7. Render a slim full-width bar **pinned at the very top** (z-index `var(--sf-z-stickybar)`), one
   message visible at a time, that **auto-rotates through 3 messages** every ~4s using **Framer Motion**
   (`AnimatePresence` + a keyed `motion.div` fade/slide). Each message uses its matching brand gradient
   as the bar background, cycling `--sf-gradient-announce-1` → `-2` → `-3` in lockstep with the message.
8. Source the messages from a **local constant array** declared in the component file (do not fetch),
   e.g.:
   ```js
   const ANNOUNCEMENTS = [
     { id: "flash", text: "Flash Sale — Extra 25% Off on the Premium Collection", gradient: "var(--sf-gradient-announce-1)" },
     { id: "shipping", text: "Free Shipping on Orders Above ₹1,999", gradient: "var(--sf-gradient-announce-2)" },
     { id: "giftwrap", text: "Complimentary Gift Wrapping on All Orders", gradient: "var(--sf-gradient-announce-3)" },
   ];
   ```
   The promo copy is owner-attested brand messaging, so the headline ₹ figures may be promotional. (The
   real free-shipping math the storefront enforces lives in `FREE_SHIPPING_THRESHOLD` = ₹999 from
   `src/utils/constants.js`; do not change that constant here, and do not bind shipping logic to this
   copy.) Center the active message; on wide screens you may show an inline `LocalOffer`-style icon.
9. **Dismissible.** Render a close button (≥`var(--sf-tap-target)` hit area, `aria-label="Dismiss
   announcement"`). On dismiss, hide the bar and persist the choice in `localStorage` under a stable key
   (e.g. `sf_announcement_dismissed`); on mount, read that key and stay hidden if set. Pause the
   auto-rotate while the user hovers/focuses the bar.
10. **Accessibility:** wrap the rotating region with `role="status"` / `aria-live="polite"` so the
    active message is announced; pause rotation when `prefers-reduced-motion` is set (show the first
    message statically). All interactive targets ≥44px and `:focus-visible`.
11. Props: accept an optional `messages` prop (defaults to the local `ANNOUNCEMENTS`) and an optional
    `className` so the Header can position it. Export default + an `index.js` re-export.

### C. `TrustStrip` component
12. Render a horizontal band of **exactly four** reassurances, in order:
    **7-Day Easy Returns · 100% Money Back · Free Shipping · Authentic Silk**, each with an **Iconify**
    icon (`import { Icon } from "@iconify/react";`) — e.g. `mdi:autorenew` / `mdi:shield-check` /
    `mdi:truck-fast-outline` / `mdi:certificate-outline` (pick clear silk-appropriate glyphs). Use the
    teal/green look from the design (background may use `var(--sf-color-brand-green)` or a faint emerald
    tint; icons in `var(--sf-color-emerald)` or `--sf-color-gold`; labels in `var(--sf-color-text)` or a
    light-on-green token).
13. Define the four items in a local constant array `[ { id, label, icon } ]`. Labels are static brand
    reassurances (not fabricated metrics), consistent with the authenticity rule.
14. **Responsive:** four across on desktop; on mobile collapse gracefully (2×2 grid, or a horizontally
    scrollable row — no overflow/clipping, no text wrap that breaks the icons). Each item is non-
    interactive text+icon (no links needed). Use semantic markup (`<ul>`/`<li>` or a list role) and give
    the strip an `aria-label` like "Store guarantees".
15. Props: optional `items` (defaults to the local constant) and optional `className`. Export default +
    `index.js` re-export.

### D. Quality bar for both components
16. Use CSS Modules (`*.module.css`) for the two components and consume ONLY `var(--sf-*)` tokens — no
    hardcoded hex. Mobile-first CSS. Honor `body.dark` / `body.light` purely through tokens (do not read
    `useTheme` for colors; tokens flip automatically). If a component needs the current theme for an
    icon swap only, you may read `useTheme()` from `src/context/ThemeContext.js`, but colors must still
    come from tokens.

## Data / API Notes
- **No `apiService` calls and no `db.json` changes** in this prompt. The announcement and trust copy are
  local constants (owner-attested promo / static guarantees), consistent with
  `STOREFRONT_UX_GUIDELINES.md`'s "authenticity > persuasion" rule — they assert no fabricated review
  counts, stock numbers, or urgency timers.
- `FREE_SHIPPING_THRESHOLD` (= 999) is exported from `src/utils/constants.js`; it is referenced here for
  context only. Real shipping/free-above math is enforced elsewhere (cart/checkout) against that value
  and the `shipping_methods` rows — keep that contract intact; do not duplicate or override it in this
  promo copy.
- The class names and component APIs introduced here are a **contract** later prompts rely on (Header
  imports `AnnouncementBar` and `TrustStrip`; cards/buttons use `.sf-btn--*`, `.sf-card`,
  `.sf-badge-discount`, etc.) — name them exactly as specified.

## Constraints (Do Not Break)
- Keep everything API-driven & functional elsewhere — but this prompt adds presentation primitives only;
  it must not alter cart/checkout/auth/wishlist/orders behavior or any existing component.
- Re-skin only via tokens: every color/gradient/shadow/radius in the new CSS must be a `var(--sf-*)`
  reference. No hardcoded hex anywhere (the only literals allowed are the Cloudinary logo URL if ever
  used, and the local message text strings).
- Do not modify the admin panel (`src/pages/Admin/*`, `src/components/AdminLayout`,
  `src/theme/adminTheme.js`) or `db.json`.
- Preserve the JSON Server ↔ Laravel swap contract: do NOT add `fetch`/`axios` calls outside
  `src/services/api.js` (this prompt adds none).
- Accessibility: `role="status"`/`aria-live` on the rotating announcement, `aria-label` on the dismiss
  button and trust strip, ≥44px interactive targets, visible `:focus-visible` rings, and a
  `prefers-reduced-motion` path for the rotation and skeleton shimmer.
- Mobile-first and responsive; the trust strip must not clip or overflow at 360px width.

## Acceptance Criteria / Definition of Done
- [ ] `src/theme/storefront-primitives.css` exists and is imported once via `src/index.css` (right after
      the tokens import); classes resolve app-wide.
- [ ] `.sf-btn--gold`, `.sf-btn--emerald`, `.sf-btn--ghost`, `.sf-btn--outline-gold`,
      `.sf-badge-discount`, `.sf-ribbon-premium`, `.sf-chip`/`.sf-chip--active`, `.sf-card`,
      `.sf-skeleton`, `.sf-toast` all exist and render with the correct brand tokens in both dark and
      light mode (verify by adding a class to a throwaway element in DevTools).
- [ ] `AnnouncementBar` renders pinned at top, cycles 3 messages with the 3 brand gradients via Framer
      Motion, auto-rotates (~4s), pauses on hover/focus, and is dismissible with the choice persisted in
      `localStorage`; with `prefers-reduced-motion` it shows one message statically.
- [ ] `TrustStrip` renders the four reassurances with Iconify icons, four-across on desktop and a clean
      2×2/scroll layout on mobile, fully token-driven.
- [ ] Both components expose an `index.js` re-export and accept optional `messages`/`items` +
      `className` props.
- [ ] No hardcoded hex in any new file; no console errors; `npm run build` completes cleanly.

## Verification Steps
1. `npm install` (if needed), then `npm run dev` (CRA + JSON Server).
2. Temporarily import `AnnouncementBar` and `TrustStrip` into a scratch route OR render them at the top
   of `src/App.js` just to verify (REMOVE the scratch wiring before finishing — actual placement is a
   later prompt). Confirm the bar rotates through three gradients and the trust strip shows four items.
3. Click the announcement dismiss button → bar disappears; reload → it stays dismissed (clear
   `localStorage.sf_announcement_dismissed` to bring it back).
4. Toggle the theme (dark ⇄ light) → primitives and both components remain coherent (tokens flip).
5. In DevTools, set `prefers-reduced-motion: reduce` (Rendering tab) → the announcement stops rotating
   and the skeleton shimmer is disabled.
6. Resize to 360px → trust strip wraps to 2×2 (or scrolls) with no clipping; tab through the dismiss
   button and confirm a visible focus ring.
7. Run `npm run build` and confirm a clean build with no warnings about the new files.
