import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import { useDealsConfig } from "../../context/DealsConfigContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
import { resolveCountdownTarget, diffToParts } from "../../utils/dealsConfig";
import HeroSection from "../../components/HeroSection/HeroSection";
import ProductCard from "../../components/storefront/ProductCard";
import { TRUST_BADGES } from "../../utils/constants";
import { getProductMinPrice, onImageError } from "../../utils/helpers";
import styles from "./Home.module.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Must match the key written by ProductDetails.js so viewing a product
// populates this list end-to-end.
const RECENTLY_VIEWED_KEY = "recentlyViewed";

// Icons for the under-hero promises line, keyed to the TRUST_BADGES copy
// (centralized in constants.js). Thin outline glyphs, matched to the ones the
// shared <TrustStrip> uses so both promises lines read as one device. Falls
// back to a check mark if the copy changes.
const TRUST_BADGE_ICONS = {
  "7-Day Easy Returns": "mdi:autorenew",
  "100% Money Back": "mdi:shield-check-outline",
  "Free Shipping": "mdi:truck-fast-outline",
  "Authentic Silk": "mdi:certificate-outline",
};

// "Shop with Confidence" — owner-attested policy statements (NOT live stats),
// each given one category-dot accent token for its icon chip / top border.
const CONFIDENCE_CARDS = [
  {
    icon: "mdi:backup-restore",
    title: "7-Day Returns",
    text: "Changed your mind? Return any piece within 7 days.",
    accent: "var(--sf-cat-pink)",
  },
  {
    icon: "mdi:cash-refund",
    title: "100% Money Back",
    text: "Full refund if your order isn't right — no questions asked.",
    accent: "var(--sf-cat-purple)",
  },
  {
    icon: "mdi:truck-fast-outline",
    title: "Free Shipping",
    text: "Complimentary delivery across India on every order.",
    accent: "var(--sf-cat-orange)",
  },
  {
    icon: "mdi:certificate-outline",
    title: "Authentic Silk",
    text: "Genuine handloom silk, woven by master artisans.",
    accent: "var(--sf-cat-blue)",
  },
  {
    icon: "mdi:shield-check-outline",
    title: "Secure Payment",
    text: "Every transaction protected with SSL encryption.",
    accent: "var(--sf-cat-teal)",
  },
  {
    icon: "mdi:headset",
    title: "Expert Support",
    text: "Our team is here to help you choose with confidence.",
    accent: "var(--sf-cat-red)",
  },
];

const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// ── Horizontal Scroll Row ────────────────────────────────────────────────────

const ScrollRow = ({ children, scrollRef }) => {
  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.scrollContainer}>
      <button
        type="button"
        className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
        onClick={() => scroll("left")}
        aria-label="Scroll left"
      >
        &#8249;
      </button>
      <div className={styles.scrollTrack} ref={scrollRef}>
        {children}
      </div>
      <button
        type="button"
        className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
        onClick={() => scroll("right")}
        aria-label="Scroll right"
      >
        &#8250;
      </button>
    </div>
  );
};

// ── Countdown Timer ──────────────────────────────────────────────────────────
// Honest countdown: driven by a real target Date resolved from the admin deals
// timer. Renders nothing on its own — the caller decides whether to mount it.

