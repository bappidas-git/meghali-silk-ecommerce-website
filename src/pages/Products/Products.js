import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import apiService from "../../services/api";
import ProductCard from "../../components/storefront/ProductCard";
import {
  categoryParam,
  resolveCategory,
  getCategoryScopeIds,
  orderCategoriesHierarchically,
} from "../../utils/categories";
import { getProductMinPrice, getDeviceType } from "../../utils/helpers";
import { overlay, panel, reveal } from "../../theme/motion";
import styles from "./Products.module.css";

// =============================================================================
// PRODUCTS — the collection gallery
// =============================================================================
// The catalogue read as a gallery wall rather than a marketplace results page:
// a breadcrumb, a serif collection title with one quiet line of counts, a single
// hairline rule carrying Filter / chips / Sort, and then nothing but garments on
// the ivory ground. No sidebar, no card frames, no boxes — the photographs and
// the whitespace between them ARE the layout.
//
// WHAT DID NOT CHANGE (and must not)
//   The URL is still the source of truth and its contract is byte-for-byte the
//   one every deep link in the Header, Home and Footer already writes:
//     ?category=<comma slugs>  ?search=  ?sort=  ?page=  ?per_page=
//     ?min_price=  ?max_price=
//   defaults omitted, legacy ?category=<id> canonicalised to its slug, every
//   write a `replace: true`. Filtering, the parent-includes-children category
//   scope, the per-category counts, the session-only facets (fabric / rating /
//   discount / availability / brand, deliberately NOT in the URL), page
//   clamping and the post-commit scroll are all unchanged code — this prompt
//   restyled the page around them.
//
//   ONE param has since joined that contract: ?highlight=<comma flags>, for the
//   merchant's Visibility & Flags switches. It is URL-backed rather than
//   session-only precisely so Home's Featured and Trending rails have a real
//   "View all" to point at, and so a flagged edit is a shareable link.
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
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Avg. Customer Rating" },
  { value: "popularity", label: "Popularity" },
];

// Accept common sort aliases from deep links (e.g. ?sort=price_asc) and map them
// to canonical option values; anything unrecognised falls back to "relevance".
const SORT_ALIASES = {
  price_asc: "price-low",
  "price-asc": "price-low",
  price_low: "price-low",
  lowtohigh: "price-low",
  price_desc: "price-high",
  "price-desc": "price-high",
  price_high: "price-high",
  hightolow: "price-high",
  latest: "newest",
  new: "newest",
  popular: "popularity",
  "best-rated": "rating",
};

const normalizeSort = (raw) => {
  if (!raw) return "relevance";
  const v = String(raw).toLowerCase();
  if (SORT_OPTIONS.some((o) => o.value === v)) return v;
  return SORT_ALIASES[v] || "relevance";
};

// Bounds only — the labels are built at render in the store's own currency
// (Settings > General), so switching currency re-letters the chips.
const PRICE_RANGES = [
  { min: 0, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: Infinity },
];

const RATING_OPTIONS = [4, 3, 2, 1];
const DISCOUNT_OPTIONS = [50, 30, 20, 10];

// The "Highlights" facet — the three switches a merchant throws in
// Admin → Products → Visibility & Flags, offered here as a filter so they are
// something a shopper can actually browse by rather than only a mark on a card.
// `key` IS the product field and IS the URL token, so ?highlight=trending,hot
// reads the way it looks. Matching is `=== true`, the same honest-data rule the
// PREMIUM ribbon follows, and an unknown token simply matches nothing.
const HIGHLIGHT_OPTIONS = [
  { key: "featured", label: "Featured" },
  { key: "trending", label: "Trending" },
  { key: "hot", label: "Hot" },
];

const HIGHLIGHT_KEYS = HIGHLIGHT_OPTIONS.map((h) => h.key);

const parseHighlights = (raw) =>
  (raw ? String(raw).split(",") : [])
    .map((t) => t.trim().toLowerCase())
    .filter((t) => HIGHLIGHT_KEYS.includes(t));

const PER_PAGE_OPTIONS = [12, 24, 48];

// The panel's own focus ring, for the Tab trap. Same selector list the cart tray
// uses; the panel itself is excluded by the [tabindex="-1"] guard.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// The Assamese fabric vocabulary — the "Fabric" facet. Labels and match tokens
// mirror `variants[].attributes.Fabric` in the catalogue: the four silks the
// collections are organised by (Muga, Pat, Eri, Toss), the cotton-and-kesapat
// weave, and the handloom cotton the gamosa gift sets are woven from. Order
// here is the display order — silks first, then the cottons.
//
// The facet is still DERIVED FROM THE LOADED DATA, never from this list alone: a
// family only appears when at least one real product exposes it (see
// `availableFabrics`), so nothing is fabricated and the whole facet — chips and
// drawer section — disappears when no product carries a fabric.
//
// Each `match` token is a lower-cased substring tested against the product's
// fabric strings AND tags, joined into one haystack. The tokens are whole woven
// names on purpose: the catalogue also tags single words ("muga", "pat", "eri",
// "cotton", "handloom"), so a bare "muga" would drag every Muga-tagged blend
// into the pure-Muga family, and two adjacent tags would join across the
// boundary into a phantom phrase. Matching the full name keeps each garment in
// exactly the families it is actually made of.
const FABRIC_FAMILIES = [
  { label: "Muga Silk", match: ["muga silk"] },
  { label: "Pat Silk", match: ["pat silk"] },
  { label: "Eri Silk", match: ["eri silk"] },
  { label: "Toss Silk", match: ["toss silk"] },
  { label: "Cotton Kesapat", match: ["cotton kesapat"] },
  { label: "Handloom Cotton", match: ["handloom cotton"] },
];

// Collect a product's fabric "haystack" (variant Fabric attributes + tags) once,
// lower-cased, then resolve to the family labels it satisfies.
const productFabricLabels = (product) => {
  const hay = [];
  (product.variants || []).forEach((v) => {
    const f = v?.attributes?.Fabric;
    if (f) hay.push(String(f).toLowerCase());
  });
  (product.tags || []).forEach((t) => hay.push(String(t).toLowerCase()));
  const joined = hay.join(" ");
  if (!joined) return [];
  return FABRIC_FAMILIES.filter((fam) =>
    fam.match.some((token) => joined.includes(token))
  ).map((fam) => fam.label);
};

