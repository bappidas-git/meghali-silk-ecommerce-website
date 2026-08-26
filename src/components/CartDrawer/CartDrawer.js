import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../context/ThemeContext";
import apiService from "../../services/api";
import {
  formatCurrency,
  productPath,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import { FREE_SHIPPING_THRESHOLD } from "../../utils/constants";
import { DURATION, INSTANT, overlay, panel, t, tween } from "../../theme/motion";
import styles from "./CartDrawer.module.css";

// Shipping shown while below the free threshold. Mirrors the Standard method's
// flatRate in db.json; the free-shipping cutoff itself comes from the shared
// FREE_SHIPPING_THRESHOLD constant (same source as Header + Checkout).
const FLAT_SHIPPING = 99;

// Tab-cycling needs the tray's own focusables. Links, buttons and the promo
// input are the lot; the panel itself is tabIndex={-1} and is excluded by the
// [tabindex="-1"] guard.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  const reduceMotion = useReducedMotion();
  const panelRef = useRef(null);
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

  // Header hands a fresh arrow function down on every one of its renders, so
  // the focus effect below reads onClose through a ref — depending on the prop
  // directly would tear the focus trap down and rebuild it mid-interaction.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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

  // Focus management: remember what opened the tray, move focus into the panel,
  // cycle Tab inside it while it is open, close on Escape, and hand focus back
  // to the opener (the masthead cart icon) on close.
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
      // The panel itself holds focus on open, so treat it as "outside" the
      // ring — the first Tab must land on the first control.
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

  const handleNavigate = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose]
  );

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

  // ---------------------------------------------------------------------------
  // MOTION — the tray slides in slowly on the editorial curve; reduced motion
  // trades the slide for a plain fade and drops every per-row offset.
  // ---------------------------------------------------------------------------
  // The tray used to arrive on a spring (damping 36 / stiffness 220); it is
  // the shared drawer tween now — in on the slow tier, out on the base one.
  const tray = panel(reduceMotion, "right");
  const panelVariants = {
    hidden: tray.initial,
    visible: tray.animate,
    exit: tray.exit,
  };

  const scrim = overlay(reduceMotion);

  // Rows arrive and leave quietly. Height collapses on exit so the list closes
  // the gap instead of jumping, and `opacity: 0` takes the row's hairline with
  // it — a border on a zero-height row would otherwise linger for a frame.
  const lineMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: INSTANT },
        exit: { opacity: 0, height: 0, transition: INSTANT },
      }
    : {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0, transition: tween(DURATION.base) },
        exit: {
          opacity: 0,
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          overflow: "hidden",
          transition: tween(DURATION.fast),
        },
      };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ===== Scrim — the token overlay, nothing more ===== */}
          <motion.div className={styles.scrim} {...scrim} onClick={onClose} />

          {/* ===== The tray ===== */}
          <motion.div
            ref={panelRef}
            className={`${styles.drawer} ${themeClass}`}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            tabIndex={-1}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ---- Masthead row ----------------------------------------- */}
            <div className={styles.header}>
              <div className={styles.heading}>
                <h2 className={styles.title}>Your Cart</h2>
                {cartCount > 0 && (
                  <span className={styles.count}>
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close cart"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {isEmpty ? (
              /* ---- Empty state ------------------------------------------ */
              <div className={styles.empty}>
                <svg
                  className={styles.emptyArt}
                  width="64"
                  height="72"
                  viewBox="0 0 64 72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 22h46l-3.6 42.2A4 4 0 0 1 47.4 68H16.6a4 4 0 0 1-4-3.8L9 22Z" />
                  <path d="M22 29V17a10 10 0 0 1 20 0v12" />
                  <line x1="9" y1="30" x2="55" y2="30" />
                </svg>
                <h3 className={styles.emptyTitle}>Your cart is empty</h3>
                <p className={styles.emptyText}>
                  Nothing chosen yet. The looms of Sualkuchi are waiting.
                </p>
                <button
                  type="button"
                  className="sf-btn sf-btn--outline-gold"
                  onClick={() => handleNavigate("/products")}
                >
                  Explore the collection
                </button>
              </div>
            ) : (
              <>
                {/* ---- Free-shipping meter — one hairline, one honest line */}
                <div className={styles.meter}>
                  <p className={styles.meterText}>
                    {amountToFreeShipping > 0 ? (
                      <>
                        <strong>{formatCurrency(amountToFreeShipping)}</strong>{" "}
                        away from complimentary shipping
                      </>
                    ) : (
                      "Complimentary shipping unlocked"
                    )}
                  </p>
                  <div
                    className={styles.meterTrack}
                    role="progressbar"
                    aria-label="Progress towards complimentary shipping"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(shippingProgress)}
                  >
                    <motion.div
                      className={styles.meterFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${shippingProgress}%` }}
                      transition={t(reduceMotion, DURATION.slow)}
                    />
                  </div>
                </div>

                {/* ---- Scroll region: lines + promo + summary ------------- */}
                <div className={styles.body}>
                  <ul className={styles.lines}>
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
                          <motion.li
                            key={item.id}
                            className={styles.line}
                            layout={!reduceMotion}
                            {...lineMotion}
                          >
                            {/* The thumbnail repeats the destination of the
                                name link beside it, so it is taken out of the
                                tab ring rather than doubling every stop. */}
                            <Link
                              to={productHref}
                              className={styles.thumb}
                              onClick={onClose}
                              tabIndex={-1}
                              aria-hidden="true"
                            >
                              <img
                                src={item.image || PLACEHOLDER_IMG}
                                alt=""
                                loading="lazy"
                                onError={onImageError}
                              />
                            </Link>

                            <div className={styles.lineBody}>
                              <Link
                                to={productHref}
                                className={styles.lineName}
                                onClick={onClose}
                              >
                                {item.name}
                              </Link>

                              {item.variantName && (
                                <span className={styles.lineVariant}>
                                  {item.variantName}
                                </span>
                              )}

                              <p className={styles.linePrice}>
                                <span className={styles.price}>
                                  {formatCurrency(item.price)}
                                </span>
                                {hasDiscount && (
                                  <span className={styles.compare}>
                                    {formatCurrency(item.comparePrice)}
                                  </span>
                                )}
                              </p>

                              <div className={styles.lineFoot}>
                                <div className={styles.stepper}>
                                  <button
                                    type="button"
                                    className={styles.stepperBtn}
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
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      aria-hidden="true"
                                    >
                                      <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                  </button>
                                  <span
                                    className={styles.stepperValue}
                                    aria-live="polite"
                                    aria-atomic="true"
                                  >
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className={styles.stepperBtn}
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
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      aria-hidden="true"
                                    >
                                      <line x1="12" y1="5" x2="12" y2="19" />
                                      <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  className={styles.removeBtn}
                                  onClick={() => handleRemoveItem(item.id)}
                                  aria-label={`Remove ${item.name}`}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>

                  {/* ---- Promo code -------------------------------------- */}
                  <div className={styles.promo}>
                    <h3 className={styles.eyebrow}>Promo code</h3>
                    {couponApplied ? (
                      <div className={styles.couponChip}>
                        <span className={styles.couponCode}>
                          {couponApplied.code}
                        </span>
                        <span className={styles.couponValue}>
                          &minus;{formatCurrency(couponDiscount)}
                        </span>
                        <button
                          type="button"
                          className={styles.couponRemove}
                          onClick={removeCoupon}
                          aria-label={`Remove coupon ${couponApplied.code}`}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className={styles.promoField}>
                        <input
                          type="text"
                          className={styles.promoInput}
                          placeholder="Enter code"
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
                          type="button"
                          className={styles.promoApply}
                          onClick={applyCoupon}
                          disabled={applying || !couponCode.trim()}
                        >
                          {applying ? "Applying" : "Apply"}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className={`${styles.promoMsg} ${styles.promoError}`}>
                        {couponError}
                      </p>
                    )}
                    {couponNote && (
                      <p className={styles.promoMsg}>{couponNote}</p>
                    )}
                  </div>

                  {/* ---- Summary ----------------------------------------- */}
                  <div className={styles.summary}>
                    <h3 className={styles.eyebrow}>Summary</h3>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Subtotal</span>
                      <span className={styles.summaryValue}>
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                    {totalSavings > 0 && (
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Savings</span>
                        <span
                          className={`${styles.summaryValue} ${styles.savings}`}
                        >
                          &minus;{formatCurrency(totalSavings)}
                        </span>
                      </div>
                    )}
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Shipping</span>
                      <span className={styles.summaryValue}>
                        {shippingCost === 0
                          ? "Free"
                          : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Total</span>
                      <span className={styles.totalValue}>
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ---- Pinned footer ------------------------------------- */}
                <div className={styles.footer}>
                  <button
                    type="button"
                    className="sf-btn sf-btn--emerald sf-btn--block"
                    onClick={() => handleNavigate("/checkout")}
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    type="button"
                    className={styles.continue}
                    onClick={onClose}
                  >
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
