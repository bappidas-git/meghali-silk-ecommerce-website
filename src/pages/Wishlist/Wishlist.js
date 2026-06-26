import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../services/api";
import { ProductCard, RelatedProducts } from "../../components/storefront";
import {
  getProductMinPrice,
  getDefaultCartVariant,
  buildCartItem,
} from "../../utils/helpers";
import styles from "./Wishlist.module.css";

const SORT_OPTIONS = [
  { value: "dateDesc", label: "Recently Added" },
  { value: "dateAsc", label: "Oldest First" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "ratingHigh", label: "Highest Rated" },
];

// How many "You May Also Like" cards to show in the rail.
const REC_LIMIT = 10;

const Wishlist = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const {
    wishlistItems,
    isLoading,
    removeFromWishlist,
    clearWishlist,
    toggleWishlist,
    isInWishlist,
  } = useWishlist();
  const { addToCart } = useCart();
  const { user, isLoading: authLoading, openAuthModal } = useAuth();

  const [sortBy, setSortBy] = useState("dateDesc");
  const [removingId, setRemovingId] = useState(null);

  // ── "You May Also Like" rail — REAL related/featured products only ────────
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);

  // Seed the rail with the most recently saved item; fall back to featured when
  // the wishlist is empty (or related resolves to nothing). Memoised so the
  // fetch effect only re-runs when the seed product actually changes.
  const recSeedId = useMemo(() => {
    if (!wishlistItems.length) return null;
    return [...wishlistItems].sort(
      (a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
    )[0].productId;
  }, [wishlistItems]);

  // Set of product ids already saved, so recommendations never duplicate the grid.
  const wishlistIdSet = useMemo(
    () => new Set(wishlistItems.map((item) => String(item.productId))),
    [wishlistItems]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRecsLoading(true);
      try {
        const seed = wishlistItems.find(
          (item) => item.productId === recSeedId
        );
        // Over-fetch a little so dedup against the wishlist still leaves a full rail.
        const fetchLimit = REC_LIMIT + wishlistIdSet.size + 2;
        let list = [];
        if (seed) {
          // getRelated keys off product.id; wishlist rows store it as productId.
          list = await apiService.products.getRelated(
            { ...seed, id: seed.productId },
            fetchLimit
          );
        }
        if (!Array.isArray(list) || list.length === 0) {
          list = await apiService.products.getFeatured(fetchLimit);
        }
        const deduped = (Array.isArray(list) ? list : [])
          .filter((p) => p && !wishlistIdSet.has(String(p.id)))
          .slice(0, REC_LIMIT);
        if (!cancelled) setRecs(deduped);
      } catch (error) {
        console.error("Error loading recommendations:", error);
        if (!cancelled) setRecs([]);
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // recSeedId + wishlistIdSet capture every change that affects the rail.
  }, [recSeedId, wishlistIdSet, wishlistItems]);

  const getSortedItems = () => {
    const items = [...wishlistItems];
    switch (sortBy) {
      case "dateAsc":
        return items.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
      case "dateDesc":
        return items.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
      case "priceLow":
        return items.sort(
          (a, b) => getProductMinPrice(a).sellingPrice - getProductMinPrice(b).sellingPrice
        );
      case "priceHigh":
        return items.sort(
          (a, b) => getProductMinPrice(b).sellingPrice - getProductMinPrice(a).sellingPrice
        );
      case "ratingHigh":
        return items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return items;
    }
  };

  // Filled-heart toggle on the card removes the item. The brief delay lets the
  // card's exit animation play before the row leaves the wishlist.
  const handleHeartRemove = (productId) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeFromWishlist(productId);
      setRemovingId(null);
    }, 300);
  };

  // Add to cart WITHOUT removing from the wishlist. Same normalized line shape
  // as card/PDP quick-adds (same default variant + id scheme) so it merges into
  // the existing cart line. The wishlist row's product id lives in `productId`.
  const handleAddToCart = (item) => {
    addToCart(buildCartItem({ ...item, id: item.productId }), 1);
  };

  // Move to cart: add, then silently remove from the wishlist (keeps the
  // "Added to Cart" toast on screen instead of replacing it with a "Removed" one).
  const handleMoveToCart = (e, item) => {
    e.stopPropagation();
    handleAddToCart(item);
    setRemovingId(item.productId);
    setTimeout(() => {
      removeFromWishlist(item.productId, { silent: true });
      setRemovingId(null);
    }, 300);
  };

  const sortedItems = getSortedItems();

  // Guests keep a fully working wishlist (saved on this device) — the same open
  // access as the heart toggles on cards/PDP. This banner is the single login
  // entry point and opens the global AuthModal (there is no /login route); on
  // login the local items merge into the account's wishlist. Hidden while the
  // session restore is pending so it doesn't flash on reload.
  const guestBanner = !user && !authLoading && (
    <motion.div
      className={styles.guestBanner}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <p className={styles.guestBannerText}>
        Your wishlist is saved on this device. Log in to sync it across devices.
      </p>
      <button
        className={styles.guestBannerBtn}
        onClick={() => openAuthModal("login")}
      >
        Log In
      </button>
    </motion.div>
  );

  // "You May Also Like" rail — skeletons while loading, RealtedProducts (which
  // renders nothing for an empty set) once resolved. Never shows filler.
  const recommendations = recsLoading ? (
    <section className={styles.recsSection} aria-label="You May Also Like">
      <h2 className={styles.recsTitle}>You May Also Like</h2>
      <div className={styles.recsSkeletonRail}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonBody}>
              <div className={styles.skeletonLine} style={{ width: "70%" }} />
              <div className={styles.skeletonLine} style={{ width: "45%" }} />
              <div className={styles.skeletonLine} style={{ width: "30%" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  ) : (
    <RelatedProducts
      title="You May Also Like"
      products={recs}
      onAddToCart={(cartItem) => addToCart(cartItem)}
      onToggleWishlist={(p) => toggleWishlist(p)}
      isInWishlist={isInWishlist}
    />
  );

  // Loading state — skeleton grid only.
  if (isLoading) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Wishlist</h1>
          </div>
          <div className={styles.grid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} style={{ width: "75%" }} />
                  <div className={styles.skeletonLine} style={{ width: "50%" }} />
                  <div className={styles.skeletonLine} style={{ width: "35%" }} />
                  <div className={styles.skeletonLine} style={{ width: "100%", height: "36px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty wishlist — honest empty state, but still useful via the rail below.
  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          {guestBanner}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>Wishlist</h1>
              <span className={styles.itemCount}>0 items</span>
            </div>
          </div>
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.emptyHeart}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
            <p className={styles.emptyText}>
              Save the silks you love to come back to them later.
            </p>
            <button
              className={styles.shopButton}
              onClick={() => navigate("/products")}
            >
              Shop the Collection
            </button>
          </motion.div>

          {recommendations}
        </div>
      </div>
    );
  }

  // Wishlist with items
  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {guestBanner}
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Wishlist</h1>
            <span className={styles.itemCount}>
              {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className={styles.headerActions}>
            {/* Sort Dropdown */}
            <div className={styles.sortWrapper}>
              <label htmlFor="wishlist-sort" className={styles.sortLabel}>
                Sort by:
              </label>
              <select
                id="wishlist-sort"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className={styles.clearAllBtn}
              onClick={clearWishlist}
              title="Clear all items"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear All
            </button>
          </div>
        </motion.div>

        {/* Product Grid — shared ProductCard so the wishlist matches the catalogue. */}
        <div className={styles.grid}>
          <AnimatePresence mode="popLayout">
            {sortedItems.map((item, index) => {
              // Stock of what "Move to Cart" would add: the default (cheapest)
              // variant when the product has variants, else the product itself.
              // Unknown stock (older saved rows) is treated as in-stock.
              const defaultVariant = getDefaultCartVariant(item);
              const stockValue = defaultVariant ? defaultVariant.stock : item.stock;
              const inStock =
                stockValue == null || stockValue === "" || Number(stockValue) > 0;

              return (
                <motion.div
                  key={item.productId}
                  className={`${styles.cardCell} ${removingId === item.productId ? styles.cardRemoving : ""}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <ProductCard
                    product={{ ...item, id: item.productId }}
                    onAddToCart={(cartItem) => addToCart(cartItem)}
                    onToggleWishlist={() => handleHeartRemove(item.productId)}
                    isWishlisted
                  />
                  {/* Per-item Move to Cart (add + remove from wishlist). */}
                  <button
                    className={styles.moveToCartBtn}
                    onClick={(e) => handleMoveToCart(e, item)}
                    disabled={!inStock}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    Move to Cart
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {recommendations}
      </div>
    </div>
  );
};

export default Wishlist;
