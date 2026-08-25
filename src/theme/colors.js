// =====================================================================
// GLOBAL COLOR THEME — Edit this file to restyle the entire storefront
// =====================================================================
// All colors used by the front-end come from here. The admin panel builds
// its own palette in `adminTheme.js` and is NOT affected by this file.
//
// This is the MUI mirror of `storefront-tokens.css`. That file is the
// source of truth (and documents where every hex was sampled from —
// the Meghali's Silk logo artwork); keep the two in sync.
//
// The system is IVORY ground + INK type + GOLD seasoning. Note that
// `primary` is the ink, not a colour: in this editorial palette the CTA
// and the body copy are the same warm near-black, and gold accents.
// In dark mode that inverts — ivory becomes the fill, ink the label.
//
// HOW TO USE:
//   1. Change the hex values below.
//   2. Save the file — hot-reload picks up the changes instantly in dev.
//   3. Rebuild for production: `npm run build`.
// =====================================================================

// ---------------------
// LIGHT MODE PALETTE  (the default)
// ---------------------
export const LIGHT = {
  // Primary — warm near-black ink. Carries type and the primary CTA fill.
  primary: {
    main:  "#1D1A16",
    light: "#322C25",
    dark:  "#0F0D0A",
  },
  // Secondary accent — antique gold, sampled from the logo and deepened
  // until it is safe as text on ivory (5.12:1).
  secondary: {
    main:  "#8A6118",
    light: "#C8912A",
    dark:  "#6B4A12",
  },
  // Page and component backgrounds
  background: {
    default: "#FAF6EC", // warm ivory — the logo's own halo tone
    paper:   "#FFFFFF",
  },
  // Text colors
  text: {
    primary:   "#1D1A16",
    secondary: "#5C554A",
  },
  // Gradients. `primary` fills contained buttons, so it stays ink (an ivory
  // label needs a dark ground); the gold gradient is decorative and lives in
  // storefront-tokens.css as --sf-gradient-gold.
  gradient: {
    primary:        "linear-gradient(135deg, #1D1A16 0%, #322C25 100%)",
    primaryReverse: "linear-gradient(135deg, #322C25 0%, #1D1A16 100%)",
    // Hero background gradient — warm ink, matching --sf-gradient-heritage
    hero: "linear-gradient(135deg, #1D1A16 0%, #33261E 55%, #4A3F31 100%)",
  },
  // Body background applied on initial HTML load (before React mounts).
  // Must match the pre-mount script in public/index.html.
  bodyBackground: "linear-gradient(135deg, #FAF6EC 0%, #FFFFFF 100%)",
};

// ---------------------
// DARK MODE PALETTE  ("evening gallery")
// ---------------------
export const DARK = {
  // Primary stays a DARK band with ivory type in both modes — see the
  // INVARIANT note in storefront-tokens.css. The ivory-fill CTA for dark mode
  // is --sf-color-emerald, not primary.
  primary: {
    main:  "#2B241C",
    light: "#3A3128",
    dark:  "#1E1913",
  },
  secondary: {
    main:  "#E3B95E",
    light: "#F3DDA4",
    dark:  "#C99B3D",
  },
  background: {
    default: "#14120F", // deep warm charcoal
    paper:   "#1B1815",
  },
  text: {
    primary:   "#F4EFE6",
    secondary: "#C4BCAE",
  },
  gradient: {
    primary:        "linear-gradient(135deg, #2B241C 0%, #3A3128 100%)",
    primaryReverse: "linear-gradient(135deg, #3A3128 0%, #2B241C 100%)",
    hero: "linear-gradient(135deg, #14120F 0%, #241C15 55%, #3A2F24 100%)",
  },
  bodyBackground: "linear-gradient(135deg, #14120F 0%, #1B1815 100%)",
};
