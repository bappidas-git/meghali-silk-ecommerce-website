import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import PriceBlock from "./PriceBlock";
import {
  getProductMinPrice,
  buildCartItem,
  productPath,
  truncateText,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import styles from "./ProductCard.module.css";

// =============================================================================
// ProductCard — the reusable Meghali's Silk storefront product card
// =============================================================================
// One card, used by every product surface (home rails, listing grid, wishlist
// grid, and the PDP "You may also like" / "Frequently bought together" rows).
// Domain-agnostic and presentational: it renders whatever real product data it
// is given and wires nothing itself — the call-site passes `onAddToCart`
// (CartContext + buildCartItem) and `onToggleWishlist` (WishlistContext).
//
// Authenticity over persuasion:
//   • Stars + count show ONLY when there are real ratings; otherwise a muted
//     "No ratings yet" — never a hollow "(0)".
//   • The discount badge / struck compare / "Save ₹X" all derive from real
//     price vs comparePrice (via PriceBlock) — nothing can be typed in.
//   • The gold PREMIUM ribbon shows ONLY on a real flag (featured / bridal).
//
// Props:
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

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    onAddToCart(buildCartItem(product));
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className={`${styles.card} ${outOfStock ? styles.isOutOfStock : ""}`}>
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

        {/* Discount badge — top-left, only when genuinely discounted. */}
        {discount > 0 && (
          <span className={styles.discountBadge}>{discount}% OFF</span>
        )}

        {/* PREMIUM ribbon — top-right corner, only on a real flag. */}
        {isPremium && <span className={styles.premiumRibbon}>PREMIUM</span>}

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
              width="18"
              height="18"
              fill={isWishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        )}
      </Link>

      <div className={styles.body}>
        {product.brand && <span className={styles.brand}>{product.brand}</span>}

        <Link to={productPath(product)} className={styles.name}>
          {truncateText(product.name, 48)}
        </Link>

        {ratingCount > 0 ? (
          <span className={styles.rating}>
            <StarRating rating={rating} size={13} />
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
      </div>
    </div>
  );
};

export default ProductCard;
