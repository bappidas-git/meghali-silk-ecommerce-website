<!-- Batch E — Content & Policy Pages -->
# Prompt 25 — Contact Us Page

## Objective
Rebuild the Contact experience for **Meghali's Silk** — a dark, gold-on-green "Let's Start a
Conversation" page with a brand-attested stats row, three contact cards (Call / Email / WhatsApp), a real
**"Send us a Message" lead form**, and a right rail (Visit Our Showroom + Follow Our Journey + Why Choose
Us) — matching `UI Designs/CONTACT US PAGE.png`. The form must keep posting a real lead via
`apiService.leads.createContact`. This prompt also sets the brand contact values in
`src/utils/constants.js` so the page (and the rest of the site) show real Kolkata details.

## Brand & Design Context
*Meghali's Silk* ("Galleria Producer Company Limited") is a Kolkata-rooted heritage handloom silk house.
The look is **dark-first, luxurious, gold-on-green** with elegant serif headings and emerald CTAs.

**Page mapping (confirm first):** The brief maps the **CONTACT US** design to route **`/support`**,
rendered by `src/pages/Support/Support.js`. Open that file first and confirm it renders the contact UI.
It currently DOES: it holds a contact form with `name/email/phone/orderNumber/category/subject/message`
state and submits via `apiService.leads.createContact(formData)` with a success screen. So this is the
**contact page** for the storefront — theme the contact experience here. (There is a separate `/help`
Help Center page for FAQ/ticket-style help; that is NOT in this prompt.) State this mapping in a short
comment at the top of `Support.js`: this is the storefront Contact Us page on route `/support`.

Match `UI Designs/CONTACT US PAGE.png`. Top to bottom: the global orange announcement bar context (already
rendered by global chrome — do NOT rebuild it here), a small **"We're here to Help"** pill, a large
serif heading **"Let's Start a Conversation"** with the word **"Conversation"** in gold `--sf-font-display`,
a subtitle, a **stats row** of 4 figures, three **contact cards** (Call Us / Email Us / WhatsApp), a
two-column body: left = **"Send us a Message"** form card with an **"Online"** badge and a gold **Send
Message** button; right column = **"Visit Our Showroom"** card (address + emerald **Get Directions**
button), **"Follow Our Journey"** socials, and a **"Why Choose Us"** list.

Use ONLY these tokens (defined in `src/theme/storefront-tokens.css`; never hardcode hex):
- Surfaces/text: `--sf-color-bg`, `--sf-color-surface`, `--sf-color-surface-2`, `--sf-color-text`,
  `--sf-color-text-secondary`, `--sf-color-text-muted`, `--sf-color-border`, `--sf-color-border-strong`.
- Gold: `--sf-color-gold`, `--sf-color-gold-light`, `--sf-color-gold-deep`, `--sf-gradient-gold` (the
  "Conversation" word, the **Send Message** button, the showroom emblem).
- Brand green panels: `--sf-color-brand-green` (= `--brand-logo-bg`), `--sf-color-brand-green-deep`.
- Contact-card accent icons (match the design): Call Us → emerald `--sf-color-emerald`; Email Us → pink
  `--sf-cat-pink`; WhatsApp → emerald `--sf-color-emerald` (or `--sf-cat-teal`).
- CTAs: `--sf-color-emerald`, `--sf-color-emerald-hover`, `--sf-color-emerald-contrast` (Get Directions,
  the success-state button); gold gradient for **Send Message**.
- Semantic: `--sf-color-success`/`-bg` for the "Online" badge and success state; `--sf-color-danger`/`-bg`
  for field errors.
- Type: `--sf-font-display` for the heading and the "Conversation" word; `--sf-font-family` for body/form.
  Radii `--sf-radius-*`, spacing `--sf-space-*`, shadows `--sf-shadow-*`, motion `--sf-transition*`.

