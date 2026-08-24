# Policy Pages — Privacy, Terms, Cookies & Refund

**Prompt 26 of 30**

## Depends on

Prompts 01/03 (tokens + primitives). Independent of the commerce prompts.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). Four static legal pages share one pattern (breadcrumb → title → "Last updated: {POLICY_LAST_UPDATED}" → intro → framer-motion staggered sections → mailto contact footer): `/privacy` (8 numbered sections), `/terms` (9 sections), `/cookies` (intro + a 4-row cookie-types table + managing cookies), `/refund` (7-day highlight banner, "How Returns Work" 4-step grid, Eligible vs Not-Eligible two columns, a refund-timeline table by payment method, contact footer → `/support`).

## Objective

Give all four policies one shared editorial "document" treatment — a beautifully typeset legal reading experience — preserving every section, table, and link.

## Scope — files/areas to touch

- `src/pages/PrivacyPolicy/PrivacyPolicy.js` + `.module.css`
- `src/pages/TermsOfService/TermsOfService.js` + `.module.css`
- `src/pages/CookiePolicy/CookiePolicy.js` + `.module.css`
- `src/pages/RefundPolicy/RefundPolicy.js` + `.module.css`
- `src/utils/constants.js` — only `POLICY_LAST_UPDATED` if refreshing the date (shape preserved)

## Brand & design requirements

1. **Shared document template:** narrow reading column (~68–74ch), serif page title with a hairline rule, muted "Last updated" line, section numbers as small tracked gold marks, body in Inter at a generous line-height; consistent across all four (define once in each module — the CSS may be near-identical; do not create a new shared file unless trivial and imported by all four).
2. **Tables** (cookies types; refund timeline): hairline editorial tables — tracked-uppercase column heads, generous cell padding, `overflow-x: auto` wrappers on mobile, no zebra stripes.
3. **Refund extras:** the 7-day highlight as a quiet gold-hairline banner; the 4-step "How Returns Work" as a numbered hairline row (step numerals in serif); Eligible/Not-Eligible as two calm lists (check/cross marks thin, token-toned).
4. **Content:** copy may be refreshed for voice and Assamese-silk specifics (e.g. silk care in return conditions) but stays legally-plain and consistent with the live behavior (7-day window matches `STOREFRONT_CONFIG.returnsWindowDays`; COD timeline row kept).
5. Motion: the staggered section reveals gentled + reduced-motion guarded (pattern already present).

## Functional guardrails

1. Preserve structure & links: all section arrays render; `mailto:${SUPPORT_EMAIL}` footers; `/refund` → `/support` link; breadcrumbs; the `APP_NAME`/`POLICY_LAST_UPDATED` constants keep driving their slots.
2. Tokens/primitives only; zero hex.
3. Do NOT modify the admin panel.
4. Brand consistency: one document voice across the four; the returns copy must match reality (7 days, methods, timelines).
5. Responsive + accessible: single h1 per page, section headings hierarchical, tables get real `<th>` scope, reading column fluid on mobile, reduced motion honored.
6. No fabricated trust signals — n/a beyond honest policy claims.
7. Test before done — see below.

## Implementation notes

- These are quick wins — batch all four in one pass with a shared class vocabulary.
- Footer/Help link into all four — verify from those entry points.
- Check dark mode carefully: long-form text contrast is where dark themes usually fail (muted grays too dim).

## Acceptance criteria

- [ ] All four pages share one refined document treatment; visibly redesigned.
- [ ] Every section/table/step/list renders; both tables scroll on mobile without page-level horizontal scroll.
- [ ] All links (mailto, /support, breadcrumbs) work; constants still drive name/date.
- [ ] Refund content matches live behavior (7-day window, payment-method timelines).
- [ ] Light/dark parity; 375→1440; reduced motion; keyboard pass; no hex.

## Test & QA

- `npm run dev`: read-through of all four at 375 and 1280, both themes.
- Enter from Footer legal links and Help Center topic cards.
- Table overflow check at 320–375px.
- Admin untouched.
