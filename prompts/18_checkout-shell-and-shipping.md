# Checkout I — Shell, Cart Step & Shipping Step

**Prompt 18 of 30**

## Depends on

Prompt 10 (drawer language), Prompt 11 (auth gate), Prompts 01/02/03/09. Prompt 19 finishes Payment/Review — the two prompts edit the SAME file; this one lands first.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/checkout` (`src/pages/Checkout/Checkout.js`, self-contained) is a 4-step state machine `STEPS = ["Cart","Shipping","Payment","Review"]` (`step` 0–3, `AnimatePresence mode="wait"`): step 0 lists cart lines (qty/remove) and gates guests via `openAuthModal("login")`; step 1 = saved-address radio cards + inline add-new form (`validateAddress` requires firstName/lastName/phone/addressLine1/city/state/postalCode) + shipping-method selection (`apiService.shipping.getMethods`, active-only, first auto-selected, free when `rateType==="free"` or `subtotal >= freeAbove`); a persistent order-summary sidebar shows money rows; scroll-to-top on step change; empty-cart guard renders a Continue-Shopping state.

## Objective

Redesign the checkout frame — a focused, low-noise editorial flow (minimal step indicator, two-column desktop with a quiet summary rail) — and the Cart + Shipping steps, preserving the state machine, validation, and every data flow. (Payment/Review steps get the same treatment in Prompt 19 — leave their JSX functional and untouched beyond what shared-shell styling naturally applies.)

## Scope — files/areas to touch

- `src/pages/Checkout/Checkout.js` + `Checkout.module.css` — the page shell (header, step indicator, layout grid, summary sidebar), step 0 (Cart) and step 1 (Shipping) render blocks, empty state. Do not rework the step-2/3 JSX internals (Prompt 19).

## Brand & design requirements

1. **Shell:** a focused checkout — calm page title ("Checkout" serif), a minimal horizontal step line (four tracked-uppercase labels joined by hairlines, gold fill/check for completed, ink for current — replaces any bubbly stepper), Back as a quiet text-button. Desktop: content column + sticky summary rail (~380px); mobile: single column with the summary as a collapsible band above the CTA.
2. **Step 0 — Cart review:** editorial line rows (thumb 3:4, name, variant, price, stepper, remove) matching the Prompt 10 drawer language; guests see the auth gate on Continue (existing `openAuthModal` flow — style the moment kindly).
3. **Step 1 — Shipping:** saved addresses as hairline radio cards (label chip, name, address lines via the existing rendering, default mark), "+ Add new address" reveals the inline form — restyled inputs (hairline/underline, small tracked labels, calm `addressErrors` messages), country readOnly India. Shipping methods as radio rows: name, description, ETA, cost or "Complimentary" — real data only; `shippingError` styled as calm inline text.
4. **Summary rail:** rows restyled (Subtotal / Discount (CODE) / Shipping / Tax (N% GST) / hairline / serif Total — plus the Store Credit / Amount Payable rows that Prompt 19 owns logically but which render here — style them consistently now), first-3 items + "+N more", and the static trust icons row → quiet hairline assurance line.
5. **Empty state:** editorial "Your cart is quiet" + Continue Shopping → `/products`.
6. Motion: step transitions = soft fade/slide via tokens; reduced motion = instant swaps.

## Functional guardrails

1. Preserve the state machine & flows EXACTLY: `handleNext` step gating (empty-cart bail, auth gate, `validateAddress` + `selectedShipping` requirement), Back behavior, scroll-to-top effect, `AnimatePresence` keys, Review-step "Edit" jump targets (setStep(1)/setStep(2)) untouched.
2. Preserve all data flows & money math: `getCartTotal` subtotal, `couponDiscountFor` derivation, shipping cost/free logic, `taxRatePct` from `settings.store.taxRate ?? 5`, `total` formula, and the storeCredit/amountPayable fields — NO formula or rounding edits anywhere.
3. API-driven as-is: `apiService.shipping.getMethods`, `settings.get`, plus the wallet/coupon/order calls that steps 2–3 use — untouched.
4. Tokens/primitives only; zero hex (the payment emoji icons live in step 2 — Prompt 19's problem).
5. Do NOT modify the admin panel.
6. Responsive + accessible: stepper announces current step (`aria-current="step"`), form fields labeled + `autocomplete` (name/tel/address-line1/postal-code…), errors associated; keyboard completes both steps; ≥44px targets. No fabricated trust signals (assurance line = store-attested only).
7. Test before done — see below.

## Implementation notes

- One file, two prompts: structure your CSS so Prompt 19 can restyle step 2/3 internals without touching the shell classes you define. Leave a short comment marking the shell/step boundaries.
- Auth-gate test: guest with items → Continue → AuthModal opens; after login, user lands back on checkout with cart intact (context merge).
- Address form state (`useExistingAddress` null-vs-selected switching) is subtle — restyle without changing the state shape.
- Verify with a user having 2 saved addresses (user@example.com / password123 has one — add one via Profile first or in-form).

## Acceptance criteria

- [ ] Checkout reads focused/editorial (minimal step line, quiet rail) — structurally distinct from the old stepper UI.
- [ ] Step 0: lines editable (qty/remove sync with cart), guest gate works, empty state correct.
- [ ] Step 1: address select/add/validate all work (every required-field error styled), shipping methods select with correct pricing/free logic.
- [ ] Summary rail: all rows correct at every step, sticky on desktop, collapsible on mobile.
- [ ] Steps 2–3 still fully functional (unstyled internals acceptable until Prompt 19).
- [ ] Light/dark parity; 375→1440; keyboard pass; reduced motion; no hex.

## Test & QA

- `npm run dev`: guest → gate → login → complete steps 0–1 with (a) saved address, (b) new address with deliberate validation failures first.
- Free-shipping boundary: cart below and above the method's `freeAbove` → rail Shipping row flips.
- Continue to Payment/Review and place a COD order end-to-end to prove no regression (`order-confirmation` reachable).
- Both themes; 375/768/1280; keyboard-only to step 2.
- Admin → Orders shows the placed order; admin otherwise untouched.