## Scope — Files to Create / Modify
- (MODIFY) `src/pages/Support/Support.js` — restyle/restructure to the contact layout below. **Preserve**
  the existing form state, validation, and the `apiService.leads.createContact(formData)` submit + success
  flow (you may refine field set and copy, but keep a real POST and keep the success state).
- (MODIFY) `src/pages/Support/Support.module.css` — rewrite to the dark gold-on-green design; tokens only.
- (MODIFY) `src/utils/constants.js` — set the brand contact values (see Data / API Notes): `SUPPORT_EMAIL`,
  `SUPPORT_PHONE`, `SUPPORT_ADDRESS`, `SUPPORT_HOURS`, `SOCIAL_LINKS` (incl. `WHATSAPP`), and `WHY_CHOOSE_US`
  copy/icons. Change ONLY values (keep the exported names + shapes).
- **OUT of scope:** `db.json`, `apiService` (use the existing methods; do not change their signatures or add
  calls outside `apiService`), other pages/components, the admin panel, the global announcement bar/chrome,
  and the shared brand tokens themselves.

## Detailed Requirements
Render the page inside the existing container (it already toggles a `dark` class via `useTheme()` — keep
that). Keep a simple breadcrumb/back affordance if one exists.

1. **Intro block.** A centered **"We're here to Help"** pill (gold-tinted hairline + small icon, e.g.
   `mdi:headset`), then `<h1>` **"Let's Start a Conversation"** in `--sf-font-display` with **"Conversation"**
   wrapped in a `<span>` colored gold (`--sf-color-gold` or `--sf-gradient-gold` text clip). Subtitle:
   "Whether you're looking for the perfect silk saree or need expert guidance, our team is ready to assist
   you." Subtle Framer Motion fade/slide-in.
2. **Stats row.** Four brand-attested figures in a row (wrap on mobile), each a small icon + big serif
   number + label: **4.9 Rating**, **10K+ Customers**, **500+ Designs**, **15+ Years**. These are static
   brand claims — do NOT compute them from live API data and do NOT present them as real-time counters.
3. **Contact cards (3).** A responsive grid (1 col mobile → 3): each card = colored circular icon, title,
   primary value (a real `tel:`/`mailto:`/WhatsApp link), and a one-line caption.
   - **Call Us** — emerald icon (`mdi:phone`), value `SUPPORT_PHONE` as `tel:` link, caption "Speak directly
     with our silk experts".
   - **Email Us** — pink icon (`mdi:email-outline`), value `SUPPORT_EMAIL` as `mailto:` link, caption
     "Detailed answers to your queries".
   - **WhatsApp** — emerald icon (`mdi:whatsapp`), links to `SOCIAL_LINKS.WHATSAPP` (open in a new tab,
     `rel="noopener noreferrer"`), caption "Quick chat support available". If `SOCIAL_LINKS.WHATSAPP` is
     empty, render the card without a dead link (show the caption only) — honest empty state.
