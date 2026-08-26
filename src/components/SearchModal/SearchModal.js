import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import apiService from "../../services/api";
import { formatCurrency, getProductMinPrice, productPath } from "../../utils/helpers";
import StarRating from "../storefront/StarRating";
import { DURATION, RISE, overlay, staggerDelay, t } from "../../theme/motion";
import styles from "./SearchModal.module.css";

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------
// Owner-curated starting points. These are NOT generated, ranked or personalised
// — each one simply seeds a normal query (see handleTermSearch), so the real
// search engine still produces the real result set. Labelled plainly as
// "Suggestions" in the UI: no "AI", no claim the code cannot back. Keep every
// phrase to something the catalogue actually answers.
const CURATED_SUGGESTIONS = [
  "Muga Mekhela Chador",
  "Pat silk saree",
  "Eri shawl",
  "Bridal Muga",
];

// Fallback for the Trending block, used only when the trending endpoint returns
// nothing (see the load effect). Curated search terms, not fabricated metrics —
// we never show a trend count or percentage we do not have.
const CURATED_TRENDING = [
  "Sualkuchi",
  "Muga silk",
  "Pat silk",
  "Eri silk",
  "Gamosa",
];

// Category filter chips (and the slugs each one matches) are derived at runtime
// from the live category tree — see buildCategoryNav() — so they always reflect
// what's in the catalogue with no hardcoded list to drift out of sync.

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 8;
const MAX_RESULTS = 12;
const MAX_TRENDING = 5;
const DEBOUNCE_MS = 300;

// Inline SVG fallback (no external host) shown if a product image fails to load.
// A data URI cannot read var(), so these two literals mirror the light-mode
// tokens by hand: --sf-color-surface-2 (#F2ECE1) and --sf-color-text-muted
// (#6E665A). If either token changes in storefront-tokens.css, change them here.
const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160">' +
      '<rect width="120" height="160" fill="#F2ECE1"/>' +
      '<g fill="none" stroke="#6E665A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="28" y="52" width="64" height="56" rx="2"/>' +
      '<circle cx="47" cy="72" r="6"/>' +
      '<path d="M32 102l19-17 15 13 10-8 16 12"/>' +
      "</g></svg>"
  );

// ---------------------------------------------------------------------------
// Module-level cache — shared across every SearchModal instance (Header +
// BottomNav) so the catalogue is fetched once instead of on every open.
// ---------------------------------------------------------------------------
let searchDataCache = null; // { products, categories }
let searchDataPromise = null;

const loadSearchData = () => {
  if (searchDataCache) return Promise.resolve(searchDataCache);
  if (!searchDataPromise) {
    searchDataPromise = Promise.all([
      apiService.products.getAll(),
      apiService.categories.getAll(),
    ])
      .then(([products, categories]) => {
        searchDataCache = {
          products: Array.isArray(products) ? products : [],
          categories: Array.isArray(categories) ? categories : [],
        };
        return searchDataCache;
      })
      .catch((err) => {
        searchDataPromise = null; // allow a retry on the next open
        throw err;
      });
  }
  return searchDataPromise;
};

// ---------------------------------------------------------------------------
// Recent searches (localStorage)
// ---------------------------------------------------------------------------
const getRecentSearches = () => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query) => {
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getRecentSearches();
  }
};

// Drop a single term — the per-row remove affordance. Same storage shape and the
// same cap as saveRecentSearch, so the two stay interchangeable.
const removeRecentSearch = (query) => {
  try {
    const updated = getRecentSearches()
      .filter((s) => s.toLowerCase() !== query.toLowerCase())
      .slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getRecentSearches();
  }
};

const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
};

// ---------------------------------------------------------------------------
// Category resolution — products reference a numeric categoryId; resolve it to
// a { name, slug } via the categories list. Tolerant of the Laravel shape too
// (string slug or nested object), so both API branches keep working.
// ---------------------------------------------------------------------------
const buildCategoryMap = (categories) => {
  const byId = {};
  const bySlug = {};
  (categories || []).forEach((c) => {
    if (!c) return;
    if (c.id != null) byId[c.id] = c;
    if (c.slug) bySlug[String(c.slug).toLowerCase()] = c;
  });
  return { byId, bySlug };
};

