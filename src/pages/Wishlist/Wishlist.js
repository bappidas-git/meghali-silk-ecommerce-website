import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

// =============================================================================
// WISHLIST — the private collection
// =============================================================================
// The saved pieces read as a personal gallery rather than an account screen: an
// eyebrow, a serif title and one honest line of counts; a hairline invitation
// band for guests; one rule carrying Clear All and Sort; then nothing but the
// garments on the ivory ground, each with a quiet hairline button beneath it.
//
// WHAT DID NOT CHANGE (and must not)
//   • The `useWishlist` surface and the guest→login sync are owned entirely by
//     WishlistContext. A guest's collection is a REAL collection — it works
//     completely on this device and merges into the account on login — so the
//     band here informs and invites; it never gates the page.
//   • Move to Cart is still `addToCart(buildCartItem(...))` followed by a
//     SILENT remove, so the "Added to Cart" toast is not immediately replaced
//     by a "Removed" one.
//   • Clear All calls the context's own confirmed clear (it raises the dialog);
//     this page only offers the way in.
//   • The five sort options keep their values and their comparators, and the
//     rail is still seeded from the newest saved piece (getRelated, falling
//     back to getFeatured) and deduped against everything already saved.
//   • Cards deep-link through the stored `slug` because ProductCard is used
//     exactly as the catalogue uses it — `{...item, id: item.productId}`.
//
// THEMING
//   Tokens only. This page deliberately does not consume ThemeContext: every
//   colour resolves through `--sf-*`, which flips under `body.dark`, so light
//   and dark are one stylesheet.
// =============================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SORT_OPTIONS = [
  { value: "dateDesc", label: "Recently Saved" },
  { value: "dateAsc", label: "Oldest First" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "ratingHigh", label: "Highest Rated" },
];

// How many "You May Also Like" cards to show in the rail.
const REC_LIMIT = 10;

// The page's own easing, matching --sf-ease.
const EASE = [0.22, 1, 0.36, 1];

// How long a piece is left fading before its row is dropped. The timers below
// and the exit animation are deliberately the same number.
const REMOVAL_MS = 300;

// ---------------------------------------------------------------------------
// Marks — hairline line art in the house drawing style
// ---------------------------------------------------------------------------
const BookmarkMark = () => (
  <svg className={styles.guestBandMark} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />
  </svg>
);

const ClearMark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

const CartMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9.5" cy="20" r="1.25" />
    <circle cx="18" cy="20" r="1.25" />
    <path d="M2.5 3h3l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h7.8a1.6 1.6 0 0 0 1.6-1.3L21 6.5H6" />
  </svg>
);

