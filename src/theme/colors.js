// =====================================================================
// GLOBAL COLOR THEME — Edit this file to restyle the entire storefront
// =====================================================================
// All colors used by the front-end come from here. The admin panel uses
// its own hardcoded palette and is NOT affected by changes to this file.
//
// HOW TO USE:
//   1. Change the hex values below.
//   2. Save the file — hot-reload picks up the changes instantly in dev.
//   3. Rebuild for production: `npm run build`.
// =====================================================================

// ---------------------
// LIGHT MODE PALETTE
// ---------------------
export const LIGHT = {
  // Primary brand color — Meghali's Silk deep bottle-green
  primary: {
    main:  "#0B3B2E",
    light: "#13573F",
    dark:  "#0A2E24",
  },
  // Secondary accent color — gold/champagne (readable on white)
  secondary: {
    main:  "#B6863C",
    light: "#CBA35A",
    dark:  "#9A7728",
  },
  // Page and component backgrounds
  background: {
    default: "#FBF8F2",
    paper:   "#FFFFFF",
  },
  // Text colors
  text: {
    primary:   "#10221C",
    secondary: "#4A5550",
  },
  // Gradient used for contained buttons, hero section, etc. (gold gradient)
  gradient: {
    primary:        "linear-gradient(135deg, #E6C27A 0%, #CBA35A 50%, #B6863C 100%)",
    primaryReverse: "linear-gradient(135deg, #B6863C 0%, #CBA35A 50%, #9A7728 100%)",
    // Hero background gradient — deep brand green
    hero: "linear-gradient(135deg, #0B3B2E 0%, #0A2E24 50%, #13573F 100%)",
  },
  // Body background applied on initial HTML load (before React mounts)
  bodyBackground: "linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 100%)",
};

// ---------------------
// DARK MODE PALETTE
// ---------------------
export const DARK = {
  primary: {
    main:  "#0B3B2E",
    light: "#1C6E50",
    dark:  "#0A2E24",
  },
  secondary: {
    main:  "#CBA35A",
    light: "#E6C27A",
    dark:  "#B6863C",
  },
  background: {
    default: "#0B0C0B",
    paper:   "#15171A",
  },
  text: {
    primary:   "#F3EFE6",
    secondary: "#C3C9C4",
  },
  gradient: {
    primary:        "linear-gradient(135deg, #E6C27A 0%, #CBA35A 50%, #B6863C 100%)",
    primaryReverse: "linear-gradient(135deg, #B6863C 0%, #CBA35A 50%, #9A7728 100%)",
    hero: "linear-gradient(135deg, #0B3B2E 0%, #0A2E24 50%, #101312 100%)",
  },
  bodyBackground: "linear-gradient(135deg, #0B0C0B 0%, #15171A 100%)",
};
