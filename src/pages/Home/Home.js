import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import { useDealsConfig } from "../../context/DealsConfigContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
import { resolveCountdownTarget, diffToParts } from "../../utils/dealsConfig";
import { reveal as sharedReveal } from "../../theme/motion";
import HeroSection from "../../components/HeroSection/HeroSection";
import ProductCard from "../../components/storefront/ProductCard";
import { TRUST_BADGES } from "../../utils/constants";
import { getProductMinPrice, onImageError } from "../../utils/helpers";
import styles from "./Home.module.css";

// =============================================================================
// HOME — the storefront read as a magazine
// =============================================================================
// Below the Prompt 12 hero the page is no longer a stack of marketplace rails.
// It is a sequence of few, large, well-spaced spreads:
//
//   1. WHERE TO BEGIN   collection stories (categories.getAll)
//   2. THE EDIT         featured, staggered editorial grid (products.getFeatured)
//   3. ON OFFER         the deals rail + one tracked countdown line   [conditional]
//   4. OUR CRAFT        full-bleed heritage interlude
//   5. TRENDING         a rail (products.getTrending)
//   6. RECENTLY VIEWED  a compact rail off localStorage               [conditional]
//   7. PROMISES         one hairline row of store-attested policy
//
// Cadence comes from alternating a contained spread against a full-bleed band,
// and from the three rails each sitting in a different frame (sunken band /
// plain / compact footnote) so no two sections read the same.
//
// Every data contract is unchanged: same three API calls, the same deals pool
// derivation (real discounts only, capped 12), the same admin countdown
// resolution, the same recently-viewed key, the same card handlers.
// =============================================================================

// ── Helpers ──────────────────────────────────────────────────────────────────

// Must match the key written by ProductDetails.js so viewing a product
// populates this list end-to-end.
const RECENTLY_VIEWED_KEY = "recentlyViewed";

// How many category "stories" open the page. The rest of the collections stay
// one click away in the hero's index line, the header menu and the listing
// facets — this section is a statement, not a directory.
const COLLECTION_STORIES = 3;

// The promises row. Titles come from TRUST_BADGES (constants.js) so the store's
// four policies are stated from one source — the same four the header strip
// carries — and each is expanded here with the owner-attested line the retired
// "Shop with Confidence" cards used to carry. Keyed by badge copy, with a
// fallback so a copy edit degrades to a bare label rather than breaking.
const PROMISE_DETAIL = {
  "7-Day Easy Returns": {
    icon: "mdi:backup-restore",
    text: "Changed your mind? Return any piece within seven days.",
  },
  "100% Money Back": {
    icon: "mdi:cash-refund",
    text: "A full refund if your order isn't right — no questions asked.",
  },
  "Free Shipping": {
    icon: "mdi:truck-fast-outline",
    text: "Complimentary delivery across India, on every order.",
  },
  "Authentic Silk": {
    icon: "mdi:certificate-outline",
    text: "Genuine handloom silk, woven by master artisans.",
  },
};

// Where the section "View all" links go. NOTE (verified against
// `normalizeSort` / `SORT_ALIASES` in src/pages/Products/Products.js): the
// listing understands relevance | price-low | price-high | newest | rating |
// popularity plus a small alias table. `sort=featured`, `sort=trending` and
// `sort=sale` are NOT in it — they silently fall back to relevance — so this
// page links only to sorts that actually resolve, and sends the offers rail to
// the real Special Offers page instead of a dead `?sort=sale`. If Prompt 14
// adds those aliases to the listing, these two constants are the only edit.
const ALL_PRODUCTS_LINK = "/products";
const TRENDING_LINK = "/products?sort=popularity";

const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const pad = (n) => String(n).padStart(2, "0");

// ── Rail plumbing ────────────────────────────────────────────────────────────
// One hook drives a horizontal rail so its track and its (separately placed)
// controls stay in sync: the controls live up in the section header beside the
// "View all" link rather than floating over the cards, which keeps them in
// reading order and off the photographs.

