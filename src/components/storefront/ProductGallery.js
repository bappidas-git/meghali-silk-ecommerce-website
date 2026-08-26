import React, { useState, useEffect, useCallback } from "react";
import { PLACEHOLDER_IMG, onImageError } from "../../utils/helpers";
import { STOREFRONT_CONFIG } from "../../theme/tokens";
import styles from "./ProductGallery.module.css";

// =============================================================================
// ProductGallery — the plate and its contact strip
// =============================================================================
// One large 3:4 stage carrying the garment, with the other views printed
// underneath as a quiet contact strip — the way a photographer lays out frames,
// rather than a webshop's boxed carousel. Desktop keeps the hover-zoom (subtle,
// ~1.8×), images stay lazy-loaded and alt-texted, and a single-image product
// simply loses the strip.
//
// The stage comes FIRST in the DOM so keyboard order reads stage → frames, in
// the order they are seen; the strip keeps its `role="tablist"` semantics and
// the stage keeps its arrow keys.
//
// Props (unchanged — other prompts and pages consume this contract):
//   images    string[]  image URLs (falls back to a placeholder)
//   alt       string    base alt text (the product name)
//   discount  number    optional honest discount % → corner mark
//   zoom      boolean   enable hover-zoom (default from STOREFRONT_CONFIG)
//   ribbon    string    OPTIONAL, additive (default null/off). When a non-empty
//                       string is passed (e.g. "PREMIUM") a hairline gold label
//                       is drawn over the TOP-RIGHT of the stage. The caller
//                       decides whether the flag is genuine — the component
//                       never invents it. Omit it and nothing changes.
//   inStock   boolean   OPTIONAL, additive (default false/off). When true, a
//                       quiet "In Stock" mark is drawn on the RIGHT of the
//                       stage, under the ribbon when there is one. Caller passes
//                       only a real, in-stock selection.
// =============================================================================
const ProductGallery = ({
  images = [],
  alt = "Product image",
  discount = 0,
  zoom = STOREFRONT_CONFIG.gallery.zoom,
  ribbon = null,
  inStock = false,
}) => {
  const pics = images && images.length > 0 ? images : [PLACEHOLDER_IMG];
  const [index, setIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  // Reset to the first image whenever the image set changes (e.g. new product).
  useEffect(() => {
    setIndex(0);
  }, [images]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const step = useCallback(
    (delta) => setIndex((i) => (i + delta + pics.length) % pics.length),
    [pics.length]
  );

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  const multi = pics.length > 1;

  return (
    <div className={styles.gallery}>
      <div
        className={styles.main}
        onMouseEnter={() => zoom && setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={zoom ? handleMove : undefined}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-label={`${alt} — image ${index + 1} of ${pics.length}`}
      >
        <img
          src={pics[index] || PLACEHOLDER_IMG}
          alt={`${alt}${multi ? ` — view ${index + 1}` : ""}`}
          className={styles.mainImg}
          onError={onImageError}
          style={
            isZooming
              ? { transform: "scale(1.8)", transformOrigin: `${pos.x}% ${pos.y}%` }
              : undefined
          }
        />

        {/* ── Marks. Hairlines printed on the plate, never stickers. Placed to
            match the storefront card: discount top-left, PREMIUM top-right,
            with the In-Stock note stepping under the ribbon when both show. ── */}
        {discount > 0 && (
          <span className={`sf-badge-discount ${styles.discountBadge}`}>
            {discount}% off
          </span>
        )}
        {ribbon && (
          <span className={`sf-ribbon-premium ${styles.premiumRibbon}`}>
            {ribbon}
          </span>
        )}
        {inStock && (
          <span
            className={`${styles.stockPill} ${ribbon ? styles.stockPillLower : ""}`}
          >
            <span className={styles.stockDot} aria-hidden="true" />
            In Stock
          </span>
        )}

        {multi && (
          <div className={styles.dots} aria-hidden="true">
            {pics.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${index === i ? styles.dotActive : ""}`}
              />
            ))}
          </div>
        )}
      </div>

      {multi && (
        <div className={styles.thumbs} role="tablist" aria-label="Product images">
          {pics.map((img, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={`Show image ${i + 1} of ${pics.length}`}
              className={`${styles.thumb} ${index === i ? styles.thumbActive : ""}`}
              onClick={() => setIndex(i)}
              onMouseEnter={() => setIndex(i)}
            >
              <img src={img} alt="" loading="lazy" onError={onImageError} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
