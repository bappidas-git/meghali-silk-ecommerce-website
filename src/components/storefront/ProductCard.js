import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import PriceBlock from "./PriceBlock";
import {
  getProductMinPrice,
  buildCartItem,
  productPath,
  truncateText,
  productFlagMarks,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import styles from "./ProductCard.module.css";

// =============================================================================
// ProductCard — the reusable Meghali's Silk storefront product card
// =============================================================================
// One card, used by every product surface (home rails, listing grid, wishlist
// grid, and the PDP "You may also like" row). Domain-agnostic and
// presentational: it renders whatever real product data it is given and wires
// nothing itself — the call-site passes `onAddToCart` (CartContext +
// buildCartItem) and `onToggleWishlist` (WishlistContext).
//
// THE EDITORIAL CARD
//   A gallery object, not a marketplace tile: no frame, no shadow, no fill. A
//   3:4 photograph on the sunken sand panel, then air, then a quiet text stack —
//   tracked brand line, serif name, the gold star line, the price. Everything
//   that isn't the garment is a hairline.
//
//   The DOM is laid out as a 3-row grid (media / body / action) and the action
//   is the LAST tab stop, so keyboard order reads image → heart → name → add
//   whichever row the stylesheet paints it into. On a fine pointer the add
//   affordance is placed back over the foot of the photograph and revealed on
//   hover or focus-within; on touch it stays in its own row, always reachable.
//   Either way the card's outer box is a fixed shape, which is what lets the
//   Wishlist stack its own Move-to-Cart button underneath without jumping.
//
// Authenticity over persuasion:
//   • Stars + count show ONLY when there are real ratings; otherwise a muted
//     "No ratings yet" — never a hollow "(0)".
//   • The discount badge / struck compare / "Save ₹X" all derive from real
//     price vs comparePrice (via PriceBlock) — nothing can be typed in.
//   • The gold PREMIUM ribbon shows ONLY on a real flag (featured / bridal).
//   • TRENDING / HOT show ONLY when the merchant has actually thrown that switch
//     in Admin → Products. They are set in the text stack beside the brand line,
//     not on the photograph, whose corners are already spoken for — see the
//     `.sf-flag` primitive. They are a merchant's note, not scarcity theatre.
//   • Out of stock is the only urgency this card knows how to express.
//
// Props (stable contract — consumed by Home, Products, Wishlist, PDP rails):
//   product           object  (required)
//   onAddToCart       fn      (cartItem) => void  — omit to hide the button
//   onToggleWishlist  fn      (product) => void   — omit to hide the heart
//   isWishlisted      boolean
//   showAddToCart     boolean default true (when onAddToCart given)
// =============================================================================
const ProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  showAddToCart = true,
}) => {
  // Brief "Added ✓" confirmation on a successful add (mirrors the PDP pattern).
  const [added, setAdded] = useState(false);
  const addedTimer = useRef(null);
  useEffect(() => () => clearTimeout(addedTimer.current), []);

  if (!product) return null;

  const { sellingPrice, originalPrice, discount } = getProductMinPrice(product);
  const ratingCount = Number(product.totalReviews) || 0;
  const rating = Number(product.rating) || 0;
  const outOfStock = product.stock === 0;

  // PREMIUM ribbon only when genuinely flagged — never unconditionally.
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const isPremium =
    product.featured === true ||
    tags.includes("bridal") ||
    tags.includes("premium");

  // TRENDING / HOT — the merchant's own switches, read through the one shared
  // reader so this card, the PDP and the listing facet agree.
  const flagMarks = productFlagMarks(product);

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    onAddToCart(buildCartItem(product));
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      className={`${styles.card} ${outOfStock ? styles.isOutOfStock : ""}`}
    >
      <div className={styles.mediaWrap}>
        {/* The photograph. The heart and the badges are siblings, not children:
            nesting a button inside the anchor is invalid and traps the tap. */}
        <Link
          to={productPath(product)}
          className={styles.media}
          aria-label={product.name}
        >
          <img
            src={product.images?.[0] || product.image || PLACEHOLDER_IMG}
            alt={product.name}
            loading="lazy"
            onError={onImageError}
          />
        </Link>

        {/* Discount badge — top-left, only when genuinely discounted. */}
        {discount > 0 && (
          <span className={`sf-badge-discount ${styles.discountBadge}`}>
            {discount}% off
          </span>
        )}

        {/* PREMIUM ribbon — top-right corner, only on a real flag. */}
        {isPremium && (
          <span className={`sf-ribbon-premium ${styles.premiumRibbon}`}>
            Premium
          </span>
        )}

        {outOfStock && <span className={styles.stockTag}>Out of Stock</span>}

        {/* Wishlist heart — top-right; presentational, bound at the call-site. */}
        {onToggleWishlist && (
          <button
            type="button"
            className={`${styles.wishlist} ${isWishlisted ? styles.wishlisted : ""}`}
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(product);
            }}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill={isWishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* The eyebrow line: the brand, then whatever flags the merchant has set.
            One wrapping row, so a 166px card drops the marks under the brand
            instead of pushing the text stack sideways. */}
        {(product.brand || flagMarks.length > 0) && (
          <div className={styles.meta}>
            {product.brand && (
              <span className={styles.brand}>{product.brand}</span>
            )}
            {flagMarks.map((flag) => (
              <span key={flag.key} className={`sf-flag ${flag.className}`}>
                {flag.label}
              </span>
            ))}
          </div>
        )}

        <Link to={productPath(product)} className={styles.name}>
          {truncateText(product.name, 48)}
        </Link>

        {ratingCount > 0 ? (
          <span className={styles.rating}>
            <StarRating rating={rating} size={12} />
            <span className={styles.ratingCount}>
              ({ratingCount.toLocaleString()})
            </span>
          </span>
        ) : (
          <span className={styles.noRating}>No ratings yet</span>
        )}

        <PriceBlock
          price={sellingPrice}
          comparePrice={originalPrice}
          size="sm"
          showSavings
        />
      </div>

      {/* Last in the DOM so it is the last tab stop; the stylesheet decides
          whether it sits in its own row or over the foot of the photograph. */}
      {showAddToCart && onAddToCart && (
        <button
          type="button"
          className={`${styles.addBtn} ${added ? styles.added : ""}`}
          disabled={outOfStock}
          onClick={handleAdd}
        >
          {outOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
        </button>
      )}
    </article>
  );
};

export default ProductCard;