const CountdownTimer = ({ target }) => {
  const [timeLeft, setTimeLeft] = useState(() => diffToParts(target));

  useEffect(() => {
    const update = () => setTimeLeft(diffToParts(target));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={styles.countdown} aria-label="Time left for today's deals">
      <span className={styles.countdownBlock}>
        <strong>{pad(timeLeft.hours)}</strong>
        <small>Hrs</small>
      </span>
      <span className={styles.countdownSep}>:</span>
      <span className={styles.countdownBlock}>
        <strong>{pad(timeLeft.minutes)}</strong>
        <small>Min</small>
      </span>
      <span className={styles.countdownSep}>:</span>
      <span className={styles.countdownBlock}>
        <strong>{pad(timeLeft.seconds)}</strong>
        <small>Sec</small>
      </span>
    </div>
  );
};

// ── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, titleId, subtitle, linkText, linkTo }) => (
  <div className={styles.sectionHeader}>
    <div>
      <h2 id={titleId} className={styles.sectionTitle}>
        {title}
      </h2>
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    </div>
    {linkText && linkTo && (
      <Link to={linkTo} className={styles.viewAllLink}>
        {linkText} &rarr;
      </Link>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════

const Home = () => {
  const { isDarkMode } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { config: dealsConfig } = useDealsConfig();
  const prefersReducedMotion = useReducedMotion();

  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  const flashScrollRef = useRef(null);
  const recentScrollRef = useRef(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, featured, trending] = await Promise.all([
          apiService.categories.getAll().catch(() => []),
          apiService.products.getFeatured(8).catch(() => []),
          apiService.products.getTrending(8).catch(() => []),
        ]);

        setCategories(Array.isArray(cats) ? cats : []);
        setFeaturedProducts(Array.isArray(featured) ? featured.slice(0, 8) : []);
        setTrendingProducts(Array.isArray(trending) ? trending.slice(0, 8) : []);

        // Flash deals: ONLY products with a real comparePrice discount. De-dupe
        // by id across the featured + trending pools, then keep real discounts.
        const pool = [...(featured || []), ...(trending || [])];
        const byId = new Map();
        pool.forEach((p) => {
          if (p && !byId.has(p.id)) byId.set(p.id, p);
        });
        const deals = [...byId.values()]
          .filter((p) => getProductMinPrice(p).discount > 0)
          .slice(0, 12);
        setFlashDeals(deals);
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  // The shared ProductCard calls onAddToCart(buildCartItem(product)) internally,
  // so this receives a ready cart item — do NOT rebuild it.
  const handleAddToCart = useCallback(
    (cartItem) => {
      addToCart(cartItem, 1);
    },
    [addToCart]
  );

  // Wishlist works for guests (persisted to localStorage), matching the
  // product detail page — no auth gate / dead-end redirect.
  const handleToggleWishlist = useCallback(
    (product) => {
      toggleWishlist(product);
    },
    [toggleWishlist]
  );

  // ── Reduced-motion-safe reveal props ──────────────────────────────────────
  const reveal = (i = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { delay: i * 0.05, duration: 0.35 },
        };

  // ── Skeleton loader ──────────────────────────────────────────────────────

  const ProductSkeleton = () => (
    <div className={styles.skeletonCard}>
      <div className={`${styles.skeletonMedia} ${styles.skeleton}`} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonLine} ${styles.skeletonW80}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonW50}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonW60}`} />
      </div>
    </div>
  );

  const renderProductGrid = (products, fallbackCount = 4) => {
    if (loading) {
      return (
        <div className={styles.productGrid}>
          {Array.from({ length: fallbackCount }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!products || products.length === 0) return null;

    return (
      <div className={styles.productGrid}>
        {products.map((product, i) => (
          <motion.div key={product.id || i} {...reveal(i)}>
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              isWishlisted={isInWishlist(product.id)}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  // ── Honest deals countdown — only when the real admin timer is enabled ─────
  const countdown = resolveCountdownTarget(dealsConfig?.timer);
  const showCountdown = countdown.active && !!countdown.target;

  // After load, only render product sections that actually have content.
  const showFeatured = loading || featuredProducts.length > 0;
  const showTrending = loading || trendingProducts.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      className={`${styles.homePage} ${isDarkMode ? styles.dark : ""}`}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero — full-bleed cinematic opening. It escapes nothing: .main-content
          and .homePage set no max-width, so the section spans the viewport. */}
      <section className={styles.heroSection}>
        <HeroSection />
      </section>

      {/* Promises — one hairline line of owner-attested policy (TRUST_BADGES).
          Not a band, not cards: thin gold glyphs and tracked labels. */}
      <section className={styles.trustStrip} aria-label="Our promises">
        <ul className={styles.trustStripInner}>
          {TRUST_BADGES.map((badge) => (
            <li className={styles.trustStripItem} key={badge}>
              <Icon
                className={styles.trustStripIcon}
                icon={TRUST_BADGE_ICONS[badge] || "mdi:check-decagram"}
                aria-hidden="true"
              />
              <span className={styles.trustStripText}>{badge}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Flash Deals — ONLY real-discount products; omitted entirely if none. */}
      {flashDeals.length > 0 && (
        <section className={styles.section} aria-labelledby="flash-deals-heading">
          <div className={styles.container}>
            <div className={styles.flashHeader}>
              <div className={styles.flashTitleWrap}>
                <h2 id="flash-deals-heading" className={styles.sectionTitle}>
                  Flash Deals
                </h2>
                <p className={styles.sectionSubtitle}>
                  Genuine markdowns on handpicked silks
                </p>
              </div>
              <div className={styles.flashMeta}>
                {showCountdown && <CountdownTimer target={countdown.target} />}
                <Link to="/products?sort=sale" className={styles.viewAllLink}>
                  View All &rarr;
                </Link>
              </div>
            </div>
            <ScrollRow scrollRef={flashScrollRef}>
              {flashDeals.map((product, i) => (
                <div className={styles.scrollCard} key={product.id || i}>
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={isInWishlist(product.id)}
                  />
                </div>
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* Shop by Category — the larger browse-categories tile grid. */}
      <section
        className={`${styles.section} ${styles.categorySection}`}
        aria-labelledby="categories-heading"
      >
        <div className={styles.container}>
          <SectionHeader
            title="Shop by Category"
            titleId="categories-heading"
            subtitle="Browse our handloom silk collections"
            linkText="All Categories"
            linkTo="/products"
          />
          <div className={styles.categoryGrid}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.categoryCard} ${styles.skeleton}`}
                  />
                ))
              : categories.map((cat, i) => (
                  <motion.div key={cat.id || i} {...reveal(i)}>
                    <Link
                      to={`/products?category=${categoryParam(cat)}`}
                      className={styles.categoryCard}
                    >
                      {cat.image && (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className={styles.categoryImage}
                          loading="lazy"
                          onError={onImageError}
                        />
                      )}
                      <div className={styles.categoryOverlay}>
                        <h3 className={styles.categoryName}>{cat.name}</h3>
                        {cat.productCount !== undefined && (
                          <span className={styles.categoryCount}>
                            {cat.productCount} Products
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      {/* Featured Products — omitted when empty after load. */}
      {showFeatured && (
        <section className={styles.section} aria-labelledby="featured-heading">
          <div className={styles.container}>
            <SectionHeader
              title="Featured Products"
              titleId="featured-heading"
              subtitle="Handpicked just for you"
              linkText="View All"
              linkTo="/products?sort=featured"
            />
            {renderProductGrid(featuredProducts, 4)}
          </div>
        </section>
      )}

      {/* Heritage / Luxury banner — decorative, single CTA, no fake discounts. */}
      <section className={styles.heritageBanner} aria-labelledby="heritage-heading">
        <div className={styles.container}>
          <motion.div
            className={styles.heritageInner}
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 24 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.3 },
                  transition: { duration: 0.5 },
                })}
          >
            <span className={styles.heritageTag}>Galleria Producer Company</span>
            <h2 id="heritage-heading" className={styles.heritageTitle}>
              Heritage Meets Luxury
            </h2>
            <p className={styles.heritageText}>
              Each weave carries generations of craftsmanship — pure silk,
              dyed and handloomed by master artisans of Bengal.
            </p>
            <Link to="/about" className={styles.heritageCta}>
              Discover Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trending Now — omitted when empty after load. */}
      {showTrending && (
        <section className={styles.section} aria-labelledby="trending-heading">
          <div className={styles.container}>
            <SectionHeader
              title="Trending Now"
              titleId="trending-heading"
              subtitle="See what everyone is loving"
              linkText="View All"
              linkTo="/products?sort=trending"
            />
            {renderProductGrid(trendingProducts, 4)}
          </div>
        </section>
      )}

      {/* Shop with Confidence — 6 token-driven colored feature cards. */}
      <section
        className={`${styles.section} ${styles.confidenceSection}`}
        aria-labelledby="confidence-heading"
      >
        <div className={styles.container}>
          <div className={styles.sectionHeaderCentered}>
            <h2 id="confidence-heading" className={styles.sectionTitle}>
              Shop with Confidence
            </h2>
            <p className={styles.sectionSubtitle}>
              Every order backed by our promises
            </p>
          </div>
          <div className={styles.confidenceGrid}>
            {CONFIDENCE_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                className={styles.confidenceCard}
                style={{ "--card-accent": card.accent }}
                {...reveal(i)}
              >
                <span className={styles.confidenceIcon} aria-hidden="true">
                  <Icon icon={card.icon} />
                </span>
                <h3 className={styles.confidenceTitle}>{card.title}</h3>
                <p className={styles.confidenceText}>{card.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed — renders only when localStorage has items. */}
      {recentlyViewed.length > 0 && (
        <section className={styles.section} aria-labelledby="recent-heading">
          <div className={styles.container}>
            <SectionHeader
              title="Recently Viewed"
              titleId="recent-heading"
              subtitle="Continue where you left off"
            />
            <ScrollRow scrollRef={recentScrollRef}>
              {recentlyViewed.map((product, i) => (
                <div className={styles.scrollCard} key={product.id || i}>
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={isInWishlist(product.id)}
                  />
                </div>
              ))}
            </ScrollRow>
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default Home;
