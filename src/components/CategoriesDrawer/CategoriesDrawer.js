import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CloseRounded,
  ExpandMore,
  ChevronRight,
  SearchOutlined,
} from "@mui/icons-material";
import { categoryParam } from "../../utils/categories";
import {
  DURATION,
  RISE,
  overlay,
  panel,
  staggerDelay,
  t,
  tween,
} from "../../theme/motion";
import styles from "./CategoriesDrawer.module.css";

// The stagger is capped by index so the run never grows with the catalogue:
// staggerDelay() caps the seconds, this caps how many rows queue at all.
const STAGGER_MAX_ROWS = 8;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const norm = (s) => String(s || "").trim().toLowerCase();

/**
 * CategoriesDrawer — the desktop "all collections" panel.
 *
 * Opened from the primary nav's overflow button when the row cannot hold every
 * category on one line. It shows the WHOLE active category tree (not just the
 * links that happened to be hidden), so the customer always has one complete
 * map of the catalogue, plus the editorial "Discover" links that share the row.
 *
 * Props
 *   open, onClose      — controlled visibility
 *   categories         — the full flat category list from the API
 *   editorialLinks     — [{ key, label, to }] the row's curated links
 *   isLinkActive(to)   — the header's active-link rule, so the drawer marks the
 *                        current collection the same way the row does
 */
