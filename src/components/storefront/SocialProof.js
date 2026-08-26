import React from "react";
import StarRating from "./StarRating";
import styles from "./SocialProof.module.css";

// =============================================================================
// SocialProof — ratings/reviews summary, REAL DATA ONLY
// =============================================================================
// Ethics guardrail (see STOREFRONT_UX_GUIDELINES.md):
//   This component is deliberately built so it CANNOT display a fabricated
//   signal. It accepts only numbers — an aggregate `rating` and a `count` of
//   real ratings — never free-typed claims like "Bestseller!" or "10k sold".
//   When `count` is 0 it renders an honest empty state ("No ratings yet"); it
//   will not show a hollow "0.0 (0)". Callers must pass values derived from the
//   real reviews system, so what shows is always backed by data.
//
// Editorially it is ONE quiet line — the figure, the gold marks, then the count
// as a link-toned note. No filled pill: a rating is a fact to be read, not a
// score to be shouted.
//
// Props:
//   rating         number  aggregate rating 0–5 (real)
//   count          number  number of real ratings/reviews behind it
//   onReviewsClick fn      optional — jump to the reviews section
//   size           "sm"|"md"
//   className      string
// =============================================================================
const SocialProof = ({
  rating = 0,
  count = 0,
  onReviewsClick,
  size = "md",
  className = "",
}) => {
  const ratingsCount = Math.max(0, Number(count) || 0);
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  // Honest empty state — no ratings, so claim nothing.
  if (ratingsCount <= 0) {
    return (
      <div className={`${styles.wrap} ${styles[size] || ""} ${className}`}>
        <span className={styles.empty}>No ratings yet</span>
      </div>
    );
  }

  const starSize = size === "sm" ? 13 : 15;
  const countLabel = `${ratingsCount.toLocaleString()} ${
    ratingsCount === 1 ? "rating" : "Ratings & Reviews"
  }`;

  const sizeClass = styles[size] || "";

  const Tag = onReviewsClick ? "button" : "div";

  return (
    <Tag
      type={onReviewsClick ? "button" : undefined}
      className={`${styles.wrap} ${sizeClass} ${
        onReviewsClick ? styles.clickable : ""
      } ${className}`}
      onClick={onReviewsClick}
      /* WCAG 2.5.3 (Label in Name): as a button this is a labelled control, so
         the accessible name has to CONTAIN the words on screen or a voice-
         control user cannot say it. The count now leads, verbatim, and the
         scale follows — "Rated … out of 5 from …" led before, and no spoken
         phrase matched it. The badge below is hidden from the name rather than
         quoted into it, because the two figures sit in adjacent spans with no
         whitespace between them: the text reads "4.843 Ratings & Reviews" to a
         machine, which is not a string anything should have to say out loud. */
      aria-label={`${countLabel} — rated ${value.toFixed(1)} out of 5`}
    >
      {/* A visual restatement of the stars beside it; the rating reaches
          assistive tech through the label above and through StarRating's own
          role="img", so announcing the figure a third time adds nothing. */}
      <span className={styles.badge} aria-hidden="true">
        {value.toFixed(1)}
      </span>
      <StarRating rating={value} size={starSize} />
      <span className={styles.count}>{countLabel}</span>
    </Tag>
  );
};

export default SocialProof;
