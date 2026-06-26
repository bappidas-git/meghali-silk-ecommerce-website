<!-- Batch D — Storefront Pages -->
# Prompt 23 — Authentication Modal (Login / Register / Forgot Password)

## Objective
Re-skin the **AuthModal** (`src/components/AuthModal/AuthModal.{js,module.css}`) — the global login /
register / forgot-password dialog — to the *Meghali's Silk* brand: a logo panel on the brand-green
surface, gold/emerald accents, and serif headings, while keeping every validation rule, error state, and
handler (login, register, change/forgot password) wired through `AuthContext` / `apiService.auth`
exactly as-is, mirroring the existing success/redirect behavior and meeting accessibility requirements
(labelled inputs, focus trap, ESC).

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house selling
authentic women's silk apparel. The storefront is **dark-first**: near-black charcoal canvas, deep
bottle-green brand panels, gold/champagne accents, emerald primary CTAs, elegant serif headings.

There is **no dedicated auth mockup** — build on the brand system. The dialog should read as a premium
sign-in card: a top **logo panel** showing the Meghali's Silk logo on its own deep-green background
(the logo PNG ships with that green; it must sit on a matching green panel so it never looks pasted), a
serif heading ("Welcome back" / "Create account" / "Reset password"), Login/Sign Up tabs with a sliding
gold/emerald indicator, tokenized inputs with leading icons and a gold focus ring, an emerald primary
submit, and honest helper/error text.

