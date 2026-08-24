# Admin Logo Swap — the ONLY Admin Change in the Series

**Prompt 28 of 30**

## Depends on

Prompt 01 (brand direction settled). Independent of the storefront prompts.

## Context

Meghali's Silk — the storefront has been redesigned; the admin panel stays EXACTLY as-is except for this one change: its logo. The admin currently renders a legacy Cloudinary logo (`https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png` — a PNG with a baked-in deep-green background) on inline `backgroundColor: "#0B3B2E"` panels. New brand logos: light `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592407/meghali-silk-logo.png` (for light backgrounds) · white `https://res.cloudinary.com/v8vrixwq/image/upload/v1787592405/meghali-silk-logo-white.png` (for dark backgrounds).

## Objective

Swap the admin's logo to the new brand assets — correct variant per background — in exactly two files, changing nothing else about the admin.

## Scope — files/areas to touch (EXHAUSTIVE — nothing else)

- `src/components/AdminLayout/AdminLayout.js` — the `LOGO` constant (~line 39) and its render site in the drawer "Logo Section" (~lines 337–351, including the inline `backgroundColor: "#0B3B2E"` wrapper)
- `src/pages/Admin/AdminLogin.js` — the `LOGO` constant (~line 21) and its render site (~lines 138–152, same inline background pattern)
- Verify these line refs against the actual files before editing (they may have drifted); if the logo renders anywhere else in the admin, report it — do not expand scope silently.

## Brand & design requirements

1. **Pick the correct variant per real background:** run the admin in BOTH its light and dark modes (`buildAdminTheme(mode)` follows the storefront theme toggle) and check what actually sits behind the logo slot in each. The new logos are transparent-background:
   - If the slot's surround is light → light logo; if dark → white logo. If the admin sidebar/login card differs between its light and dark modes, switch the `src` on the same `mode`/`isDarkMode` value those components already have in scope.
   - The old baked-green panel (`backgroundColor: "#0B3B2E"`) may be removed so the logo sits directly on the admin surface — OR kept as a simple brand plate behind the WHITE logo if contrast demands it. Choose whichever looks clean in both modes; keep the change minimal.
2. Preserve sizes/`alt` behavior: AdminLayout height 36, AdminLogin height 60, `alt` from `process.env.REACT_APP_NAME || "Meghali's Silk Admin"` — keep, adjusting only if the new logo's aspect ratio clips (then set height + `width: auto`).
3. Serve 2× via Cloudinary width transforms for crispness.

## Functional guardrails

1. This is the ONLY admin modification permitted in the entire 30-prompt series. No other line in `src/pages/Admin/*` or `src/components/AdminLayout/*` may change — no styling drive-bys, no refactors, no theme edits.
2. Preserve all admin functionality: login, drawer navigation, every module (Dashboard, Products, Categories, Orders, Returns, Payments, Users, Shipping, Coupons, Special Offers, Reviews, Leads, Settings).
3. No storefront file changes here.
4. Brand: correct logo variant per background — a light logo on a dark sidebar (or vice versa) fails the prompt.
5. Accessibility: `alt` retained; logo not focus-trapping.
6. No fabricated trust signals — n/a.
7. Test before done — see below.

## Implementation notes

- Admin credentials (mock): admin@store.com / admin123 at `/admin`.
- The two files import nothing new for this — a constant URL swap + conditional, using the `mode`/`isDarkMode` already present in each file.
- Diff discipline: the final diff should touch ~2–10 lines per file. Anything larger is scope creep.

## Acceptance criteria

- [ ] Both admin surfaces (login page + layout drawer) show the new logo, correct variant per background, crisp at 1×/2×, in BOTH admin light and dark modes.
- [ ] Old Cloudinary URL (`dn9gyaiik/.../Logo_gpxble.png`) no longer referenced in the admin.
- [ ] Diff limited to the two files' logo constant + render site; nothing else in the admin changed.
- [ ] Full admin smoke test passes (below).

## Test & QA

- `npm run dev` → `/admin` → login renders logo correctly (both theme modes — toggle theme on the storefront first, since admin mode follows it).
- Post-login: drawer logo correct in both modes; navigate every module once; open one edit dialog (e.g. a product) and one action flow (approve a review) — all functional.
- `git diff` review: only the sanctioned lines changed.
- Storefront unaffected (its logos were swapped in their own prompts).