// ---------------------------------------------------------------------------
// Skeleton cell — the ProductCard's silhouette drawn on the shared
// `.sf-skeleton` primitive: a 3:4 plate, then the same short text stack. No
// frame, because the real card has none either.
// ---------------------------------------------------------------------------
const SkeletonCard = () => (
  <div className={styles.skelCell} aria-hidden="true">
    <div className={`sf-skeleton ${styles.skelMedia}`} />
    <div className={styles.skelBody}>
      <div className={`sf-skeleton sf-skeleton--text ${styles.skelBrand}`} />
      <div className={`sf-skeleton sf-skeleton--text ${styles.skelName}`} />
      <div className={`sf-skeleton sf-skeleton--text ${styles.skelStars}`} />
      <div className={`sf-skeleton sf-skeleton--text ${styles.skelPrice}`} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Star icons (inline SVG so we don't depend on icon libraries). Colour comes
// from the surrounding `.stars` class (var(--sf-color-star)) via currentColor —
// no hex. Used by the rating FACET only; the grid cards carry their own stars.
// ---------------------------------------------------------------------------
const StarIcon = ({ filled, half }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    {half ? (
      <>
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill="url(#halfStar)"
        />
      </>
    ) : (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    )}
  </svg>
);

const RatingStars = ({ value = 0 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(value)) stars.push(<StarIcon key={i} filled />);
    else if (i - 0.5 <= value) stars.push(<StarIcon key={i} half />);
    else stars.push(<StarIcon key={i} />);
  }
  return <span className={styles.stars}>{stars}</span>;
};

// ---------------------------------------------------------------------------
// Marks — hairline glyphs, all drawn at stroke 1.25–1.5 so they sit beside the
// tracked capitals rather than shouting over them.
// ---------------------------------------------------------------------------
const FilterMark = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
    <line x1="3" y1="7" x2="21" y2="7" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="17" x2="21" y2="17" />
    <circle cx="9" cy="7" r="2.25" fill="var(--sf-color-bg)" />
    <circle cx="16" cy="12" r="2.25" fill="var(--sf-color-bg)" />
    <circle cx="7" cy="17" r="2.25" fill="var(--sf-color-bg)" />
  </svg>
);

const CloseMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// The removal glyph inside an ACTIVE chip. Decorative: the chip itself is the
// toggle, so the × is never a nested button — clicking or Entering the chip is
// what lifts the filter, from mouse and keyboard alike.
const RemoveMark = () => (
  <svg className={styles.chipRemove} width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="19" y1="5" x2="5" y2="19" />
    <line x1="5" y1="5" x2="19" y2="19" />
  </svg>
);

const TickMark = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18" /></svg>
);

