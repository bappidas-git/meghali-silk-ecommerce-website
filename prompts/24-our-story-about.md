<!-- Batch E — Content & Policy Pages -->
# Prompt 24 — Our Story / About Page

## Objective
Rebuild the About page (`/about`, rendered by `src/pages/AboutUs/AboutUs.js`) into the brand "Our Story"
experience for **Meghali's Silk** — a dark, gold-on-green heritage narrative with a round gold emblem,
heritage copy, a values grid, a vertical journey timeline, a brand-attested impact stat band, and a
closing "Explore Collection" CTA — matching `UI Designs/OUR STORY.png`. This is static brand storytelling
(no API needed), but every link must point at a real route and all styling must flow from the existing
design tokens.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage, handloom-rooted silk house
(Bengal/Kolkata craftsmanship; National Handloom Award winner) selling authentic women's silk apparel.
The look is **dark-first, luxurious, gold-on-green** with elegant serif headings.

Match `UI Designs/OUR STORY.png`. Top to bottom the design shows: a centered round **gold emblem**, the
serif title "Our Story" with an "Est. … · Galleria Silk" subtitle, a row of **tag chips**, an "Our
Heritage" copy block, an "Our Master Silk Collection" feature row, a **media/video block** with a play
button over a poster image, an "Our Values" grid of 4 colored-icon cards, an "Our Journey" **vertical
timeline** with year markers and gold dot nodes, a pull-quote, an "Our Impact" stat band (3 big gold
numbers on a deep-green panel), and an "Experience Our Heritage" CTA with a gold button.

