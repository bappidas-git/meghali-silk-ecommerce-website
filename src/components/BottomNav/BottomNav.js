import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useTheme } from "../../context/ThemeContext";
import {
  HomeOutlined,
  GridViewOutlined,
  SearchOutlined,
  FavoriteBorder,
  PersonOutline,
} from "@mui/icons-material";
import SearchModal from "../SearchModal/SearchModal";
import styles from "./BottomNav.module.css";

// Thin-stroke outlined glyphs in BOTH states: the active tab is marked by ink
// type plus a gold dot under the label, not by a heavier icon. That keeps the
// bar reading as a hairline of the page rather than as a filled app dock, and
// it still passes "not by colour alone" — the dot is a shape difference, and
// NavLink stamps aria-current="page" on top of it.
//
// Route-backed tabs use NavLink; the Search tab keeps path: null and opens the
// SearchModal from a real <button>.
const NAV_ITEMS = [
  { key: "home", label: "Home", Icon: HomeOutlined, path: "/" },
  {
    key: "categories",
    label: "Categories",
    Icon: GridViewOutlined,
    path: "/products",
  },
  { key: "search", label: "Search", Icon: SearchOutlined, path: null },
  {
    key: "wishlist",
    label: "Wishlist",
    Icon: FavoriteBorder,
    path: "/wishlist",
  },
  { key: "account", label: "Account", Icon: PersonOutline, path: "/profile" },
];

const BottomNav = () => {
  const { isDarkMode } = useTheme();
  const { getWishlistCount } = useWishlist();
  const location = useLocation();
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

  // Keep the original getActiveKey() route rules: /products and /products/... →
  // categories, /categories → categories, /account → account. NavLink's default
  // matching is exact for "/" and prefix otherwise, which already mirrors these
  // rules; the extra alias routes are covered by the resolver below.
  const isCategoriesActive = (pathname) =>
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/categories";
  const isAccountActive = (pathname) =>
    pathname === "/profile" || pathname === "/account";

  const themeClass = isDarkMode ? styles.dark : styles.light;

  // Resolve active state honouring the alias rules above. Reads the router's
  // location (not window.location) so the class can never lag a navigation.
  const resolveActive = (item, isActive) =>
    item.key === "categories"
      ? isCategoriesActive(location.pathname)
      : item.key === "account"
      ? isAccountActive(location.pathname)
      : isActive;

  const linkClass = (item) => ({ isActive }) =>
    `${styles.navItem} ${resolveActive(item, isActive) ? styles.active : ""}`;

  const renderInner = (item) => {
    const Icon = item.Icon;
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
            // Search: a real <button> that opens the modal (not a route). It
            // marks itself active while the modal is up, so the bar always says
            // where you are.
            if (item.key === "search") {
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.navItem} ${
                    searchOpen ? styles.active : ""
                  }`}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  aria-haspopup="dialog"
                  aria-expanded={searchOpen}
                >
                  {renderInner(item)}
                </button>
              );
            }

            // Route tabs: NavLink handles the active class + aria-current.
            return (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.key === "home"}
                className={linkClass(item)}
                aria-label={
                  item.key === "wishlist"
                    ? `Wishlist, ${wishlistCount} ${
                        wishlistCount === 1 ? "item" : "items"
                      }`
                    : item.label
                }
              >
                {() => renderInner(item)}
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
