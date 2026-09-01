// =============================================================================
// Hero section configuration — shared shape, defaults & normalizers
// =============================================================================
//
// The storefront hero is fully admin-managed. Two records drive it:
//
//   • `heroConfig` — a singleton (json-server object in mock mode,
//     `GET/PUT /hero/config` on Laravel) holding everything that belongs to the
//     SECTION rather than to one slide: the master toggle, autoplay + default
//     timer, the transition, which chrome is shown (counter / hairlines /
//     progress / arrows), the scrim strength, the stage height per device, the
//     shared secondary CTA and the collection-openers row.
//
//   • `banners`    — one row per SLIDE, carrying its own copy, background
//     (gradient, image or video), text alignment, scrim override, timer
//     override, active flag and sort order.
//
// Nothing about the hero is hardcoded in the component any more: it reads these
// two records and renders them. `HERO_FALLBACK_SLIDES` exists only so the
// storefront still opens on something branded if the API is unreachable.
//
// BACKWARD COMPATIBILITY
//   Older banner rows carry only { title, subtitle, cta, link, gradient, image }
//   and no `backgroundType`/`sortOrder`/`isActive`. normalizeHeroSlide() infers
//   the type from whatever media is present, defaults the row to active, and
//   falls back to the array index for order — so a pre-existing db.json renders
//   exactly as it did before anyone opens the admin screen.
// =============================================================================

import { APP_NAME } from "./constants";

// ─── Vocabularies (shared by the admin selects and the renderer) ─────────────

export const HERO_BACKGROUND_TYPES = [
  { value: "gradient", label: "Gradient", icon: "mdi:gradient-horizontal" },
  { value: "image", label: "Image", icon: "mdi:image-outline" },
  { value: "video", label: "Video", icon: "mdi:video-outline" },
];

export const HERO_TRANSITIONS = [
  { value: "fade", label: "Crossfade", hint: "Slides dissolve into each other" },
  { value: "slide", label: "Slide", hint: "Slides travel in from the side" },
  { value: "none", label: "None", hint: "Instant swap, no motion" },
];

export const HERO_TEXT_ALIGNMENTS = [
  { value: "left", label: "Left", icon: "mdi:format-align-left" },
  { value: "center", label: "Centre", icon: "mdi:format-align-center" },
  { value: "right", label: "Right", icon: "mdi:format-align-right" },
];

// object-position values for a cover-cropped background image. The default
// pushes the art right, away from the (left-aligned) copy column.
export const HERO_IMAGE_POSITIONS = [
  { value: "right center", label: "Right" },
  { value: "center center", label: "Centre" },
  { value: "left center", label: "Left" },
  { value: "center top", label: "Top" },
  { value: "center bottom", label: "Bottom" },
];

// The three breakpoints the stylesheet actually switches on, so the admin's
// device columns and the CSS media queries can never drift apart.
export const HERO_DEVICES = [
  { key: "desktop", label: "Desktop", icon: "mdi:monitor", hint: "1025px and wider" },
  { key: "tablet", label: "Tablet", icon: "mdi:tablet", hint: "769px to 1024px" },
  { key: "mobile", label: "Mobile", icon: "mdi:cellphone", hint: "768px and below" },
];

// ─── Defaults ────────────────────────────────────────────────────────────────

// These reproduce the stage heights the stylesheet used to hardcode:
//   clamp(520px, 78vh, 780px) / clamp(480px, 70vh, 640px) / clamp(460px, 66vh, 600px)
export const DEFAULT_HERO_HEIGHTS = {
  desktop: { min: 520, vh: 78, max: 780 },
  tablet: { min: 480, vh: 70, max: 640 },
  mobile: { min: 460, vh: 66, max: 600 },
};

export const DEFAULT_HERO_SECONDARY_CTA = {
  enabled: true,
  label: "Our Story",
  link: "/about",
};

export const DEFAULT_HERO_OPENERS = {
  enabled: true,
  label: "Collections",
  limit: 8,
};

export const DEFAULT_HERO_CONFIG = {
  enabled: true,
  autoplay: true,
  intervalMs: 5000,
  transition: "fade",
  pauseOnHover: true,
  showControls: true,
  showCounter: true,
  showProgress: true,
  showArrows: false,
  // Scrim strength as a percentage of the stylesheet's designed gradient.
  // 100 = as designed, 0 = no scrim at all (bare media).
  overlayOpacity: 100,
  heights: DEFAULT_HERO_HEIGHTS,
  secondaryCta: DEFAULT_HERO_SECONDARY_CTA,
  openers: DEFAULT_HERO_OPENERS,
};

