# About Us — the Heritage Story

**Prompt 25 of 30**

## Depends on

Prompts 01/02/03. Prompt 12/13 (Home's editorial conventions this page should echo).

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/about` (`src/pages/AboutUs/AboutUs.js`) is fully static content: breadcrumb → hero/emblem ("Our Story", "Est. 2010") → tag chips → Our Heritage prose → collection feature row → media/video block (non-functional play button) → Values grid (rainbow accents) → Journey timeline (2010/2014/2019/2023) → pull-quote band → Impact stats (14+ Years, 50+ Artisans, 2023 Award) → CTA. The brand: a heritage handloom silk house (National Handloom Award lineage) selling Assamese silk — Mekhela Chador, Muga, Eri — plus gifts.

## Objective

Rebuild About into the storefront's flagship editorial long-read — a magazine-grade brand story with cinematic imagery, serif storytelling, and honest heritage facts centered on Assamese silk craft.

## Scope — files/areas to touch

- `src/pages/AboutUs/AboutUs.js` + `AboutUs.module.css`

## Brand & design requirements

1. **Opening:** full-width editorial hero — tracked eyebrow ("Our Story"), large serif headline, an establishing image band; retire the boxed emblem look.
2. **Narrative flow** (recompose freely; the story beats survive): Heritage prose at reading measure (~68ch, serif-accented); the craft of Assamese silk — Muga's natural gold, Eri's quiet warmth, the Mekhela Chador tradition (rewrite copy to center this; keep only owner-attested facts consistent with `db.json` `settings` and the Support page); a large image feature row ("The collection" → `/products`); Values as a hairline list (retire rainbow accents); the Journey timeline as an elegant vertical hairline with serif years; the pull-quote as a full-width serif band; Impact figures as three quiet serif numerals with tracked labels — keep them attested (heritage years, artisan partnerships, the award year) and phrase honestly.
3. **Media block:** keep the poster; either make the play affordance honest (remove the fake play button, present it as imagery) or leave a genuinely non-interactive image band — no dead controls pretending to work.
4. **Close:** "Experience the heritage" CTA band → `/products` + `/support`.
5. Imagery: recolored placeholders / clearly-licensed serene textile photography URLs only — never Meghali's Silk's actual copyrighted photos.

## Functional guardrails

1. Preserve routes & structure contracts: the page stays static (no new API calls needed; adding none is correct), breadcrumb + both CTAs navigate; `onImageError` fallbacks kept on all imagery.
2. Tokens/primitives only; zero hex; type via `--sf-font-*`.
3. Do NOT modify the admin panel.
4. Brand voice: refined, warm, aspirational; facts consistent across About / Support / Footer / `db.json` settings.
5. Responsive + accessible: heading hierarchy (single h1), timeline readable when linearized, alt text on imagery, reduced motion honored on reveals.
6. No fabricated trust signals: every figure and claim owner-attested and consistent; remove the dead play button rather than fake a video.
7. Test before done — see below.

## Implementation notes

- This page is pure presentation — the safest place in the series to push the editorial art direction hardest; make it the reference spread.
- Scroll-reveal animations: gentle fade/rise, `useReducedMotion`-guarded (framer-motion already imported on this page's pattern).
- Verify the copy's claims against `db.json` `settings.seo/store` (updated in Prompt 02) — one voice everywhere.

## Acceptance criteria

- [ ] About reads as a magazine-grade brand story centered on Assamese silk — visibly the flagship editorial page.
- [ ] All content beats present (heritage, craft, values, journey, quote, impact, CTA); rainbow accents gone.
- [ ] No dead controls (fake play removed/neutralized); no unattested claims.
- [ ] CTAs + breadcrumb navigate; image fallbacks work.
- [ ] Light/dark parity; 375→1440; reduced motion; keyboard pass; no hex.

## Test & QA

- `npm run dev`: full read-through at 375/768/1280/1440, both themes.
- Break an image URL mentally/temporarily → fallback renders.
- Reduced motion → static sections.
- Cross-read facts vs Support page + Footer — consistent.
- Admin untouched.