Tokens to consume (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Logo panel: `--brand-logo-bg` (alias `--sf-color-brand-green`) — the panel behind the logo image.
  Logo URL: `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`.
- Surfaces/text: `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-bg`, `--sf-color-text`,
  `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`, `--sf-color-border-strong`,
  `--sf-color-overlay` (the dimmed backdrop).
- Accents: `--sf-color-gold`, `--sf-gradient-gold` (tab indicator / focus accents); CTA
  `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast`; focus ring
  `--sf-shadow-focus`.
- Semantic: `--sf-color-danger{,-bg}` (errors), `--sf-color-success{,-bg}` (success toast),
  `--sf-color-info{,-bg}` (info banner).
- The component currently uses some `--auth-*` custom properties (e.g. `--auth-strength-weak/fair/good/
  strong/empty`). Keep that pattern but ensure those `--auth-*` values are **defined from the brand
  tokens** (map them to the `--sf-*` palette in this component's CSS or in `storefront-tokens.css`) so
  the strength meter and any auth-scoped vars are brand-coherent in both themes — no stray purple/blue.
- Type: `--sf-font-display` for the dialog heading; `--sf-font-family` for inputs/labels. Radius/space/
  shadow/motion via the `--sf-radius-*`, `--sf-space-*`, `--sf-shadow-*`, `--sf-transition*` scales;
  z-index via `--sf-z-modal`.

## Scope — Files to Create / Modify
- (MODIFY) `src/components/AuthModal/AuthModal.js` — re-skin markup (add the logo panel, branded
  heading); add a proper focus trap and improved forgot-password affordance; keep ALL handlers,
  validation, and state.
- (MODIFY) `src/components/AuthModal/AuthModal.module.css` — full re-skin via `var(--sf-*)` tokens
  (overlay, dialog, logo panel, tabs/indicator, inputs, buttons, banners, strength meter, mobile sheet).
- **OUT of scope:** `AuthContext`/`useAuth` internals, `apiService.auth`, the components that *open*
  this modal (only keep its `open`/`onClose`/`defaultTab` props — do not change the openers), `db.json`,
  and `src/pages/Admin/*`.

## Detailed Requirements
1. **Keep the component contract.** Keep `AuthModal({ open, onClose, defaultTab = "login" })`, the
   `framer-motion` overlay + dialog (desktop scale/fade, mobile bottom-sheet `mobileDialogVariants`),
   the `isMobile` detection, the `defaultTab` sync, the open-reset effect, the body-scroll lock, and the
   ESC-to-close + overlay-click-to-close handlers. Keep `role="dialog"` / `aria-modal="true"` on the
   overlay/dialog.
2. **Logo panel.** Add a header panel at the top of the dialog filled with `--brand-logo-bg` containing
   the Meghali's Silk logo `<img>` (the URL above), sized so it reads as a brand chip, with appropriate
   `alt="Meghali's Silk"`. Because the logo's own background is the same green, the panel and image blend
   seamlessly. Below it, the serif heading + subtitle that branch on the active flow.
3. **Tabs + sliding indicator.** Keep the Login / Sign Up tabs and the animated `tabIndicator`; re-skin
   the indicator to a gold/emerald accent and the active tab text to gold. Keep `switchTab` (with its
   direction + state reset) and the `tabContentVariants` slide between forms.
4. **Login form (keep logic).** Keep the email + password fields (leading `EmailIcon`/`LockIcon`, the
   password show/hide eye, `autoComplete`), `validateLogin`, and `handleLoginSubmit` which calls
   `login({ email, password, remember })` from `useAuth`, checks `result.success`, sets
   `errors.general` on failure (honest message, e.g. invalid credentials), shows the success toast, and
   closes after the existing delay. Keep "Remember me" and the "Forgot password?" link. Re-skin inputs
   with tokenized borders + a gold focus ring; field errors use `--sf-color-danger`.
5. **Register form (keep logic).** Keep first/last name, email, **+91** phone, password (with the
   strength meter), confirm password, and the Terms checkbox; keep `validateSignup` (including the honest
   "email is required / valid", phone, min-length, match, and terms checks) and `handleSignupSubmit`
   which calls `register({...})`, checks `result.success`, sets `errors.general` on failure (e.g. an
   **email-already-taken** message surfaced from the API), shows the success toast, then switches to
   login pre-filling the email. Re-skin the strength meter to brand colors (map `--auth-strength-*` to
   tokens). Keep the Terms/Privacy links.
6. **Forgot-password flow (improve, keep honesty).** The current behavior shows an info banner pointing
   to support because self-service reset isn't built. Keep that honesty, but make it a clearer **flow**:
   - Either keep the info banner (re-skinned with `--sf-color-info-bg`, linking to `/support`), OR add a
     lightweight "Reset password" view (a third internal mode) with an email field and a submit that — if
     and only if a real reset endpoint exists on `apiService.auth` — calls it and shows an honest "If an
     account exists for this email, we've sent reset instructions" confirmation. **Do not invent a fake
     reset endpoint or pretend an email was sent if no endpoint exists** — if none exists, fall back to
     the support-pointer banner. Whichever you choose, it must be reachable from the "Forgot password?"
     link and dismissible back to login.
7. **Focus trap + a11y (add).** Add a focus trap to the dialog: on open, move focus to the first
   focusable control (or the close button); keep Tab/Shift+Tab cycling within the dialog; on close,
   return focus to the element that had it before opening. Keep ESC close. Ensure every input has an
   associated `<label>` (the existing `htmlFor`/`id` pairs — preserve them), the password eye buttons and
   close button have `aria-label`s, and the error banner is announced (e.g. `role="alert"`). Disabled
   social buttons keep their "Soon" badge + `title` (they are intentionally non-functional placeholders —
   keep them honest, do not wire fake OAuth).
8. **Success / redirect behavior.** Mirror the existing post-login/register behavior exactly (success
   toast, the timed `onClose()` for login, the switch-to-login-with-prefill for register). Do not change
   timings/semantics other than styling.
9. **Mobile sheet.** Keep the bottom-sheet presentation on ≤640px (slide up from bottom, rounded top
   corners, full-width), with the logo panel and tabs adapting; ensure the dialog scrolls if the form is
   tall and the submit stays reachable.
10. **No hardcoded hex.** Every color in `AuthModal.module.css` must be a `var(--sf-*)` (or a brand-
    mapped `--auth-*`) token; remove any leftover boilerplate purple/blue. Reuse the nearest token when a
    precise shade is missing.

## Data / API Notes
- **apiService / context used (unchanged):** `useAuth().login({ email, password, remember })`,
  `useAuth().register({ firstName, lastName, email, phone, password, confirmPassword })`. (Password
  *change* lives on the Profile page via `apiService.auth.changePassword`; a self-service *reset*
  endpoint is only to be called if it genuinely exists on `apiService.auth` — otherwise keep the
  support-pointer.) Both `login`/`register` resolve with `{ success, error }` rather than throwing —
  keep checking `result.success`.
- **Helpers:** `isEmailValid` from `src/utils/helpers.js` (keep using it). Logo URL as above.
- No `db.json` changes in this prompt. Do not alter auth payload shapes or add fake providers/endpoints.

## Constraints (Do Not Break)
- Keep auth **fully functional & API-driven**: all validation + error + success states and the
  `login`/`register` (and any real reset) calls flow through `AuthContext`/`apiService.auth` exactly as
  before; mirror existing success/redirect behavior.
- Honor **authenticity > persuasion**: honest error messages (invalid credentials, **email already
  taken**, validation), an honest forgot-password path (no fake "email sent" without a real endpoint),
  and the social buttons stay disabled "Soon" placeholders — no fabricated OAuth.
- **Re-skin only via `src/theme/storefront-tokens.css` tokens** (and brand-mapped `--auth-*`) — no
  hardcoded hex in `AuthModal.module.css`.
- Do not change the component's public props (`open`, `onClose`, `defaultTab`) or how it is opened.
- Preserve the JSON Server ↔ Laravel swap contract and all JSON shapes (no new `fetch`/`axios`).
- Do not modify the admin panel or any `src/pages/Admin/*` file.
- Accessibility: labelled inputs, a working **focus trap**, **ESC** to close, focus return on close,
  announced errors, visible focus rings, ≥44px tap targets, and a usable mobile bottom-sheet.

## Acceptance Criteria / Definition of Done
- [ ] The modal is on-brand: a green logo panel (logo on `--brand-logo-bg`), serif heading, gold/emerald
      tab indicator, tokenized inputs with gold focus rings, emerald submit — coherent in dark and light.
- [ ] Login works (valid → success toast + close; invalid → honest `errors.general`); Register works
      (valid → success → switch to login prefilled; duplicate email / invalid input → honest errors);
      the password strength meter is brand-colored.
- [ ] "Forgot password?" leads to an honest path (support-pointer banner, or a real reset view only if an
      endpoint exists) and returns to login.
- [ ] Focus trap works: focus moves into the dialog on open, cycles within it, returns to the opener on
      close; ESC and overlay click close; errors are announced; social buttons remain disabled "Soon".
- [ ] No hardcoded hex / leftover boilerplate colors in `AuthModal.module.css`; no console errors;
      `npm run build` clean.

## Verification Steps
1. `npm run dev`; trigger the modal (e.g. click Login in the header, or hit a guarded action like
   checkout while logged out).
2. Confirm the green logo panel, serif heading, branded tabs/inputs, and the gold focus ring on focus.
   Tab through the dialog and confirm focus stays trapped; press ESC to close and confirm focus returns
   to the opener.
3. Submit login with wrong credentials → honest error banner; submit with a seeded valid user → success
   toast then close (logged in).
4. Switch to Sign Up; submit with mismatched passwords / missing terms / an already-registered email →
   the right honest errors; submit a valid new account → success then switch to login prefilled.
5. Click "Forgot password?" → confirm the honest reset path (support-pointer or real reset view) and that
   you can return to login.
6. Resize to ≤640px → the dialog is a bottom-sheet; confirm it scrolls and the submit is reachable.
7. Toggle theme; check both modes (no purple/blue remnants).
8. `npm run build` → clean build, no console errors.
