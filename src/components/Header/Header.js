import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../context/WishlistContext";
import { useDealsConfig } from "../../context/DealsConfigContext";
import apiService from "../../services/api";
import { categoryParam, getMainMenuCategories } from "../../utils/categories";
import { APP_NAME } from "../../utils/constants";
import AnnouncementBar from "../AnnouncementBar";
import TrustStrip from "../TrustStrip";
import CartDrawer from "../CartDrawer/CartDrawer";
import SidebarMenu from "../SidebarMenu/SidebarMenu";
import AuthModal from "../AuthModal/AuthModal";
import SearchModal from "../SearchModal/SearchModal";
import {
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  MenuOutlined,
  SearchOutlined,
  ShoppingBagOutlined,
  FavoriteBorder,
  PersonOutline,
  DarkModeOutlined,
  LightModeOutlined,
  ListAltOutlined,
  LogoutOutlined,
  LoginOutlined,
  PersonAddAltOutlined,
} from "@mui/icons-material";
import styles from "./Header.module.css";

// The wordmark is gold on a TRANSPARENT ground, so it sits directly on the ivory
// masthead — there is no logo panel any more. This is byte-for-byte the URL that
// index.html preloads for the splash screen, so the masthead paints from cache
// with no second request. Intrinsic art is 1454×454; the w_520 transform is
// 520×162, ~3.7× the 44px render height, so it stays crisp on retina.
const LOGO_SRC =
  "https://res.cloudinary.com/v8vrixwq/image/upload/f_auto,q_auto,w_520/v1787592407/meghali-silk-logo.png";
