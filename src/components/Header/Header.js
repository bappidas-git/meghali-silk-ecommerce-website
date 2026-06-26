import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../context/WishlistContext";
import { useDealsConfig } from "../../context/DealsConfigContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
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
  ShoppingCart,
  Menu as MenuIcon,
  AccountCircle,
  FavoriteBorder,
  Search as SearchIcon,
  AutoAwesome,
  Person,
  ListAlt,
  Favorite,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import styles from "./Header.module.css";

// The brand logo PNG ships with its own deep-green background, so it must always
// sit on a panel filled with that same green (var(--brand-logo-bg)).
const LOGO_SRC =
  "https://res.cloudinary.com/dn9gyaiik/image/upload/v1782451315/Logo_gpxble.png";

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
  // The "Today's Deals" chip is hidden when the admin turns the deals page off.
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

  // Subtle elevation once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${categoryParam(category)}`);
  };

  // Category quick-filter chips. Each maps to real data where possible, falling
  // back to a sensible /products query so a chip is never a dead link. "Mega
  // Silk" and "Bridal" bind to a matching category slug when the catalogue has
  // one; otherwise they fall back to a search query.
  const findCategory = (...needles) =>
    categories.find((c) => {
      const hay = `${c.name || ""} ${c.slug || ""}`.toLowerCase();
      return needles.some((n) => hay.includes(n));
    });

  const megaSilkCat = findCategory("mega silk", "silk");
  const bridalCat = findCategory("bridal", "wedding");

  const navChips = [
    { key: "new", label: "New Arrivals", to: "/products?sort=newest" },
    { key: "best", label: "Bestsellers", to: "/products?sort=popular" },
    { key: "sale", label: "Sale", to: "/products?sort=discount" },
    {
      key: "mega",
      label: "Mega Silk",
      category: megaSilkCat,
      to: megaSilkCat
        ? `/products?category=${categoryParam(megaSilkCat)}`
        : "/products?search=silk",
    },
    {
      key: "bridal",
      label: "Bridal",
      category: bridalCat,
      to: bridalCat
        ? `/products?category=${categoryParam(bridalCat)}`
        : "/products?search=bridal",
    },
    // Deals chip is hidden when the admin disables the deals page.
    ...(dealsEnabled
      ? [{ key: "deals", label: "Today's Deals", to: "/special-offers" }]
      : []),
  ];

  // A chip is active when the current route matches its path and every query
  // param the chip sets is present with the same value.
  const currentParams = new URLSearchParams(location.search);
  const isChipActive = (to) => {
    const [path, query] = to.split("?");
    if (location.pathname !== path) return false;
    if (!query) return location.search === "";
    const chipParams = new URLSearchParams(query);
    for (const [key, value] of chipParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  // Real-category chips route through the shared category handler (canonical
  // ?category= scheme); the rest navigate straight to their fallback query.
  const handleChipClick = (chip) => {
    if (chip.category) {
      handleCategoryClick(chip.category);
    } else {
      navigate(chip.to);
    }
  };

  return (
    <>
      <header
        className={`${styles.header} ${isDarkMode ? styles.dark : styles.light} ${
          scrolled ? styles.scrolled : ""
        }`}
      >
        {/* ===== ANNOUNCEMENT BAR (very top, cycling + dismissible) ===== */}
        <AnnouncementBar />

        {/* ===== TRUST STRIP (desktop/tablet) ===== */}
        {!isMobile && (
          <div className={styles.trustWrap}>
            <TrustStrip />
          </div>
        )}

        {/* ===== MAIN HEADER ROW ===== */}
        <div className={styles.mainHeader}>
          <div className={styles.mainHeaderInner}>
            {/* Hamburger (mobile) */}
            {isMobile && (
              <IconButton
                onClick={handleMobileMenuClick}
                className={styles.hamburger}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo — Cloudinary image on a deep-green panel */}
            <Link to="/" className={styles.logoLink} aria-label={APP_NAME}>
              <motion.div
                className={styles.logoPanel}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <img
                  className={styles.logoImg}
                  src={LOGO_SRC}
                  alt={APP_NAME}
                  width={isMobile ? 116 : 150}
                  height={isMobile ? 40 : 52}
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            </Link>

            {/* Search Bar (desktop/tablet) */}
            {!isMobile && (
              <div className={styles.searchWrap} role="search">
                <button
                  type="button"
                  className={styles.searchField}
                  onClick={handleSearchClick}
                  aria-label="Open search"
                >
                  <SearchIcon className={styles.searchFieldIcon} />
                  <span className={styles.searchPlaceholder}>
                    Search for silk sarees, suits, dupattas...
                  </span>
                </button>
                <button
                  type="button"
                  className={`sf-btn sf-btn--emerald sf-btn--sm ${styles.aiSearchBtn}`}
                  onClick={handleSearchClick}
                  aria-label="Open AI search"
                >
                  <AutoAwesome className={styles.aiSearchIcon} />
                  {!isTablet && <span>AI Search</span>}
                </button>
              </div>
            )}

            {/* Right actions */}
            <div className={styles.actions}>
              {/* Search icon (mobile) */}
              {isMobile && (
                <IconButton
                  onClick={handleSearchClick}
                  className={styles.actionIcon}
                  aria-label="Search"
                >
                  <SearchIcon />
                </IconButton>
              )}

              {/* Theme toggle (desktop/tablet) */}
              {!isMobile && (
                <IconButton
                  onClick={toggleTheme}
                  className={styles.actionIcon}
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              )}

              {/* Wishlist (desktop/tablet) */}
              {!isMobile && (
                <IconButton
                  onClick={() => navigate("/wishlist")}
                  className={styles.actionIcon}
                  aria-label="Wishlist"
                >
                  <Badge badgeContent={wishlistCount} max={99} className={styles.badge}>
                    <FavoriteBorder />
                  </Badge>
                </IconButton>
              )}

              {/* Cart */}
              <IconButton
                onClick={handleCartClick}
                className={styles.actionIcon}
                aria-label="Cart"
              >
                <Badge badgeContent={cartCount} max={99} className={styles.badge}>
                  <ShoppingCart />
                </Badge>
              </IconButton>

              {/* Account */}
              <IconButton
                onClick={handleUserMenuOpen}
                className={styles.actionIcon}
                aria-label="Account"
              >
                {isAuthenticated && user ? (
                  <Avatar className={styles.avatar} sx={{ width: 30, height: 30 }}>
                    {(user.firstName || user.name || "U").charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </div>
          </div>
        </div>

        {/* ===== CATEGORY NAV-CHIPS ROW (desktop/tablet) ===== */}
        {!isMobile && (
          <nav className={styles.chipsBar} aria-label="Category quick filters">
            <div className={styles.chipsInner}>
              {navChips.map((chip) => {
                const active = isChipActive(chip.to);
                return (
                  <button
                    key={chip.key}
                    type="button"
                    className={`sf-chip ${active ? "sf-chip--active" : ""} ${styles.chip}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => handleChipClick(chip)}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* ===== USER DROPDOWN MENU ===== */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        className={styles.userMenu}
        PaperProps={{
          className: `${styles.userMenuPaper} ${isDarkMode ? styles.dark : ""}`,
          elevation: 8,
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {isAuthenticated ? (
          [
            <div key="greeting" className={styles.menuGreeting}>
              <Avatar className={styles.menuAvatar} sx={{ width: 40, height: 40 }}>
                {(user?.firstName || user?.name || "U").charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Typography variant="subtitle2" className={styles.menuUserName}>
                  {user?.firstName || user?.name || "User"}
                </Typography>
                <Typography variant="caption" className={styles.menuUserEmail}>
                  {user?.email || ""}
                </Typography>
              </div>
            </div>,
            <Divider key="div1" />,
            <MenuItem key="profile" onClick={() => handleMenuNavigate("/profile")} className={styles.menuItem}>
              <Person fontSize="small" className={styles.menuItemIcon} />
              My Profile
            </MenuItem>,
            <MenuItem key="orders" onClick={() => handleMenuNavigate("/orders")} className={styles.menuItem}>
              <ListAlt fontSize="small" className={styles.menuItemIcon} />
              My Orders
            </MenuItem>,
            <MenuItem key="wishlist" onClick={() => handleMenuNavigate("/wishlist")} className={styles.menuItem}>
              <Favorite fontSize="small" className={styles.menuItemIcon} />
              My Wishlist
            </MenuItem>,
            <Divider key="div2" />,
            <MenuItem key="logout" onClick={handleLogout} className={`${styles.menuItem} ${styles.logoutItem}`}>
              <LogoutIcon fontSize="small" className={styles.menuItemIcon} />
              Logout
            </MenuItem>,
          ]
        ) : (
          [
            <MenuItem key="login" onClick={() => { handleUserMenuClose(); openAuthModal("login"); }} className={styles.menuItem}>
              <LoginIcon fontSize="small" className={styles.menuItemIcon} />
              Login
            </MenuItem>,
            <MenuItem key="register" onClick={() => { handleUserMenuClose(); openAuthModal("signup"); }} className={styles.menuItem}>
              <PersonAdd fontSize="small" className={styles.menuItemIcon} />
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
