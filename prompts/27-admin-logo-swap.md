<!-- Batch F — Admin Logo, Polish & QA -->
# Prompt 27 — Admin Logo Swap (Brand Logo on Green)

## Objective
Swap **only** the admin panel's placeholder logo for the real *Meghali's Silk* logo, displayed on the
brand's deep-green panel — in the admin sidebar and on the admin login screen. This is the **single
permitted admin change** in the entire redesign. Nothing else in the admin (layout, navigation, tables,
dialogs, MUI admin theme, data contracts) may change.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a heritage handloom silk house. Its logo is a
gold serif wordmark "MEGHALI'S SILK" over "GALLERIA PRODUCER COMPANY LIMITED" rendered on the brand's
own **deep bottle-green** background.

- **Logo URL (MANDATORY):**
  `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png`
- **Logo-on-green rule:** the logo PNG ships with its OWN deep-green background, so it must always sit on
  a panel/wrapper filled with that SAME deep green — otherwise it looks like a pasted rectangle on a
  different surface. Brand green = **`#0B3B2E`** (token name `--brand-logo-bg` / `--sf-color-brand-green`
  on the storefront).
- The admin panel uses its OWN MUI palette (`src/theme/adminTheme.js`) and hardcoded styles, and does
  **not** consume the storefront `--sf-*` tokens. Therefore, for this ONE admin change, a small **inline
  style / wrapper with the green background `#0B3B2E`** behind the logo is acceptable and expected.
- Relevant design reference: `UI Designs/Logo.png` (the wordmark + its green field).

There is no new visual design to match here beyond placing the existing logo correctly on green — keep
the admin's existing structure pixel-for-pixel otherwise.

## Scope — Files to Create / Modify
- (MODIFY) `src/components/AdminLayout/AdminLayout.js`
  - Line ~39: the constant
    `const LOGO = "https://placehold.co/160x40/4f46e5/ffffff?text=LOGO";`
  - Used ~line 336 inside the "Logo Section" `<Box>` (the sidebar header `<img src={LOGO} ... />`).
- (MODIFY) `src/pages/Admin/AdminLogin.js`
  - Line ~21: the constant
    `const LOGO = "https://placehold.co/210x70/4f46e5/ffffff?text=LOGO";`
  - Used ~line 137 inside the "Logo/Header" `<Box>` (the login card `<img src={LOGO} ... />`).
- **OUT of scope — DO NOT TOUCH ANYTHING ELSE:**
  - No other lines in those two files beyond the logo constant + the immediate wrapper that holds the
    `<img>`.
  - `src/theme/adminTheme.js` (admin MUI theme) — unchanged.
  - Any other file under `src/pages/Admin/*` and `src/components/AdminLayout/*` — unchanged.
  - Admin navigation/menu items, drawer width, tables, dialogs, forms, charts — unchanged.
  - `apiService`, contexts, `db.json`, data contracts — unchanged.
  - The storefront — unchanged (this prompt is admin-only).

## Detailed Requirements
1. **Define the logo URL once per file.** In each of the two files, replace the existing `LOGO` constant
   value with the brand logo URL (keep the constant name `LOGO` and its position so the diff stays
   minimal):
   ```js
   const LOGO = "https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png";
   ```
   Do not rename the constant, move it, or add new imports unless strictly required (none are needed).
2. **AdminLayout sidebar logo — put it on green.** At the sidebar "Logo Section" `<Box>` (~line 327–340),
   wrap or restyle the logo so it renders on a deep-green panel:
   - Keep the existing outer `<Box sx={{ p: 2, display: "flex", alignItems: "center",
     justifyContent: "center" }}>` structure.
   - Give the logo a green backing. Preferred minimal approach: add a green-filled rounded wrapper around
     the `<img>` (so padding around the logo is also green and it reads as one chip), e.g.:
     ```jsx
     <Box
       sx={{
         backgroundColor: "#0B3B2E",
         borderRadius: 2,
         px: 1.5,
         py: 1,
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         width: "100%",
       }}
     >
       <img
         src={LOGO}
         alt={process.env.REACT_APP_NAME || "Meghali's Silk Admin"}
         style={{ height: 36, width: "auto", maxWidth: "100%", display: "block" }}
       />
     </Box>
     ```
   - The logo is a wordmark (wider than tall). Bump the rendered height from `32` to ~`36` so the
     wordmark is legible in the 260px-wide drawer, and add `maxWidth: "100%"` so it never overflows.
   - Update the `alt` text to a brand-accurate value (e.g. `"Meghali's Silk Admin"`); you MAY keep the
     `process.env.REACT_APP_NAME` fallback.
   - Keep the `<Divider />` immediately below the Logo Section and everything after it untouched.