export const DEFAULT_HERO_SLIDE = {
  title: "",
  subtitle: "",
  // Blank = derive from the category the slide links to (falling back to the
  // store name), which is what the hero did before the eyebrow was editable.
  eyebrow: "",
  cta: "Shop the Collection",
  link: "/products",
  // Blank = inherit the section-wide secondary CTA.
  secondaryCtaLabel: "",
  secondaryCtaLink: "",
  backgroundType: "gradient",
  gradient: "var(--sf-gradient-heritage)",
  image: "",
  imagePosition: "right center",
  videoUrl: "",
  videoPoster: "",
  // null = inherit heroConfig.overlayOpacity.
  overlayOpacity: null,
  textAlign: "left",
  // 0 = inherit heroConfig.intervalMs.
  durationMs: 0,
  isActive: true,
  sortOrder: 0,
};

// Timer guard rails — shared by the admin inputs and the runtime, so a hand-
// edited db.json can never leave the carousel spinning at 50ms.
export const HERO_MIN_DURATION_MS = 1000;
export const HERO_MAX_DURATION_MS = 60000;

// On-brand recoloured placeholder — the same generator and ink/gold palette the
// catalogue seed uses, so the storefront ships no third-party photography.
export const HERO_FALLBACK_IMAGE =
  "https://placehold.co/1600x900/1D1A16/8A6118?text=Handwoven+in+Assam";

// Shown only when the banners API is unreachable, so the storefront never opens
// on an empty stage. Real slides come from the admin-managed `banners` store.
export const HERO_FALLBACK_SLIDES = [
  {
    id: "fallback-1",
    title: "Handwoven Assamese Silk",
    subtitle:
      "Muga, Pat and Eri from the looms of Sualkuchi — woven a metre a day.",
    cta: "Shop the Collection",
    link: "/products",
    backgroundType: "image",
    gradient: "var(--sf-gradient-heritage)",
    image: HERO_FALLBACK_IMAGE,
  },
];

// Eyebrow shown when a slide has no explicit one and points somewhere that
// isn't a category (e.g. the offers page).
export const DEFAULT_HERO_EYEBROW = APP_NAME;

