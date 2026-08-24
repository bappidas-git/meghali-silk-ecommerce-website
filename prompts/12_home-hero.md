# Home — Cinematic Hero & Opening

**Prompt 12 of 30**

## Depends on

Prompt 01 (tokens), Prompt 02 (seeded `banners` + categories), Prompt 03 (primitives), Prompt 05 (masthead it sits under). Prompt 13 redesigns the rest of the Home page — this prompt owns only the opening.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens; pattern reference: modern luxury DTC storefronts — fewer, larger, curated sections; cinematic media; translated into this brand, never copied). `HeroSection` (no props) fetches `apiService.banners.getAll()` (fallback `defaultBanners`) and `apiService.categories.getAll()` (top-level, first 8) and currently renders a boxed carousel + "category circles" strip.

## Objective

Rebuild the storefront's opening into a cinematic editorial hero — full-bleed imagery, serif headline moment, restrained CTAs, slow crossfades — structurally different from the current boxed carousel + circles, while keeping the banner/category data sources intact.

## Scope — files/areas to touch

- `src/components/HeroSection/HeroSection.js` + `HeroSection.module.css`
- `src/pages/Home/Home.js` + `Home.module.css` — ONLY the hero region and the trust strip that directly follows it (`heroSection` + `trustStrip` blocks); the remaining Home sections belong to Prompt 13.

## Brand & design requirements

1. **Hero:** full-bleed (edge-to-edge, ~72–88vh desktop) media stage with a soft ink scrim for legibility; content composed editorially (e.g. lower-left or centered): small tracked-uppercase eyebrow (banner `title` context), a LARGE serif headline (banner `title`), one quiet line (`subtitle`), and one or two restrained CTAs (`cta` → `link`; primary `sf-btn`, secondary hairline/underline). Slide media from the seeded `banners` rows; keep `defaultBanners` fallback and `onImageError`.
2. **Carousel behavior preserved, presentation transformed:** 5s autoplay (paused on hover + reduced motion), arrows become minimal edge affordances or are dropped in favor of dots/progress-hairlines; slide transition = slow crossfade (no scale-bounce). Keep `useReducedMotion` gating.
3. **Category strip → collection openers:** replace the "category circles" with an editorial device — e.g. a hairline row of tracked category links, or 2–4 large image "collection cards" (Mekhela Chador / Muga / Eri / Gifts) — still sourced from `apiService.categories.getAll()` (top-level active, admin `sortOrder`), linking via `categoryParam(cat)`. This strip may render inside HeroSection or be handed to Home's opening area — your structural call, but the data source stays.
4. **Trust strip placement:** directly after the hero, Home renders its trust row (from `TRUST_BADGES` in `utils/constants` with local icons). Restyle it as a single hairline promises line (icons thin, labels tracked) — quiet, not card-y.
5. **Imagery discipline:** seeded placeholder imagery only (recolored placehold.co from Prompt 02) or clearly-licensed serene textile photography via URL config — never Meghali's Silk's real copyrighted photos. Lots of negative space; no text-on-busy-image without scrim.

## Functional guardrails

1. Preserve all functionality & the API contract: `banners.getAll()` + `categories.getAll()` fetch paths and fallbacks; every banner `link` navigates; autoplay/pause/reduced-motion logic; the rest of `Home.js` (flash deals, featured, trending, etc.) untouched until Prompt 13 — do not break its data effects while editing the hero region.
2. Tokens/primitives only; the `SILK_HERO_IMAGE` hardcoded Unsplash fallback may be swapped for an on-brand placeholder URL (documented), not removed.
3. Do NOT modify the admin panel.
4. Brand: serif headline + tracked eyebrow pattern established here becomes the page-wide convention (Prompt 13 follows it); gold used only as underline/eyebrow accents.
5. Responsive + accessible: hero scales to mobile (~60–70vh) with readable type via clamp; slide images have alt text; controls keyboard-reachable; autoplay pauses on focus too; honors `prefers-reduced-motion` (static first slide).
6. No fabricated trust signals: banner copy is merchandising (fine); the trust line states store-attested policy only.
7. Test before done — see below.

## Implementation notes

- `HeroSection` currently injects category accents via `--cat-accent` inline style from `CATEGORY_ACCENTS` — retire or repoint to the recolored `--sf-cat-*` tokens.
- Full-bleed inside `.main-content`: check `App.css` container constraints; the hero should escape any max-width wrapper (Home controls its own containers).
- Preload the first banner image (`<link rel="preload">` is Prompt 04 territory — here, just render it eagerly with priority).
- Verify seeded banner `link` values point at real category slugs.

## Acceptance criteria

- [ ] Opening is a full-bleed cinematic hero with serif headline + restrained CTAs — unmistakably different from the old boxed carousel.
- [ ] Banners rotate (5s), pause on hover/focus, crossfade slowly, respect reduced motion; arrows/dots (as designed) work by keyboard.
- [ ] Every banner CTA routes correctly; category strip/collection cards route via slug params.
- [ ] Trust line renders as the quiet hairline treatment.
- [ ] Rest of Home still renders and functions (unstyled by this prompt is fine).
- [ ] Light + dark parity; 375→1440 clean; no hex.

## Test & QA

- `npm run dev`: land on `/` — hero paints fast, no layout shift on slide change.
- Click each banner CTA + each collection/category link → correct filtered `/products` views.
- Reduced-motion OS setting: static hero, no autoplay.
- Keyboard: reach and operate slide controls and CTAs.
- Both themes; 375/768/1024/1440.
- Confirm flash deals/featured/trending sections below still load (data effects intact); admin untouched.