const useRail = (itemCount = 0) => {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // A few pixels of slack: the track is padded so a card's focus ring is not
    // clipped, and scroll-snap parks the first card a hair off zero.
    setEdges({
      atStart: el.scrollLeft <= 8,
      atEnd: max <= 8 || el.scrollLeft >= max - 8,
    });
  }, []);

  // Re-measure when the rail is filled (data arrives) and when it is resized.
  // Both listeners earn their keep: the observer catches the container changing
  // width on its own (a drawer opening), the window event catches the viewport
  // and fires even where observer callbacks are starved.
  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    const el = ref.current;
    const observer =
      el && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(sync)
        : null;
    if (observer) observer.observe(el);
    return () => {
      window.removeEventListener("resize", sync);
      if (observer) observer.disconnect();
    };
  }, [sync, itemCount]);

  const nudge = useCallback((direction, smooth = true) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  return { ref, edges, sync, nudge };
};

// The track. Focusable so a keyboard user can reach and arrow-scroll the
// overflow region itself, not only the cards inside it.
const ScrollRow = ({ rail, label, compact = false, children }) => (
  <div
    className={`${styles.railTrack} ${compact ? styles.railTrackCompact : ""}`}
    ref={rail.ref}
    onScroll={rail.sync}
    tabIndex={0}
    role="group"
    aria-label={label}
  >
    {children}
  </div>
);

// Two hairline arrows, disabled at the ends of the travel.
const RailControls = ({ rail, label, reduced }) => (
  <div className={styles.railControls}>
    <button
      type="button"
      className={styles.railBtn}
      onClick={() => rail.nudge(-1, !reduced)}
      disabled={rail.edges.atStart}
      aria-label={`Scroll ${label} backwards`}
    >
      &#8249;
    </button>
    <button
      type="button"
      className={styles.railBtn}
      onClick={() => rail.nudge(1, !reduced)}
      disabled={rail.edges.atEnd}
      aria-label={`Scroll ${label} forwards`}
    >
      &#8250;
    </button>
  </div>
);

// ── Countdown ────────────────────────────────────────────────────────────────
// Honest countdown, now one tracked line instead of a bank of digit blocks. The
// target is still resolved from the admin's deals timer; the caller decides
// whether to mount it at all. role="timer" carries an implicit aria-live="off",
// so the accessible name is available on demand and never announced each tick.

