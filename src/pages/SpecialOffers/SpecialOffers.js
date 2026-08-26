import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import { useDealsConfig } from "../../context/DealsConfigContext";
import StarRating from "../../components/storefront/StarRating";
import apiService from "../../services/api";
import {
  formatCurrency,
  getProductMinPrice,
  getProductMaxDiscount,
  buildCartItem,
  productPath,
  copyToClipboard,
  truncateText,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import { resolveCountdownTarget, diffToParts } from "../../utils/dealsConfig";
import { RISE, reveal } from "../../theme/motion";
import styles from "./SpecialOffers.module.css";

// =============================================================================
// SPECIAL OFFERS  —  the season's offers, set editorially
// =============================================================================
// A boutique does not shout about a sale; it posts a card by the door. This page
// is that card. Four movements on the ivory ground, and nothing between them but
// air and hairlines:
//
//   1. THE OPENING BAND — the admin's own eyebrow / headline / line, and one
//      tracked countdown line instead of a wall of digit tiles.
//   2. THE VOUCHERS — hairline cards, the figure set in the display serif, the
//      honest small print underneath, the code on a dashed chip with Copy.
//   3. THE CHOSEN — the admin's Deal of the Day picks as large, image-led
//      features with a real savings line derived from comparePrice.
//   4. THE MARKDOWNS — a hairline category strip over a wall of cards drawn in
//      the Prompt 09 language.
//
// EVERYTHING HERE IS ADMIN-STEERED
//   `useDealsConfig` is the single source of truth: the master `enabled` gate,
//   the hero copy, the countdown window (including the "endOfDay" rollover), and
//   the three ordered id selections. `pickByIds` renders a selection in exactly
//   the admin's order and quietly drops ids that no longer exist; an EMPTY
//   selection falls back to the discount-derived automatic set. No copy, price
//   or urgency on this page is written in code.
//
// HONESTY RULES (the reason several obvious "conversion" devices are missing)
//   • The countdown counts down to the admin's window and nothing else. There is
//     no per-product timer, because there is no per-product window.
//   • Savings come from real price vs comparePrice. A feature the admin picked
//     that is NOT reduced simply shows its price with no savings line.
//   • Coupons are filtered by the same gates checkout enforces (active, not
//     expired, not usage-exhausted) and come from the same `coupons` store the
//     Admin manages — so every code printed here actually redeems.
//   • No stock scares, no "12 people are viewing", no invented scarcity.
//
// THE LOCAL CARD
//   The grid card, the tab strip and the skeletons are all local to this page on
//   purpose (they always have been). They are drawn to MATCH the shared Prompt 09
//   card — 3:4 plate, tracked eyebrow, serif name, gold stars, quiet price row,
//   hover-revealed add — without importing it. The one thing that IS imported is
//   the shared StarRating, because a star is a star.
// =============================================================================

// ── Coupon display helpers ───────────────────────────────────────────────────
// Coupons shown here come from the same store the Admin manages and Checkout
// validates against (apiService.coupons), so every advertised code redeems.

// Compact rupee figure for promo copy — round values read cleaner without paise.
const rupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

// Expiry shown on a coupon card — the same instant the checkout enforces.
const formatExpiry = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Headline figure on a coupon's stub: "20%" for percentage, "₹500" for fixed.
const couponHeadline = (c) => (c.type === "percentage" ? `${c.value}%` : rupees(c.value));

// Only advertise coupons a shopper can actually redeem right now: active, not
// past expiry, not usage-exhausted — the same gates checkout enforces.
// (minOrderAmount is order-dependent, so it's shown on the card instead.)
const isCouponValid = (c, now = new Date()) =>
  c &&
  c.isActive !== false &&
  (!c.expiresAt || new Date(c.expiresAt) > now) &&
  !(c.usageLimit && c.usedCount >= c.usageLimit);

// The small print, built ONLY from fields the coupon actually carries — every
// row is a condition checkout will really apply, and nothing is padded in to
// make the card look fuller.
const couponTerms = (c) => {
  const rows = [];
  rows.push(
    c.minOrderAmount > 0 ? `Minimum order ${rupees(c.minOrderAmount)}` : "No minimum order"
  );
  if (c.type === "percentage" && c.maxDiscount) {
    rows.push(`Capped at ${rupees(c.maxDiscount)}`);
  }
  rows.push(c.expiresAt ? `Valid through ${formatExpiry(c.expiresAt)}` : "No expiry date");
  return rows;
};

// Resolve an ordered id selection against a list, preserving the admin order and
// dropping ids that no longer exist.
const pickByIds = (items, ids) => {
  const byId = new Map(items.map((it) => [String(it.id), it]));
  return (ids || []).map((id) => byId.get(String(id))).filter(Boolean);
};

const pad = (n) => String(n).padStart(2, "0");

// The countdown said out loud. The digits tick every second, which is unbearable
// on a screen reader, so the visual pairs are aria-hidden and this coarse form —
// hours and minutes only — is what actually gets read.
const countdownSpeech = ({ hours, minutes }) => {
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  if (h <= 0 && m <= 0) return "less than a minute";
  const said = [];
  if (h > 0) said.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m > 0) said.push(`${m} minute${m === 1 ? "" : "s"}`);
  return `about ${said.join(" and ")}`;
};

