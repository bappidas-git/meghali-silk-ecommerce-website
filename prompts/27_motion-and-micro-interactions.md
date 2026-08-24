# Motion & Micro-interactions — the Finishing Hand

**Prompt 27 of 30**

## Depends on

Prompts 05–26 (all surfaces redesigned — this pass unifies them). Tokens from 01.

## Context

Meghali's Silk — Assamese-silk boutique storefront, now redesigned surface-by-surface into the warm-minimalist editorial system (light, golden-logo `--sf-*` tokens; framer-motion v10 available; `AnimatePresence mode="wait"` already wraps the storefront `<Routes>` in `App.js`). Motion brief: subtle, slow, elegant — gentle fades/reveals, soft hover lifts, refined easing — always honoring `prefers-reduced-motion`.

## Objective

A cross-surface motion unification pass: one easing/duration language everywhere, considered page transitions, consistent hover/press states, consistent skeletons — removing every leftover bouncy/springy/neon-era animation.

## Scope — files/areas to touch

- Any storefront component/page `.js`/`.module.css` where motion values live (framer-motion variants, CSS transitions) — VISUAL timing/easing/variant changes only; no logic, handlers, or data flow edits
- `src/App.css` keyframes/utilities if stragglers remain
- NOT: `src/pages/Admin/*`, `src/components/AdminLayout/*`, contexts, `services/api.js`, `db.json`

## Brand & design requirements

1. **One language:** audit every `transition:` and framer-motion `variants`/`transition` prop across the storefront; normalize to the token durations (`--sf-transition-fast/-/-slow`) and the Prompt 01 easing (in JS, mirror the cubic-bezier as a shared constant — e.g. exported from a small `src/theme/motion.js` if helpful, or inline consistently). Springs (SidebarMenu damping 32, CartDrawer damping 30, BottomDrawer) retuned to feel damped/luxurious or replaced with tweens.
2. **Page transitions:** with `AnimatePresence mode="wait"` already in place, ensure each page's root participates consistently — a single quiet fade (+ ~8–12px rise) on enter, faster fade on exit; identical across all 16 storefront routes; no transition on hash/anchor scrolls.
3. **Hover/press vocabulary:** cards = slow image scale ~1.03 + caption/underline shift; buttons = color/underline shifts (NO translateY glow lifts anywhere — grep for `translateY(-` hovers); icon buttons = gentle opacity/scale 0.98 press.
4. **Stagger discipline:** list/grid reveals ≤0.03–0.05s per item, capped total delay (~0.3s, as SearchModal already does); nothing waves, floats, or pulses (`logoFloat`-style keyframes retired).
5. **Skeletons & feedback:** every loading surface uses the `sf-skeleton` shimmer language; Swal toasts (themed in 03) verified consistent; the "Added ✓" microstates unified.
6. **Reduced motion — total sweep:** every animation path honors it — the CSS token zeroing (01), `useReducedMotion` in framer components, the confetti guard, autoplay pauses. Verify surface-by-surface with the OS setting on; anything still moving is a bug.

## Functional guardrails

1. Visual-timing changes ONLY: no handler, state, effect, API, or prop changes; IntersectionObserver thresholds, autoplay timers (5s hero, 4s announcements), debounce values, and the 300ms wishlist-removal delay are BEHAVIOR — leave them.
2. Do NOT modify the admin panel.
3. Tokens for CSS timing; one shared JS easing/duration convention for framer values (sync-commented to the tokens).
4. `AnimatePresence` keys/structure untouched where they gate real mount/unmount logic (Checkout steps, drawers, modals) — retime, don't restructure.
5. Accessibility: focus-visible states never animated away; no motion that traps attention (infinite pulses); reduced-motion pass mandatory.
6. No fabricated trust signals — no attention-grabbing urgency animations.
7. Test before done — see below.

## Implementation notes

- Grep starters: `grep -rn "transition\|whileHover\|whileTap\|animate=\|variants" src/components src/pages --include="*.js"` and `grep -rn "cubic-bezier\|ease\|@keyframes" src --include="*.css"` (skip Admin paths).
- High-traffic offenders from the old system: MUI button overrides (ThemeContext — retuned in 01, verify), `.hover-scale`/`.floating`/`.pulse-glow` utilities (03), HeroSection slide scale, SidebarMenu stagger, Products drawer spring, AuthModal tab slide.
- Keep a short changelog comment nowhere — just make the values consistent; consistency IS the deliverable.

## Acceptance criteria

- [ ] One easing/duration language across every storefront surface; no springs/bounces/glow-lifts remain.
- [ ] Route changes transition identically across all 16 storefront routes.
- [ ] Hover/press vocabulary consistent on cards, buttons, icons, rows.
- [ ] All skeletons on the shared shimmer; microstates unified.
- [ ] OS reduced-motion: zero non-essential movement anywhere (hero static, no staggers, no confetti, drawers snap).
- [ ] No functional regressions: drawers/modals/steps/carousels all still operate.

## Test & QA

- `npm run dev`: navigate all routes twice (transition consistency), open/close every overlay (drawer, sidebar, search, auth, review modal, filter sheet).
- Reduced-motion sweep of the same list.
- Hover/press pass on Home, Products grid, PDP, drawer at desktop; press states on mobile width.
- Full purchase flow + cancel flow once — untouched behavior proof.
- Both themes. Admin untouched.