// ---------------------------------------------------------------------------
// Empty state — a loom with the warp strung and nothing woven on it yet. Line
// art in the brand's own drawing style: hairline strokes, one gold thread, no
// fills. Coloured through the local --empty-* aliases, which resolve to tokens,
// so it inverts with the rest of the page.
// ---------------------------------------------------------------------------
const EmptyIllustration = () => (
  <svg className={styles.stateArt} width="188" height="132" viewBox="0 0 188 132" fill="none" aria-hidden="true">
    <g stroke="var(--empty-line)" strokeWidth="1" strokeLinecap="round">
      {/* the two beams */}
      <line x1="26" y1="26" x2="162" y2="26" />
      <line x1="26" y1="106" x2="162" y2="106" />
      {/* the uprights */}
      <line x1="34" y1="14" x2="34" y2="118" />
      <line x1="154" y1="14" x2="154" y2="118" />
      {/* the warp, strung and waiting */}
      <line x1="52" y1="26" x2="52" y2="106" />
      <line x1="66" y1="26" x2="66" y2="106" />
      <line x1="80" y1="26" x2="80" y2="106" />
      <line x1="94" y1="26" x2="94" y2="106" />
      <line x1="108" y1="26" x2="108" y2="106" />
      <line x1="122" y1="26" x2="122" y2="106" />
      <line x1="136" y1="26" x2="136" y2="106" />
    </g>
    {/* one gold weft thread, laid across but not yet beaten in */}
    <path
      d="M40 74 C 66 64, 92 84, 118 74 S 158 66, 168 78"
      stroke="var(--empty-gold)"
      strokeWidth="1.25"
      strokeLinecap="round"
      fill="none"
    />
    {/* the shuttle, resting */}
    <path
      d="M150 84 L166 78 L182 84 L166 90 Z"
      stroke="var(--empty-gold)"
      strokeWidth="1"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// Error state mark — a hairline circle with the classic notice stroke.
const ErrorIllustration = () => (
  <svg className={styles.stateArt} width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--empty-line)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <line x1="12" y1="7.5" x2="12" y2="12.5" stroke="var(--empty-gold)" />
    <line x1="12" y1="16" x2="12.01" y2="16" stroke="var(--empty-gold)" />
  </svg>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const shouldReduceMotion = useReducedMotion();
  const { formatPrice } = useStoreSettings();

  // Whole rupees/dollars — a filter chip has no room for decimals.
  const priceRanges = useMemo(() => {
    const money = (n) => formatPrice(n, { decimals: 0 });
    return PRICE_RANGES.map((range) => ({
      ...range,
      label:
        range.max === Infinity
          ? `Above ${money(range.min)}`
          : range.min === 0
          ? `Under ${money(range.max)}`
          : `${money(range.min)} – ${money(range.max)}`,
    }));
  }, [formatPrice]);

  // ---- Data state ---
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ---- UI state ----
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ---- Refs ----
  const mainRef = useRef(null); // top of results region, for page-change scroll
  const mobileTriggerRef = useRef(null); // restore focus here when the sheet closes
  const sheetCloseRef = useRef(null); // focus this when the sheet opens
  const sheetRef = useRef(null); // the panel itself — the Tab trap's boundary
  const pendingScrollRef = useRef(false); // set by pagination, consumed post-commit

  // ---- Read URL params ----
  const urlCategory = searchParams.get("category") || "";
  const urlSearch = searchParams.get("search") || "";
  const urlSort = normalizeSort(searchParams.get("sort"));
  const urlPage = parseInt(searchParams.get("page"), 10) || 1;
  const urlPerPage = parseInt(searchParams.get("per_page"), 10);
  const urlMinPrice = searchParams.get("min_price") || "";
  const urlMaxPrice = searchParams.get("max_price") || "";
  const urlHighlight = searchParams.get("highlight") || "";

  // ---- Filter state (local, synced to URL) ----
  const [selectedCategories, setSelectedCategories] = useState(() => (urlCategory ? urlCategory.split(",") : []));
  const [minPrice, setMinPrice] = useState(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
  const [minRating, setMinRating] = useState(0);
  const [minDiscount, setMinDiscount] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedFabrics, setSelectedFabrics] = useState([]); // session-only facet
  const [selectedHighlights, setSelectedHighlights] = useState(() =>
    parseHighlights(urlHighlight)
  );
  const [sortBy, setSortBy] = useState(urlSort);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [perPage, setPerPage] = useState(() =>
    PER_PAGE_OPTIONS.includes(urlPerPage) ? urlPerPage : 12
  );

  // ---- Fetch data on mount (retryable from the error state) ----
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [productsData, categoriesData] = await Promise.all([
        apiService.products.getAll(),
        apiService.categories.getAll(),
      ]);
      setAllProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAllProducts([]);
      setCategories([]);
      // Distinguish "couldn't load" from "no matches" — the grid renders a
      // retryable error panel instead of the misleading empty state.
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // ---- Keep filter state in sync with the URL (the URL is the source of truth) ----
  // Re-derive every URL-backed filter whenever the query string (or the loaded
  // categories) changes. This fires not only on first mount / a deep link, but
  // ALSO when a header, main-menu, sidebar, homepage or breadcrumb link is
  // clicked while we are already on this page: React Router keeps <Products>
  // mounted on a query-only change, so without this the listing would never
  // react to the new category (the long-standing "URL changes but nothing
  // re-renders / the checkbox stays stuck" bug). Category tokens are normalized
  // to their canonical slug, and a legacy numeric-id deep link (?category=3) is
  // rewritten to the slug form in place. Every setter is guarded against its
  // current value, so re-applying a value we just pushed to the URL can't loop.
  useEffect(() => {
    const tokens = urlCategory ? urlCategory.split(",").filter(Boolean) : [];
    const normalized = categories.length
      ? tokens.map((t) => {
          const cat = resolveCategory(t, categories);
          return cat ? cat.slug : t;
        })
      : tokens;

    setSelectedCategories((prev) =>
      prev.join(",") === normalized.join(",") ? prev : normalized
    );
    // Canonicalize a legacy ?category=<id> link to its slug form in the URL.
    if (categories.length && normalized.join(",") !== tokens.join(",")) {
      syncUrlParams({
        category: normalized,
        search: urlSearch,
        sort: urlSort,
        page: urlPage,
        per_page: PER_PAGE_OPTIONS.includes(urlPerPage) ? urlPerPage : 12,
        min_price: urlMinPrice,
        max_price: urlMaxPrice,
      });
    }

    setMinPrice((prev) => (prev === urlMinPrice ? prev : urlMinPrice));
    setMaxPrice((prev) => (prev === urlMaxPrice ? prev : urlMaxPrice));
    setSelectedHighlights((prev) => {
      const next = parseHighlights(urlHighlight);
      return prev.join(",") === next.join(",") ? prev : next;
    });
    setSortBy((prev) => (prev === urlSort ? prev : urlSort));
    setCurrentPage((prev) => (prev === urlPage ? prev : urlPage));
    setPerPage((prev) => {
      const next = PER_PAGE_OPTIONS.includes(urlPerPage) ? urlPerPage : 12;
      return prev === next ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory, urlSearch, urlSort, urlPage, urlPerPage, urlMinPrice, urlMaxPrice, urlHighlight, categories]);

  // ---- Sync URL params when filters change ----
  // NOTE: any param mutated in the same handler MUST be passed as an override —
  // the closure below still holds this render's (pre-update) state values.
  const syncUrlParams = useCallback(
    (overrides = {}) => {
      const merged = {
        category: overrides.category !== undefined ? overrides.category : selectedCategories,
        search: overrides.search !== undefined ? overrides.search : urlSearch,
        sort: overrides.sort !== undefined ? overrides.sort : sortBy,
        page: overrides.page !== undefined ? overrides.page : currentPage,
        per_page: overrides.per_page !== undefined ? overrides.per_page : perPage,
        min_price: overrides.min_price !== undefined ? overrides.min_price : minPrice,
        max_price: overrides.max_price !== undefined ? overrides.max_price : maxPrice,
        highlight:
          overrides.highlight !== undefined ? overrides.highlight : selectedHighlights,
      };
      const params = new URLSearchParams();
      if (merged.category && merged.category.length) params.set("category", Array.isArray(merged.category) ? merged.category.join(",") : merged.category);
      if (merged.search) params.set("search", merged.search);
      if (merged.sort && merged.sort !== "relevance") params.set("sort", merged.sort);
      if (merged.page > 1) params.set("page", String(merged.page));
      if (merged.per_page && Number(merged.per_page) !== 12) params.set("per_page", String(merged.per_page));
      if (merged.min_price) params.set("min_price", merged.min_price);
      if (merged.max_price) params.set("max_price", merged.max_price);
      if (merged.highlight && merged.highlight.length)
        params.set(
          "highlight",
          Array.isArray(merged.highlight) ? merged.highlight.join(",") : merged.highlight
        );
      setSearchParams(params, { replace: true });
    },
    [selectedCategories, urlSearch, sortBy, currentPage, perPage, minPrice, maxPrice, selectedHighlights, setSearchParams]
  );

  // Reset to page 1 and drop the stale page param from the URL. Use this for the
  // session-only filters (rating/discount/in-stock/brand/fabric) that are not URL
  // params themselves — they only need the page reset reflected in the URL.
  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
    syncUrlParams({ page: 1 });
  }, [syncUrlParams]);

  // ---- Derived: brands extracted from loaded products ----
  const availableBrands = useMemo(() => {
    const brands = new Set();
    allProducts.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [allProducts]);

  // ---- Derived: fabric families present in the loaded catalogue ----
  // Same pattern as availableBrands: a memo over allProducts. Empty when no
  // product exposes a fabric, which hides the whole "Fabric" facet (chip + sheet
  // section). Display order follows FABRIC_FAMILIES.
  const availableFabrics = useMemo(() => {
    const present = new Set();
    allProducts.forEach((p) => {
      productFabricLabels(p).forEach((label) => present.add(label));
    });
    return FABRIC_FAMILIES.map((f) => f.label).filter((label) => present.has(label));
  }, [allProducts]);

  // ---- Derived: highlights the VISIBLE catalogue actually carries ----
  // Same pattern again, plus the count each flag would return. A flag no live
  // product carries is dropped rather than offered as a dead end, so the whole
  // facet disappears on a catalogue where the merchant has set no flags at all.
  const availableHighlights = useMemo(
    () =>
      HIGHLIGHT_OPTIONS.map((h) => ({
        ...h,
        count: allProducts.filter((p) => p[h.key] === true).length,
      })).filter((h) => h.count > 0),
    [allProducts]
  );

  // ---- Derived: product count per category id ----
  // Counts honour the parent-includes-children rule: a category's count is the
  // number of products in that category PLUS all of its descendants — i.e. the
  // exact result set you get by selecting it. (A parent therefore shows an
  // aggregate that overlaps its children's counts, which is the standard,
  // expected behaviour.)
  const categoryCounts = useMemo(() => {
    const direct = new Map();
    allProducts.forEach((p) => {
      const key = String(p.categoryId);
      direct.set(key, (direct.get(key) || 0) + 1);
    });
    const counts = new Map();
    categories.forEach((cat) => {
      let total = 0;
      getCategoryScopeIds(cat.id, categories).forEach((id) => {
        total += direct.get(String(id)) || 0;
      });
      counts.set(String(cat.id), total);
    });
    return counts;
  }, [allProducts, categories]);

  // ---- Derived: categories ordered for the filter list (parents → children) ----
  const orderedCategories = useMemo(
    () => orderCategoriesHierarchically(categories),
    [categories]
  );

  // Top-level categories only, for the compact chip row. The sheet keeps the full
  // hierarchical list (with indentation + counts).
  const topCategories = useMemo(
    () => orderedCategories.ordered.filter((c) => !orderedCategories.depthOf(c.id)),
    [orderedCategories]
  );

  // ---- Filtering + Sorting (client-side) ----
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search
    if (urlSearch) {
      const q = urlSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Categories — products carry a numeric `categoryId`; the selected tokens
    // are canonical slugs (legacy ids still resolve). Each selected category is
    // expanded to its own id PLUS all descendant ids, so selecting a PARENT
    // includes its children's products (parent-includes-children rule): picking
    // "Electronics" returns Laptops/Audio/Smartphones items too, and picking
    // "Women's Ethnic Wear" — which has no products of its own — returns its
    // Sarees/Kurtas items. Picking a leaf category returns just that category.
    if (selectedCategories.length > 0) {
      const wantedIds = new Set();
      selectedCategories.forEach((token) => {
        const cat = resolveCategory(token, categories);
        if (!cat) return;
        getCategoryScopeIds(cat.id, categories).forEach((id) => wantedIds.add(id));
      });
      if (wantedIds.size > 0) {
        result = result.filter((p) => wantedIds.has(String(p.categoryId)));
      }
    }

    // Price range
    const pMin = parseFloat(minPrice);
    const pMax = parseFloat(maxPrice);
    if (!isNaN(pMin) && pMin > 0) {
      result = result.filter((p) => getProductMinPrice(p).sellingPrice >= pMin);
    }
    if (!isNaN(pMax) && pMax > 0) {
      result = result.filter((p) => getProductMinPrice(p).sellingPrice <= pMax);
    }

    // Rating
    if (minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= minRating);
    }

    // Discount
    if (minDiscount > 0) {
      result = result.filter((p) => getProductMinPrice(p).discount >= minDiscount);
    }

    // In stock
    if (inStockOnly) {
      result = result.filter((p) => (p.stock === undefined ? true : p.stock > 0));
    }

    // Brands
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Fabric (silk family) — derived client-side from variants/tags; a product
    // passes if it satisfies ANY selected family.
    if (selectedFabrics.length > 0) {
      result = result.filter((p) => {
        const labels = productFabricLabels(p);
        return selectedFabrics.some((f) => labels.includes(f));
      });
    }

    // Highlights — the merchant's own Featured / Trending / Hot switches. OR
    // within the facet, like every other multi-select here: a product passes if
    // it carries ANY of the selected flags.
    if (selectedHighlights.length > 0) {
      result = result.filter((p) => selectedHighlights.some((k) => p[k] === true));
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => getProductMinPrice(a).sellingPrice - getProductMinPrice(b).sellingPrice);
        break;
      case "price-high":
        result.sort((a, b) => getProductMinPrice(b).sellingPrice - getProductMinPrice(a).sellingPrice);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "popularity":
        result.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, categories, urlSearch, selectedCategories, minPrice, maxPrice, minRating, minDiscount, inStockOnly, selectedBrands, selectedFabrics, selectedHighlights, sortBy]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((safePage - 1) * perPage, safePage * perPage),
    [filteredProducts, safePage, perPage]
  );

  // Keep currentPage within range whenever the result set shrinks (e.g. filters
  // applied, or a deep-linked page that no longer exists). The value guard
  // (currentPage !== safePage) terminates after one correction, so adding
  // syncUrlParams to the deps cannot loop.
  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
      syncUrlParams({ page: safePage });
    }
  }, [safePage, currentPage, syncUrlParams]);

  // Scroll the results back to the top after a pagination/per-page change. Runs
  // post-commit (so the new page's layout is settled and the smooth scroll isn't
  // cancelled by the re-render), and only when a pager action requested it — not
  // on every filter change. Offset clears the fixed header (varies by device).
  useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    const offsetByDevice = { mobile: 70, tablet: 114, desktop: 150 };
    const offset = offsetByDevice[getDeviceType()] || 0;
    const el = mainRef.current;
    const y = el ? el.getBoundingClientRect().top + window.scrollY - offset : 0;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }, [safePage, perPage]);

  // ---- Mobile filter sheet: lock body scroll, close on Escape, manage focus ----
  useEffect(() => {
    if (!mobileFiltersOpen) return undefined;
    // The trigger button is persistently mounted, so capturing it here is safe
    // and keeps the effect-cleanup ref-stability lint rule happy.
    const trigger = mobileTriggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileFiltersOpen(false);
        return;
      }
      // Cycle Tab inside the panel — the same ring the cart tray uses, so a
      // keyboard user can never tab out into the page behind the scrim.
      if (e.key !== "Tab") return;
      const panel = sheetRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active);
      if (e.shiftKey && (outside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = setTimeout(() => sheetCloseRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(focusTimer);
      // Return focus to the trigger so keyboard users aren't dropped at <body>.
      trigger?.focus();
    };
  }, [mobileFiltersOpen]);

  // ---- Helpers ----
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    minRating > 0 ||
    minDiscount > 0 ||
    inStockOnly ||
    selectedBrands.length > 0 ||
    selectedFabrics.length > 0 ||
    selectedHighlights.length > 0 ||
    sortBy !== "relevance";

  // Whether anything is constraining the result set — includes the search query
  // (set from the header), so the empty state always offers a way out.
  const hasAnyConstraint = hasActiveFilters || Boolean(urlSearch);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setMinDiscount(0);
    setInStockOnly(false);
    setSelectedBrands([]);
    setSelectedFabrics([]);
    setSelectedHighlights([]);
    setSortBy("relevance");
    setCurrentPage(1);
    // Pass every reset value as an explicit override so no stale param survives.
    // per_page is intentionally preserved (it's a view preference, not a filter).
    syncUrlParams({
      category: [],
      search: "",
      sort: "relevance",
      min_price: "",
      max_price: "",
      highlight: [],
      page: 1,
    });
  }, [syncUrlParams]);

  const handleCategoryToggle = useCallback(
    (slug) => {
      setSelectedCategories((prev) => {
        const next = prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug];
        setCurrentPage(1);
        syncUrlParams({ category: next, page: 1 });
        return next;
      });
    },
    [syncUrlParams]
  );

  const handlePriceRangeClick = useCallback(
    (range) => {
      const newMin = String(range.min);
      const newMax = range.max === Infinity ? "" : String(range.max);
      setMinPrice(newMin);
      setMaxPrice(newMax);
      setCurrentPage(1);
      syncUrlParams({ min_price: newMin, max_price: newMax, page: 1 });
    },
    [syncUrlParams]
  );

  // A price chip reflects the canonical min/max for its range. Clicking the
  // already-active chip clears the price filter (chips toggle).
  const isPriceRangeActive = useCallback(
    (range) => {
      const max = range.max === Infinity ? "" : String(range.max);
      return minPrice === String(range.min) && maxPrice === max;
    },
    [minPrice, maxPrice]
  );

  const handlePriceRangeToggle = useCallback(
    (range) => {
      if (isPriceRangeActive(range)) {
        setMinPrice("");
        setMaxPrice("");
        setCurrentPage(1);
        syncUrlParams({ min_price: "", max_price: "", page: 1 });
      } else {
        handlePriceRangeClick(range);
      }
    },
    [isPriceRangeActive, handlePriceRangeClick, syncUrlParams]
  );

  const handlePriceApply = useCallback(() => {
    // Sanitize: ignore NaN / non-positive values, and swap only when BOTH bounds
    // are valid finite numbers and inverted. An empty max means "no upper bound"
    // and must not be coerced to 0.
    const lo = parseFloat(minPrice);
    const hi = parseFloat(maxPrice);
    const loValid = !isNaN(lo) && lo > 0;
    const hiValid = !isNaN(hi) && hi > 0;
    let nextMin = loValid ? lo : "";
    let nextMax = hiValid ? hi : "";
    if (loValid && hiValid && lo > hi) {
      nextMin = hi;
      nextMax = lo;
    }
    const minStr = nextMin === "" ? "" : String(nextMin);
    const maxStr = nextMax === "" ? "" : String(nextMax);
    setMinPrice(minStr);
    setMaxPrice(maxStr);
    setCurrentPage(1);
    syncUrlParams({ min_price: minStr, max_price: maxStr, page: 1 });
  }, [minPrice, maxPrice, syncUrlParams]);

  const handleSortChange = useCallback(
    (value) => {
      setSortBy(value);
      setCurrentPage(1);
      syncUrlParams({ sort: value, page: 1 });
    },
    [syncUrlParams]
  );

  const handlePageChange = useCallback(
    (page) => {
      const p = Math.max(1, Math.min(page, totalPages));
      pendingScrollRef.current = true; // scroll handled post-commit (see effect)
      setCurrentPage(p);
      syncUrlParams({ page: p });
    },
    [totalPages, syncUrlParams]
  );

  const handlePerPageChange = useCallback(
    (value) => {
      pendingScrollRef.current = true;
      setPerPage(value);
      setCurrentPage(1);
      syncUrlParams({ per_page: value, page: 1 });
    },
    [syncUrlParams]
  );

  // Select semantics (value, or 0 to clear). onChange handles keyboard + click;
  // a paired onClick clears when the already-selected radio is re-clicked.
  const handleRatingChange = useCallback(
    (value) => {
      setMinRating(value);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const handleDiscountChange = useCallback(
    (value) => {
      setMinDiscount(value);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const handleInStockToggle = useCallback(() => {
    setInStockOnly((v) => !v);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleBrandToggle = useCallback(
    (brand) => {
      setSelectedBrands((prev) =>
        prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
      );
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const handleFabricToggle = useCallback(
    (fabric) => {
      setSelectedFabrics((prev) =>
        prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric]
      );
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  // URL-backed, so it follows the category pattern rather than the session-only
  // one: push the NEXT value through syncUrlParams from inside the updater,
  // because the callback still closes over this render's state.
  const handleHighlightToggle = useCallback(
    (key) => {
      setSelectedHighlights((prev) => {
        const next = prev.includes(key)
          ? prev.filter((h) => h !== key)
          : [...prev, key];
        setCurrentPage(1);
        syncUrlParams({ highlight: next, page: 1 });
        return next;
      });
    },
    [syncUrlParams]
  );

  // ---- Category name helper ----
  const getCategoryName = useCallback(
    (slug) => {
      const cat = categories.find(
        (c) => c.slug === slug || String(c.id) === String(slug)
      );
      return cat ? cat.name : slug;
    },
    [categories]
  );

  // ---- Breadcrumb ----
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: "Home", path: "/" },
      { label: "Products", path: "/products" },
    ];
    if (selectedCategories.length === 1) {
      items.push({ label: getCategoryName(selectedCategories[0]) });
    }
    return items;
  }, [selectedCategories, getCategoryName]);

  // ---- Results heading: query echo, single-category name, or a brand default --
  const resultsHeading = useMemo(() => {
    if (urlSearch) {
      return (
        <>
          Results for <span className={styles.resultsQuery}>&ldquo;{urlSearch}&rdquo;</span>
        </>
      );
    }
    if (selectedCategories.length === 1) {
      return getCategoryName(selectedCategories[0]);
    }
    return "All Silk";
  }, [urlSearch, selectedCategories, getCategoryName]);

  // ---- Live result summary (bound to the real filtered set) ----
  const resultSummary = useMemo(() => {
    if (loading) return "Loading products…";
    if (fetchError) return "Couldn't load products";
    if (filteredProducts.length === 0) return "No products found";
    if (filteredProducts.length > perPage) {
      return (
        <>
          Showing{" "}
          <strong>
            {(safePage - 1) * perPage + 1}&ndash;
            {Math.min(safePage * perPage, filteredProducts.length)}
          </strong>{" "}
          of <strong>{filteredProducts.length}</strong> products
        </>
      );
    }
    return (
      <>
        Showing <strong>{filteredProducts.length}</strong>{" "}
        {filteredProducts.length === 1 ? "product" : "products"}
      </>
    );
  }, [loading, fetchError, filteredProducts.length, perPage, safePage]);

  // ---- Pagination range ----
  const paginationRange = useMemo(() => {
    const range = [];
    const delta = 2;
    const left = Math.max(2, safePage - delta);
    const right = Math.min(totalPages - 1, safePage + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);

    return range;
  }, [safePage, totalPages]);

  // ---- Active facet count for the toolbar's Filter button -------------------
  // Display only — it counts the constraints a shopper has placed on the RESULT
  // SET, so sort (a view preference, not a filter) is deliberately excluded and
  // a price range counts once however it was set.
  const activeFilterCount = useMemo(() => {
    let n =
      selectedCategories.length +
      selectedFabrics.length +
      selectedBrands.length +
      selectedHighlights.length;
    if (minPrice !== "" || maxPrice !== "") n += 1;
    if (minRating > 0) n += 1;
    if (minDiscount > 0) n += 1;
    if (inStockOnly) n += 1;
    return n;
  }, [
    selectedCategories,
    selectedFabrics,
    selectedBrands,
    selectedHighlights,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    inStockOnly,
  ]);

  // The eyebrow above the collection title — the small tracked line that names
  // what kind of page this is before the serif says which one.
  const eyebrow = urlSearch ? "Search" : "The Collection";

  // ---- Full facet set (the drawer body) ----
  const renderFilters = () => (
    <div className={styles.facets}>
      {/* Categories — hierarchical, each count already includes its children */}
      <section className={styles.facet}>
        <h3 className={styles.facetTitle}>Categories</h3>
        <div className={styles.facetList}>
          {orderedCategories.ordered.map((cat) => {
            const depth = orderedCategories.depthOf(cat.id);
            return (
              <label
                key={cat.id || cat.slug}
                className={styles.option}
                style={depth ? { paddingLeft: depth * 16 } : undefined}
              >
                <input
                  type="checkbox"
                  className={styles.control}
                  checked={selectedCategories.some(
                    (t) => t === cat.slug || String(t) === String(cat.id)
                  )}
                  onChange={() => handleCategoryToggle(categoryParam(cat))}
                />
                <span className={styles.box} aria-hidden="true">
                  <TickMark />
                </span>
                <span className={`${styles.optionText} ${depth ? styles.optionChild : ""}`}>
                  {cat.name}
                </span>
                <span className={styles.optionCount}>
                  {categoryCounts.get(String(cat.id)) || 0}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Price — four quick ranges, then the manual pair */}
      <section className={styles.facet}>
        <h3 className={styles.facetTitle}>Price</h3>
        <div className={styles.rangeChips}>
          {priceRanges.map((range) => {
            const active = isPriceRangeActive(range);
            return (
              <button
                key={range.label}
                type="button"
                className={`sf-chip ${active ? "sf-chip--active" : ""} ${styles.rangeChip}`}
                onClick={() => handlePriceRangeToggle(range)}
                aria-pressed={active}
              >
                {range.label}
              </button>
            );
          })}
        </div>
        <div className={styles.priceRow}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={styles.priceInput}
            aria-label="Minimum price"
          />
          <span className={styles.priceDash} aria-hidden="true">
            —
          </span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={styles.priceInput}
            aria-label="Maximum price"
          />
          <button type="button" className={styles.priceGo} onClick={handlePriceApply}>
            Go
          </button>
        </div>
      </section>

      {/* Highlights — the merchant's Visibility & Flags switches, present only
          when the live catalogue actually carries one of them */}
      {availableHighlights.length > 0 && (
        <section className={styles.facet}>
          <h3 className={styles.facetTitle}>Highlights</h3>
          <div className={styles.facetList}>
            {availableHighlights.map((h) => (
              <label key={h.key} className={styles.option}>
                <input
                  type="checkbox"
                  className={styles.control}
                  checked={selectedHighlights.includes(h.key)}
                  onChange={() => handleHighlightToggle(h.key)}
                />
                <span className={styles.box} aria-hidden="true">
                  <TickMark />
                </span>
                <span className={styles.optionText}>{h.label}</span>
                <span className={styles.optionCount}>{h.count}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Fabric — present only when the catalogue actually exposes one */}
      {availableFabrics.length > 0 && (
        <section className={styles.facet}>
          <h3 className={styles.facetTitle}>Fabric</h3>
          <div className={styles.facetList}>
            {availableFabrics.map((fabric) => (
              <label key={fabric} className={styles.option}>
                <input
                  type="checkbox"
                  className={styles.control}
                  checked={selectedFabrics.includes(fabric)}
                  onChange={() => handleFabricToggle(fabric)}
                />
                <span className={styles.box} aria-hidden="true">
                  <TickMark />
                </span>
                <span className={styles.optionText}>{fabric}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Customer rating */}
      <section className={styles.facet}>
        <h3 className={styles.facetTitle}>Customer Rating</h3>
        <div className={styles.facetList}>
          {RATING_OPTIONS.map((r) => (
            <label key={r} className={styles.option}>
              <input
                type="radio"
                name="rating"
                className={styles.control}
                checked={minRating === r}
                onChange={() => handleRatingChange(r)}
                onClick={() => { if (minRating === r) handleRatingChange(0); }}
              />
              <span className={`${styles.box} ${styles.boxRound}`} aria-hidden="true" />
              <span className={styles.optionText}>
                <RatingStars value={r} />
                <span className={styles.ratingPlus}>{r}+ &amp; up</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Discount */}
      <section className={styles.facet}>
        <h3 className={styles.facetTitle}>Discount</h3>
        <div className={styles.facetList}>
          {DISCOUNT_OPTIONS.map((d) => (
            <label key={d} className={styles.option}>
              <input
                type="radio"
                name="discount"
                className={styles.control}
                checked={minDiscount === d}
                onChange={() => handleDiscountChange(d)}
                onClick={() => { if (minDiscount === d) handleDiscountChange(0); }}
              />
              <span className={`${styles.box} ${styles.boxRound}`} aria-hidden="true" />
              <span className={styles.optionText}>{d}% or more</span>
            </label>
          ))}
        </div>
      </section>

      {/* Availability */}
      <section className={styles.facet}>
        <h3 className={styles.facetTitle}>Availability</h3>
        {/* A <button> is not a labelable control, so the <label> that used to
            wrap this row named nothing and forwarded no clicks — the switch
            reached screen readers unnamed. A plain row plus an aria-label that
            repeats the visible words (WCAG 2.5.3) is what it always meant. */}
        <div className={styles.switchRow}>
          <span className={styles.optionText}>In stock only</span>
          <button
            className={`${styles.switch} ${inStockOnly ? styles.switchOn : ""}`}
            onClick={handleInStockToggle}
            type="button"
            role="switch"
            aria-checked={inStockOnly}
            aria-label="In stock only"
          >
            <span className={styles.switchThumb} />
          </button>
        </div>
      </section>

      {/* Brand */}
      {availableBrands.length > 0 && (
        <section className={styles.facet}>
          <h3 className={styles.facetTitle}>Brand</h3>
          <div className={styles.facetList}>
            {availableBrands.map((brand) => (
              <label key={brand} className={styles.option}>
                <input
                  type="checkbox"
                  className={styles.control}
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                />
                <span className={styles.box} aria-hidden="true">
                  <TickMark />
                </span>
                <span className={styles.optionText}>{brand}</span>
              </label>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  // One chip, used by all three toolbar groups. Active chips carry the removal
  // × inline — the chip IS the toggle, so one Enter lifts the filter.
  const renderChip = (key, label, active, onToggle) => (
    <button
      key={key}
      type="button"
      className={`sf-chip ${active ? "sf-chip--active" : ""} ${styles.chip}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      {label}
      {active && <RemoveMark />}
    </button>
  );

  // The drawer arrives from the side it lives on: up from the floor while it is
  // a bottom sheet, in from the right once the stylesheet turns it into a
  // drawer. The query matches the module's own breakpoint exactly.
  const asDrawer =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 769px)").matches;

  // The shared drawer treatment: a right-hand drawer above 768, a bottom sheet
  // below it — in on the slow tier, out on the base one, like every other
  // overlay on the storefront.
  const panelMotion = panel(shouldReduceMotion, asDrawer ? "right" : "bottom");
  const scrimMotion = overlay(shouldReduceMotion);

  // ============================
  // RENDER
  // ============================
  return (
    // The route transition is applied once, to the keyed wrapper around
    // <Routes> in App.js — this page adds no fade of its own.
    <div className={styles.page}>
      {/* ===== Page head — breadcrumb, then the collection's own title ===== */}
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          {breadcrumbItems.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span className={styles.breadcrumbSep} aria-hidden="true">
                  /
                </span>
              )}
              {item.path ? (
                <a
                  href={item.path}
                  className={styles.breadcrumbLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        <header className={styles.collectionHead}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.collectionTitle}>{resultsHeading}</h1>
          <p className={styles.collectionSummary} aria-live="polite">
            {resultSummary}
          </p>
        </header>
      </div>

      <div className={styles.container} ref={mainRef}>
        {/* ===== Toolbar — one hairline row: Filter · chips · Sort ===== */}
        <div className={styles.toolbar}>
          <button
            className={styles.filterBtn}
            onClick={() => setMobileFiltersOpen(true)}
            ref={mobileTriggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={mobileFiltersOpen}
          >
            <FilterMark />
            <span className={styles.filterBtnText}>Filter</span>
            {activeFilterCount > 0 && (
              <span className={styles.filterBtnCount}>{activeFilterCount}</span>
            )}
          </button>

          <div className={styles.chipScroller}>
            {topCategories.length > 0 && (
              <div className={styles.chipGroup} role="group" aria-label="Category">
                {topCategories.map((cat) =>
                  renderChip(
                    cat.id || cat.slug,
                    cat.name,
                    selectedCategories.some(
                      (t) => t === cat.slug || String(t) === String(cat.id)
                    ),
                    () => handleCategoryToggle(categoryParam(cat))
                  )
                )}
              </div>
            )}

            <div className={styles.chipGroup} role="group" aria-label="Price range">
              {priceRanges.map((range) =>
                renderChip(range.label, range.label, isPriceRangeActive(range), () =>
                  handlePriceRangeToggle(range)
                )
              )}
            </div>

            {availableFabrics.length > 0 && (
              <div className={styles.chipGroup} role="group" aria-label="Fabric">
                {availableFabrics.map((fabric) =>
                  renderChip(fabric, fabric, selectedFabrics.includes(fabric), () =>
                    handleFabricToggle(fabric)
                  )
                )}
              </div>
            )}

            {availableHighlights.length > 0 && (
              <div className={styles.chipGroup} role="group" aria-label="Highlights">
                {availableHighlights.map((h) =>
                  renderChip(h.key, h.label, selectedHighlights.includes(h.key), () =>
                    handleHighlightToggle(h.key)
                  )
                )}
              </div>
            )}
          </div>

          <label className={styles.sortField}>
            <span className={styles.sortLabelText}>Sort</span>
            <span className={styles.selectWrap}>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className={styles.sortSelect}
                aria-label="Sort products by"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>

        {/* ===== The wall ===== */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: perPage }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : fetchError ? (
          /* Fetch failed — never masquerade as "nothing found" */
          <div className={styles.state}>
            <ErrorIllustration />
            <h2 className={styles.stateTitle}>The catalogue didn&rsquo;t arrive</h2>
            <p className={styles.stateText}>
              Something interrupted the connection while we were fetching the
              collection. Check your network and ask for it again.
            </p>
            <button
              className={`sf-btn sf-btn--emerald ${styles.stateBtn}`}
              onClick={fetchCatalog}
              type="button"
            >
              Try Again
            </button>
          </div>
        ) : paginatedProducts.length > 0 ? (
          <div className={styles.grid}>
            {paginatedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                className={styles.cell}
                {...reveal(shouldReduceMotion, { index })}
              >
                <ProductCard
                  product={product}
                  onAddToCart={(cartItem) => addToCart(cartItem)}
                  onToggleWishlist={(p) => toggleWishlist(p)}
                  isWishlisted={isInWishlist(product.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          /* Honest empty state — bound to the real (zero) result set */
          <div className={styles.state}>
            <EmptyIllustration />
            <h2 className={styles.stateTitle}>
              {urlSearch ? (
                <>Nothing woven under &ldquo;{urlSearch}&rdquo;</>
              ) : (
                "Nothing matches these filters"
              )}
            </h2>
            <p className={styles.stateText}>
              {urlSearch
                ? "Try another word, or lift a filter to see more of the collection."
                : "Lift a filter and more of the collection comes back into view."}
            </p>
            {hasAnyConstraint && (
              <button
                className={`sf-btn sf-btn--outline-gold ${styles.stateBtn}`}
                onClick={clearAllFilters}
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ===== Pagination ===== */}
        {!loading && !fetchError && filteredProducts.length > perPage && (
          <nav className={styles.pager} aria-label="Collection pages">
            <div className={styles.pagerRow}>
              <button
                className={styles.pagerStep}
                disabled={safePage <= 1}
                onClick={() => handlePageChange(safePage - 1)}
                aria-label="Previous page"
                type="button"
              >
                <ChevronLeft />
                <span className={styles.pagerStepText}>Prev</span>
              </button>

              <div className={styles.pagerNums}>
                {paginationRange.map((item, i) =>
                  item === "..." ? (
                    <span key={`ellipsis-${i}`} className={styles.pagerGap} aria-hidden="true">
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={item}
                      className={`${styles.pagerNum} ${safePage === item ? styles.pagerNumActive : ""}`}
                      onClick={() => handlePageChange(item)}
                      aria-label={`Page ${item}`}
                      aria-current={safePage === item ? "page" : undefined}
                      type="button"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                className={styles.pagerStep}
                disabled={safePage >= totalPages}
                onClick={() => handlePageChange(safePage + 1)}
                aria-label="Next page"
                type="button"
              >
                <span className={styles.pagerStepText}>Next</span>
                <ChevronRight />
              </button>
            </div>

            <div className={styles.pagerMeta}>
              <span className={styles.pagerInfo}>
                Page {safePage} of {totalPages}
              </span>
              <span className={styles.pagerMetaSep} aria-hidden="true" />
              <label className={styles.perPage}>
                <span className={styles.perPageText}>Per page</span>
                <span className={styles.selectWrap}>
                  <select
                    value={perPage}
                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                    className={styles.perPageSelect}
                    aria-label="Products per page"
                  >
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
          </nav>
        )}
      </div>

      {/* ===== Filter panel (bottom sheet on mobile, right drawer above 768) ===== */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className={styles.scrim}
            onClick={() => setMobileFiltersOpen(false)}
            {...scrimMotion}
          >
            <motion.div
              className={styles.sheet}
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Filter the collection"
              {...panelMotion}
              onClick={(e) => e.stopPropagation()}
            >
              <header className={styles.sheetHead}>
                <div className={styles.sheetHeading}>
                  <p className={styles.sheetEyebrow}>Refine</p>
                  <h2 className={styles.sheetTitle}>Filters</h2>
                </div>
                <button
                  className={styles.sheetClose}
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  ref={sheetCloseRef}
                  type="button"
                >
                  <CloseMark />
                </button>
              </header>

              <div className={styles.sheetBody}>{renderFilters()}</div>

              <footer className={styles.sheetFoot}>
                <button
                  className={styles.sheetClear}
                  onClick={clearAllFilters}
                  disabled={!hasAnyConstraint}
                  type="button"
                >
                  Clear all
                </button>
                <button
                  className={styles.sheetApply}
                  onClick={() => setMobileFiltersOpen(false)}
                  type="button"
                >
                  Show {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "Result" : "Results"}
                </button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
