# Auth Modal — Login & Registration

**Prompt 11 of 30**

## Depends on

Prompt 01 (tokens), Prompt 03 (primitives). Pairs visually with Prompt 10's overlay language.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `AuthModal` (`({ open, onClose, defaultTab = "login" })`) is mounted once in Header, opened globally via `AuthContext` (`openAuthModal("login"|"signup")` — called from Header, SidebarMenu, Wishlist, OrderHistory, Checkout's auth gate). Desktop scale-in dialog / mobile bottom-sheet at ≤640px; Login and Sign-Up tabs with a sliding indicator; password strength meter; remember-me; two disabled social buttons. Logos: light `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png` (use on the light dialog) · white `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png`.

## Objective

Redesign the auth dialog into a serene boutique welcome — light logo on ivory, serif greeting, hairline inputs — preserving the full login/register/remember-me flow, validation, strength meter, focus trap, and mobile bottom-sheet behavior.

## Scope — files/areas to touch

- `src/components/AuthModal/AuthModal.js` + `AuthModal.module.css`
- Nothing else (AuthContext and all callers stay untouched).

## Brand & design requirements

1. **Composition:** delete the green `.logoPanel` — the light logo sits directly on the ivory dialog (white-logo variant if you keep a dark header band inside the dialog; correct logo per background). Serif welcome line ("Welcome back" / "Join Meghali's Silk"), tracked-uppercase tab labels with the sliding indicator refined to a hairline gold underline.
2. **Forms:** hairline-underline or thin-bordered inputs, floating or small tracked labels, calm error text (no red shouting — token danger at small size). Login: email, password (show/hide), Remember me, Forgot link, primary `sf-btn` submit. Signup: first/last, email, +91 phone, password + the existing 4-segment strength meter (keep `getPasswordStrength` and the `--auth-strength-*` → token mapping), confirm, terms line, submit.
3. **Motion:** overlay fade + dialog rise retimed to Prompt 01 easing; directional tab-slide (x±60) kept but softened; mobile bottom-sheet spring gentled. All off under reduced motion.
4. **Social buttons:** keep both (Google/Facebook), still disabled with their honest "Soon" state, brand-hex SVGs untouched; restyle the containers as hairline buttons.
5. Dark-mode parity via tokens.

## Functional guardrails

1. Preserve all functionality & contracts: `open/onClose/defaultTab` props; `useAuth().login/register/isLoading` calls and their result handling (login stores session via authStorage with remember-me semantics; register success switches to login); validation (`isEmailValid`, password rules); error/info banners; success toast behavior.
2. Preserve interaction plumbing: body-scroll lock, Escape, FULL focus trap + focus restore, `resize` → `isMobile` bottom-sheet switch at ≤640px.
3. Tokens/primitives only; the 5 social-brand hexes are the documented exception.
4. Do NOT modify the admin panel (admin has its own login page).
5. Responsive + accessible: labeled inputs with `autocomplete` attributes preserved/added (`email`, `current-password`, `new-password`, `given-name`, `family-name`, `tel`), error text associated via `aria-describedby`, tabs keyboard-operable, strength meter has text label not color alone.
6. No fabricated trust signals; keep the honest "Soon" on social buttons — no fake OAuth.
7. Test before done — see below.

## Implementation notes

- Callers to verify after restyle: Header account icon (guest), SidebarMenu sign-in row, Wishlist guest banner, OrderHistory logged-out prompt, Checkout step-0 auth gate — all call `openAuthModal(...)` and must land on the correct tab.
- Mock-mode credentials: user@example.com / password123. Register with a fresh email (mock mirrors Laravel's duplicate-email 422 — test that path too).
- Remember-me: unchecked → session-scoped (dies with the tab); checked → localStorage. Verify both after restyle.

## Acceptance criteria

- [ ] Dialog reads editorial (light logo on ivory, serif greeting, hairline fields) — no green panel.
- [ ] Login works (toast, header avatar updates); wrong password shows the error banner without logging anyone out.
- [ ] Register: validation, strength meter states, duplicate-email error, success → login tab flow.
- [ ] Remember-me semantics verified (tab close vs reload).
- [ ] `defaultTab` respected from every caller listed above.
- [ ] Focus trap/Escape/body-lock/mobile bottom-sheet verified; reduced motion clean; both themes.

## Test & QA

- `npm run dev`; open from all five entry points (Header guest icon, SidebarMenu, Wishlist banner, OrderHistory prompt, Checkout gate).
- Full login + logout + register-with-new-email + register-with-existing-email passes.
- Keyboard-only complete login; screen-reader spot check on labels/errors.
- ≤640px bottom-sheet; ≥641px dialog; both themes.
- Confirm cart/wishlist state survives login (guest cart merges — CartContext behavior) — no regression.
- Admin untouched.
