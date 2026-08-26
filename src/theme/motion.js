// =============================================================================
// MOTION  —  the storefront's one easing/duration language, in JavaScript
// =============================================================================
//
// CSS animates on the `--sf-*` motion tokens in `storefront-tokens.css`.
// framer-motion cannot read custom properties, so this file MIRRORS those
// tokens for every JS-driven animation on the storefront. The two halves are a
// pair: retune the curve or a duration here and in storefront-tokens.css
// together, never one alone.
//
//   --sf-ease           →  EASE
//   --sf-duration-fast  →  DURATION.fast   (leaving: exits, presses)
//   --sf-duration       →  DURATION.base   (the default: arrivals, collapses)
//   --sf-duration-slow  →  DURATION.slow   (panels, in-view reveals)
//
// THE VOCABULARY. Everything that moves on the storefront is one of five
// things, and each has exactly one treatment:
//
//   pageMotion    a route change — a quiet fade and a ~10px rise in, a faster
//                 fade out. Applied once, at the route level, so all sixteen
//                 storefront routes transition identically.
//   overlay()     a scrim or backdrop — opacity only.
//   panel()       a drawer, sheet or modal — travel in from its own edge,
//                 slower in than out.
//   reveal()      content arriving: grid cells, list rows, page sections.
//                 Fade + a short rise, optionally staggered.
//   collapse()    a height/height-auto swap, a tab panel, a microstate.
//
// Nothing springs, nothing bounces, nothing lifts, nothing loops. The curve is
// decelerating (ease-out quint), so every arrival covers most of its distance
// immediately and then settles — slow to the eye without ever feeling slow.
//
// REDUCED MOTION. Every factory here takes `reduce` (pass framer-motion's
// `useReducedMotion()`), and returns the same shape with zero duration and no
// travel — so a component honours the setting by threading one boolean rather
// than by branching its JSX.
// =============================================================================

/** --sf-ease, as the cubic-bézier control points framer-motion wants. */
export const EASE = [0.22, 1, 0.36, 1];

/** --sf-duration-fast / --sf-duration / --sf-duration-slow, in seconds. */
export const DURATION = {
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
};

/** A transition on the house curve. `tween()` alone is the default duration. */
export const tween = (duration = DURATION.base) => ({ duration, ease: EASE });

/** The no-op transition: an instant swap, for reduced motion. */
export const INSTANT = { duration: 0 };

/** `t(reduce, DURATION.slow)` — the same tween, or nothing at all. */
export const t = (reduce, duration = DURATION.base) =>
  reduce ? INSTANT : tween(duration);

// ---- Stagger ---------------------------------------------------------------
// A queue you notice is a queue that is too long. One frame-ish per item, and
// the whole run capped well under half a second no matter how many items land.

export const STAGGER_STEP = 0.04;
export const STAGGER_MAX = 0.3;

/** Delay for the i-th item of a staggered list, capped at STAGGER_MAX. */
export const staggerDelay = (i = 0) =>
  Math.min(Math.max(i, 0) * STAGGER_STEP, STAGGER_MAX);

// ---- Travel ----------------------------------------------------------------
// Three distances, and no others: a page rises less than a section, which
// rises less than nothing at all.

export const RISE = {
  page: 10, // the route transition
  reveal: 16, // sections, grid cells, list rows
  micro: 8, // tab panels, collapses, toasts, in-place swaps
};

// ---- Page transition -------------------------------------------------------

/**
 * The route transition, applied once in App.js to the keyed wrapper around
 * <Routes> — which is why it is a constant and not a factory: every storefront
 * route gets this exact treatment, and reduced motion is handled by the CSS
 * token layer plus the `reduce` variant below.
 */
export const pageMotion = {
  initial: { opacity: 0, y: RISE.page },
  animate: { opacity: 1, y: 0, transition: tween(DURATION.base) },
  exit: { opacity: 0, transition: tween(DURATION.fast) },
};

/** The same, with the movement taken out. */
export const pageMotionReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: INSTANT },
  exit: { opacity: 0, transition: INSTANT },
};

export const getPageMotion = (reduce) =>
  reduce ? pageMotionReduced : pageMotion;

// ---- Overlays and panels ---------------------------------------------------

/** A scrim / backdrop. Opacity only, in on the base tier, out on the fast one. */
export const overlay = (reduce) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: t(reduce, DURATION.base) },
  exit: { opacity: 0, transition: t(reduce, DURATION.fast) },
});

const PANEL_OFFSET = {
  left: { x: "-100%" },
  right: { x: "100%" },
  top: { y: "-100%" },
  bottom: { y: "100%" },
};

/**
 * A drawer, sheet or side panel arriving from `from` ("left" | "right" |
 * "top" | "bottom"). Slower in than out, which is what makes a panel feel
 * placed rather than thrown. Reduced motion trades the travel for a fade.
 *
 * Returned as { initial, animate, exit } with the transition on each variant,
 * so a caller can spread it whole or pick a part.
 */
export const panel = (reduce, from = "right") => {
  if (reduce) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: INSTANT },
      exit: { opacity: 0, transition: INSTANT },
    };
  }
  const off = PANEL_OFFSET[from] || PANEL_OFFSET.right;
  const axis = "x" in off ? "x" : "y";
  return {
    initial: off,
    animate: { [axis]: 0, transition: tween(DURATION.slow) },
    exit: { ...off, transition: tween(DURATION.base) },
  };
};

/**
 * A centred modal or a sheet that drops from the top of the viewport: a fade
 * plus a short travel, rather than a full-width slide. `rise` is the distance
 * it covers — negative to come down from above.
 */
export const sheet = (reduce, rise = RISE.reveal) => ({
  initial: { opacity: 0, y: reduce ? 0 : rise },
  animate: { opacity: 1, y: 0, transition: t(reduce, DURATION.slow) },
  exit: { opacity: 0, y: reduce ? 0 : rise * 0.6, transition: t(reduce, DURATION.base) },
});

// ---- Content ---------------------------------------------------------------

/**
 * Content arriving — a grid cell, a list row, a page section.
 *
 * `index` places it in the stagger queue; `inView` switches the trigger from
 * mount to scroll (`whileInView`, once). Under reduced motion this returns an
 * empty object, so the element renders at its finished state on the first
 * frame with no motion props attached at all.
 */
export const reveal = (reduce, { index = 0, inView = false, amount = 0.15 } = {}) => {
  if (reduce) return {};
  const to = { opacity: 1, y: 0 };
  const transition = { ...tween(DURATION.slow), delay: staggerDelay(index) };
  return inView
    ? {
        initial: { opacity: 0, y: RISE.reveal },
        whileInView: to,
        viewport: { once: true, amount },
        transition,
      }
    : {
        initial: { opacity: 0, y: RISE.reveal },
        animate: to,
        transition,
      };
};

/**
 * An in-place swap: a tab panel, a step, a toast, a row appearing inside a
 * list that is already on screen. Shorter travel than a reveal, and it leaves
 * faster than it arrives.
 */
export const collapse = (reduce, rise = RISE.micro) => ({
  initial: { opacity: 0, y: reduce ? 0 : rise },
  animate: { opacity: 1, y: 0, transition: t(reduce, DURATION.base) },
  exit: { opacity: 0, y: reduce ? 0 : -rise, transition: t(reduce, DURATION.fast) },
});

// A plain crossfade with no travel is `overlay()` — it is the same shape, and
// there is deliberately no second name for it here.