// ─── Coercion helpers ────────────────────────────────────────────────────────

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const clampInt = (value, min, max, fallback) => {
  const n = toInt(value, NaN);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const toText = (value, fallback = "") =>
  typeof value === "string" ? value : value == null ? fallback : String(value);

const oneOf = (value, allowed, fallback) =>
  allowed.some((o) => o.value === value) ? value : fallback;

// ─── heroConfig ──────────────────────────────────────────────────────────────

export const normalizeHeroHeights = (raw) => {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  HERO_DEVICES.forEach(({ key }) => {
    const d = src[key] && typeof src[key] === "object" ? src[key] : {};
    const fallback = DEFAULT_HERO_HEIGHTS[key];
    const min = clampInt(d.min, 200, 1200, fallback.min);
    const max = clampInt(d.max, 200, 1600, fallback.max);
    out[key] = {
      min,
      vh: clampInt(d.vh, 20, 100, fallback.vh),
      // A max below the min would collapse clamp() onto the max — keep them sane.
      max: Math.max(min, max),
    };
  });
  return out;
};

// Fill in any missing fields so the storefront and admin always work against a
// complete shape, even on an older db.json or a partial API response.
export const normalizeHeroConfig = (raw) => {
  const cfg = raw && typeof raw === "object" ? raw : {};
  const cta =
    cfg.secondaryCta && typeof cfg.secondaryCta === "object" ? cfg.secondaryCta : {};
  const openers = cfg.openers && typeof cfg.openers === "object" ? cfg.openers : {};
  return {
    // Every toggle defaults to ON unless explicitly false, so a config written
    // by an older build never silently hides part of the hero.
    enabled: cfg.enabled !== false,
    autoplay: cfg.autoplay !== false,
    intervalMs: clampInt(
      cfg.intervalMs,
      HERO_MIN_DURATION_MS,
      HERO_MAX_DURATION_MS,
      DEFAULT_HERO_CONFIG.intervalMs
    ),
    transition: oneOf(cfg.transition, HERO_TRANSITIONS, DEFAULT_HERO_CONFIG.transition),
    pauseOnHover: cfg.pauseOnHover !== false,
    showControls: cfg.showControls !== false,
    showCounter: cfg.showCounter !== false,
    showProgress: cfg.showProgress !== false,
    // The arrows are the one piece of chrome that is off by default — the
    // hairline controls carried the whole affordance before this screen existed.
    showArrows: cfg.showArrows === true,
    overlayOpacity: clampInt(cfg.overlayOpacity, 0, 100, DEFAULT_HERO_CONFIG.overlayOpacity),
    heights: normalizeHeroHeights(cfg.heights),
    secondaryCta: {
      enabled: cta.enabled !== false,
      label:
        toText(cta.label, DEFAULT_HERO_SECONDARY_CTA.label) ||
        DEFAULT_HERO_SECONDARY_CTA.label,
      link:
        toText(cta.link, DEFAULT_HERO_SECONDARY_CTA.link) ||
        DEFAULT_HERO_SECONDARY_CTA.link,
    },
    openers: {
      enabled: openers.enabled !== false,
      label: toText(openers.label, DEFAULT_HERO_OPENERS.label),
      limit: clampInt(openers.limit, 1, 20, DEFAULT_HERO_OPENERS.limit),
    },
  };
};

// ─── Slides ──────────────────────────────────────────────────────────────────

// What media does this row actually carry? Used to type legacy rows that
// predate the `backgroundType` field.
const inferBackgroundType = (raw) => {
  if (raw.videoUrl) return "video";
  if (raw.image || raw.imageUrl) return "image";
  return "gradient";
};

export const normalizeHeroSlide = (raw, index = 0) => {
  const slide = raw && typeof raw === "object" ? raw : {};
  // `imageUrl` is the legacy field name; both have always been read.
  const image = toText(slide.image || slide.imageUrl, "");
  const backgroundType = oneOf(
    slide.backgroundType,
    HERO_BACKGROUND_TYPES,
    inferBackgroundType(slide)
  );
  const rawOverlay = slide.overlayOpacity;
  return {
    ...DEFAULT_HERO_SLIDE,
    ...slide,
    id: slide.id ?? `slide-${index}`,
    title: toText(slide.title, ""),
    subtitle: toText(slide.subtitle, ""),
    eyebrow: toText(slide.eyebrow, ""),
    cta: toText(slide.cta, ""),
    link: toText(slide.link, "") || DEFAULT_HERO_SLIDE.link,
    secondaryCtaLabel: toText(slide.secondaryCtaLabel, ""),
    secondaryCtaLink: toText(slide.secondaryCtaLink, ""),
    backgroundType,
    gradient: toText(slide.gradient, "") || DEFAULT_HERO_SLIDE.gradient,
    image,
    imagePosition: oneOf(
      slide.imagePosition,
      HERO_IMAGE_POSITIONS,
      DEFAULT_HERO_SLIDE.imagePosition
    ),
    videoUrl: toText(slide.videoUrl, ""),
    videoPoster: toText(slide.videoPoster, ""),
    overlayOpacity:
      rawOverlay === null || rawOverlay === undefined || rawOverlay === ""
        ? null
        : clampInt(rawOverlay, 0, 100, null),
    textAlign: oneOf(slide.textAlign, HERO_TEXT_ALIGNMENTS, DEFAULT_HERO_SLIDE.textAlign),
    // 0 means "inherit the section default" — anything else is clamped so one
    // bad row can neither stall nor strobe the carousel.
    durationMs: slide.durationMs
      ? clampInt(slide.durationMs, HERO_MIN_DURATION_MS, HERO_MAX_DURATION_MS, 0)
      : 0,
    isActive: slide.isActive !== false,
    sortOrder: toInt(slide.sortOrder, index),
  };
};

// Normalize, optionally drop the inactive rows, and put them in the admin's
// order. Both the storefront and the admin preview go through here, so what an
// admin sees in the preview is exactly what shoppers get.
export const normalizeHeroSlides = (list, { activeOnly = false } = {}) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((row, i) => normalizeHeroSlide(row, i))
    .filter((s) => (activeOnly ? s.isActive : true))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

// How long this slide stays up: its own override, else the section default.
export const heroSlideDuration = (slide, config) =>
  clampInt(
    slide?.durationMs || config?.intervalMs,
    HERO_MIN_DURATION_MS,
    HERO_MAX_DURATION_MS,
    DEFAULT_HERO_CONFIG.intervalMs
  );

// The scrim strength in play for a slide: its own override, else the section's.
export const heroSlideOverlay = (slide, config) => {
  const own = slide?.overlayOpacity;
  const value = own === null || own === undefined ? config?.overlayOpacity : own;
  return clampInt(value, 0, 100, DEFAULT_HERO_CONFIG.overlayOpacity);
};

// The section's CSS custom properties, handed to the hero as an inline style.
// The stylesheet declares the same names with the designed defaults, so the
// hero still renders correctly if this ever returns nothing.
export const heroStageVars = (config) => {
  const h = normalizeHeroHeights(config?.heights);
  const vars = {};
  HERO_DEVICES.forEach(({ key }) => {
    // "desktop" owns the unsuffixed names (they are the base rule).
    const suffix = key === "desktop" ? "" : `-${key}`;
    vars[`--sf-hero-h-min${suffix}`] = `${h[key].min}px`;
    vars[`--sf-hero-h-vh${suffix}`] = `${h[key].vh}vh`;
    vars[`--sf-hero-h-max${suffix}`] = `${h[key].max}px`;
  });
  return vars;
};
