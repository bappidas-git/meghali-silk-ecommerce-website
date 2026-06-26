<!-- Batch D — Storefront Pages -->
# Prompt 12 — Home Hero & Top (Banner Carousel, Trust Strip, Category Quick-Links)

## Objective
Re-skin and restructure the **top of the homepage** — the `HeroSection` banner carousel plus the
section of `src/pages/Home/Home.js` immediately under it (trust strip + category quick-links) — into the
**Meghali's Silk** heritage-silk look: an "Award-Winning Craftsmanship" hero with a round gold emblem,
gold/emerald CTAs and a silk hero image, a reassurance trust strip, and a row of colorful category
circles. Everything stays API-driven (`apiService.banners.getAll`, `apiService.categories.getAll`) and
the carousel keeps autoplay / dots / pause-on-hover / reduced-motion behavior.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house (Bengal/Kolkata
craftsmanship, National Handloom Award winner) selling authentic women's silk apparel. The storefront is
**dark-first** (near-black charcoal canvas, deep bottle-green panels, gold/champagne accents, emerald
CTAs) with **elegant serif headings**.

Match these designs:
- **`UI Designs/HOME PAGE HIDE FOOTER.png`** (the top portion: hero banner, trust strip, category
  circles, deal rail underneath).
- **`UI Designs/DESKTOP SCREEN VIEW.png`** (the desktop hero: a large silk banner with the headline
  "Award-Winning Craftsmanship", a "National Handloom Award 2022" sub-line, a round **gold emblem badge**,
  and gold/emerald CTA buttons; above it the teal/green trust strip with 4 reassurances).

Use ONLY these tokens (defined in `src/theme/storefront-tokens.css`) — never hardcode hex:
- Brand green panel: `--sf-color-brand-green` (`#0B3B2E`) / `--brand-logo-bg`; deeper
  `--sf-color-brand-green-deep`.
- Gold: `--sf-color-gold`, `--sf-color-gold-light`, `--sf-color-gold-deep`; gold gradient
  `--sf-gradient-gold`.
- Emerald CTA: `--sf-color-emerald` (hover `--sf-color-emerald-hover`, text
  `--sf-color-emerald-contrast`).
- Heritage gradient (if a promo block is needed): `--sf-gradient-heritage`.
- Category-accent dots: `--sf-cat-pink`, `--sf-cat-purple`, `--sf-cat-orange`, `--sf-cat-blue`,
  `--sf-cat-teal`, `--sf-cat-red`.