const CategoriesDrawer = ({
  open,
  onClose,
  categories = [],
  editorialLinks = [],
  isLinkActive = () => false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null); // id of the open parent

  // Fresh slate every time the drawer opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setExpanded(null);
    }
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus management: focus the panel on open, cycle Tab inside it, Escape
  // closes, and focus returns to the opener on close.
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const focusTimer = setTimeout(() => panelRef.current?.focus(), 60);

    const onKey = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const node = panelRef.current;
      if (!node) return;
      const nodes = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      const outside = active === node || !node.contains(active);
      if (e.shiftKey && (outside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(focusTimer);
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [open]);

  // Any route change closes the drawer.
  useEffect(() => {
    if (open) onCloseRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  // ---------------------------------------------------------------------------
  // TREE — active categories, top-level first, children grouped under parents.
  // A category whose parent is missing/inactive is promoted to top level so it
  // never silently disappears.
  // ---------------------------------------------------------------------------
  const active = useMemo(
    () => categories.filter((c) => c.isActive !== false),
    [categories]
  );
  const idSet = useMemo(() => new Set(active.map((c) => String(c.id))), [active]);
  const sortSiblings = (list) =>
    [...list].sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        String(a.name).localeCompare(String(b.name))
    );
  const topCategories = useMemo(
    () =>
      sortSiblings(
        active.filter((c) => c.parentId == null || !idSet.has(String(c.parentId)))
      ),
    [active, idSet]
  );
  const childrenByParent = useMemo(() => {
    const map = new Map();
    active.forEach((c) => {
      if (c.parentId != null && idSet.has(String(c.parentId))) {
        const key = String(c.parentId);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(c);
      }
    });
    map.forEach((list, key) => map.set(key, sortSiblings(list)));
    return map;
  }, [active, idSet]);
  const getChildren = useCallback(
    (id) => childrenByParent.get(String(id)) || [],
    [childrenByParent]
  );

  // ---------------------------------------------------------------------------
  // FILTER — a parent stays when it or any descendant matches; a matching
  // parent keeps all of its children. Filtering also opens every surviving
  // group so the match is visible without another click.
  // ---------------------------------------------------------------------------
  const q = norm(query);
  const matches = (c) => !q || norm(c.name || c.title).includes(q);

  const filteredTree = useMemo(() => {
    const filterKids = (parentId) =>
      getChildren(parentId)
        .map((kid) => {
          const kids = filterKids(kid.id);
          if (matches(kid)) return { cat: kid, kids: getChildrenTree(kid.id) };
          if (kids.length) return { cat: kid, kids };
          return null;
        })
        .filter(Boolean);
    const getChildrenTree = (parentId) =>
      getChildren(parentId).map((kid) => ({
        cat: kid,
        kids: getChildrenTree(kid.id),
      }));

    return topCategories
      .map((cat) => {
        if (matches(cat)) return { cat, kids: getChildrenTree(cat.id) };
        const kids = filterKids(cat.id);
        return kids.length ? { cat, kids } : null;
      })
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topCategories, getChildren, q]);

  const filteredEditorial = useMemo(
    () => editorialLinks.filter((l) => matches(l)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorialLinks, q]
  );

  const isOpenGroup = (id) => (q ? true : expanded === String(id));
  const toggleGroup = (id) =>
    setExpanded((prev) => (prev === String(id) ? null : String(id)));

  const catTo = (cat) => `/products?category=${categoryParam(cat)}`;

  // ---------------------------------------------------------------------------
  // MOTION — the shared drawer treatment (theme/motion.js).
  // ---------------------------------------------------------------------------
  const drawer = panel(reduceMotion, "left");
  const scrim = overlay(reduceMotion);
  const collapse = t(reduceMotion, DURATION.base);

  const reveal = (i) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: RISE.micro },
          animate: {
            opacity: 1,
            y: 0,
            transition: {
              ...tween(DURATION.base),
              delay: 0.08 + staggerDelay(Math.min(i, STAGGER_MAX_ROWS)),
            },
          },
        };

  // Nested sub-collections, indented per level.
  const renderKids = (nodes, level) =>
    nodes.map(({ cat, kids }) => {
      const activeNow = isLinkActive(catTo(cat));
      return (
        <React.Fragment key={cat.id || cat.slug}>
          <button
            type="button"
            className={`${styles.child} ${activeNow ? styles.childActive : ""}`}
            style={{ "--drawer-indent": `${(level - 1) * 14}px` }}
            onClick={() => handleNavigate(catTo(cat))}
            aria-current={activeNow ? "page" : undefined}
          >
            <span className={styles.childRule} aria-hidden="true" />
            <span className={styles.childLabel}>{cat.name || cat.title}</span>
          </button>
          {kids.length > 0 && renderKids(kids, level + 1)}
        </React.Fragment>
      );
    });

  const totalCount = topCategories.length;
  const shownCount = filteredTree.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            {...scrim}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            className={styles.panel}
            initial={drawer.initial}
            animate={drawer.animate}
            exit={drawer.exit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="categories-drawer-title"
            tabIndex={-1}
          >
            {/* ---- Head: eyebrow · title · close ---- */}
            <div className={styles.head}>
              <div className={styles.headText}>
                <span className={styles.eyebrow}>Browse</span>
                <h2 className={styles.title} id="categories-drawer-title">
                  All Collections
                </h2>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close collections"
              >
                <CloseRounded className={styles.closeIcon} />
              </button>
            </div>

            {/* ---- Filter line ---- */}
            <div className={styles.field}>
              <SearchOutlined className={styles.fieldIcon} aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                className={styles.input}
                placeholder="Find a collection"
                aria-label="Find a collection"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear"
                >
                  <CloseRounded className={styles.clearIcon} />
                </button>
              )}
            </div>

            <div className={styles.scrollArea}>
              {/* ---- Collections ---- */}
              <section className={styles.group} aria-labelledby="categories-drawer-collections">
                <div className={styles.groupHead}>
                  <h3 className={styles.groupLabel} id="categories-drawer-collections">
                    Collections
                  </h3>
                  <span className={styles.groupCount} aria-live="polite">
                    {q ? `${shownCount} of ${totalCount}` : totalCount}
                  </span>
                </div>

                {shownCount === 0 ? (
                  <p className={styles.empty}>
                    No collection matches “{query}”.
                  </p>
                ) : (
                  <div className={styles.tree}>
                    {filteredTree.map(({ cat, kids }, i) => {
                      const hasKids = kids.length > 0;
                      const isOpen = hasKids && isOpenGroup(cat.id);
                      const activeNow = isLinkActive(catTo(cat));
                      return (
                        <motion.div
                          className={styles.node}
                          key={cat.id || cat.slug}
                          {...reveal(i)}
                        >
                          <div className={styles.parentRow}>
                            <button
                              type="button"
                              className={`${styles.parent} ${
                                activeNow ? styles.parentActive : ""
                              }`}
                              onClick={() => handleNavigate(catTo(cat))}
                              aria-current={activeNow ? "page" : undefined}
                            >
                              <span className={styles.parentLabel}>
                                {cat.name || cat.title}
                              </span>
                              {hasKids && (
                                <span className={styles.parentMeta}>
                                  {kids.length}
                                </span>
                              )}
                              {!hasKids && (
                                <ChevronRight
                                  className={styles.parentArrow}
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                            {hasKids && (
                              <button
                                type="button"
                                className={styles.expandBtn}
                                onClick={() => toggleGroup(cat.id)}
                                aria-expanded={isOpen}
                                aria-label={`${isOpen ? "Hide" : "Show"} ${
                                  cat.name || cat.title
                                } sub-collections`}
                                disabled={Boolean(q)}
                              >
                                <ExpandMore
                                  className={`${styles.expandIcon} ${
                                    isOpen ? styles.expandIconOpen : ""
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                className={styles.childrenWrap}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={collapse}
                              >
                                <div className={styles.children}>
                                  <button
                                    type="button"
                                    className={styles.shopAll}
                                    onClick={() => handleNavigate(catTo(cat))}
                                  >
                                    Shop all {cat.name || cat.title}
                                  </button>
                                  {renderKids(kids, 1)}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ---- Discover: the row's editorial links ---- */}
              {filteredEditorial.length > 0 && (
                <section className={styles.group} aria-labelledby="categories-drawer-discover">
                  <div className={styles.groupHead}>
                    <h3 className={styles.groupLabel} id="categories-drawer-discover">
                      Discover
                    </h3>
                  </div>
                  <div className={styles.discover}>
                    {filteredEditorial.map((link, i) => {
                      const activeNow = isLinkActive(link.to);
                      return (
                        <motion.button
                          key={link.key || link.label}
                          type="button"
                          className={`${styles.metaRow} ${
                            activeNow ? styles.metaRowActive : ""
                          }`}
                          onClick={() => handleNavigate(link.to)}
                          aria-current={activeNow ? "page" : undefined}
                          {...reveal(shownCount + i)}
                        >
                          <span className={styles.metaLabel}>{link.label}</span>
                          <ChevronRight className={styles.metaArrow} aria-hidden="true" />
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* ---- Foot: the one filled control ---- */}
            <div className={styles.foot}>
              <button
                type="button"
                className={styles.viewAll}
                onClick={() => handleNavigate("/products")}
              >
                View all products
                <ChevronRight className={styles.viewAllIcon} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CategoriesDrawer;