// ── Countdown Hook (admin-configured) ────────────────────────────────────────
// Targets the admin's window (fixed end date, or end-of-day when none) and
// re-evaluates each second so a fixed end can expire live and honour onExpiry.
const computeCountdown = (timer) => {
  const r = resolveCountdownTarget(timer);
  if (!r.active) {
    return { show: false, ended: !!r.ended, parts: { hours: 0, minutes: 0, seconds: 0 } };
  }
  return { show: true, ended: false, parts: diffToParts(r.target) };
};

const useDealsCountdown = (timer) => {
  const [state, setState] = useState(() => computeCountdown(timer));
  const enabled = timer?.enabled;
  const endAt = timer?.endAt;
  const onExpiry = timer?.onExpiry;

  useEffect(() => {
    setState(computeCountdown({ enabled, endAt, onExpiry }));
    const id = setInterval(
      () => setState(computeCountdown({ enabled, endAt, onExpiry })),
      1000
    );
    return () => clearInterval(id);
  }, [enabled, endAt, onExpiry]);

  return state;
};

// Brief "Added" confirmation after a successful add — the same reassurance the
// shared card and the PDP give, so an offers add doesn't feel like it went
// nowhere. Purely visual; the cart is updated by the caller either way.
const useAddedFlash = (ms = 1400) => {
  const [added, setAdded] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback(() => {
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), ms);
  }, [ms]);
  return [added, flash];
};

// ── Marks ────────────────────────────────────────────────────────────────────
// Hairline line art in the brand's drawing style: one stroke weight, no fills,
// a single gold thread. The artwork reads its colours from the local --offer-*
// aliases, which resolve to tokens, so it inverts with the page.

const HeartMark = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  </svg>
);

const ChevronMark = ({ dir }) => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points={dir === "left" ? "15 6 9 12 15 18" : "9 6 15 12 9 18"} />
  </svg>
);

// A hanging price tag with its thread — the page's one piece of artwork, shared
// by the "nothing reduced" and the "offers are off" states.
const TagMark = () => (
  <svg className={styles.stateArt} width="152" height="116" viewBox="0 0 152 116" fill="none" aria-hidden="true">
    <g stroke="var(--offer-line)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M58 30 L130 30 L130 90 L58 90 L24 60 Z" />
      <circle cx="47" cy="60" r="5.5" />
      <line x1="76" y1="50" x2="114" y2="50" />
      <line x1="76" y1="64" x2="100" y2="64" />
    </g>
    {/* the thread, out of the eyelet */}
    <path d="M44 55 C 33 36, 45 20, 66 18" stroke="var(--offer-gold)" strokeWidth="1.25" strokeLinecap="round" fill="none" />
  </svg>
);

// ── The countdown line ───────────────────────────────────────────────────────
// One tracked line, not a wall of tiles. Each pair is a fixed 2ch box set in
// tabular figures, so the second ticking from 09 to 10 cannot shove the colons
// sideways once a second for the life of the page.
const CountdownLine = ({ parts, label, className }) => (
  <p className={`${styles.countdown} ${className || ""}`}>
    <span className={styles.countdownLabel}>{label}</span>
    <span className={styles.countdownDigits} aria-hidden="true">
      <span className={styles.countdownPair}>{pad(parts.hours)}</span>
      <span className={styles.countdownSep}>:</span>
      <span className={styles.countdownPair}>{pad(parts.minutes)}</span>
      <span className={styles.countdownSep}>:</span>
      <span className={styles.countdownPair}>{pad(parts.seconds)}</span>
    </span>
    <span className={styles.srOnly}>{countdownSpeech(parts)}</span>
  </p>
);

