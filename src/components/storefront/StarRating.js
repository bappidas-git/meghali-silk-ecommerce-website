import React from "react";
import styles from "./StarRating.module.css";

// =============================================================================
// StarRating — shared, accessible star display
// =============================================================================
// Domain-agnostic presentation atom used by ProductCard, SocialProof, the
// reviews list, etc. Renders full / half / empty stars from a numeric rating.
// Purely presentational: it shows whatever real rating it is given and never
// invents one. Colour comes from the --sf-color-star token.
//
// EDITORIAL MARK
//   The stars are inline SVG rather than the "★" glyph. A glyph inherits the
//   font's own side-bearings and baseline, so a row of them sits optically low
//   and spaces unevenly at small sizes — exactly where the card uses them. The
//   SVG mark is drawn on a 24×24 box with the point centred, so every size from
//   12px (card) to 22px (reviews header) aligns on the same optical centre.
//   Half stars still come from a 50%-width clipped overlay — no extra assets,
//   no per-instance clipPath ids.
//
// Props (stable contract — consumed by 4+ surfaces):
//   rating  number  0–5 (clamped)
//   size    number  px size of each star (default 18)
//   label   string  optional aria-label override
// =============================================================================

// Five-point star on a 24×24 box, centred so the optical mass sits on the
// middle of the line box at any size.
const STAR_PATH =
  "M12 2.6l2.76 5.94 6.24.79-4.6 4.4 1.19 6.27L12 16.9l-5.59 3.1 1.19-6.27-4.6-4.4 6.24-.79z";

const Star = ({ fill, size }) => (
  <span className={styles.star} style={{ width: size, height: size }}>
    <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
    {fill !== "empty" && (
      <span className={fill === "half" ? styles.clipHalf : styles.clipFull}>
        {/* Sized inline, not by its shell: a half star has to be a CROPPED full
            mark, never a mark squeezed into half the width. */}
        <svg
          className={styles.markOn}
          style={{ width: size, height: size }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      </span>
    )}
  </span>
);

const StarRating = ({ rating = 0, size = 18, label }) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = i <= Math.floor(value) ? "full" : i - value < 1 ? "half" : "empty";
    stars.push(<Star key={i} fill={fill} size={size} />);
  }
  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={label || `Rated ${value.toFixed(1)} out of 5`}
    >
      {stars}
    </span>
  );
};

export default StarRating;
