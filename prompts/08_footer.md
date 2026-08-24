# Footer — the Editorial Close

**Prompt 8 of 30**

## Depends on

Prompt 01 (tokens), Prompt 03 (primitives: `sf-btn`). Prompt 02 recommended (contact/social copy alignment).

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). The footer today: brand column with logo-on-green-panel + social SVGs, four link columns (Shop/Company/Support/Legal), a newsletter form (`apiService.leads.createNewsletter`), a trust/payment bar with network SVGs, and a bottom copyright bar. Logos: light `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png` · **white `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png` — use the white logo here if the footer ground is dark.**

## Objective

Redesign the footer as the storefront's confident editorial close — a deep-ink (or deep brand-tone) band using the WHITE logo, serif brand statement, hairline-separated link columns, an elegant newsletter row — preserving the newsletter API flow, all links, and the payment/trust marks.

## Scope — files/areas to touch

- `src/components/Footer/Footer.js` + `Footer.module.css`
- Nothing else. (`Newsletter/Newsletter.js` and `CTASection/CTASection.js` are UNUSED components with no importer — leave them untouched; do not wire them in.)

## Brand & design requirements

1. **Ground:** a deep editorial band — ink/charcoal or the deep brand tone from the Prompt 01 palette — constant across light AND dark app modes (a dark footer is the classic editorial close; verify legibility in both). All colors via tokens (add a footer-scoped alias in the module if needed, mapped to existing tokens — no raw hex).
2. **Brand block:** WHITE logo rendered directly on the dark ground (delete the `.logoPanel` green box), a short serif brand line (from `APP_TAGLINE`/brand voice — e.g. the Assamese-silk heritage sentence), and the social icons from `SOCIAL_LINKS` as thin-line marks.
3. **Columns:** keep the four groups (Shop / Company / Support / Legal) and every existing route/link; restyle as tracked-uppercase column titles + quiet ivory links with hairline dividers on mobile (accordion optional but links must stay crawlable/visible on desktop).
4. **Newsletter:** one elegant row — serif invitation line ("Letters from the loom" energy), hairline underline input + ink/gold submit (`sf-btn` primary). Keep the exact flow: `isEmailValid` check → `apiService.leads.createNewsletter(email)` → success/error states.
5. **Trust & payment bar:** keep the payment-network SVGs (their brand hexes — Visa/Mastercard/UPI/COD — are mandated marks and stay), but remove the `fontFamily="Arial"` literals on `<text>` elements (inherit or token font). Restyle the surrounding bar as a quiet hairline strip.
6. **Bottom bar:** copyright (`APP_NAME`, year) + legal links, tiny tracked type.
7. Motion: none/minimal — at most a gentle link underline transition.

## Functional guardrails

1. Preserve all functionality & the API contract: `apiService.leads.createNewsletter(email)` submit path, `useDealsConfig` gating of any deals link, every route in the four columns, social hrefs from `SOCIAL_LINKS`, `mailto:`/`tel:` contacts from `SUPPORT_*` constants.
2. Tokens only (except the documented payment-network brand hexes); no font literals.
3. Do NOT modify the admin panel.
4. Brand: WHITE logo on the dark footer ground (the light logo would vanish/clash — correct logo per background is a hard rule).
5. Responsive + accessible: columns collapse gracefully (2-col → 1-col), form input labeled, submit reachable, focus visible on the dark ground (focus token must contrast there — add a footer-scope focus style if needed), landmark `<footer>` semantics kept.
6. No fabricated trust signals: the trust line states store-attested policy only (returns/authenticity/secure payment) — no invented ratings or member counts.
7. Test before done — see below.

## Implementation notes

- The newsletter success state currently swaps the form for a message — keep that pattern; a Swal duplicate is unnecessary.
- Dark-mode nuance: the footer stays dark in both modes; ensure `body.dark` doesn't double-darken it into mud — pin its ground to the same token in both modes.
- Retina: request the white logo at 2× via Cloudinary width transform; explicit width/height to avoid CLS.
- Check every link against `App.js` routes (`/products`, `/special-offers`, `/about`, `/support`, `/help`, `/privacy`, `/terms`, `/cookies`, `/refund`, `/orders`, `/profile`, `/wishlist`).

## Acceptance criteria

- [ ] Footer is a deep editorial band with the WHITE logo directly on it — no green panel, correct in light AND dark app modes.
- [ ] All four link groups + every route work; social/mailto/tel links intact.
- [ ] Newsletter: valid email → lead created (verify a new row lands in Admin → Leads with `type: "newsletter"`); invalid email → inline error; success state shows.
- [ ] Payment marks render with their brand colors; no `Arial` literals remain.
- [ ] Responsive 375→1440 clean; keyboard focus visible on the dark ground.
- [ ] No hardcoded hex beyond the payment-network SVGs.

## Test & QA

- `npm run dev`: sweep 375/768/1024/1440; both themes.
- Subscribe with a test email → Admin → Leads shows the new newsletter row; subscribe with "bad@" → error.
- Click 6+ column links including legal pages and Today's Deals gating.
- Keyboard-tab the whole footer; focus never invisible.
- Confirm existing functionality: page bottom padding vs BottomNav on mobile, admin untouched.