const LOGO_W = 520;
const LOGO_H = 162;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    user,
    isAuthenticated,
    logout,
    authModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
  } = useAuth();
  const { getCartItemCount, isCartOpen, setIsCartOpen } = useCart();
  const { getWishlistCount } = useWishlist();
  // The "Today's Deals" link is hidden when the admin turns the deals page off.
  const { enabled: dealsEnabled } = useDealsConfig();
  const isMobile = useMediaQuery("(max-width:768px)");
  const isTablet = useMediaQuery("(max-width:1024px)");

  // Live badge counts (context exposes getters, not raw values)
  const cartCount = getCartItemCount();
  const wishlistCount = getWishlistCount();

  const [categories, setCategories] = useState([]);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Key of the nav entry whose collection panel is showing (hover or focus).
  const [openCollection, setOpenCollection] = useState(null);

  // Fetch categories on mount. Also refetch when the tab regains focus so any
  // change the admin makes (toggling a category into the main menu, reordering
  // it, activating/deactivating it) shows up on the storefront without a hard
  // reload — the menu is fully API-driven from the same categories source the
  // admin edits.
  useEffect(() => {
    let active = true;
    const fetchCategories = async () => {
      try {
        const data = await apiService.categories.getAll();
        if (active) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
    const onFocus = () => fetchCategories();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Subtle hairline/elevation change once the page is scrolled. The masthead
  // never changes height, so nothing under it shifts.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any route change closes an open collection panel.
  useEffect(() => {
    setOpenCollection(null);
  }, [location.pathname, location.search]);

  const handleUserMenuOpen = (e) => {
    if (isAuthenticated) {
      setUserMenuAnchor(e.currentTarget);
    } else {
      openAuthModal("login");
    }
  };

  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleMenuNavigate = (path) => {
    handleUserMenuClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate("/");
  };

  const handleCartClick = () => setIsCartOpen(true);
  const handleSearchClick = () => setSearchModalOpen(true);
  const handleMobileMenuClick = () => setSidebarOpen(true);

  // ---------------------------------------------------------------------------
  // PRIMARY NAV
  // ---------------------------------------------------------------------------
  // Two groups on one hairline row: the admin-curated main-menu categories
  // (API-driven, in `menuOrder`), then the curated editorial links.
  //
  // The old "Mega Silk" / "Bridal" chips bound themselves to a live category by
  // regex with a ?search= fallback. The reseeded Assamese catalogue promotes
  // those very collections — Mekhela Chador and Bridal & Occasion — into the
  // main menu proper, so the regex slots are retired rather than rendered twice.
  const mainMenuCategories = useMemo(
    () => getMainMenuCategories(categories),
    [categories]
  );

  // Children of a main-menu category, for its collection panel. Ordered the way
  // the rest of the app orders siblings: sortOrder, then name.
  const childrenOf = useCallback(
    (parentId) =>
      categories
        .filter(
          (c) => String(c.parentId) === String(parentId) && c.isActive !== false
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            String(a.name).localeCompare(String(b.name))
        ),
    [categories]
  );

  const categoryLinks = useMemo(
    () =>
      mainMenuCategories.map((cat) => ({
        key: `cat-${cat.id}`,
        label: cat.name,
        to: `/products?category=${categoryParam(cat)}`,
        children: childrenOf(cat.id),
      })),
    [mainMenuCategories, childrenOf]
  );

  const editorialLinks = [
    { key: "new", label: "New Arrivals", to: "/products?sort=newest" },
    { key: "best", label: "Bestsellers", to: "/products?sort=popular" },
    { key: "sale", label: "Sale", to: "/products?sort=discount" },
    // Deals link is hidden when the admin disables the deals page.
    ...(dealsEnabled
      ? [{ key: "deals", label: "Today's Deals", to: "/special-offers" }]
      : []),
  ];

  // A link is active when the current route matches its path and every query
  // param the link sets is present with the same value.
  const currentParams = new URLSearchParams(location.search);
  const isLinkActive = (to) => {
    const [path, query] = to.split("?");
    if (location.pathname !== path) return false;
    if (!query) return location.search === "";
    const linkParams = new URLSearchParams(query);
    for (const [key, value] of linkParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  const openPanelFor = (item) =>
    setOpenCollection(item.children && item.children.length ? item.key : null);

  // Close the panel when focus leaves the nav entirely (a keyboard user tabbing
  // past it), but not while focus moves between a trigger and the panel links.
  const handleNavBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setOpenCollection(null);
  };

  const handleNavKeyDown = (e) => {
    if (e.key === "Escape") setOpenCollection(null);
  };

  // Collection panel — a hairline drawer of one category's sub-collections.
  // It lives INSIDE its trigger's <li> so its links follow the trigger in the
  // tab order (as a sibling of the whole list they were visually adjacent but
  // eight links away from the keyboard, i.e. unreachable). It still positions
  // against .navBar, so it spans the full band and never needs measuring.
  const renderCollectionPanel = (item) => (
    <div
      className={styles.collectionPanel}
      role="group"
      aria-label={`${item.label} collections`}
    >
      <div className={styles.collectionInner}>
        <div className={styles.collectionHead}>
          <span className={styles.collectionEyebrow}>{item.label}</span>
          <Link
            to={item.to}
            className={styles.collectionAll}
            aria-label={`View all ${item.label}`}
            onClick={() => setOpenCollection(null)}
          >
            View all
          </Link>
        </div>
        <ul className={styles.collectionList}>
          {item.children.map((child) => (
            <li key={child.id}>
              <Link
                to={`/products?category=${categoryParam(child)}`}
                className={styles.collectionLink}
                onClick={() => setOpenCollection(null)}
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderNavLink = (item) => {
    const active = isLinkActive(item.to);
    const hasPanel = Boolean(item.children && item.children.length);
    const expanded = hasPanel && openCollection === item.key;
    return (
      <li
        key={item.key}
        className={styles.navItem}
        onMouseEnter={() => openPanelFor(item)}
      >
        <Link
          to={item.to}
          className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
          aria-current={active ? "page" : undefined}
          aria-expanded={hasPanel ? expanded : undefined}
          onFocus={() => openPanelFor(item)}
          onClick={() => setOpenCollection(null)}
        >
          {item.label}
        </Link>
        {expanded && renderCollectionPanel(item)}
      </li>
    );
  };

  return (
    <>
      {/* ===== UTILITY LINE =================================================
          Rendered in normal flow ABOVE the sticky header, so it scrolls away
          and the pinned masthead + nav stay inside their ~120px budget. */}
      <AnnouncementBar />

      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        {/* ===== MASTHEAD ===== */}
        <div className={styles.masthead}>
          <div className={styles.mastheadInner}>
            {/* Hamburger (mobile) */}
            {isMobile && (
              <IconButton
                onClick={handleMobileMenuClick}
                className={styles.actionIcon}
                aria-label="Open menu"
              >
                <MenuOutlined />
              </IconButton>
            )}

            {/* Wordmark — transparent-ground artwork straight on the ivory. */}
            <Link to="/" className={styles.logoLink} aria-label={APP_NAME}>
              <img
                className={styles.logoImg}
                src={LOGO_SRC}
                alt={APP_NAME}
                width={LOGO_W}
                height={LOGO_H}
                loading="eager"
                decoding="async"
              />
            </Link>

            {/* Right actions */}
            <div className={styles.actions}>
              {/* Search — ONE honest affordance opening the search modal. */}
              {isMobile ? (
                <IconButton
                  onClick={handleSearchClick}
                  className={styles.actionIcon}
                  aria-label="Search"
                >
                  <SearchOutlined />
                </IconButton>
              ) : (
                <button
                  type="button"
                  className={styles.searchTrigger}
                  onClick={handleSearchClick}
                  aria-label="Search"
                >
                  <SearchOutlined
                    className={styles.searchTriggerIcon}
                    aria-hidden="true"
                  />
                  {!isTablet && (
                    <span className={styles.searchTriggerLabel}>Search</span>
                  )}
                </button>
              )}

              {/* Theme toggle (desktop/tablet) */}
              {!isMobile && (
                <IconButton
                  onClick={toggleTheme}
                  className={styles.actionIcon}
                  aria-label={
                    isDarkMode ? "Switch to light theme" : "Switch to dark theme"
                  }
                >
                  {isDarkMode ? <LightModeOutlined /> : <DarkModeOutlined />}
                </IconButton>
              )}

              {/* Wishlist (desktop/tablet) */}
              {!isMobile && (
                <IconButton
                  onClick={() => navigate("/wishlist")}
                  className={styles.actionIcon}
                  aria-label={`Wishlist, ${wishlistCount} ${
                    wishlistCount === 1 ? "item" : "items"
                  }`}
                >
                  <Badge
                    badgeContent={wishlistCount}
                    max={99}
                    className={styles.badge}
                  >
                    <FavoriteBorder />
                  </Badge>
                </IconButton>
              )}

              {/* Cart */}
              <IconButton
                onClick={handleCartClick}
                className={styles.actionIcon}
                aria-label={`Cart, ${cartCount} ${
                  cartCount === 1 ? "item" : "items"
                }`}
              >
                <Badge
                  badgeContent={cartCount}
                  max={99}
                  className={styles.badge}
                >
                  <ShoppingBagOutlined />
                </Badge>
              </IconButton>

              {/* Account */}
              <IconButton
                onClick={handleUserMenuOpen}
                className={styles.actionIcon}
                aria-label={isAuthenticated ? "Account menu" : "Log in"}
                aria-haspopup={isAuthenticated ? "menu" : undefined}
              >
                {isAuthenticated && user ? (
                  <Avatar
                    className={styles.avatar}
                    sx={{ width: 28, height: 28 }}
                  >
                    {(user.firstName || user.name || "U").charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <PersonOutline />
                )}
              </IconButton>
            </div>
          </div>
        </div>

        {/* ===== PRIMARY NAV (desktop/tablet), under a 1px hairline ===== */}
        {!isMobile && (
          <nav
            className={styles.navBar}
            /* Not "Primary" — BottomNav already claims that label, and two nav
               landmarks with the same name are indistinguishable to a screen
               reader running the landmark list. */
            aria-label="Shop"
            onMouseLeave={() => setOpenCollection(null)}
            onBlur={handleNavBlur}
            onKeyDown={handleNavKeyDown}
          >
            <div className={styles.navInner}>
              <ul className={styles.navList}>
                {categoryLinks.map(renderNavLink)}
                {categoryLinks.length > 0 && editorialLinks.length > 0 && (
                  <li className={styles.navSep} role="presentation" />
                )}
                {editorialLinks.map(renderNavLink)}
              </ul>
            </div>
          </nav>
        )}
      </header>

      {/* ===== PROMISES LINE ================================================
          Store-attested policies. Deliberately OUTSIDE the sticky header — it
          used to pin, which pushed the pinned chrome past its height budget —
          so it caps the top of the page and then scrolls away. */}
      {!isMobile && (
        <div className={styles.promises}>
          <TrustStrip />
        </div>
      )}

      {/* ===== USER DROPDOWN MENU ===== */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        className={styles.userMenu}
        PaperProps={{
          className: styles.userMenuPaper,
          elevation: 0,
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {isAuthenticated ? (
          [
            <div key="greeting" className={styles.menuGreeting}>
              <Avatar className={styles.menuAvatar} sx={{ width: 36, height: 36 }}>
                {(user?.firstName || user?.name || "U").charAt(0).toUpperCase()}
              </Avatar>
              <div className={styles.menuIdentity}>
                <Typography variant="subtitle2" className={styles.menuUserName}>
                  {user?.firstName || user?.name || "User"}
                </Typography>
                <Typography variant="caption" className={styles.menuUserEmail}>
                  {user?.email || ""}
                </Typography>
              </div>
            </div>,
            <Divider key="div1" className={styles.menuDivider} />,
            <MenuItem key="profile" onClick={() => handleMenuNavigate("/profile")} className={styles.menuItem}>
              <PersonOutline fontSize="small" className={styles.menuItemIcon} />
              My Profile
            </MenuItem>,
            <MenuItem key="orders" onClick={() => handleMenuNavigate("/orders")} className={styles.menuItem}>
              <ListAltOutlined fontSize="small" className={styles.menuItemIcon} />
              My Orders
            </MenuItem>,
            <MenuItem key="wishlist" onClick={() => handleMenuNavigate("/wishlist")} className={styles.menuItem}>
              <FavoriteBorder fontSize="small" className={styles.menuItemIcon} />
              My Wishlist
            </MenuItem>,
            <Divider key="div2" className={styles.menuDivider} />,
            <MenuItem key="logout" onClick={handleLogout} className={`${styles.menuItem} ${styles.logoutItem}`}>
              <LogoutOutlined fontSize="small" className={styles.menuItemIcon} />
              Logout
            </MenuItem>,
          ]
        ) : (
          [
            <MenuItem key="login" onClick={() => { handleUserMenuClose(); openAuthModal("login"); }} className={styles.menuItem}>
              <LoginOutlined fontSize="small" className={styles.menuItemIcon} />
              Login
            </MenuItem>,
            <MenuItem key="register" onClick={() => { handleUserMenuClose(); openAuthModal("signup"); }} className={styles.menuItem}>
              <PersonAddAltOutlined fontSize="small" className={styles.menuItemIcon} />
              Register
            </MenuItem>,
          ]
        )}
      </Menu>

      {/* ===== MODALS & DRAWERS ===== */}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SidebarMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAuth={() => openAuthModal("login")}
      />
      <AuthModal open={authModalOpen} onClose={closeAuthModal} defaultTab={authModalTab} />
      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};

export default Header;
