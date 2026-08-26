import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CloseRounded,
  ExpandMore,
  ChevronRight,
  PersonOutline,
  ShoppingBagOutlined,
  FavoriteBorder,
  LogoutOutlined,
  SettingsOutlined,
  HelpOutline,
  DarkModeOutlined,
  LightModeOutlined,
} from "@mui/icons-material";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useDealsConfig } from "../../context/DealsConfigContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
import { APP_NAME } from "../../utils/constants";
import TrustStrip from "../TrustStrip";
import {
  DURATION,
  RISE,
  overlay,
  panel,
  staggerDelay,
  t,
  tween,
} from "../../theme/motion";
import styles from "./SidebarMenu.module.css";

// Both wordmarks are gold/white on a TRANSPARENT ground, so they sit straight on
// the panel — the old deep-green logo plate is retired. The light art is the
// byte-for-byte URL the masthead and the splash preload use, so opening the menu
// paints it from cache; the white art is its dark-mode twin. Intrinsic 1454×454.
const LOGO_LIGHT =
  "https://res.cloudinary.com/v8vrixwq/image/upload/f_auto,q_auto,w_520/v1787592407/meghali-silk-logo.png";
const LOGO_WHITE =
  "https://res.cloudinary.com/v8vrixwq/image/upload/f_auto,q_auto,w_520/v1787592405/meghali-silk-logo-white.png";
const LOGO_W = 520;
const LOGO_H = 162;

// The panel's stagger is capped by index rather than by seconds so that the
// leading 0.08s hand-off (the panel settling before its rows begin) is not
// counted twice; staggerDelay() in theme/motion.js caps the rest.
const STAGGER_MAX_ROWS = 8;

// Tab-cycling needs the panel's own focusables; every control in here is a
// plain <button>, so the standard selector covers the lot.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// The quiet secondary group under the serif links. Mirrors the header's
// editorial links exactly, so the two navigations never drift apart.
const DISCOVER_LINKS = [
  { label: "New Arrivals", to: "/products?sort=newest" },
  { label: "Bestsellers", to: "/products?sort=popular" },
  { label: "Sale", to: "/products?sort=discount" },
];

