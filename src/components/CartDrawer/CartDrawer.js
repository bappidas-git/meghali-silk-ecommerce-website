import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../context/ThemeContext";
import apiService from "../../services/api";
import {
  formatCurrency,
  truncateText,
  productPath,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import { FREE_SHIPPING_THRESHOLD } from "../../utils/constants";
import styles from "./CartDrawer.module.css";

// Shipping shown while below the free threshold. Mirrors the Standard method's
// flatRate in db.json; the free-shipping cutoff itself comes from the shared
// FREE_SHIPPING_THRESHOLD constant (same source as Header + Checkout).
const FLAT_SHIPPING = 99;

// Discount for an applied coupon at the current subtotal. Derived (never
// stored), so qty changes can't leave a stale amount and re-applying a coupon
// can't stack. Mirrors Checkout's couponDiscountFor so the drawer and Checkout
// always agree on the number.
const couponDiscountFor = (coupon, amount) => {
  if (!coupon) return 0;
  const raw =
    coupon.type === "percentage"
      ? Math.round((amount * coupon.value) / 100)
      : coupon.value;
  const cap = coupon.maxDiscount || Infinity;
  return Math.max(0, Math.min(raw, cap, amount));
};

const CartDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartItemCount,
  } = useCart();

  const cart = useMemo(() => cartItems || [], [cartItems]);
  const cartCount = getCartItemCount ? getCartItemCount() : 0;
  const cartTotal = getCartTotal ? getCartTotal() : 0;

  // ---- Promo code state ----------------------------------------------------
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponNote, setCouponNote] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [applying, setApplying] = useState(false);

  // Discount derived from the applied coupon and the *current* subtotal.
  const couponDiscount = couponDiscountFor(couponApplied, cartTotal);

  // Line savings = summed (comparePrice − price) across items, computed only
  // from real comparePrice values (never fabricated).
  const lineSavings = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const cp = Number(item.comparePrice) || 0;
        return cp > item.price
          ? sum + (cp - item.price) * item.quantity
          : sum;
      }, 0),
    [cart]
  );

  const totalSavings = couponDiscount + lineSavings;

  const shippingCost = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const shippingProgress = Math.min(
    100,
    (cartTotal / FREE_SHIPPING_THRESHOLD) * 100
  );
  const grandTotal = cartTotal - couponDiscount + shippingCost;

  // Lock body scroll while the drawer is open so the page behind it can't move.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // A coupon only stays applied while the cart still meets its minimum — drop
  // it (with a note) if the subtotal falls below, mirroring Checkout.
  useEffect(() => {
    if (couponApplied && cartTotal < (couponApplied.minOrderAmount || 0)) {
      const code = couponApplied.code;
      const min = couponApplied.minOrderAmount;
      setCouponApplied(null);
      setCouponCode("");
      setCouponError("");
      setCouponNote(
        `${code} was removed — it needs a minimum order of ${formatCurrency(
          min
        )}.`
      );
    }
  }, [cartTotal, couponApplied]);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const applyCoupon = async () => {
    setCouponError("");
    setCouponNote("");
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    setApplying(true);
    try {
      const coupon = await apiService.coupons.validate(code, cartTotal);
      setCouponApplied(coupon);
      setCouponError("");
    } catch (e) {
      setCouponApplied(null);
      setCouponError(e.message || "Invalid coupon");
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
    setCouponNote("");
  };

  const themeClass = isDarkMode ? styles.dark : styles.light;
  const isEmpty = cart.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            className={`${styles.drawer} ${themeClass}`}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.title}>
                Shopping Cart
                {cartCount > 0 && (
                  <span className={styles.itemCount}>{cartCount}</span>
                )}
              </h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close cart"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {isEmpty ? (
              /* ---- Empty state -------------------------------------------- */
              <div className={styles.emptyState}>
                <motion.div
                  className={styles.emptyStateInner}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <svg
                    className={styles.emptyIcon}
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <h3 className={styles.emptyTitle}>Your cart is empty</h3>
                  <p className={styles.emptyText}>
                    Browse our handloom silk collections to get started.
                  </p>
                  <button
                    className={styles.shopBtn}
                    onClick={() => handleNavigate("/products")}
                  >
                    Shop
                  </button>
                </motion.div>
              </div>
            ) : (
              <>
                {/* Free shipping progress bar */}
                <div className={styles.shippingBanner}>
                  {amountToFreeShipping > 0 ? (
                    <p className={styles.shippingText}>
                      Add{" "}
                      <strong>{formatCurrency(amountToFreeShipping)}</strong>{" "}
                      more for <strong>FREE shipping</strong>
                    </p>
                  ) : (
                    <p className={styles.shippingText}>
                      <svg
                        className={styles.checkIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      You've unlocked <strong>FREE shipping!</strong>
                    </p>
                  )}
                  <div className={styles.progressBarTrack}>
                    <motion.div
                      className={styles.progressBarFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${shippingProgress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Scrollable body: items + promo + price details */}
                <div className={styles.body}>
                  <div className={styles.itemsContainer}>
                    <AnimatePresence initial={false}>
                      {cart.map((item) => {
                        const hasDiscount =
                          Number(item.comparePrice) > item.price;
                        const atStockLimit =
                          typeof item.stock === "number" &&
                          item.stock > 0 &&
                          item.quantity >= item.stock;
                        const productHref = productPath(item);

                        return (
                          <motion.div
                            key={item.id}
                            className={styles.cartItem}
                            layout
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                              opacity: 0,
                              x: -40,
                              height: 0,
                              marginBottom: 0,
                              padding: 0,
                              overflow: "hidden",
                            }}
                            transition={{ duration: 0.25 }}
                          >
                            <div
                              className={styles.itemImage}
                              onClick={() => handleNavigate(productHref)}
                            >
                              <img
                                src={item.image || PLACEHOLDER_IMG}
                                alt={item.name}
                                loading="lazy"
                                onError={onImageError}
                              />
                            </div>

                            <div className={styles.itemDetails}>
                              <div className={styles.itemTop}>
                                <div className={styles.itemMeta}>
                                  <h4
                                    className={styles.itemName}
                                    onClick={() => handleNavigate(productHref)}
                                  >
                                    {truncateText(item.name, 45)}
                                  </h4>
                                  {item.variantName && (
                                    <span className={styles.itemVariant}>
                                      {item.variantName}
                                    </span>
                                  )}
                                </div>
                                <button
                                  className={styles.removeBtn}
                                  onClick={() => handleRemoveItem(item.id)}
                                  aria-label="Remove item"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                </button>
                              </div>

                              <div className={styles.itemPricing}>
                                <span className={styles.itemPrice}>
                                  {formatCurrency(item.price)}
                                </span>
                                {hasDiscount && (
                                  <span className={styles.itemComparePrice}>
                                    {formatCurrency(item.comparePrice)}
                                  </span>
                                )}
                              </div>

                              <div className={styles.quantityControl}>
                                <button
                                  className={styles.quantityBtn}
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  aria-label="Decrease quantity"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                </button>
                                <span className={styles.quantityValue}>
                                  {item.quantity}
                                </span>
                                <button
                                  className={styles.quantityBtn}
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  disabled={atStockLimit}
                                  title={
                                    atStockLimit
                                      ? "No more stock available"
                                      : undefined
                                  }
                                  aria-label="Increase quantity"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Apply Promo Code */}
                  <div className={styles.promoSection}>
                    <h3 className={styles.sectionTitle}>Apply Promo Code</h3>
                    {couponApplied ? (
                      <div className={styles.couponApplied}>
                        <span className={styles.couponAppliedText}>
                          &#10003; {couponApplied.code} applied &minus;
                          {formatCurrency(couponDiscount)}
                        </span>
                        <button
                          className={styles.couponRemove}
                          onClick={removeCoupon}
                          aria-label="Remove coupon"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className={styles.promoForm}>
                        <input
                          type="text"
                          className={styles.promoInput}
                          placeholder="Enter promo code"
                          value={couponCode}
                          aria-label="Promo code"
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                            setCouponNote("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") applyCoupon();
                          }}
                        />
                        <button
                          className={styles.promoApplyBtn}
                          onClick={applyCoupon}
                          disabled={applying || !couponCode.trim()}
                        >
                          {applying ? "…" : "Apply"}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className={styles.promoError}>{couponError}</p>
                    )}
                    {couponNote && (
                      <p className={styles.promoNote}>{couponNote}</p>
                    )}
                  </div>

                  {/* Price Details */}
                  <div className={styles.priceDetails}>
                    <h3 className={styles.sectionTitle}>Price Details</h3>
                    <div className={styles.priceRow}>
                      <span className={styles.priceLabel}>Subtotal</span>
                      <span className={styles.priceValue}>
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                    {totalSavings > 0 && (
                      <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Savings</span>
                        <span className={styles.savingsValue}>
                          &minus;{formatCurrency(totalSavings)}
                        </span>
                      </div>
                    )}
                    <div className={styles.priceRow}>
                      <span className={styles.priceLabel}>Shipping</span>
                      <span
                        className={
                          shippingCost === 0
                            ? styles.freeShipping
                            : styles.priceValue
                        }
                      >
                        {shippingCost === 0
                          ? "FREE"
                          : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    <div className={`${styles.priceRow} ${styles.totalRow}`}>
                      <span className={styles.totalLabel}>Total</span>
                      <span className={styles.totalValue}>
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sticky footer CTA */}
                <div className={styles.footer}>
                  <button
                    className={styles.checkoutBtn}
                    onClick={() => handleNavigate("/checkout")}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