Use ONLY these tokens (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-text`,
  `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`, `--sf-color-border-strong`.
- Gold accents: `--sf-color-gold`, `--sf-color-gold-light`, `--sf-color-gold-deep`, `--sf-gradient-gold`.
- Heritage/brand panels: `--sf-color-brand-green` (= `--brand-logo-bg`, `#0B3B2E`),
  `--sf-color-brand-green-deep`, and the purple/magenta `--sf-gradient-heritage` for the pull-quote/
  emphasis band if you want a luxury accent.
- Value-card accent icons: `--sf-cat-pink`, `--sf-cat-purple`, `--sf-cat-orange`, `--sf-cat-blue`,
  `--sf-cat-teal`, `--sf-cat-red` (one accent per value card).
- CTA: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast` (and the gold
  gradient for the primary "Explore Collection" button per the design).
- Type: `--sf-font-display` (Cormorant Garamond serif) for the emblem title, section headings, big stat
  numbers, and the pull-quote; `--sf-font-family` (Inter) for body/UI. Radii `--sf-radius-*`, spacing
  `--sf-space-*`, shadows `--sf-shadow-*`, motion `--sf-transition*`.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/AboutUs/AboutUs.js` — replace the current generic story/stats/values markup with
  the sectioned "Our Story" layout below. Keep it a default-exported function component on route `/about`.
- (MODIFY) `src/pages/AboutUs/AboutUs.module.css` — restyle/rewrite to the dark heritage design; consume
  tokens only.
- **OUT of scope:** `db.json`, `apiService`, any other page/component, the admin panel, and the shared
  brand tokens themselves (consume them; do not redefine). Do NOT add network calls — this page is static
  brand content.

## Detailed Requirements
Render these sections **in this order** inside the page container (mobile-first; the page already toggles
a `dark` class via `useTheme()` — keep that pattern). Add a `Breadcrumb`/back affordance only if the
current page already had one (it has a simple `Home / About Us` crumb — keep an equivalent).

1. **Hero / emblem.** Centered: a round **gold emblem** badge (circular chip with `--sf-gradient-gold`
   border/fill and a silk/heritage Iconify glyph, e.g. `mdi:diamond-stone` or `mdi:flower-tulip`, in
   brand-green), then an `<h1>` "Our Story" in `--sf-font-display` (gold, large), then a subtitle line
   "Est. 2010 · Galleria Silk" (use a real founding year consistent with the impact band below — if the
   impact band says "14+ Years", set "Est. 2010"). Subtle fade/slide-in via Framer Motion.
2. **Tag chips.** A wrap row of 3 pill chips with small leading icons: **Handloom Heritage**, **National
   Award Winner**, **100% Authentic Silk**. Gold-tinted hairline border, surface fill, ≥44px tall tap
   area where they are interactive (they are non-interactive labels here, so just ensure legible padding).
3. **Our Heritage copy block.** An `<h2>` "Our Heritage" (serif, with a short gold underline rule), then
   2–3 concrete paragraphs of brand storytelling. Provide this copy (adapt lightly, keep facts):
   > Meghali's Silk is the flagship label of **Galleria Producer Company Limited**, a Kolkata-rooted house
   > devoted to the living craft of Bengal handloom. For over a decade we have worked hand-in-hand with
   > master weavers across West Bengal, translating generations of loom knowledge into sarees, suits and
   > dupattas woven from pure, traceable silk.
   >
   > Every drape begins at the loom, not the factory. Our artisans dress each warp by hand, dye in small
   > batches, and weave motifs that carry the memory of temple architecture and riverine Bengal. The
   > result is silk you can feel the hours in — honest, breathable, and made to be worn for a lifetime.
   >
   > Recognised with a National Handloom Award, we remain a producer company at heart: profits and pride
   > flow back to the weaving families who make Meghali's Silk what it is.
4. **Our Master Silk Collection feature row.** A two-column band (image + text on desktop, stacked on
   mobile): a portrait silk image (lazy-loaded, royalty-free or `placehold.co` brand-color placeholder
   e.g. `https://placehold.co/700x900/0B3B2E/CBA35A?text=Master+Silk`) and a short blurb naming real
   silk families (Banarasi, Kanjivaram, Tussar, Mulberry, Eri, Muga) with a text link "Explore the
   collection →" to `/products`.
5. **Media / video block.** A wide poster image (lazy-loaded portrait/landscape silk photo) with a
   centered circular **play button** overlay (gold ring, `mdi:play` glyph). **No real video is needed** —
   the play button may be a non-functional decorative `<button>` with `aria-label="Play our story"`
   (or open nothing / a no-op). Caption it "Watch how our silk is woven" in muted text.
6. **Our Values — 4 cards.** `<h2>` "Our Values", then a responsive grid (1 col mobile → 2 → 4) of
   exactly four cards, each with a colored circular icon, a title and one-line description. Map a distinct
   `--sf-cat-*` accent per card:
   - **Heritage** (`--sf-cat-purple`, `mdi:bank` / `mdi:temple-hindu`): "Rooted in generations of Bengal
     handloom tradition."
   - **Craftsmanship / Quality** (`--sf-cat-teal`, `mdi:hand-heart` / `mdi:diamond-stone`): "Every weave
     inspected by hand for purity and finish."
   - **Sustainability** (`--sf-cat-orange`, `mdi:leaf`): "Small-batch, natural dyes and traceable silk."
   - **Excellence** (`--sf-cat-pink`, `mdi:trophy-award`): "National Handloom Award-winning standards."
   Cards use `--sf-color-surface`, hairline border, hover lift (`transform: translateY(-4px)` +
   `--sf-shadow-md`).
7. **Our Journey — vertical timeline.** `<h2>` "Our Journey", then a vertical timeline with a gold spine
   line and **gold dot nodes**, four entries each with a year marker, title and one-line description:
   - **The Beginning** — "Founded in Kolkata to bring authentic Bengal handloom silk to a wider audience."
   - **Expanding Artistry** — "Partnered with master weaver clusters across West Bengal."
   - **NHDC Initiative** — "Joined a National Handloom Development effort to support weaving families."
   - **National Recognition** — "Honoured with a National Handloom Award for craftsmanship."
   Use plausible ascending years consistent with "Est. 2010" and the "2023 Award" stat (e.g. 2010 / 2014 /
   2019 / 2023). On mobile the timeline stays single-column with the spine on the left.
8. **Pull-quote.** A full-width emphasis band (you may use `--sf-gradient-heritage` or a deep-green panel)
   with a large serif quote, e.g. *"We don't manufacture silk — we keep a craft alive, one loom at a
   time."* attributed to "Meghali's Silk".
9. **Our Impact — stat band.** A deep-green (`--sf-color-brand-green`) band with a small "Our Impact"
   label and **three** big gold serif numbers + labels. Use **brand-attested** copy (NOT live metrics):
   **14+ Years** · **50+ Artisans** · **2023 Award** (National Handloom). Keep these as static,
   honest brand claims — do not phrase them as real-time counters.
10. **Experience Our Heritage — CTA.** A closing centered block: `<h2>` "Experience Our Heritage", a one-
    line subtitle, and a primary **"Explore Collection"** button styled with `--sf-gradient-gold` (gold,
    dark text) linking via React Router `<Link to="/products">`. Optionally a secondary outline link to
    `/support` ("Talk to us"). Buttons ≥44px tall, `focus-visible` ring using `--sf-shadow-focus`.
11. **Responsiveness & motion.** Mobile-first; sections stack to single column under ~768px. Use the
    project's Framer Motion section reveals (subtle `opacity`/`y`), and respect reduced-motion (the tokens
    file already has a `prefers-reduced-motion` block — do not fight it; keep animations subtle).