// Build the storefront filter chips straight from the live category tree, so
// adding / renaming / removing a category in the admin is reflected here with no
// code change. One chip per active top-level category; each chip matches that
// category's slug AND all of its descendants' slugs (so a "Mekhela Chador" chip
// still surfaces the Muga / Pat / Eri products beneath it). Returns
// { chips, groups }.
const buildCategoryNav = (categories) => {
  const list = (Array.isArray(categories) ? categories : []).filter(
    (c) => c && c.isActive !== false
  );
  const byParent = {};
  list.forEach((c) => {
    const key = c.parentId == null ? "root" : String(c.parentId);
    (byParent[key] = byParent[key] || []).push(c);
  });
  const descendantSlugs = (cat) => {
    const slugs = [];
    const stack = [cat];
    while (stack.length) {
      const cur = stack.pop();
      if (cur.slug) slugs.push(String(cur.slug).toLowerCase());
      (byParent[String(cur.id)] || []).forEach((child) => stack.push(child));
    }
    return slugs;
  };
  const tops = (byParent.root || [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name)));
  const chips = ["All", ...tops.map((c) => c.name)];
  const groups = {};
  tops.forEach((c) => { groups[c.name] = descendantSlugs(c); });
  return { chips, groups };
};

const resolveCategory = (product, map) => {
  if (!product) return { name: "", slug: "" };
  if (typeof product.category === "string" && product.category) {
    const slug = product.category.toLowerCase();
    const found = map.bySlug[slug];
    return { name: found ? found.name : product.category, slug: found ? String(found.slug).toLowerCase() : slug };
  }
  if (product.category && typeof product.category === "object") {
    return {
      name: product.category.name || "",
      slug: String(product.category.slug || "").toLowerCase(),
    };
  }
  const byId = map.byId[product.categoryId];
  if (byId) return { name: byId.name, slug: String(byId.slug || "").toLowerCase() };
  return { name: "", slug: "" };
};

const matchesCategoryChip = (product, chip, catInfo, groups = {}) => {
  if (!chip || chip === "All") return true;
  const group = groups[chip] || [chip.toLowerCase()];
  const slug = (catInfo.slug || "").toLowerCase();
  const name = (catInfo.name || "").toLowerCase();
  const chipLower = chip.toLowerCase();
  if (group.includes(slug)) return true;
  if ((name && name.includes(chipLower)) || (slug && slug.includes(chipLower))) return true;
  const tags = (product.tags || []).map((t) => String(t).toLowerCase());
  if (group.some((g) => tags.includes(g))) return true;
  return false;
};