- Display font: `--sf-font-display` (Cormorant Garamond). Body: `--sf-font-family` (Inter).
- Surfaces/text/border: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`,
  `--sf-color-text`, `--sf-color-text-secondary`, `--sf-color-border`. Radius/space/shadow/motion:
  `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*`. Tap target `--sf-tap-target`
  (≥44px).

## Scope — Files to Create / Modify
- (MODIFY) `src/components/HeroSection/HeroSection.js` — replace the generic electronics banners,
  category icon/color maps, and the right-hand promo sidebar with the silk-brand hero + category strip
  described below.
- (MODIFY) `src/components/HeroSection/HeroSection.module.css` — re-skin to brand tokens; add styles for
  the emblem badge, the gold/emerald CTAs, the silk hero image, and the category circles.
- (MODIFY) `src/pages/Home/Home.js` — only the **hero wrapper + the trust strip + category quick-links
  block** at the very top (sections 1–3 in render order). Do NOT touch the lower section stack here
  (Flash Deals, Featured, Trending, Why-Choose-Us, Recently Viewed) — that is a separate prompt for
  `prompts/13-home-content-sections.md`.
- (MODIFY) `src/pages/Home/Home.module.css` — styles for the hero wrapper, trust strip, and category
  circle row.
- **OUT of scope:** the global Header announcement bar / AI search (that lives in
  `src/components/Header/*`), the footer, the storefront `ProductCard` (its own prompt), `db.json` data,
  and any admin file.

## Detailed Requirements

### A. HeroSection — data wiring (keep the existing pattern)
1. Keep fetching banners via `apiService.banners.getAll()` and categories via
   `apiService.categories.getAll()` in `useEffect`. Banners shape (from `db.json`):
   `{ id, title, subtitle, cta, link, gradient }`. Categories shape: `{ id, name, slug, image,
   parentId, isActive, sortOrder, ... }`.
2. Replace the hardcoded `defaultBanners` fallback (currently electronics/clothing gradients) with a
   small **silk-brand fallback** so the hero never renders empty if the API is briefly unavailable —
   e.g. one banner `{ title: "Award-Winning Craftsmanship", subtitle: "National Handloom Award 2022",
   cta: "Shop the Collection", link: "/products", gradient: "var(--sf-gradient-heritage)" }`. Use a
   token-based gradient string or a brand-green→emerald gradient; do NOT reintroduce purple/blue hexes.
   (Real banners from `db.json` are populated by `prompts/06-catalog-supporting-data.md`; this is only a
   safety net.)
3. For categories, keep the existing filter to top-level active ones
   (`data.filter((c) => !c.parentId && c.isActive)`) and slice to ~8.

### B. HeroSection — carousel (preserve behavior, restyle)
4. Keep the Framer Motion `AnimatePresence` slide carousel, the **autoplay** interval (~5s), **pause on
   hover** (`onMouseEnter`/`onMouseLeave` setting `isPaused`), the prev/next arrow buttons, and the dot
   navigation with an active dot. Keep the existing guard that clamps `currentSlide` when the banner
   count changes.
5. Each slide renders the banner's `gradient` as its background and overlays a **silk hero image** (use a
   royalty-free silk/saree photo URL or the brand `placehold.co` pattern, lazy-loaded with `loading=
   "lazy"` and `onError={onImageError}` from `src/utils/helpers`). The image must sit behind/beside the
   text with a dark scrim so the gold headline stays legible (contrast ≥ 4.5:1).
6. Slide content, top-to-bottom:
   - a small **eyebrow label** (e.g. the banner `subtitle` used as "National Handloom Award 2022", or a
     "Limited Time" tag) in gold;
   - the **headline** = banner `title` (e.g. "Award-Winning Craftsmanship"), rendered with
     `--sf-font-display`, large, gold or ivory;
   - a **sub-line** / supporting sentence (the banner `subtitle` if not used as the eyebrow);
   - a **round gold emblem badge** — a circular chip filled with `--sf-gradient-gold` (or
     `--sf-color-brand-green` ring + gold inner) containing a small emblem/medal SVG, echoing the
     award/heritage motif from the design;
   - **two CTAs**: a primary **gold** button (gold gradient background, dark text) wired to the banner
     `link` via the existing `handleBannerClick`/`navigate`, and a secondary **emerald** (or
     gold-outline) button. The secondary may link to `/products` or `/about`. Both ≥44px tall.
7. Remove the right-hand promo `sidebar` (the two hardcoded "Deal of the Day"/"New Arrivals" promo cards
   with literal gradients). If a secondary visual is wanted, render the silk hero image there instead —
   no hardcoded marketing copy/percentages.
8. Reduced motion: respect the existing `@media (prefers-reduced-motion)` token block — disable the
   autoplay scale/slide animation when the user prefers reduced motion (gate the Framer transitions or
   set them to near-instant). Autoplay should not move when `isPaused`.

### C. HeroSection — category quick-links (colorful circles)
9. Replace the `categoryIconMap` / `categoryColorMap` (electronics/laptops/audio) and the inline-styled
   icon tiles. Render each top-level category as a **colorful circle**:
   - the circle shows the category `image` (lazy, `onError={onImageError}`) OR, when no image, a colored
     fill;
   - assign each circle one of the **category-accent tokens** deterministically (cycle
     `--sf-cat-pink`, `--sf-cat-purple`, `--sf-cat-orange`, `--sf-cat-blue`, `--sf-cat-teal`,
     `--sf-cat-red` by index) for the ring/border or a soft glow — these are small multicolor accents,
     not full backgrounds;
   - a category **name label** beneath the circle in `--sf-color-text`.
10. Keep navigation via `navigate(`/products?category=${categoryParam(category)}`)` (import
    `categoryParam` from `src/utils/categories` — already imported). The row scrolls horizontally on
    mobile (overflow-x auto, momentum) and centers/wraps on desktop. Each circle is a real button/link
    with an accessible label.

### D. Home.js — hero wrapper + trust strip
11. Keep `<HeroSection />` mounted at the top of `Home`. Directly under it, render a **trust strip** of
    four reassurances matching the design: **7-Day Easy Returns · 100% Money Back · Free Shipping ·
    Authentic Silk**, each with an icon, on a teal/green band (use `--sf-color-brand-green` /
    `--sf-color-emerald` tints). Prefer reusing the brand chrome trust-strip pattern; if no shared
    component is available, build it inline in `Home.js` driven by the `TRUST_BADGES` array from
    `src/utils/constants.js` (it holds the four copy strings) so the copy is centralized. Do NOT
    fabricate numbers — these are owner-attested policy statements.
12. The category quick-links may live in `HeroSection` (per B/C). If the design's category circle row
    reads as a homepage section rather than part of the hero, you may instead render it in `Home.js`
    using `categories` already fetched there — but do NOT duplicate it in both places. Pick one home for
    it and keep a single source.

### E. Responsiveness & polish
13. Mobile-first: hero stacks vertically (image, then text, then stacked full-width CTAs); arrows may
    hide on the smallest widths (dots remain). Desktop: side-by-side image + text per the desktop
    mockup. Honor `--sf-container-max` (1280px) for the outer width.
14. All interactive elements get `:focus-visible` rings (use `--sf-shadow-focus`) and ≥44px targets.

## Data / API Notes
- `apiService.banners.getAll()` → array of `{ id, title, subtitle, cta, link, gradient }`. Render
  `gradient` as a CSS background; `link` drives navigation; `cta` is the primary button label.
- `apiService.categories.getAll()` → array; filter to top-level active (`!parentId && isActive`).
  Navigate with `categoryParam(category)` (handles slug/id).
- `TRUST_BADGES` (from `src/utils/constants.js`) supplies the trust-strip copy; do not invent new
  marketing claims.
- Do NOT add `fetch`/`axios` calls outside `apiService`. Do NOT change any `db.json` shapes; the actual
  banner/category content is seeded by Batch B/C prompts.

## Constraints (Do Not Break)
- Keep everything API-driven & functional: banners and categories load from `apiService`; category
  clicks navigate to the listing with the right query param; CTAs navigate via React Router.
- Re-skin ONLY via `src/theme/storefront-tokens.css` tokens — no hardcoded hex in `HeroSection` or
  `Home` (CSS or inline styles). Replace every literal gradient/color with a token.
- Authenticity > persuasion: no fake countdowns, fabricated discounts, invented stock, or made-up social
  proof in the hero/strip. Trust-strip items are policy statements only.
- Do not modify the admin panel, the Header/Footer, the storefront `ProductCard`, or `db.json` here.
- Preserve the JSON Server ↔ Laravel swap contract (all data via `apiService`).
- Accessibility: ARIA labels on arrows/dots/category links, `:focus-visible`, ≥44px targets,
  reduced-motion safe. Lazy-load all images.

## Acceptance Criteria / Definition of Done
- [ ] Homepage hero matches `DESKTOP SCREEN VIEW.png` / `HOME PAGE HIDE FOOTER.png`: silk image,
      serif "Award-Winning Craftsmanship"-style headline, award sub-line, round gold emblem badge,
      gold + emerald CTAs — no electronics/purple boilerplate remains.
- [ ] Banner carousel autoplays, pauses on hover, advances via arrows, and reflects the active dot;
      respects reduced-motion (no movement when the user prefers it).
- [ ] A trust strip (7-Day Easy Returns · 100% Money Back · Free Shipping · Authentic Silk) renders
      under the hero, sourced from `TRUST_BADGES`.
- [ ] Category quick-links render as colorful circles using `--sf-cat-*` accents and navigate to
      `/products?category=<slug>`; they appear in exactly one place (hero OR home, not both).
- [ ] Banners and categories load from `apiService`; with the API briefly down, the silk fallback hero
      shows (no empty/broken hero, no purple boilerplate).
- [ ] Dark and light modes both look coherent; gold headline meets contrast over the silk image scrim.
- [ ] No `grep` hit for raw hex (`#[0-9a-fA-F]{3,6}`) in `HeroSection.module.css` /
      `Home.module.css` for the hero/strip/category styles; no console errors; `npm run build` is clean.

## Verification Steps
1. `npm run dev` (CRA + JSON Server) and open `/`.
2. Confirm the hero shows the silk image, serif headline, gold emblem badge, and gold + emerald CTAs;
   click each CTA → it navigates (banner `link` / `/products`).
3. Hover the carousel → autoplay pauses; move away → it resumes. Click arrows and dots → the slide and
   active dot update.
4. Confirm the trust strip (4 items) and the colorful category circles render; click a category circle →
   lands on `/products?category=<slug>` with the listing filtered.
5. Toggle the theme (header switch) → hero/strip/circles stay coherent in light mode.
6. Resize to a 375px mobile width → hero stacks, CTAs go full-width, the category row scrolls
   horizontally; tap targets feel ≥44px.
7. Enable "Reduce motion" (OS setting) and reload → the carousel does not animate/auto-scale jarringly.
8. DevTools: temporarily block the network/`/banners` request → the silk fallback hero renders.
9. Run `npm run build` → clean.