12. **Imagery.** All `<img>` use `loading="lazy"` and descriptive `alt`. Reuse `onImageError` from
    `src/utils/helpers.js` for graceful fallback if you add hotlinked images.
13. **Copy source.** You MAY read `APP_NAME` / `APP_TAGLINE` from `src/utils/constants.js` for the title/
    subtitle, but the heritage narrative, values, timeline, and impact figures are authored here as static
    brand copy (this prompt owns that copy). Do not invent live/fake customer counts or stock numbers.

## Data / API Notes
- **No `apiService` calls and no `db.json` changes** in this prompt — the About page is static brand
  content. (Store contact details and `settings` are handled elsewhere; this page only links to routes.)
- Real routes used: `/products` (Explore Collection), optionally `/support`. All via React Router
  `<Link>`; do not hardcode `window.location`.
- Honor the **authenticity > persuasion** rule: the impact stats are brand-attested claims (Years /
  Artisans / Award), never fabricated live counters or fake "X people viewing" widgets.

## Constraints (Do Not Break)
- Re-skin ONLY via tokens in `src/theme/storefront-tokens.css`; **no hardcoded hex** anywhere in
  `AboutUs.js`/`AboutUs.module.css`. Use the named tokens above.
- Keep the page on route `/about` as a default-exported component; do not change routing in `src/App.js`.
- Do NOT add any `fetch`/`axios`/`apiService` network calls (preserve the JSON Server ↔ Laravel swap
  contract — nothing to swap here) and do not touch `db.json` or the admin panel.
- Accessibility: semantic headings (single `<h1>`, then `<h2>`s), `alt` text, the play button has an
  `aria-label`, interactive targets ≥44px, visible `focus-visible` states via `--sf-shadow-focus`.
- Responsive/mobile-first; all images `loading="lazy"`.
- Keep dark and light mode coherent (the same tokens resolve in both; verify the gold-on-green band and
  the timeline spine read correctly in both modes).

## Acceptance Criteria / Definition of Done
- [ ] `/about` visually matches `UI Designs/OUR STORY.png`: gold emblem + "Our Story" title + Est.
      subtitle, 3 tag chips, "Our Heritage" copy, master-collection feature row, media block with play
      button, 4 value cards with distinct colored icons, vertical journey timeline with year markers,
      pull-quote, "Our Impact" gold stat band, and "Experience Our Heritage" CTA with a gold "Explore
      Collection" button.
- [ ] The "Explore Collection" button navigates to `/products`; any secondary link resolves to a real
      route.
- [ ] All colors come from `--sf-*` tokens; a search for `#` hex in `AboutUs.module.css` finds none
      (placeholder image URLs aside).
- [ ] Impact figures read as static brand claims (14+ Years / 50+ Artisans / 2023 Award), not live
      counters.
- [ ] Dark mode (default) and light mode both render coherently; no console errors; images lazy-load.
- [ ] `npm run build` completes cleanly.

## Verification Steps
1. `npm run dev` (CRA + JSON Server) and navigate to `/about`.
2. Compare against `UI Designs/OUR STORY.png` section-by-section (emblem, chips, heritage, collection
   row, media/play, values, timeline, quote, impact, CTA).
3. Click **Explore Collection** → lands on `/products`; click any secondary CTA → real route.
4. Toggle the theme (header switch) → confirm dark and light both look coherent (gold/green band,
   timeline spine, value-card icons).
5. Resize to ~375px width → all sections stack to a single column, timeline stays readable, buttons are
   ≥44px tall.
6. Tab through the page → the play button and CTAs show a visible focus ring; check no console errors.
7. Run `npm run build` and confirm a clean build.