3. **AdminLogin logo — put it on green.** At the login card "Logo/Header" `<Box>` (~line 125–141),
   render the logo on a deep-green panel:
   - Keep the surrounding `<Box sx={{ textAlign: "center", mb: 4 }}>` and the inner centering `<Box>`.
   - Add a green-filled rounded wrapper around the `<img>` so the logo sits on `#0B3B2E`, e.g.:
     ```jsx
     <Box
       sx={{
         backgroundColor: "#0B3B2E",
         borderRadius: 2,
         px: 2,
         py: 1.5,
         display: "inline-flex",
         alignItems: "center",
         justifyContent: "center",
         mx: "auto",
       }}
     >
       <img
         src={LOGO}
         alt={process.env.REACT_APP_NAME || "Meghali's Silk Admin"}
         style={{ height: 60, width: "auto", maxWidth: "100%", display: "block" }}
       />
     </Box>
     ```
   - Keep the rendered height near the existing `56` (use ~`60`) so the login logo stays a comfortable
     size; add `maxWidth: "100%"`.
   - Leave the "Admin Console" `<Typography>` heading and the "Sign in to manage your store" subtext
     exactly as they are.
4. **No additional admin theming.** Do not add a green background to the whole sidebar, the whole login
   card, or anything beyond the immediate logo wrapper. The green is for the **logo panel only**.
5. **Hardcoded green is acceptable HERE only.** Because the admin does not use `--sf-*` tokens, using the
   literal `#0B3B2E` inline (as above) is the intended approach for this prompt. Do NOT introduce
   storefront token imports into admin files.
6. **Keep imports clean.** Do not remove existing imports; do not add unused imports. No new dependencies.

## Data / API Notes
- This prompt touches **no** `apiService` methods and **no** `db.json` data.
- The `db.json → settings.store.logo` field stays as-is (currently `null`); this prompt hardcodes the
  admin `LOGO` constant rather than reading settings, matching the existing pattern.
- Admin authentication (`useAdmin().login`) and navigation are untouched — only the logo image source
  and its wrapper change. No contract, route, or data-shape change.

## Constraints (Do Not Break)
- **Admin is otherwise byte-for-byte unchanged.** Only the `LOGO` constant value and the immediate
  wrapper around each logo `<img>` may change in the two named files. No other admin file is modified.
- Do NOT edit `src/theme/adminTheme.js`, admin nav/menu config, tables, dialogs, forms, or charts.
- Do NOT modify the storefront, `src/theme/storefront-tokens.css`, `colors.js`, contexts, or `db.json`.
- Preserve admin login + navigation behavior exactly (the admin must still authenticate and route).
- Preserve the JSON Server ↔ Laravel swap contract; do not add `fetch`/`axios` anywhere.
- Keep the logo accessible: meaningful `alt` text; the `<img>` stays a real `<img>` (not a CSS bg) so
  screen readers/alt still work.
- The hardcoded `#0B3B2E` exception applies to admin ONLY; never hardcode hex in storefront components.

## Acceptance Criteria / Definition of Done
- [ ] Admin **sidebar** (in `AdminLayout`) shows the Meghali's Silk logo on a deep-green (`#0B3B2E`)
      panel, legible within the 260px drawer, not clipped.
- [ ] Admin **login** screen shows the Meghali's Silk logo on a deep-green (`#0B3B2E`) panel above the
      "Admin Console" heading.
- [ ] No `placehold.co` logo URLs remain in either file.
- [ ] The two files differ from their originals ONLY in the `LOGO` constant value and the immediate logo
      wrapper/`<img>` styling — `git diff` shows no other admin changes.
- [ ] `src/theme/adminTheme.js` and all other admin files are unchanged.
- [ ] Admin still logs in and navigates between admin pages with no regressions.
- [ ] No console errors; `npm run build` completes cleanly.

## Verification Steps
1. `npm install` (if needed), then `npm run dev` (starts CRA + JSON Server on :3001).
2. Navigate to `/admin` (or `/admin/login`) → confirm the login card shows the **brand logo on green**
   above "Admin Console".
3. Log in with the seeded admin account → confirm the **sidebar** shows the **brand logo on green**, not
   clipped, in both expanded and (if applicable) collapsed states.
4. Click through 2–3 admin pages (e.g. Dashboard → Products → Orders) → confirm navigation still works
   and nothing else in the admin changed.
5. Run `git diff src/components/AdminLayout/AdminLayout.js src/pages/Admin/AdminLogin.js` → confirm the
   ONLY changes are the logo URL and its wrapper/`<img>` styling.
6. Confirm `git status` shows no other modified files under `src/pages/Admin/`, `src/components/AdminLayout/`,
   or `src/theme/adminTheme.js`.
7. Run `npm run build` and confirm a clean build with no console errors.