// ── Category strip ───────────────────────────────────────────────────────────
// A hairline strip of words, not a row of pills. It never hides a tab: edge
// fades and scroll marks appear when there is more off-screen, and the active
// word is scrolled into view. The marks are hidden on touch (CSS), where the
// strip is swiped instead. These are toggle buttons rather than a tab widget —
// Tab reaches every word in order, and `aria-pressed` says which filter is on.
const CategoryTabs = ({ categories, activeTab, onChange }) => {
  const scrollRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const reduceMotion = useReducedMotion();
  const behavior = reduceMotion ? "auto" : "smooth";

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, categories.length]);

  // Keep the active word visible when it changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior });
  }, [activeTab, behavior]);

  const scrollByDir = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.6), behavior });
  };

  return (
    <div className={styles.tabsWrap}>
      <button
        type="button"
        className={`${styles.tabScroll} ${styles.tabScrollLeft} ${atStart ? styles.tabScrollHidden : ""}`}
        onClick={() => scrollByDir(-1)}
        aria-label="Scroll categories left"
        tabIndex={atStart ? -1 : 0}
      >
        <ChevronMark dir="left" />
      </button>
      <span
        className={`${styles.tabFade} ${styles.tabFadeLeft} ${atStart ? styles.tabFadeHidden : ""}`}
        aria-hidden="true"
      />

      <div
        className={styles.tabStrip}
        ref={scrollRef}
        role="group"
        aria-label="Filter the markdowns by category"
      >
        <button
          type="button"
          data-active={activeTab === "all"}
          aria-pressed={activeTab === "all"}
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => onChange("all")}
        >
          All Deals
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            data-active={activeTab === cat.id}
            aria-pressed={activeTab === cat.id}
            className={`${styles.tab} ${activeTab === cat.id ? styles.tabActive : ""}`}
            onClick={() => onChange(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <span
        className={`${styles.tabFade} ${styles.tabFadeRight} ${atEnd ? styles.tabFadeHidden : ""}`}
        aria-hidden="true"
      />
      <button
        type="button"
        className={`${styles.tabScroll} ${styles.tabScrollRight} ${atEnd ? styles.tabScrollHidden : ""}`}
        onClick={() => scrollByDir(1)}
        aria-label="Scroll categories right"
        tabIndex={atEnd ? -1 : 0}
      >
        <ChevronMark dir="right" />
      </button>
    </div>
  );
};