// Empty state — a heart drawn in hairline with the loom's gold weft laid across
// it and the shuttle resting: the thread is there, nothing is woven yet. Same
// drawing language as the Products empty state, coloured through the local
// --empty-* aliases so it inverts with the page.
const EmptyIllustration = () => (
  <svg className={styles.stateArt} width="188" height="132" viewBox="0 0 188 132" fill="none" aria-hidden="true">
    <path
      d="M94 100 C 78 88 48 72 48 48 C 48 34 59 26 71 26 C 81 26 89 32 94 41 C 99 32 107 26 117 26 C 129 26 140 34 140 48 C 140 72 110 88 94 100 Z"
      stroke="var(--empty-line)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path
      d="M14 114 C 42 106 66 122 92 114 S 136 106 152 116"
      stroke="var(--empty-gold)"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path
      d="M136 122 L152 116 L168 122 L152 128 Z"
      stroke="var(--empty-gold)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Skeleton cell — the card's silhouette on the shared `sf-skeleton` primitive.
// `withAction` adds the Move-to-Cart line so the loading grid stands as tall as
// the real one; the rail's cells carry no such button.
// ---------------------------------------------------------------------------
const SkeletonCell = ({ withAction = false }) => (
  <div className={styles.skelCell} aria-hidden="true">
    <div className={`sf-skeleton ${styles.skelMedia}`} />
    <div className={styles.skelBody}>
      <div className={`sf-skeleton ${styles.skelBrand}`} />
      <div className={`sf-skeleton ${styles.skelName}`} />
      <div className={`sf-skeleton ${styles.skelStars}`} />
      <div className={`sf-skeleton ${styles.skelPrice}`} />
    </div>
    {withAction && <div className={`sf-skeleton ${styles.skelAction}`} />}
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const Wishlist = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
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
    }, REMOVAL_MS);
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
    }, REMOVAL_MS);
  };

  const sortedItems = getSortedItems();
  const count = wishlistItems.length;

  // The head is the same object in every state — eyebrow, the page's one <h1>,
  // and a single line of real counts underneath it.
  const renderHead = (note) => (
    <header className={styles.head}>
      <p className={styles.eyebrow}>Wishlist</p>
      <h1 className={styles.title}>Your Collection</h1>
      <p className={styles.countLine}>{note}</p>
    </header>
  );

  // Guests keep a fully working wishlist (saved on this device) — the same open
  // access as the heart toggles on cards/PDP. This band is the single login
  // entry point and opens the global AuthModal (there is no /login route); on
  // login the local items merge into the account's wishlist. Hidden while the
  // session restore is pending so it doesn't flash on reload.
  const guestBand = !user && !authLoading && (
    <div className={styles.guestBand}>
      <BookmarkMark />
      <p className={styles.guestBandText}>
        <span className={styles.guestBandLead}>
          Sign in to keep your collection.
        </span>
        <span className={styles.guestBandNote}>
          These pieces are saved on this device. Signing in keeps them with your
          account, on every screen you open.
        </span>
      </p>
      <button
        type="button"
        className={styles.guestBandBtn}
        onClick={() => openAuthModal("login")}
      >
        Sign In
      </button>
    </div>
  );

  // "You May Also Like" — a curated rail of REAL products. Skeletons on the
  // shared primitive while it resolves; RelatedProducts (which renders nothing
  // for an empty set) once it has. Never filler.
  const recommendations = recsLoading ? (
    <section className={styles.recsSkeleton} aria-label="You May Also Like">
      <h2 className={styles.recsSkeletonTitle}>You May Also Like</h2>
      <div className={styles.recsSkeletonRail}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCell key={i} />
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

  // ── Loading — the head, then the grid's own silhouette ────────────────────
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          {renderHead("Gathering your saved pieces…")}
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCell key={i} withAction />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty — an editorial moment, and the rail still offers a way back in ──
  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          {renderHead("Nothing saved yet.")}
          {guestBand}
          <div className={styles.state}>
            <EmptyIllustration />
            <h2 className={styles.stateTitle}>Your collection is empty</h2>
            <p className={styles.stateText}>
              Tap the heart on any piece and it waits for you here — the weave,
              the colour and the price, held until you are ready.
            </p>
            <button
              type="button"
              className={`sf-btn sf-btn--emerald ${styles.stateBtn}`}
              onClick={() => navigate("/products")}
            >
              Explore the collection
            </button>
          </div>

          {recommendations}
        </div>
      </div>
    );
  }

  // ── The collection ────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {renderHead(
          <>
            <strong>{count}</strong> {count === 1 ? "piece" : "pieces"} saved.
          </>
        )}
        {guestBand}

        {/* One rule, two controls. */}
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearWishlist}
          >
            <ClearMark />
            <span className={styles.clearBtnText}>Clear All</span>
          </button>

          <div className={styles.sortField}>
            <label htmlFor="wishlist-sort" className={styles.sortLabelText}>
              Sort
            </label>
            <span className={styles.selectWrap}>
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
            </span>
          </div>
        </div>

        {/* The wall — the shared ProductCard, so a saved piece looks exactly as
            it did in the catalogue, plus this page's own quiet action. */}
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
              const isRemoving = removingId === item.productId;

              return (
                <motion.div
                  key={item.productId}
                  className={`${styles.cell} ${isRemoving ? styles.cardRemoving : ""}`}
                  layout
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  // The removal fade is the SAME animation as the entrance, run
                  // backwards: the piece dims in place for REMOVAL_MS while the
                  // timer above waits, then AnimatePresence closes the gap.
                  animate={{
                    opacity: isRemoving ? 0 : 1,
                    y: isRemoving && !shouldReduceMotion ? 6 : 0,
                  }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  transition={
                    isRemoving
                      ? { duration: shouldReduceMotion ? 0 : REMOVAL_MS / 1000, ease: EASE }
                      : {
                          duration: shouldReduceMotion ? 0 : 0.5,
                          ease: EASE,
                          delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.4),
                        }
                  }
                >
                  <ProductCard
                    product={{ ...item, id: item.productId }}
                    onAddToCart={(cartItem) => addToCart(cartItem)}
                    onToggleWishlist={() => handleHeartRemove(item.productId)}
                    isWishlisted
                  />
                  {/* Per-item Move to Cart (add + silent remove). */}
                  <button
                    type="button"
                    className={styles.moveBtn}
                    onClick={(e) => handleMoveToCart(e, item)}
                    disabled={!inStock}
                  >
                    <CartMark />
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