// ---------------------------------------------------------------------------
// Relevance scoring: exact name → starts-with → word match → contains →
// tags → brand/category → description, with a small trending/hot boost.
// ---------------------------------------------------------------------------
const scoreProduct = (product, lowerQuery, catInfo) => {
  let score = 0;
  const name = (product.name || "").toLowerCase();
  const desc = (product.shortDescription || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const tags = (product.tags || []).map((t) => String(t).toLowerCase());
  const catName = (catInfo.name || "").toLowerCase();
  const catSlug = (catInfo.slug || "").toLowerCase();

  // Name
  if (name === lowerQuery) score += 100;
  else if (name.startsWith(lowerQuery)) score += 80;
  else if (name.split(/\s+/).some((w) => w.startsWith(lowerQuery))) score += 60;
  else if (name.includes(lowerQuery)) score += 40;

  // Tags
  if (tags.some((t) => t === lowerQuery)) score += 30;
  else if (tags.some((t) => t.startsWith(lowerQuery))) score += 20;
  else if (tags.some((t) => t.includes(lowerQuery))) score += 10;

  // Category / brand
  if (catName.includes(lowerQuery) || catSlug.includes(lowerQuery)) score += 15;
  if (brand.includes(lowerQuery)) score += 15;

  // Description (weakest signal)
  if (desc.includes(lowerQuery)) score += 5;

  // Only matched products are eligible. Trending/hot give a small ranking
  // boost on top of a real match — never a reason to surface a non-match.
  if (score <= 0) return 0;
  if (product.trending) score += 3;
  if (product.hot) score += 2;

  return score;
};

// ---------------------------------------------------------------------------
// Inline SVG icons. Deliberately few: an editorial overlay is typography, not
// glyphs. Stroke colour inherits via currentColor, so they stay token-driven.
// ---------------------------------------------------------------------------
const Icon = {
  Search: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7.5" />
      <line x1="21" y1="21" x2="16.8" y2="16.8" />
    </svg>
  ),
  Close: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Arrow: (props) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const SearchModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const triggerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const activeCategoryRef = useRef("All");

  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [categoryMap, setCategoryMap] = useState({ byId: {}, bySlug: {} });
  const [categoryNav, setCategoryNav] = useState({ chips: ["All"], groups: {} });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);

  // Keep a ref of the active category so the debounced query effect always uses
  // the latest value without re-subscribing on every chip change.
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  // Core search routine (synchronous; the catalogue is already in memory).
  const runSearch = useCallback(
    (rawQuery, category) => {
      const lowerQuery = (rawQuery || "").toLowerCase().trim();
      if (!lowerQuery) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      const cat = category || "All";
      const scored = allProducts
        .map((product) => {
          const catInfo = resolveCategory(product, categoryMap);
          return { product, catInfo, score: scoreProduct(product, lowerQuery, catInfo) };
        })
        .filter((entry) => entry.score > 0 && matchesCategoryChip(entry.product, cat, entry.catInfo, categoryNav.groups))
        .sort((a, b) => b.score - a.score)
        .map((entry) => ({ ...entry.product, _catName: entry.catInfo.name }));

      setResults(scored);
      setIsSearching(false);
    },
    [allProducts, categoryMap, categoryNav]
  );

  // Load catalogue (cached) when the modal first opens; refresh recent searches
  // and focus the input. Reset transient state when it closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setIsSearching(false);
      setActiveCategory("All");
      return;
    }

    let active = true;
    setRecentSearches(getRecentSearches());
    loadSearchData()
      .then((data) => {
        if (!active) return;
        setAllProducts(data.products);
        setCategoryMap(buildCategoryMap(data.categories));
        setCategoryNav(buildCategoryNav(data.categories));
        setDataReady(true);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load search data:", err);
        // Settled, just empty-handed: flip the flag anyway so a failed fetch
        // resolves to the empty state instead of a permanent "Searching…".
        setDataReady(true);
      });

    // Trending is real product data, shown as a small rail. On error / empty we
    // fall back to the curated terms above — never to invented products.
    apiService.products
      .getTrending(MAX_TRENDING)
      .then((list) => {
        if (!active) return;
        const items = (Array.isArray(list) ? list : []).filter(Boolean).slice(0, MAX_TRENDING);
        if (items.length) setTrendingProducts(items);
      })
      .catch(() => {
        /* keep the curated fallback */
      });

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      active = false;
      clearTimeout(focusTimer);
    };
  }, [open]);

  // Lock body scroll while open (only the open instance acts; the closed one
  // returns early so it never touches the body style).
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Remember the element that opened the overlay and restore focus to it on
  // close, so keyboard users land back on the trigger.
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      return undefined;
    }
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && typeof trigger.focus === "function") {
      // Defer until after the exit animation unmounts the dialog.
      const t = setTimeout(() => trigger.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  // Escape to close + focus trap (Tab / Shift+Tab cycle within the overlay).
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = Array.from(
        modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !modal.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Debounced search as the user types.
  useEffect(() => {
    const trimmed = query.trim();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(() => {
      runSearch(trimmed, activeCategoryRef.current);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, runSearch]);

  // ----- Handlers -----
  const handleInputChange = (e) => setQuery(e.target.value);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  const goToSearchResults = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(saveRecentSearch(trimmed));
    onClose();
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    goToSearchResults(query);
  };

  const handleProductClick = (product) => {
    if (query.trim()) setRecentSearches(saveRecentSearch(query.trim()));
    onClose();
    navigate(productPath(product));
  };

  // Seed the query with a curated / recent / trending term so the real debounced
  // search runs. Returns focus to the input for continued typing.
  const handleTermSearch = (term) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleRemoveRecent = (term) => {
    setRecentSearches(removeRecentSearch(term));
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    if (query.trim()) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      runSearch(query, cat);
    }
  };

  // ----- Derived -----
  const getPrice = (product) => {
    const priceInfo = getProductMinPrice(product);
    return priceInfo.sellingPrice || priceInfo.originalPrice || product.price || 0;
  };

  const trimmedQuery = query.trim();
  const showResultsView = trimmedQuery.length > 0;
  const cappedResults = results.slice(0, MAX_RESULTS);
  // Busy while the debounce is pending OR while the catalogue is still in
  // flight — on a slow connection the first keystroke must not read "nothing".
  const isBusy = showResultsView && (isSearching || !dataReady);

  // The shared overlay/panel treatment: the scrim on the base tier, the sheet
  // dropping in on the slow one and leaving on the base one.
  const scrim = overlay(reduceMotion);
  const sheetSlide = t(reduceMotion, DURATION.slow);
  const sheetExit = t(reduceMotion, DURATION.base);

  // Quiet ruled rows — used for Suggestions and for the curated Trending
  // fallback. Each row simply seeds the input with a real query.
  const renderTermRows = (terms) => (
    <ul className={styles.rows}>
      {terms.map((term) => (
        <li key={term} className={styles.rowItem}>
          <button type="button" className={styles.row} onClick={() => handleTermSearch(term)}>
            <span className={styles.rowText}>{term}</span>
            <span className={styles.rowArrow} aria-hidden="true">
              <Icon.Arrow />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  const renderThumbImage = (product, className) => (
    <img
      src={product.images?.[0] || product.image || FALLBACK_IMAGE}
      alt={product.name}
      className={className}
      loading="lazy"
      onError={(e) => {
        if (e.currentTarget.dataset.fallback) return;
        e.currentTarget.dataset.fallback = "1";
        e.currentTarget.src = FALLBACK_IMAGE;
      }}
    />
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          {...scrim}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search Meghali's Silk"
        >
          <motion.div
            ref={modalRef}
            className={styles.sheet}
            initial={{ opacity: 0, y: reduceMotion ? 0 : -RISE.reveal }}
            animate={{ opacity: 1, y: 0, transition: sheetSlide }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -RISE.micro,
              transition: sheetExit,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ---- Masthead: label, close mark, the input line, the chips ---- */}
            <div className={styles.head}>
              <div className={styles.inner}>
                <div className={styles.topRow}>
                  <span className={styles.eyebrow}>Search the house</span>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Close search"
                  >
                    <span className={styles.closeText}>Close</span>
                    <Icon.Close width="18" height="18" />
                  </button>
                </div>

                <form
                  className={styles.field}
                  onSubmit={handleSubmit}
                  role="search"
                  data-busy={isBusy ? "true" : "false"}
                >
                  <span className={styles.fieldIcon} aria-hidden="true">
                    <Icon.Search />
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    placeholder="Search Muga, Eri, Mekhela Chador…"
                    value={query}
                    onChange={handleInputChange}
                    autoComplete="off"
                    aria-label="Search Meghali's Silk"
                  />
                  {query && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={handleClear}
                      aria-label="Clear search"
                    >
                      <Icon.Close width="14" height="14" />
                    </button>
                  )}
                </form>

                <div className={styles.chipRow} role="group" aria-label="Filter by category">
                  {categoryNav.chips.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`sf-chip ${styles.chip} ${
                        activeCategory === cat ? "sf-chip--active" : ""
                      }`}
                      aria-pressed={activeCategory === cat}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ---- Body ------------------------------------------------------ */}
            <div className={styles.body}>
              <div className={styles.inner}>
                {/* Announce the outcome to screen readers without a visual echo. */}
                <p className={styles.srOnly} role="status" aria-live="polite">
                  {!showResultsView
                    ? ""
                    : isBusy
                    ? "Searching"
                    : `${results.length} ${results.length === 1 ? "piece" : "pieces"} found`}
                </p>

                {showResultsView ? (
                  isBusy && results.length === 0 ? (
                    <p className={styles.searching}>Searching the collection…</p>
                  ) : results.length === 0 ? (
                    <div className={styles.empty}>
                      <p className={styles.emptyTitle}>Nothing yet for “{trimmedQuery}”</p>
                      <p className={styles.emptyHint}>
                        Try another weave — Muga, Pat or Eri — or browse the whole collection.
                      </p>
                      <Link to="/products" className={styles.emptyLink} onClick={onClose}>
                        View all pieces
                        <Icon.Arrow />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className={styles.blockHead}>
                        <h2 className={styles.blockLabel}>
                          {results.length} {results.length === 1 ? "piece" : "pieces"} for “
                          {trimmedQuery}”
                        </h2>
                        <button type="button" className={styles.textLink} onClick={handleSubmit}>
                          View all
                          <Icon.Arrow />
                        </button>
                      </div>

                      <div className={styles.grid}>
                        {cappedResults.map((product, idx) => (
                          <motion.button
                            key={product.id}
                            type="button"
                            className={styles.card}
                            initial={{
                              opacity: 0,
                              y: reduceMotion ? 0 : RISE.micro,
                            }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              ...t(reduceMotion, DURATION.base),
                              delay: reduceMotion ? 0 : staggerDelay(idx),
                            }}
                            onClick={() => handleProductClick(product)}
                          >
                            <span className={styles.thumb}>
                              {renderThumbImage(product, styles.thumbImg)}
                            </span>
                            <span className={styles.cardName}>{product.name}</span>
                            {product._catName && (
                              <span className={styles.cardCat}>{product._catName}</span>
                            )}
                            <span className={styles.cardPrice}>
                              {formatCurrency(getPrice(product))}
                            </span>
                            <span className={styles.cardStars}>
                              {product.rating ? (
                                <>
                                  <StarRating rating={product.rating} size={11} />
                                  <span className={styles.ratingNum}>
                                    {Number(product.rating).toFixed(1)}
                                  </span>
                                </>
                              ) : (
                                <span className={styles.ratingNum}>New in</span>
                              )}
                            </span>
                          </motion.button>
                        ))}
                      </div>

                      {results.length > MAX_RESULTS && (
                        <div className={styles.moreRow}>
                          <button type="button" className={styles.textLink} onClick={handleSubmit}>
                            View all {results.length} pieces
                            <Icon.Arrow />
                          </button>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <div className={styles.idle}>
                    {/* Suggestions — curated phrases that seed a real query. */}
                    <section className={styles.block}>
                      <div className={styles.blockHead}>
                        <h2 className={styles.blockLabel}>Suggestions</h2>
                      </div>
                      {renderTermRows(CURATED_SUGGESTIONS)}
                    </section>

                    {/* Recent searches — persisted in localStorage, removable. */}
                    {recentSearches.length > 0 && (
                      <section className={styles.block}>
                        <div className={styles.blockHead}>
                          <h2 className={styles.blockLabel}>Recent</h2>
                          <button
                            type="button"
                            className={styles.quietBtn}
                            onClick={handleClearRecent}
                          >
                            Clear all
                          </button>
                        </div>
                        <ul className={styles.rows}>
                          {recentSearches.map((term) => (
                            <li key={term} className={`${styles.rowItem} ${styles.recentItem}`}>
                              <button
                                type="button"
                                className={styles.row}
                                onClick={() => handleTermSearch(term)}
                              >
                                <span className={styles.rowText}>{term}</span>
                              </button>
                              <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => handleRemoveRecent(term)}
                                aria-label={`Remove “${term}” from recent searches`}
                              >
                                <Icon.Close width="13" height="13" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Trending — real products when we have them, curated terms
                        as the honest fallback when the endpoint gives nothing. */}
                    <section className={styles.block}>
                      <div className={styles.blockHead}>
                        <h2 className={styles.blockLabel}>Trending now</h2>
                      </div>
                      {trendingProducts.length > 0 ? (
                        <div className={styles.rail}>
                          {trendingProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className={styles.railItem}
                              onClick={() => handleProductClick(product)}
                            >
                              <span className={styles.railThumb}>
                                {renderThumbImage(product, styles.thumbImg)}
                              </span>
                              <span className={styles.railName}>{product.name}</span>
                              <span className={styles.railPrice}>
                                {formatCurrency(getPrice(product))}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        renderTermRows(CURATED_TRENDING)
                      )}
                    </section>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
