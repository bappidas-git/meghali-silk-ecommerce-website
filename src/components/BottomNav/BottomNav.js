import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useTheme } from "../../context/ThemeContext";
import {
  HomeOutlined,
  Home,
  GridViewOutlined,
  GridView,
  Search as SearchIcon,
  FavoriteBorder,
  Favorite,
  PersonOutline,
  Person,
} from "@mui/icons-material";
import SearchModal from "../SearchModal/SearchModal";
import styles from "./BottomNav.module.css";

// Route-backed tabs use NavLink (active state handled by react-router); the
// Search tab keeps path: null and opens the SearchModal via a <button>.
const NAV_ITEMS = [
  { key: "home", label: "Home", Icon: HomeOutlined, IconActive: Home, path: "/" },
  {
    key: "categories",
    label: "Categories",
    Icon: GridViewOutlined,
    IconActive: GridView,
    path: "/products",
  },
  { key: "search", label: "Search", Icon: SearchIcon, IconActive: SearchIcon, path: null },
  {
    key: "wishlist",
    label: "Wishlist",
    Icon: FavoriteBorder,
    IconActive: Favorite,
    path: "/wishlist",
  },
  { key: "account", label: "Account", Icon: PersonOutline, IconActive: Person, path: "/profile" },
];

const BottomNav = () => {
  const { isDarkMode } = useTheme();
  const { getWishlistCount } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const wishlistCount = getWishlistCount();

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keep getActiveKey() route rules: /products and /products/... → categories,
  // /categories → categories, /account → account. NavLink's default matching is
  // exact for "/" and prefix otherwise, which already mirrors these rules; the
  // extra alias routes are covered by the `end`/className resolver below.
  const isCategoriesActive = (pathname) =>
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/categories";
  const isAccountActive = (pathname) =>
    pathname === "/profile" || pathname === "/account";

  const themeClass = isDarkMode ? styles.dark : styles.light;

  // Resolve active state honouring the getActiveKey() alias rules
  // (/products/... and /categories → Categories, /account → Account).
  const resolveActive = (item, isActive) =>
    item.key === "categories"
      ? isCategoriesActive(window.location.pathname)
      : item.key === "account"
      ? isAccountActive(window.location.pathname)
      : isActive;

  const linkClass = (item) => ({ isActive }) =>
    `${styles.navItem} ${resolveActive(item, isActive) ? styles.active : ""}`;

  const renderInner = (item, active) => {
    const Icon = active && item.IconActive ? item.IconActive : item.Icon;
    return (
      <>
        <span className={styles.iconWrap}>
          <Icon className={styles.icon} aria-hidden="true" />
          {item.key === "wishlist" && wishlistCount > 0 && (
            <span className={styles.badge}>
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </span>
        <span className={styles.label}>{item.label}</span>
      </>
    );
  };

  return (
    <>
      <nav
        className={`${styles.bottomNav} ${themeClass} ${
          visible ? styles.visible : styles.hidden
        }`}
        aria-label="Primary"
      >
        <div className={styles.navItems}>
          {NAV_ITEMS.map((item) => {
            // Search: a real <button> that opens the modal (not a route).
            if (item.key === "search") {
              const Icon = item.Icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.navItem} ${styles.center}`}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                >
                  <span className={styles.iconWrap}>
                    <Icon className={styles.icon} aria-hidden="true" />
                  </span>
                  <span className={styles.label}>{item.label}</span>
                </button>
              );
            }

            // Route tabs: NavLink handles active class + aria-current.
            return (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.key === "home"}
                className={linkClass(item)}
                aria-label={item.label}
              >
                {({ isActive }) => renderInner(item, resolveActive(item, isActive))}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default BottomNav;
