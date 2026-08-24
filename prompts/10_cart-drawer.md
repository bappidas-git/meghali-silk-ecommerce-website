# Cart Drawer — the Quiet Tray

**Prompt 10 of 30**

## Depends on

Prompt 01 (tokens), Prompt 03 (primitives), Prompt 09 (price/stepper visual language to match).

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `CartDrawer` is a right slide-in `aside` opened via `CartContext` state (`isCartOpen` / `setIsCartOpen`; Header mounts it; adding to cart auto-opens it). It renders line items with steppers and stock caps, a free-shipping progress meter (threshold ₹999 from `FREE_SHIPPING_THRESHOLD`, flat ₹99 mirror), a promo-code box (`apiService.coupons.validate`), price details, and the checkout CTA.

## Objective

Restyle the cart drawer into an elegant editorial tray — calm typography, hairline separations, a refined free-shipping meter, dignified coupon and totals — with every behavior and calculation untouched.

## Scope — files/areas to touch

- `src/components/CartDrawer/CartDrawer.js` + `CartDrawer.module.css` — props stay `({ open, onClose })`
- Nothing else (CartContext, Header mount, and checkout page are out of scope).

## Brand & design requirements

1. **Panel:** ivory surface, hairline left edge, slower/softer slide (Prompt 01 easing), token overlay scrim. Header row: "Your Cart" in the display serif + item count in muted tracked text + close.
2. **Line items:** editorial rows — 3:4 thumbnail (~72–88px), name (2-line clamp, links via `productPath`), variantName in muted small text, price + struck comparePrice, the −/qty/+ stepper restyled to match Prompt 09's `QuantityStepper` look (this drawer has its own inline stepper — align visually), quiet remove affordance. Keep the framer-motion `layout` + enter/exit item animations but soften them; hairline separators between rows.
3. **Free-shipping meter:** a 2px hairline progress track with gold fill and one honest line ("₹X away from complimentary shipping" → "Complimentary shipping unlocked"); keep the exact math (threshold 999 / flat 99) and the 0.6s ease fill.
4. **Promo code:** hairline underline input + quiet Apply button; applied state = small ink chip with code + remove; error and the below-minimum auto-remove note styled as calm inline text. Behavior identical (`coupons.validate(code, cartTotal)`, derived `couponDiscountFor`, auto-drop effect).
5. **Price details:** Subtotal / Savings (line savings + coupon) / Shipping (FREE or ₹) / Total — right-aligned figures, Total as the single strong serif moment.
6. **Footer CTA:** full-width primary `sf-btn` "Proceed to Checkout" (closes drawer → `/checkout`); optional quiet "Continue shopping" text link that just closes.
7. **Empty state:** warm editorial moment — refined line-art or typographic empty message + "Explore the collection" → `/products`.

## Functional guardrails

1. Preserve all functionality & contracts: `open`/`onClose` props, CartContext as the single source (`cartItems`, `updateQuantity`, `removeFromCart`, `getCartTotal`), stock-cap logic (`atStockLimit` when `quantity >= stock`, disabled + title), coupon validate/auto-remove flow, FREE_SHIPPING math, checkout navigation, body-scroll lock, auto-open on add-to-cart (context behavior — don't intercept).
2. Money math untouched: totals remain derived exactly as now (subtotal, savings, shipping, total) — restyle presentation only. Note the drawer's coupon is display-level; checkout revalidates its own — do not try to share state.
3. Tokens/primitives only; zero hex; motion via tokens; reduced-motion = no slide/stagger.
4. Do NOT modify the admin panel.
5. Responsive + accessible: full-width sheet on mobile; drawer labeled (`aria-label="Shopping cart"` on the aside/dialog semantics), focusable controls with visible rings, Escape/overlay close preserved, stepper buttons ≥44px on touch.
6. No fabricated trust signals: the meter reflects the real threshold only; no timers, no "others have this in cart".
7. Test before done — see below.

## Implementation notes

- The drawer hardcodes `FLAT_SHIPPING = 99` as a documented mirror of the db.json Standard method — leave that mechanism (a comment already explains it).
- `truncateText(name, 45)` may be replaced by CSS line-clamp; keep the link behavior.
- Verify z-index above BottomNav and Header (`--sf-z-overlay` band) and below Swal (2000).
- Test with 1, 3, and 8+ lines (scroll region must scroll independently of the pinned footer).

## Acceptance criteria

- [ ] Drawer reads as an editorial tray — hairlines, serif totals, calm motion; visibly not the old drawer.
- [ ] Add-to-cart auto-open, qty clamps at stock, remove, line/coupon savings, shipping meter, totals — all behave identically.
- [ ] Coupon: valid code applies (try a seeded code from `db.json`), invalid errors, below-minimum auto-removes with note.
- [ ] Checkout CTA navigates and closes; empty state renders with working link.
- [ ] Mobile full-sheet + desktop panel both clean; light/dark parity; reduced motion honored.
- [ ] No hex; no functional diffs in `CartContext` usage.

## Test & QA

- `npm run dev`: add items from Home/Products/PDP — drawer opens with correct lines and variant names.
- Push a line to its stock cap → + disabled with title; drop qty to 0 → removes.
- Apply a seeded coupon (check `db.json` for current codes) → savings row; remove it; re-add with subtotal below its minimum → auto-drop note.
- Cross ₹999 → meter completes + copy flips; drop below → reverts.
- Keyboard: open via cart icon, tab through lines, Escape closes, focus returns to the icon.
- 375/768/1440; both themes; admin untouched.