const CountdownTimer = ({ target }) => {
  const [timeLeft, setTimeLeft] = useState(() => diffToParts(target));

  useEffect(() => {
    const update = () => setTimeLeft(diffToParts(target));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <p
      className={styles.countdown}
      role="timer"
      aria-label={`Offers end in ${timeLeft.hours} hours ${timeLeft.minutes} minutes`}
    >
      <span className={styles.countdownLabel}>Ends in</span>
      <span className={styles.countdownValue} aria-hidden="true">
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </p>
  );
};

// ── Section header ───────────────────────────────────────────────────────────
// The Prompt 12 convention: a tracked eyebrow opened by a short gold rule, a
// serif title under it, an optional lede — and, on the far side, whatever the
// section needs (a countdown, rail arrows) followed by the quiet "View all".

const SectionHeader = ({
  eyebrow,
  title,
  titleId,
  lede,
  linkText,
  linkTo,
  aside,
  quiet = false,
}) => (
  <div className={`${styles.sectionHead} ${quiet ? styles.sectionHeadQuiet : ""}`}>
    <div className={styles.sectionHeadText}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 id={titleId} className={styles.sectionTitle}>
        {title}
      </h2>
      {lede && <p className={styles.sectionLede}>{lede}</p>}
    </div>
    {(aside || (linkText && linkTo)) && (
      <div className={styles.sectionHeadAside}>
        {aside}
        {linkText && linkTo && (
          <Link to={linkTo} className={styles.viewAllLink}>
            {linkText}
          </Link>
        )}
      </div>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════

const Home = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { config: dealsConfig, enabled: dealsEnabled } = useDealsConfig();
  const prefersReducedMotion = useReducedMotion();

  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, featured, trending, catalogue] = await Promise.all([
          apiService.categories.getAll().catch(() => []),
          apiService.products.getFeatured(8).catch(() => []),
          apiService.products.getTrending(8).catch(() => []),
          apiService.products.getAll().catch(() => []),
        ]);

        setCategories(Array.isArray(cats) ? cats : []);
        setFeaturedProducts(Array.isArray(featured) ? featured.slice(0, 8) : []);
        setTrendingProducts(Array.isArray(trending) ? trending.slice(0, 8) : []);

        // Recently viewed is a localStorage snapshot written by the PDP, so it
        // keeps naming products that have since been set to Draft or deleted in
        // Admin → Products — the rail went on offering them and every click
        // landed on the 404. Reconcile against the live catalogue (which is
        // already visibility-filtered): keep the browsing order, drop what a
        // shopper can no longer reach, and render the current record instead of
        // the stale snapshot. localStorage itself is left alone, so a product
        // that comes back from Draft reappears in the rail.
        const live = new Map(
          (Array.isArray(catalogue) ? catalogue : []).map((p) => [String(p.id), p])
        );
        setRecentlyViewed(
          getRecentlyViewed()
            .map((item) => live.get(String(item.id)))
            .filter(Boolean)
        );

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
  }, []);

  // ── Rails ─────────────────────────────────────────────────────────────────

  const dealsRail = useRail(flashDeals.length);
  const trendingRail = useRail(trendingProducts.length);
  const recentRail = useRail(recentlyViewed.length);

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

  // ── Reveal — the shared in-view treatment from theme/motion.js, so a home
  // section arrives with exactly the weight an About chapter or a policy
  // clause does. Returns {} under reduced motion: no props, no timeline.
  const reveal = (i = 0) =>
    sharedReveal(prefersReducedMotion, { index: i, inView: true, amount: 0.1 });

  // ── Skeletons — the sf-skeleton primitive, shaped like the editorial card ──

  const ProductSkeleton = () => (
    <div className={styles.skelCard} aria-hidden="true">
      <div className={`sf-skeleton ${styles.skelMedia}`} />
      <div className={styles.skelLines}>
        <div className={`sf-skeleton sf-skeleton--text ${styles.skelW40}`} />
        <div className={`sf-skeleton sf-skeleton--text ${styles.skelW80}`} />
        <div className={`sf-skeleton sf-skeleton--text ${styles.skelW50}`} />
      </div>
    </div>
  );

  const renderCard = (product) => (
    <ProductCard
      product={product}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
      isWishlisted={isInWishlist(product.id)}
    />
  );

  // ── Honest deals countdown — only when the real admin timer is enabled ─────
  const countdown = resolveCountdownTarget(dealsConfig?.timer);
  const showCountdown = countdown.active && !!countdown.target;
  // Never point the rail at the Special Offers page while the admin has it
  // switched off — that lands on its "no deals right now" state.
  const offersLink = dealsEnabled ? "/special-offers" : ALL_PRODUCTS_LINK;

  // After load, only render sections that actually have content.
  const collectionStories = categories
    .filter((c) => !c.parentId)
    .slice(0, COLLECTION_STORIES);
  const showCollections = loading || collectionStories.length > 0;
  const showFeatured = loading || featuredProducts.length > 0;
  const showTrending = loading || trendingProducts.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    // No `dark` class hook: this stylesheet is entirely token-driven and the
    // tokens already flip under body.dark, so there is nothing left for a
    // mode-specific selector to say.
    // No page-level fade here: the route transition is applied once, to the
    // keyed wrapper around <Routes> in App.js, so every storefront route
    // arrives the same way.
    <div className={styles.homePage}>
      {/* Hero — full-bleed cinematic opening. It escapes nothing: .main-content
          and .homePage set no max-width, so the section spans the viewport.
          The old promises strip that sat here is gone: the header already
          states the same four policies, and the page now closes on them. */}
      <section className={styles.heroSection}>
        <HeroSection />
      </section>

      {/* ── 1. WHERE TO BEGIN — the collections, told as stories ──────────── */}
      {showCollections && (
        <section
          className={styles.section}
          aria-labelledby="collections-heading"
        >
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Collections"
              title="Where to begin"
              titleId="collections-heading"
              lede="From everyday Eri to heirloom Muga — start with the drape that suits the day."
              linkText="All collections"
              linkTo={ALL_PRODUCTS_LINK}
            />

            <div className={styles.collections}>
              {loading
                ? Array.from({ length: COLLECTION_STORIES }).map((_, i) => (
                    <div
                      key={i}
                      className={`${styles.story} ${
                        i === 0 ? styles.storyLead : ""
                      }`}
                      aria-hidden="true"
                    >
                      <div className={`sf-skeleton ${styles.storyMedia}`} />
                    </div>
                  ))
                : collectionStories.map((cat, i) => (
                    <motion.article
                      key={cat.id || i}
                      className={`${styles.story} ${
                        i === 0 ? styles.storyLead : ""
                      }`}
                      {...reveal(i)}
                    >
                      <div className={styles.storyMedia}>
                        {cat.image && (
                          <img
                            src={cat.image}
                            alt=""
                            className={styles.storyImg}
                            loading="lazy"
                            onError={onImageError}
                          />
                        )}
                      </div>
                      <div className={styles.storyBody}>
                        <span className={styles.storyIndex} aria-hidden="true">
                          {pad(i + 1)}
                        </span>
                        <h3 className={styles.storyName}>
                          {/* The link covers the whole tile (see .storyLink
                              ::after) so the story is one tab stop named by
                              the collection. */}
                          <Link
                            to={`/products?category=${categoryParam(cat)}`}
                            className={styles.storyLink}
                          >
                            {cat.name}
                          </Link>
                        </h3>
                        {cat.description && (
                          <p className={styles.storyText}>{cat.description}</p>
                        )}
                        {cat.productCount !== undefined && (
                          <p className={styles.storyMeta}>
                            {cat.productCount} pieces
                          </p>
                        )}
                        <span className={styles.storyCta} aria-hidden="true">
                          Explore
                        </span>
                      </div>
                    </motion.article>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 2. THE EDIT — featured, on a staggered editorial baseline ─────── */}
      {showFeatured && (
        <section
          className={`${styles.section} ${styles.ruled}`}
          aria-labelledby="edit-heading"
        >
          <div className={styles.container}>
            <SectionHeader
              eyebrow="The Edit"
              title="Chosen this season"
              titleId="edit-heading"
              lede="A short list from the loom — the pieces we would reach for first."
              linkText="View all"
              linkTo={ALL_PRODUCTS_LINK}
            />

            <div className={styles.editGrid}>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div className={styles.editCell} key={i}>
                      <ProductSkeleton />
                    </div>
                  ))
                : featuredProducts.map((product, i) => (
                    <motion.div
                      className={styles.editCell}
                      key={product.id || i}
                      {...reveal(i)}
                    >
                      {renderCard(product)}
                    </motion.div>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. ON OFFER — real markdowns only; the section is absent when the
             catalogue has none. Sunken full-bleed band, one tracked timer. */}
      {flashDeals.length > 0 && (
        <section
          className={`${styles.band} ${styles.bandSunken}`}
          aria-labelledby="offers-heading"
        >
          <div className={styles.container}>
            <SectionHeader
              eyebrow="On offer"
              title="Marked down, honestly"
              titleId="offers-heading"
              lede="Genuine reductions on pieces already in the collection — the price you see is the price you pay."
              linkText="All offers"
              linkTo={offersLink}
              aside={
                <>
                  {showCountdown && <CountdownTimer target={countdown.target} />}
                  <RailControls
                    rail={dealsRail}
                    label="offers"
                    reduced={prefersReducedMotion}
                  />
                </>
              }
            />
            <ScrollRow rail={dealsRail} label="Offers">
              {flashDeals.map((product, i) => (
                <div className={styles.railCard} key={product.id || i}>
                  {renderCard(product)}
                </div>
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* ── 4. OUR CRAFT — the heritage interlude, full-bleed ─────────────── */}
      <section
        className={`${styles.band} ${styles.heritage}`}
        aria-labelledby="heritage-heading"
      >
        <div className={styles.heritageWeave} aria-hidden="true" />
        <div className={styles.container}>
          <motion.div className={styles.heritageInner} {...reveal()}>
            <div className={styles.heritageLead}>
              <p className={`${styles.eyebrow} ${styles.eyebrowInk}`}>
                Our craft
              </p>
              <h2 id="heritage-heading" className={styles.heritagePull}>
                Muga is reared nowhere else on earth. We weave it a metre a day.
              </h2>
            </div>
            <div className={styles.heritageAside}>
              <p className={styles.heritageText}>
                Every drape here leaves a handloom in Sualkuchi, Assam's silk
                village — Muga, Pat, Eri and Nuni, thrown by hand and finished
                by hand, by weavers who learned the loom from their mothers.
              </p>
              <Link
                to="/about"
                className={`sf-btn sf-btn--lg ${styles.heritageCta}`}
              >
                Our story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. TRENDING — a plain contained rail ──────────────────────────── */}
      {showTrending && (
        <section className={styles.section} aria-labelledby="trending-heading">
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Trending"
              title="On the shortlist"
              titleId="trending-heading"
              lede="Flagged by the studio as the pieces to see right now."
              linkText="View all"
              linkTo={TRENDING_LINK}
              aside={
                <RailControls
                  rail={trendingRail}
                  label="trending pieces"
                  reduced={prefersReducedMotion}
                />
              }
            />
            {loading ? (
              <div className={styles.editGrid}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className={styles.editCell} key={i}>
                    <ProductSkeleton />
                  </div>
                ))}
              </div>
            ) : (
              <ScrollRow rail={trendingRail} label="Trending pieces">
                {trendingProducts.map((product, i) => (
                  <div className={styles.railCard} key={product.id || i}>
                    {renderCard(product)}
                  </div>
                ))}
              </ScrollRow>
            )}
          </div>
        </section>
      )}

      {/* ── 6. RECENTLY VIEWED — the footnote rail, from localStorage ─────── */}
      {recentlyViewed.length > 0 && (
        <section
          className={`${styles.section} ${styles.ruled} ${styles.sectionTight}`}
          aria-labelledby="recent-heading"
        >
          <div className={styles.container}>
            <SectionHeader
              eyebrow="Recently viewed"
              title="Where you left off"
              titleId="recent-heading"
              quiet
              aside={
                <RailControls
                  rail={recentRail}
                  label="recently viewed pieces"
                  reduced={prefersReducedMotion}
                />
              }
            />
            <ScrollRow rail={recentRail} label="Recently viewed pieces" compact>
              {recentlyViewed.map((product, i) => (
                <div
                  className={`${styles.railCard} ${styles.railCardCompact}`}
                  key={product.id || i}
                >
                  {renderCard(product)}
                </div>
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* ── 7. PROMISES — one hairline row, store-attested, no accent cards ─ */}
      <section
        className={`${styles.section} ${styles.ruled} ${styles.promises}`}
        aria-label="Our promises"
      >
        <div className={styles.container}>
          <ul className={styles.promisesRow}>
            {TRUST_BADGES.map((badge, i) => {
              const detail = PROMISE_DETAIL[badge];
              return (
                <motion.li className={styles.promise} key={badge} {...reveal(i)}>
                  <Icon
                    className={styles.promiseIcon}
                    icon={detail?.icon || "mdi:check-decagram"}
                    aria-hidden="true"
                  />
                  <span className={styles.promiseTitle}>{badge}</span>
                  {detail?.text && (
                    <span className={styles.promiseText}>{detail.text}</span>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Home;
