# Support & Help Center

**Prompt 24 of 30**

## Depends on

Prompts 01/02/03. Prompt 16 recommended (it refreshed `FAQ_ITEMS`, shared with Help Center).

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). Two pages: `/support` (`src/pages/Support/Support.js`) = contact page with intro, a STATS row (currently static "4.9 Rating · 10K+ Customers · 500+ Designs · 15+ Years"), contact cards (tel/mailto/WhatsApp), a lead form (name/email/phone/subject/message ≥20 chars; hidden `orderNumber`/`category` fields; pre-fills email from `useAuth`) posting `apiService.leads.createContact`, plus showroom/social/why-us rails. `/help` (`src/pages/HelpCenter/HelpCenter.js`) = FAQ search over `FAQ_ITEMS`, a 6-card topics grid (routing to /orders, /refund, /support, /profile, /special-offers, /privacy), FAQ accordion, contact banner.

## Objective

Redesign both care surfaces into calm editorial service pages — a gracious contact experience and a clear help library — preserving the lead-form API flow and every route, and REPLACING the fabricated stats with honest brand facts.

## Scope — files/areas to touch

- `src/pages/Support/Support.js` + `Support.module.css`
- `src/pages/HelpCenter/HelpCenter.js` + `HelpCenter.module.css`
- `src/utils/constants.js` — only if aligning `SUPPORT_*`/`WHY_CHOOSE_US`-adjacent copy (shapes preserved)

## Brand & design requirements

1. **Support hero:** serif invitation ("We're here to help") + one warm line; the fabricated STATS row ("4.9 Rating", "10K+ Customers") is REMOVED or replaced with store-attested facts only (e.g. heritage year, National Handloom Award, artisan partnership — facts consistent with About/`db.json` settings). This is a hard honesty rule, not a style choice.
2. **Contact cards:** three hairline cards (Call / Email / WhatsApp) with thin icons, real `tel:`/`mailto:`/wa links from constants.
3. **Form:** the editorial form language (hairline inputs, tracked labels, calm errors incl. the ≥20-char message rule), an honest availability note (hours from `SUPPORT_HOURS` — drop the "Online" live-status badge unless real), submit → success state ("Message sent" + "Send another") preserved.
4. **Right rail:** Visit Our Showroom (address, hours, Get Directions link), Follow Our Journey (filtered `SOCIAL_LINKS` thin icons), Why Choose Us as quiet hairline rows.
5. **Help Center:** serif title + search field filtering FAQs live (question+answer match kept); topics as a hairline 6-card grid (retire the rainbow `--sf-cat-*` accent scheme for a uniform editorial treatment; all six routes preserved); FAQ accordion in the Prompt 16 style; no-results message linking `/support`; contact banner as a closing band.

## Functional guardrails

1. Preserve all functionality & the API contract: `leads.createContact(formData)` payload (incl. hidden `orderNumber`, `category: "general"`), validation (`isEmailValid`, `isValidPhone`, message length), auth email pre-fill, FAQ search filter, every topic route, all constant-driven contact data.
2. Tokens/primitives only; zero hex.
3. Do NOT modify the admin panel — but verify submitted leads appear in Admin → Leads.
4. Brand voice: refined, warm, aspirational; service copy reads like a boutique's care desk.
5. Responsive + accessible: form fields labeled + `autocomplete`; success state announced; accordion `aria-expanded`; search labeled; keyboard completes both pages.
6. No fabricated trust signals — the stats replacement above is the centerpiece of this rule; also no fake "avg response time" claims.
7. Test before done — see below.

## Implementation notes

- Cross-check every fact you keep against `db.json` `settings.store/social` and the About page so the three surfaces agree.
- The form's success screen swap is state-driven — keep it (no Swal needed).
- Help topics grid: verify each destination renders post-redesign (all are covered by other prompts).
- `FAQ_ITEMS` copy should already be Assamese-silk-aware from Prompt 16 — extend here only if gaps show.

## Acceptance criteria

- [ ] Both pages read editorial-calm; fabricated stats are GONE, replaced by attested facts (or nothing).
- [ ] Contact form: validation paths, submit → success → "Send another"; lead lands in Admin → Leads with correct fields.
- [ ] tel/mailto/WhatsApp/Directions/social links all live; hours honest.
- [ ] Help search filters live; all six topic cards route; accordion + no-results + contact banner work.
- [ ] Light/dark parity; 375→1440; keyboard + AT pass; no hex.

## Test & QA

- `npm run dev`: submit a valid lead (logged-in: email pre-filled) + an invalid one (short message) → error copy.
- Admin → Leads: the new contact row with subject/message intact.
- Search "return" in Help → matches; search gibberish → no-results with Support link.
- Both themes; 375/768/1280.
- Admin untouched beyond the Leads verification.