const SidebarMenu = ({ open, onClose, onOpenAuth }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  // The deals entry disappears when the admin turns the Special Offers page off.
  const { enabled: dealsEnabled } = useDealsConfig();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef(null);

  // Header hands a fresh arrow function down on every one of its renders, so the
  // focus effect below reads onClose through a ref — depending on the prop
  // directly would tear the focus trap down and rebuild it mid-interaction.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [categories, setCategories] = useState([]);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null); // id of open parent (single-open)
  // "Settings" groups the theme switch + Help — there is no /settings route.
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Fetch categories the first time the Collections section is opened (lazy).
  useEffect(() => {
    if (categoriesExpanded && categories.length === 0) {
      setCategoriesLoading(true);
      apiService.categories
        .getAll()
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data ?? [];
          setCategories(list);
        })
        .catch(() => setCategories([]))
        .finally(() => setCategoriesLoading(false));
    }
  }, [categoriesExpanded, categories.length]);

  // Lock body scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus management: remember what opened the menu, move focus into the panel,
  // cycle Tab inside it while it is open, and hand focus back on close.
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
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      // The panel itself is tabIndex={-1} and holds focus on open, so treat it
      // as "outside" the ring — the first Tab must land on the first control.
      const outside = active === panel || !panel.contains(active);
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

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleSignIn = () => {
    onClose();
    if (onOpenAuth) onOpenAuth();
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/");
  };

  const getUserInitials = () => {
    if (!user) return "";
    const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
    const first = user.firstName || parts[0] || "";
    const last = user.lastName || parts.slice(1).join(" ") || "";
    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    if (initials) return initials;
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    if (user.firstName) {
      return `${user.firstName}${user.lastName ? " " + user.lastName : ""}`;
    }
    return user.name || user.email || "User";
  };

  // ---------------------------------------------------------------------------
  // CATEGORY TREE — data handling unchanged; only its dress is new.
  // ---------------------------------------------------------------------------
  // Build a parent → children index. The API already returns active categories
  // sorted by sortOrder, so grouping preserves the intended order per level.
  // A category is treated as top-level when it has no parent OR its parent isn't
  // in the (active) list — so an orphan never silently disappears from the menu.
  const idSet = useMemo(
    () => new Set(categories.map((c) => String(c.id))),
    [categories]
  );
  const topCategories = useMemo(
    () => categories.filter((c) => c.parentId == null || !idSet.has(String(c.parentId))),
    [categories, idSet]
  );
  const childrenByParent = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      if (c.parentId != null && idSet.has(String(c.parentId))) {
        const key = String(c.parentId);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(c);
      }
    });
    return map;
  }, [categories, idSet]);
  const getChildren = useCallback(
    (id) => childrenByParent.get(String(id)) || [],
    [childrenByParent]
  );

  const toggleCat = (id) =>
    setExpandedCat((prev) => (prev === String(id) ? null : String(id)));

  // Render an arbitrarily deep subtree of a parent, indenting by level so the
  // hierarchy always reads top-down (parent → child → grandchild). The indent
  // rides a CSS custom property, so the rhythm stays in the stylesheet.
  const renderDescendants = (parentId, level) =>
    getChildren(parentId).map((kid) => {
      const grandKids = getChildren(kid.id);
      return (
        <React.Fragment key={kid.id || kid.slug}>
          <button
            type="button"
            className={styles.catChild}
            style={{ "--menu-indent": `${(level - 1) * 14}px` }}
            onClick={() => handleNavigate(`/products?category=${categoryParam(kid)}`)}
          >
            <span className={styles.catChildRule} aria-hidden="true" />
            <span className={styles.catChildLabel}>{kid.name || kid.title}</span>
          </button>
          {grandKids.length > 0 && renderDescendants(kid.id, level + 1)}
        </React.Fragment>
      );
    });

  // ---------------------------------------------------------------------------
  // MOTION — the shared drawer treatment from theme/motion.js. The panel used
  // to arrive on a spring (damping 36 / stiffness 220); it is a tween now, in
  // on the slow tier and out on the base one, which is the same language every
  // other overlay on the storefront speaks.
  // ---------------------------------------------------------------------------
  const drawer = panel(reduceMotion, "left");
  const panelVariants = {
    hidden: drawer.initial,
    visible: drawer.animate,
    exit: drawer.exit,
  };

  const scrim = overlay(reduceMotion);

  const collapse = t(reduceMotion, DURATION.base);

  // Rows fade up one after another as the panel settles. Only rows that exist at
  // open time are staggered — accordion contents are revealed by their own
  // height animation, so they must not inherit a stale queue position.
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
              // The panel is still travelling for its first beat; the rows wait
              // it out, then follow on the shared step.
              delay: 0.08 + staggerDelay(Math.min(i, STAGGER_MAX_ROWS)),
            },
          },
        };

  let rowIndex = 0;
  const nextRow = () => reveal(rowIndex++);

  // A serif primary link. Passing `expanded` turns it into an accordion trigger.
  const renderPrimaryLink = ({ label, to, onClick, expanded }) => (
    <motion.button
      key={label}
      type="button"
      className={styles.primaryLink}
      onClick={onClick || (() => handleNavigate(to))}
      aria-expanded={expanded}
      {...nextRow()}
    >
      <span className={styles.primaryLabel}>{label}</span>
      {expanded === undefined ? (
        <span className={styles.primaryRule} aria-hidden="true" />
      ) : (
        <ExpandMore
          className={`${styles.primaryChevron} ${
            expanded ? styles.primaryChevronOpen : ""
          }`}
        />
      )}
    </motion.button>
  );

  // A quiet Inter meta row — Discover, Account and Settings all set in this key.
  const renderMetaRow = ({ key, label, to, onClick, Icon, tone }, staggered = true) => (
    <motion.button
      key={key || label}
      type="button"
      className={`${styles.metaRow} ${tone ? styles[tone] : ""}`}
      onClick={onClick || (() => handleNavigate(to))}
      {...(staggered ? nextRow() : {})}
    >
      {Icon ? <Icon className={styles.metaIcon} aria-hidden="true" /> : null}
      <span className={styles.metaLabel}>{label}</span>
      <ChevronRight className={styles.metaArrow} aria-hidden="true" />
    </motion.button>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ===== Backdrop — the token scrim, nothing more ===== */}
          <motion.div
            className={styles.backdrop}
            {...scrim}
            onClick={onClose}
          />

          {/* ===== Panel ===== */}
          <motion.aside
            ref={panelRef}
            className={styles.panel}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={`${APP_NAME} menu`}
            tabIndex={-1}
          >
            {/* ---- Masthead: wordmark straight on the ivory + the close mark ---- */}
            <div className={styles.topBar}>
              <img
                className={styles.logo}
                src={isDarkMode ? LOGO_WHITE : LOGO_LIGHT}
                alt={APP_NAME}
                width={LOGO_W}
                height={LOGO_H}
                loading="lazy"
                decoding="async"
              />
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close menu"
              >
                <CloseRounded className={styles.closeIcon} />
              </button>
            </div>

            <div className={styles.scrollArea}>
              {/* ---- Identity ---- */}
              <div className={styles.identity}>
                {user ? (
                  <motion.button
                    type="button"
                    className={styles.userCard}
                    onClick={() => handleNavigate("/profile")}
                    {...nextRow()}
                  >
                    <span className={styles.avatar}>
                      {user.avatar || user.profileImage ? (
                        <img
                          src={user.avatar || user.profileImage}
                          alt=""
                          className={styles.avatarImg}
                        />
                      ) : (
                        <span className={styles.avatarInitials}>
                          {getUserInitials()}
                        </span>
                      )}
                    </span>
                    <span className={styles.userText}>
                      <span className={styles.userName}>{getUserDisplayName()}</span>
                      <span className={styles.userMeta}>
                        {user.email || "View your profile"}
                      </span>
                    </span>
                    <ChevronRight className={styles.metaArrow} aria-hidden="true" />
                  </motion.button>
                ) : (
                  <motion.div className={styles.guest} {...nextRow()}>
                    <span className={styles.guestText}>
                      <span className={styles.guestEyebrow}>Welcome</span>
                      <span className={styles.guestSub}>
                        Sign in for orders, offers &amp; more
                      </span>
                    </span>
                    <button
                      type="button"
                      className={styles.signInBtn}
                      onClick={handleSignIn}
                    >
                      Sign in
                    </button>
                  </motion.div>
                )}
              </div>

              {/* ---- Primary menu, set in the display serif ----
                  Labelled "Menu", not "Primary"/"Shop": BottomNav and the header
                  nav already claim those, and identically-named landmarks are
                  indistinguishable in a screen reader's landmark list. */}
              <nav className={styles.primaryNav} aria-label="Menu">
                {renderPrimaryLink({ label: "Shop All", to: "/products" })}

                {/* Collections — the lazy category tree lives under here. */}
                {renderPrimaryLink({
                  label: "Collections",
                  expanded: categoriesExpanded,
                  onClick: () => setCategoriesExpanded((prev) => !prev),
                })}

                <AnimatePresence initial={false}>
                  {categoriesExpanded && (
                    <motion.div
                      className={styles.catPanel}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={collapse}
                    >
                      {categoriesLoading ? (
                        <p className={styles.catNote}>Loading collections…</p>
                      ) : topCategories.length === 0 ? (
                        <p className={styles.catNote}>No collections found</p>
                      ) : (
                        <div className={styles.catInner}>
                          {topCategories.map((cat) => {
                            const kids = getChildren(cat.id);
                            const hasKids = kids.length > 0;
                            const isOpen = expandedCat === String(cat.id);
                            return (
                              <div className={styles.catGroup} key={cat.id || cat.slug}>
                                <button
                                  type="button"
                                  className={styles.catParent}
                                  onClick={() =>
                                    hasKids
                                      ? toggleCat(cat.id)
                                      : handleNavigate(
                                          `/products?category=${categoryParam(cat)}`
                                        )
                                  }
                                  aria-expanded={hasKids ? isOpen : undefined}
                                >
                                  <span className={styles.catParentLabel}>
                                    {cat.name || cat.title}
                                  </span>
                                  {hasKids ? (
                                    <ExpandMore
                                      className={`${styles.catParentChevron} ${
                                        isOpen ? styles.catParentChevronOpen : ""
                                      }`}
                                    />
                                  ) : (
                                    <ChevronRight className={styles.catParentArrow} />
                                  )}
                                </button>

                                <AnimatePresence initial={false}>
                                  {hasKids && isOpen && (
                                    <motion.div
                                      className={styles.catChildrenWrap}
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={collapse}
                                    >
                                      <div className={styles.catChildren}>
                                        <button
                                          type="button"
                                          className={styles.catShopAll}
                                          onClick={() =>
                                            handleNavigate(
                                              `/products?category=${categoryParam(cat)}`
                                            )
                                          }
                                        >
                                          Shop all {cat.name || cat.title}
                                        </button>
                                        {renderDescendants(cat.id, 1)}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            className={styles.catViewAll}
                            onClick={() => handleNavigate("/products")}
                          >
                            View all products
                            <ChevronRight />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {dealsEnabled &&
                  renderPrimaryLink({
                    label: "Today's Deals",
                    to: "/special-offers",
                  })}
                {renderPrimaryLink({ label: "Our Story", to: "/about" })}
                {renderPrimaryLink({ label: "Support", to: "/support" })}
              </nav>

              {/* ---- Discover ---- */}
              <section className={styles.group} aria-labelledby="menu-discover">
                <h2 className={styles.groupLabel} id="menu-discover">
                  Discover
                </h2>
                {DISCOVER_LINKS.map((link) => renderMetaRow(link))}
              </section>

              {/* ---- Account ---- */}
              <section className={styles.group} aria-labelledby="menu-account">
                <h2 className={styles.groupLabel} id="menu-account">
                  Account
                </h2>
                {renderMetaRow({
                  label: "Profile",
                  to: "/profile",
                  Icon: PersonOutline,
                })}
                {renderMetaRow({
                  label: "Orders",
                  to: "/orders",
                  Icon: ShoppingBagOutlined,
                })}
                {renderMetaRow({
                  label: "Wishlist",
                  to: "/wishlist",
                  Icon: FavoriteBorder,
                })}
                {user &&
                  renderMetaRow({
                    label: "Sign out",
                    Icon: LogoutOutlined,
                    tone: "metaRowDanger",
                    onClick: handleLogout,
                  })}
              </section>

              {/* ---- Settings ---- */}
              <section className={styles.group}>
                <motion.button
                  type="button"
                  className={styles.metaRow}
                  onClick={() => setSettingsExpanded((prev) => !prev)}
                  aria-expanded={settingsExpanded}
                  {...nextRow()}
                >
                  <SettingsOutlined className={styles.metaIcon} aria-hidden="true" />
                  <span className={styles.metaLabel}>Settings</span>
                  <ExpandMore
                    className={`${styles.metaChevron} ${
                      settingsExpanded ? styles.metaChevronOpen : ""
                    }`}
                    aria-hidden="true"
                  />
                </motion.button>

                <AnimatePresence initial={false}>
                  {settingsExpanded && (
                    <motion.div
                      className={styles.subPanel}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={collapse}
                    >
                      <div className={styles.subInner}>
                        <button
                          type="button"
                          className={styles.metaRow}
                          onClick={toggleTheme}
                          role="switch"
                          aria-checked={isDarkMode}
                          aria-label="Dark mode"
                        >
                          {isDarkMode ? (
                            <DarkModeOutlined
                              className={styles.metaIcon}
                              aria-hidden="true"
                            />
                          ) : (
                            <LightModeOutlined
                              className={styles.metaIcon}
                              aria-hidden="true"
                            />
                          )}
                          <span className={styles.metaLabel}>Dark mode</span>
                          <span className={styles.toggleSwitch} aria-hidden="true">
                            <span
                              className={`${styles.toggleKnob} ${
                                isDarkMode ? styles.toggleKnobOn : ""
                              }`}
                            />
                          </span>
                        </button>

                        {renderMetaRow(
                          { label: "Help centre", to: "/help", Icon: HelpOutline },
                          false
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* ---- Promises: store-attested policies, kept in the menu ---- */}
              <TrustStrip className={styles.trust} />

              {/* ---- Legal ---- */}
              <div className={styles.footer}>
                <div className={styles.footerLinks}>
                  <button
                    type="button"
                    className={styles.footerLink}
                    onClick={() => handleNavigate("/terms")}
                  >
                    Terms of Service
                  </button>
                  <span className={styles.footerDot} aria-hidden="true" />
                  <button
                    type="button"
                    className={styles.footerLink}
                    onClick={() => handleNavigate("/privacy")}
                  >
                    Privacy Policy
                  </button>
                </div>
                <p className={styles.copyright}>
                  © {new Date().getFullYear()} {APP_NAME}
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SidebarMenu;