// ── The feature (Deal of the Day) ────────────────────────────────────────────
// The page's one large gesture: a 4:5 plate, the name in the display serif, the
// price cluster, and — only where the arithmetic supports it — the savings line.
// A feature the admin picked that carries no markdown simply prints its price.
const DealFeature = ({ product, categoryName, onAddToCart, index, reduceMotion }) => {
  const { sellingPrice, originalPrice, discount } = getProductMinPrice(product);
  const saving = originalPrice - sellingPrice;
  const outOfStock = product.stock === 0;
  const [added, flashAdded] = useAddedFlash();

  const handleAdd = () => {
    if (outOfStock) return;
    onAddToCart(product);
    flashAdded();
  };

  return (
    <motion.article
      className={`${styles.feature} ${outOfStock ? styles.isOut : ""}`}
      {...reveal(reduceMotion, { index })}
    >
      <div className={styles.featureMedia}>
        <Link to={productPath(product)} className={styles.plate} aria-label={product.name}>
          <img
            src={product.images?.[0] || product.image || PLACEHOLDER_IMG}
            alt={product.name}
            loading="lazy"
            onError={onImageError}
          />
        </Link>
        {discount > 0 && (
          <span className={`sf-badge-discount ${styles.badge}`}>{discount}% off</span>
        )}
        {outOfStock && <span className={styles.stockTag}>Out of Stock</span>}
      </div>

      <div className={styles.featureBody}>
        {categoryName && <span className={styles.cardEyebrow}>{categoryName}</span>}
        <Link to={productPath(product)} className={styles.featureName}>
          {product.name}
        </Link>

        <div className={styles.priceRow}>
          <span className={styles.price}>{formatCurrency(sellingPrice, product.currency)}</span>
          {discount > 0 && (
            <>
              <span className={styles.compare}>
                {formatCurrency(originalPrice, product.currency)}
              </span>
              <span className={styles.percentOff}>{discount}% off</span>
            </>
          )}
        </div>

        {/* Printed only where comparePrice genuinely exceeds the price paid. */}
        {saving > 0 && (
          <p className={styles.savings}>You save {formatCurrency(saving, product.currency)}</p>
        )}
      </div>

      {/* Outside the body, so the growing body pushes it to the foot of the
          card and the three features line their buttons up whatever the names
          do to the stack above. */}
      <button
        type="button"
        className={`${styles.featureBtn} ${added ? styles.btnAdded : ""}`}
        onClick={handleAdd}
        disabled={outOfStock}
      >
        {outOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
      </button>
    </motion.article>
  );
};

// ── The grid card ────────────────────────────────────────────────────────────
// Local to this page, drawn to the Prompt 09 card language: a 3:4 photograph on
// the sunken panel, then air, then a quiet stack — tracked category, serif name,
// the gold star line, the price. The plate and the name are real links (the old
// click-anywhere div was invisible to the keyboard, and the "Quick View" button
// that sat over the photograph only ever went to the same place), and the add
// affordance is last in the DOM so it is the last tab stop; the stylesheet
// decides whether it sits over the foot of the plate or in a row of its own.
//
// forwardRef so AnimatePresence's popLayout child can attach its measurement ref.
const ProductCard = React.forwardRef(
  (
    { product, categoryName, onAddToCart, onToggleWishlist, isWishlisted, index, reduceMotion },
    ref
  ) => {
    const { sellingPrice, originalPrice, discount } = getProductMinPrice(product);
    const ratingCount = Number(product.totalReviews) || 0;
    const rating = Number(product.rating) || 0;
    const outOfStock = product.stock === 0;
    const [added, flashAdded] = useAddedFlash();

    const handleAdd = () => {
      if (outOfStock) return;
      onAddToCart(product);
      flashAdded();
    };

    return (
      <motion.article
        ref={ref}
        className={`${styles.card} ${outOfStock ? styles.isOut : ""}`}
        {...reveal(reduceMotion, { index })}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: RISE.micro }}
        layout
      >
        <div className={styles.cardMedia}>
          <Link to={productPath(product)} className={styles.plate} aria-label={product.name}>
            <img
              src={product.images?.[0] || product.image || PLACEHOLDER_IMG}
              alt={product.name}
              loading="lazy"
              onError={onImageError}
            />
          </Link>

          {discount > 0 && (
            <span className={`sf-badge-discount ${styles.badge}`}>{discount}% off</span>
          )}

          {outOfStock && <span className={styles.stockTag}>Out of Stock</span>}

          <button
            type="button"
            className={`${styles.wishlist} ${isWishlisted ? styles.wishlisted : ""}`}
            onClick={() => onToggleWishlist(product)}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
          >
            <HeartMark filled={isWishlisted} />
          </button>
        </div>

        <div className={styles.cardBody}>
          {categoryName && <span className={styles.cardEyebrow}>{categoryName}</span>}

          <Link to={productPath(product)} className={styles.cardName}>
            {truncateText(product.name, 48)}
          </Link>

          {/* Stars only where there are real ratings — never a hollow "(0)". */}
          {ratingCount > 0 ? (
            <span className={styles.rating}>
              <StarRating rating={rating} size={12} />
              <span className={styles.ratingCount}>({ratingCount.toLocaleString()})</span>
            </span>
          ) : (
            <span className={styles.noRating}>No ratings yet</span>
          )}

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(sellingPrice, product.currency)}</span>
            {discount > 0 && (
              <>
                <span className={styles.compare}>
                  {formatCurrency(originalPrice, product.currency)}
                </span>
                <span className={styles.percentOff}>{discount}% off</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.addBtn} ${added ? styles.btnAdded : ""}`}
          onClick={handleAdd}
          disabled={outOfStock}
        >
          {outOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
        </button>
      </motion.article>
    );
  }
);
ProductCard.displayName = "ProductCard";

// ── Skeletons ────────────────────────────────────────────────────────────────
// The silhouette of the thing that is coming, drawn on the shared `sf-skeleton`
// primitive — the warm sand sweep, not a grey block.

const CardSkeleton = () => (
  <div className={styles.skelCard}>
    <div className={`sf-skeleton ${styles.skelPlate}`} />
    <div className={styles.skelBody}>
      <div className={`sf-skeleton ${styles.skelEyebrow}`} />
      <div className={`sf-skeleton ${styles.skelName}`} />
      <div className={`sf-skeleton ${styles.skelStars}`} />
      <div className={`sf-skeleton ${styles.skelPrice}`} />
    </div>
  </div>
);

const VoucherSkeleton = () => (
  <div className={styles.skelVoucher}>
    <div className={`sf-skeleton ${styles.skelFigure}`} />
    <div className={`sf-skeleton ${styles.skelLineWide}`} />
    <div className={`sf-skeleton ${styles.skelLineMid}`} />
    <div className={styles.skelRule} />
    <div className={`sf-skeleton ${styles.skelLineShort}`} />
    <div className={`sf-skeleton ${styles.skelLineShort}`} />
    <div className={`sf-skeleton ${styles.skelChip}`} />
  </div>
);

const HeadSkeleton = () => (
  <div className={styles.skelHead}>
    <div className={`sf-skeleton ${styles.skelHeadEyebrow}`} />
    <div className={`sf-skeleton ${styles.skelHeadTitle}`} />
    <div className={`sf-skeleton ${styles.skelHeadLine}`} />
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

const SpecialOffers = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const reduceMotion = useReducedMotion();
  // The whole page is admin-managed via this config (master toggle, hero,
  // timer, featured coupon/product selections).
  const { config, loading: configLoading } = useDealsConfig();
  const enabled = config.enabled !== false;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  // { code, ok } — drives the button's own label AND the polite announcement,
  // including the honest failure case where the clipboard is unavailable.
  const [copied, setCopied] = useState({ code: null, ok: true });
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const countdown = useDealsCountdown(config.timer);

  // Fetch products (for deals), categories (for accurate tabs) and the real
  // coupons (so advertised codes match what checkout accepts) in one pass. Only
  // when the page is actually enabled — no point fetching for a hidden page.
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData, couponsData] = await Promise.all([
          apiService.products.getAll(),
          apiService.categories.getAll(),
          apiService.coupons.getActive(),
        ]);
        if (cancelled) return;
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCoupons(Array.isArray(couponsData) ? couponsData : []);
      } catch (error) {
        console.error("Error fetching offers data:", error);
        if (cancelled) return;
        setProducts([]);
        setCategories([]);
        setCoupons([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Coupons to advertise: the admin's ordered selection (kept to valid ones), or
  // — when nothing is selected — every valid active coupon (automatic).
  const featuredCoupons = useMemo(() => {
    const valid = coupons.filter((c) => isCouponValid(c));
    if (config.featuredCouponIds?.length) {
      return pickByIds(valid, config.featuredCouponIds);
    }
    return valid;
  }, [coupons, config.featuredCouponIds]);

  // Map of categoryId → name; products carry a numeric categoryId only.
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  // Discounted products, highest discount first — the automatic deal pool.
  const discountedProducts = useMemo(() => {
    return products
      .filter((p) => getProductMaxDiscount(p) > 0)
      .sort((a, b) => getProductMaxDiscount(b) - getProductMaxDiscount(a));
  }, [products]);

  // Deal of the Day: the admin's ordered picks, else the top 3 by discount.
  const dealOfTheDay = useMemo(() => {
    if (config.dealOfTheDayIds?.length) return pickByIds(products, config.dealOfTheDayIds);
    return discountedProducts.slice(0, 3);
  }, [products, discountedProducts, config.dealOfTheDayIds]);

  // Deals grid: the admin's ordered picks, else every discounted product.
  const gridProducts = useMemo(() => {
    if (config.featuredProductIds?.length) return pickByIds(products, config.featuredProductIds);
    return discountedProducts;
  }, [products, discountedProducts, config.featuredProductIds]);

  // Category tabs = real categories represented in the grid, in catalogue order.
  const dealCategories = useMemo(() => {
    const ids = new Set(gridProducts.map((p) => p.categoryId).filter((id) => id != null));
    return categories.filter((c) => ids.has(c.id));
  }, [gridProducts, categories]);

  // Filtered by active tab (tab value is a categoryId, or "all").
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return gridProducts;
    return gridProducts.filter((p) => p.categoryId === activeTab);
  }, [gridProducts, activeTab]);

  // If the active tab's category drops out of the deal set, fall back to "all".
  useEffect(() => {
    if (activeTab !== "all" && !dealCategories.some((c) => c.id === activeTab)) {
      setActiveTab("all");
    }
  }, [dealCategories, activeTab]);

  // Handlers
  const handleCopyCode = useCallback(async (code) => {
    const ok = await copyToClipboard(code);
    setCopied({ code, ok });
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied({ code: null, ok: true }), 2400);
  }, []);

  const handleAddToCart = useCallback(
    // buildCartItem produces the same id scheme (and default variant/price) the
    // product page uses, so offer adds merge with PDP adds instead of duplicating.
    (product) => addToCart(buildCartItem(product), 1),
    [addToCart]
  );

  const handleToggleWishlist = useCallback(
    (product) => {
      toggleWishlist(product);
    },
    [toggleWishlist]
  );

  // Spoken once per copy — never once per tick of the clock.
  const copyAnnouncement = copied.code
    ? copied.ok
      ? `Code ${copied.code} copied to your clipboard.`
      : `Could not copy ${copied.code}. Select the code and copy it manually.`
    : "";

  // ── Master toggle: page hidden ─────────────────────────────────────────────
  // While the config is still loading we show the head's own silhouette so a
  // disabled page never flashes its content first.
  if (configLoading) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <HeadSkeleton />
        </div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <section className={styles.state}>
            <TagMark />
            <p className={styles.eyebrow}>Offers</p>
            <h1 className={styles.stateTitle}>No Deals Right Now</h1>
            <p className={styles.stateText}>
              The offers desk is quiet for the moment. When the next markdowns are ready they
              will be posted here — the full collection stays open in the meantime.
            </p>
            <Link className={`sf-btn sf-btn--emerald ${styles.stateBtn}`} to="/products">
              Browse the Collection
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const showCountdown = config.timer?.enabled !== false && countdown.show;
  const timerEnded = config.timer?.enabled !== false && countdown.ended;
  const nothingToShow = !loading && gridProducts.length === 0 && dealOfTheDay.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      {/* One polite region, for the copy confirmations. The countdown is
          deliberately NOT live — a per-second announcement is unusable. */}
      <p className={styles.srOnly} role="status" aria-live="polite">
        {copyAnnouncement}
      </p>

      {/* ── 1. The opening band ───────────────────────────────────────────── */}
      <header className={styles.band}>
        <div className={styles.container}>
          <div className={styles.bandInner}>
            {config.hero?.tag && <p className={styles.eyebrow}>{config.hero.tag}</p>}
            <h1 className={styles.title}>{config.hero?.title || "Special Offers & Deals"}</h1>
            {config.hero?.subtitle && <p className={styles.lede}>{config.hero.subtitle}</p>}

            {showCountdown ? (
              <CountdownLine parts={countdown.parts} label="Ends in" />
            ) : timerEnded ? (
              <p className={styles.ended}>
                This offer window has closed. New markdowns are being prepared.
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className={styles.container}>
        {/* ── 2. The vouchers ────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="offers-vouchers">
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadText}>
              <p className={styles.eyebrow}>Vouchers</p>
              <h2 id="offers-vouchers" className={styles.sectionTitle}>
                Codes You Can Use
              </h2>
              <p className={styles.sectionLede}>
                Copy a code and apply it in the cart or at checkout. Every code listed here is
                live in our system — nothing is printed for show.
              </p>
            </div>
          </div>

          {loading ? (
            <div className={styles.voucherGrid}>
              {Array.from({ length: 3 }, (_, i) => (
                <VoucherSkeleton key={i} />
              ))}
            </div>
          ) : featuredCoupons.length > 0 ? (
            <div className={styles.voucherGrid}>
              {featuredCoupons.map((coupon) => {
                const isCopied = copied.code === coupon.code && copied.ok;
                return (
                  <article key={coupon.id ?? coupon.code} className={styles.voucher}>
                    <p className={styles.voucherFigure}>
                      <span className={styles.voucherValue}>{couponHeadline(coupon)}</span>
                      <span className={styles.voucherOff}>off</span>
                    </p>

                    {coupon.description && (
                      <p className={styles.voucherDesc}>{coupon.description}</p>
                    )}

                    {/* The small print — every row a condition checkout applies. */}
                    <ul className={styles.voucherTerms}>
                      {couponTerms(coupon).map((row) => (
                        <li key={row}>{row}</li>
                      ))}
                    </ul>

                    <div className={styles.voucherFoot}>
                      <code className={styles.voucherCode}>{coupon.code}</code>
                      <button
                        type="button"
                        className={`${styles.copyBtn} ${isCopied ? styles.copyBtnDone : ""}`}
                        onClick={() => handleCopyCode(coupon.code)}
                        aria-label={`Copy coupon code ${coupon.code}`}
                      >
                        {isCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Says nothing about the markdowns below — this note also shows on a
               page where nothing is reduced either. */
            <p className={styles.quietNote}>
              No codes are running at the moment — the prices shown are the prices you pay.
            </p>
          )}
        </section>

        {/* ── 3. The chosen (Deal of the Day) ────────────────────────────── */}
        {!loading && dealOfTheDay.length > 0 && (
          <section className={styles.section} aria-labelledby="offers-chosen">
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadText}>
                <p className={styles.eyebrow}>Chosen Today</p>
                <h2 id="offers-chosen" className={styles.sectionTitle}>
                  Deal of the Day
                </h2>
                <p className={styles.sectionLede}>
                  Put forward by the studio for this window, at the prices shown.
                </p>
              </div>
              {showCountdown && (
                <div className={styles.sectionHeadAside}>
                  <CountdownLine
                    parts={countdown.parts}
                    label="Ends in"
                    className={styles.countdownChip}
                  />
                </div>
              )}
            </div>

            <div className={styles.featureGrid}>
              {dealOfTheDay.map((product, idx) => (
                <DealFeature
                  key={product.id}
                  product={product}
                  categoryName={categoryMap[product.categoryId]}
                  onAddToCart={handleAddToCart}
                  index={idx}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. The markdowns ───────────────────────────────────────────── */}
        {!loading && gridProducts.length > 0 && (
          <section className={styles.section} aria-labelledby="offers-markdowns">
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadText}>
                <p className={styles.eyebrow}>The Markdowns</p>
                <h2 id="offers-markdowns" className={styles.sectionTitle}>
                  {dealCategories.length > 0 ? "Reduced by Category" : "Reduced Right Now"}
                </h2>
                <p className={styles.sectionLede} aria-live="polite">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "piece" : "pieces"} on this list
                  {activeTab !== "all" && categoryMap[activeTab]
                    ? ` in ${categoryMap[activeTab]}`
                    : ""}
                  .
                </p>
              </div>
            </div>

            {dealCategories.length > 0 && (
              <CategoryTabs
                categories={dealCategories}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            )}

            <div className={styles.cardGrid}>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categoryMap[product.categoryId]}
                    index={index}
                    reduceMotion={reduceMotion}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={isInWishlist(product.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* ── Loading: the wall's silhouette ─────────────────────────────── */}
        {loading && (
          <section className={styles.section}>
            <div className={styles.cardGrid}>
              {Array.from({ length: 8 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Nothing reduced ────────────────────────────────────────────── */}
        {nothingToShow && (
          <section className={styles.state}>
            <TagMark />
            <p className={styles.eyebrow}>The Markdowns</p>
            <h2 className={styles.stateTitle}>Nothing Is Reduced Today</h2>
            <p className={styles.stateText}>
              No piece in the catalogue is currently marked below its original price. Rather
              than pad this page, we would rather show you the whole collection.
            </p>
            <button
              type="button"
              className={`sf-btn sf-btn--emerald ${styles.stateBtn}`}
              onClick={() => navigate("/products")}
            >
              Browse the Collection
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default SpecialOffers;