4. **Two-column body** (stacks to single column under ~900px; form first on mobile).
   **Left — "Send us a Message" form card:**
   - Header row: `<h2>` "Send us a Message" + an **"Online"** badge (small dot + label using
     `--sf-color-success`). Subtitle "We'll get back to you within 24 hours."
   - Fields (match the design, keep them wired into the existing `formData`): **Full Name** (`name`),
     **Email Address** (`email`), **Phone Number** (`phone`), **Subject** (`subject`), **Your Message**
     (`message`, textarea). You MAY keep the existing `category`/`orderNumber` fields (the lead shape
     supports them) but the design's visible set is the five above — keep any extra field optional and
     non-blocking, or drop it from the UI while leaving the state key intact so the POST shape stays valid.
   - Validation: keep the existing client-side validation (required name/email/subject/message, email
     format via `isEmailValid`, optional phone via `isValidPhone`). Show inline errors using
     `--sf-color-danger`.
   - Submit: a full-width **Send Message** button styled with `--sf-gradient-gold` (gold, dark text),
     disabled + "Sending…" while submitting. On submit call the existing
     `apiService.leads.createContact(formData)`; on success show the existing success state ("Message
     Sent! We'll respond within 24 hours." + a "Send Another" button); on failure show an inline error.
     Keep the lead POST shape unchanged (see Data / API Notes).
   - Pre-fill `email` from `useAuth()` when logged in (keep the existing effect).
   **Right column (rail):**
   - **Visit Our Showroom** card: a small gold emblem/icon header, the Kolkata `SUPPORT_ADDRESS`, the
     `SUPPORT_HOURS`, and an emerald **"Get Directions"** button/link that opens a Google Maps URL for the
     address in a new tab (build it as `https://www.google.com/maps/search/?api=1&query=` +
     `encodeURIComponent(SUPPORT_ADDRESS)`, `rel="noopener noreferrer"`). Optionally a deep-green
     gradient header strip.
   - **Follow Our Journey** socials: render an icon link for each non-empty entry in `SOCIAL_LINKS`
     (Instagram, Facebook, Twitter, YouTube, WhatsApp) — skip empties so there are no dead links; open in
     a new tab with `rel="noopener noreferrer"` and an `aria-label`.
   - **Why Choose Us** list: render the four items from `WHY_CHOOSE_US` (icon + title) as a compact list:
     **Premium Quality Silk**, **100% Authentic**, **Free Shipping ₹999+**, **Expert Support** (set this
     copy in `constants.js` per Data / API Notes; use the `icon` field for each).
5. **Responsiveness & motion.** Mobile-first. Cards/columns stack under ~900px; the stats row wraps to 2×2
   on small screens. Subtle Framer Motion reveals; respect the existing `prefers-reduced-motion` token
   block.
6. **Accessibility.** Single `<h1>`, then `<h2>`s; every input has an associated `<label>` (`htmlFor`/`id`);
   error text linked via `aria-describedby`; buttons/links ≥44px tall with visible `focus-visible` rings
   (`--sf-shadow-focus`); icons are decorative (`aria-hidden`) where a text label is present, and links
   that are icon-only have `aria-label`.

## Data / API Notes
- **Lead submit (unchanged contract):** keep using `apiService.leads.createContact(leadData)`. In mock
  mode it POSTs to `/leads` adding `type:"contact"`, `status:"new"`, timestamps, and `notes:""`. The
  `leadData` you pass must stay shape-compatible with the seeded `leads` rows, i.e. keep keys
  `{ name, email, phone, orderNumber, category, subject, message }` (extra UI-hidden keys may be sent as
  empty strings, but do not rename keys). Do NOT add `fetch`/`axios` outside `apiService`.
- **Constants to set in `src/utils/constants.js`** (values only — keep names/shapes; these are the single
  source the Header/Footer/Help Center also read):
  - `SUPPORT_EMAIL = "care@meghalissilk.com"` (or a brand-appropriate address).
  - `SUPPORT_PHONE = "+91 98300 00000"` (brand Kolkata number; keep the existing format style).
  - `SUPPORT_ADDRESS = "Galleria Producer Company Limited, <street>, Kolkata, West Bengal 700001"`
    (a plausible Kolkata address; keep it one readable string).
  - `SUPPORT_HOURS = "Mon – Sat: 10:00 AM – 7:00 PM IST"`.
  - `SOCIAL_LINKS` — set `INSTAGRAM`, `FACEBOOK`, `TWITTER`, `YOUTUBE` to brand handles
    (e.g. `https://instagram.com/meghalissilk`) and **set `WHATSAPP`** to a real `https://wa.me/<number>`
    link (e.g. `https://wa.me/919830000000`). Leave any channel you don't want as `""` (empty hides it).
  - `WHY_CHOOSE_US` — update the four items to: **Premium Quality Silk** (`mdi:diamond-stone`), **100%
    Authentic** (`mdi:check-decagram`), **Free Shipping ₹999+** (`mdi:truck-fast`), **Expert Support**
    (`mdi:headset`). Keep the array shape `{ id, title, description, icon }`.
  - Note: these same constants are also adjusted by the brand-data prompt (catalog supporting data /
    prompt 06) and `db.json → settings.store`/`settings.social`. Keep this page reading from
    `constants.js` (and it's fine if both sources carry consistent values); do not introduce contradictory
    contact details.
- The store's free-shipping fact is **₹999** (`FREE_SHIPPING_THRESHOLD = 999`); keep the "Free Shipping
  ₹999+" copy consistent with it.

## Constraints (Do Not Break)
- Keep the contact form fully functional: it must still POST a real lead via
  `apiService.leads.createContact` and show success/error states. Preserve the JSON Server ↔ Laravel swap
  contract and the lead JSON shape (no renamed keys; no calls outside `apiService`).
- Re-skin ONLY via tokens in `src/theme/storefront-tokens.css`; **no hardcoded hex** in `Support.js`/
  `Support.module.css`. Use the named tokens above.
- `src/utils/constants.js`: change exported **values only** — do not rename or remove `SUPPORT_*`,
  `SOCIAL_LINKS`, or `WHY_CHOOSE_US`, and keep their shapes (the Footer/Header/Help Center import them).
- Do NOT touch `db.json` or the admin panel; do NOT rebuild the global announcement bar/header/footer.
- Accessibility: labelled inputs, `aria-describedby` errors, ≥44px targets, visible `focus-visible`,
  icon-only links have `aria-label`. External links use `target="_blank"` + `rel="noopener noreferrer"`.
- Responsive/mobile-first; honest empty states (hide WhatsApp/social entries that are blank). No fake
  live metrics — the stats row is brand-attested static copy.

## Acceptance Criteria / Definition of Done
- [ ] `/support` visually matches `UI Designs/CONTACT US PAGE.png`: "We're here to Help" pill, "Let's
      Start a Conversation" heading with a gold "Conversation", subtitle, 4-figure stats row, three
      contact cards (Call/Email/WhatsApp), the "Send us a Message" form card with an "Online" badge and a
      gold Send Message button, and the right rail (Visit Our Showroom + Get Directions, Follow Our
      Journey socials, Why Choose Us list).
- [ ] Submitting the form creates a lead (visible as a new `type:"contact"` row in `db.json`'s `leads`
      via JSON Server) and shows the success state; validation errors render inline.
- [ ] Contact details (phone/email/address/hours/socials/WhatsApp) come from `constants.js` and show real
      brand values; **Get Directions** opens a Google Maps URL for the Kolkata address; social links open
      the right handles in a new tab; blank channels are hidden (no dead links).
- [ ] All colors come from `--sf-*` tokens (no `#` hex in `Support.module.css`); the page maps to the
      contact UI and a top comment notes "Contact Us page on `/support`".
- [ ] Stats row is static brand-attested copy (not live counters); dark + light modes both coherent; no
      console errors; `npm run build` clean.

## Verification Steps
1. `npm run dev` (CRA + JSON Server) and navigate to `/support`.
2. Compare against `UI Designs/CONTACT US PAGE.png` section-by-section.
3. Fill the form with valid data and submit → success state appears; open
   `http://localhost:3001/leads` (JSON Server) and confirm a new `type:"contact"` lead with your
   `name/email/subject/message`. Click **Send Another** → form resets.
4. Submit with an invalid email / empty required fields → inline validation errors show; no network call
   fires until valid.
5. Click **Call Us** (`tel:`), **Email Us** (`mailto:`), **WhatsApp**, each **Follow Our Journey** icon,
   and **Get Directions** → correct targets; external links open in a new tab.
6. Temporarily blank `SOCIAL_LINKS.WHATSAPP` in `constants.js` → the WhatsApp card/social icon hides
   cleanly (no dead link); restore it.
7. Toggle theme and resize to ~375px → dark/light coherent, columns stack, stats wrap, targets ≥44px,
   focus rings visible. Confirm no console errors, then run `npm run build`.
